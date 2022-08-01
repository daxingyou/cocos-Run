import { CustomDialogId, DEFAULT_ROLE_SP, HERO_ENERGY_MAX, PVP_MULT_BALLTE_MAX, SCENE_NAME, VIEW_NAME } from "../../../app/AppConst";
import { ALLTYPE_TYPE, PVE_MODE, PVP_MODE } from "../../../app/AppEnums";
import { utils } from "../../../app/AppUtils";
import { BT_DEFAULT_POS, ROLE_TYPE } from "../../../app/BattleConst";
import { battleUtils } from "../../../app/BattleUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { battleEvent, battleStatisticEvent, deifyCombatEvent, islandEvent, peakDuelEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { localStorageMgr, SAVE_TAG } from "../../../common/LocalStorageManager";
import moduleUIManager from "../../../common/ModuleUIManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { data, gamesvr } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { limitData } from "../../models/LimitData";
import { pveData } from "../../models/PveData";
import { pveFakeData } from "../../models/PveFakeData";
import { pveTrialData } from "../../models/PveTrialData";
import { pvpData } from "../../models/PvpData";
import HeroUnit from "../../template/HeroUnit";
import UIRole from "../../template/UIRole";
import ItemRole from "../view-item/ItemRole";
import PreinstallHeroListComp from "../view-preinstall/PreinstallHeroListComp";
import BattleScene from "./BattleScene";
import FriendSkillComp from "./FriendSkillComp";
import UIClick, {ClickType} from "../../../common/components/UIClick";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import MessageBoxView from "../view-other/MessageBoxView";
import { battleUIOpt } from "../../operations/BattleUIOpt";
import MultiBattleComp from "./MultiBattleComp";
import BattleUICtrlComp from "./BattleUICtrlComp";
import PresetListComp from "../view-preinstall/PresetListComp";
import { BattleArray } from "./BattleArray";
import { cfg } from "../../../config/config";
import { SquareHeadOption } from "../view-item/ItemHeadSquare";
import { ADJUST_TEAM_TYPE } from "../view-pvp/pvp-peakduel/PVPPeakDuelChangeTeamView";
import { logger } from "../../../common/log/Logger";

const { ccclass, property } = cc._decorator;

interface EmenyInfo {
    lessonId: number,
    monsterIds: number[],
    group: number,
    step: number
}

@ccclass
export default class BattlePrepareView extends ViewBaseComponent {
    @property(cc.Node) ndContent: cc.Node = null;
    @property(cc.EditBox) lbLessonId: cc.EditBox = null; // 测试用

    @property(PreinstallHeroListComp) heroListComp: PreinstallHeroListComp = null;  // 下方英雄列表组件
    @property(FriendSkillComp) friendCompS: FriendSkillComp = null;// 自己的羁绊
    @property(FriendSkillComp) friendCompE: FriendSkillComp = null;// 地方的羁绊

    @property(cc.ProgressBar) longClickPb: cc.ProgressBar = null;
    @property(MultiBattleComp) chapterInfo: MultiBattleComp = null;
    @property(BattleUICtrlComp) uiCtrl: BattleUICtrlComp = null;
    @property(PresetListComp) presetList: PresetListComp = null;

    @property(cc.Button) pvpMultAdjustTeamBtn: cc.Button = null;
    @property(cc.Sprite) startGameBtnSpr: cc.Sprite = null;
    @property({ type: cc.SpriteFrame,tooltip:"多阵容出战按钮" }) enterSprs: cc.SpriteFrame[] = [];

    private _currSelect: number[] = [];
    private _battleArray = new BattleArray(); // 多阵容
    private _currEnemy: EmenyInfo = {monsterIds: [], group: 0, step:0, lessonId: 0};
    private _candidate: number[] = [];
    private _candidateMoved: boolean[] = [];
    private _rolesPosList: cc.Node[] = [];
    private _game: BattleScene = null;
    private _curTeamIndex: number = 0;
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _enterCnt: number = 0;

    get monster () { return  this._currEnemy; }
    get currSele () { return this._currSelect; }

    onInit(root: BattleScene) {
        eventCenter.unregisterAll(this);
        eventCenter.register(battleEvent.BATTLE_START, this, this._whenBattleStart);
        eventCenter.register(battleStatisticEvent.START_BATTLE_NO_VIEW, this, this._startEnterBattle);
        eventCenter.register(deifyCombatEvent.CHANGE_ENEMY, this, this._enterPvpFail);
        eventCenter.register(peakDuelEvent.HERO_MULT_CHANGE_NTY, this, this._pvpMultBatlleChange);
        

        this._enterCnt ++;
        this._game = root;
        this._rolesPosList = this._game.heroCtrl.roleNodes;
        this.longClickPb.node.active = false;

        this._initData();
        this._initComponents();

        this._updateHeroList();
        this._updateEnemyList();

        // 展示完整备战界面
        if (this._showContent()) {
            this.ndContent.active = true;
            this._refreshFriendView();
            if (pvpData.checkPVPMulitBattle()) {
                this.pvpMultAdjustTeamBtn.node.active = true;
                this.chapterInfo.onRefresh({ pvpMode: pvpData.pvpConfig.pvpMode });
            } else {
                this.pvpMultAdjustTeamBtn.node.active = false;
                this.chapterInfo.onRefresh({ lessonID: this._currEnemy.lessonId });    
            }
            this.presetList.onRefresh(pveData.presetTeams, this._curTeamIndex);
            this.heroListComp.onRefresh(this._candidate, this._currSelect, pveData.magicDoor, this._battleArray.value)
            this.uiCtrl.show();
            this._checkShowToggle();
        } else {
        // 快速开始，不完全展示备战
            this.ndContent.active = false;
            this.deInit();
            this._checkQuickStart();
        }    
    }

    deInit() {
        this.node.stopAllActions();
        this.friendCompS.deInit();
        this.friendCompE.deInit();
        this.chapterInfo.deInit();
        this.heroListComp.deInit();
        this.presetList.deInit();

        this.releaseSubView();
        this.unscheduleAllCallbacks();
        eventCenter.unregisterAll(this);
    }

    onRefresh() {
        
    }

    onRelease() {
        if (this._spriteLoader) {
            this._spriteLoader.release();
        }
        this.uiCtrl.deInit()
        this.deInit();
    }

    private _initComponents() {
        this.friendCompS.onInit();
        this.friendCompE.onInit();
        this.chapterInfo.onInit();
        this.uiCtrl.onInit();
        this.presetList.onInit(true);

        this.heroListComp.onInit({
            dragRoot: this.node,
            attachComp: this,
            click: this._clickCandidate.bind(this),
            longClick: this._longClickCandidate.bind(this),
            switchClick: this._onClickPreSet.bind(this),
            longClickIntrupt: this._onLongClickInterrupted.bind(this),
            longClickChange: this._onLongClickProgressChanged.bind(this),
            initSquareHeadOption: this._initSquareHeadOption
        })
    }

    private _initData() {
        this._resetLocalData();
        this._candidate = [];
        this._battleArray.clear();
        this._resetHeroData();
        this._resetMonsterData();
        this._resetCandidateData();
        this._resetMultiHeroData();
    }

    private _checkQuickStart() {
        //多阵容的回放-所有场次的数据都在
        if (pvpData.pvpConfig && pvpData.pvpConfig?.replay && pvpData.pvpConfig?.step >= 0) {
            eventCenter.fire(peakDuelEvent.ENTER_PVP_RES, pvpData.pvpConfig.replay);
            return;    
        }

        if (pvpData && pvpData.pvpConfig && pvpData.pvpConfig.replay) {
            battleUIOpt.showReplayNotify(pvpData.pvpConfig.replay);
            return;
        }

        if (pveData.pveConfig && pveData.pveConfig.useDefaultSquad) {
            //快速开始战斗
            let defaultSelect = this._currSelect;
            let monsterGroup = this._currEnemy.monsterIds;

            if (defaultSelect.length > 0 && monsterGroup) {
                this._game.reqEnterGame(defaultSelect)
                localStorageMgr.setAccountStorage(SAVE_TAG.BATTLE_LAST + "0", defaultSelect);
            }
        }

        if (pvpData.checkPVPMulitBattle()) {
        
            let battleEnterRes: gamesvr.IEnterBattleResult = pvpData.pvpPeakDuekFinishData.EnterBattleResultList[pvpData.pvpConfig.step];
            if (battleEnterRes)
                eventCenter.fire(peakDuelEvent.ENTER_PVP_RES, battleEnterRes);
        }
    }

