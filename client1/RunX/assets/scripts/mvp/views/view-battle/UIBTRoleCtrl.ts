import { MAX_ROLE_TEAM, SUBSTITU_MOVE_TIME } from "../../../app/AppConst";
import { BATTLE_POS, ROLE_TYPE, ROLE_MOVE_TIME, BT_DEFAULT_POS } from "../../../app/BattleConst";
import { battleUtils } from "../../../app/BattleUtils";
import { logger } from "../../../common/log/Logger";
import { ItemRolePool } from "../../../common/res-manager/NodePool";
import { UIRoleData } from "../../../app/BattleType";
import { battleUIData } from "../../models/BattleUIData";
import UIRole from "../../template/UIRole";
import UITeam from "../../template/UITeam";
import ItemRole from "../view-item/ItemRole";
import BattleScene from "../view-scene/BattleScene";
import { utils } from "../../../app/AppUtils";
import { pveData } from "../../models/PveData";
import { PVE_MODE } from "../../../app/AppEnums";

const { ccclass, property } = cc._decorator;

@ccclass
export default class UIBTRoleCtrl extends cc.Component {
    @property(cc.Node) aoeBottomNode: cc.Node = null;
    @property(cc.Node) aoeBottomNodeBlack: cc.Node = null;
    @property(cc.Node) aoeTopNode: cc.Node = null;
    @property(cc.Node) roleNodes: cc.Node[] = [];
    // @property(cc.Prefab)    itemRole: cc.Prefab = null;

    @property({
        type: cc.Enum(ROLE_TYPE),
        tooltip: "角色类型：0无效，1己方，2敌方"
    })
    roleType: ROLE_TYPE = ROLE_TYPE.HERO;

    private _roleItem: ItemRole[] = [];
    private _game: BattleScene = null;
    private _originPos: cc.Vec2[] = [];

    start () {
        this.roleNodes.forEach( (_rn, _idx) => {
            this._originPos[_idx] = cc.v2(_rn.x, _rn.y);
        })
    }

    get roleItems () {
        return this._roleItem;
    }

    init (game: BattleScene) {
        this._game = game;
    }

    battleBegin () {
        let team: UITeam;
        if (this.roleType == ROLE_TYPE.HERO) {
            team = battleUIData.getSelfTeam();
        } else {
            // PVE怪物队伍、PVP对手队伍
            team = battleUIData.getOppositeTeam();
        }

        for (let i = 0; i < MAX_ROLE_TEAM; ++i) {
            let index: number = team.roles.findIndex(role => { return role.pos == i; });
            if(index == -1) {
                this.removeRole(i);
            } else {
                if (team.roles[index] && team.roles[index].hp) {
                    let item = this.addRoleNode(team.roles[index], null);
                    let isShowHpBar = true;
                    // pve心魔法相地方阵容不显示血条
                    if(pveData.isPVEMode(PVE_MODE.XIN_MO_FA_XIANG) && this.roleType == ROLE_TYPE.MONSTER) {
                      isShowHpBar = false;
                    }
                    item.showBattle(isShowHpBar);
                } else {
                    this.removeRole(index);
                }
            }
        }
    }

    deInit () {
        this._roleItem.forEach( _role => {
            if (_role && cc.isValid(_role)) {
                _role.deInit();
                ItemRolePool.put(_role);
            }
        });
        this.roleNodes.forEach( (_rn, _idx) => {
            _rn.setPosition(this._originPos[_idx]);
        })
        this._roleItem = [];
    }

    addRoleNode (roleData: UIRole, clickHandler: Function = null): ItemRole {
        let ndIndex = roleData.pos;
        if (this.roleNodes[ndIndex]) {
            let itemRole: ItemRole = null;
            if (this._roleItem[ndIndex] && cc.isValid(this._roleItem[ndIndex])) {
                itemRole = this._roleItem[ndIndex];
            } else {
                itemRole = this._getRoleItem();
                this._roleItem[ndIndex] = itemRole;
                if (cc.isValid(this.roleNodes[ndIndex])) {
                    this.roleNodes[ndIndex].addChild(itemRole.node);
                }
            }
            itemRole.init(roleData, this, this.roleType, clickHandler);
            itemRole.node.setPosition(0, 0);
            return itemRole;
        }
        logger.error(`BaseRoleCtrl`, `add error pos roleData. roleData = ID:${roleData.roleId}_POS:${roleData.pos}`);
        return null;
    }

