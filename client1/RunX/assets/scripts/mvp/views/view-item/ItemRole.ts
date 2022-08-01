import { BATTLE_POS, ROLE_TYPE, NORMAL_ATTACK_ID, DOUBLE_ATTACK_ID, BACK_ATTACK_ID, SHADE_LAYER_Z_INDEX } from "../../../app/BattleConst";
import { configUtils } from "../../../app/ConfigUtils";
import { logger } from "../../../common/log/Logger";
import { HitLabelPool } from "../../../common/res-manager/NodePool";
import { UIRoleCfg, UIRoleData } from "../../../app/BattleType";
import UIRole from "../../template/UIRole";
import RoleLoader from "../view-battle/RoleLoader";
import UIBTRoleCtrl from "../view-battle/UIBTRoleCtrl";
import BuffListCtrl from "../view-role/BuffListCtrl";
import HitLabel from "./HitLabel";
import ItemRoleAction from "./ItemRoleAction";
import { ANIMATION_GROUP, EffectShadowInfo, SkillActorInfo, SkillSaperateInfo } from "../view-actor/SkillUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { audioManager, SFX_TYPE } from "../../../common/AudioManager";
import {  SEX } from "../../../app/AppEnums";
import skillDisplayManager from "../view-actor/SkillDisplayManager";
import { pveData } from "../../models/PveData";
import { DEFAULT_ROLE_SP } from "../../../app/AppConst";
import { pvpData } from "../../models/PvpData";
import { gamesvr } from "../../../network/lib/protocol";
import { battleUIData } from "../../models/BattleUIData";
import { battleUtils } from "../../../app/BattleUtils";
import { utils } from "../../../app/AppUtils";
import Actor from "../view-actor/Actor";
import UIClick from "../../../common/components/UIClick";
import { eventCenter } from "../../../common/event/EventCenter";

const {ccclass, property} = cc._decorator;
const LOADER_TAG = "ITEM_ROLE";
const RoleSpNodeName = "RoleSpNode";
let ROLE_SEQU = 1;
const MOVE_BACK_TAG = "MOVE_BACK_TAG";
const FADE_ACTION_TAG = 10086;

export const BASE_ANIM = {
    ATTACK1: "Attack1",
    ATTACK2: "Attack2",
    ATTACK3: "Attack3",
    ATTACK4: "Attack4",
    Charge: "Charge",
    IDLE: "Idle",
    DIE: "Die",
    HIT1: "Hit1",
    HIT2: "Hit2",
    JUMP: "Jump",
    RELEASE: "Release",
    ROLL: "Roll",
    SKILL: "Skill",
    WIN: "Cheer",
    RUN: "Run"
}

/**
 *  @description 【注意】
 * 理论上说，这里只有ui数据是对的，其他的血量，什么的数据这里不为准
 */
@ccclass
export default class ItemRole extends cc.Component {
    
    @property(cc.Node)          skNode: cc.Node = null;
    @property(cc.ProgressBar)   progressHpBar: cc.ProgressBar = null;
    @property(cc.ProgressBar)   progressPower: cc.ProgressBar = null;
    @property(cc.Label)         lbBlood: cc.Label = null;
    @property(cc.Label)         lbName: cc.Label = null;
    @property(BuffListCtrl)     buffListCtrl: BuffListCtrl = null;
    @property(ItemRoleAction)   roleAct: ItemRoleAction = null;
    @property(cc.Node)          hpEffect: cc.Node = null;
    @property(cc.Node)          shieldEffect: cc.Node = null;
    @property(cc.Node)          ndShadow: cc.Node = null;
    @property(cc.Node)          skillLights: cc.Node = null;
    @property(cc.Node)          itemSkillLight: cc.Node = null;
    @property(cc.Node)          hitLbParent: cc.Node = null;
    @property(cc.Sprite)        abilityIcon: cc.Sprite = null;
    @property(cc.Node)          topBg: cc.Node = null;

    private _currRole: string = null;
    private _skNode: cc.Node = null;
    private _currId = 0;
    private _idleAnim = {ID: 0, anim: ""}; // 由于常驻buff导致的idle状态更新

    private _roleData: UIRoleData = null;
    private _roleCtrl: UIBTRoleCtrl = null;
    private _clickHandler: Function;
    private _sex: SEX = SEX.FEMALE;
    // private _hitLabelPool: cc.NodePool = new cc.NodePool();

    private _isShadow: boolean = false;
    private _shadowCfg: EffectShadowInfo = null;//全局影子的配置，局部影子不适用这个字段
    private _wholeShadows: ItemRole[] = null;
    private _shadowOwner: ItemRole = null;
    private _isPlayGfx: boolean = true;
    /**渐隐的血条*/
    private _fadeHpBar: cc.Node = null;

    // 血条开关
    private _isShowHpBar: boolean = true;

    get shadowOwner(): ItemRole{
        return this._shadowOwner;
    }

    set shadowCfg(cfg: EffectShadowInfo){
        if(!this._isShadow) return;
        this._shadowCfg = cfg;
    }