    onClickBeginGame() {
        // pvp巅峰对决的情况下，可能是切换下一队进行展示 //
        if (pvpData.checkPVPMulitBattle()) {
            //队伍切换
            if (pvpData.pvpConfig.step < 2)
                this.onClickChangeSubBattle(null, `${pvpData.pvpConfig.step + 1}`);
            else {
                this._startEnterBattle();   
            } 
            return;
        }

        this._removeAllHerosUIClick();
        if (pveData.pveConfig && pveData.pveConfig.pveMode == PVE_MODE.RANDOM_FIGHT) {
            if (limitData.checkRandomFightIsTimeOver()) {
                guiManager.showDialogTips(CustomDialogId.LIMIT_SHOP_TIPS3);
                guiManager.loadScene(SCENE_NAME.MAIN);
                return;
            }
        }
        this._startEnterBattle();
    }
    
    checkUsedHero(target: cc.Node, heroID: number) {
        let nearData = this._getNearestRolePos(target);
        if (utils.checkTwoNodeIsIntersect(nearData.node, target)) {
            //禁用角色
            if (pveData.checkHeroBan(heroID)) {
                if (pveTrialData.checkBanHero(heroID)) {
                    guiManager.showDialogTips(CustomDialogId.PVE_NINEHELL_HERO_BAN);
                } else {
                    this.chapterInfo.showBanInfo();
                }
                return false;
            }

            //检查位置是否禁位
            if (!this._checkPosEmplaceHero(nearData.index)) return false;

            let _addHero = () => {
                this._currSelect[nearData.index] = heroID;
                this._addHero(heroID, nearData.index);
                this._updateOneHeroHeadListData(heroID, false);
                this._refreshSelfFriendView();
                this.uiCtrl.refreshHerosTeamPower(this._currSelect);
            }
            if (this._currSelect[nearData.index] != 0) {
                //当前位置已经被占, 需要替换掉原有占用者
                let decRole = this._game.heroCtrl.getRoleNodeByPos(nearData.index);
                this._reduceOneRole(nearData.index, decRole);
                this.scheduleOnce(() => {
                    _addHero();
                });
            } else {
                _addHero();
            }
            this._candidateMoved[nearData.index] = false;
            return true;
        }
        return false;
    }

    onClickExit() {
        let doExit = () => {
            this._removeAllHerosUIClick();
            guiManager.loadScene(SCENE_NAME.MAIN).then(() => {
                moduleUIManager.showModuleView();
            });
        }

        if (pveData.pveConfig && pveData.pveConfig.passStep && pveData.pveConfig.passStep.length > 0) {
            guiManager.showMessageBox(this.node, {
                content: "退出后，将清空关卡挑战记录，\n是否继续",
                leftStr: "确 认",
                leftCallback: (msgBox: MessageBoxView) => {
                    msgBox.closeView();
                    doExit();
                },
                rightStr: "取 消",
                rightCallback: (msgBox: MessageBoxView) => {
                    msgBox.closeView();
                },
            })
            return;
        }

        doExit()
    }

    onClickBattleStatistic() {
        guiManager.loadModuleView('BattleStatisticView', null, null, 0, null);
    }

    private _updateOneHeroHeadListData(heroId: number, isAdd: boolean = true) {
        if (pveData.pveConfig) {
            //没有子战斗时，默认单场战斗
            let currStep = pveData.pveConfig.step || 0;
            this._battleArray.set(currStep, this._currSelect);
        }

        //如果是多阵容
        if (pvpData.pvpConfig?.step >= 0) {
            this._battleArray.set(pvpData.pvpConfig.step, this._currSelect);
        }

        this.heroListComp.updateOneData(heroId, isAdd, this._battleArray.value);
    }

    private _startEnterBattle() {
        let currSelect = this._currSelect.filter(_v => { return _v });
        if (currSelect.length == 0) {
            guiManager.showDialogTips(CustomDialogId.BATTLE_ONE_ROLE_LEAST);
            return;
        }
        if (pvpData.pvpConfig)
            this._enterPVPGame();
        else {
            this._enterPVEGame();
        }
    }

    private _autoSaveBattleArray() {
        //区分pve和pvp存储
        let saveTag = pveData.pveConfig ? SAVE_TAG.BATTLE_LAST : SAVE_TAG.PVP_MULT_BATTLE_LAST_TEAM;
        if (this._battleArray.size <= 0) {
            let tagStr = saveTag + "0"
            localStorageMgr.setAccountStorage(tagStr, this._currSelect);
        } else {
            for (let i = 0; i < this._battleArray.size && i < 3; i++) {
                let tagStr = saveTag + i
                localStorageMgr.setAccountStorage(tagStr, this._battleArray.get(i));
            }
        }
    }

    private _enterPVPGame() {
        let newEnemy = pvpData.getEnemyGroup();
        if (JSON.stringify(newEnemy) != JSON.stringify(this._currEnemy.monsterIds)) {
            this._removeAllHerosUIClick();
            guiManager.loadScene(SCENE_NAME.MAIN).then(() => {
                guiManager.showDialogTips(CustomDialogId.PVP_RANKCHANGE_DESC);
                moduleUIManager.showModuleView();
            });
        } else {
            if (pvpData.pvpConfig?.step >= 0) {
                this._game.reqEnterGame(this._currSelect,this._battleArray.value);    
            } else {
                this._game.reqEnterGame(this._currSelect);    
            }
            
        }
        this._autoSaveBattleArray();
    }

    private _enterPVEGame() {
        this._game.reqEnterGame(this._currSelect);
        if (pveData.magicDoor) {
            localStorageMgr.setAccountStorage(SAVE_TAG.MAGIC_DOOR_LAST_TEAM, this._currSelect);
        } else if (limitData.enterRandomFightData) {
            
        } else if (pveData.pveConfig && pveData.pveConfig.pveMode === PVE_MODE.RESPECT) {
            localStorageMgr.setAccountStorage(SAVE_TAG.CHALLENGE_LAST_TIME, this._currSelect);
        } else if (pveData.pveConfig && pveData.pveConfig.pveMode === PVE_MODE.FAIRY_ISLAND) {
            localStorageMgr.setAccountStorage(SAVE_TAG.ISLAND_LAST_TEAM, this._currSelect);
        } else if (pveData.pveConfig && pveData.pveConfig.pveMode === PVE_MODE.CLOUD_DREAM) {
            //云端梦境不保存默认阵容
        } else if (pveData.isPVEMode(PVE_MODE.PURGATORY)) {
            localStorageMgr.setAccountStorage(SAVE_TAG.PURGATORY_LAST_TIME, this._currSelect);
        } else if (pveData.pveConfig && pveData.pveConfig.pveMode === PVE_MODE.XIN_MO_FA_XIANG) {
            // 心魔法相
            localStorageMgr.setAccountStorage(SAVE_TAG.XIN_MO_LAST_TEAM, this._currSelect);
        } else {
            this._autoSaveBattleArray();
        }
    }

    private _enterPvpFail() {
        this.onClickExit();
    }

    private _onClickPreSet() {
        if (pveData.magicDoor) {
            guiManager.showLockTips();
            return;
        }
        if (!utils.getObjLength(pveData.presetTeams)) {
            guiManager.showDialogTips(CustomDialogId.BATTLE_NO_SQUAD);
            return;
        }

        this.uiCtrl.onClickPreset();
    }

