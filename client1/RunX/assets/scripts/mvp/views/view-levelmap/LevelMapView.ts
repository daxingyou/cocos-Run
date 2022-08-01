/**
 * 张海洋
 * 2021.4.26
 * 关卡 地图主界面
 */

import { CustomDialogId, SCENE_NAME } from "../../../app/AppConst";
import { LESSON_TYPE, PVE_MODE } from "../../../app/AppEnums";
import { utils } from "../../../app/AppUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { hangUpEvent, lvMapViewEvent } from "../../../common/event/EventData";
import { logger } from "../../../common/log/Logger";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { gamesvr } from "../../../network/lib/protocol";
import { VIEW_NAME } from "../../../app/AppConst";
import { bagData } from "../../models/BagData";
import { pveData } from "../../models/PveData";
import { configUtils } from "../../../app/ConfigUtils";
import { cfg } from "../../../config/config";
import { PveConfig } from "../../../app/AppType";
import { pveDataOpt } from "../../operations/PveDataOpt";
import { userData } from "../../models/UserData";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { ItemLevelMapLessonPool, ItemLevelMapMoveRolePool, ItemLevelMapRoadLinePool } from "../../../common/res-manager/NodePool";
import guiManager from "../../../common/GUIManager";
import { localStorageMgr, SAVE_TAG } from "../../../common/LocalStorageManager";
import { preloadItemLevelMapLessonPool, preloadItemLevelMapMoveRolePool, preloadItemLevelMapRoadLinePool, preloadItemModelSpinePool } from "../../../common/res-manager/Preloaders";
import ItemLevelMapLesson from "./ItemLevelMapLesson";
import ItemLevelMapMoveRole from "./ItemLevelMapMoveRole";
import LevelMapLessonInfo from "./LevelMapLessonInfo";
import ItemLevelMapRoadLine from "./ItemLevelMapRoadLine";
import LevelMapStageReward from "./LevelMapStageReward";
import StepWork from "../../../common/step-work/StepWork";
import ItemRedDot from "../view-item/ItemRedDot";
import { RED_DOT_MODULE } from "../../../common/RedDotManager";
import ItemHangupIcon from "../view-item/ItemHangupIcon";

export const enum LESSON_STATE {
    PASS,
    UNLOCK,
    LOCK
}

// 英雄朝向
export const enum MODEL_FORWARD {
    NULL,
    LEFT = 1,
    RIGHT
}

export interface MOVE_END_INFO {
    endPos: cc.Vec2;
    endForward: MODEL_FORWARD;
}

export interface ROLE_MOVE_INFO extends MOVE_END_INFO {
    movingForward?: MODEL_FORWARD;
    movingCenter?: cc.Vec2;
    distance?: number;
}

const enum ENTER_CONDITION {
    LEVEL = 1,
}

export const enum LESSON_ROAD_TYPE {
    MAIN,
    ACCESS
}

const RIGHT_INFO_WIDTH: number = 700;
const MAX_INIT_COUNT: number = 10;

const { ccclass, property } = cc._decorator;

@ccclass
export default class LevelMapView extends ViewBaseComponent {
    @property(cc.Node)          enterConditionNode: cc.Node = null;
    @property(cc.Label)         enterConditionLb: cc.Label = null;
    @property(cc.Label)         costPhysicalLb: cc.Label = null;
    @property(cc.Sprite)        costItemSp: cc.Sprite = null;
    @property(cc.ScrollView)    mapScroll: cc.ScrollView = null;
    @property(cc.Node)          startBtn: cc.Node = null;
    @property(cc.Node)          linesParent: cc.Node = null;
    @property(cc.Node)          lessonsParent: cc.Node = null;
    @property(cc.Node)          roleParent: cc.Node = null;
    @property(LevelMapLessonInfo)   lessonInfo: LevelMapLessonInfo = null;
    @property(LevelMapStageReward)  stageReward: LevelMapStageReward = null;
    @property(cc.Node)          isPassed: cc.Node = null;
    @property(ItemRedDot)       chaptersRedot: ItemRedDot = null;
    @property(ItemHangupIcon)   hangUp: ItemHangupIcon = null;

    private _curChapter: number = -1;                            // 当前章节
    private _curLesson: number = -1;                            // 当前选择关卡
    private _spriteLoader = new SpriteLoader();

