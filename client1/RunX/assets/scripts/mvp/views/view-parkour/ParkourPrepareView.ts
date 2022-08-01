import { ViewBaseComponent } from '../../../common/components/ViewBaseComponent';
import { eventCenter } from '../../../common/event/EventCenter';
import { CustomDialogId, SCENE_NAME, VIEW_NAME } from "../../../app/AppConst";
import guiManager from '../../../common/GUIManager';
import List from '../../../common/components/List';
import DragableItem from '../../../common/components/DragableItem';
import RolePreviewComp from './RolePreviewComp';
import {NOT_EXIST_HERO_ID} from './ParkourConst';
import { bagData } from '../../models/BagData';
import { pveData } from '../../models/PveData';
import { data } from '../../../network/lib/protocol';
import HeroUnit from '../../template/HeroUnit';
import GuideBtnComp from '../view-guide/GuideBtnComp';
import HeroHeadItem from '../view-preinstall/HeroHeadItem';
import { SpriteLoader } from '../../../common/ui-helper/SpriteLoader';
import ItemHeadSquare from '../view-item/ItemHeadSquare';
import { localStorageMgr, SAVE_TAG } from '../../../common/LocalStorageManager';
import { cfg } from '../../../config/config';
import { configManager } from '../../../common/ConfigManager';
import { PVE_MODE } from '../../../app/AppEnums';
import { utils } from '../../../app/AppUtils';
import StepWork from "../../../common/step-work/StepWork";
import { ItemHeroHeadSquarePool } from '../../../common/res-manager/NodePool';


/*
 * @Description: 跑酷预设编队
 * @Autor: lixu
 * @Date: 2021-05-19 13:25:56
 * @LastEditors: lixu
 * @LastEditTime: 2021-05-20 15:41:47
 */
const {ccclass, property} = cc._decorator;
const MAX_ROLE_COUNT = 5;

const ActorPos = cc.v2(0, -15);
const RoleNodeName = 'actor';

@ccclass
export default class ParkourPrepareView extends ViewBaseComponent {
    @property(cc.Sprite) bgSp: cc.Sprite = null;
    @property(cc.Node) preInstallNode: cc.Node = null;
    @property(cc.Node) centerNode: cc.Node = null;
    @property(List) roleList: List = null;
    @property(cc.Prefab) actorPrefab: cc.Prefab = null;
    @property(cc.Prefab) teamRoleHeadPfb: cc.Prefab = null;

    @property(cc.Label) title: cc.Label = null;
    @property(cc.ProgressBar) longClickPb: cc.ProgressBar = null;

    private _preInstallTeam: cc.Node[] = null;

    private _seleRoleArr: number[] = null;
    private _allRoleArr: number[] = null;

    private _isTest: boolean = false;   //地形测试
    private _currPreinstallTeam: data.ITeamInfo = null; //当前的预设编队
    private _roleNodePool: cc.NodePool = null;
    private _spLoader: SpriteLoader = null;
    private _itemHeads: HeroHeadItem[] = [];

    preInit(): Promise<any> {
        this._spLoader = this._spLoader || new SpriteLoader();
        let pveCfg = pveData.pveConfig;
        let bgName: string = null;
        if(pveCfg && (pveCfg.adventureCfg || pveCfg.dailyCfg)){
            bgName = pveCfg.adventureCfg ? pveCfg.adventureCfg.LessonFightScene :
                            pveCfg.dailyCfg.PVEDailyLessonFightBg;
        }
        if(!bgName) return Promise.resolve();
        return this._spLoader.changeSpriteP(this.bgSp, bgName);
    }

    onInit(...params: any[]){
        params && params.length != 0 && (this._isTest = params[0]);
        this._roleNodePool = this._roleNodePool || new cc.NodePool(RolePreviewComp);
        this._preInstallTeam = this._preInstallTeam || [];
        this._seleRoleArr = this._seleRoleArr || [];
        this._getFirstEmptyPos();
        this._allRoleArr = this._getAllRoles();
        this._sortRoles();
        this._preSetupTeams();
        this.preInstallNode.x = cc.winSize.width / 2 + this.preInstallNode.width;
        this.preInstallNode.active = false;
        this._initUI();
        this._genAsyncWork();
    }

