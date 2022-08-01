import EditorUtils from "./EditorUtils";
import { store } from "./store/EditorStore";
import { stateUIRole, stateRoleInfo, getRoleInfo, getCurrSkill, getRoleName, stateCurrSkill, getCurrEffectInfo } from "./reducers/EditorReducers";
import guiManager from "../../../common/GUIManager";
import { EditorActionType, StateUIRole, StateRoleInfo } from "./models/EditorConst";
import { actionUpdateUIRole, actionUpdateRoleInfo, actionUpdateSkill } from "./actions/EditorActions";
import { RoleInfo } from "./view-actor/CardSkill";
import EditorUICheckbox from "./EditorUICheckbox";
import UICombox from "./components/UICombox";
import RoleLoader from "../view-battle/RoleLoader";
import ItemRole from "../view-item/ItemRole";

export const ROLE_NODE_NAME = 'ROLE';
const DEFAULT_ROLE_WIDTH = 130;
const DEFAULT_ROLE_HEIGHT = 180;
const DEFAULT_TIME_OFFSET = 0;

const {ccclass, property} = cc._decorator;
@ccclass
export default class EditorUIRoleSelector extends cc.Component {
    @property(UICombox)         comboxSource: UICombox = null;
    @property(UICombox)         comboxTarget: UICombox = null;
    @property(cc.Node)          nodeSourceBox: cc.Node = null;
    @property(EditorUICheckbox)     checkShowBox: EditorUICheckbox = null;
    @property(cc.EditBox)       editTime: cc.EditBox = null;

    private _currHero: string = null;
    private _currMonster: string = null;
    private _roleSource: cc.Node = null;
    private _roleTarget: cc.Node = null;

    onLoad () {
        store.registerReady(this._onEditorPrepared, this);
        store.subscribe(stateUIRole, this._onUIRoleUpdate, this);
        store.subscribe(stateRoleInfo, this._onRoleInfoUpdate, this);
        store.subscribe(stateCurrSkill, this._onSkillChange, this);
        this.checkShowBox.init('包围盒', () => {
            this._toggleBox();
        });
    }

    private _onEditorPrepared () {
        this._roleSource = store.sourceRole.node;
        this._roleTarget = store.targetRole.node;

        let rolePath: string[] = [];
        EditorUtils.RoleSkeleton.forEach( (v,k)=> {
            rolePath.push(k)
        });
        this.comboxSource.addItem(rolePath);
        this.comboxTarget.addItem(rolePath);

        this.comboxSource.setHandler(() => {
            this._onHeroSelect();
        });

        this.comboxTarget.setHandler(() => {
            this._onMonsterSelect();
        });
    }


    private _onSkillChange() {
        this._onUIRoleUpdate();
    }

    onChangeHero (nameStr: string, isHero: boolean) {
        if (isHero) {
            this._currHero = nameStr;
            this._roleSource = store.sourceRole.node;
            // this._onHeroSelect();
        } else {
            this._currMonster = nameStr;
            this._roleTarget = store.targetRole.node;
            // this._onMonsterSelect();
        }
    }

    private _onHeroSelect () {
        if (this._currHero === this.comboxSource.selected) {
            return;
        }  

        let select = EditorUtils.RoleSkeleton.get(this.comboxSource.selected);
        
        let preSkill = getCurrSkill(store.getState());
        if(preSkill.roleInfo.name != select) {
            preSkill.roleInfo.name = select;
        }
        store.dispatch(actionUpdateSkill(preSkill));
        
        if (select)
        store.dispatch(actionUpdateUIRole({
            hero: select,
        }))
    }

    private _onMonsterSelect () {
        if (this._currMonster === this.comboxTarget.selected) {
            return;
        }

        let select = EditorUtils.RoleSkeleton.get(this.comboxTarget.selected);
        if (select)
            store.dispatch(actionUpdateUIRole({
                monster: select,
            }))
    }

