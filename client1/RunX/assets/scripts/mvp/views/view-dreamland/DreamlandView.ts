
/*
 * @Author: xuyang
 * @Date: 2021-06-05 14:01:42
 * @Description: 太虚幻境主界面
 */
import { CustomDialogId, CustomItemId, RES_ICON_PRE_URL, SCENE_NAME, VIEW_NAME } from "../../../app/AppConst";
import { PVE_MODE } from "../../../app/AppEnums";
import { BagItemInfo, PveConfig } from "../../../app/AppType";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configCache } from "../../../common/ConfigCache";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { dreamlandEvent, shopEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { localStorageMgr, SAVE_TAG } from "../../../common/LocalStorageManager";
import { logger } from "../../../common/log/Logger";
import moduleUIManager from "../../../common/ModuleUIManager";
import { redDotMgr, RED_DOT_MODULE } from "../../../common/RedDotManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { uiHelper } from "../../../common/ui-helper/UIHelper";
import { cfg } from "../../../config/config";
import { data, gamesvr } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { pveData } from "../../models/PveData";
import { serverTime } from "../../models/ServerTime";
import { userData } from "../../models/UserData";
import { pveDataOpt } from "../../operations/PveDataOpt";
import ItemBag from "../view-item/ItemBag";
import ItemRedDot from "../view-item/ItemRedDot";

enum DREAM_LAND_CHAPTER_REWARD_STATE {
    NOT_PAST,
    PAST,
    REWARDED
}

const { ccclass, property } = cc._decorator;
@ccclass
export default class DreamLandView extends ViewBaseComponent {
    @property(cc.Label) title: cc.Label = null;                 //章节标题
    @property(cc.Sprite) chapBg: cc.Sprite = null;              //章节背景
    @property(cc.Sprite) heroBg: cc.Sprite = null;              //角色立绘
    @property(cc.Node) lessonItem: cc.Node = null;              //关卡模板
    @property(cc.Node) mainLayout: cc.Node = null;              //关卡列表主体
    @property(cc.Label) tipLabel: cc.Label = null;              //关卡条件提示
    @property(cc.Toggle) initTeamTog: cc.Toggle = null;         //默认阵容勾选
    @property(cc.Button) challengeButton: cc.Button = null;     //挑战
    @property(cc.Node) mainNode: cc.Node = null;
    @property(cc.Node) emptyNode: cc.Node = null;
    @property(cc.Node) levelRewardParent: cc.Node = null;
    @property(cc.Node) chapterRewardParent: cc.Node = null;
    @property(cc.Label) chapterRewardDesc: cc.Label = null;
    @property(cc.Node) notChapterRewardTip: cc.Node = null;

    @property([cc.SpriteFrame]) uncheckBg: cc.SpriteFrame[] = [];
    @property([cc.SpriteFrame]) checkBg: cc.SpriteFrame[] = [];

    private _curLessonId: number = -1;                     //当前关卡进度
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _lessonCfg: cfg.PVEDreamlandLesson = null;          //当前关卡配置
    private _lessonList: number[] = [];         //当前章节所有关卡
    private _chapterCfg: cfg.PVEDreamlandChapter = null;        //当前章节配置
    private _pveID: number = 0;
    private _oldUseDefaultTeam: boolean = false;
    private _itemBags: ItemBag[] = null;

    preInit() {
        eventCenter.register(dreamlandEvent.FINISH_PVE_RES, this, this._recvFinishPveRes);
        eventCenter.register(dreamlandEvent.CHAP_REWARD_TOKEN, this, this._recvChapterRewardRes);
        guiManager.addCoinNode(this.node);
        return Promise.resolve(true);
    }

    onInit(pveID: number) {
        this._pveID = pveID;
        this._oldUseDefaultTeam = localStorageMgr.getAccountStorage(SAVE_TAG.PVE_MODE_DEFAULT_TEAM.replace(/%d/, this._pveID +''));
        this._oldUseDefaultTeam = !!this._oldUseDefaultTeam;
        this.initTeamTog.isChecked = this._oldUseDefaultTeam;
        this.prepareData();
        this._loadDatatoView();
        this._updateChapterReward();
    }

    onRelease() {
        this._clearItems();
        guiManager.removeCoinNode(this.node);
        this.releaseSubView();
        this._spriteLoader.release();
        eventCenter.unregisterAll(this);
    }

    private _loadDatatoView() {
        if (!this._lessonCfg) return;

        let state = getDreamLandChapterState(this._lessonCfg.PVEDreamlandLessonChapter);
        let chapBgRes = `${RES_ICON_PRE_URL.DREAMLAND}/${this._chapterCfg.PVEDreamlandChapterImage}`;
        let modelId = parseInt(this._lessonCfg.PVEDreamlandLessonHeroImage);
        let heroRes = resPathUtils.getModelPhotoPath(modelId);
        let curIndex = 0;
        this.challengeButton.node.active = state == DREAM_LAND_CHAPTER_REWARD_STATE.NOT_PAST;
        //章节背景
        this._spriteLoader.changeSprite(this.chapBg, chapBgRes);
        this._spriteLoader.changeSprite(this.heroBg, heroRes);
        //关卡列表
        this.mainLayout.removeAllChildren();
        this._lessonList.reverse().forEach((lessonID, index) => {
            let item = cc.instantiate(this.lessonItem);
            let itemProgress = item.getChildByName("progressBar");
            let itemCheckBox = item.getComponentInChildren(cc.Toggle);
            let itemUncheckBg = itemCheckBox.node.getChildByName("bg");
            let itemCheckBg = itemCheckBox.node.getChildByName("bg2");
            let lesson = configUtils.getDreamLandLessonConfig(lessonID);
            let lessonType = lesson.PVEDreamlandLessonType;
            let lessonIng = lesson.PVEDreamlandLessonId == this._curLessonId;
            let lessonPass = pveData.dreamRecords[lesson.PVEDreamlandLessonId]
                && pveData.dreamRecords[lesson.PVEDreamlandLessonId].Past;
            itemCheckBox.isChecked = lessonPass;
            itemProgress.active = lessonPass || lessonIng;
            itemCheckBg.active = lessonIng;
            item.active = true;
            item.parent = this.mainLayout;

            //区分显示icon
            if (lessonType && lessonType>1){
                if (this.checkBg[lessonType - 1]) itemCheckBg.getComponent(cc.Sprite).spriteFrame = this.checkBg[lessonType-1];
                if (this.uncheckBg[lessonType - 1]) itemUncheckBg.getComponent(cc.Sprite).spriteFrame = this.uncheckBg[lessonType-1];
            }
            lessonIng && (curIndex = this._lessonList.length - index);
        })
        this._lessonList.reverse();

        //关卡进度标题
        if (this._chapterCfg) {
            let nextChapter = this._chapterCfg.PVEDreamlandChapterBehind;
            let chapName = this._chapterCfg.PVEDreamlandChapterName + `-${curIndex}`;
            this.emptyNode.active = (!nextChapter && state == DREAM_LAND_CHAPTER_REWARD_STATE.REWARDED);
            this.mainNode.active = !this.emptyNode.active;
            this.title.string = (nextChapter || state == DREAM_LAND_CHAPTER_REWARD_STATE.NOT_PAST) ? chapName : "";
        }

        //关卡限制刷新
        this.tipLabel.node.active = false;
        let condition = this._lessonCfg.PVEDreamlandLessonEnterCondition;
        let parseCondition = condition ? utils.parseStingList(condition)[0] : null;
        if (parseCondition) {
            if (Number(parseCondition[0]) == 1 && userData.lv < Number(parseCondition[1])) {
                this.tipLabel.node.active = true;
                this.tipLabel.string = `挑战条件：用户等级达到${parseCondition[1]}`;
            }
        }

        this._genLevelReward();
    }

    private _showEmptyChapterReward() {
        this.chapterRewardParent.active = false;
        this.chapterRewardDesc.string = '章节奖励';
        this.notChapterRewardTip.active = true;
    }

    // 刷新章节奖励
    private _updateChapterReward() {
        let giftCfgs = configCache.getDreamLandGifts();
        if(!giftCfgs || giftCfgs.size == 0) {
            this._showEmptyChapterReward();
            return;
        }

        let curState = DREAM_LAND_CHAPTER_REWARD_STATE.REWARDED;
        let lessonCfg: cfg.PVEDreamlandLesson = null;
        let chapterCfg: cfg.PVEDreamlandChapter = null;
        for(let [k, v] of giftCfgs) {
            let tempLessonCfg = configUtils.getDreamLandLessonConfig(k);
            let state = getDreamLandChapterState(tempLessonCfg.PVEDreamlandLessonChapter);
            if(state != curState) {
                curState = state;
                lessonCfg = tempLessonCfg;
                break;
            }
        }

        if(DREAM_LAND_CHAPTER_REWARD_STATE.REWARDED == curState) {
            this._showEmptyChapterReward();
            return;
        }

        chapterCfg = configUtils.getDreamLandChapterConfig(lessonCfg.PVEDreamlandLessonChapter);
        if(!chapterCfg || !chapterCfg.PVEDreamlandChapterRewardShow || chapterCfg.PVEDreamlandChapterRewardShow.length == 0) {
            this._showEmptyChapterReward();
            return;
        }

        let itemID: number, itemCnt: number;
        utils.parseStingList(chapterCfg.PVEDreamlandChapterRewardShow, (strArr: string[]) => {
            if(typeof itemID != 'undefined') return;
            if(!strArr || !Array.isArray(strArr) || strArr.length == 0) return;
            itemID = parseInt(strArr[0]), itemCnt = parseInt(strArr[1]);
        });

        this.chapterRewardParent.active = true;
        this.notChapterRewardTip.active = false;
        if(this.chapterRewardParent.childrenCount == 0) {
            let itemBag = ItemBagPool.get();
            itemBag.node.parent = this.chapterRewardParent;
            itemBag.node.setPosition(0,0);
            this._itemBags = this._itemBags || [];
            this._itemBags.push(itemBag);
        }

        let itemBag = this.chapterRewardParent.children[0].getComponent(ItemBag);
        itemBag.init({id: itemID, count: itemCnt, clickHandler: this.onClickTreasure.bind(this)});

        if(DREAM_LAND_CHAPTER_REWARD_STATE.PAST == curState) {
            this.chapterRewardDesc.string = '可领取';
            return;
        } else {
            let lessons = configCache.getDreamLandLessonsByChapterID(chapterCfg.PVEDreamlandChapterId);
            lessons.sort((a, b) => {
                let cfgA: cfg.PVEDreamlandLesson = configUtils.getDreamLandLessonConfig(a);
                let cfgB: cfg.PVEDreamlandLesson = configUtils.getDreamLandLessonConfig(b);
                return (cfgA.PVEDreamlandLessonOrder || 0) - (cfgB.PVEDreamlandLessonOrder || 0);
            });
            let curIdx = lessons.indexOf(this._curLessonId);
            this.chapterRewardDesc.string = `再通${lessons.length - curIdx}关可领取`
        }
    }

    //战斗结束刷新进度
    private _recvFinishPveRes() {
        this.prepareData();
        this._loadDatatoView();
        this._updateChapterReward();
        redDotMgr.fire(RED_DOT_MODULE.PVE_EXTREME_TOGGLE);
        redDotMgr.fire(RED_DOT_MODULE.MAIN_PVE);
    }

    private _recvChapterRewardRes(cmd: any, msg: gamesvr.ChapterRewardRes) {
        this._updateChapterReward();
        redDotMgr.fire(RED_DOT_MODULE.PVE_EXTREME_TOGGLE);
        redDotMgr.fire(RED_DOT_MODULE.MAIN_PVE);
    }

    //准备所需数据
    private prepareData() {
        this._curLessonId = pveData.getDreamCurLessonId();
        this._lessonCfg = configUtils.getDreamLandLessonConfig(this._curLessonId);
        this._lessonList = [];
        if (!this._lessonCfg) {
            logger.error("当前关卡进度异常");
            return;
        }

        let chapterId = this._lessonCfg.PVEDreamlandLessonChapter;
        //读取当前章节所有关卡ID
        this._lessonList = configCache.getDreamLandLessonsByChapterID(chapterId)
        this._lessonList.sort((a, b) => {
            let cfgA: cfg.PVEDreamlandLesson = configUtils.getDreamLandLessonConfig(a);
            let cfgB: cfg.PVEDreamlandLesson = configUtils.getDreamLandLessonConfig(b);
            return (cfgA.PVEDreamlandLessonOrder || 0) - (cfgB.PVEDreamlandLessonOrder || 0);
        })
        this._chapterCfg = configUtils.getDreamLandChapterConfig(chapterId);
    }

    //章节奖励
    private onClickTreasure() {
        guiManager.loadView('DreamlandRewardView', this.node);
    }

    //挑战按钮
    private onClickChallenge() {
        let condition = this._lessonCfg.PVEDreamlandLessonEnterCondition;
        let cost = this._lessonCfg.PVEDreamlandLessonCost;
        let parseCondition = condition ? utils.parseStingList(condition)[0] : null;
        let parseCost = utils.parseStingList(cost);
        let refreshTime = pveData.dreamCounts ? pveData.dreamCounts.RefreshTime : 0;
        let limitFightNums = configUtils.getModuleConfigs().PVEDreamlandFightNum;
        let useDefaultSquad = this.initTeamTog.isChecked;
        let lessonCfg = configManager.getConfigByKey("dreamlandLesson", this._curLessonId);
        //等级
        if (parseCondition) {
            if (Number(parseCondition[0]) == 1 && userData.lv < Number(parseCondition[1])) {
                let dialogCfg = configUtils.getDialogCfgByDialogId(CustomDialogId.GRADE_NO_MATCH);
                let text = utils.convertFormatString(dialogCfg.DialogText, [{ levelnum: parseCondition[1] }]);
                guiManager.showTips(text);
                return;
            }
        }
        //货币
        if (cost && parseCost) {
            let bagItem = bagData.getItemByID(Number(parseCost[0]));
            let haveCount = bagItem ? utils.longToNumber(bagItem.Array[0].Count) : 0;
            if (haveCount > Number(parseCost[1])) {
                switch (Number(parseCost[0])) {
                    case CustomItemId.GOLD: guiManager.showDialogTips(CustomDialogId.DREAMLAND_GOLD_NO_ENOUGH); break;
                    case CustomItemId.DIAMOND: guiManager.showDialogTips(CustomDialogId.DREAMLAND_DIAMOND_NO_ENOUGH); break;
                    case CustomItemId.PHYSICAL: guiManager.showDialogTips(CustomDialogId.DREAMLAND_HP_NO_ENOUGH);; break;
                    default: break;
                }
                return;
            }
        }
        if (refreshTime && refreshTime > serverTime.currServerTime()) {
            guiManager.showDialogTips(CustomDialogId.DREAMLAND_TICKET_NO_ENOUGH);
            return;
        }
        //进入战斗逻辑
        let pveConfig: PveConfig = {
            lessonId: this._curLessonId,
            userLv: userData.lv,
            useDefaultSquad: useDefaultSquad,
            dreamlandCfg: lessonCfg,
            pveMode: PVE_MODE.DREAM_LESSON,
            pveListId: 17012
        }
        pveData.pveConfig = pveConfig;
        guiManager.loadScene(SCENE_NAME.BATTLE);

        if(this._oldUseDefaultTeam != useDefaultSquad){
            localStorageMgr.setAccountStorage(SAVE_TAG.PVE_MODE_DEFAULT_TEAM.replace(/%d/, this._pveID + ''), useDefaultSquad);
            this._oldUseDefaultTeam = useDefaultSquad;
        }
    }

    //关卡奖励
    private _genLevelReward() {
        this._clearItems();

        let lessonCfg: cfg.PVEDreamlandLesson = configManager.getConfigByKey("dreamlandLesson", this._curLessonId);
        let itemList: data.IItemInfo[] = utils.parseStr2Iteminfo(lessonCfg.PVEDreamlandLessonRewardShow || "");
        let idMap = new Map<number, number>();
        itemList.forEach(item => {
            let oldV = idMap.has(item.ID) ? (idMap.get(item.ID) as number): 0;
            idMap.set(item.ID, oldV + utils.longToNumber(item.Count));
        });

        itemList.length = 0;
        idMap.forEach((v, k) => {
            if(v <= 0) return;
            let equipCfg = configUtils.getEquipConfig(k);
            if(equipCfg){
                itemList.push(...(new Array(v).fill({ID: k, Count: 1})));
                return;
            }
            itemList.push({ID: k, Count: v});
        });

        if(!itemList || itemList.length == 0) {
            this.levelRewardParent.active = false;
            return;
        }

        this.levelRewardParent.active = true;
        let startX: number, spaceX: number = 5;
        itemList.forEach((ele, idx) => {
            let item = ItemBagPool.get();
            if(typeof startX == 'undefined') {
                let totalW = item.node.width * itemList.length + spaceX * (itemList.length - 1);
                startX = -(totalW >> 1);
            }
            item.init({
                id: ele.ID,
                count: utils.longToNumber(ele.Count),
                clickHandler: (info: BagItemInfo)=> {
                    moduleUIManager.showItemDetailInfo(ele.ID, ele.Count, uiHelper.getRootViewComp(this.node).node);
                }
            });
            this._itemBags = this._itemBags || [];
            this._itemBags.push(item);
            item.node.parent = this.levelRewardParent;
            item.node.setPosition(startX + (item.node.width >> 1), 0);
            startX += (item.node.width + spaceX);
        });
    }

    private _clearItems () {
        if(!this._itemBags) return;
        this._itemBags.forEach(_i => {
            ItemBagPool.put(_i)
        })
        this._itemBags.length = 0;
    }
}

// 获取太虚幻境
const getDreamLandChapterState = function(chapterID: number): DREAM_LAND_CHAPTER_REWARD_STATE {
    let lessons = configCache.getDreamLandLessonsByChapterID(chapterID);
    lessons.sort((a, b) => {
        let cfgA: cfg.PVEDreamlandLesson = configUtils.getDreamLandLessonConfig(a);
        let cfgB: cfg.PVEDreamlandLesson = configUtils.getDreamLandLessonConfig(b);
        return (cfgA.PVEDreamlandLessonOrder || 0) - (cfgB.PVEDreamlandLessonOrder || 0);
    });
    let lastLesson = lessons[lessons.length - 1];
    if(!pveData.dreamRecords || !pveData.dreamRecords[lastLesson] || !pveData.dreamRecords[lastLesson].Past){
        return DREAM_LAND_CHAPTER_REWARD_STATE.NOT_PAST;
    }

    if(pveData.chapReward[chapterID]) {
        return DREAM_LAND_CHAPTER_REWARD_STATE.REWARDED;
    }

    return DREAM_LAND_CHAPTER_REWARD_STATE.PAST;
}

export {
    getDreamLandChapterState,
    DREAM_LAND_CHAPTER_REWARD_STATE
}