    private _longClickCandidate(heroId: number) {
        this.loadSubView(VIEW_NAME.TIPS_HERO, heroId);
    }

    // 点击头像更换场上英雄
    private _clickCandidate(heroId: number) {
        if (pveData.pveConfig && pveData.checkHeroBan(heroId)) {
            if (pveTrialData.checkBanHero(heroId)) {
                switch (pveData.pveConfig.pveMode) {
                    case PVE_MODE.YYBOOK:
                        guiManager.showDialogTips(1000154);
                        break;
                    default:
                        guiManager.showDialogTips(CustomDialogId.PVE_NINEHELL_HERO_BAN);
                }
                
            } else {
                this.chapterInfo.showBanInfo();
            }
            return;
        }

        let maxCount: number = 5;   // 阵容最大限制个数

        let empty = this._getFirstEmptyPos(maxCount);
        if (empty < 0) {
            guiManager.showDialogTips(CustomDialogId.BATTLE_TEAM_FULL);
            return;
        }

        //检查位置是否禁位
        if (!this._checkPosEmplaceHero(empty)) {
            return;
        }

        //如果是pvp多阵容的情况下
        if (pvpData.pvpConfig?.step >= 0) {
            this._checkMultBattleArrayIn(heroId);
        }

        this._currSelect[empty] = heroId;
        this._addHero(heroId, empty);
        this._updateOneHeroHeadListData(heroId, false);
        this._refreshSelfFriendView();
        this.uiCtrl.refreshHerosTeamPower(this._currSelect);
    }

    /**检测点击的英雄是否已被占用 */
    private _checkMultBattleArrayIn(heroId: number) {
        this._battleArray.value.forEach(heros => {
            let idx = heros.indexOf(heroId);
            if (idx >= 0) {
                heros[idx] = 0;
            }
        })
    }

    // 获取第一个空位
    private _getFirstEmptyPos(maxCnt: number) {
        for (let i = 0; i < maxCnt; i++) {
            if(!this._checkPosEmplaceHero(BT_DEFAULT_POS[i])
                || this._currSelect[BT_DEFAULT_POS[i]] != 0
            ) {
                continue;
            }
            return BT_DEFAULT_POS[i];
        }
        return -1;
    }

    // 点击场上英雄撤下来
    private _unSelectHero(heroId: number) {
        let currIdx = this._currSelect.indexOf(heroId);
        if (currIdx >= 0) {
            this._currSelect[currIdx] = 0;
            this._sortCandidate();
            this._game.uiController.setPlus(currIdx, true);
            this._removeHero(currIdx);
            this._updateOneHeroHeadListData(heroId, true);
            this._refreshSelfFriendView();
            this.uiCtrl.refreshHerosTeamPower(this._currSelect);
        }
    }

    private _updateHeroList() {
        let heroes = this._currSelect;
        heroes.forEach((_id, _idx) => {
            if (_id) {
                this._addHero(_id, _idx);
            } else {
                this._removeHero(_idx);
            }
        })
        this.uiCtrl.refreshHerosTeamPower(this._currSelect);
    }

    private _removeAllHeros() {
        let heroes = this._game.heroCtrl.roleItems;
        this._removeAllHerosUIClick();
        heroes.forEach((_id, _idx) => {
            this._removeHero(_idx);
        })
    }

    private _removeAllHerosUIClick() {
        let heroes = this._game.heroCtrl.roleItems;
        heroes.forEach((_item, _idx) => {
            if (_item && _item.node)
                battleUtils.removeClickComp(_item.node)
        })
    }

    private _updateEnemyList() {
        let enemies: number[] = this._currEnemy.monsterIds;
        let pvp = !!pvpData.pvpConfig;
        enemies.forEach((_id, _idx) => {
            if (_id) {
                let cfg = configUtils.getMonsterConfig(_id);
                let monsterID = 0;
                let isHero = false;
                if (pveData.magicDoor) {
                    monsterID = pveFakeData.getRealHeroId(_id);
                    isHero = true;
                } else if (pvp) {
                    monsterID = _id;
                    isHero = true;
                } else {
                    monsterID = cfg.MonsterId;
                }

                // 隐藏定位、显示血量和能量
                let isShowDisplay: boolean = false;
                let isShowAbilityIcon: boolean = true;
                let hp: number;
                let power: number;
                if (pveData.isPVEMode(PVE_MODE.RESPECT) || pveData.isPVEMode(PVE_MODE.PURGATORY)) {
                    isShowDisplay = true;
                    isShowAbilityIcon = false;
                    let monster: data.ITrialRoleInfo = null;
                    if (pveData.isPVEMode(PVE_MODE.RESPECT)) {
                        monster = pveTrialData.respectData.Monsters.find((monster) => {
                            return monster.ID === _id;
                        });
                    } else if (pveData.isPVEMode(PVE_MODE.PURGATORY)) {
                        let point = pveTrialData.purgatoryData.Points.find((item) => {
                            return item.PointUID === pveData.pveConfig.pointUID;
                        });
                        monster = point.Monster.Roles.find((item) => {
                            return item.ID === _id;
                        });
                    }
                    
                    hp = monster.HPPercent / 10000;
                    power = monster.Energy / 100;
                }
                let roleMonster = this._game.monsterCtrl.addRoleNode(
                    new UIRole({
                        ID: monsterID,
                        UID: 0, HP: 0, MaxHP: 0,
                        Buffs: [], Halos: [],
                        Pos: _idx,
                        Power: 0, MaxPower: 0,
                        RoleState: gamesvr.RoleState.Normal,
                    }, ROLE_TYPE.MONSTER)
                )
                roleMonster.showDisplay(isShowDisplay, hp, power);
                if (true) {
                    roleMonster.showTopBg(true);
                    roleMonster.showAbilityIcon(isShowAbilityIcon);
                    let typeFormNum: number = isHero ? configUtils.getHeroBasicConfig(monsterID).HeroBasicAbility : cfg.MonsterType;
                    let heroAbilityAllTypeConfig = configUtils.getAllTypeConfig(ALLTYPE_TYPE.HERO_ABILITY, typeFormNum);
                    this._spriteLoader.changeSprite(roleMonster.abilityIcon, resPathUtils.getHeroAllTypeIconUrl(heroAbilityAllTypeConfig.HeroTypeIcon2));
                }

                roleMonster.node.targetOff(this);
                battleUtils.removeClickComp(roleMonster.node);

                let uiClickComp = roleMonster.node.addComponent(UIClick);
                uiClickComp.clickHandler = this._onUIClick.bind(this);
                uiClickComp.longClickProgressCb = this._onLongClickProgressChanged.bind(this);
            } else {
                this._game.monsterCtrl.removeRole(_idx)
            }
        })
        this.uiCtrl.refreshMonstersTeamPower(enemies);
    }

    private _removeHero(pos: number) {
        let roleItem = this._game.heroCtrl.roleItems[pos];
        cc.isValid(roleItem) && battleUtils.removeClickComp(roleItem.node);
        this._game.heroCtrl.removeRole(pos);
        this._game.uiController.setPlus(pos, true);
    }

