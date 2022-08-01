import { BATTLE_ROLE_Z } from "../../../app/AppConst";
import { BATTLE_POS, BUFF_TYPE, ROLE_TYPE } from "../../../app/AppEnums";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { AnimationOnce, ANIM_TYPE } from "../../../common/animation/AnimationOnce";
import playAnimationOnce from "../../../common/animation/AnimationOnceHelper";
import guiManager from "../../../common/GUIManager";
import { logger } from "../../../common/log/Logger";
import { HitLabelPool } from "../../../common/res-manager/NodePool";
import { UIRoleData } from "../../../game/BattleType";
import { AttackResult, BuffResult, HPResult, PowerResult, ResultData } from "../../../game/CSInterface";
import UIRole from "../../template/UIRole";
import RoleLoader from "../view-battle/RoleLoader";
import UIBTRoleCtrl from "../view-battle/UIBTRoleCtrl";
import { ROLE_NODE_NAME } from "../view-editor/EditorUIRoleSelector";
import EditorUtils from "../view-editor/EditorUtils";
import { DefaultRole } from "../view-editor/models/EditorConst";
import Actor from "../view-editor/view-actor/Actor";
import BuffListCtrl from "../view-role/BuffListCtrl";
import HitLabel from "./HitLabel";

const {ccclass, property} = cc._decorator;
const LOADER_TAG = "ITEM_ROLE";
let ROLE_SEQU = 1;

enum CLICK_TYPE {
    ADD,
    MINUS,
    SELECT,
    SET_TARGET,
    SET_SOURCE
}


@ccclass
export default class ItemRole extends cc.Component {
    
    @property(cc.Node)          skNode: cc.Node = null;
    @property(cc.ProgressBar)   progressHpBar: cc.ProgressBar = null;
    @property(cc.ProgressBar)   progressPower: cc.ProgressBar = null;
    @property(cc.Label)         lbBlood: cc.Label = null;
    @property(cc.Label)         lbName: cc.Label = null;
    @property(cc.Prefab)        lbHit: cc.Prefab = null;
    @property(BuffListCtrl)     buffListCtrl: BuffListCtrl = null;
    @property(cc.Node)          nodeSelect: cc.Node = null;

    // actor
    @property(cc.Node)          nodeSkillGfx: cc.Node = null;
    @property(cc.Node)          nodeSkillGfxBehind: cc.Node = null;

    @property(cc.Button)        btnSource: cc.Button = null;
    @property(cc.Button)        btnTarget: cc.Button = null;

    private _currRole: string = null;
    private _skNode: cc.Node = null;
    private _currId = 0;

    private _roleType: ROLE_TYPE = null;
    private _roleData: UIRoleData = null;
    private _roleCtrl: UIBTRoleCtrl = null;
    private _clickHandler: Function;
    private _isSource: boolean = false;
    private _isTarget: boolean = false;
    private _pos: number = 0;
    // private _hitLabelPool: cc.NodePool = new cc.NodePool();

    private _shadowNode: cc.Node[] = null;
    private _isShadow: boolean = false;
    private _isPlayGfx: boolean = true;