    removeRole (idx: number) {
        let curr = this._roleItem[idx];
        if (curr) {
            curr.deInit();
            curr.node.removeFromParent();
            ItemRolePool.put(curr);
            this._roleItem[idx] = null;
        } else {
            logger.log("[UIBT-RoleCtrl] cant find role")
        }
    }

    get guideRoles() {
        let itemRoles: ItemRole[] = [];
        this._roleItem.forEach(item => {
            if(item.role.hp > 0) {
                itemRoles.push(item);
            }
        });
        return itemRoles;
    }

    getRoleNode (instanceId: number): cc.Node {
        if (!instanceId) return null;
        return this._findRoleNodeByInstanId(instanceId);
    }

    getRoleNodes() {
        return this.roleNodes;
    }

    getRoleNodeByPos (position: number): cc.Node {
        if (this.roleNodes[ position ] && cc.isValid(this.roleNodes[ position ])) {
            let roleNode = this.roleNodes[ position ].children[0];
            if (roleNode && cc.isValid(roleNode))
                return roleNode;
        } 
        return null;
    }

    getRoleItem (instanceId: number): ItemRole {
        if (!instanceId) return null;

        let roleNode = this._findRoleNodeByInstanId(instanceId);
        if (roleNode && cc.isValid(roleNode)) {
            let comp = roleNode.getComponent(ItemRole);
            return comp;
        }
        return null;
    }

    getRoleBySkillId(skillId: number): ItemRole {
        let role: ItemRole = null;
        this._roleItem.forEach(_r => {
            if(!role && _r) {
                let findSkill = _r.role.skillList.find(_s => {
                    return _s.skillId == skillId;
                });
                if(findSkill) {
                    role = _r;
                }
            }
        });
        return role;
    }

    getRoleByRoleId(roleId: number): ItemRole {
        let role: ItemRole = null;
        this._roleItem.forEach(_r => {
            if(!role && _r) {
                if(_r.role.id == roleId) {
                    role = _r;
                }
            }
        });
        return role;
    }

    getAllRoles (): UIRoleData[] {
        let allRoles: UIRoleData[] = [];
        for (let i = 0; i < this._roleItem.length; i++) {
            let roleItem = this._roleItem[ i ];
            if (cc.isValid(roleItem) && cc.isValid(roleItem.node)) {
                let roleData = roleItem.role;
                if (roleData && roleData.hp > 0) {
                    allRoles.push(roleData);
                }
            }
        }
        return allRoles;
    }

    private _findRoleNodeByInstanId (roleInstanId: number): cc.Node{
        let findNode: cc.Node = null;
        for (let i = 0; i < this._roleItem.length; i++) {
            let roleItem= this._roleItem[i];
            if (cc.isValid(roleItem) && cc.isValid(roleItem.node)) {
                if (roleItem.role.uid == roleInstanId) {
                    findNode = roleItem.node;
                    break;
                }
            }
        }
        return findNode;
    }
    /**
     * 
     * @param targetUid 目标Uid
     * @param userUid 移动者的Uid
     * @param ePos 需要移动到的位置信息
     * @param finishHandler 移动完成后回调
     * @description 【注意】这里的移动不是技能编辑器设置的，是默认的移动，技能编辑器的移动逻辑放到Actor.ts
     * @returns 
     */
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
            let userData = user.role;

            const moveFinish = ()=> {
                finishHandler && finishHandler();
            }

            let originPos = userData.ePos;

            if (ePos.type == BATTLE_POS.ORIGIN && ePos.type == originPos.type
                || ePos.type == BATTLE_POS.FORWARD && ePos.type == originPos.type) {
                duration = 0;
                moveFinish();
            }