    onInit(moduleId:number) {
        this.addEvent();

        this.stepWork
        .concact(preloadItemLevelMapRoadLinePool())
        .concact(preloadItemModelSpinePool())
        .concact(preloadItemLevelMapLessonPool())
        .concact(preloadItemLevelMapMoveRolePool())
        .concact(new StepWork().addTask(() => {
            this.updateCurChapter(pveData.getCurrChapterId());
            this._updateRedots();
        }))
        guiManager.addCoinNode(this.node, moduleId);

        this._initCommonView();
    }

    onRefresh() {
        if(!pveData.isRefreshLevelMap) return;
        pveData.isRefreshLevelMap = false;
        const chapter = pveData.getCurrChapterId();
        let isJumpToNextChapter = false;
        if(pveData.lastPassLessonId > 0) {
            const lastPassCfg = configUtils.getLessonConfig(pveData.lastPassLessonId);
            isJumpToNextChapter = pveData.checkIsMainRoad(lastPassCfg.LessonId) && lastPassCfg.LessonChapter != chapter;
        }
        if(isJumpToNextChapter) {
            this.mapScroll.scrollToPercentHorizontal(0, 0);
            this.updateCurChapter(chapter);
        } else {
            const lesson = this._getCurLessonId();
            // if (this._curLesson != lesson) {
            //     this.mapScroll.scrollToPercentHorizontal(0, 0);
            // }
            this.updateCurLesson(lesson);
            this._refreshRoadLinesView();
            this._refreshLessonItemsView();
        }
        this._updateRedots();
        this.hangUp.onRefresh();
        this.stageReward.refreshView();
    }
    /**
     * 注册刷新关卡奖励信息界面的刷新
     */
    addEvent() {
        eventCenter.register(lvMapViewEvent.ENTER_PVE_RES, this, this._receiveEnterPveRes);
        eventCenter.register(hangUpEvent.HANGUP_REWARD_RES, this, this._updateHangup);
        this.mapScroll.node.on('scrolling', this._onScrolling, this);
    }

    onRelease() {
        pveData.isRefreshLevelMap = false;
        //this.chaptersRedot.deInit();
        guiManager.removeCoinNode(this.node);
        eventCenter.unregisterAll(this);
        this.unscheduleAllCallbacks();
        this._spriteLoader.release();
        this.lessonInfo.deInit();
        this.stageReward.deInit();
        this.releaseSubView();
        this._releaseRoadLines();
        this._releaseLessons();
        this._releaseMoveRole();
    }

    updateCurChapter(chapter: number, isInit: boolean = false) {
        if(chapter != this._curChapter || isInit) {
            if(!isInit) {
                pveData.resetLastPassId();
            }
            this.mapScroll.scrollToPercentHorizontal(0, 0);
            this._curChapter = chapter;
            this._initMapView();
            const curLessonId = this._getCurLessonId();
            this.updateCurLesson(curLessonId);
        }
    }

    private _updateRedots(){
        //this.chaptersRedot.setData(RED_DOT_MODULE.LEVEL_MAP_CHAPTER_LIST);
    }

    updateCurLesson(lesson: number, isMoving: boolean = false) {
        let preLessonId: number = this._curLesson;
        this._curLesson = lesson;
        this.enterConditionNode.active = false;
        if(isMoving) {
            if(this._curLesson != preLessonId) {
                this._moveToTargetLesson(preLessonId);
            }
            // 更新右边展示
        } else {
            this.scheduleOnce(() => {
                this._refreshMoveRoleView();
            }, 0.1);
        }

        if (preLessonId != this._curLesson) {
            this._refreshLessonInfo();
            this.scheduleOnce(() => {
                this._scrollToTargetPosition();
            }, 0.1);
        }

        this.scheduleOnce(() => {
            this._refreshEnterConditionView();
        }, 0.1);
    }

    private _initCommonView() {
        this.stageReward.init(() => {}, this._loadView.bind(this));
        this.mapScroll.node.width = cc.winSize.width;
        this.mapScroll.node.height = cc.winSize.height;
        this.mapScroll.node.x = -cc.winSize.width/2;

        this.roleParent.setPosition(cc.v2(0, -cc.winSize.height + 40));
        this.linesParent.setPosition(cc.v2(0, -cc.winSize.height + 40));
        this.lessonsParent.setPosition(cc.v2(0, -cc.winSize.height + 40));
        this.hangUp.onRefresh();
    }