    private _addHero(id: number, pos: number) {
        let cfg = configUtils.getHeroConfig(id);
        let heroID = pveData.magicDoor ? pveFakeData.getRealHeroId(id) : cfg.HeroId;
        let uiRole = new UIRole({
            // 奇门遁甲假英雄
            ID: heroID,
            UID: 0,
            HP: 0, MaxHP: 0,
            Buffs: [], Halos: [],
            Pos: pos, Power: 0,
            RoleState: gamesvr.RoleState.Normal,
            MaxPower: 0,
        }, ROLE_TYPE.HERO);
        pveData.magicDoor && (uiRole.fakeId = id);

        // 隐藏定位、显示血量和能量
        let isShowDisplay: boolean = false;
        let isShowAbilityIcon: boolean = true;
        let hp: number;
        let power: number;
        if (pveData.isPVEMode(PVE_MODE.RESPECT) || pveData.isPVEMode(PVE_MODE.PURGATORY)
            || pveData.isPVEMode(PVE_MODE.FAIRY_ISLAND)) {
            isShowDisplay = true;
            isShowAbilityIcon = false;
            let heroState = pveData.getHeroStateInPVE(id);
            hp = heroState.hpPercent;
            power = heroState.energyPercent * HERO_ENERGY_MAX / 100;
        }
        let itemRole = this._game.heroCtrl.addRoleNode(uiRole);
        itemRole.showDisplay(isShowDisplay, hp, power);
        if(true){
            itemRole.showTopBg(true);
            itemRole.showAbilityIcon(isShowAbilityIcon);
            let heroBasicCfg = configUtils.getHeroBasicConfig(heroID);
            let heroAbilityAllTypeConfig = configUtils.getAllTypeConfig(ALLTYPE_TYPE.HERO_ABILITY, heroBasicCfg.HeroBasicAbility);
            this._spriteLoader.changeSprite(itemRole.abilityIcon, resPathUtils.getHeroAllTypeIconUrl(heroAbilityAllTypeConfig.HeroTypeIcon2));
        }
        itemRole.node.targetOff(this);
        battleUtils.removeClickComp(itemRole.node);
        
        let uiClickComp = itemRole.node.addComponent(UIClick);
        uiClickComp.isDrag = true;
        uiClickComp.clickHandler = this._onUIClick.bind(this);
        uiClickComp.longClickProgressCb = this._onLongClickProgressChanged.bind(this);

        this._game.uiController.setPlus(pos, false);
        itemRole.node.parent.zIndex = this._getDefaultZIndex(pos)
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
            this._onLongClickInterrupted(target);
        }
    }

    private _onTouchStartRole(target: cc.Node){
        let roleComp = target.getComponent(ItemRole);
        if(roleComp.role.roleType != ROLE_TYPE.HERO) return;
        target.parent.zIndex = cc.macro.MAX_ZINDEX;
    }

    private _onClickRole(target: cc.Node){
        let roleComp = target.getComponent(ItemRole);
        if(roleComp.role.roleType != ROLE_TYPE.HERO) return;
        let roleIndex = target.getComponent(ItemRole).role.pos;
        this._reduceOneRole(roleIndex, target);
    }

    private _onLongClickRole(target: cc.Node){
        let roleComp = target.getComponent(ItemRole);
        if(roleComp.role.roleType == ROLE_TYPE.MONSTER){
            let pvp = !!pvpData.pvpConfig;
            let isHero = false;
            (pveData.magicDoor || pvp) && (isHero = true);
            let viewName = VIEW_NAME.TIPS_HERO;
            !isHero && (viewName = VIEW_NAME.TIPS_MONSTER);
            this.loadSubView(viewName, this._currEnemy.monsterIds[roleComp.role.pos]);
            return;
        }

        let roleIndex = roleComp.role.pos;
        this._candidateMoved[roleIndex] = false;
        this.loadSubView(VIEW_NAME.TIPS_HERO, this._currSelect[roleIndex]);
        target.parent.zIndex = this._getDefaultZIndex(roleIndex);
    }

    private _onDragEndRole(target: cc.Node){
        let roleIndex = target.getComponent(ItemRole).role.pos;
        // 判断是否是交换位置
        let nearData = this._getNearestRolePos(target);
        if (utils.checkTwoNodeIsIntersect(nearData.node, target)) {
            // 目标位置是禁位时，从哪来回哪去
            let targetPos = this._checkPosEmplaceHero(nearData.index) ? nearData.index : roleIndex;
            this._changeRolePos(target, roleIndex, targetPos);
        } else {
            this._reduceOneRole(roleIndex, target);
        }
        this._candidateMoved[roleIndex] = false;
    }

    private _onLongClickInterrupted(target: cc.Node){
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
     * 获得最近的角色位置
     * @param event
     * @returns
     */
    private _getNearestRolePos(target: cc.Node) {
        let posNode: cc.Node = null;
        let minDistance: number = 600;
        let index: number = -1;
        // let targetWorldPos = event.target.convertToWorldSpaceAR(event.target.position);
        let targetWorldPos = utils.getWorldPosition(target);
        for (let i = 0; i < this._rolesPosList.length; ++i) {
            let distance: number = cc.Vec2.distance(utils.getWorldPosition(this._rolesPosList[i]), targetWorldPos);
            if (distance < minDistance) {
                index = i;
                posNode = this._rolesPosList[i];
                minDistance = distance;
            }
        }
        // console.log('getNearestRolePos:', { node: posNode, index: index });
        return { node: posNode, index: index };
    }

    /**
     * 改变交换英雄的位置
     * @param srcRole
     * @param srcIndex
     * @param decIndex
     */
    private _changeRolePos(srcRole: cc.Node, srcIndex: number, decIndex: number) {
        // console.log('_changeRolePos', srcIndex, decIndex);
        let decRole = this._game.heroCtrl.getRoleNodeByPos(decIndex);
        let srcParent: cc.Node = this._game.heroCtrl.roleNodes[srcIndex];
        let decParent: cc.Node = this._game.heroCtrl.roleNodes[decIndex];

        if (decRole) {
            // 双方都有
            this._game.uiController.setPlus(srcIndex, false);
            if (srcIndex != decIndex) {
                decRole.setParent(srcParent);
                decRole.setPosition(cc.v2(0, 0));
                let itemDec = decRole.getComponent(ItemRole);
                itemDec.role.pos = srcIndex;
                this._game.heroCtrl.roleItems[srcIndex] = itemDec;
                this._currSelect[srcIndex] = pveData.magicDoor ? decRole.getComponent(ItemRole).role.orignalId : decRole.getComponent(ItemRole).role.id;
                this._currSelect[decIndex] = pveData.magicDoor ? srcRole.getComponent(ItemRole).role.orignalId : srcRole.getComponent(ItemRole).role.id;
            }
        } else {
            this._game.heroCtrl.roleItems[srcIndex] = null;
            this._game.uiController.setPlus(srcIndex, true);
            this._currSelect[srcIndex] = 0;
            this._currSelect[decIndex] = pveData.magicDoor ? srcRole.getComponent(ItemRole).role.orignalId : srcRole.getComponent(ItemRole).role.id;
        }

        srcRole.setParent(decParent);
        srcRole.setPosition(cc.v2(0, 0));

        srcParent.zIndex = this._getDefaultZIndex(srcIndex);
        decParent.zIndex = this._getDefaultZIndex(decIndex)

        this._game.uiController.setPlus(decIndex, false);
        let itemSrc = srcRole.getComponent(ItemRole);
        itemSrc.role.pos = decIndex;
        this._game.heroCtrl.roleItems[decIndex] = itemSrc;
    }

    /**
    * 去除一个英雄形象
    * @param index
    * @param roleIndex
    */
    private _reduceOneRole(roleIndex: number, role: cc.Node) {
        // console.log('_reduceOneRole');
        let roleCmp = role.getComponent(ItemRole);
        // roleCmp.deInit();
        roleCmp.node.parent.zIndex = this._getDefaultZIndex(roleIndex);
        this._unSelectHero(pveData.magicDoor ? roleCmp.role.orignalId : roleCmp.role.id);
    }

    /**
     * 点击切换队伍
     * @param toggle
     * @param customEventData
     */
    onClickTeamToggle(toggle: cc.Toggle, customEventData: string) {
        let newIndex = parseInt(customEventData);

        if (newIndex == this._curTeamIndex) return;

        let team = pveData.getTeamByIndex(newIndex);
        let newTeam = battleUtils.parseTeamdata(team);
        let currSetp = pveData.pveConfig? pveData.pveConfig.step:0
        let hasBanHero = false
        newTeam.forEach( _v => {
            if (_v) hasBanHero ||= pveData.checkPveBanHero(_v)
        })
        
        if (hasBanHero) {
            this.chapterInfo.showBanInfo();
            return;
        }

        let confirmSelect = ()=> {
            this._curTeamIndex = newIndex;
            //剔除禁用英雄
            // 节点清理
            this._removeAllHeros();
            this._currSelect = [];

            this._currSelect = newTeam.map(_hid => {
                if(pveData.checkHeroBan(_hid)) {
                    return 0;
                } else {
                    return _hid;
                }
            });
            this._battleArray.set(currSetp, [...this._currSelect])
            this._updateHeroList();
            this._resetCandidateData();
            this._refreshSelfFriendView();
            this.heroListComp.onRefresh(this._candidate, this._currSelect, pveData.magicDoor, this._battleArray.value)
            guiManager.showDialogTips(99000057);
            this.presetList.updateSelect(this._curTeamIndex);
        }

        let findArray = this._battleArray.checkDuplicate(newTeam, currSetp);
        if (findArray != -1) {
            guiManager.showMessageBox(this._game.node, {
                content: "部分英雄在其它场次队伍中，是否调遣至当前编队？", 
                leftStr: "确 认", 
                leftCallback: (msg: MessageBoxView)=> {
                    msg.closeView();
                    confirmSelect();
                },
                rightStr: "取 消",
                rightCallback: (msg: MessageBoxView)=> {
                    msg.closeView();
                },
            })
        } else {
            confirmSelect();
        }
    }

    private _whenBattleStart() {
        this.uiCtrl.hide();
        this.pvpMultAdjustTeamBtn.node.active = false;
        let roles = this._game.heroCtrl.roleItems;
        let self = this;
        roles.forEach(_r => {
            if (_r && cc.isValid(_r.node)){
                _r.node.targetOff(self);
                _r.showTopBg(false);
            }
        });

        let enemies = this._game.monsterCtrl.roleItems;
        enemies.forEach(_r => {
            if (_r && cc.isValid(_r.node)){
                _r.node.targetOff(self);
                _r.showTopBg(false);
            }
        });
    }

    /**
     * 检查特定位置是否允许放置英雄
     * @param pos 预放置位置
     * @returns  true表示可以放置，反之不可以
     */
    private _checkPosEmplaceHero(pos: number) {
        if(pos < 0 || pos >= this._currSelect.length) return false;

        let posCfg: string[] = null;
        // 云端梦境存在禁位
        if(pveData.isPVEMode(PVE_MODE.CLOUD_DREAM)) {
            let lessonCfg: cfg.PVECloudDreamLesson = configUtils.getCloudDreamLessonConfig(pveData.pveConfig.lessonId);
            if(!lessonCfg || !lessonCfg.PVECloudDreamLessonUsePosition || lessonCfg.PVECloudDreamLessonUsePosition.length == 0) {
                return true;
            }

            posCfg = utils.parseStringTo1Arr(lessonCfg.PVECloudDreamLessonUsePosition, ';');
        }

        if (pveData.isPVEMode(PVE_MODE.RESPECT)) {
            // 致师之礼 - 固定中间放1个，其它是禁位
            posCfg = ["0", "0", "1", "0", "0"];

        }

        if (posCfg) {
            return posCfg.some((ele, idx) => {
                return idx == pos && parseInt(ele) != 0;
            }); 
        }

        return true;
    }

    private _resetHeroData() {
        this._curTeamIndex = -1;
        if (pveData.pveConfig) {
            switch (pveData.pveConfig.pveMode) {
                case PVE_MODE.MAGIC_DOOR: {//奇门遁甲
                    this._currSelect = this._getMagicDoorDefaultHero();
                    return;
                }
                case PVE_MODE.NINE_HELL: {//九幽森罗
                    // 默认用空的，不默认就是上次选的
                    if (this._currSelect.length < 5) {
                        this._currSelect = [0, 0, 0, 0, 0]
                    }
                    break;
                }
                case PVE_MODE.RESPECT: {
                    // 致师之礼
                    this._currSelect = this._getChallengeDefaultHero();
                    break;
                }
                case PVE_MODE.FAIRY_ISLAND: {
                    this._currSelect = this._getIslandDefaultHero();
                    break;
                }
                case PVE_MODE.CLOUD_DREAM: {
                    //云端梦境
                    this._currSelect = this._getCloudDreamDefaultHeros();
                    break;
                }
                case PVE_MODE.XIN_MO_FA_XIANG:
                    // 心魔法相
                    this._currSelect = this._getXinMoDefaultHeros();
                    break;
				        case PVE_MODE.PURGATORY:
                    // 无间炼狱
                    this._currSelect = this._getPurgatoryDefaultHeroes();
                    break;
                default: {
                    let defaultInfo = this._getNormalDefaultHero();
                    this._currSelect = defaultInfo.heroes;
                    this._curTeamIndex = defaultInfo.teamIdx;
                    break;
                }
            }
        } else if (pvpData.pvpConfig) {
            // 战斗回放
            if (pvpData.isReplay) {
                let heros: number[] = [];
                let teams = pvpData.pvpConfig.replay.Teams;
                if (teams && teams[0]) {
                    teams[0].Roles.forEach( _r => {
                        let pos = _r.Pos || 0
                        heros[pos] = _r.ID
                    })
                }
                this._currSelect = heros;
                return;
            } else {
                let defaultInfo = this._getNormalDefaultHero();
                this._currSelect = defaultInfo.heroes;
                this._curTeamIndex = defaultInfo.teamIdx;
            }
        }
    }

    //设置奇门遁甲阵容
    private _getMagicDoorDefaultHero(): number[] {
        let local: number [] = localStorageMgr.getAccountStorage(SAVE_TAG.MAGIC_DOOR_LAST_TEAM);
        let heros = pveFakeData.getSeedFakeHeroList();
        let results: number[] = [0, 0, 0, 0, 0];
        // 为什么判断map，是因为有缓存的旧数据用的string
        if(local && local.length && local.map) {
            results = local.map((_h:any)=>{ return (_h && heros.indexOf(_h) != -1) ? _h : 0});
        }
        battleUtils.addFullHero(results, null, heros);
        return results;
    }

    // 获取致师之礼的阵容
    private _getChallengeDefaultHero(): number[] {
        let local: number[] = localStorageMgr.getAccountStorage(SAVE_TAG.CHALLENGE_LAST_TIME);
        let results: number[] = [0, 0, 0, 0, 0];
        
        let hero: data.ITrialRoleInfo = null;
        if (local && local.length && local.map) {
            // 需要判断英雄是否存活
            results = local.map((_h) => {
                hero = pveTrialData.respectData.Heroes.find((hero) => { return hero.ID === _h });
                return hero && hero.HPPercent > 0 ? hero.ID : 0; 
            });
        }

        // 补位
        if (results[2] === 0) {
            let tempHeroes = pveTrialData.respectData.Heroes.filter((item) => { return item.HPPercent > 0; });
            tempHeroes.sort((left, right) => {
                // 战力由高到低
                let heroUnitA = new HeroUnit(left.ID);
                let heroUnitB = new HeroUnit(right.ID);
                return heroUnitB.getCapability() - heroUnitA.getCapability();
            });

            if (tempHeroes.length > 0) {
                results[2] = tempHeroes[0].ID;
            }
        }

        return results;
    }

    /**蓬莱仙岛默认阵容*/
    private _getIslandDefaultHero(): number[] {
        let local: number[] = localStorageMgr.getAccountStorage(SAVE_TAG.ISLAND_LAST_TEAM);
        let results: number[] = [0, 0, 0, 0, 0];
        
        let hero: data.ITrialRoleInfo = null;
        if (local && local.length && local.map) {
            results = local.map((_h) => {
                hero = pveTrialData.islandData.Heroes.find((hero) => { return hero.ID === _h });
                return hero && hero.HPPercent > 0 ? hero.ID : 0; 
            });
        }

        let heroList = bagData.heroList.concat();
        heroList.sort((a:data.IBagUnit, b:data.IBagUnit) => {
            let heroUnitA = new HeroUnit(a.ID);
            let heroUnitB = new HeroUnit(b.ID);
            return heroUnitB.getCapability() - heroUnitA.getCapability();
        })

        results.forEach((id, index) => {
            if (!id && heroList.length) { 
                for (let id in heroList) {
                    if (results.indexOf(heroList[id].ID) < 0) {
                        let hero = pveTrialData.islandData.Heroes.find((hero) => { return hero.ID === heroList[id].ID });
                        if (!hero || hero.HPPercent > 0) {
                            results[index] = heroList[id].ID;          
                            break;   
                        }
                    }
                }
            } 
        })

        return results;
    }

    //获取云端梦境的默认阵容
    private _getCloudDreamDefaultHeros(): number[] {
        let results: number[] = [0, 0, 0, 0, 0];
        let lessCfg: cfg.PVECloudDreamLesson = configUtils.getCloudDreamLessonConfig(pveData.pveConfig.lessonId);
        if(!lessCfg) return results;
        let posCfg = utils.parseStringTo1Arr(lessCfg.PVECloudDreamLessonUsePosition, ';');

        posCfg.forEach((ele, idx) => {
            //临时将禁用位置设置为-1
            if(parseInt(ele)== 0 && idx < results.length) {
                results[idx] = -1;
            }
        });
        battleUtils.addFullHero(results, pveData.pveConfig.banHeroList);
        //还原禁用位置
        results.forEach((ele, idx) => {
            if(ele == -1 && idx < results.length){
                results[idx] = 0;
            }
        })
        return results;
    }

    /** 获取无间炼狱的阵容 */
    private _getPurgatoryDefaultHeroes(): number[] {
        let local: number[] = localStorageMgr.getAccountStorage(SAVE_TAG.PURGATORY_LAST_TIME);
        let results: number[] = [0, 0, 0, 0, 0];
        
        let purgatoryHeroes: data.ITrialRoleInfo[] = pveTrialData.getPurgatoryHeroes();
        let hero: data.ITrialRoleInfo = null;
        // 优先使用本地存储阵容
        if (local && local.length && local.map) {
            // 过滤掉阵亡的英雄
            results = local.map((_h) => {
                hero = purgatoryHeroes.find((item) => { return item.ID === _h; });
                return hero && hero.HPPercent > 0 ? hero.ID : 0; 
            });
        }

        // 阵亡的英雄
        let banHeroes: number[] = [];
        purgatoryHeroes.forEach((item) => {
            if (item.HPPercent <= 0) {
                banHeroes.push(item.ID);
            }
        });

        // 补全
        battleUtils.addFullHero(results, banHeroes);  

        return results;
    }

    // 心魔法相默认阵容
    private _getXinMoDefaultHeros(): number[] {
        let results: number[] = localStorageMgr.getAccountStorage(SAVE_TAG.XIN_MO_LAST_TEAM)
            ? Array.from(localStorageMgr.getAccountStorage(SAVE_TAG.XIN_MO_LAST_TEAM)) : [0, 0, 0, 0, 0];
        let banheros: number[] = null;
        if(pveTrialData.trialDevilData && pveTrialData.trialDevilData.data
            && pveTrialData.trialDevilData.data.Heroes && pveTrialData.trialDevilData.data.Heroes.length > 0
        ) {
            pveTrialData.trialDevilData.data.Heroes.forEach(ele => {
                if(ele.HPPercent == 0) {
                  banheros = banheros || [];
                  banheros.push(ele.ID);
                  (results.indexOf(ele.ID) != -1) && (results[results.indexOf(ele.ID)] = 0);
                }
            })
        }
        battleUtils.addFullHero(results, banheros);
        return results;
    }

    private _getNormalDefaultHero (): {heroes: number[], teamIdx: number} {
        let results: number[] = [0, 0, 0, 0, 0];
        let currStep = 0, saveTag = "", teamIndex = -1;
        //优先使用本地的默认阵容，没有则使用预设编队
        if (pveData.pveConfig) {
            currStep = pveData.pveConfig ? pveData.pveConfig.step || 0 : 0;
            saveTag = SAVE_TAG.BATTLE_LAST + `${currStep}`;
        }

        if (pvpData.pvpConfig) {
            currStep = pvpData.pvpConfig.step || 0;
            saveTag = SAVE_TAG.PVP_MULT_BATTLE_LAST_TEAM + `${currStep}`;
        }        
 
        
        let local: number[] = localStorageMgr.getAccountStorage(saveTag);
        if (local && local.length && local.map) {
            teamIndex = -1;
            results = local.map((_h:any)=>{ return (_h && bagData.getItemByID(_h))? _h:0;});
        } else {
            let preset = pveData.presetTeams;
            for (let key in preset) {
                if (preset[key] && preset[key].Heroes) {
                    teamIndex = parseInt(key);
                    results = battleUtils.parseTeamdata(preset[key]);
                    break;
                }
            }
        }
  
        //没有满阵容，尝试补齐空位
        // let fullHero = battleUtils.addFullHero(results);
        return { heroes: results, teamIdx: teamIndex};
    }

    private _resetMonsterData() {
        //从大厅入口读章节关卡配置
        let currLessonId = pveData.pveConfig ? pveData.pveConfig.lessonId:0;
        let currStep = pveData.pveConfig ? pveData.pveConfig.step || 0: 0;
        let monsterIds: number[] = [];
        let monsterGroup = 0;

        // PVE
        if (pveData.pveConfig) {
            let mode = pveData.pveConfig.pveMode;
            if (mode == PVE_MODE.ADVENTURE_LESSON) {
                if (!currLessonId) currLessonId = pveData.getCurrLessonId()
                let emenyStr = pveData.getMonsterGroupByLesson(currLessonId);
                monsterGroup = emenyStr[currStep];
                let groupCfg = configUtils.getMonsterGroupConfig(monsterGroup);
                monsterIds.push(groupCfg.MonsterId1? groupCfg.MonsterId1 : 0);
                monsterIds.push(groupCfg.MonsterId2? groupCfg.MonsterId2 : 0);
                monsterIds.push(groupCfg.MonsterId3? groupCfg.MonsterId3 : 0);
                monsterIds.push(groupCfg.MonsterId4? groupCfg.MonsterId4 : 0);
                monsterIds.push(groupCfg.MonsterId5? groupCfg.MonsterId5 : 0);
            } else if (mode == PVE_MODE.CLOUD_DREAM) {
                monsterIds = pveTrialData.cloudInfo.LessonMap[pveData.pveConfig.lessonId].MonsterIDList;
            } else if (mode == PVE_MODE.NINE_HELL) {
                monsterIds = pveTrialData.hellInfo.LessonMap[pveData.pveConfig.lessonId].MonsterIDList;
            } else if (mode == PVE_MODE.MAGIC_DOOR) {
                // 奇门遁甲 test
                monsterIds = pveData.getMagicMonsterList(pveData.pveConfig.lessonId);
            } else if (mode == PVE_MODE.MAIN_SCENE_TEST) {
                // 大厅进入测试专用
                monsterGroup = 3016;
                // monsterGroup = 160001;
                let groupCfg = configUtils.getMonsterGroupConfig(monsterGroup);
                monsterIds = utils.getMonsterIdsByCfg(groupCfg)
            } else if (mode == PVE_MODE.RANDOM_FIGHT) {
                if(limitData.enterRandomFightData) {
                    monsterIds = [];
                    let enemyList = limitData.enterRandomFightData.team;
                    for(let i = 0; i < 5; ++i) {
                        monsterIds.push(enemyList[i] ? enemyList[i] : 0);
                    }
                }
            } else if (mode == PVE_MODE.RESPECT) {
                // 致师之礼
                monsterIds = pveData.pveConfig.monsterIds;
            } else if (mode == PVE_MODE.FAIRY_ISLAND) {
                monsterIds = pveData.pveConfig.monsterIds;
            } else if (mode == PVE_MODE.XIN_MO_FA_XIANG) {
                // 心魔法相
                monsterIds = pveData.pveConfig.monsterIds;
                monsterGroup = pveData.pveConfig.monsterGroupID;
			} else if (mode == PVE_MODE.PURGATORY) {
                // 无间炼狱
                monsterIds = pveData.pveConfig.monsterIds;
            } else if (mode == PVE_MODE.YYBOOK) {
                // 阴阳宝鉴
                monsterGroup = pveData.pveConfig.monsterGroupIDs[currStep];
                let groupCfg = configUtils.getMonsterGroupConfig(monsterGroup);
                monsterIds.push(groupCfg.MonsterId1? groupCfg.MonsterId1 : 0);
                monsterIds.push(groupCfg.MonsterId2? groupCfg.MonsterId2 : 0);
                monsterIds.push(groupCfg.MonsterId3? groupCfg.MonsterId3 : 0);
                monsterIds.push(groupCfg.MonsterId4? groupCfg.MonsterId4 : 0);
                monsterIds.push(groupCfg.MonsterId5? groupCfg.MonsterId5 : 0);
            } else {
                let currLessonId = pveData.pveConfig ? pveData.pveConfig.lessonId : pveData.getCurrLessonId();
                let emenyStr = pveData.getMonsterGroupByLesson(currLessonId);
                let randomInt = Math.floor(Math.random() * emenyStr.length);
                let emenies = emenyStr[randomInt];
                let groupCfg = configUtils.getMonsterGroupConfig(emenies);
                monsterIds = utils.getMonsterIdsByCfg(groupCfg)
            }
        } else if (pvpData.pvpConfig) {
            monsterIds = pvpData.getEnemyGroup();
        }

        this._currEnemy = {
            monsterIds: monsterIds, 
            group: monsterGroup, 
            step: currStep, 
            lessonId: currLessonId,
        };
    }

    // 更新备选英雄数据
    private _resetCandidateData() {
        this._candidate = [];
        let allHeros: number[] = null;
        let curr = this._currSelect;
        // 奇门遁甲使用假英雄
        if(pveData.magicDoor){
            allHeros = pveFakeData.getSeedFakeHeroList().filter((ele) => {
                return curr.indexOf(ele) == -1;
            });
        } else if (pveData && pveData.pveConfig && pveData.pveConfig.pveMode === PVE_MODE.RESPECT) {
            // 致师之礼：使用开启挑战时选择的英雄
            allHeros = pveTrialData.respectData.Heroes.map((hero) => {
                return hero.ID;
            }).filter((heroID) => {
                return curr.indexOf(heroID) == -1;
            });
        } else {
            allHeros = bagData.heroList.
                    map(_h => { return _h.ID; }).
                    filter(_hId => { return curr.indexOf(_hId) == -1;})
        }
        this._candidate = allHeros;
        this._sortCandidate();
    }

    private _refreshFriendView () {
        this._refreshSelfFriendView();
        this._refreshEnemyFriendView();
    }

    /**
     * 刷新已上阵激活的仙缘 自己家的
     */
    private _refreshSelfFriendView() {
        let seleHeros = this._currSelect;
        let candidateHeros = this._candidate;

        //奇门遁甲中 _currSelect和_candidate存储的不是英雄ID，需要转化下
        if(pveData.magicDoor){
            seleHeros = seleHeros.map((ele) => {
              return ele != 0 ? pveFakeData.getRealHeroId(ele) : ele;
            });

            candidateHeros = candidateHeros.map((ele) => {
              return ele != 0 ? pveFakeData.getRealHeroId(ele) : ele;
            });
        }

        this.friendCompS.show(seleHeros, candidateHeros, true);
    }

    //刷新敌方阵容仙缘
    private _refreshEnemyFriendView() {
        if (pvpData.pvpConfig) {
            let monsterIds = pvpData.getEnemyGroup();
            this.friendCompE.show(monsterIds, [], true)
            return;
        }

        //奇门遁甲敌方阵容也是英雄，需要检查仙缘
        if(pveData.magicDoor){
            let enemyHeros = this.monster.monsterIds.map(_monsterId => {
                if(_monsterId == 0) return 0;
                return pveFakeData.getRealHeroId(_monsterId);
            });
            this.friendCompE.show(enemyHeros, [], true);
            return;
        }
    }

    private _sortCandidate() {
        if(pveData.pveConfig && pveData.pveConfig.pveMode == PVE_MODE.NINE_HELL) {
            this._candidate.sort((_a, _b) => {
                let aOrder = pveData.checkHeroBan(_a) ? 1 : -1;
                let bOrder = pveData.checkHeroBan(_b) ? 1 : -1;
                return aOrder - bOrder;
            });
        } else {
            this._candidate.sort((_a, _b) => {
                let heroIdA: number = 0;
                let heroIdB: number = 0;
                if(pveData.magicDoor) {
                    heroIdA = pveFakeData.getRealHeroId(_a);
                    heroIdB = pveFakeData.getRealHeroId(_b);
                } else {
                    heroIdA = _a;
                    heroIdB = _b;
                }
                let aUnit: HeroUnit = new HeroUnit(heroIdA);
                let bUnit: HeroUnit = new HeroUnit(heroIdB);
                return bUnit.getCapability() - aUnit.getCapability();
            });
        }
    }

    // 更新多阵容默认英雄
    // 必须先candidatesort之后才执行_updateMultiHero
    private _resetMultiHeroData () {     
        let setMultLocalData:Function = (key:string,index:number) => {
            let localMul: number[] = localStorageMgr.getAccountStorage(key);
            if (localMul && localMul.length && localMul.map) {
                let subRoles = localMul.map((_h:any)=>{
                    return (_h && bagData.getItemByID(_h))? _h:0;
                });
                this._battleArray.set(index, subRoles);
            } else {
                this._battleArray.set(index, [0, 0, 0, 0, 0]);
            }
        }

        let currLesson = this._currEnemy.lessonId;
        let cfg = configUtils.getLessonConfig(currLesson);
        let len = 0;
        let monsterGroupIDs = pveData.pveConfig?.monsterGroupIDs;

        if (cfg && cfg.LessonMonsterGroupId) {
            len = cfg.LessonMonsterGroupId.split(";").length;
        } else if (monsterGroupIDs && monsterGroupIDs.length > 0) {
            len = monsterGroupIDs.length;
        }

        for (let i = 0; i < len; i++) {
            setMultLocalData(SAVE_TAG.BATTLE_LAST + i, i);
        }

        //PVP多阵容初始化
        if (pvpData.checkPVPMulitBattle()) {
            for (let i = 0; i < PVP_MULT_BALLTE_MAX; i++){
                setMultLocalData(SAVE_TAG.PVP_MULT_BATTLE_LAST_TEAM + i, i);
            }
        }
    }

    private _showContent() {
        //pvp多阵容-巅峰对决展示不展示备战
        if (pvpData.pvpConfig && pvpData.pvpConfig.step && pvpData.checkPVPMulitBattle()) { return false; }

        // 优先判断，多阵容战斗第二场开始不管怎么样也要现实备战界面
        if (pveData.pveConfig && pveData.pveConfig.step) { return true; }
        
        // 快速开始不显示备战界面
        if (pveData.pveConfig && pveData.pveConfig.useDefaultSquad) { return false; }

        // 回放也没必要显示备战
        if (pvpData.pvpConfig && pvpData.pvpConfig.replay) { return false; }

        return true;
    }

    onClickSetLessonTest () {
        let num = parseInt(this.lbLessonId.string);
        let cfg:any = configUtils.getLessonConfig(num)
        if (cfg == null) {
            cfg = configManager.getConfigByKey("pveDailyLesson", num)
        }
        if (cfg == null) {
            guiManager.showTips("找不到关卡怪物")
            return
        } else {
            guiManager.showTips("设置成功")
        }

        this._currEnemy.lessonId = cfg.LessonId || cfg.PVEDailyLessonId
        pveData.pveConfig.lessonId = cfg.LessonId || cfg.PVEDailyLessonId
    }

    onClickFriendSkillSelf () {
        if (this.friendCompS.canShowSkill()) {
            this._game.showSubViewInGame(VIEW_NAME.FRIENDS_POPVIEW,  this.friendCompS.friendIDs);
        }
    }

    onClickFriendSkillEmeny () {
        if (this.friendCompE.canShowSkill()) {
            this._game.showSubViewInGame(VIEW_NAME.FRIENDS_POPVIEW, this.friendCompE.friendIDs);
        }
    }

    onClickChangeSubBattle (click: any, customEventData: string) {
        let clickIdx = parseInt(customEventData);
        if (pveData?.pveConfig) {
            let pveCfg = pveData.pveConfig;
            if (clickIdx == pveCfg.step) return;
    
            let passSteps = pveCfg.passStep || [];
            if (passSteps.indexOf(clickIdx) >= 0) {
                guiManager.showTips("已战胜该关卡.")
                return;
            }
            this._battleArray.set(pveCfg.step, [...this._currSelect])
    
            pveData.pveConfig.step = clickIdx;    
        } else if (pvpData?.pvpConfig) {
            if (clickIdx == pvpData.pvpConfig.step) return;

            this._battleArray.set(pvpData.pvpConfig.step, [...this._currSelect])
            pvpData.pvpConfig.step = clickIdx;
            this._setStartGameBtnSpr(clickIdx);
        }   
        
        this._currEnemy.step = clickIdx;
        this._currSelect = this._battleArray.get(clickIdx)

        this._resetMonsterData();
        this._resetCandidateData();
 
        this._updateEnemyList();
        this._updateHeroList();

        if (pvpData.checkPVPMulitBattle()) {
            this.chapterInfo.onRefresh({ pvpMode: pvpData.pvpConfig.pvpMode });
        } else {
            this.chapterInfo.onRefresh({ lessonID: this._currEnemy.lessonId });    
        }
        this.heroListComp.onRefresh(this._candidate, this._currSelect, pveData.magicDoor, this._battleArray.value);
        this._autoSaveBattleArray();
    }

    /**切换出战按钮的贴图*/
    private _setStartGameBtnSpr(idx: number) {
        idx = idx < 2 ? 0 : 1;
        this.startGameBtnSpr.spriteFrame = this.enterSprs[idx];
    }

    private _getDefaultZIndex (pos: number) {
        return pos *2 +1
    }

    private _checkShowToggle () {
        if (pveData.pveConfig && this._enterCnt == 1) {
            let mode = pveData.pveConfig.pveMode;
            if (mode == PVE_MODE.ADVENTURE_LESSON) {
                let cfg = configUtils.getLessonConfig(this._currEnemy.lessonId);
                let len = cfg.LessonMonsterGroupId.split(";").length;
                if (len > 1) {
                    let strTag = SAVE_TAG.BATTLE_MULTI_TIPS + this._currEnemy.lessonId
                    let local = localStorageMgr.getAccountStorage(strTag);
                    if (!local) {
                        guiManager.showMessageBox(this._game.node, {
                            content: "本次挑战为单队挑战，挑战获胜后才能继续挑战关卡剩余队伍。",
                            leftStr: "确 认",
                            leftCallback: (msgbox: MessageBoxView, isChecked: boolean) => {
                                if (isChecked) {
                                    localStorageMgr.setAccountStorage(strTag, 1);
                                }
                                msgbox.closeView();
                            },
                            showToggle: true,
                            descToggle: "不再弹出提示"
                        })
                    }
                }
            }
        }
    }

    /**
     * 不过什么情况，多阵容战斗第一次进入的时候就重置一下本地存储，保证上阵都是满的
     */
    private _resetLocalData () {
        if (this._enterCnt!= 1) return;

        let heroHad = bagData.heroList.filter( _v => {
            if (pveData.checkHeroBan(_v.ID)) return false
            return true
        });
       
        heroHad.sort((hero1,hero2)=>{
            let heroUnit1 = bagData.getHeroById(hero1.ID);
            let heroUnit2 = bagData.getHeroById(hero2.ID);
            return heroUnit2.getCapability() - heroUnit1.getCapability();
        });

        // 默认本地的原来的阵容
        let orgin: number[][] = []
        let tag = SAVE_TAG.BATTLE_LAST;
        //如果有pvp的数据，重置tag
        if (pvpData.pvpConfig) tag = SAVE_TAG.PVP_MULT_BATTLE_LAST_TEAM;
        for (let i = 0; i < 3; i++) {
            let curr = [0, 0, 0, 0, 0];
            let tagStr = tag + i;
            let local: number[] = localStorageMgr.getAccountStorage(tagStr);
            if (local && local.length && local.map) {
                curr = local.map((_h: any) => {
                    // 由于切换账户或者禁用更新的情况，本地读到的阵容不一定合理，要做完整的过滤
                    let isOK: boolean = _h && bagData.getItemByID(_h) && !pveData.checkHeroBan(_h);

                    return isOK ? _h:0;
                });
            }
            orgin[i] = curr;
        }

        for (let i = 0; i < 3; i++) {
            if (!heroHad.length) break;

            let origriArray = orgin[i];
            let ignores: number[] = [];
            // 多阵容去重，一个角色只能出现在一个阵容
            orgin.forEach( (v, index) => {
                if (index < i) {
                    ignores = ignores.concat(...v).filter( _v => {return _v!= 0})
                }
            })
            for (let j = 0; j < BT_DEFAULT_POS.length; j++) {
                let pos = BT_DEFAULT_POS[j];
                if (ignores.indexOf(origriArray[pos]) != -1 && origriArray[pos]) {
                    origriArray[pos] = 0;
                }
                if (origriArray[pos] == 0) {
                    for (let n = 0; n < heroHad.length; n++) {
                        let hID = heroHad[n].ID;
                        if (ignores.indexOf(hID) == -1 && origriArray.indexOf(hID) == -1) {
                            ignores.push(hID);
                            origriArray[pos] = hID;
                            break;
                        }
                    }
                }

                ignores.push(origriArray[pos])
            }
            let tagStr = pvpData.pvpConfig ? SAVE_TAG.PVP_MULT_BATTLE_LAST_TEAM : SAVE_TAG.BATTLE_LAST;
            tagStr = tagStr + i;
            localStorageMgr.setAccountStorage(tagStr, origriArray);
        }
    }

    private _initSquareHeadOption(heroID: number) {
        let options: SquareHeadOption = null;
        let heroState = pveData.getHeroStateInPVE(heroID);
        if (heroState != null) {
            options = {
                hp: heroState.hpPercent,
                power: heroState.energyPercent
            }
        }

        return options;
    }

    /**调整阵容 */
    openAdjustTheLineup() {
        this.loadSubView("PVPPeakDuelChangeTeamView",this._battleArray,ADJUST_TEAM_TYPE.ATTACK);
    }

    private _pvpMultBatlleChange(cmd:any,herosMap:Map<number,number[]>) {
        if (!herosMap) return;
        for (let i = 0; i < herosMap.size; i++){
            this._battleArray.set(i, herosMap.get(i));    
        }
        this._autoSaveBattleArray();

        this._resetLocalData();
        this._resetHeroData();

        this._updateHeroList();

        this.chapterInfo.onRefresh({ pvpMode: pvpData.pvpConfig.pvpMode });
        this.heroListComp.onRefresh(this._candidate, this._currSelect, pveData.magicDoor, this._battleArray.value);
        this._refreshSelfFriendView();
        this.uiCtrl.refreshHerosTeamPower(this._currSelect);    
        
    }   
}
