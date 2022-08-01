import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { audioManager, SFX_TYPE } from "../../../common/AudioManager";
import { ItemBagPool, ItemModelSpinePool } from "../../../common/res-manager/NodePool";
import { cfg } from "../../../config/config";
import { pveData } from "../../models/PveData";
import ItemBag from "../view-item/ItemBag";
import ItemModelSpine from "../view-item/ItemModelSpine";
import { LESSON_STATE, MODEL_FORWARD, MOVE_END_INFO, ROLE_MOVE_INFO } from "./LevelMapView";

const ROLE_MOVE_TIME: number = 0.15;

const {ccclass, property} = cc._decorator;

//关卡节点显示的图片类型
enum LEVEL_NODE_SHOW_TYPE {
    NONE = 0,
    ROLE,
    REWARD
}

@ccclass
export default class ItemLevelMapLesson extends cc.Component {
    @property(cc.Node) modelParent: cc.Node = null;
    @property(cc.Node) isPassed: cc.Node = null;
    @property(cc.Node) rewardRootNode: cc.Node = null;

    private _lessonCfg: cfg.AdventureLesson = null;
    private _itemModelSpineCmp: ItemModelSpine = null;
    private _itemBag: ItemBag = null;
    private _clickHandle: Function = null;
    private _pos: cc.Vec2 = null;
    private _zIndex: number = 0;

    init(lessonCfg: cfg.AdventureLesson, clickHandle?: Function) {
        this._lessonCfg = lessonCfg;
        this._clickHandle = clickHandle;
        this._setupPosAndZIndex();
        this._refreshView();
        this.refreshState();
    }

    deInit() {
        cc.Tween.stopAllByTarget(this.modelParent);
        cc.Tween.stopAllByTarget(this.rewardRootNode);
        this._clickHandle = null;
        this._pos = null;
        this._zIndex = 0;
        this._removeLevelNodeTag();
    }

    get lessonId() {
        return this._lessonCfg.LessonId;
    }

    get lessonState() {
        return this._getState();
    }

    get limitPos() {
        const nodePos = this.node.position;
        const width = this.node.width;
        return cc.v2(nodePos.x - width / 2, nodePos.x + width / 2);
    }

    get roleMoveEndPos(): MOVE_END_INFO {
        let moveInfo: MOVE_END_INFO = {
            endPos: cc.v2(0, 0),
            endForward: MODEL_FORWARD.NULL,
        };
        let pos = this._pos || this._getPosByCfg(this._lessonCfg);
        let isForwardRight = !this._lessonCfg.LessonModelOrientation || Number(this._lessonCfg.LessonModelOrientation) == MODEL_FORWARD.LEFT ? false : true;
        moveInfo.endForward = isForwardRight ? MODEL_FORWARD.LEFT : MODEL_FORWARD.RIGHT;
        if((cc.isValid(this._itemModelSpineCmp) || cc.isValid(this._itemBag)) && !pveData.checkLessonIsPast(this._lessonCfg.LessonId)) {
            moveInfo.endPos = cc.v2(pos.x + (isForwardRight ? 50 : -50), pos.y);
        } else {
            moveInfo.endPos = pos;
        }
        return moveInfo;
    }

    getRoleMoveInfo(preLessonId: number): ROLE_MOVE_INFO {
        let endInfo = this.roleMoveEndPos;
        let moveInfo: ROLE_MOVE_INFO = {
            endPos: endInfo.endPos,
            endForward: endInfo.endForward,
            movingForward: MODEL_FORWARD.NULL,
            movingCenter: cc.v2(0, 0),
            distance: 0
        }
        let pos = this._pos || this._getPosByCfg(this._lessonCfg);
        moveInfo.movingCenter = pos;
        
        let prePos = cc.v2(pos);
        if(preLessonId > 0) {
            const lessonCfg = configUtils.getLessonConfig(preLessonId);
            prePos = this._getPosByCfg(lessonCfg);
            if(prePos.x > endInfo.endPos.x) {
                moveInfo.movingForward = MODEL_FORWARD.LEFT;
            } else {
                moveInfo.movingForward = MODEL_FORWARD.RIGHT;
            }
        }
        moveInfo.distance = pos.sub(prePos).len();
        return moveInfo;
    }

    private _refreshView() {
        this.node.setPosition(this._pos || this._getPosByCfg(this._lessonCfg));
        this.node.zIndex = this._zIndex;
        this.modelParent.x = 0;
        this.rewardRootNode.x = 0;
        this._addLevelNodeTag();
    }

    //设置位置和层级
    private _setupPosAndZIndex(){
        this._pos = this._getPosByCfg(this._lessonCfg);
        let showType = this._lessonCfg.LessonShow || LEVEL_NODE_SHOW_TYPE.NONE;
        let zindex = 640 - this._pos.y;
        showType != LEVEL_NODE_SHOW_TYPE.NONE && (zindex += 50);
        this._zIndex = zindex;
    }

    private _addLevelNodeTag(){
        let showType = this._lessonCfg.LessonShow || LEVEL_NODE_SHOW_TYPE.NONE;
        switch(showType){
            case LEVEL_NODE_SHOW_TYPE.NONE:
                break;
            case LEVEL_NODE_SHOW_TYPE.ROLE:
                LESSON_STATE.PASS != this.lessonState ? this._loadModel() : this._releaseModel();
                break;
            case LEVEL_NODE_SHOW_TYPE.REWARD:
                LESSON_STATE.PASS != this.lessonState ? this._loadReward() : this._removeReward();
                break;
        }
    }