    private _initMapView() {
        const lessonConfigs = this._getLessonsConfigs();
        if(lessonConfigs) {
            const lastLessonCfg = this._getLastLessonCfg(lessonConfigs);
            this._updateContentSize(lastLessonCfg);
            this._refreshRoadLinesView(lessonConfigs);
            this._refreshLessonItemsView(lessonConfigs);
        }
    }

    private _refreshRoadLinesView(lessonConfigs?: cfg.AdventureLesson[]) {
        if(lessonConfigs) {
            this._releaseRoadLines();
            this.scheduleOnce(() => {
                for(let i = 1; i < lessonConfigs.length; ++i) {
                    const delay = Math.floor((i - 1) / 10) * 0.02;
                    const lessonCfg = lessonConfigs[i];
                    this.scheduleOnce(() => {
                        let itemRoadLineCmp = ItemLevelMapRoadLinePool.get();
                        this.linesParent.addChild(itemRoadLineCmp.node);
                        itemRoadLineCmp.node.active = true;
                        itemRoadLineCmp.init(lessonCfg);
                    }, delay);
                }
            }, 0.02);
        } else {
            let children = [...this.linesParent.children];
            children.forEach(_c => {
                _c.getComponent(ItemLevelMapRoadLine).refreshLineState();
            });
        }
    } 
    
    private _refreshLessonItemsView(lessonConfigs?: cfg.AdventureLesson[]) {
        if(lessonConfigs) {
            this._releaseLessons();
            this.scheduleOnce(() => {
                for(let i = 0; i < lessonConfigs.length; ++i) {
                    const delay = Math.floor((i - 1) / 10) * 0.02;
                    const lessonCfg = lessonConfigs[i];
                    this.scheduleOnce(() => {
                        let itemLessonCmp = ItemLevelMapLessonPool.get();
                        this.lessonsParent.addChild(itemLessonCmp.node);
                        itemLessonCmp.node.active = true;
                        itemLessonCmp.init(lessonCfg, (lessonId: number, lessState: LESSON_STATE) => {
                            if(lessState == LESSON_STATE.LOCK){
                                guiManager.showDialogTips(1000136);
                                return;
                            }
                            this.updateCurLesson(lessonId, true);
                        });
                    }, delay);
                }
            }, 0.02);
        } else {
            let children = [...this.lessonsParent.children];
            children.forEach(_c => {
                _c.getComponent(ItemLevelMapLesson).refreshState();
            });
        }
    }

    private _refreshMoveRoleView() {
        let itemLessonCmp = this._getItemLessonCmp(this._curLesson);
        if(!cc.isValid(itemLessonCmp)) return;
        let moveEndPos = itemLessonCmp.roleMoveEndPos;
        let moveRole = this.roleParent.children[0];
        let moveRoleCmp = null;
        if(!moveRole) {
            moveRoleCmp = ItemLevelMapMoveRolePool.get();
            this.roleParent.addChild(moveRoleCmp.node);
        } else {
            moveRoleCmp = moveRole.getComponent(ItemLevelMapMoveRole);
        }
        moveRoleCmp.init(moveEndPos);
        itemLessonCmp.updatePosWithMoveRole(true, 0);
    }

    private _updateContentSize(lastLessonConfig: cfg.AdventureLesson) {
        // const posStr = lastLessonConfig.LessonNodeCoordinate;
        // const posList = posStr.split(';');
        // const pos = cc.v2(Number(posList[0]), Number(posList[1]));
        const maxDistance = this._getMaxDistance()
        this.mapScroll.content.width = maxDistance + RIGHT_INFO_WIDTH;
    }

    private _moveToTargetLesson(preLessonId: number) {
        let moveRoleCmp = this._getMoveRoleCmp();
        if(!cc.isValid(moveRoleCmp)) return;

        let startLessonId: number = moveRoleCmp.isMoving ? this._getNearLessonId() : preLessonId;
        if(moveRoleCmp.isMoving && startLessonId <= 0) {
            // 容错
            startLessonId = preLessonId;
        }
        const moveLines: number[] = this._getMoveRoadLine(startLessonId, this._curLesson);
        const moveInfos = this._getMoveInfos(moveLines, startLessonId);
        moveRoleCmp.startMoving(moveInfos, () => {
            if(moveLines.length > 0) {
                const endLessonCmp = this._getItemLessonCmp(moveLines[moveLines.length - 1]);
                if(endLessonCmp) {
                    endLessonCmp.updatePosWithMoveRole(true, 0);
                }
            }
        }, () => {
            const startLessonCmp = this._getItemLessonCmp(startLessonId);
            if(startLessonCmp) {
                startLessonCmp.updatePosWithMoveRole(false, 0.1);
            }
        });
    }