    get shadowCfg(): EffectShadowInfo{
        if(!this._isShadow) return null;
        return this._shadowCfg;
    }

    get isShadow(){
        return this._isShadow;
    }

    get wholeShadows(): ItemRole[]{
        return this._wholeShadows;
    }

    get isPlayGfx(){
        return this._isPlayGfx;
    }

    set isPlayGfx(playable: boolean){
        this._isPlayGfx = playable;
    }

    set shadow(isShadow: boolean){
        this._isShadow = isShadow;
    }

    addShadow(itemRole: ItemRole){
        if(!cc.isValid(itemRole)) return;
        this._wholeShadows = this._wholeShadows || [];
        if(this._wholeShadows.indexOf(itemRole) != -1) return;
        this._wholeShadows.push(itemRole);
    }

    init (roleData: UIRole, rootCtrl: UIBTRoleCtrl, roleType: ROLE_TYPE, clickHandler: Function) {
        this.node.targetOff(this);
        this._currId = ROLE_SEQU++;
        this._roleCtrl = rootCtrl;
        this._clickHandler = clickHandler;
        this._isShowHpBar = true;

        this._parseRoleData(roleData, roleType);
        this._updateRole();

        this.buffListCtrl.init();

        eventCenter.register(MOVE_BACK_TAG, this, this._fadeIsAttackedHp);
    }

    deInit () {
        if(cc.isValid(this.node.getComponent(UIClick))){
            this.node.removeComponent(UIClick)
        } 
        this._idleAnim = {ID: 0, anim: ""};
        this._shadowCfg = null;
        if(this._wholeShadows && this._wholeShadows.length > 0){
            let shadows = [...this._wholeShadows];
            shadows.forEach(ele => [
                ele.removeShadow()
            ]);
        }
        this._wholeShadows = null;
        this._shadowOwner = null;
        this.node.setPosition(cc.v3(0, 0, 0));
        this.node.stopAllActions();
        this.node.targetOff(this);
        this.unscheduleAllCallbacks();
        this._releaseSpine();
        this.buffListCtrl.deInit();
        this.roleAct.deInit();
        let children = [...this.hitLbParent.children]
        children.forEach(_hitLb => {
            if(cc.isValid(_hitLb)) {
                _hitLb.removeFromParent();
                let cmp = _hitLb.getComponent(HitLabel);
                HitLabelPool.put(cmp);
            }
        })
        this._clearPoweEffect();

        this._fadeHpBar = null;
        eventCenter.unregisterAll(this);
    }

    private _clearPoweEffect() {
        // 清理技能可以释放的火的特效
        let children = [...this.skillLights.children]
        children.forEach(_c => {
            _c.removeFromParent();
        });
    }

    get loadTag () {
        return LOADER_TAG + this._currId;
    }

    get role () {
        return this._roleData;
    }
    
    get roleZIndex() {
        return this.node.parent.zIndex;
    }

    getHeight (): number {
        return this._skNode ? this._skNode.height * this._skNode.scale: 0;
    }

    private _updateRole () {
        if (!cc.isValid(this._roleData)) return;

        this.updateBase();
        this.updateHpUi();
        this.updateShieldUI();
        this.updateSpine();
        this.updateBuff();
        this.updateHalo();
    }

    resetRoleZIndex(isDead: boolean = false) {
        if(cc.isValid(this.node) && cc.isValid(this.node.parent)) {
            let initZindex = battleUtils.getInitZIndex(this._roleData.pos);
            if (isDead) {
                initZindex = 0
            }
            this.changeRoleZIndex(initZindex);
        }
    }

    changeRoleZIndex(zIndex: number) {
        if(cc.isValid(this.node) && cc.isValid(this.node.parent) && zIndex != this.node.parent.zIndex) {
            this.node.parent.zIndex = zIndex;

            // if (this._currRole) {
            //     let nameStr = this._currRole.split('/');
            
            //     console.log("==== change Z index ====", nameStr[nameStr.length-1], this.role.pos, "=", zIndex)
            // }
           
        }
    }

    /**
     * 备战界面展示
     * @param visible 是否显示
     * @param hp 血量百分比(0-1)
     * @param power 能量百分比(0-1)
     */
    showDisplay (visible: boolean = false, hp?: number, power?: number) {
        this.progressHpBar.node.active = visible;
        this.progressPower.node.active = visible;
        hp != null && (this.progressHpBar.progress = hp);
        if (power >= 1) {
            this._roleData.skillCount = 1;
            this.progressPower.progress = 0;
        } else {
            this._roleData.skillCount = 0;
            power != null && (this.progressPower.progress = power);
        }
               
        this.updateSkillLights();
    }

    showAbilityIcon(visible: boolean = false, isReversePos: boolean = false) {
        this.abilityIcon.node.x = Math.abs(this.abilityIcon.node.x) * (isReversePos ? 1 : -1);
        this.abilityIcon.node.active = visible;
    }

    showTopBg(visible: boolean = false){
        this.topBg.active = visible;
    }