    get isShadow(){
        return this._isShadow;
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

    addShadowNode(node: cc.Node){
        if(!cc.isValid(node)) return;
        this._shadowNode = this._shadowNode || [];
        // if(this._shadowNode.indexOf(node) != -1) return;
        // this._shadowNode.push(node);
    }

    init (roleData: UIRole, rootCtrl: UIBTRoleCtrl, roleType: ROLE_TYPE, clickHandler: Function) {
        this._currId = ROLE_SEQU++;
        this._roleCtrl = rootCtrl;
        this._clickHandler = clickHandler;
        this.buffListCtrl.init();
        this._parseRoleData(roleData, roleType);
        this._updateRole();
    }

    deInit () {
        this.unscheduleAllCallbacks();
        this._releaseSpine();
    }
    
    get loadTag () {
        return LOADER_TAG + this._currId;
    }

    get pos() {
        return this._pos;
    }

    setRolePos(pos: number) {
        this._pos = pos;
    }

    getRoleData () {
        return this._roleData;
    }


    set roleType(roleType: ROLE_TYPE) {
        this._roleType = roleType;
    }

    get roleType() {
        return this._roleData ? this._roleData.roleType : this._roleType;
    }

    set roleCtrl(roleCtrl: UIBTRoleCtrl) {
        this._roleCtrl = roleCtrl;
    }

    get roleCtrl(): UIBTRoleCtrl {
        return this._roleCtrl;
    }

    private _updateRole () {

        if (!cc.isValid(this._roleData)) return;
                
        this.updateBase();
        this.updateHpUi();
        this.updateSpine();
        this.updateBuff();
    }

    resetRoleZIndex() {
        if(cc.isValid(this.node.parent)) {
            this.node.parent.zIndex = this._pos;
        }
    }

    changeRoleZIndex(zIndex: number) {
        if(cc.isValid(this.node.parent) && this.node.parent.zIndex != zIndex) {
            this.node.parent.zIndex = zIndex;
        }
    }

    beginRun () {
        this.setAnimation("Run", true);
    }

    playSkill (skillId: number) {
        if (!skillId) {
            this.setAnimation("Attack", false);
            return 1
        } else {
            let configSkill = configUtils.getSkillConfig(skillId);
            if (configSkill && configSkill.MeleeOrLong == 2) {
                this.setAnimation("Skill3", false);
                return 0.7;
            } else {
                this.setAnimation("Skill1", false);
                return 0.7;
            }
        }
    }

    activeBuff (buffId: number) {
        let buffCfg = configUtils.getBuffConfig(buffId);
        if (buffCfg && buffCfg.BuffModelId) {
            switch(buffCfg.Type) {
                case BUFF_TYPE.NONE: 
                case BUFF_TYPE.GOOD: {
                    this.setAnimation("Skill2", false);
                    playAnimationOnce(ANIM_TYPE.Skeleton, {
                        path: 'spine/fx_231040/231040',
                        scale: 1,
                        offset: cc.v3(cc.winSize.width/4, 0, 0),
                        node: this._roleCtrl.node.parent,
                        animation: "animation"
                    })
                    return 1.5;
                }
                default: {
                    this.setAnimation("Hit", false);
                    return 0.5;
                }
            }
        }
        return 0;
    }

    playAttack (attRes: AttackResult, finshHandler: Function) {
        const finishCallBack = ()=> {
            finshHandler();
        }
    }

    moveBack () {
        if (this._roleData.ePos.type == BATTLE_POS.ORIGIN) {
            return 0;
        }

        let moveBack = this._roleCtrl.precessRoleMoveBack(this.getRoleData().uid, ()=> {
            this.resetRoleZIndex();
            this.setAnimation("Idle", true);
        });
        this._roleData.ePos = {type: BATTLE_POS.ORIGIN, index: -1};
        return moveBack;
    }

    updateHp (hpRes: HPResult) {
        if (!hpRes) return; 

        let roleData = this.getRoleData();
        if (hpRes.HP != null) {
            roleData.hp = hpRes.HP;
        }

        if (hpRes.MaxHP != null) {
            roleData.maxHp = hpRes.MaxHP;
        }

        if (hpRes.HP <= 0)
            this.setAnimation("Die", false);
        this.updateHpUi();
        if (hpRes.HP > 0)
            this._showHpLabel(hpRes, null);
    }

    showAttackLabel (attLabel: AttackResult) {
        this._showHpLabel(null, attLabel);
    }

    updateBase () {
        this.progressPower.progress = this._roleData.power / 100;
        this.lbName.string = this._roleData.roleCfg.Name;
        this.progressPower.node.active = this._roleData.roleType == ROLE_TYPE.HERO;
    }

    updateHpUi () {
        let role = this.getRoleData();
        this.lbBlood.string = `${role.hp}/${role.maxHp}`;
        this.progressHpBar.progress = role.hp/role.maxHp;
    }

    private _showHpLabel (hpRes: HPResult, attRes: AttackResult) {
        let item = this._getItemHitLabel();
        let comp = item.getComponent(HitLabel);
        comp.show(this.node, ()=> {
            comp.node.removeFromParent();
            // this._hitLabelPool.put(comp.node)
            HitLabelPool.put(comp);
        }, hpRes, attRes)
    }

    private _getItemHitLabel () {
        // if (this._hitLabelPool.size() > 0) {
        //     return this._hitLabelPool.get();
        // } else {
        //     return cc.instantiate(this.lbHit);
        // }
        return HitLabelPool.get();
    }

    // 只提供简单的播放接口
    setAnimation (name: string, isLoop: boolean) {
        if (this._skNode && cc.isValid(this._skNode)) {
            let spine = this._skNode.getChildByName("sp").getComponent(sp.Skeleton);
            if (spine) {
                if (spine.animation == "Die") {
                    console.log("[Role is dead]", )
                    return;
                }
                spine.setAnimation(0, name, isLoop);
            }
        }
    }

    takeAttack (res: ResultData, finshHandler: Function) {
        let hpRes = res.HPResult;
        let atkRes = res.AttackResult;
        const finishCallBack = ()=> {
            finshHandler && finshHandler();
        }

        const doAction = ()=> {
            if (this._skNode && cc.isValid(this._skNode)) {
                let spine = this._skNode.getChildByName("sp").getComponent(sp.Skeleton);
                if (spine) {
                    if (res.ItemId) {
                        let isBuff = !!configUtils.getBuffConfig(res.ItemId);
                        if (isBuff) {
                            playAnimationOnce(ANIM_TYPE.Skeleton, {
                                path: 'spine/fx_301020/fx_301020',
                                scale: 0.8,
                                offset: cc.v3(0, -50, 0),
                                node: this.node,
                                animation: "animation"
                            })
                        } else {
                            playAnimationOnce(ANIM_TYPE.Skeleton, {
                                path: 'spine/fx_230030/230030',
                                scale: 0.8,
                                node: this.node,
                                animation: "up"
                            })
                        }
                    } 
                    
                    if (hpRes && hpRes.Delta < 0) {
                        spine.setAnimation(0, "Hit", false);
                    } else if (atkRes && atkRes.Miss) {
                        spine.setAnimation(0, "Charge", false);
                    }
                   
                    spine.setCompleteListener(()=> {
                        if (hpRes && hpRes.HP == 0) {
                            this.playDeadAnim();
                        } else {
                            this.changeIdle();
                        }
                        spine.setCompleteListener(()=> {})
                        // finishCallBack();
                    })
                    this.scheduleOnce( ()=> {
                        finishCallBack &&  finishCallBack();
                    }, 0.5)
                }
            }
        }

        doAction();
    }

    playDeadAnim () { 
        this.setAnimation("Die", false);
    }

    changeIdle () { 
        this.setAnimation("Idle", true);
    }

    updateSpine () {
        let newSketon = DefaultRole;
        if (this._currRole == null/* || this._currRole != newSketon*/) {
            this._releaseSpine();

            this._currRole = newSketon;
            let spScale = EditorUtils.getRoleScale(newSketon);
            RoleLoader.loadRole(this._currRole, this._roleData.roleType == ROLE_TYPE.HERO, this.loadTag)
            .then(node => {
                node.scale = spScale;
                this._skNode = node;
                this._skNode.scale = 1;
                this.skNode.addChild(this._skNode);
                let spine = this._skNode.getChildByName("sp").getComponent(sp.Skeleton);
                spine.premultipliedAlpha = true;
                spine.setAnimation(0, "Idle", true)
                this.initActorSpine();
            })
            .catch(err => {
                logger.error('ItemRole', `load Role res error. name = ${this._currRole}, err = `, err);
            })
        } else {
            // console.log(`updateSpine. bug no need load.`);
        }

    }

    getSkillGfxNode (behindRole?: boolean): cc.Node {
        return behindRole ? this.nodeSkillGfxBehind : this.nodeSkillGfx;
    }

    getAoeNode (isTop: boolean = true): cc.Node {
        // return this._roleCtrl ? this._roleCtrl.getAoeNode() : this.node;
        // return this.node.parent.parent ? this.node.parent.parent : this.node.parent;
        return this._roleCtrl ? this._roleCtrl.getAoeNode(isTop) : this.node.parent;
    }

    initActorSpine () {
        let actorComp = this.node.getComponent(Actor);
        let spine = this._skNode.getChildByName("sp");
        actorComp.init(spine.getComponent(sp.Skeleton));
    }
    
    updateBuff () {
        this.buffListCtrl.node.x = this._roleData.roleType == ROLE_TYPE.HERO? -60:60;
        this.buffListCtrl.updateBuff(this._roleData.buffList)
    }

    updatebuffByRes (buffRes: BuffResult) {
        this.buffListCtrl.updateByEffRes(buffRes);
    }

    updatePowerByRes (powerRes: PowerResult) {
        this.progressPower.progress = powerRes.Power / 100;
    }

    private _releaseSpine () {
        if (cc.isValid(this._skNode)) {
            RoleLoader.releaseRole(this._currRole, this._skNode, this.loadTag);
            this._skNode = null;
            this._currRole = null;
        }
    }

    private _parseRoleData (roleData: UIRole, roleType: ROLE_TYPE) {
        let cfg = roleData.roleType == ROLE_TYPE.HERO? configUtils.getHeroConfig(roleData.roleId):configUtils.getMonsterConfig(roleData.roleId);
        this._roleData = {
            haloList: [],
            buffList: roleData.buffList,
            skillList: [],
            hp: roleData.hp,
            maxHp: roleData.maxHp,
            roleType: roleType,
            id: roleData.roleId,
            pos: roleData.pos,
            uid: roleData.uid,
            roleCfg: cfg,
            power: roleData.power,
            ePos:{
                type:BATTLE_POS.ORIGIN,
                index: -1
            },
        }
    }

    onClickRole () {
        this._clickHandler && this._clickHandler(this._roleData.id);
    }

    // EDITOR
    setHandler (func: Function) {
        this._clickHandler = func;
    }

    onClickAdd () {
        let name = DefaultRole;
        let selfName = this.node.name;
        let isHero = selfName.indexOf("Hero")!= -1? true:false;
        let spScale = EditorUtils.getRoleScale(name);
        RoleLoader.loadRole(name, isHero)
        .then(node => {
            node.scale = spScale;
            const rootNode = this.node.getChildByName(`SP_NODE`);
            const oldRole = rootNode.getChildByName(ROLE_NODE_NAME);
            if (oldRole) {
                if (oldRole.active == false) {
                    oldRole.active = true
                } else {
                    guiManager.showTips("角色已经添加！");
                }
                return;
            } else {
                node.name = ROLE_NODE_NAME;
                rootNode.addChild(node);
                let actorComp = this.node.getComponent("Actor");
                let spine = node.getChildByName("sp");
                actorComp.init(spine.getComponent(sp.Skeleton));
                this._currRole = name;
            }

        })
        .catch(err => {
            guiManager.showTips(`加载角色失败！！！`);
        })
        
    }

    onClickRemove () {
        const rootNode = this.node.getChildByName(`SP_NODE`);
        const oldRole = rootNode.getChildByName(ROLE_NODE_NAME);
        if (oldRole) {
            oldRole.active = false;
            return;
        } else {
            guiManager.showTips("这里没角色！");
        }
    }

    onClickSelect () {
        const rootNode = this.node.getChildByName(`SP_NODE`);
        const oldRole = rootNode.getChildByName(ROLE_NODE_NAME);
        if (!oldRole || !oldRole.active) {
            guiManager.showTips("先添加角色啊大哥");
            return;
        }

        let selfName = this.node.name;
        this._clickHandler(selfName, CLICK_TYPE.SELECT, this.node)
    }

    onClickSetSource () {
        const rootNode = this.node.getChildByName(`SP_NODE`);
        const oldRole = rootNode.getChildByName(ROLE_NODE_NAME);
        if (!oldRole || !oldRole.active) {
            guiManager.showTips("先添加角色啊大哥!");
            return;
        }

        let selfName = this.node.name;
        this._clickHandler(selfName, CLICK_TYPE.SET_SOURCE, this.node)
    }

    onClickSetTarget () {
        const rootNode = this.node.getChildByName(`SP_NODE`);
        const oldRole = rootNode.getChildByName(ROLE_NODE_NAME);
        if (!oldRole || !oldRole.active) {
            guiManager.showTips("先添加角色啊大哥!");
            return;
        }

        let selfName = this.node.name;
        this._clickHandler(selfName, CLICK_TYPE.SET_TARGET, this.node)
    }

    setOptBtnVisible(visible: boolean = true){
        cc.find('BTNs', this.node).active = visible;
    }

    set select (v: boolean) {
        this.nodeSelect.active = v;
    }

    set canSetTarget (v: boolean) {
        // this._setTarget = v;
        this.btnSource.interactable = v;
        this.btnTarget.interactable = v;
    }

    set isSource (v: boolean) {
        this._isSource = v;

        this.canSetTarget = !this._isSource && !this._isTarget;
    }

    get isSource () {
        return this._isSource;
    }

    set isTarget (v: boolean) {
        this._isTarget = v;
        this.canSetTarget = !this._isSource && !this._isTarget;
    }

    get isTarget () {
        return this._isTarget;
    }

    get currRole () {
        return this._currRole;
    }

    set currRole (v: string) {
        this._currRole = v;
    }

    //分身调用的方法，本体尽量不要调用
    setActorSpineColor(color: cc.Color){
        if(!color) return;
        this._skNode = this._skNode || (this.skNode.childrenCount > 0 && this.skNode.children[0]);
        if(!cc.isValid(this._skNode) || !cc.isValid(this._skNode.getChildByName("sp"))) return;
        this.initActorSpine();
        this._skNode.getChildByName("sp").color = cc.color(color.getR(), color.getG(), color.getB());
        this._skNode.getChildByName("sp").opacity = color.getA();
    }
}

export {CLICK_TYPE}