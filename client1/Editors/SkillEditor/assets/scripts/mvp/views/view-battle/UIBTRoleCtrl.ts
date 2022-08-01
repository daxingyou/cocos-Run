import { ROLE_MOVE_TIME } from "../../../app/AppConst";
import { BATTLE_POS, ROLE_TYPE } from "../../../app/AppEnums";
import { configUtils } from "../../../app/ConfigUtils";
import { logger } from "../../../common/log/Logger";
import { ItemRolePool } from "../../../common/res-manager/NodePool";
import { UIRoleData } from "../../../game/BattleType";
import { modelManager } from "../../models/ModeManager";
import UIRole from "../../template/UIRole";
import UITeam from "../../template/UITeam";
import ItemRole from "../view-item/ItemRole";
import BattleScene from "../view-scene/BattleScene";

const { ccclass, property } = cc._decorator;
const ROLE_Z_INDEX = 1;

@ccclass
export default class UIBTRoleCtrl extends cc.Component {
    @property(cc.Node)      aoeBottomNode: cc.Node = null;
    @property(cc.Node)      aoeTopNode: cc.Node = null;
    @property(cc.Node)      roleNodes: cc.Node[] = [];

    @property({
        type: cc.Enum(ROLE_TYPE),
        tooltip: "角色类型：0无效，1己方，2敌方"
    })
    roleType: ROLE_TYPE = ROLE_TYPE.HERO;

    private _roleItem: ItemRole[] = [];
    private _game: BattleScene = null;

    init (game: BattleScene) {
        this._game = game;
    }

    battleBegin () {
        let team: UITeam;
        if (this.roleType == ROLE_TYPE.HERO) {
            team = modelManager.battleUIData.getSelfTeam();
        } else {
            // PVE怪物队伍、PVP对手队伍
            team = modelManager.battleUIData.getOppositeTeam();
        }

        for (let i = 0; i < team.roles.length; ++i) {
            if (team.roles[i].hp) {
                this.addRoleNode(team.roles[i], null);
            }
        }
    }

    deInit () {
        this._roleItem.forEach( _role => {
            if (_role && cc.isValid(_role)) {
                _role.deInit();
                // _role.node.removeFromParent();
                ItemRolePool.put(_role);
            }
        })


        this._roleItem = [];
    }

    addRoleNode (roleData: UIRole, clickHandler: Function = null): cc.Node {
        if (this.roleNodes[ roleData.pos ]) {
            let itemRole: ItemRole = null;
            if (this._roleItem[roleData.pos] && cc.isValid(this._roleItem[roleData.pos])) {
                itemRole = this._roleItem[roleData.pos];
            } else {
                itemRole = this._getRoleItem();
                this._roleItem[roleData.pos] = itemRole;
                if (cc.isValid(this.roleNodes[ roleData.pos ])) {
                    this.roleNodes[ roleData.pos ].addChild(itemRole.node);
                    itemRole.changeRoleZIndex(roleData.pos);
                }
            }

            let roleNode = itemRole.node;
            itemRole.init(roleData, this, this.roleType, clickHandler);


            return roleNode;
        }
        logger.error(`BaseRoleCtrl`, `add error pos roleData. roleData = ID:${roleData.roleId}_POS:${roleData.pos}`);
        return null;
    }

    removeRole (heroId: number, idx: number) {
        let curr = this._roleItem[idx];
        if (curr && curr.getRoleData().id == heroId) {
            curr.deInit();
            curr.node.removeFromParent();
            this._roleItem[idx] = null;
        } else {
            logger.error("[UIBT-RoleCtrl] cant find role")
        }
    }

    getRoleNode (instanceId: number): cc.Node {
        return this._findRoleNodeByInstanId(instanceId);
    }

    getRoleItem (instanceId: number): ItemRole {
        let roleNode = this._findRoleNodeByInstanId(instanceId);
        if (roleNode && cc.isValid(roleNode)) {
            let comp = roleNode.getComponent(ItemRole);
            return comp;
        }
        return null;
    }

    private _findRoleNodeByInstanId (roleInstanId: number): cc.Node{
        let findNode: cc.Node = null;
        for (let i = 0; i < this._roleItem.length; i++) {
            let roleItem= this._roleItem[i];
            if (cc.isValid(roleItem) && cc.isValid(roleItem.node)) {
                if (roleItem.getRoleData().uid == roleInstanId) {
                    findNode = roleItem.node;
                    break;
                }
            }
        }
        return findNode;
    }