    // 战斗展示
    showBattle (isShowHpBar: boolean = true) {
        if(cc.isValid(this.node.getComponent(UIClick))){
            this.node.removeComponent(UIClick)
        }
        this._isShowHpBar = isShowHpBar;
        this.progressHpBar.node.active = isShowHpBar;
        this.abilityIcon.node.active = false;
        this.showTopBg(false);
    }

    beginRun () {
        this.setAnimation(BASE_ANIM.RUN, true);
    }

    playNormalAttack () {
        this.setAnimation(BASE_ANIM.ATTACK1, false);
        this._playAttackAudio();
        return 0.5;
    }

    playNormalTakeAttack () {
        this.setAnimation(BASE_ANIM.HIT1, false);
    }

    playDodge () {
        // this.setAnimation(BASE_ANIM.MISS, false);
        const spNode = this._skNode;
        if (spNode) {
            let offSetx = this.role.roleType == ROLE_TYPE.HERO? -50:50;
            spNode.runAction(cc.sequence(
                cc.moveTo(0.2, cc.v2(spNode.x + offSetx,spNode.y)),
                cc.moveTo(0.2, cc.v2(0, 0))
            ))
        }
    }

    checkNeedMoveBack () {
        this.resetRoleZIndex();
        if (this._roleData.ePos.type == BATTLE_POS.ORIGIN) {
            eventCenter.fire(MOVE_BACK_TAG);
            return false;
        }
        return true;
    }

    afterMoveBack () {
        this.resetRoleZIndex();
        this.changeIdle();
        this._roleData.ePos = { type: BATTLE_POS.ORIGIN, index: -1 };
        eventCenter.fire(MOVE_BACK_TAG);
    }

    private _fadeIsAttackedHp() {
        //存在血条并且血条组件没有处于动作中
        if (!this._fadeHpBar) return
        let tag = this._fadeHpBar.getActionByTag(FADE_ACTION_TAG);
        if (tag) return;
        
        let act =this._fadeHpBar.runAction(cc.sequence(cc.delayTime(0.5),  // 扣血前延时
                                           cc.scaleTo(0.5, 0, 1).easing(cc.easeOut(1)),
                                           cc.callFunc(() => {
                                               this._clearFadeHpBar();
                                               this._changeToRoleDeadState(); 
                                           })));
        act.setTag(FADE_ACTION_TAG);   
    }

    /**清理渐隐血条展示*/
    private _clearFadeHpBar() {
        if (cc.isValid(this._fadeHpBar) && cc.isValid(this._fadeHpBar.parent)) {
            this._fadeHpBar.removeFromParent();
            this._fadeHpBar.stopAllActions();
            this._fadeHpBar.cleanup();
            this._fadeHpBar = null;
        }
    }

    private _changeToRoleDeadState() {
        if (this.role.hp > 0) return;
        this.resetRoleZIndex(true); 
        this.progressHpBar.node.active = false;
    }

    updateHp (hpRes: gamesvr.IHPResult) {
        if (!hpRes) return; 

        let roleData = this.role;
        roleData.hp = hpRes.HP || 0;

        if (hpRes.MaxHP != null) {
            roleData.maxHp = hpRes.MaxHP;
        }
        this.updateHpUi(hpRes);

        if(this._roleData.shield) {
            this.updateShieldUI();
        }
    }

    /**
     * 更新护盾值
     * @TODO 需要更新服务器发来的护盾值
     */
    updateShield(shieldValue: number) {
        if (this._roleData.shield != shieldValue) {
            this._roleData.shield = shieldValue;
            this.updateShieldUI();
        }

    }
    /**
     * 血量变化飘字
     * @param hpRes 
     * @param saperateRate 
     * @param attackId 
     */
    showHpFloatLabel (hpRes: gamesvr.IHPResult, saperateRate: number = 100, attackId: number = 0) {
        let item = this._getItemHitLabel();
        let comp = item.getComponent(HitLabel);
        comp.show(this.hitLbParent, ()=> {
            comp.node.removeFromParent();
            HitLabelPool.put(comp);
        }, hpRes, saperateRate, attackId)
    }
    /**
     * 展示特殊攻击飘字
     * @param hpRes 
     * @param saperateRate 
     * @param attackId 
     */
    showSpecialAttack(hpRes: gamesvr.IHPResult, saperateRate: number = 100, attackId: number = 0) {
        let item = this._getItemHitLabel();
        let comp = item.getComponent(HitLabel);
        comp.showSpecial(this.hitLbParent, ()=> {
            comp.node.removeFromParent();
            HitLabelPool.put(comp);
        }, hpRes, saperateRate, attackId)
    }
    /**
     * 显示自定义飘字
     * @param str 
     */
    showCustomLabel(str: string) {
        let item = this._getItemHitLabel();
        let comp = item.getComponent(HitLabel);
        comp.showCustomHitLabel(this.hitLbParent, str, ()=> {
            comp.node.removeFromParent();
            HitLabelPool.put(comp);
        });
    }
    