    private _loadHero (name: string, handler: Function) {
        let spScale = EditorUtils.getRoleScale(name);
        RoleLoader.loadRole(name)
        .then(node => {
            const rootNode = this._roleSource.getChildByName(`SP_NODE`);
            const oldRole = rootNode.getChildByName(ROLE_NODE_NAME);
            if (oldRole) {
                RoleLoader.releaseRole(this._currHero, oldRole);
                oldRole.removeFromParent(true);
                oldRole.destroy();
            }
            this._currHero = name;
            node.name = ROLE_NODE_NAME;
            rootNode.addChild(node);
            let actorComp = this._roleSource.getComponent("Actor");
            let spine = node.getChildByName("sp");
            let skeleton = spine.getComponent(sp.Skeleton);
            actorComp.init(skeleton);
            node.scale = spScale;
            let roleComp = this._roleSource.getComponent(ItemRole);
            roleComp.currRole = name;
            handler();
        })
        .catch(err => {
            guiManager.showTips(`加载角色失败！！！`);
            handler();
        })
    }

    private _loadMonster (name: string, handler: Function) {
        let spScale = EditorUtils.getRoleScale(name);
        RoleLoader.loadRole(name, false)
        .then(node => {
            const rootNode = this._roleTarget.getChildByName(`SP_NODE`);
            const oldRole = rootNode.getChildByName(ROLE_NODE_NAME);
            if (oldRole) {
                RoleLoader.releaseRole(this._currMonster, oldRole);
                oldRole.removeFromParent(true);
                oldRole.destroy();
            }
            this._currMonster = name;
            node.name = ROLE_NODE_NAME;
            rootNode.addChild(node);
            let actorComp = this._roleTarget.getComponent("Actor");
            let spine = node.getChildByName("sp");
            node.scale = spScale;
            actorComp.init(spine.getComponent(sp.Skeleton));
            let roleComp = this._roleSource.getComponent(ItemRole);
            roleComp.currRole = name;
            handler();
        })
        .catch(err => {
            guiManager.showTips(`加载怪物失败！！！`);
            handler();
        })
    }

    private _onUIRoleUpdate () {
        const uiRole: StateUIRole = store.getState().stateUIRole;
        let hero = getRoleName(store.getState());
        if (hero.name != this._currHero) {
            // this._currHero = hero;
            // this.comboxSource.selected = this._currHero;
            guiManager.showWaiting(() => {
                this._loadHero(hero.name, () => {
                    guiManager.hideWaiting();
                    this._updateRoleInfo();
                });
            })
        }

        if (uiRole.monster != this._currMonster) {
            // this._currMonster = uiRole.monster;
            // this.comboxTarget.selected = this._currMonster;
            guiManager.showWaiting(() => {
                this._loadMonster(uiRole.monster, () => {
                    guiManager.hideWaiting();
                });
            })
        }
    }

    private _onRoleInfoUpdate (cmd: string, info: RoleInfo) {
        this._updateRoleInfo();
    }

    private _updateRoleInfo () {
        const info = this._mergeRoleInfo(getRoleInfo(this._currHero, store.getState()));
        // const info1 = this._mergeRoleInfo(getCurrSkill(store.getState()))
        this.editTime.string = info.timeOffset + '';
        this._updateBox(cc.size(info.width, info.height));
        cc.director.emit('UPDATE_HERO');
    }

    private _mergeRoleInfo (info: RoleInfo): RoleInfo {
        if (info) {
            return {
                name: info.name,
                width: info.width && info.width > 0 ? info.width : DEFAULT_ROLE_WIDTH,
                height: info.height && info.height > 0 ? info.height : DEFAULT_ROLE_HEIGHT,
                timeOffset: info.timeOffset ? info.timeOffset : 0,
            }
        } else {
            return {
                name: this._currHero,
                width: DEFAULT_ROLE_WIDTH,
                height: DEFAULT_ROLE_HEIGHT,
                timeOffset: DEFAULT_TIME_OFFSET,
            }
        }
    }

    onSetRoleInfoClick () {
        let info = this._mergeRoleInfo(getRoleInfo(this._currHero, store.getState()));
        guiManager.loadView('EditorSkillRoleInfoView', null, info);
    }

    onUpdateTimeClick () {
        const time = parseFloat(this.editTime.string);
        store.dispatch(actionUpdateRoleInfo({
            name: this._currHero,
            timeOffset: time,
        }));
    }

    private _updateBox (wh: cc.Size) {
        const node = this.nodeSourceBox;
        node.setContentSize(wh);
    }

    private _toggleBox () {
        this.nodeSourceBox.active = !this.nodeSourceBox.active;
    }
}