    private _refreshLessonInfo() {
        this.lessonInfo.init(this._curLesson, this._loadView.bind(this));
    }

    private _loadView(viewName: string, ...args: any[]) {
        // this.loadSubView(viewName, ...args);
        guiManager.loadView(viewName, null, ...args);
    }

    private _scrollToTargetPosition() {
        const lessonCfg = configUtils.getLessonConfig(this._curLesson);
        const poses = lessonCfg.LessonNodeCoordinate.split(';');
        const posX = Number(poses[0]);
        const percent = posX / (this.mapScroll.content.getContentSize().width - RIGHT_INFO_WIDTH);
        this.mapScroll.scrollToPercentHorizontal(percent, 0.2);
    }

    private _changeChapter(chapterId: number) {
        const moveRole = this._getMoveRoleCmp();
        if(moveRole) {
            moveRole.stopMoving();
        }
        this.updateCurChapter(chapterId);
    }

    private _onScrolling() {
        const viewSize = this.mapScroll.node.width;
        const contentXPos = Math.abs(this.mapScroll.content.x);
        const viewMinX = contentXPos;
        const viewMaxX = contentXPos + viewSize;
        
        const linesChildren = [...this.linesParent.children];
        linesChildren.forEach(_c => {
            const lineCmp = _c.getComponent(ItemLevelMapRoadLine);
            const limitPos = lineCmp.limitPos;
            _c.active = !(limitPos.x >= viewMaxX || limitPos.y <= viewMinX);
        });

        const lessonsChildren = [...this.lessonsParent.children];
        lessonsChildren.forEach(_c => {
            const lessonCmp = _c.getComponent(ItemLevelMapLesson);
            const limitPos = lessonCmp.limitPos;
            _c.active = !(limitPos.x >= viewMaxX || limitPos.y <= viewMinX);
        });
    }

    onClickSelectChapter() {
        this._loadView('LevelMapChapterList', this._changeChapter.bind(this));
    }

    onClickHangUp() {
        this._loadView('HangUpRewardView');
    }

    /**
     * 刷新进入条件显示
     */
    private _refreshEnterConditionView() {
        let lessCfg = configUtils.getLessonConfig(this._getCurLessonId());
        // 进入条件
        if (lessCfg.LessonEnterCondition) {
            let enterConditionInfos = utils.parseStingList(lessCfg.LessonEnterCondition);
            for (let i = 0; i < enterConditionInfos.length; ++i) {
                // 等级
                if (enterConditionInfos[i][0] == 1) {
                    if (enterConditionInfos[i][1] > userData.lv) {
                        this.enterConditionNode.active = true;
                        this.enterConditionLb.string = `用户等级达到${enterConditionInfos[i][1]}`;
                    } else {
                        this.enterConditionNode.active = false;
                    }
                }
            }
        } else {
            this.enterConditionNode.active = false;
        }
        // 体力消耗
        if (lessCfg.LessonCost) {
            let costNum = utils.parseStingList(lessCfg.LessonCost)[0][1];
            let costItem = utils.parseStingList(lessCfg.LessonCost)[0][0];
            this.costPhysicalLb.string = `x${costNum}`;
            this._spriteLoader.changeSprite(this.costItemSp, resPathUtils.getItemIconPath(costItem));
            if (bagData.physical >= costNum) {
                this.costPhysicalLb.node.color = new cc.Color().fromHEX('#532A15');
            } else {
                this.costPhysicalLb.node.color = cc.Color.RED;
            }
        }
        // 刷新按钮状态
        const lessonCmp = this._getItemLessonCmp(this._curLesson);
        if(lessonCmp) {
            const state = lessonCmp.lessonState;
            this.startBtn.active = state == LESSON_STATE.UNLOCK;
            this.isPassed.active = state == LESSON_STATE.PASS;
        }
    }

    onClickPassedTeamBtn() {
        guiManager.showLockTips();
    }

