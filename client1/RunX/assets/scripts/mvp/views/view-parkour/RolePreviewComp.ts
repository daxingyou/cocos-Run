import {GROUPS_OF_NODE, ParkourRoleActions, getParkRoleSpinePath} from './ParkourConst';
import ParkourPrepareView, {ActorPos, RoleNodeName} from './ParkourPrepareView';
import {NOT_EXIST_HERO_ID} from './ParkourConst';
import { configUtils } from '../../../app/ConfigUtils';
import skeletonManager from '../../../common/SkeletonManager';
import RoleShadowComp from './RoleShadowComp';
import UIClick, {ClickType} from '../../../common/components/UIClick'
import { battleUtils } from '../../../app/BattleUtils';

/*
 * @Description:
 * @Autor: lixu
 * @Date: 2021-05-20 15:12:12
 * @LastEditors: lixu
 * @LastEditTime: 2021-12-06 14:29:46
 */

const {ccclass, property} = cc._decorator;

const LONG_CLICK_TIME = 1.5;
const MIN_DRAG_DIS = 20;

@ccclass
export default class RolePreviewComp extends cc.Component {

    static currDagItem: RolePreviewComp = null;
    private _startPos: cc.Vec2 = null;
    private _originalParent: cc.Node = null;
    private _previewComp: ParkourPrepareView = null;
    private _roleID: number = NOT_EXIST_HERO_ID;
    private _sortIdx: number = NaN;
    private _roleSpineRes: string = null;

    private _shadowComp: RoleShadowComp = null;

    get sortIdx():number{
        return this.sortIdx;
    }

    set sortIdx(sortIdx: number){
        this._sortIdx = sortIdx;
    }

    get roleID(): number{
        return this._roleID;
    }

    onInit(prepareComp: ParkourPrepareView){
        let bloodPro = cc.find("HpBar", this.node);
        bloodPro.active = false;
        this._shadowComp = this.node.getChildByName('Shadow').getComponent(RoleShadowComp);
        if(!cc.isValid(this.node.getComponent(UIClick))){
            let uiClickComp = this.node.addComponent(UIClick);
            uiClickComp.isDrag = true;
            uiClickComp.clickHandler = this._onUIClick.bind(this);
            uiClickComp.longClickProgressCb = this._onLongClickProgressChanged.bind(this);
        }
    }

    private _onUIClick(eventType: ClickType, target: cc.Node){
        if(eventType == ClickType.TouchStart){
            this._onTouchStart();
        }

        if(eventType == ClickType.Click){
            this._removeCurrRole();
            this._reset();
        }

        if(eventType == ClickType.LongClick){
            this._onLongClicked();
        }

        if(eventType == ClickType.DragEnd){
            this._onDragEnd();
        }

        if(eventType == ClickType.InterruptLongClick){
            this._onLongClickInterrupted();
        }
    }

    private _onLongClickInterrupted(){
        cc.isValid(this._previewComp) && this._previewComp.onLongClickInterrupted();
    }

    private _onLongClicked() {
        this._previewComp.openRolePropertyView({ID: this._roleID});
        this.node.parent = this._originalParent;
        this.node.setPosition(this._startPos);
        this._reset();
    }

    setPreviewComp(previewComp: ParkourPrepareView, roleID: number, sortIdx: number){
        this._previewComp = previewComp;
        this._roleID = roleID;
        this._sortIdx = sortIdx;
        if(this._roleID == NOT_EXIST_HERO_ID) return;
        let model = configUtils.getModelConfig(configUtils.getHeroBasicConfig(this._roleID).HeroBasicModel);
        let modelName = model && model.ModelAttack;    //默认的模型
        let scale = model && model.ModelRunSize;
        if(!model){
            cc.warn('RolePreviewComp', `role ${this._roleID} has not model data!!!`);
            modelName = 'beibo';
            scale = 10000;
        }
        scale = scale / 10000 * 1.3;
        if(!this._roleSpineRes || this._roleSpineRes != model.ModelAttack){
            let wizeardNode = cc.find('wizeard', this.node);
            let spineComp = wizeardNode.getComponent(sp.Skeleton);
            spineComp.skeletonData = null;
            skeletonManager.loadSkeletonData(getParkRoleSpinePath(modelName)).then(data => {
                this._setModelSize(scale);
                let spineComp = wizeardNode.getComponent(sp.Skeleton);
                spineComp.skeletonData = data;
                this.playAnim();
            });
            return;
        }
        this._setModelSize(scale);
        this.playAnim();
    }

    private _setModelSize(scale: number){
        scale = scale || 1;
        let wizeardNode = cc.find('wizeard', this.node);
        if(!cc.isValid(wizeardNode)) return;
        wizeardNode.scale = scale;
    }

    start(){
        this._setGroupToDefault(this.node);
    }

    deInit(){
        battleUtils.removeClickComp(this.node);
        this._previewComp = null;
    }