    updateBase () {
        if (this._roleData.maxPower == 0) {
            this.progressPower.node.active = false;
            this.progressPower.progress = 0;
        } else {
            this.progressPower.node.active = true;
            this.progressPower.progress = this._roleData.power / 100;
            this._updatePowerEffect();
        }
        this.resetRoleZIndex();
        this.updateSkillLights();
        this.node.opacity = 255;
        this.lbName.string = this._roleData.uiCfg.nameStr;
    }
    /**
     * 更新护盾值
     */
    updateShieldUI() {
        let role = this.role;
        let shield = role.shield;
        let shieldEffect = this.progressHpBar.node.getChildByName('shield');
        if(!cc.isValid(shieldEffect)) {
            shieldEffect = cc.instantiate(this.shieldEffect);
            this.progressHpBar.node.addChild(shieldEffect, 1, 'shield');
            shieldEffect.y = 0;
        }
        shieldEffect.active = shield > 0;
        if(shield > 0) {
            let length =  shield / role.maxHp * this.progressHpBar.node.width;
            let lossHp = role.maxHp - role.hp;
            let posX: number = 0;
            if(shield >= lossHp) {
                posX = this.progressHpBar.node.width / 2 - length;
            } else {
                posX = this.progressHpBar.node.width / 2 - lossHp / role.maxHp * this.progressHpBar.node.width;
            }
            shieldEffect.width = length;
            shieldEffect.x = posX;
        }
    }

    updateHpUi (hpRes?: gamesvr.IHPResult) {
        let role = this.role;
        this._showHpEffect(hpRes);
        this.lbBlood.string = `${role.hp}/${role.maxHp}`;
        this.progressHpBar.progress = role.hp / role.maxHp;

        if(role.hp > 0 && this._isShowHpBar) this.progressHpBar.node.active = true
        // this.progressPower.node.active = role.hp > 0 && role.roleType == ROLE_TYPE.HERO;
        // 暂时去除 需要添加怪物能量值
        this.progressPower.node.active = role.hp > 0;
    }

    private _showHpEffect (hpRes?: gamesvr.IHPResult) {
        if (!hpRes) return;

        if (hpRes && hpRes.Delta && hpRes.Delta< 0) {
            let role = this.role, parent = this.progressHpBar.node;
            let progressLen = this.progressHpBar.progress * this.progressHpBar.node.width;
            let hp = hpRes.HP ? hpRes.HP : 0;
            let delta = hp<=0?progressLen:Math.abs(hpRes.Delta);
            let fadeBarWidth = 0;
            //如果是多次攻击，保留上一次掉血的长度
            if (this._checkFadeBarHava()) {
                fadeBarWidth = this._fadeHpBar.width;
                // this._clearFadeHpBar();
            }
            let ndHp = null;
            if (this._fadeHpBar) {
                ndHp = this._fadeHpBar;
            } else {
                ndHp = cc.instantiate(this.hpEffect);
                parent.addChild(ndHp);   
                this._fadeHpBar = ndHp;
            }
            ndHp.height = this.progressHpBar.barSprite.node.height;
            ndHp.y -= 3;
            ndHp.x = -parent.width / 2 + parent.width * hp / role.maxHp - 2,ndHp.y = -0.5;;
            if (hp > 0) ndHp.width = fadeBarWidth + parent.width * delta / role.maxHp;
            else { 
                //多次攻击，除了第一次扣血死亡外，其他的回合都应该是0
                ndHp.width = fadeBarWidth + delta * parent.width / this.progressHpBar.node.width;
                ndHp.x += 2;
            } 
            ndHp.zIndex = cc.macro.MIN_ZINDEX;
            ndHp.active = true;
        }
    }

    /**渐隐血条是否已经存在*/
    private _checkFadeBarHava():boolean {
        if (!this._fadeHpBar) return false;
        let act = this._fadeHpBar.getActionByTag(FADE_ACTION_TAG);
        //不存在渐隐动作的时候是没有被销毁的
        if (act) return false;
        else return true;
    }

    getBuff (buffUID: number): gamesvr.IBuff {
        for (let i = 0; i < this._roleData.buffList.length; i++) {
            if (this._roleData.buffList[i].UID == buffUID) {
                return this._roleData.buffList[i];
            }
        }
        return null;
    }

    playLoseHpAudio () {
        // if (this._sex == SEX.MALE) audioManager.playSfx(SFX_TYPE.ROLE_ATTACKED_M);
        // else audioManager.playSfx(SFX_TYPE.ROLE_ATTACKED_FEM);
    }

    private _getItemHitLabel () {
        return HitLabelPool.get();
    }

    // 只提供简单的播放接口
    setAnimation (name: string, isLoop: boolean) {
        if (this._skNode && cc.isValid(this._skNode)) {
            let spine = this._skNode.getChildByName("sp").getComponent(sp.Skeleton);
            if (spine) {
                if (spine.animation == BASE_ANIM.DIE) {
                    if (this._roleData.hp) {
                        // 这时候是复活重新站起来了
                        spine.setAnimation(0, name, isLoop); 
                    } else {
                        spine.setAnimation(0, name, isLoop);
                        console.log("[Role is dead]", );
                        return;
                    }
                }
                if (spine.animation != name) {
                    spine.setAnimation(0, name, isLoop);
                }
            }
        }
    }

