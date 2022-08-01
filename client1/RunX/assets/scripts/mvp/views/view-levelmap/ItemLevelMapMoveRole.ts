import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { ItemModelSpinePool } from "../../../common/res-manager/NodePool";
import { userData } from "../../models/UserData";
import ItemModelSpine, { ANIMATION_TYPE } from "../view-item/ItemModelSpine";
import { MODEL_FORWARD, MOVE_END_INFO, ROLE_MOVE_INFO } from "./LevelMapView";

const MOVE_ROLE_SCALE: number = 0.3;

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemLevelMapMoveRole extends cc.Component {
    @property(cc.Node) roleSpineParent: cc.Node = null;

    private _modelName: string = '';
    private _itemModelSpineCmp: ItemModelSpine = null;
    private _isMoving: boolean = false;
    private _roleMoveSpeed: number = 200;
    private _defaultSpeed: number = 0;
    private _stdCostTime: number = 0;

    init(moveEndInfo: MOVE_END_INFO) {
        this._setupDefaultParams();
        this._dueData();
        this._loadModel();
        this._refreshRoleView(moveEndInfo);
    }

    deInit() {
        this.stopMoving();
        this._releaseModel();
    }

    set isMoving(isMoving: boolean) {
        this._isMoving = isMoving;
    }

    get isMoving() {
        return this._isMoving;
    }

    private _dueData() {
        const headId: number = userData.headId;
        const headFrameCfg = configUtils.getHeadConfig(headId);
        if(headFrameCfg) {
            this._modelName = headFrameCfg.HeadFrameModel;
        }
    }

    private _setupDefaultParams(){
        if(this._defaultSpeed && this._stdCostTime) return;
        let roleMoveCfg = configUtils.getConfigModule('AdventureLessonMoveSpeed');
        let params = utils.parseStringTo1Arr(roleMoveCfg || '');
        if(!params || params.length == 0) return;
        this._defaultSpeed = parseFloat(params[0]);
        this._stdCostTime = parseFloat(params[1]);
    }

    private _refreshRoleView(moveEndInfo: MOVE_END_INFO) {
        this.node.setPosition(moveEndInfo.endPos);
        let forward = moveEndInfo.endForward == MODEL_FORWARD.LEFT ? (this.node.scaleX > 0 ? -this.node.scaleX : this.node.scaleX) : (this.node.scaleX > 0 ? this.node.scaleX : -this.node.scaleX)
        this.node.scaleX = forward;
    }

    //重置移速
    private _resetMoveSpeed(moveInfos: ROLE_MOVE_INFO[]){
        if(!moveInfos) return;
        let totalDis = 0;
        moveInfos.forEach((ele, idx) => {
            let endPos = ele.movingCenter;
            let distance = ele.distance;
            if(idx == 0){
                // 需要特殊处理 有可能不是在起点出发的 所以需要算下距离
                distance = cc.v2(this.node.position).sub(endPos).len();
                ele.distance = distance;
            }
            totalDis += distance;
        });

        let costTime = totalDis / this._defaultSpeed;
        this._roleMoveSpeed = costTime <= this._stdCostTime ? this._defaultSpeed : Math.ceil(totalDis / this._stdCostTime);
    }

    startMoving(moveInfos: ROLE_MOVE_INFO[], endFunc?: Function, startFunc?: Function) {
        cc.Tween.stopAllByTarget(this.node);
        this._resetMoveSpeed(moveInfos);
        if(!moveInfos) return;
        let tween = cc.tween(this.node);
        let preEndPos = cc.v2(this.node.position);
        for(let i = 0, len = moveInfos.length, lastIdx = moveInfos.length - 1; i < len; ++i) {
            let endPos = moveInfos[i].movingCenter;
            let distance = moveInfos[i].distance;
            let scaleX = moveInfos[i].movingForward == MODEL_FORWARD.LEFT ? -1 : 1;
            i == 0 &&  tween.call(() => {startFunc && startFunc();});
            i == lastIdx && (endPos = moveInfos[i].endPos);
            if(distance == 0 || (preEndPos.x == endPos.x && preEndPos.y == endPos.y)) {
                continue;
            }
            const time = distance / this._roleMoveSpeed;
            tween
                .set({scaleX: scaleX < 0 ? (this.node.scaleX < 0 ? this.node.scaleX : -this.node.scaleX) : (this.node.scaleX > 0 ? this.node.scaleX : -this.node.scaleX) })
                .to(time, {position: cc.v3(endPos)})
            if(i == lastIdx) {
                tween
                    .set({scaleX: moveInfos[i].endForward == MODEL_FORWARD.LEFT ? (this.node.scaleX > 0 ? -this.node.scaleX : this.node.scaleX) : (this.node.scaleX > 0 ? this.node.scaleX : -this.node.scaleX)})
                    .call(() => {
                        this.stopMoving();
                        endFunc && endFunc();
                    })
            }
            preEndPos = endPos;
        }
        if(moveInfos.length > 0) {
            this._setAnimation(ANIMATION_TYPE.RUN);
            this.isMoving = true;
            tween.start();
        } else {
            tween.removeSelf();
        }
    }

    stopMoving() {
        this.node.stopAllActions();
        this.isMoving = false;
        this._setAnimation(ANIMATION_TYPE.IDLE);
    }

    private _setAnimation(ani: ANIMATION_TYPE) {
        if(this._itemModelSpineCmp) {
            this._itemModelSpineCmp.setAnimation(ani);
        }
    }

    private _loadModel() {
        if(!this._itemModelSpineCmp) {
            this._itemModelSpineCmp = ItemModelSpinePool.get();
            this.roleSpineParent.addChild(this._itemModelSpineCmp.node);
            this._itemModelSpineCmp.init(this._modelName, true, MOVE_ROLE_SCALE);
        }
    }

    private _releaseModel() {
        if(this._itemModelSpineCmp) {
            this._itemModelSpineCmp.node.removeFromParent();
            ItemModelSpinePool.put(this._itemModelSpineCmp);
            this._itemModelSpineCmp = null;
        }
    }
}
