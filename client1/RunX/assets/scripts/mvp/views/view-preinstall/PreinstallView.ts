 import { CustomDialogId, PVP_MULT_BALLTE_MAX, VIEW_NAME } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { deifyCombatEvent, peakDuelEvent, pveTeamEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { data, gamesvr } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { pveData } from "../../models/PveData";
import { pveDataOpt } from "../../operations/PveDataOpt";
import StepWork from "../../../common/step-work/StepWork";
import { preloadRoleSpines } from "../../../common/res-manager/Preloaders";
import PreinstallRoleItem from "./PreinstallRoleItem";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import HeroUnit from "../../template/HeroUnit";
import { pvpData } from "../../models/PvpData";
import { pvpDataOpt } from "../../operations/PvpDataOpt";
import { CB } from "../view-other/MessageBoxView";
import FriendSkillComp from "../view-scene/FriendSkillComp";
import PresetListComp from "./PresetListComp";
import ItemHeadSquare from "../view-item/ItemHeadSquare";
import PreinstallHeroListComp from "./PreinstallHeroListComp";
import UIClick, { ClickType } from "../../../common/components/UIClick";
import { battleUtils } from "../../../app/BattleUtils";
import { BattleArray } from "../view-scene/BattleArray";
import { PVP_MODE } from "../../../app/AppEnums";
import MultiBattleComp from "../view-scene/MultiBattleComp";
import { localStorageMgr, SAVE_TAG } from "../../../common/LocalStorageManager";
import { ADJUST_TEAM_TYPE } from "../view-pvp/pvp-peakduel/PVPPeakDuelChangeTeamView";

const { ccclass, property } = cc._decorator;

const PRE_LOAD_SPINE_TAG = 'PreInstall_Preload_Spine_Tag';
const CLICK_SELECT = 0.1; // 拖拽时间少于0.1秒属于点击更换
const LONG_SELECT = 0.6; // 拖拽时间少于0.1秒属于点击更换

/**
 * @需要优化 
 * 1. 角色长按显示详情，备战有这个功能
 * 2. 下面的角色头像列表可以抽出来做一个组件，这样在备战界面可以通用
 * 3. 2）说的组件和右边编队列表栏做成独立组件（已经做了）抽出来，和备战界面公用
 * 4. 2）说的组件增加仙缘推荐功能
 * 5. 每一次操作应该都是先更改数据，然后数据准备完了去更新ui而不是交叉进行
 */

@ccclass
export default class PreinstallView extends ViewBaseComponent {
    @property(cc.Label)         teamPowerLb: cc.Label = null;
    @property([cc.Node])        rolesPosList: cc.Node[] = [];
    @property(cc.Node)          commonRolePos: cc.Node = null;
    @property(cc.Prefab)        preinstallRoleItemPfb: cc.Prefab = null;
    @property(PreinstallHeroListComp) heroListCmp: PreinstallHeroListComp = null;
    @property(FriendSkillComp)  friendSkill: FriendSkillComp = null;
    @property(PresetListComp)   presetList:  PresetListComp = null;
    @property(cc.ProgressBar) longClickPb: cc.ProgressBar = null;

    /**pvp--多阵容添加 */

    @property(MultiBattleComp) multBattleComp: MultiBattleComp = null;
    @property(cc.SpriteFrame) battleBtnSprs: cc.SpriteFrame[] = [];
    @property(cc.Sprite) sureBtnSpr: cc.Sprite = null;

    /**多阵容战备*/
    private _battleArray: BattleArray = new BattleArray();
    private _pvpMode: PVP_MODE = PVP_MODE.DEIFY_COMBAT;


    private _curTeamIndex: number = 0;
    private _curTeamData: data.ITeamInfo = null;                    // 当前队伍（上阵）的英雄
    private _preInstallData: { [key: string]: data.ITeamInfo } = {};
    private _rolePos: cc.Vec2[] = [];                               // 位置信息
    private _heroList: number[] = [];                               // 未上阵的英雄列表
    private _delList: number[] = [];                                // 去除的列表
    private _clickTime: number = 0;                                 // 点击角色时间
    private _endCb: Function = null;                                // 关闭回调
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _pvpDefensive: boolean = false;
    private _clickOffset = new cc.Vec2(0, 0);

    onInit(isPvpDefensive?: boolean,pvpMode?:PVP_MODE) {
        this._pvpDefensive = isPvpDefensive;
        
        this._pvpMode = pvpMode;
        this._resetPVPConfig();

        this._onLongClickInterrupted();
        this.recordRolePos();
        this.initHeroListComp();

        eventCenter.register(pveTeamEvent.SAVE_TEAM, this, this._saveTeamRes);
        eventCenter.register(deifyCombatEvent.CHANGE_DEFENSE, this, this._recvDefensiveChangeRes);
        eventCenter.register(peakDuelEvent.RECV_CHANGE_DEVENSIVE_TEAM_RES, this, this._recvChangeDefensiveTeam);
        
        let spPaths = this._getRoleSpines();
        let newTask = new StepWork();
        newTask.addTask(() => {
            this.updateMultBattleArrayData();
            this.updateData();
            this.updateTeamData();
            this.refreshView();
        });
        this.stepWork
            .concact(preloadRoleSpines(spPaths, PRE_LOAD_SPINE_TAG).stepWork)
            .concact(newTask);
    }

    onRelease() {
        this.releaseSubView();
        this.unscheduleAllCallbacks();
        eventCenter.unregisterAll(this);
        this.releaseRoleSpines();

        this.heroListCmp.deInit();
        this.friendSkill.deInit();
        this.presetList&&this.presetList.deInit();
        if(this._spriteLoader) {
            this._spriteLoader.release();
        }
        //pvpconfig初始化
        pvpData.clearPvpConfig();
        this._battleArray.clear();

        this.releaseSubView();
    }

    /**
     * 记录下初始位置
     */
    recordRolePos() {
        for (let i = 0; i < this.rolesPosList.length; ++i) {
            this._rolePos[i] = this.rolesPosList[i].getPosition();
        }
    }

    releaseRoleSpines() {
        for (let i = 0; i < this.rolesPosList.length; ++i) {
            if (this.rolesPosList[i].children[0]) {
                this.rolesPosList[i].children[0].getComponent(PreinstallRoleItem).deInit(true);
            }
        }
    }

    updateData() {
        this._preInstallData = pveData.presetTeams;
    }

    updateTeamData() {
        if (this._pvpDefensive) {
            switch (this._pvpMode) {
                case PVP_MODE.DEIFY_COMBAT: this._curTeamData = pvpData.getSpiritDefensiveTeam(); break;
                case PVP_MODE.PEAK_DUEL: {

                }
            }
        }else{
            this._curTeamData = utils.deepCopy(this._preInstallData[this._curTeamIndex]);
        }

        if(!this._curTeamData || !this._curTeamData.Heroes) {
            this._curTeamData = new data.TeamInfo();
        }
        this._heroList = bagData.heroList.map(_heroUnit => {
            return Number(_heroUnit.ID);
        });

        const checkIsFight = (heroId: number) => {
            let isFind = false;
            for(let i = 0; i < 5; ++i) {
                if(this._curTeamData.Heroes[i] == heroId) {
                    isFind = true;
                    return isFind;
                }
            }
            return isFind;
        }

        this._heroList = this._heroList.filter(_heroId => {
            return !checkIsFight(_heroId);
        });
        
        //移除已上阵英雄
        for (let k = 0; k < this._battleArray.size; k++){
            let heros = this._battleArray.get(k);
            if (!heros) continue;
            heros.forEach((heroId,index) => {
                if (heroId && this._heroList.indexOf(heroId) >= 0)
                    this._heroList.splice(this._heroList.indexOf(heroId),1);
            })
        }

        // 需要排序 根据战斗力
        this._heroList.sort((_a, _b) => {
            if (!_a) return 1;
            if (!_b) return -1;
            let aUnit = new HeroUnit(_a);
            let bUnit = new HeroUnit(_b);
            return bUnit.getCapability() - aUnit.getCapability();
        });

        this._delList = [];
    }

    refreshView() {
        this.refreshTeamsView();
        this.refreshStageView();
        this.refreshHeroListView();
        this.refreshTeamPowers();
        // 仙缘的更新必须在英雄列表之后
        this.refreshFriendView();
    }

    /**
     * 刷新总队伍显示
     */
    refreshTeamsView() {
        return;
        // PVP防御模式下直接返回
        if(this._pvpDefensive) {
            if (this.presetList && cc.isValid(this.presetList))
                this.presetList.node.active = false;
            return;
        }
        this.presetList.onRefresh(this._preInstallData)
        this.presetList.node.active = true;
    }
   
    /**
     * 刷新已上阵的显示
     */
    refreshStageView() {
        if (!this._curTeamData) {
            this._curTeamData = {
                Index: this._curTeamIndex,
                Heroes: {}
            }
        }

        if (this._pvpDefensive && this._pvpMode == PVP_MODE.DEIFY_COMBAT){
            this._curTeamData  = pvpData.getSpiritDefensiveTeam();
        }

        if (pvpData.checkPVPMulitBattle(this._pvpMode)) {
            let heroList:number[] = this._battleArray.get(pvpData.pvpConfig.step);
            heroList.forEach((heroId,index) => {
                this._curTeamData.Heroes[index] = heroId;
            })
        }

        for (let i = 0; i < 5; i++) {
            if (this._curTeamData.Heroes && this._curTeamData.Heroes[i]) {
                this.addOneRole(this._curTeamData.Heroes[i], i);
            } else {
                this.reduceTeamDataOne(i);
                this.reduceOneRole(this.rolesPosList[i].children[0]);
            }
        }
    }
    /**
     * 刷新已上阵激活的仙缘
     */
    refreshFriendView() {
        this.friendSkill.show(this.currSelectID, this.currCandidateID, true)
    }

    get currSelectID () {
        let curr: number[] = [];
        for (let key in this._curTeamData.Heroes) {
            if (this._curTeamData.Heroes[key]) {
                curr.push(this._curTeamData.Heroes[key])
            }
        }
        return curr;
    }

    get currCandidateID () {
        return this._heroList;
    }

    refreshTeamPowers() {
        let powers: number = 0;
        if (this._curTeamData.Heroes && utils.getObjLength(this._curTeamData.Heroes) >= 1) {
            for(const k in this._curTeamData.Heroes) {
                let heroId: number = this._curTeamData.Heroes[k];
                let heroUnit: HeroUnit = bagData.getHeroById(heroId);
                if(heroUnit && heroUnit.isHeroBasic) {
                    powers += heroUnit.getCapability();
                }
            }
        }
        this.teamPowerLb.string = `${powers}`;
    }

    refreshHeroListView() {
       this.heroListCmp.onRefresh(this._heroList, this.currSelectID, false);
    }

    initHeroListComp () {
        this.heroListCmp.onInit({
            dragRoot: this.node,
            attachComp: this,
            click: this._addHeroToFight.bind(this),
            longClick: this._showHeroTips.bind(this),
            longClickIntrupt: this._onLongClickInterrupted.bind(this),
            longClickChange: this._onLongClickProgressChanged.bind(this),
            switchClick: null
        } );
    }

    onHeroListItemRender(roleItem: cc.Node, index: number) {
        !roleItem.active && (roleItem.active = true);
        let heroId: number = this._heroList[index];
        roleItem.getComponent(ItemHeadSquare).init(heroId,
            () => { this._addHeroToFight(heroId); },
            () => { this._showHeroTips(heroId); }
            );
    }

    checkUsedHero(target: cc.Node, heroID: number){
        let nearData = this._getNearestRolePos(target);
        if (utils.checkTwoNodeIsIntersect(nearData.node, target)) {
            let _addHero = () => {
                this._addHeroToFight(heroID, nearData.index);
            }
            let decRole = this.rolesPosList[nearData.index].children[0];
            if(cc.isValid(decRole)){
                //当前位置已经被占, 需要替换掉原有占用者
                let roleComp = target.getComponent(PreinstallRoleItem);
                this.reduceTeamDataOne(nearData.index);
                this.reduceOneRole(decRole);
                this.scheduleOnce(()=> {
                    _addHero();
                });
            }else{
                _addHero();
            }
            return true;
        }
        return false;
    }

    private _showHeroTips(heroId: number) {
        // 打开英雄属性弹窗
        this.loadSubView(VIEW_NAME.TIPS_HERO, heroId);
    }

    // 上阵
    private _addHeroToFight(heroId: number, posIdx?: number) {
        let addIndex: number = this.addTeamDataOne(heroId, posIdx);
        if (addIndex >= 0 && addIndex < 5) {
            this.updateHeroList(heroId, false);
            this.addOneRole(heroId, addIndex);
            this.refreshFriendView();
            this.refreshTeamPowers();
            //如果是有多阵容的情况下  保存当前阵容
            if (this._pvpDefensive && pvpData.checkPVPMulitBattle(this._pvpMode)) {
                this._autoSaveBattleArray();
            }
        }
    }

    private _onLongClickInterrupted(){
        this.longClickPb.node.active = false;
    }

    private _onLongClickProgressChanged(progress: number, pos: cc.Vec2){
        this.longClickPb.progress = progress;
        if(pos){
            let localPos = this.node.convertToNodeSpaceAR(pos)
            this.longClickPb.node.x = localPos.x;
            this.longClickPb.node.y = localPos.y;
        }
        this.longClickPb.node.active = true;
    }

    /**
     * 点击切换队伍
     * @param toggle
     * @param customEventData
     */
    onClickTeamToggle(toggle: cc.Toggle, customEventData: string) {
        if (Number(customEventData) != this._curTeamIndex) {
            let changeCb = () => {
                this._curTeamIndex = Number(customEventData);
                this.updateTeamData();
                this.refreshHeroListView();
                this.refreshStageView();
                this.refreshFriendView();
                this.refreshTeamPowers();
            }
            if (this._checkTeamChanged(this._curTeamData, this._curTeamIndex)) {
                // todo 展示是否保存配置弹窗
                this.showSaveTeamTips(() => {
                    this.saveTeamData(this._curTeamIndex);
                    changeCb();
                    this.presetList.refreshTeamByIndex(this._curTeamIndex, this._preInstallData[this._curTeamIndex]);
                }, () => {
                    // 初始化本队数据
                    changeCb();
                });
            } else {
                changeCb();
            }
        }
    }

    /**
     * 添加一个角色形象
     * @param heroUnit 
     * @param index 
     * @param addIndex 
     * @returns 
     */
    addOneRole(heroId: number, index: number, addIndex?: number) {
        let role: cc.Node = null;
        let roleIndex: number = -1;
        let isNew: boolean = false;
        if (typeof addIndex != 'undefined') {
            roleIndex = addIndex;
            role = this.rolesPosList[addIndex].children[0];
            if (!role) {
                isNew = true;
                role = cc.instantiate(this.preinstallRoleItemPfb);
                this.rolesPosList[addIndex].addChild(role);
            }
        } else {
            roleIndex = index;
            role = this.rolesPosList[roleIndex].children[0];
            if (!role) {
                isNew = true;
                role = cc.instantiate(this.preinstallRoleItemPfb);
                this.rolesPosList[roleIndex].addChild(role);
            }
        }
        if (isNew) {
            role.getComponent(PreinstallRoleItem).setData(heroId, roleIndex);
        } else {
            role.getComponent(PreinstallRoleItem).updateData(heroId, roleIndex);
        }
        
        battleUtils.removeClickComp(role);

        let uiClickComp = role.addComponent(UIClick);
        uiClickComp.isDrag = true;
        uiClickComp.clickHandler = this._onUIClick.bind(this);
        uiClickComp.longClickProgressCb = this._onLongClickProgressChanged.bind(this);
        return role;
    }

    private _onUIClick(eventType: ClickType, target: cc.Node){
        if(eventType == ClickType.TouchStart){
            this._onTouchStartRole(target);
        }

        if(eventType == ClickType.Click){
            this._onClickRole(target);
        }

        if(eventType == ClickType.LongClick){
            this._onLongClickRole(target);
        }

        if(eventType == ClickType.DragEnd){
            this._onDragEndRole(target);
        }

        if(eventType == ClickType.InterruptLongClick){
            this._onLongClickInterrupted();
        }
    }

    /**
     * 点击角色位置
     * @param event
     */
    private _onTouchStartRole(target: cc.Node) {
        target.parent.zIndex = cc.macro.MAX_ZINDEX;
    }

    private _onClickRole(target: cc.Node){
        let roleComp = target.getComponent(PreinstallRoleItem);
        let roleIndex = roleComp.getIndex();
        this.reduceTeamDataOne(roleIndex);
        this.reduceOneRole(target);
    }

    private _onLongClickRole(target: cc.Node){
        let roleComp = target.getComponent(PreinstallRoleItem);
        let roleIndex = roleComp.getIndex();
        this.loadSubView(VIEW_NAME.TIPS_HERO, roleComp.getData());
    }

    private _onDragEndRole(target: cc.Node){
        let roleComp = target.getComponent(PreinstallRoleItem);
        let roleIndex = roleComp.getIndex();
        // 判断是否是交换位置
        let nearData = this._getNearestRolePos(target);
        if (utils.checkTwoNodeIsIntersect(nearData.node, target)) {
            this._switchTeamData(roleIndex, nearData.index);
            this.changeRolePos(target, roleIndex, nearData.index);
        } else {
            this.reduceTeamDataOne(roleIndex);
            this.reduceOneRole(target);
        }
    }

    /**
     * 获得最近的角色位置
     * @param event
     * @returns
     */
    private _getNearestRolePos(target: cc.Node) {
        let posNode: cc.Node = null;
        let minDistance: number = 1000;
        let index: number = -1;
        let targetWorldPos = utils.getWorldPosition(target);
        for (let i = 0; i < this.rolesPosList.length; ++i) {
            let distance: number = cc.Vec2.distance(utils.getWorldPosition(this.rolesPosList[i]), targetWorldPos);
            if (distance < minDistance) {
                index = i;
                posNode = this.rolesPosList[i];
                minDistance = distance;
            }
        }
        return { node: posNode, index: index };
    }

    /**
     * 改变交换英雄的位置
     * @param srcRole
     * @param srcIndex
     * @param decIndex
     */
    changeRolePos(srcRole: cc.Node, srcIndex: number, decIndex: number) {
        let srcParent: cc.Node = this.rolesPosList[srcIndex];
        let decParent: cc.Node =  this.rolesPosList[decIndex];
        let srcRoleComp = srcRole.getComponent(PreinstallRoleItem);
        if(srcIndex == decIndex) {
            srcRole.setParent(srcParent);
            srcRole.setPosition(cc.v2(0, 0));
        } else {
            let decRole = this.rolesPosList[decIndex].children[0];
            if (decRole) {
                decRole.setParent(srcParent);
                decRole.setPosition(cc.v2(0, 0));
                let decRoleComp = decRole.getComponent(PreinstallRoleItem);
                decRoleComp.setIdx(srcIndex);
            }

        }
        srcRole.setParent(decParent);
        srcRole.setPosition(cc.v2(0, 0));
        srcRoleComp.setIdx(decIndex);
    }

    /**
     * 更新角色列表
     * @param heroId
     * @param isAdd
     */
    updateHeroList(heroId: number, isAdd: boolean) {
        let index: number = this._delList.indexOf(heroId);
        if (isAdd) {
            if (index > -1) {
                this._delList.splice(index, 1);
            }
        } else {
            if (index == -1) {
                this._delList.push(heroId);
            }
        }
        this.heroListCmp.updateOneData(heroId, isAdd);
    }

    /**
     * 给队伍数据添加一个数据
     * @param heroUnit
     * @returns 
     */
    addTeamDataOne(heroId: number, roleIndex?: number): number {
        let curr = this._curTeamData.Heroes;
        let cnt = 0;
        if (curr) {
            for (let key in curr) {
                let hero = curr[key];
                if (hero) cnt++;
            }
        } else {
            this._curTeamData.Heroes = {};
            curr = this._curTeamData.Heroes;
        }

        if (cnt > 5) {
            guiManager.showDialogTips(CustomDialogId.PREINSTALL_TEAM_FULL);
        } else {
            if (typeof roleIndex != 'undefined') {
                this._curTeamData.Heroes[roleIndex] = heroId;
                return roleIndex;
            } else {
                for (let i = 0; i < 5; ++i) {
                    if (!curr[i]) {
                        curr[i] = heroId;
                        return i;
                    }
                }
            }
        }
        return cnt;
    }

    /**
     * 去除一个英雄形象
     */
    reduceOneRole(role: cc.Node) {
        if (!role) return;
        let roleCmp = role.getComponent(PreinstallRoleItem);
        roleCmp.deInit(true);
    }
    /**
     * 减少一个队伍的数据
     * @param roleIndex 
     */
    reduceTeamDataOne(roleIndex: number) {
        if(utils.getObjLength(this._curTeamData.Heroes) <= 0) {
            this._delList = [];
            return;
        }
        if (this._curTeamData.Heroes && this._curTeamData.Heroes[roleIndex] && this._curTeamData.Heroes[roleIndex] > 0) {
            let heroId = this._curTeamData.Heroes[roleIndex];
            this.updateHeroList(heroId, true);
            delete this._curTeamData.Heroes[roleIndex];
            
            this.refreshFriendView();
            this.refreshTeamPowers();
            this._autoSaveBattleArray();
        }
    }

    private _switchTeamData(srcIndex: number, descIndex: number) {
        let srcHeroId = this._curTeamData.Heroes[srcIndex] || 0;
        let descHeroId = this._curTeamData.Heroes[descIndex] || 0;
        this._curTeamData.Heroes[srcIndex] = descHeroId;
        this._curTeamData.Heroes[descIndex] = srcHeroId;
    }
    /**
     * 展示是否保存队伍信息提示
     * @param confirmCb 
     * @param cancleCb 
     */
    showSaveTeamTips(confirmCb: CB, cancleCb: CB) {
        let tipsTxt = this._pvpDefensive ? "是否保存对防御阵容的更改？" : "是否保存对预设队伍的更改？";
        guiManager.showMessageBox(this.node, {
            content: tipsTxt, 
            leftStr: '取消',
            leftCallback: cancleCb, 
            rightStr: '确定', 
            rightCallback: confirmCb});
    }

    checkSaveDefenceTeam() {
        if (pvpData.checkPVPMulitBattle(this._pvpMode)) {
            //判定前移 - 是否有空位
            if (!this._checkTeamIsEmty()) {
                this.showSaveTeamTips(() => {
                    this.saveTeamData(this._curTeamIndex);
                    super.closeView();
                }, () => {
                    super.closeView();
                });
            } else {
                guiManager.showTips('每个队伍至少要有一人');
            }
        }
    }

    closeView() {        
        //如果是多阵容直接关闭-
        if (pvpData.checkPVPMulitBattle(this._pvpMode)) { 
            super.closeView();
            return;
        }

        if (this._checkTeamChanged(this._curTeamData, this._curTeamIndex)) {
            this.showSaveTeamTips(() => {
                this.saveTeamData(this._curTeamIndex);
                super.closeView();
            }, () => {
                super.closeView();
            });
        } else {
            super.closeView();
        }
        if (this._endCb) {
            this._endCb();
        }
    }

    onClickSave() {
        //先判定是否多阵容切换队伍
        if (this._pvpDefensive && pvpData.checkPVPMulitBattle(this._pvpMode)) {
            let curStep = pvpData.pvpConfig?.step || 0;
            this._autoSaveBattleArray();
            //下标从0开始。需-1
            if (curStep < PVP_MULT_BALLTE_MAX - 1) {
                // this.sureBtnSpr.spriteFrame = this.battleBtnSprs[0];
                pvpData.pvpConfig.step += 1;
                this.multBattleComp.onRefresh({ pvpMode: this._pvpMode });
                this._switchMultToggle(pvpData.pvpConfig.step);
            } else {   
                // this.closeView();
                this.checkSaveDefenceTeam();
            }

        } else {
            //单队保存            
            if (this._checkTeamChanged(this._curTeamData, this._curTeamIndex)) {
                this.saveTeamData(this._curTeamIndex);
            } else {
                guiManager.showDialogTips(CustomDialogId.PREINSTALL_TEAM_NO_CHANGE);
            }
        }

    }

    saveTeamData(teamIdx: number) {
        let teamInfo = new data.TeamInfo();
        let curr = this._curTeamData.Heroes;

        for (let key in curr) {
            if (curr[key]) {
                teamInfo.Heroes[key] = curr[key];
            }
        }
        teamInfo.Index = teamIdx;
        if (this._pvpDefensive && this._pvpMode == PVP_MODE.DEIFY_COMBAT){
            pvpDataOpt.reqTradeDefensive(teamInfo.Heroes);
            return;
        }        
        pveDataOpt.reqSetTeam(teamInfo);
    }

    getTeamLength(team: data.ITeamInfo) {
        let count: number = 0;
        let teamHeros: { [k: string]: number } = team.Heroes;
        for (const k in teamHeros) {
            if (teamHeros[k]) {
                ++count;
            }
        }
        return count;
    }

    private _checkArrayIsAllZero(nums: number[]): boolean {
        let result = false
        nums.forEach(num => {
            if (num > 0) result = true;
        })
        return result;
    }

    /**
     * 检测是否有空位
     */
    private _checkTeamIsEmty():boolean {
        if (this._pvpDefensive && pvpData.checkPVPMulitBattle(this._pvpMode)) {
            let result: data.IPvpPeakDuelDefensiveLineupHero[] = [];
            let isAllow = true;
            for (let k = 0; k < this._battleArray.size; k++){
                let heros = this._battleArray.get(k);
                let defensLis: data.IPvpPeakDuelDefensiveLineupHero = {};
                if (!heros) defensLis["DefensiveHeroList"] = [0, 0, 0, 0, 0];
                defensLis["DefensiveHeroList"] = heros;
                result.push(defensLis)

                isAllow = this._checkArrayIsAllZero(heros);
                if (!isAllow) break;
            }
            if (isAllow) {
                pvpDataOpt.reqPeakDuelTradeDefensiveLineup(result);
                //暂时默认保存
                this._saveAccountBattleArrayData();    
            } else {
                return true;
            }
        }
        return false;
    }

    private _checkTeamChanged(team: data.ITeamInfo, index: number): boolean {
        let result = false;
        if (this._pvpDefensive) {
            //多阵容队伍信息是否变化
            if (pvpData.checkPVPMulitBattle(this._pvpMode)) {
                let tempHeros = pvpData.peakDuelData.PvpPeakDuelDefensiveLineupHeroList;
                if (!tempHeros || !tempHeros.length) result = true;
                tempHeros.forEach((heros,index) => {
                    let curid = this._battleArray.get(index);
                    heros.DefensiveHeroList.forEach((heroid, lv) => {
                        if (heroid != curid[lv]) result = true;
                    })
                })
            } else {
                let originalTeam = pvpData.getSpiritDefensiveTeam();
                for (let i = 0; i < 5; i++) {
                    if (this._curTeamData.Heroes[i] != originalTeam.Heroes[i]) {
                        return true;
                    }
                }
                return false;
            }
        }
        if (pveData.pveConfig) {
            let origin = pveData.presetTeams[index];
            for (let i = 0; i < 5; i++) {
                let ori = origin && origin.Heroes && origin.Heroes[i] ? origin.Heroes[i] : 0;
                let curr = team && team.Heroes && team.Heroes[i] ? team.Heroes[i] : 0;
                if (curr != ori) {
                    return true;
                }
            }    
        }
        
        return result;
    }

    private _saveTeamRes(cmd: any, saveIdx: number) {
        this.updateData()
        if (saveIdx == this._curTeamIndex) {
            this._curTeamData = utils.deepCopy(this._preInstallData[saveIdx]);
        }

        this.presetList.refreshTeamByIndex(saveIdx, this._preInstallData[saveIdx]);
    }

    private _recvDefensiveChangeRes(cmd: number) {
        guiManager.showDialogTips(CustomDialogId.PREINSTALL_TEAM_SAVED);
    }

    private _getRoleSpines () {
        let rolesPaths: string[] = [];
    
        let allHeroes = bagData.heroList;
        allHeroes.forEach( _hu => {
            if (_hu && _hu.ID) {
                let cfg = configUtils.getHeroBasicConfig(_hu.ID);
                if (cfg && cfg.HeroBasicModel) {
                    let spPath = resPathUtils.getModelSpinePath(cfg.HeroBasicModel);
                    if (spPath && rolesPaths.indexOf(spPath) == -1) {
                        rolesPaths.push(spPath);
                    }
                }
            }
        })
        return rolesPaths;
    }

    onClickFriendSkillSelf () {
        if (this.friendSkill.canShowSkill()) {
            this.loadSubView(VIEW_NAME.FRIENDS_POPVIEW, this.friendSkill.friendIDs);
        }
    }

    /** ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼  pvp多阵容相关  ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼ */

    /**初始化pvpconfig*/
    private _resetPVPConfig() {
        //如果是查看防守阵容等操作，未进行config的赋值，先初始化一个config
        if (pvpData.checkPVPMulitBattle(this._pvpMode) && !pvpData.pvpConfig) {
            pvpData.pvpConfig = {
                step: 0,
                pvpMode: this._pvpMode,
            };
        }
    }

    /**多阵容切换*/
    onTogglePVPMultBattleClick(toggle: cc.Toggle, customEventData: string) {
        let clickIndex = Number(customEventData);
        let curStep = pvpData.pvpConfig?.step || 0;
        if (clickIndex == curStep) return;
        //保存当前层的英雄信息
        this._autoSaveBattleArray();

        this._switchMultToggle(clickIndex);

        //切换层级
        pvpData.pvpConfig.step = clickIndex;
        this.multBattleComp.onRefresh({ pvpMode: this._pvpMode });
    }

    /**
     * @description 切换多阵容战斗的时候当前层需要刷新的数据和显示
     * 
     */
    private _switchMultToggle(clickIndex: number = 0) {
        //重置curTeamData数据
        this._resetCurTeamDataHeros(clickIndex);
        //如果 有默认阵容先上阵默认阵容
        this._updateBattleHero(clickIndex);
        //刷新战力和羁绊
        this.refreshTeamPowers();
        this.refreshFriendView();
    }

    private _updateBattleHero(clickIndex: number) {    
        if (!pvpData.checkPVPMulitBattle(this._pvpMode)) return;
        
        let heros = this._battleArray.get(clickIndex);
        for (let i = 0; i < heros.length; i++){
            if (!heros[i]) {
                this.reduceOneRole(this.rolesPosList[i].children[0]);
            } else {
                this._addHeroToFight(heros[i], i);    
            } 
        }
    }

    private _autoSaveBattleArray() {
        if (!pvpData.checkPVPMulitBattle(this._pvpMode)) return;

        let hero: number[] = [], tempHeros = this._battleArray.get(pvpData.pvpConfig.step);
        let isChange: boolean = false;
        for (let key = 0; key < 5; key++) {
            let tempId = tempHeros[Number(key)];
            let nowId = this._curTeamData.Heroes[key] || 0;
            hero.push(nowId);
            //有改变再做存储
            if (tempId != this._curTeamData.Heroes[key])
                isChange = true;
        }
        let index = this._curTeamData.Index;
        if (isChange)
            this._battleArray.set(index, hero);
    }

    private _resetCurTeamDataHeros(step: number = 0) {
        if (!pvpData.checkPVPMulitBattle(this._pvpMode)) return;

        let heros = this._battleArray.get(step) || [0, 0, 0, 0, 0];
        heros.forEach((heroId, index) => {
            this._curTeamData.Heroes[index] = heroId;
            this._curTeamData.Index = step;
        });
    }

    private _saveAccountBattleArrayData() {
        if (!this._pvpMode || this._pvpMode!=PVP_MODE.PEAK_DUEL) return;
        for (let i = 0; i < PVP_MULT_BALLTE_MAX; i++) {
            let tagStr = SAVE_TAG.PVP_MULT_BATTLE_LAST_TEAM + i;
            let heros = this._battleArray.get(i) || [0, 0, 0, 0, 0];
            localStorageMgr.setAccountStorage(tagStr, heros);
        }
    }


    /**
     * 防守阵容已被改变
     */
    private _recvChangeDefensiveTeam(cmd:any,msg:gamesvr.PvpPeakDuelTradeDefensiveLineupRes) {
        let allList = msg.PvpPeakDuelDefensiveLineupHeroList;
        allList.forEach((pvpDefensiveStr, index) => {
            this._battleArray.set(index, pvpDefensiveStr.DefensiveHeroList);
        })
        this._saveAccountBattleArrayData();
        this.updateTeamData();
        this.refreshView();
    }

    /**
     * @description 刷新多阵容容器的显示-拿到保存数据
    */
    updateMultBattleArrayData() {
        if (!pvpData.checkPVPMulitBattle(this._pvpMode)) return;

        if (this.multBattleComp) {
            this.multBattleComp.onRefresh({ pvpMode: this._pvpMode });
        }
        for (let i = 0; i < PVP_MULT_BALLTE_MAX; i++){
            let tagStr = SAVE_TAG.PVP_MULT_BATTLE_LAST_TEAM + i;
            let localAccountData = localStorageMgr.getAccountStorage(tagStr);
            this._battleArray.set(i, localAccountData);
        }
    }

    openAdjustTheLineup() {
        this.loadSubView("PVPPeakDuelChangeTeamView",this._battleArray,ADJUST_TEAM_TYPE.DEFENSIVE);
    }
}