    addAnimaionEndEvent(callBack: Function) {
        if (this._skNode && cc.isValid(this._skNode)) {
            let spine = this._skNode.getChildByName("sp").getComponent(sp.Skeleton);
            if (spine) {
                spine.setCompleteListener(() => {
                    callBack && callBack();
                    spine.setCompleteListener(null);
                });
            }
        }
    }


    playDeadAnim() { 
        // this.addAnimaionEndEvent(() => {
        //     this.node.runAction(cc.fadeOut(0.5));
        // });
        this.setAnimation(BASE_ANIM.DIE, false);
        if (this._sex == SEX.MALE) audioManager.playSfx(SFX_TYPE.ROLE_DEAD_M);
        else audioManager.playSfx(SFX_TYPE.ROLE_DEAD_FEM);
        //角色阵亡时 将层级放置本层最高，血条减完重置层级显示, 目前跟黑屏层级一致即可
        this.changeRoleZIndex(SHADE_LAYER_Z_INDEX);
        this._clearPoweEffect();
        // this.progressHpBar.node.active = false;
        // this.resetRoleZIndex(true);
    }

    playCelebrateAnim () { 
        this.setAnimation(BASE_ANIM.WIN, true);
    }

    playRebornAnim(hpResult: gamesvr.IHPResult): number {
        // TODO 现在提审版本暂时做成这样统一的
        this.node.stopAllActions();
        // this.node.runAction(cc.fadeIn(0.5));
        this._isShowHpBar && (this.progressHpBar.node.active = true);
        this.updateHpUi(hpResult);
        // this.changeIdle();
        this.setAnimation(BASE_ANIM.IDLE, true);
        return 1;
    }

    resetIdleState (skillID: number, anim: string) {
        let spine = null;
        if (this._skNode && cc.isValid(this._skNode)) {
            spine = this._skNode.getChildByName("sp").getComponent(sp.Skeleton);
            if (spine && spine.findAnimation(anim)) {
                this._idleAnim = {ID: skillID, anim: anim} ;
            }
        }
    }

    clearIdleState (ID: number) {
        if (this._idleAnim.ID == ID) {
            this._idleAnim = {ID: 0, anim: ""}
        }
    }

    /**
     * 角色初始化之后的展示状态
     */
    initIdle () {
        let spine = null;
        if (this._skNode && cc.isValid(this._skNode)) {
            spine = this._skNode.getChildByName("sp").getComponent(sp.Skeleton);
            if (spine && spine.animation != BASE_ANIM.IDLE) {
                spine.setAnimation(0, BASE_ANIM.IDLE, true);
            }
        }
    }

    /**
     * 角色战斗中的切换状态
     */
    changeIdle () {
        if (this._checkAlive()) {
            let spine = null;
            if (this._skNode && cc.isValid(this._skNode)) {
                spine = this._skNode.getChildByName("sp").getComponent(sp.Skeleton);
            }

            let idleAnim = this._idleAnim.anim? this._idleAnim.anim : BASE_ANIM.IDLE;
            if(spine && spine.animation != idleAnim) {
                this.setAnimation(idleAnim, true);
            }
        }
    }

    // buff移除之后检查需不需要移除对应的常驻buff效果
    reduceBuffResult(res: gamesvr.IBuffResult) {
        let role = battleUIData.getRoleByRoleId(this._roleData.id);
        if(role && !res.Count) {
            this.roleAct.disableLoopSpine(res.BuffID);
        }
        this.clearIdleState(res.BuffID)
    }

    updateSpine () {
        let newSketon = this._roleData.skeletonName
        let defaultScale = 0.4; 
        let heroId = this._roleData.id;
        let roleCfg = configUtils.getHeroBasicConfig(heroId);
        if (roleCfg) {
            let mdCfg = configUtils.getModelConfig(roleCfg.HeroBasicModel);
            if (mdCfg && mdCfg.ModelAttackSize) 
                defaultScale = mdCfg.ModelAttackSize/10000;
        } else {
            let roleCfg = configUtils.getMonsterConfig(this._roleData.id);
            if (roleCfg && roleCfg.ModelId) {
                let mdCfg = configUtils.getModelConfig(roleCfg.ModelId);
                if (mdCfg && mdCfg.ModelAttackSize) 
                    defaultScale = mdCfg.ModelAttackSize/10000;
            }
        }
       
        if (this._currRole == null || this._currRole != newSketon) {
            this._releaseSpine();

            this._currRole = newSketon;
            RoleLoader.loadRole(this._currRole, this._roleData.roleType == ROLE_TYPE.HERO, this.loadTag)
            .then(node => {
                this._skNode = node;
                this._skNode.name = RoleSpNodeName;
                this._skNode.scale = defaultScale;
                this.skNode.addChild(this._skNode);
                this.ndShadow.width = node.width * defaultScale + 10;
                
                this.initIdle();
                this.roleAct.init(this._skNode);
                this.initActorSpine();
            })
            .catch(err => {
                logger.log('ItemRole', `load Role res error. name = ${this._currRole}, err = `, err);
            })
        } else {
            // console.log(`updateSpine. bug no need load.`);
        }
    }
    