    deInit() {
        this.releaseSubView();
        this.unscheduleAllCallbacks();
        eventCenter.unregisterAll(this);
        let maxRoleCount = 5;
        for(let i = 0; i < maxRoleCount; i++){
            let actorNode = cc.find(`Role_${i + 1}/${RoleNodeName}`, this.centerNode);
            if(cc.isValid(actorNode))
              this._roleNodePool.put(actorNode);
        }
        this.roleList._deInit();
        this._preInstallTeam && (this._preInstallTeam.length = 0);
        this._preInstallTeam = null;
        this._seleRoleArr && (this._seleRoleArr.length = 0);
        this._seleRoleArr = null;
        this._allRoleArr && (this._allRoleArr.length = 0);
        this._allRoleArr = null;
        this._roleNodePool.clear();
        this._roleNodePool = null;
        this._currPreinstallTeam = null;
        this._isTest = false;
    }

    private _initUI(){
        utils.setSingleTouch(this.roleList.getComponent(cc.ScrollView));
        this.onLongClickInterrupted();
        this.title.string = "";
        if (!pveData.pveConfig) return;
        if (pveData.pveConfig.pveMode == PVE_MODE.ADVENTURE_LESSON) {
            this.title.string = "冒险";
            return;
        }
        if (pveData.pveConfig.pveListId) {
            let pveListCfg: cfg.PVEList = configManager.getConfigByKey("pveList", pveData.pveConfig.pveListId);
            if (pveListCfg) {
                this.title.string = pveListCfg.PVEListName;
                return;
            }
        }
    }

    //设置默认阵容
    private _preSetupTeams(){
        let localTeam = localStorageMgr.getAccountStorage(SAVE_TAG.PARKOUR_LAST_TEAM);
        let lastTeam: number[] = localTeam || [];
        lastTeam.forEach(ele => {
          if(ele == NOT_EXIST_HERO_ID) return;
          let index = this._allRoleArr.indexOf(ele);
          if(index != -1) this._allRoleArr.splice(index, 1);
        });

        for(let i = 1; i <= MAX_ROLE_COUNT; i++){
            if(lastTeam.length < i) lastTeam.push(NOT_EXIST_HERO_ID);
            if(lastTeam[i - 1] == NOT_EXIST_HERO_ID && this._allRoleArr.length > 0){
                let ele = this._allRoleArr.shift();
                lastTeam[i - 1] = ele;
            }
        }

        lastTeam.forEach((ele, index) => {
            if(ele == NOT_EXIST_HERO_ID) return;
            this._seleRoleArr[index] = ele;
        });
    }

    private _genAsyncWork(){
        this._loadDefaultTeam();
        this._initPresetGroup();

        this.roleList.setupExternalPool(ItemHeroHeadSquarePool)
        this.roleList.numItems = this._allRoleArr.length;
    }

    private _loadDefaultTeam(){
        if(!this._seleRoleArr || this._seleRoleArr.length == 0) return;

        let stepWork: StepWork = null;
        this._seleRoleArr.forEach((ele, index) => {
            if(ele == NOT_EXIST_HERO_ID) return;
            stepWork = stepWork || new StepWork();
            stepWork.addTask(() => {
              this._changeRoleView(index, null);
            });
        });
        stepWork && this.stepWork.addSubWork(stepWork);
    }

    //预设编队
    onClickPreviewGroup(){
        this._resetPresetGroup();
        this._openPreInstallView();
    }

    //使用预设阵容
    private _usePreinstallTeam(){
        this._getFirstEmptyPos();
        this._allRoleArr = this._getAllRoles();
        this._sortRoles();
        let heros = this._currPreinstallTeam.Heroes;
        let maxRoleCount = 5;
        for(let i = 0; i < maxRoleCount; i++){
            let heroId = heros[`${i}`];
            this._seleRoleArr[i] = heroId || NOT_EXIST_HERO_ID;
            if(heroId){
                let idx1 = this._allRoleArr.indexOf(this._seleRoleArr[i]);
                if(idx1 != -1) this._allRoleArr.splice(idx1, 1);
                this._changeRoleView(i, null)
            }else{
                let actorNode = cc.find(`Role_${i + 1}/${RoleNodeName}`, this.centerNode);
                if(cc.isValid(actorNode))
                    this.removeOnLineRole(actorNode, i, null);
            }
        }
        this.roleList.numItems =  this._allRoleArr.length;
    }

    private _openPreInstallView(){
        let closeBtn = cc.find('rootNode/PRE_SET_BG', this.node);
        closeBtn.active = false;
        this._currPreinstallTeam = null;
        this.preInstallNode.x = cc.winSize.width / 2 + this.preInstallNode.width;
        this.preInstallNode.active = true;
        cc.tween(this.preInstallNode).to(0.1, {x: cc.winSize.width / 2}, {easing: 'circIn'}).call(() =>{
            closeBtn.active = true;
        }).start();
    }