            if (ePos.type == BATTLE_POS.FORWARD) {
                const ROLE_FORMAR_GAP = this.roleType == ROLE_TYPE.HERO? 120:-120;
                user.node.stopAllActions();
                user.node.runAction(cc.sequence(
                    cc.callFunc(()=> {
                        user.beginRun();
                        user.role.ePos = {
                            type: BATTLE_POS.FORWARD,
                            index: -1
                        }
                    }),
                    cc.moveTo(ROLE_MOVE_TIME/2, cc.v2(ROLE_FORMAR_GAP, 0)),
                    cc.callFunc(()=> {
                        moveFinish();
                    }))       
                )
                duration = ROLE_MOVE_TIME/2;
            } else if (ePos.type == BATTLE_POS.TARGET) {
                if (target) {
                    if (originPos.type == BATTLE_POS.TARGET && originPos.index == ePos.index) {
                        duration = 0;
                        moveFinish();
                    } else {
                        let userNode = user.node;
                        const ROLE_FORMAR_GAP = this.roleType == ROLE_TYPE.HERO? -150:150;
                        let targetWorldPos = target.node.convertToWorldSpaceAR(cc.v2(ROLE_FORMAR_GAP, 0));
                        let targetPos = userNode.parent.convertToNodeSpaceAR(targetWorldPos);
                        userNode.stopAllActions();
                        user.beginRun();
                        user.role.ePos = {
                            type: BATTLE_POS.TARGET,
                            index: ePos.index
                        }
                        
                        if (!utils.checkPosNeedMove(userNode.getPosition(), targetPos)) {
                            moveFinish();
                        } else {
                            userNode.runAction(cc.sequence(
                                cc.moveTo(ROLE_MOVE_TIME, targetPos),
                                cc.callFunc(()=> {
                                    moveFinish();
                                })
                            ))
                        }
                    }
                    duration = ROLE_MOVE_TIME;
                }
            }  else if (ePos.type == BATTLE_POS.ORIGIN) {
                if (originPos.type == BATTLE_POS.ORIGIN) {
                    duration = 0;
                    moveFinish();
                } else {
                    let userNode = user.node;
                    userNode.stopAllActions();
                    user.beginRun();
                    user.role.ePos = {
                        type: BATTLE_POS.ORIGIN,
                        index: ePos.index
                    }
                    userNode.runAction(cc.sequence(
                        cc.moveTo(ROLE_MOVE_TIME, cc.v2(0, 0)),
                        cc.callFunc(()=> {
                            moveFinish();
                        })
                    ))
                }
                duration = ROLE_MOVE_TIME;
            }