    getAllRoles (): UIRoleData[] {
        let allRoles: UIRoleData[] = [];
        for (let i = 0; i < this._roleItem.length; i++) {
            let roleItem = this._roleItem[ i ];
            if (cc.isValid(roleItem) && cc.isValid(roleItem.node)) {
                let roleData = roleItem.getRoleData();
                if (roleData && roleData.hp > 0) {
                    allRoles.push(roleData);
                }
            }
        }
        return allRoles;
    }

    private _getRoleItem (): ItemRole {
    //    let nodeRole = cc.instantiate(this.itemRole);
    //    let itemComp = nodeRole.getComponent(ItemRole)
       return ItemRolePool.get();
    }

    precessRoleMove (targetUid: number, userUid: number, ePos: {type: BATTLE_POS, index: number}, finishHandler: Function): number {
        let duration = 0;
        let target: ItemRole = null;
        let user: ItemRole = null;

        if (this.roleType == ROLE_TYPE.HERO) {
            target = this._game.monsterCtrl.getRoleItem(targetUid);
            user = this._game.heroCtrl.getRoleItem(userUid);
        } else {
            target = this._game.heroCtrl.getRoleItem(targetUid);
            user = this._game.monsterCtrl.getRoleItem(userUid);
        }

        if (user) {
            let originPos = user.getRoleData().ePos;
            if (ePos.type == BATTLE_POS.ORIGIN && ePos.type == originPos.type
                || ePos.type == BATTLE_POS.FORWARD && ePos.type == originPos.type) {
                duration = 0;
            }

            if (ePos.type == BATTLE_POS.FORWARD) {
                const ROLE_FORMAR_GAP = this.roleType == ROLE_TYPE.HERO? 120:-120;
                user.node.stopAllActions();
                user.node.runAction(cc.sequence(
                    cc.callFunc(()=> {
                        user.beginRun();
                        user.getRoleData().ePos = {
                            type: BATTLE_POS.FORWARD,
                            index: -1
                        }
                    }),
                    cc.moveTo(ROLE_MOVE_TIME/2, cc.v2(ROLE_FORMAR_GAP, 0)),
                    cc.callFunc(()=> {
                        finishHandler && finishHandler();
                    }))       
                )
                duration = ROLE_MOVE_TIME/2;
            } else if (ePos.type == BATTLE_POS.TARGET) {
                if (target) {
                    if (originPos.index == ePos.index) {
                        duration = 0;
                    } else {
                        let userNode = user.node;
                        const ROLE_FORMAR_GAP = this.roleType == ROLE_TYPE.HERO? -150:150;
                        let targetWorldPos = target.node.convertToWorldSpaceAR(cc.v2(ROLE_FORMAR_GAP, 0));
                        let targetPos = userNode.parent.convertToNodeSpaceAR(targetWorldPos);
                        userNode.stopAllActions();
                        user.beginRun();
                        user.changeRoleZIndex(cc.macro.MAX_ZINDEX);
                        userNode.runAction(cc.sequence(
                            cc.moveTo(ROLE_MOVE_TIME, targetPos),
                            cc.callFunc(()=> {
                                finishHandler && finishHandler();
                            })
                        ))
                    }
                    duration = ROLE_MOVE_TIME;
                }
            }
            originPos.type = ePos.type;
            originPos.index = ePos.index;
        }

        return duration;
    }

    precessRoleMoveBack (targetUid: number, finishHandler?: Function) {
        let target = this.getRoleNode(targetUid);
        let itemRole = target? target.getComponent(ItemRole):null;

        if (itemRole) {
            // let originNode = this.roleNodes[itemRole.getRoleData().pos];
            if (itemRole && cc.isValid(itemRole)) {
                if (itemRole.getRoleData().ePos.type == BATTLE_POS.ORIGIN) {
                    return 0;
                } else {
                    target.stopAllActions();
                    target.runAction(cc.sequence(
                        cc.moveTo(ROLE_MOVE_TIME, cc.v2(0, 0)),
                        cc.callFunc(()=> {
                            finishHandler && finishHandler();
                        })
                    ))
                    return ROLE_MOVE_TIME + 0.2;
                }
            }
        }
        return 0;
    }

    // 战斗外用的接口
    getFirstEmptyPos () {
        for (let i = 0; i < 5; i++) {
            let ndCurr = this._roleItem[i]
            if (!ndCurr) {
                return i;
            }
        }
        return -1;
    }

    
    /**
     * @desc 获取AOE的节点，一般我们取第二个节点固定就行
     *
     * @returns {cc.Node}
     * @memberof BaseRoleCtrl
     */
     getAoeNode (isTop: boolean = true): cc.Node {
        // if (cc.isValid(this.roleNodes[2]))
        //     return this.roleNodes[2];
        // return this.node;
        return isTop ? this.aoeTopNode : this.aoeBottomNode;
    }


}