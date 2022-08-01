import { PVE_MODE, XIN_MO_REWARD_TYPE } from "../../../app/AppEnums";
import { PRE_FRIEND_SKILL_ANIMATION_TIME, PRE_SKILL_ANIMATION_TIME } from "../../../app/BattleConst";
import { configUtils } from "../../../app/ConfigUtils";
import engineHook from "../../../app/EngineHook";
import { configManager } from "../../../common/ConfigManager";
import { localStorageMgr, SAVE_TAG } from "../../../common/LocalStorageManager";
import { scheduleManager } from "../../../common/ScheduleManager";
import { cfg } from "../../../config/config";
import { battleUIData } from "../../models/BattleUIData";
import { pveData } from "../../models/PveData";
import { pvpData } from "../../models/PvpData";
import { battleUIOpt } from "../../operations/BattleUIOpt";
import BattlePreSkill from "../view-role/BattlePreSkill";
import UIBattleDamageCollect from "./UIBattleDamageCollect";

const {ccclass, property} = cc._decorator;
const MAX_SPEED = 2

@ccclass
export default class BattleUiController extends cc.Component {

    @property(cc.Node)          ndPlus: cc.Node[] = [];
    @property(cc.Node)          ndShadow: cc.Node[] = [];
    @property(BattlePreSkill)   battlePreSkill: BattlePreSkill = null;

    @property(cc.Node) skipBtn: cc.Node = null;
    @property(cc.Node) speedBtn: cc.Node = null;
    @property(cc.Sprite) speedTipsSp: cc.Sprite = null;
    @property([cc.SpriteFrame]) speedTipsFrames: cc.SpriteFrame[] = [];
    @property(UIBattleDamageCollect) damageCollect: UIBattleDamageCollect = null;

    private _curSpeed: number = 0;
    private _timer: number = 0;

    /**
     * 初始化
     * @param shadowShow 布尔数组，用于表示对应位置是否显示
     */
    init (shadowShow?: boolean[]) {
        this.ndPlus.forEach(_nd=> _nd.active = false);
        this.ndShadow.forEach(_nd=> _nd.active = true);
        
        if (shadowShow) {
            this.ndShadow.forEach((shadow, idx) => {
                shadow.active = shadowShow[idx];
            });
        }

        this._initSpeed();
        this._updateSpeedView();
        this._initDamageCollectView();
    }

    deInit() {
        engineHook.frameInterval = engineHook.DEFAULT_INTERVAL;
        this.battlePreSkill.deInit();
        this.damageCollect.deInit();
        this._unscheduleTimer();
        this.node.stopAllActions();
        cc.Tween.stopAllByTarget(this.damageCollect.node);
    }

    setPlus (idx: number, active: boolean) {
        if (cc.isValid(this.ndPlus[idx])) {
            this.ndPlus[idx].active = active;
        }
    }

    battleBegin () {
        this.ndPlus.forEach(_nd=> _nd.active = false);
        this.ndShadow.forEach(_nd=> _nd.active = false);

        let currHero = battleUIData.getSelfTeam().roles;
        currHero.forEach(_uiRole => {
            let pos = _uiRole.pos;
            if (cc.isValid(this.ndShadow[pos])) {
                this.ndShadow[pos].active = true;
            }
        })

        this._setBtnsVisible();
        this._updateSpeed();
    }

    /**
     * 播放大招前置的PV动画
     * @param endFunc 
     * @returns 
     */
     playPreSkillEffect(skillId: number, roleId?: number, isLeft?: boolean, endFunc?: Function): number {
        let time: number = 0;
        let showHeroList: number[] = [];
        let getTeamCfg = (): cfg.HeroFriend => {
            let configs: {[k: number]: cfg.HeroFriend} = configManager.getConfigs('heroFriend');
            for(const k in configs) {
                let cfg = configs[k];
                if(cfg.HeroFriendSkillBuff && cfg.HeroFriendSkillBuff == skillId) {
                    return cfg;
                }
            }
            return null;
        }
        let friendCfg = getTeamCfg();
        if(friendCfg) {
            // 说明是teambuff
            let friends = friendCfg.HeroFriendNeedHero.split('|');
            showHeroList = showHeroList.concat(friends.map(_hero => { return Number(_hero); }));
        } else {
            showHeroList.push(roleId);
        }
        if(this._checkSkillEffectIsVaild(showHeroList)) {
            this.battlePreSkill.onInit(showHeroList, skillId, isLeft, endFunc);
            if (friendCfg) {
                time = PRE_FRIEND_SKILL_ANIMATION_TIME
            } else {
                time = PRE_SKILL_ANIMATION_TIME;
            }
        }
        return time;
    }