    onClickStart() {
        // todo 判断是否能进入关卡 和进入的关卡是什么
        const lessonType = this.lessonInfo.lessonType;
        const isUseInitTeam = this.lessonInfo.isUseInitTeam;
        let startFunc = () => {
            if (this.checkMeetEnterCondition()) {
                // 进入跑酷
                if(LESSON_TYPE.Parkour == lessonType) {
                    let initTeam = this._getParkourInitTeam();
                    if(isUseInitTeam && initTeam.length <= 0) {
                        guiManager.showDialogTips(CustomDialogId.LEVELMAP_NO_DEFAULT_SQUAD);
                    } else {
                        pveDataOpt.reqEnterPve(this._curLesson);
                    }
                } else {
                // 进入战斗
                    this._enterBattle(this._curLesson);
                }
            } else {
                let lessonCfg = configUtils.getLessonConfig(this._getCurLessonId());
                let physicalCostNum = parseInt(utils.parseStingList(lessonCfg.LessonCost)[0][1]);
                if (bagData.physical < physicalCostNum) {
                    guiManager.showDialogTips(CustomDialogId.LEVELMAP_HP_NO_ENOUGH);
                } else {
                    const enterConditions = lessonCfg.LessonEnterCondition.split(';');
                    if(parseInt(enterConditions[0]) == ENTER_CONDITION.LEVEL) {
                        const enterLevel = parseInt(enterConditions[1]);
                        let dialogCfg = configUtils.getDialogCfgByDialogId(CustomDialogId.GRADE_NO_MATCH);
                        let text = utils.convertFormatString(dialogCfg.DialogText, [{ levelnum: enterLevel }]);
                        guiManager.showTips(text); 
                    }
                }
            }
        };
        // 默认阵容开始挑战
        if (lessonType == LESSON_TYPE.Battle) {
            startFunc();
        } else {
            startFunc();
        }
    }

    onClickTestAddLesson() {
        // userData.addLesson();
    }

    // 进入战斗刷新数据
    private _enterBattle (lessonId: number) {
        let lessonCfg = configUtils.getLessonConfig(lessonId);
        if (lessonCfg && lessonCfg.LessonType == LESSON_TYPE.Battle) {
            let isUseInitTeam = this.lessonInfo.isUseInitTeam;
            let pveConfig: PveConfig = {
                lessonId: lessonId,
                userLv: userData.lv,
                useDefaultSquad: isUseInitTeam,
                step: 0,
                pveMode: PVE_MODE.ADVENTURE_LESSON,
                adventureCfg: lessonCfg,
                banHeroList: [],
                passStep: [],
            }
            pveData.pveConfig = pveConfig;
            guiManager.loadScene(SCENE_NAME.BATTLE);
        } else {
            logger.log(`lesson config error. id = ${lessonId.toString}` )
        }
    }

    // 只有使用默认整容进入跑酷才会直接在这个界面发送战斗请求
    private _receiveEnterPveRes(cmd: any, msg: gamesvr.EnterPveRes) {
        if (!this.node.active) return; 
        let lessonId = msg.LessonID;
        let lessonCfg = configManager.getConfigByKV("lesson", "LessonId", lessonId)[0];
        let isUseInitTeam: boolean = this.lessonInfo.isUseInitTeam;
        // todo 如果未勾选默认整容 就需要编队 不然就直接开始战斗！！！！！！
        if (lessonCfg) {
            if (lessonCfg.LessonType == LESSON_TYPE.Battle) {
                let pveConfig: PveConfig = {
                    lessonId: lessonId,
                    userLv: userData.lv,
                    useDefaultSquad: isUseInitTeam,
                    pveMode: PVE_MODE.ADVENTURE_LESSON,
                    adventureCfg: lessonCfg,
                    step: 0,
                    banHeroList: [],
                }
                pveData.pveConfig = pveConfig;
                guiManager.loadScene(SCENE_NAME.BATTLE);
            } else {
                let pveConfig: PveConfig = {
                    lessonId: lessonId,
                    userLv: userData.lv,
                    useDefaultSquad: isUseInitTeam,
                    pveMode: PVE_MODE.ADVENTURE_LESSON,
                    adventureCfg: lessonCfg
                }
                pveData.pveConfig = pveConfig;
                if(isUseInitTeam) {
                    let initTeam = this._getParkourInitTeam();
                    guiManager.loadScene(SCENE_NAME.RUN_COOL, false, initTeam);
                } else {
                    guiManager.loadView(VIEW_NAME.PARKOUR_PREPARE_VIEW, null, null);
                }
            }
        } else {
            logger.error("[LevelMapView] Cant find lession config by id = ", lessonId);
        }
    }