    playAnim(){
        this._clearAnim();
        let wizeardNode = cc.find('wizeard', this.node);
        let spineComp = wizeardNode.getComponent(sp.Skeleton);
        spineComp.setAnimation(0, ParkourRoleActions.Idle, true);
        this._shadowComp.node.width = wizeardNode.width * wizeardNode.scaleX;
    }

    private _clearAnim(){
        let wizeardNode = cc.find('wizeard', this.node);
        let spineComp = wizeardNode.getComponent(sp.Skeleton);
        spineComp.clearTracks();
    }

    private _setGroupToDefault(node: cc.Node){
        node.groupIndex = GROUPS_OF_NODE.DEFAULT;
        if(node.childrenCount > 0){
            node.children.forEach((ele) => {
                this._setGroupToDefault(ele);
            });
        }
    }

    private _onTouchStart(){
        if(RolePreviewComp.currDagItem) return;
        RolePreviewComp.currDagItem = this;
        this._startPos = this.node.getPosition();
        this._originalParent = this.node.parent;
        let pos = this.node.parent.parent.convertToNodeSpaceAR(this._originalParent.convertToWorldSpaceAR(this._startPos));
        this.node.parent = this.node.parent.parent;
        this.node.setPosition(pos);
    }

    private _onDragEnd(){
        if(RolePreviewComp.currDagItem != this) return;
        if(this._previewComp){
            let idx = this._previewComp.getWillPlacePosWhenDragRole(this.node, this._sortIdx);
            if(idx == -1){
                this._moveToOriginalPos();
            }

            if(idx == -2){
                this._removeCurrRole();
            }

            if(idx >=0){
                this._switchRolesWithIdx(idx);
            }
        }
    }

    private _moveToOriginalPos(){
        let pos = this.node.parent.parent.convertToNodeSpaceAR(this._originalParent.convertToWorldSpaceAR(this._startPos));
        cc.tween(this.node).to(0.1, {x: pos.x, y: pos.y}, {easing:'smooth'}).call(() => {
            this.node.parent = this._originalParent;
            this.node.setPosition(this._startPos);
            this._reset();
        }).start();
    }

    private _removeCurrRole(){
        if(this._previewComp){
            this._previewComp.removeOnLineRole(this.node, this._sortIdx, () => {
                this._reset();
                this._roleID = NOT_EXIST_HERO_ID;;
            })
        }
    }

    private _switchRolesWithIdx(idx: number){
        if(!this._previewComp) return;
        let target = this._previewComp.getRoleNodeWithIdx(idx);
        if(cc.isValid(target)){
            let targetRoleNode = cc.find(RoleNodeName, target);
            this._previewComp.switchOnLineRole(idx, this._sortIdx);
            if(cc.isValid(targetRoleNode)){
                let comp = targetRoleNode.getComponent(RolePreviewComp);
                comp.sortIdx = this._sortIdx;
            }
            let oldSortIdx = this._sortIdx;
            this._sortIdx = idx;

            if(cc.isValid(targetRoleNode)){
                let pos = targetRoleNode.getPosition();
                pos = target.parent.convertToNodeSpaceAR(target.convertToWorldSpaceAR(pos));
                targetRoleNode.setPosition(pos);
                targetRoleNode.parent = target.parent;
                let targetPos = target.parent.convertToNodeSpaceAR(this._originalParent.convertToWorldSpaceAR(this._startPos));
                cc.tween(targetRoleNode).to(0.1, {x: targetPos.x, y: targetPos.y}).call(() => {
                    targetRoleNode.parent = this._originalParent;
                    targetRoleNode.setPosition(this._startPos);
                }).start();
            }
            let targetPos = target.parent.convertToNodeSpaceAR(target.convertToWorldSpaceAR(ActorPos));
            cc.tween(this.node).to(0.1, {x: targetPos.x, y: targetPos.y}, {easing: 'smooth'}).call(() => {
                this._previewComp.switchOnlineRoleViewTag(this._sortIdx);
                this._previewComp.switchOnlineRoleViewTag(oldSortIdx);
                this.node.parent = target;
                this.node.setPosition(ActorPos);
                this._reset();
            }).start();
        }
    }

    private _onLongClickProgressChanged(progress: number, pos: cc.Vec2){
        if(!cc.isValid(this._previewComp)) return;
        this._previewComp.onLongClickProgressChanged(progress, pos);
    }

    unuse(){
        cc.Tween.stopAllByTarget(this.node);
        this._clearAnim();
        this._reset();

        this._previewComp = null;
        this._roleID = NOT_EXIST_HERO_ID;
        this._sortIdx = NaN;
        RolePreviewComp.currDagItem = null;
    }

    reuse(){

    }

    private _reset(){
        RolePreviewComp.currDagItem = null;
        this._originalParent = null;
        this._startPos = null;
    }
}