    updateBuff () {
        this.buffListCtrl.updateBuff(this._roleData.buffList)
    }

    updateBuffByRes (buffRes: gamesvr.IBuffResult) {
        this.buffListCtrl.updateByEffRes(buffRes);
    }

    updateHalo () {

    }

    updateHaloByRes (haloRes: gamesvr.IHaloResult) {
        if (haloRes.isAdd) {
            this.roleAct.enableLoopSpine(haloRes.HaloID);
        } else {
            this.roleAct.disableLoopSpine(haloRes.HaloID);
        }
    }

    updateSkillLights() {
        // let count: number = this._roleData.skillCount >= this.skillLights.childrenCount ? this._roleData.skillCount : this.skillLights.childrenCount;
        let count: number = 1;
        for(let i = 0; i < count; ++i) {
            let itemSkill: cc.Node = this.skillLights.children[i];
            if(i < this._roleData.skillCount) {
                if(!itemSkill) {
                    itemSkill = cc.instantiate(this.itemSkillLight);
                    itemSkill.active = true;
                    this.skillLights.addChild(itemSkill);
                }
                itemSkill.opacity = 255;
                itemSkill.setPosition(cc.v2(i * 27 + 14, 0));
                let spine = itemSkill.getComponent(sp.Skeleton);
                spine.setCompleteListener(() => {
                    spine.setAnimation(0, 'xunhuan', true);
                });
                spine.setAnimation(0, 'chuxian', false);
            } else {
                if(itemSkill) {
                    itemSkill.runAction(cc.fadeOut(1));
                }
            }
        }
    }

    updatePowerByRes (powerRes: gamesvr.IPowerResult) {
        if(this._roleData.maxPower <= 0) return;
        this._roleData.power = (powerRes.Power ? powerRes.Power : 0);
        this.progressPower.progress = this._roleData.power != this._roleData.maxPower ? (this._roleData.power % 100 / 100) : 1;

        if(powerRes.Power >= 100) {
            this._roleData.skillCount = 1;
        } else {
            this._roleData.skillCount = 0;
        }
        this.updateSkillLights();
        this._updatePowerEffect();

        // TODO 暂时去除加能量
        // let itemHitLabel = this._getItemHitLabel();
        // let cmp = itemHitLabel.getComponent(HitLabel);
        // cmp.showPower(this.node, () => {
        //     cmp.node.removeFromParent();
        //     HitLabelPool.put(cmp);
        // }, powerRes);
    }

    private _clearPowerProgress() {
        let powerCB = () => {
            this.progressPower.progress -= 0.01;
            if(this.progressPower.progress <= 0) {
                this.progressPower.progress = 0;
                this.unschedule(powerCB);
            }
        };
        this.schedule(powerCB, 0.02);
    }

    private _updatePowerEffect() {
        // TODO 更新power进度条满能量的特效
        let powerMaxEffect = this.progressPower.node.children[1];
        if(powerMaxEffect) {
            let isMax = this._roleData.power + 1 >= this._roleData.maxPower;
            powerMaxEffect.active = isMax
        }
    }

    private _releaseSpine () {
        if (cc.isValid(this._skNode)) {
            RoleLoader.releaseRole(this._currRole, this._skNode, this.loadTag);
            this._skNode = null;
            this._currRole = null;
        }
    }

    private _parseRoleData (roleData: UIRole, roleType: ROLE_TYPE) {
        // 奇门遁甲假英雄
        let roleId = roleData.roleId;
        let cfg = this._getRoleCfg(roleData.roleType, roleId);
        let modelCfg = configUtils.getModelConfig(cfg.modelId);
        let sex = modelCfg.ModelSex || SEX.FEMALE;;
        let skeleton = resPathUtils.getModelSpinePath(cfg.modelId) || "";

        if (!skeleton) {
            skeleton = DEFAULT_ROLE_SP;
            logger.error("[ItemRole]Cant find role spine source", roleId)
        }

        this._sex = sex;
        this._idleAnim = {ID: 0, anim: ""}
        this._roleData = {
            haloList: roleData.haloList,
            buffList: roleData.buffList,
            skillList: [],
            hp: roleData.hp,
            maxHp: roleData.maxHp,
            shield: 0,
            roleType: roleType,
            id: roleData.roleId,
            pos: roleData.pos,
            uid: roleData.uid,
            uiCfg: cfg,
            power: roleData.power,
            maxPower: roleData.maxPower,
            skillCount: 0,
            ePos:{
                type:BATTLE_POS.ORIGIN,
                index: -1
            },
            skeletonName: skeleton
        }

        if (roleData.fakeId) {
            this._roleData.orignalId = roleData.fakeId;
        }

        // TODO 现在是只有英雄才有技能
        let heroCfg = configUtils.getHeroBasicConfig(roleId);

        if (!heroCfg) {
            let monsterCfg = configUtils.getMonsterConfig(roleId);
            if (monsterCfg && monsterCfg.NoumenonID) {
                heroCfg = configUtils.getHeroBasicConfig(monsterCfg.NoumenonID);
            }
        }

        if(heroCfg) {
            if(heroCfg.HeroBasicSkill) {
                this._roleData.skillList.push({
                    skillId: heroCfg.HeroBasicSkill
                })
            }
            if(heroCfg.HeroBasicPassive1) {
                this._roleData.skillList.push({
                    skillId: heroCfg.HeroBasicPassive1
                })
            }
            if(heroCfg.HeroBasicPassive2) {
                this._roleData.skillList.push({
                    skillId: heroCfg.HeroBasicPassive2
                })
            }
            if(heroCfg.FriendSkill1) {
                this._roleData.skillList.push({
                    skillId: heroCfg.FriendSkill1
                })
            }
        }
    }