    closePreInstallView(){
        cc.Tween.stopAllByTarget(this.preInstallNode);
        let closeBtn = cc.find('rootNode/PRE_SET_BG', this.node);
        cc.tween(this.preInstallNode).to(0.1, {x: cc.winSize.width / 2 + this.preInstallNode.width}, {easing: 'circOut'}).call(() => {
            this.preInstallNode.active = false;
            closeBtn.active = false;
        }).start();
    }

    private _checkStartGame(): boolean{
        let hasOnlineHero: boolean  = false;
        this._seleRoleArr.forEach(ele => {
            if(ele != 0){
                hasOnlineHero = true;
            }
        });
        if(!hasOnlineHero){
            guiManager.showDialogTips(CustomDialogId.PARKOUR_ONE_ROLE_LEAST);
            return false;
        }
        return true;
    }

    //开始游戏
    onClickStartGame(){
        if(!this._checkStartGame())  return;
        localStorageMgr.setAccountStorage(SAVE_TAG.PARKOUR_LAST_TEAM, utils.deepCopyArray(this._seleRoleArr));
        
        guiManager.loadScene(SCENE_NAME.RUN_COOL, this._isTest, this._seleRoleArr.filter(ele => {return ele > 0})).then(() => {
            this.closeView();
        });
    }

    //初始化预设编队
    private _initPresetGroup(){
        let preInstallData =  pveData.presetTeams;
        let isEmpty: boolean = !preInstallData || Object.keys(preInstallData).length == 0;
        if(!isEmpty){
            let keys = Object.keys(preInstallData);
            isEmpty = !keys.some(ele => {
                let teamInfo = preInstallData[ele];
                return teamInfo && teamInfo.Heroes && Object.keys(teamInfo.Heroes).length > 0;
            });
        }

        cc.find('NoTeamTip', this.preInstallNode).active = isEmpty;
        let ScrollView = cc.find('ScrollView', this.preInstallNode);
        let contentNode = cc.find('view/content', ScrollView);
        contentNode.children.forEach(elem => {
            elem.active = false;
            this._preInstallTeam.push(elem);
        })
        ScrollView.active = !isEmpty;
        if(isEmpty) return;

        let worker: StepWork = null;
        let maxTeams: number = 5;
        for (let i = 0; i < maxTeams; ++i) {
            let data = preInstallData[`${i}`];
            if(data && data.Heroes && Object.keys(data.Heroes).length > 0){
                worker = worker || new StepWork();
                this._refreshTeamView(data, i, worker);
            }
        }

        let layoutComp = contentNode.getComponent(cc.Layout);
        layoutComp.updateLayout();
        let contentHeight = contentNode.height;
        contentHeight = Math.max(contentHeight, ScrollView.height);
        contentNode.height = contentHeight;
        worker && this.stepWork.addSubWork(worker);
    }

    private _resetPresetGroup(){
        if(!this._preInstallTeam || this._preInstallTeam.length == 0) return;
        let content = cc.find('ScrollView/view/content', this.preInstallNode);
        content.getComponent(cc.ToggleContainer).allowSwitchOff = true;
        this._preInstallTeam.forEach(ele=>{
            ele.getComponent(cc.Toggle).isChecked = false;
        });
    }

    private _refreshTeamView(teamData: data.ITeamInfo, idx: number, worker: StepWork) {
        let heros = teamData.Heroes;
        this._preInstallTeam[idx].active = true;
        (this._preInstallTeam[idx] as any).data = teamData;
        let teamNode: cc.Node = cc.find('Layout' , this._preInstallTeam[idx]);
        let count: number = 5;

        for (let i = 0; i < count; ++i) {
            //分帧加载
            worker.addTask(() => {
                let heroHeadItem: cc.Node = teamNode.children[i];
                if (!heroHeadItem) {
                    heroHeadItem = cc.instantiate(this.teamRoleHeadPfb);
                    heroHeadItem.scale = 0.7;
                    teamNode.addChild(heroHeadItem);
                    let comp = heroHeadItem.getComponent(HeroHeadItem);
                    this._itemHeads.push(comp);
                }
                heroHeadItem.getComponent(HeroHeadItem).setData((heros as any)[`${i}`], true, null, ()=> {});
            })   
        }
    }

    //返回
    onClickBack(){
      this.closeView();
    }