    private _getLessonsConfigs(): cfg.AdventureLesson[] {
        const lessonsCfgs = configManager.getConfigByKV('lesson', 'LessonChapter', this._curChapter);
        return lessonsCfgs;
    }

    private _updateHangup () {
        this.hangUp.onRefresh();
    }

    /**
   * 判断是否满足进入关卡条件
   * @returns 
   */
    checkMeetEnterCondition() {
        let lessCfg = configUtils.getLessonConfig(this._getCurLessonId());
        let isMeet: boolean = true;
        let enterConditionInfos = utils.parseStingList(lessCfg.LessonEnterCondition);
        for (let i = 0; i < enterConditionInfos.length; ++i) {
            // 等级
            let enterType = parseInt(enterConditionInfos[i][0]);
            if (enterType == ENTER_CONDITION.LEVEL) {
                const enterLevel = parseInt(enterConditionInfos[i][1]);
                isMeet = enterLevel <= userData.lv;
            }
        }
        let physicalCostNum: number = parseInt(utils.parseStingList(lessCfg.LessonCost)[0][1]);
        isMeet = isMeet && physicalCostNum <= bagData.physical;
        return isMeet;
    }

    private _getParkourInitTeam(): number[] {
        let localTeam = localStorageMgr.getAccountStorage(SAVE_TAG.PARKOUR_LAST_TEAM);
        if(!localTeam || localTeam.length === 0) return [];
        let team: number[] = localTeam;
        if(team.length == 0) return [];
        let filterTeam = team.filter(_c => {
            if(bagData.getHeroById(_c)) {
                return true;
            }
            return false;
        });
        return filterTeam;
    }

    private _releaseRoadLines() {
        let removeChildren = [...this.linesParent.children];
        removeChildren.forEach(_c => {
            _c.removeFromParent();
            ItemLevelMapRoadLinePool.put(_c.getComponent(ItemLevelMapRoadLine));
        });
    }

    private _releaseLessons() {
        let removeChildren = [...this.lessonsParent.children];
        removeChildren.forEach(_c => {
            _c.removeFromParent();
            ItemLevelMapLessonPool.put(_c.getComponent(ItemLevelMapLesson));
        });
    }

    private _releaseMoveRole() {
        let moveRole = this.roleParent.children[0];
        if(moveRole) {
            moveRole.removeFromParent();
            ItemLevelMapMoveRolePool.put(moveRole.getComponent(ItemLevelMapMoveRole));
        }
    }

    private _getItemLessonCmp(lessonId: number): ItemLevelMapLesson {
        const children = [...this.lessonsParent.children];
        const find = children.find(_c => { return _c.getComponent(ItemLevelMapLesson).lessonId == lessonId; });
        if(find) {
            return find.getComponent(ItemLevelMapLesson);
        }
        return null;
    }

    private _getMoveRoleCmp(): ItemLevelMapMoveRole {
        let moveRole = this.roleParent.children[0];
        if(moveRole) {
            return moveRole.getComponent(ItemLevelMapMoveRole);
        }
        return null;
    }

    private _getNearLessonId(): number {
        let lessonId: number = 0;
        const curRolePos = cc.v3(this.roleParent.children[0].position);
        const lessons = this._getLessonsConfigs();
        lessons.sort((_a, _b) => { return _b.LessonId - _a.LessonId; });
        let forward = MODEL_FORWARD.NULL;
        for(let i = 0; i < lessons.length - 1; ++i) {
            const curLessonId = lessons[i].LessonId;
            const preLessonId = lessons[i].LessonOrder;
            const nextPos = this._getLessonPos(curLessonId);
            const prePos = this._getLessonPos(preLessonId);
            if(utils.checkIsOnLines(prePos, nextPos, curRolePos)) {
                forward = nextPos.x > prePos.x ? MODEL_FORWARD.RIGHT : MODEL_FORWARD.LEFT;
                if(MODEL_FORWARD.RIGHT == forward) {
                    if(curRolePos.sub(prePos).len() >= curRolePos.sub(nextPos).len()) {
                        lessonId = curLessonId;
                    } else {
                        lessonId = preLessonId;
                    }
                    logger.log(`_getNearLessonId lessonId: `, lessonId);
                    return lessonId;
                } else {
                    if(curRolePos.sub(prePos).len() >= curRolePos.sub(nextPos).len()) {
                        lessonId = preLessonId;
                    } else {
                        lessonId = curLessonId;
                    }
                    logger.log(`_getNearLessonId lessonId: `, lessonId);
                    return lessonId;
                }
            }
        }
        // 我只能取距离最近的了
        let minDistance: number = 1000000000;
        for(let i = 0; i < lessons.length; ++i) {
            const curLessonId = lessons[i].LessonId;
            const curPos = this._getLessonPos(curLessonId);
            const distance = curRolePos.sub(curPos).len();
            if(distance < minDistance) {
                minDistance = distance;
                lessonId = curLessonId;
            }
        }
        // logger.log(`_getNearLessonId lessonId: `, lessonId);
        // const lessonCfgs = this._getLessonsConfigs();
        // let minDistance: number = 100000;
        // for(let i = 0; i < lessonCfgs.length; ++i) {
        //     const lessonCfg = lessonCfgs[i];
        //     const posStr = lessonCfg.LessonNodeCoordinate;
        //     const posList = posStr.split(';');
        //     const pos = cc.v2(Number(posList[0]), Number(posList[1]));
        //     let curDistance = Math.sqrt(Math.pow(pos.x - curRolePos.x, 2) + Math.pow(pos.y - curRolePos.y, 2));
        //     if(curDistance < minDistance) {
        //         minDistance = curDistance;
        //         lessonId = lessonCfg.LessonId;
        //     }
        // }
        return lessonId;
    }