            this.scheduleOnce(() => {
                battleUtils.updateMoveZIndex(user, target);
            }, duration / 5 * 4);
        }
        return duration;
    }

    onAllMoveBack () {
        let moveTime = 0;
        let items = this.roleItems.filter(_item => {return _item && _item.role.hp > 0});
        items.forEach( _item => {
            moveTime = Math.max(this.onRoleMoveBack(_item), moveTime);
        })
        return moveTime;
    }

    onRoundEnd () {
        let items = this.roleItems.filter(_item => {return _item && _item.role.hp > 0});
        items.forEach( _item => {
            this.onRoleMoveBack(_item);
        })
    }

    onRoleMoveBack (role: ItemRole): number {
        // 恢复因为坦攻而导致的位置变换
        let moveTime = 0;
        this._preRemoveShadows(role);
        this.resetRootPos(role);

        if (role.checkNeedMoveBack()) {
            moveTime = this.precessRoleMoveBack(role.role.uid, ()=> {
                role.afterMoveBack();
            });
        }
        return moveTime;
    }

    private _preRemoveShadows(role: ItemRole){
        //影子节点不应该在这里移除
        if(role.isShadow) return;
        if(!role.wholeShadows || role.wholeShadows.length == 0) return;
        role.wholeShadows.forEach((ele => {
            if(!cc.isValid(ele)) return;
            let destroyDelay = ele.shadowCfg ? (ele.shadowCfg.delay || 0) : 0;
            ele.scheduleOnce(() => {
                ele.removeShadow();
            }, destroyDelay);
        }))
    }

    precessRoleMoveBack (targetUid: number, finishHandler?: Function) {
        let target = this.getRoleNode(targetUid);
        let itemRole = target? target.getComponent(ItemRole):null;

        if (itemRole) {
            if (itemRole && cc.isValid(itemRole)) {
                if (itemRole.role.ePos.type == BATTLE_POS.ORIGIN) {
                    return 0;
                } else if (itemRole.role.hp <= 0) {
                    return 0;
                } else if(itemRole.node.position.x == 0 && itemRole.node.position.y == 0) {
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

    /**
     * @description 重置角色的原始位置
     * @param role 
     */
    resetRootPos (role: ItemRole) {
        let _pos = role.role.pos;
        let _tNd = this.roleNodes[_pos];
        if (_tNd && cc.isValid(_tNd)) {

            if (Math.abs(_tNd.x - this._originPos[_pos].x) < 2) {
                _tNd.x = this._originPos[_pos].x
            }
            
            if (Math.abs(_tNd.y - this._originPos[_pos].y) < 2) {
                _tNd.y = this._originPos[_pos].y
            }

            if (_tNd.x != this._originPos[_pos].x || _tNd.y != this._originPos[_pos].y) {
                // role.beginRun();
                _tNd.stopAllActions();
                _tNd.runAction( cc.sequence(
                    cc.moveTo(ROLE_MOVE_TIME/2, cc.v2(this._originPos[_pos])),
                    cc.callFunc( ()=> {
                        role.changeIdle()
                    }))
                )
            } else {
                role.changeIdle();
            }
        }
    }
    
    // targetUid 是本来要打的人（被保护者），substituid 是真正要打的人（保护者）
    processRoleSubstitution (targetUid: number, substituId: number) {
        let target = this.getRoleItem(targetUid);
        let substitu = this.getRoleItem(substituId);

        let posTarget = target.role.pos;
        let substituPos = substitu.role.pos

        let targetNode = this.roleNodes[posTarget];
        let substituNode = this.roleNodes[substituPos];

        if (targetNode && substituNode) {
            // 根节点的位置移动
            let targetWorldPos = targetNode.convertToWorldSpaceAR(cc.v2(0, 0));
            let subNowPos = substituNode.parent.convertToNodeSpaceAR(targetWorldPos);

            let posOffset = target.role.roleType == ROLE_TYPE.HERO? -100:100;
            let targetPos = this._originPos[posTarget].add(cc.v2(posOffset, 0));

            let currPos = targetNode.getPosition()
            
            // 有可能是已经坦攻效果已经移动过了，就不用再浪费时间了
            if (!utils.checkPosNeedMove(currPos, targetPos)) {
                return 0;
            }

            this.scheduleOnce(() => {
                let startZIndex = (this.roleNodes[ substituPos ] && this.roleNodes[ substituPos ].zIndex) || 0;
                let substatituZIndex = battleUtils.getSubstitutionRoleZIndex(target) + startZIndex;
                substitu.changeRoleZIndex(substatituZIndex);
            }, SUBSTITU_MOVE_TIME / 2);
            
            // substitu.beginRun()
            substituNode.stopAllActions();
            substituNode.runAction( cc.sequence(
                cc.moveTo(SUBSTITU_MOVE_TIME, cc.v2(subNowPos, 0)),
                cc.callFunc( ()=> {
                    substitu.changeIdle();
                }))
            )


            // target.beginRun()
            targetNode.stopAllActions();
            targetNode.runAction( cc.sequence(
                cc.moveTo(SUBSTITU_MOVE_TIME, cc.v2(targetPos, 0)),
                cc.callFunc( ()=> {
                    target.changeIdle()
                }))
            )
            return SUBSTITU_MOVE_TIME;
        }
        return 0;
    }

    // ------------ 战斗外用的接口 ------------
    /**
     * 获取第一个空的位置
     * @param maxCount 阵容最大个数限制
     * @returns 下标
     */
    getFirstEmptyPos (maxCount: number) {
        for (let i = 0; i < maxCount; i++) {
            let ndCurr = this._roleItem[BT_DEFAULT_POS[i]]
            if (!ndCurr) {
                return BT_DEFAULT_POS[i];
            }
        }
        return -1;
    }

    /**
     * @desc 获取AOE的节点，一般我们取中间的节点固定就行
     *
     * @returns {cc.Node}
     * @memberof BaseRoleCtrl
     */
    getAoeNode (isTop: boolean = true): cc.Node {
        // if (cc.isValid(this.roleNodes[2]))
        //     return this.roleNodes[2];
        // return this.node;
        let aoeNode: cc.Node = isTop ? this.aoeTopNode : this.aoeBottomNode;
        // 如果有全屏黑幕的话，需要其他
        if (this._game.shadeCtrl.node.active && !isTop) {
            aoeNode = this.aoeBottomNodeBlack
        }

        if(!aoeNode) {
            return this.node;
        } else {
            return aoeNode;
        }
    }
    
    private _getRoleItem (): ItemRole {
        return ItemRolePool.get();
    }

    /**
     * 查看坦攻的位移逻辑完成了没，未完成要预留时间
     */
    checkSubstitueFinish (targetUid: number, substituId: number) {
        let target = this.getRoleItem(targetUid);
        let substitu = this.getRoleItem(substituId);

        let posTarget = target.role.pos;
        let substituPos = substitu.role.pos

        let targetNode = this.roleNodes[posTarget];
        let substituNode = this.roleNodes[substituPos];

        if (targetNode && substituNode) {
            let posOffset = target.role.roleType == ROLE_TYPE.HERO? -100:100;
            let targetPos = this._originPos[posTarget].add(cc.v2(posOffset, 0));
            let currPos = targetNode.getPosition()
            // 有可能是已经坦攻效果已经移动过了，就不用再浪费时间了
            if (utils.checkPosNeedMove(currPos, targetPos)) {
                return false
            }
        }
        return true
    }
 
}