import { eventCenter } from "../../../common/event/EventCenter";
import { battleStatisticEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { gamesvr } from "../../../network/lib/protocol";
import { battleUIData } from "../../models/BattleUIData";
import { battleUIOpt } from "../../operations/BattleUIOpt";
import { BTKillStatisticItem, BTKillStatisticSubItem, BTStatisticItem, BTStatisticItemType, BTStatisticSubItem } from "../../template/BTStatistic";
import BattleStatisticView from "../view-statistic/BattleStatisticView";
import UIRole from "../../template/UIRole";
import { utils } from "../../../app/AppUtils";
import UITeam from "../../template/UITeam";
import { ROLE_TYPE } from "../../../app/BattleConst";
import { configUtils } from "../../../app/ConfigUtils";
import { cfg } from "../../../config/config";
import { scheduleManager } from "../../../common/ScheduleManager";

interface RoleStatistic {
    roleID: number,
    surplusHp?: number[],
    hurtSts?: BTStatisticItem,   //输出统计
    attackedSts?: BTStatisticItem,   //承伤
    addBloodSts?: BTStatisticItem,   //治疗
    addedBloodSts?: BTStatisticItem,   //被治疗
    killSts?: BTKillStatisticItem    //击杀
}

enum BattleStatisticType{
    Hurt = 1,
    Attacked,
    AddBlood,
    AddedBlood,
    Kill
}

enum BuffType {
    Buff,
    Halo,
    TeamBuff,
}

/**
 * 英雄身上的buff
 * type buff类型
 * Uid  唯一ID
 * cnt  当前层数
 * role 挂在谁身上
 * from buff来源，可能时RoleUID，表示谁加的buff；也可能是另一个buff的UID，
 * ID   buffID，可以通过SKillBuff表查询到对应的buff配置
 * itemID: 引起buff的SkillID, 或者BuffID
 * range： 光环的范围
 */
interface BuffInfo {
    type: BuffType
    Uid: number,
    cnt?: number,
    role: number,
    from?: number,
    ID?: number,
    itemID?: number
    range?: number[],
}

class BattleStatisticor{
    private _enemySts: Map<number, RoleStatistic> = null;
    private _selfSts: Map<number, RoleStatistic> = null;
    private _roundCount: number = 0;
    private _roundResult: number[] = [0, 0];
    private _curMsgSeq: number = -1;

    // 是否不需要战斗UI， true：没有战斗UI, false: 有战斗UI
    private _isBattleMore: boolean = false;

    //对局最大次数
    private _maxRoundCount: number = 1;
    private _battleStatisticView: BattleStatisticView = null;

    private _buffMap: Map<number, BuffInfo> = null;
    // 用于统计的战斗数据
    private _selfTeam: UITeam = null;
    private _enemyTeam: UITeam = null;

    constructor(){
        this._enemySts = new Map<number, RoleStatistic>();
        this._selfSts = new Map<number, RoleStatistic>();
        this._initEvents();
    }

    init(){
        this.clear();
    }

    clear(){
        this._enemySts && this._enemySts.clear();
        this._selfSts && this._selfSts.clear();
        this._selfTeam = null;
        this._enemyTeam = null;
        this._roundCount = 0;
        this._maxRoundCount = 1;
        this._curMsgSeq = -1;
        this._roundResult.forEach((ele, idx) => {
            this._roundResult[idx] = 0;
        });
    }

    private _getRoleByUid(roleUID: number) {
        let role: UIRole = null;
        if(this._selfTeam && this._selfTeam.roles) {
            if(this._selfTeam.roles.some(ele => {
                if(ele.uid == roleUID) {
                    role = ele;
                    return true;
                }
                return false;
            })) {
                return role;
            };
        }

        if(this._enemyTeam && this._enemyTeam.roles) {
            if(this._enemyTeam.roles.some(ele => {
                if(ele.uid == roleUID) {
                    role = ele;
                    return true;
                }
                return false;
            })) {
                return role;
            };
        }
        return role;
    }

    private _getRoleByID(team: UITeam, id: number) {
        if(!team || !team.roles || team.roles.length == 0) return null;

        let targetRole: UIRole = null;
        team.roles.some(ele => {
            if(ele.roleId == id) {
                targetRole = ele;
                return true;
            }
            return false;
        })
        return targetRole;
    }

    setMaxRoundCount(count: number){
        this._maxRoundCount = count;
    }

    setBattleStatisticView(view: BattleStatisticView){
        this._battleStatisticView = view;
    }

    get isBattleMore(){
        return this._isBattleMore;
    }

    set battleMore(enable: boolean){
        this._isBattleMore = enable;
    }

    private _initEvents(){
        eventCenter.register(battleStatisticEvent.BATTLE_START, this, this._processBTStartMsg);
        eventCenter.register(battleStatisticEvent.ROUND, this, this._processBtRoundStart);
        eventCenter.register(battleStatisticEvent.BATTLE_END, this, this._processBTEndMsg);
        eventCenter.register(battleStatisticEvent.OPEN_STATISTIC_VIEW, this, this._openStatisticView);
    }

    private _init() {
        this._curMsgSeq = -1;
        this._roundCount += 1;
        this._buffMap = this._buffMap || new Map();
        this._buffMap.clear();
        this._selfTeam = utils.deepCopy(battleUIData.getSelfTeam());
        Reflect.setPrototypeOf(this._selfTeam, UITeam.prototype);
        this._selfTeam.roles.forEach(ele => {
            Reflect.setPrototypeOf(ele, UIRole.prototype);
        });
        this._enemyTeam = utils.deepCopy(battleUIData.getOppositeTeam());
        Reflect.setPrototypeOf(this._enemyTeam, UITeam.prototype);
        this._enemyTeam.roles.forEach(ele => {
            Reflect.setPrototypeOf(ele, UIRole.prototype);
        });
        Reflect.setPrototypeOf(this._enemyTeam, UITeam.prototype);
        let statisticItems = ['hurtSts', 'attackedSts', 'addBloodSts', 'addedBloodSts', 'killSts'];
        let selfTeam = this._selfTeam;
        selfTeam.roles.forEach((ele, idx) => {
            if(!this._selfSts.has(ele.roleId)){
                this._selfSts.set(ele.roleId, {roleID: ele.roleId});
                let data: any = this._selfSts.get(ele.roleId);
                statisticItems.forEach(ele1 => {
                  data[ele1] = data[ele1] || {count: 0, detail: []};
                });
            }
        });

        let enemyTeam =  this._enemyTeam;
        enemyTeam.roles.forEach((ele, idx) => {
            if(!this._enemySts.has(ele.roleId)){
                this._enemySts.set(ele.roleId, {roleID: ele.roleId});
                let data: any = this._enemySts.get(ele.roleId);
                statisticItems.forEach(ele1 => {
                  data[ele1] = data[ele1] || {count: 0, detail: []};
                });
            }
        });
    }

    private _processBTStartMsg(event: number, msg: gamesvr.IBattleStartResult, msgSeq: number){
        if(!guiManager.isDebug) return;

        this._init();
        if(msg && msg.Results && msg.Results.length > 0) {
            this._processEffects(msg.Results, msgSeq);
        }
        this._isBattleMore && scheduleManager.scheduleOnce(() => {
            battleUIOpt.finishCurrMsg(msgSeq);
        }, 0);
    }

    private _processBtRoundStart(event: number, msg: gamesvr.IRoundResult, msgSeq: number){
        if(!guiManager.isDebug) return;

        if(msg.RoundStartRes && msg.RoundStartRes.length > 0) {
            this._processEffects(msg.RoundStartRes, msgSeq);
        }

        if(msg.ActionRes && msg.ActionRes.length > 0) {
            this._processEffects(msg.ActionRes, msgSeq);
        }

        if(msg.RoundEndRes && msg.RoundEndRes.length > 0) {
            this._processEffects(msg.RoundEndRes, msgSeq);
        }

        this._isBattleMore && scheduleManager.scheduleOnce(() => {
            battleUIOpt.finishCurrMsg(msgSeq);
        }, 0);
    }

    private _processBTEndMsg(event: number, msg: gamesvr.IBattleEndResult, msgSeq: number){
        if(!guiManager.isDebug) return;

        if(msg.Results || msg.Results.length > 0) {
            this._processEffects(msg.Results, msgSeq);
        }

        // 胜负和剩余血量统计
        let idx = msg.Win ? 0 : 1;
        this._roundResult[idx] += 1;
        this._selfSts.forEach((value, key) => {
            value.surplusHp = value.surplusHp || [];
            let role = this._getRoleByID(this._selfTeam, key);
            if(!role) return;
            value.surplusHp.push(role.hp);
        });
        this._enemySts.forEach((value, key) => {
            value.surplusHp = value.surplusHp || [];
            let role = this._getRoleByID(this._enemyTeam, key);
            if(!role) return;
            value.surplusHp.push(role.hp);
        });

        // 多局战斗进行下一场
        if(this.isBattleMore && this._maxRoundCount > this._roundCount){
            battleUIOpt.clear();
            battleUIData.clear();
            this._battleStatisticView && this._battleStatisticView.startBattle();
            return;
        }

        if(!this.isBattleMore) return;
        this._openStatisticView();
    }

    private _processEffects(results: gamesvr.IResult[], msgSeq: number) {
        if(!results || results.length == 0) return;

        if(msgSeq != this._curMsgSeq) {
            // 切换上下文
        }

        results.forEach(ele => {
            // 血量/护盾变化
            if(ele.HPResult) {
                this._processEffectHPResult(ele);
                return;
            }

            // 释放技能、普攻
            if(ele.SkillLightResult) {
                return;
            }

            // 触发buff
            if(ele.BuffLightResult) {
                return;
            }

            // 触发teamBuff
            if(ele.TeamBuffLightResult) {
                return;
            }

            // 触发光环
            if(ele.HaloLightResult) {
                return;
            }

            // 加/减buff
            if(ele.BuffResult) {
                this._processEffectBuffResult(ele);
                return;
            }

            // 加/减teamBuff
            if(ele.TeamBuffResult) {
                this._processEffectTeamBuffResult(ele);
                return;
            }

            // 加/减光环
            if(ele.HaloResult) {
                this._processEffectHaloResult(ele);
                return;
            }

            // 角色死亡
            if(ele.RoleDeadResult) {
                this._processEffectDeadResult(ele);
                return;
            }
        });
    }

    private _processEffectBuffResult(data: gamesvr.IResult) {
        if(!data || !data.BuffResult) return;

        let result = data.BuffResult;
        if (!this._buffMap.has(result.BuffUID)) {
            this._buffMap.set(result.BuffUID, {
                type: BuffType.Buff,
                Uid: result.BuffUID,
                cnt: result.Count,
                role: result.RoleUID,
                from: data.From,
                ID: result.BuffID,
                itemID: data.ItemID
            });
        } else {
            let buff = this._buffMap.get(result.BuffUID);
            buff.cnt += result.Delta;
        }

        let role = this._getRoleByUid(result.RoleUID);
        if (role) role.updateRoleBuff(result);
    }

    private _processEffectTeamBuffResult(data: gamesvr.IResult) {
        if(!data || !data.TeamBuffResult) return;

        let result = data.TeamBuffResult;
        if (!this._buffMap.has(result.BuffID)) {
            this._buffMap.set(result.BuffID, {
                type: BuffType.TeamBuff,
                Uid: 0,
                cnt: result.Delta,
                role: result.Team || 0,
                from: data.From,
                ID: result.BuffID,
                itemID: data.ItemID
            });
        } else {
            let buff = this._buffMap.get(result.BuffID);
            buff.cnt += result.Delta;
        }
    }

    private _processEffectHaloResult(data: gamesvr.IResult) {
        if(!data || !data.HaloResult) return;

        let result = data.HaloResult;
        if (!this._buffMap.has(result.HaloUID)) {
            this._buffMap.set(result.HaloUID, {
                type: BuffType.Halo,
                Uid: result.HaloUID,
                cnt: result.isAdd ? 1: 0,
                role: result.RoleUID,
                from: data.From,
                ID: result.HaloID,
                itemID: data.ItemID,
                range: result.RangeUid
            });
        } else {
            let halo = this._buffMap.get(result.HaloUID);
            halo.cnt = result.isAdd ? 1: 0;
            halo.range.length = 0;
            result.isAdd && halo.range.push(...result.RangeUid);
        }

        let role = this._getRoleByUid(result.RoleUID);
        if (role) role.updateRoleHalo(result);
        if (result.RangeUid) {
            for (let i = 0; i < result.RangeUid.length; i++) {
                let rUID = result.RangeUid[i];
                if (rUID && rUID != role.uid) {
                    let rangeRole = this._getRoleByUid(rUID);
                    rangeRole.updateRoleHalo(result);
                }
            }
        }
    }

    private _processEffectHPResult(data: gamesvr.IResult) {
        if(!data || !data.HPResult) return;

        let result = data.HPResult;
        let role = this._getRoleByUid(result.RoleUID);
        if(!role) return;
        role.hp = result.HP || 0;
        role.maxHp = result.MaxHP;

        let skillID = data.ItemID;
        let sourceRoleUID = data.From;
        if(skillID == 500001) {
            // 普攻
        } else if(skillID == 500002) {
            // 反击， from是 500002
            sourceRoleUID =  result.HPDetail.RoleUID;
        } else if(skillID == 500003) {
            // 连击
        } else if(skillID == 500004) {
            // 溅射
        } else {
            let skillCfg: cfg.Skill = configUtils.getSkillConfig(skillID);
            if(!skillCfg) {
                // teambuff 造成的伤害, 可能没有from
                let skillInfo = this._getRoleAndSkillByBuffUID(data.From || skillID);
                if(!skillInfo || !skillInfo.roleUID || !skillInfo.skillID ) {
                    console.warn('战斗统计：', '无法确定血量变化原因', result);
                    return;
                }
                sourceRoleUID = skillInfo.roleUID;
                skillID = skillInfo.skillID;
            }
        }

        let sourceRole = this._getRoleByUid(sourceRoleUID);
        // 血量有变化
        if(result.Delta) {
            if(result.Delta > 0) {
                this._addStatisticItem(role.roleId, BattleStatisticType.AddedBlood, {itemType: BTStatisticItemType.Skill, itemID: skillID, delta: result.Delta}, role.roleType == ROLE_TYPE.MONSTER);
                this._addStatisticItem(sourceRole.roleId, BattleStatisticType.AddBlood, {itemType: BTStatisticItemType.Skill, itemID: skillID, delta: result.Delta}, sourceRole.roleType == ROLE_TYPE.MONSTER);
            } else {
                this._addStatisticItem(role.roleId, BattleStatisticType.Attacked, {itemType: BTStatisticItemType.Skill, itemID: skillID, delta: result.Delta}, role.roleType == ROLE_TYPE.MONSTER);
                this._addStatisticItem(sourceRole.roleId, BattleStatisticType.Hurt, {itemType: BTStatisticItemType.Skill, itemID: skillID, delta: -result.Delta}, sourceRole.roleType == ROLE_TYPE.MONSTER);
            }
        }

        // 护盾有变化
        if(result.DeltaShield) {
            if(result.DeltaShield < 0) {
                this._addStatisticItem(role.roleId, BattleStatisticType.Attacked, {itemType: BTStatisticItemType.Skill, itemID: skillID, delta: result.DeltaShield}, role.roleType == ROLE_TYPE.MONSTER);
                this._addStatisticItem(sourceRole.roleId, BattleStatisticType.Hurt, {itemType: BTStatisticItemType.Skill, itemID: skillID, delta: -result.DeltaShield}, sourceRole.roleType == ROLE_TYPE.MONSTER);
            }
        }
    }

    private _processEffectDeadResult(data: gamesvr.IResult) {
        if(!data || !data.RoleDeadResult || data.RoleDeadResult.RoleState != gamesvr.RoleState.Dead) return;

        let result = data.RoleDeadResult;
        let beKiller = this._getRoleByUid(result.RoleUID);
        let skillID = data.ItemID;
        let skillType = BTStatisticItemType.Skill;
        let killer: UIRole = null;
        if(skillID == 500001 ) {
            data.From && (killer = this._getRoleByUid(data.From));
        } else if(skillID == 500002) {
            data.From && (killer = this._getRoleByUid(data.From));
        } else if(skillID == 500003) {
            data.From && (killer = this._getRoleByUid(data.From));
        } else if(skillID == 500004) {
            data.From && (killer = this._getRoleByUid(data.From));
        } else if(configUtils.getSkillConfig(skillID)) {
            data.From && (killer = this._getRoleByUid(data.From));
        } else {
            let skillInfo = this._getRoleAndSkillByBuffUID(data.From || skillID);
            skillInfo && (killer = this._getRoleByUid(skillInfo.roleUID));
        }

        if(!killer) {
            console.warn('战斗统计：', '无法确定被谁杀死的', data);
            return;
        }

        this._addStatisticItem(killer.roleId, BattleStatisticType.Kill, {itemType: BTStatisticItemType.Skill, itemID: skillID, delta: 1, beKillID: beKiller.roleId}, killer.roleType == ROLE_TYPE.MONSTER);
    }

    private _getRoleAndSkillByBuffUID(buffUid: number): {roleUID?: number, skillID?: number} {
        let result: {roleUID?: number, skillID?: number} = {};
        if(!this._buffMap || this._buffMap.size == 0 || !this._buffMap.has(buffUid)) return result;

        let buffInfo = this._buffMap.get(buffUid);
        if(this._buffMap.has(buffInfo.from)) {
            return this._getRoleAndSkillByBuffUID(buffInfo.from);
        }

        let role = this._getRoleByUid(buffInfo.from);
        let skillInfo = configUtils.getSkillConfig(buffInfo.itemID);
        if(role && skillInfo) {
            result.roleUID = buffInfo.from;
            result.skillID = buffInfo.itemID;
            return result;
        }
        console.warn('战斗统计：', '找不到buff的来源，buffUid:', buffUid);
        return result;
    }

    private _openStatisticView() {
        if(!guiManager.isDebug) return;
        if(cc.isValid(this._battleStatisticView)){
            this._battleStatisticView.setDataSource(this._selfSts, this._enemySts, this._roundCount, this._roundResult);
            this._isBattleMore = false;
        }else{
          this._isBattleMore = false;

          guiManager.loadModuleView('BattleStatisticView', this._selfSts, this._enemySts, this._roundCount, this._roundResult);
        }
    }

    private _addStatisticItem(roleID: number, statisticType: BattleStatisticType, statisticSubItem: BTStatisticSubItem|BTKillStatisticSubItem, isEnemy: boolean){
        if(!statisticSubItem) return;
        let map = isEnemy ? this._enemySts : this._selfSts;
        let roleStatistic: any  = null;
        if(!map.has(roleID)){
            map.set(roleID, {roleID: roleID});
        }
        roleStatistic = map.get(roleID);
        let stsKey:string  = null;
        switch (statisticType) {
          case BattleStatisticType.Hurt:
            stsKey = 'hurtSts';
            break;
          case BattleStatisticType.Attacked:
            stsKey = 'attackedSts';
            break;
          case BattleStatisticType.AddBlood:
            stsKey = 'addBloodSts';
            break;
          case BattleStatisticType.AddedBlood:
            stsKey = 'addedBloodSts';
            break;
          case BattleStatisticType.Kill:
            stsKey = 'killSts';
            break;
          default:
            break;
        }
        if(!stsKey) return;
        roleStatistic[stsKey] = roleStatistic[stsKey] || {count: 0, detail: []};
        roleStatistic[stsKey].count += statisticSubItem.delta;
        roleStatistic[stsKey].detail.push(statisticSubItem);
    }
}
let battleStatisticor = new BattleStatisticor();
export {
  battleStatisticor,
  RoleStatistic
}