    //改变预设编队
    onPreInstallTeamSele(toggle: cc.Toggle){
        let content = cc.find('ScrollView/view/content', this.preInstallNode);
        if(!this._currPreinstallTeam){
            content.getComponent(cc.ToggleContainer).allowSwitchOff = true;
        }
        let node = toggle.node;
        let data = (node as any).data;
        if(JSON.stringify(this._currPreinstallTeam) == JSON.stringify(data)) return;
        this._currPreinstallTeam = data;
        content.getComponent(cc.ToggleContainer).allowSwitchOff = false;
        this._usePreinstallTeam();
        guiManager.showDialogTips(99000057);
    }

    onRoleListRender(item: cc.Node, idx: number){
        item.active = true;
        let comp = item.getComponent(ItemHeadSquare);
        comp.init(this._allRoleArr[idx], null, null);
        let dragComp = item.getComponent(DragableItem);
        if(!dragComp){
            dragComp = item.addComponent(DragableItem);
        }
        dragComp.init(this.roleList.node.getComponent(cc.ScrollView), this.centerNode, true, undefined, this._onItemClick.bind(this),
            this._onItemDrag.bind(this), this._onItemUsed.bind(this), this._onHeadLongClick.bind(this), idx);
        dragComp.longClickProgressCb = this.onLongClickProgressChanged.bind(this);
        dragComp.longClickInterruptCb = this.onLongClickInterrupted.bind(this);
    }

    private _onHeadLongClick(idx: number){
        this.openRolePropertyView({ID: this._allRoleArr[idx]});
    }

    private _onItemClick(comp: DragableItem, idx: number): boolean{
        let emptyPosIdx = this._getFirstEmptyPos();
        if(emptyPosIdx === -1) return false;
        let oldRoleID = this._seleRoleArr[emptyPosIdx];
        if(oldRoleID === this._allRoleArr[idx]) return false;
        this._seleRoleArr[this._getFirstEmptyPos()] = this._allRoleArr[idx];
        this._allRoleArr.splice(idx, 1);
        this._changeRoleView(emptyPosIdx, oldRoleID);
        let guideBtnComp = comp.node.getComponent(GuideBtnComp);
        cc.isValid(guideBtnComp) &&  guideBtnComp.onGuideTrigged();
        return true;
    }

    private _onItemDrag(comp: DragableItem, node: cc.Node, idx: number): boolean{
        let willReplaceIdx = this._getWillPlacePosInDrag(node, idx);
        if(willReplaceIdx == -1) return false;
        //替换的是同一个英雄(理论上是不存在这种情况)
        if(this._seleRoleArr[willReplaceIdx] === this._allRoleArr[idx]) return false;
        let oldRoleID = this._seleRoleArr[willReplaceIdx];
        this._seleRoleArr[willReplaceIdx] = this._allRoleArr[idx];
        this._changeRoleView(willReplaceIdx, oldRoleID);
        this._allRoleArr.splice(idx, 1);
        if(oldRoleID != 0){
            this._allRoleArr.push(oldRoleID);
            this._sortRoles();
        }
        return true;
    }

    private _onItemUsed(comp: DragableItem, idx: number, cb: Function){
        this.roleList.numItems = this._allRoleArr.length;
        cb && cb();
    }

    /**
     * @description: 查找空缺位置
     * @author: lixu
     */
    private _getFirstEmptyPos(): number{
        let len = this._seleRoleArr.length;
        let lackCount = MAX_ROLE_COUNT - len;
        if(lackCount > 0){
            for(let i = 0; i < lackCount; i++){
                this._seleRoleArr.push(0);
            }
        }
        return this._seleRoleArr.indexOf(NOT_EXIST_HERO_ID);
    }

    switchOnlineRoleViewTag(idx: number){
        if(idx < 0 || idx >= this._seleRoleArr.length) return;
        let roleID = this._seleRoleArr[idx];
        let tag = cc.find(`Role_${idx + 1}/bg1`, this.centerNode);
        tag.active = (roleID == NOT_EXIST_HERO_ID);
    }

    private _changeRoleView(idx: number, oldRoleID: number){
        let actorNode = cc.find(`Role_${idx + 1}/${RoleNodeName}`, this.centerNode);
        if(!cc.isValid(actorNode, true)){
            let parent = cc.find(`Role_${idx + 1}`, this.centerNode);
            actorNode = this._getRoleNode();
            actorNode.setPosition(ActorPos);
            actorNode.parent = parent;
        }

        let rolePreviewComp = actorNode.getComponent(RolePreviewComp);
        rolePreviewComp.setPreviewComp(this, this._seleRoleArr[idx], idx);
        this.switchOnlineRoleViewTag(idx);
    }