    private _getLessonPos(lessonId: number): cc.Vec3 {
        const cfg = configUtils.getLessonConfig(lessonId);
        const posStr = cfg.LessonNodeCoordinate.split(';');
        return cc.v3(Number(posStr[0]), Number(posStr[1]), 0);
    }

    private _getMoveRoadLine(curLessonId: number, finalLessonId: number): number[] {
        let lessonList: number[] = [];
        let frontLessons: number[] = [];
        let behindLessons: number[] = [];
        let frontLessonId: number = curLessonId;
        let behindLessonId: number = finalLessonId;
        
        while(frontLessonId > 0) {
            frontLessons.push(frontLessonId);
            frontLessonId = this._getFrontLessonId(frontLessonId);
        }

        while(behindLessonId > 0) {
            behindLessons.push(behindLessonId);
            behindLessonId = this._getFrontLessonId(behindLessonId);
        }

        
        // logger.log('前置线路是:', frontLessons);
        // logger.log('后置线路是:', behindLessons);
        let isFind: boolean = false;
        let behindFindFinalIndex = behindLessons.indexOf(curLessonId);
        if(behindFindFinalIndex > -1 && behindLessons.indexOf(finalLessonId) > -1) {
            // 如果直接找到了 当前界面 说明是没有支路的
            isFind = true;
            lessonList = lessonList.concat(behindLessons.slice(0, behindFindFinalIndex).reverse());
        }

        let frontFindFinalIndex = frontLessons.indexOf(finalLessonId);
        if(frontFindFinalIndex > -1 && frontLessons.indexOf(curLessonId) > -1 && !isFind) {
            // 如果直接找到了 当前界面 说明是没有支路的
            isFind = true;
            lessonList = lessonList.concat(frontLessons.slice(0, frontFindFinalIndex + 1));
        }
        
        if(!isFind) {
            let roadLineLesson = 0;
            if(frontLessons.length > 0 && behindLessons.length > 0) {
                let sameLessons = frontLessons.filter(_lesson => { return behindLessons.indexOf(_lesson) > -1; });
                if(sameLessons.length > 0) {
                    sameLessons.sort((_a, _b) => {
                        return _b - _a;
                    });
                    roadLineLesson = sameLessons[0];
                    let lessonCfg = configUtils.getLessonConfig(roadLineLesson);
                    if(!lessonCfg.LessonOrder) {
                        roadLineLesson = 0;
                    }
                }
            }
            // logger.log('主路联通点是:', roadLineLesson);
            if(roadLineLesson > 0) {
                if(frontLessons.length == 0 && behindLessons.length > 0) {
                    lessonList = lessonList.concat(behindLessons.reverse());
                } else if(frontLessons.length > 0 && behindLessons.length == 0) {
                    lessonList = lessonList.concat(frontLessons);
                } else {
                    let frontIndex: number = frontLessons.indexOf(roadLineLesson);
                    lessonList = lessonList.concat(frontLessons.slice(0, frontIndex));
        
                    let behindIndex: number = behindLessons.indexOf(roadLineLesson);
                    lessonList = lessonList.concat(behindLessons.slice(0, behindIndex + 1).reverse());
                }
            } else {
                if(frontLessons.length == 0 && behindLessons.length > 0) {
                    lessonList = lessonList.concat(behindLessons.reverse());
                } else if(frontLessons.length > 0 && behindLessons.length == 0) {
                    lessonList = lessonList.concat(frontLessons);
                }
            }
        }


        // let startIndex = lessonList.indexOf(curLessonId)
        // if(startIndex > -1) {
        //     lessonList.splice(startIndex, 1);
        // }
        // logger.log('线路是:', lessonList);
        return lessonList;
    }