    private _getRoleCfg (roleType: ROLE_TYPE,  roleId: number): UIRoleCfg {
        let pvp = !!pvpData.pvpConfig;
        if (roleType == ROLE_TYPE.HERO || pveData.magicDoor || pvp) {
            let cfgHero = configUtils.getHeroBasicConfig(roleId);
            if (cfgHero) {
                return {
                    nameStr: cfgHero.HeroBasicName,
                    modelId: cfgHero.HeroBasicModel,
                    normalAttackId: 500001,
                }
            }
        } else {
            let cfgMonster = configUtils.getMonsterConfig(roleId);
            return {
                nameStr: cfgMonster.Name,
                modelId: cfgMonster.ModelId,
                normalAttackId: 500001,
            }
        }
        return null
    }

    onClickRole () {
        this._clickHandler && this._clickHandler(this._roleData.id);
    }

    initActorSpine () {
        this.roleAct.initActorSpine()
    }

    getSkillGfxNode (behindRole?: boolean): cc.Node {
        return this.roleAct.getSkillGfxNode(behindRole);
    }

    getLoopGfxNode (isTop?: boolean): cc.Node {
        return isTop? this.roleAct.nodeLoopGfx:this.roleAct.nodeLoopGfxBehind;
    }

    showBuffLoopGfx (keyId: number, show: boolean) {
        if(show) {
            this.roleAct.enableLoopSpine(keyId);
        } else {
            this.roleAct.disableLoopSpine(keyId);
        }
    }

    showHaloLoopGfx (keyId: number, show: boolean) {
        if(show) {
            this.roleAct.enableLoopSpine(keyId);
        } else {
            this.roleAct.disableLoopSpine(keyId);
        }
    }

    catchLoopSpine (keyId: number, info: {skeleton: sp.Skeleton, path: string}) {
        this.roleAct.catchLoopSpine(keyId, info);
    }

    getAoeNode (isTop: boolean = true): cc.Node {
        return this._roleCtrl.getAoeNode(isTop);
    }

    getAoeNodeOffset(isTop: boolean = true): cc.Vec3{
        let aoeNode = this.getAoeNode(isTop);
        let worldPos = aoeNode.parent.convertToWorldSpaceAR(aoeNode.getPosition());
        worldPos = this.getAoeNode().convertToNodeSpaceAR(worldPos);
        return cc.v3(worldPos);
    }

    playNormalAttackEffect(effectId: number, animationGroup: ANIMATION_GROUP, skillActorInfo: SkillActorInfo) {
        let maxTime: number = 0;
        maxTime = this.roleAct.playSkillEffect(effectId, animationGroup, skillActorInfo);
        return maxTime;
    }
    
    playSkillEffect (effectId: number, group: ANIMATION_GROUP, actorInfo?: SkillActorInfo, saperate?: SkillSaperateInfo): number {
        let actionTime: number = 0;
        if(effectId <= 0) {
            logger.error("[Item Role] play skill effect error", effectId)
        } else {
            this.roleAct.playSkillEffect(effectId, group, actorInfo, saperate);
        }
        return actionTime;     
    }

    playBeforeOrBehindSkillEffect(itemId: number, group: ANIMATION_GROUP, type: number, actorInfo?: SkillActorInfo, saperate?: SkillSaperateInfo, endCb?: Function): number {
        const src = actorInfo ? actorInfo.source : null;
        let skillInfo = null;
        if(1 == type) {
            skillInfo = skillDisplayManager.getFrontEffect(itemId, src ? src.role.skeletonName : null);
        } else if(2 == type) {
            skillInfo = skillDisplayManager.getBehindEffect(itemId, src ? src.role.skeletonName : null);
        }
        if (skillInfo == null) {
            logger.warn('ItemRole', `技能还没有配置效果。itemId = ${itemId}`);
            return 0;
        } else {
            return this.roleAct.playBeforeOrBehindSkillEffect(itemId, group, type, actorInfo, saperate, endCb);
        }  
    }