    //获取拖动将要替换的位置
    private _getWillPlacePosInDrag(node: cc.Node, idx: number):number{
        this._getFirstEmptyPos();
        let index = -1;
        for(let i = 0, len = this._seleRoleArr.length; i < len; i++){
            let parent = cc.find(`Role_${i + 1}`, this.centerNode);
            if(parent.getBoundingBoxToWorld().containsRect(node.getBoundingBoxToWorld())){
                index = i;
                break;
            }
        }
        return index;
    }

    /**
     * @description:
     * @param {cc} node
     * @return {*} -2: 卸下当前英雄；-1：换位失败，返回原位；其他：换位的索引
     * @author: lixu
     */
    getWillPlacePosWhenDragRole(node: cc.Node, sortIdx: number):number{
        this._getFirstEmptyPos();
        let index = -2;
        let pos = node.parent.convertToWorldSpaceAR(node.getPosition());
        for(let i = 0, len = this._seleRoleArr.length; i < len; i++){
            let parent = cc.find(`Role_${i + 1}`, this.centerNode);
            if(parent.getBoundingBoxToWorld().contains(pos)){ //说明想换位
                index = i;
                break;
            }
        }
        //与之前相同的顺位
        if(sortIdx == index){
            index = -1;
        }
        return index;
    }

    /**
     * 卸下已经选定的英雄
     * @param node
     * @param callback
     * @returns
     */
    removeOnLineRole(node: cc.Node, sortIdx: number, callback: Function){
        this._removeOnLineRole(sortIdx);
        this.switchOnlineRoleViewTag(sortIdx);
        this.roleList.numItems = this._allRoleArr.length;
        if(!cc.isValid(node)){
            callback && callback();
            return;
        }
        callback && callback();
        this._roleNodePool.put(node);
    }

    //交换两个占位上的英雄
    switchOnLineRole(idxA: number,  idxB: number){
        this._getFirstEmptyPos();
        let a = this._seleRoleArr[idxA];
        this._seleRoleArr[idxA] = this._seleRoleArr[idxB];
        this._seleRoleArr[idxB] = a;
    }

    //获取指定占位上的节点
    getRoleNodeWithIdx(idx: number): cc.Node{
        if(idx < 0 || idx >= this._seleRoleArr.length) return null;
        let node = cc.find(`Role_${idx + 1}`, this.centerNode);
        return node;
    }

    private _removeOnLineRole(sortIdx: number){
        let roleID = this._seleRoleArr[sortIdx];
        this._seleRoleArr[sortIdx] = 0;

        if(this._allRoleArr.indexOf(roleID) == -1 && roleID != NOT_EXIST_HERO_ID){
            this._allRoleArr.push(roleID);
            this._sortRoles();
        }
    }

    onLongClickInterrupted(){
        this.longClickPb.node.active = false;
    }

    onLongClickProgressChanged(progress: number, pos: cc.Vec2){
        this.longClickPb.progress = progress;
        if(pos){
            let localPos = this.node.convertToNodeSpaceAR(pos)
            this.longClickPb.node.x = localPos.x;
            this.longClickPb.node.y = localPos.y;
        }
        this.longClickPb.node.active = true;
    }

    onRelease(){
        this.deInit();
        this._itemHeads.forEach( _h => {
            _h.deInit();
            _h.node.removeFromParent()
        })
        this._itemHeads = []
        this._spLoader && this._spLoader.release();
        this._spLoader = null;
    }

    private _getRoleNode(): cc.Node{
        if(this._roleNodePool.size() > 0){
            return this._roleNodePool.get(this);
        }
        let actorNode = cc.instantiate(this.actorPrefab);
        actorNode.name = RoleNodeName;
        let comps = actorNode.getComponents(cc.BoxCollider);
        comps.forEach(ele=>{
            actorNode.removeComponent(ele);
        });
        actorNode.addComponent(RolePreviewComp).onInit(this);
        return actorNode;
    }

    openRolePropertyView(heroUnit: data.IBagUnit){
        this.loadSubView(VIEW_NAME.TIPS_HERO, heroUnit.ID);
    }

    private _sortRoles() {
        this._allRoleArr.sort((_a, _b) => {
            let aUnit: HeroUnit = new HeroUnit(_a);
            let bUnit: HeroUnit = new HeroUnit(_b);
            return bUnit.getCapability() - aUnit.getCapability();
        });
    }

    private _getAllRoles(){
        let arr: number[] = [];
        bagData.heroList.forEach(ele => {
            arr.push(ele.ID);
        });
        return arr;
    }
}

export {
    ActorPos,
    RoleNodeName,
    NOT_EXIST_HERO_ID
}
