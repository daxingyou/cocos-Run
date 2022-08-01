import { EFFECT_TYPE, ROLE_TYPE, TARGET_TYPE, TIME_TRIGGER } from "../../../../app/AppEnums";
import { configUtils } from "../../../../app/ConfigUtils";
import { AttackProperty, AttackResultHelper, BattleInfo, DirectEffect, Effect, EffectItem, OneActionInfo } from "../../../BattleType";
import { ResultData } from "../../../CSInterface";
import { dataManager } from "../../../data-manager/DataManager";
import { dataOptManager } from "../../../data-operation/DataOperation";
import BTBaseRole from "../../../data-template/BTBaseRole";
import { gameControl } from "../../../GameControl";
import { computeMiss, compluteAttack, getAttackResult, getHpResult } from "../EffectUtils";

export default class ProcessBase {

    init () {
        
    }

    process (data: Effect, user: BTBaseRole, currAction: OneActionInfo, battleInfo: BattleInfo): ResultData[] {
        return [];
    }

    processDirect (data: Effect, user: BTBaseRole, currAction: OneActionInfo, directEffect: DirectEffect) {
    }

    protected _getTarget (user: BTBaseRole, itemInfo: EffectItem, realTarget: number[] = [], target: TARGET_TYPE = TARGET_TYPE.INVALID): BTBaseRole[] {
        let monsterTeam = dataManager.battleData.getOppositeTeam();
        let heroTeam = dataManager.battleData.getSelfTeam();

        let oppoTeam = user.roleType == ROLE_TYPE.MONSTER? heroTeam:monsterTeam;
        let selfTeam = user.roleType == ROLE_TYPE.MONSTER? monsterTeam:heroTeam;
        let targets: BTBaseRole[] = [];
        

        let itemId = itemInfo.itemId;
        let cfg = configUtils.getConfig(itemInfo.type, itemId);
        let mainTarget = cfg? cfg.TargetType:TARGET_TYPE.DEFAULT;

        const findTarget = (t: TARGET_TYPE, mainTargets: number[] = []) => {
            let find: BTBaseRole[] = [];
            if (mainTargets && mainTargets.length) {
                targets = [];
                realTarget.forEach( _uId => {
                    targets.push(dataManager.battleData.getRoleByUid(_uId));
                })
                return targets;
            }

            switch(t) {
                case TARGET_TYPE.INVALID:       { find = findTarget(mainTarget, realTarget); break; }
                case TARGET_TYPE.SELF:          { find = [user]; break; }
                case TARGET_TYPE.ALL_SELF:      { find = selfTeam.roles; break; }
                case TARGET_TYPE.ALL_ENEMY:     { find = oppoTeam.roles; break; }
                case TARGET_TYPE.ALL:           { find = selfTeam.roles; break;}
                case TARGET_TYPE.SELF_AROUND:   {
                    let pos = user.pos;
                    find.push(user);
                    let around1 = selfTeam.getRoleByPos(pos + 1);
                    around1 && find.push(around1);

                    let around2 = selfTeam.getRoleByPos(pos - 1);
                    around2 && find.push(around2);
                    break;
                }
                case TARGET_TYPE.DEFAULT: {
                    let defaultTarget = dataOptManager.battleOpt.findDefaultTarget(user)
                    defaultTarget && find.push(defaultTarget);
                    break;
                }
                
                // 如果默认目标死了，按照新的有效目标去算范围，和光环不一样
                case TARGET_TYPE.DEFAULT_AROUND: {
                    let defaultTarget = dataOptManager.battleOpt.findDefaultTarget(user)
                    defaultTarget && find.push(defaultTarget);

                    let pos = user.pos;
                    find.push(user);
                    let around1 = selfTeam.getRoleByPos(pos + 1);
                    around1 && find.push(around1);

                    let around2 = selfTeam.getRoleByPos(pos - 1);
                    around2 && find.push(around2);

                    break;
                }
                default: { 
                    break; 
                }
            }
            return find;
        }
        targets = findTarget(target).filter(_r=> { return _r.hp });
    
        return targets;
    }

    protected _compluteAttackResult (user: BTBaseRole, allTarget: BTBaseRole[], effProp: AttackProperty, effRes: ResultData[]) {
        let attackResults: AttackResultHelper[] = [];

        // 由于效果而导致
        let roleProp: AttackProperty = {effectType: EFFECT_TYPE.INVALID};
        roleProp.userAttribute = user.getTotalProp();

        allTarget.forEach( _t => {

            let realTarget = _t;
            let directEffect: DirectEffect = {};
            gameControl.battleLogic.setTimePointDirect(TIME_TRIGGER.ROLE_MAKE_ATTACK, {
                effectType: effProp.effectType,
                currAction: {
                    user: user.roleUID,
                    itemId: effProp.itemId,
                    effectType: effProp.effectType,
                    preAttack: {
                        target: _t.roleUID
                    }
                }
            }, effRes, directEffect);

            if (directEffect.substitution) {
                let substituRoleId = directEffect.substitution.substituRole
                let substituRole = dataManager.battleData.getRoleByUid(substituRoleId);
                if (substituRole)
                    realTarget = substituRole;
            }


            roleProp.targetAttribute = realTarget.getTotalProp();
            let _isMiss = computeMiss(user, realTarget, roleProp, effProp);
            if (!_isMiss) {
                let attackRes = compluteAttack(user, realTarget, roleProp, effProp);

                if (attackRes) {
                    attackResults.push({
                        isMiss: false,
                        target: realTarget,
                        crit: attackRes.isCrit,
                        attack: attackRes.attackValue,
                        rawAttack: attackRes.rawAttack,
                        trueAttack: attackRes.trueAttack,
                        directEffect: directEffect
                    })
                }
            } else {
                attackResults.push({
                    isMiss: true,
                    target: realTarget,
                    directEffect: directEffect
                })
            }
        })
        return attackResults;
    }

    protected _getAttackAndHpResult (attRes: AttackResultHelper[], user: BTBaseRole, item: EffectItem): ResultData[] {
        let result: ResultData[] = [];
        attRes.forEach( attackResult => {
            result.push(getAttackResult(user, item, attackResult));

            let realChange = dataOptManager.battleOpt.changeRoleHp(attackResult.target.roleUID, -attackResult.attack);
            if (realChange) {
                result.push(getHpResult(user, attackResult.target, item, realChange, attackResult));
            }
        });  
        return result;
    }
}