    playBuffSkillEffect (effectId: number, group: ANIMATION_GROUP, actorInfo?: SkillActorInfo): number {
        const src = actorInfo ? actorInfo.source : null;
        // let skillInfo = skillDisplayManager.getSkill(itemId, src ? src.role.skeletonName : null);
        if (effectId <= 0) {
            // logger.warn('ItemRole', `BUFF激活还没有配置效果。buffId = ${itemId}`);
            return this.playNormalAttack();
        } else {
            return this.roleAct.playSkillEffect(effectId, group, actorInfo);
        }
    }

    playLoopBuffEffect(effectId: number, group: ANIMATION_GROUP, actorInfo?: SkillActorInfo) {
        const src = actorInfo ? actorInfo.source : null;
        // let skillInfo = skillDisplayManager.getLoopEffectSkill(itemId, src ? src.role.skeletonName : null);
        if (effectId <= 0) {
            logger.warn('ItemRole', `BUFF循环还没有配置效果。buffId = ${effectId}`);
            return 0;
        } else {
            return this.roleAct.playSkillEffect(effectId, group, actorInfo);
        }
    }

    private _checkAlive () {
        return this.role.hp > 0;
    }
    
    private _playAttackAudio() {
        // if (this._sex == SEX.MALE) audioManager.playSfx(SFX_TYPE.ROLE_ATTACK_M);
        // else audioManager.playSfx(SFX_TYPE.ROLE_ATTACK_FEM);
    }
    /**
     * 获得普攻类型
     * @param attackId 
     * @returns 
     */
    getMoveAttackInfo(attackId: number): number {
        let attackEffectId = 0;
        let monsterCfg = configUtils.getMonsterConfig(this._roleData.id);
        let modelId = 0;
        if(monsterCfg) {
            modelId = monsterCfg.ModelId;
        } else {
            let heroCfg = configUtils.getHeroBasicConfig(this._roleData.id);
            if(heroCfg) {
                modelId = heroCfg.HeroBasicModel;
            }
        }
        if(modelId) {
            let modelCfg = configUtils.getModelConfig(modelId);
            if(modelCfg) {
                if(NORMAL_ATTACK_ID == attackId) {
                    attackEffectId = modelCfg.ModelMoveAttack;
                } else if(BACK_ATTACK_ID == attackId || DOUBLE_ATTACK_ID == attackId) {
                    attackEffectId = modelCfg.ModelHoldAttack;
                }
            }
        }
        return attackEffectId;
    }

    setCurLoopAmin(effectId?: number) {
      // TODO 持续的动作，比如变身，狂化之类的，现在还没有对应效果
    }

    checkNeedCreateGfx(effectId: number, isAnimationValid: boolean): boolean {
        let loopSpine = this.roleAct.getLoopSpine(effectId);
        return !loopSpine || loopSpine.length == 0;
    }

    //分身调用的方法，本体尽量不要调用
    private _setActorSpineColor(color: cc.Color = cc.Color.WHITE){
        this._skNode = this._skNode || this.skNode.getChildByName(RoleSpNodeName);
        if(!cc.isValid(this._skNode) || !cc.isValid(this._skNode.getChildByName("sp"))) return;
        this.roleAct.init(this._skNode);
        this.initActorSpine();
        this._skNode.getChildByName("sp").color = cc.color(color.getR(), color.getG(), color.getB());
        this._skNode.getChildByName("sp").opacity = color.getA();
    }

    cloneOneShadow(isPlayGfx: boolean, color: cc.Color = cc.Color.WHITE): ItemRole{
        if(this.shadow) return null;
        let shadowNode = cc.instantiate(this.node);
        let itemRole = shadowNode.getComponent(ItemRole);
        itemRole.shadow = true;
        itemRole._shadowOwner = this;
        itemRole.isPlayGfx = isPlayGfx;
        itemRole._roleData = utils.deepCopy(this.role);
        itemRole.progressHpBar.node.active =  false;
        itemRole.progressPower.node.active = false;
        this._setActorSpineColor.call(itemRole, color);
        this.node.parent.insertChild(shadowNode, this.node.getSiblingIndex());
        return itemRole;
    }

    removeShadow(): boolean{
      if(!this.isShadow || !cc.isValid(this.node,true)) return false;
      if(cc.isValid(this.shadowOwner)) {
          if(this._shadowOwner.wholeShadows){
            let idx = this._shadowOwner.wholeShadows.indexOf(this);
            idx != -1 && this._shadowOwner.wholeShadows.splice(idx, 1);
          }
      }
      this.deInit();
      this.getComponent(ItemRoleAction).deInit();
      this.getComponent(Actor).deInit();

      this.node.destroy();
      return true;
    }

    allShadowExec(func: Function){
        if(this._isShadow) return;
        if(!func) return;
        if(!this._wholeShadows || this._wholeShadows.length == 0) return;
        this._wholeShadows.forEach(ele => {
            func(ele);
        });
    }
}