    private _getMoveInfos(moveLines: number[], preLessonId: number): ROLE_MOVE_INFO[] {
        let moveInfos: ROLE_MOVE_INFO[] = [];
        let tempPreLessonId: number = preLessonId;
        let preLessonCmp = this._getItemLessonCmp(preLessonId);
        if(preLessonCmp) {
            let moveRole = this._getMoveRoleCmp();
            let roleMoveInfo: ROLE_MOVE_INFO = {
                endPos: preLessonCmp.roleMoveEndPos.endPos,
                endForward: preLessonCmp.roleMoveEndPos.endForward,
                distance: cc.v2(moveRole.node.position).sub(preLessonCmp.roleMoveEndPos.endPos).len(),
                movingCenter: preLessonCmp.roleMoveEndPos.endPos,
                movingForward: moveRole.node.x > preLessonCmp.roleMoveEndPos.endPos.x ? MODEL_FORWARD.LEFT : MODEL_FORWARD.RIGHT
            }
            moveInfos.push(roleMoveInfo);
        }
        for(let i = 0; i < moveLines.length; ++i) {
            let lessonId = moveLines[i];
            let itemLessonCmp = this._getItemLessonCmp(lessonId);
            if(itemLessonCmp) {
                moveInfos.push(itemLessonCmp.getRoleMoveInfo(tempPreLessonId));
            }
            tempPreLessonId = lessonId;
        }
        return moveInfos;
    }
    /**
     * 获得上一个关卡ID
     */
    private _getFrontLessonId(lessonId: number): number {
        const lessonCfg = configUtils.getLessonConfig(lessonId);
        if(lessonCfg.LessonOrder && lessonCfg.LessonChapter == this._curChapter) {
            return lessonCfg.LessonOrder;
        }
        return 0;
    }
    /**
     * 获得当前关卡ID
     * @returns 
     */
    private _getCurLessonId(): number {
        let lessonId: number = 1001001;
        if(pveData.lastPassLessonId > 0 && !pveData.checkIsMainRoad(pveData.lastPassLessonId)) {
            let lessonCfg: cfg.AdventureLesson[] = configManager.getConfigByKV('lesson', 'LessonOrder', pveData.lastPassLessonId);
            if(lessonCfg && lessonCfg.length > 0) {
                lessonId = lessonCfg[0].LessonId;
            } else {
                lessonId = pveData.lastPassLessonId;
            }
        } else {
            const lastLessons: cfg.AdventureLesson = configManager.getOneConfigByManyKV('lesson', 'LessonLast', 1, 'LessonChapter', this._curChapter);
            if(lastLessons) {
                const lastLesson = lastLessons;
                if(pveData.checkLessonIsPast(lastLesson.LessonId)) {
                    lessonId = lastLesson.LessonId;
                } else {
                    lessonId = pveData.getCurrLessonId();
                }
            }
        }
        return lessonId;
    }

    private _getLastLessonCfg(lessonCfgs: cfg.AdventureLesson[]) {
        let lastLessonCfg: cfg.AdventureLesson = null;
        const lessons: cfg.AdventureLesson[] = configManager.getConfigByKV('lesson', 'LessonLast', 1);
        if(lessons && lessons.length > 0) {
            lastLessonCfg = lessons[0];
        }
        return lastLessonCfg;
    }

    private _getMaxDistance(): number {
        let maxDistance = 0;
        const lessons: cfg.AdventureLesson[] = configManager.getConfigByKV('lesson', 'LessonChapter', this._curChapter);
        if(lessons && lessons.length > 0) {
            for(let i = 0; i < lessons.length; ++i) {
                const lesson = lessons[i];
                const lessonPos = this._getLessonPos(lesson.LessonId);
                if(lessonPos.x > maxDistance) {
                    maxDistance = lessonPos.x;
                }
            }
        }
        return maxDistance;
    }

}