    private _removeLevelNodeTag(){
        let showType = this._lessonCfg.LessonShow || LEVEL_NODE_SHOW_TYPE.NONE;
        switch(showType){
            case LEVEL_NODE_SHOW_TYPE.NONE:
                break;
            case LEVEL_NODE_SHOW_TYPE.ROLE:
                this._releaseModel();
                break;
            case LEVEL_NODE_SHOW_TYPE.REWARD:
                this._removeReward();
                break;
        }
    }

    private _loadReward(){
        let rewardStr = this._lessonCfg.LessonRewardShow || null;
        if(!rewardStr) return;
        let rewardArr = utils.parseStingList(rewardStr);
        if(!rewardArr || rewardArr.length == 0) return;

        let reward = rewardArr[0];
        if(!cc.isValid(this._itemBag)){
            this._itemBag = ItemBagPool.get();
            let btnComp = this._itemBag.getComponent(cc.Button);
            cc.isValid(btnComp) && (btnComp.enabled = false);
            this.rewardRootNode.addChild(this._itemBag.node);
        }
        this._itemBag.init({
            id: parseInt(reward[0]),
            count: parseInt(reward[1])
        });
    }

    private _removeReward(){
        if(!cc.isValid(this._itemBag)) return;
        let btnComp = this._itemBag.getComponent(cc.Button);
        cc.isValid(btnComp) && (btnComp.enabled = true);
        ItemBagPool.put(this._itemBag);
        this._itemBag = null;
    }

    refreshState() {
        let isPass = LESSON_STATE.PASS == this.lessonState;
        isPass && this._removeLevelNodeTag();
        this.isPassed.active = isPass;
    }

    updatePosWithMoveRole(isWithMoveRole: boolean, actionTime: number = ROLE_MOVE_TIME) {
        let target : cc.Node = null;
        let tipsType = this._lessonCfg.LessonShow || LEVEL_NODE_SHOW_TYPE.NONE;
        switch(tipsType){
            case LEVEL_NODE_SHOW_TYPE.ROLE:
                target = this.modelParent;
                break;
            case LEVEL_NODE_SHOW_TYPE.REWARD:
                target = this.rewardRootNode;
                break;
        }
        if(!cc.isValid(target)) return;

        let subPosX: number = 0;
        if(isWithMoveRole && target.x == 0) {
            let isToLeft = this._lessonCfg.LessonModelOrientation && parseInt(this._lessonCfg.LessonModelOrientation) == MODEL_FORWARD.LEFT;
            subPosX = isToLeft ? 50 : -50;
        } else if(!isWithMoveRole && target.x != 0){
            subPosX = -target.x;
        }
        cc.Tween.stopAllByTarget(target);
        if(subPosX == 0) return;

        cc.tween(target)
          .by(actionTime, {position: cc.v3(subPosX, 0, 0)})
          .start();
    }

    onClickItem() {
        if (this._clickHandle) {
            this._clickHandle(this._lessonCfg.LessonId, this.lessonState);
            audioManager.playSfx(SFX_TYPE.BUTTON_CLICK);
        }
    }

    private _loadModel() {
        let model = this._lessonCfg.LessonModelName;
        if(!model) return;
        if(!cc.isValid(this._itemModelSpineCmp)) {
            this._itemModelSpineCmp =  ItemModelSpinePool.get();
            this.modelParent.addChild(this._itemModelSpineCmp.node);
        }
        let isForwardRight = this._lessonCfg.LessonModelOrientation && Number(this._lessonCfg.LessonModelOrientation) == MODEL_FORWARD.LEFT ? false : true;
        let scale = this._lessonCfg.LessonModelSize ? (Number(this._lessonCfg.LessonModelSize) / 10000) : 0.3;
        this._itemModelSpineCmp.init(model, isForwardRight, scale);
    }

    private _releaseModel() {
        if(!cc.isValid(this._itemModelSpineCmp)) return;
        ItemModelSpinePool.put(this._itemModelSpineCmp);
        this._itemModelSpineCmp = null;
    }

    private _getPosByCfg(lessonCfg: cfg.AdventureLesson): cc.Vec2 {
        let posList = lessonCfg.LessonNodeCoordinate.split(';');
        let pos = cc.v2(parseFloat(posList[0]), parseFloat(posList[1]));
        return pos;
    }

    private _getState(): LESSON_STATE {
        let lessonIsPass = this._checkLessonIsPass(this._lessonCfg.LessonId);
        let curChapter = pveData.getCurrChapterId();
        if(this._lessonCfg.LessonChapter < curChapter) {
            //没有前置关卡，目前只有第一章第一关
            if(!this._lessonCfg.LessonOrder){
                return lessonIsPass ? LESSON_STATE.PASS : LESSON_STATE.UNLOCK
            }

            let preLessonIsPass = this._checkLessonIsPass(this._lessonCfg.LessonOrder);
            if(!preLessonIsPass){
                return LESSON_STATE.LOCK;
            }
            return lessonIsPass ? LESSON_STATE.PASS : LESSON_STATE.UNLOCK
        }

        if(this._lessonCfg.LessonChapter > curChapter) {
            return LESSON_STATE.LOCK;
        }

        if(!this._lessonCfg.LessonOrder) {
            return lessonIsPass ? LESSON_STATE.PASS : LESSON_STATE.UNLOCK;
        }

        let preLessonIsPass = this._checkLessonIsPass(this._lessonCfg.LessonOrder);
        if(preLessonIsPass) {
            return lessonIsPass ? LESSON_STATE.PASS : LESSON_STATE.UNLOCK;
        }

        return LESSON_STATE.LOCK;
    }

    private _checkLessonIsPass(lessonId: number): boolean {
        return pveData.records[lessonId] && pveData.records[lessonId].Past;
    }
}