    private _checkSkillEffectIsVaild(showHeroList: number[]): boolean {
        // 现在不需要判断model Spine了
        return !!showHeroList.find(_heroId => {
            return this._getModelId(_heroId) > 0;
        });
    }

    private _getModelId(id: number): number {
        let cfg = configUtils.getHeroBasicConfig(id);
        if(cfg) {
            return cfg.HeroBasicModel;
        } else {
            let monscfg = configUtils.getMonsterConfig(id);
            if(monscfg) {
                return monscfg.ModelId;
            }
        }
        return 0;
    }

    onClickSpeedBtn() {
        ++this._curSpeed;
        this._curSpeed = this._curSpeed % MAX_SPEED
        localStorageMgr.setAccountStorage(SAVE_TAG.SPEED_STR, this._curSpeed);
        this._updateSpeedView();
        this._updateSpeed();
    }
    
    
    onClickSkip () {
        battleUIOpt.skipToEnd();
    }

    private _setBtnsVisible(){
        //加速按钮
        this.speedBtn.active = configUtils.checkFunctionOpen(31000);
        //跳过按钮
        let showSkip = configUtils.checkFunctionOpen(31001);
        this.skipBtn.active = false;

        if (pvpData.isReplay) {
            this.skipBtn.active = true;
        } else if (showSkip) {
            this._unscheduleTimer()
            let interval = configUtils.getConfigModule("JumpFightShowTime");
            if (interval) {
                this._timer = scheduleManager.scheduleOnce(this._showSkipAnim.bind(this), interval)
            }
        }
        this._showDamageCollectView();
    }

    private _unscheduleTimer () {
        if (this._timer) {
            scheduleManager.unschedule(this._timer);
        }
        this._timer = 0;
    }

    private _showSkipAnim () {
        this.skipBtn.scale = 0.1;
        this.skipBtn.active = true;
        cc.tween(this.skipBtn)
        .sequence(
            cc.tween().to(0.2, {scale: 1.2}, {easing: "sineOut"}),
            cc.tween().to(0.1, {scale: 1}, {easing: "sineIn"})
        )
        .start();
    }

    private _initSpeed () {
        this._unscheduleTimer();
        let localNewSpeed = localStorageMgr.getAccountStorage(SAVE_TAG.SPEED_STR);
        if(localNewSpeed) {
            this._curSpeed = Number(localNewSpeed);
        }
        this.skipBtn.active = true;
        this.skipBtn.scale = 1;
    }

    private _updateSpeedView() {
        let speed = this._curSpeed % MAX_SPEED;
        let sf = this.speedTipsFrames[speed];
        if(sf) {
            this.speedTipsSp.spriteFrame = sf;
        }
    }

    private _updateSpeed() {
        let speed = (this._curSpeed % MAX_SPEED + 1) * 1.5
        engineHook.frameInterval = engineHook.DEFAULT_INTERVAL * (speed);
    }

    private _initDamageCollectView() {
        if(!pveData.isPVEMode(PVE_MODE.XIN_MO_FA_XIANG)) return;
        let demonRewardCfgs: cfg.PVEMindDemonReward[] = configManager.getConfigByKey('pveMindDemonReward', XIN_MO_REWARD_TYPE.DAMAGE_LIST);
        let damageLv: number[] = [];
        demonRewardCfgs.forEach(ele => {
            damageLv.push(ele.PVEMindDemonRewardNum);
        })
        this.damageCollect.init(damageLv);
    }

    private _showDamageCollectView() {
        if(!pveData.isPVEMode(PVE_MODE.XIN_MO_FA_XIANG)) return;
        cc.Tween.stopAllByTarget(this.damageCollect.node);
        this.damageCollect.node.y = (cc.winSize.height >> 1) + (this.damageCollect.node.height >> 1);
        cc.tween(this.damageCollect.node).to(0.5, {y: (cc.winSize.height >> 1) - (this.damageCollect.node.height >> 1)}).start();
    }

}
