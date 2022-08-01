
import { TARGET_TYPE, ROLE_TYPE, EffectType, SkillType, EFFECT_TYPE } from "../../../app/AppEnums";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { Effect } from "../../BattleType";
import { dataManager } from "../../data-manager/DataManager";
import { dataOptManager } from "../../data-operation/DataOperation";
import BTBaseRole from "../../data-template/BTBaseRole";
import Team from "../../data-template/Team";

class SkillManager {

    process (skillId: number, user: number): Effect[]  {
        let result: Effect[] = [];
        let realTarget: BTBaseRole[] = [];

        let userRole = dataManager.battleData.getRoleByUid(user);
        let skillCfg = configUtils.getSkillConfig(skillId);
        realTarget = this._getTargetsFromCfg(userRole, skillCfg.TargetType);

        if (skillCfg && skillCfg.EffectId) {
            result = result.concat(this._getSkillEffect(userRole, skillCfg, realTarget));
        }
        return result;
    }

    private _getSkillEffect (user: BTBaseRole, skillCfg: any, realTargets?: BTBaseRole[]): Effect[] {
        let effectIdStr: string = skillCfg.EffectId;
        let targetType = skillCfg.TargetType;

        let effects: Effect[] = [];
        let effectIds: number[] = effectIdStr.split("|").map( (_str) => {return parseInt(_str)});
        effectIds.forEach( (_id, seq) => {
            effects.push({
                effectId: _id,
                targetType: targetType, 
                realTargets: realTargets.map( _t => { return _t.roleUID}),
                // or
                effectType: EFFECT_TYPE.SKILL,
                seq: seq,
                // sourceId: skillCfg.SkillId
            })
        })

        return effects;
    }


    // ============ 下面是非具体效果接口 =================================================================

    // 如果是随机类型的话，先把【具体目标】随机出来并传递下去，否则直接把【目标类型】传递到效果
    private _getTargetsFromCfg (user: BTBaseRole, targetType: TARGET_TYPE): BTBaseRole[] {
        let target: BTBaseRole[] = [];
        let selfTeam: Team = null;
        let oppositeTeam: Team = null;

        if (user.roleType == ROLE_TYPE.HERO) {
            selfTeam = dataManager.battleData.getSelfTeam();
            oppositeTeam = dataManager.battleData.getOppositeTeam();
        } else {
            oppositeTeam  = dataManager.battleData.getSelfTeam();
            selfTeam = dataManager.battleData.getOppositeTeam();
        }

        switch (targetType) {
            case TARGET_TYPE.RANDOM_SELF_1: {
                let mateRoles = selfTeam.roles.filter( _r => {return _r.roleUID != user.roleUID});
                if (mateRoles.length <= 1) {
                    target = mateRoles;
                } else {
                    let random = utils.getRandomInt(mateRoles.length);
                    let targetRandom = mateRoles[random];
                    if (targetRandom) {
                        target = [targetRandom];
                    }
                }
                break;
            }
            case TARGET_TYPE.RANDOM_SELF_2: {
                let mateRoles = selfTeam.roles.filter( _r => {return _r.roleUID != user.roleUID});
                if (mateRoles.length <= 2) {
                    target = mateRoles;
                } else {
                    let cnt = 0;
                    while (target.length < 2 && cnt < 10) {
                        let random = utils.getRandomInt(mateRoles.length);
                        let targetRandom = mateRoles[random];
                        if (targetRandom) {
                            target.push(targetRandom);
                            mateRoles = mateRoles.filter( _r => {return _r != targetRandom});
                        }
                        cnt++;
                    }
                }
                break;
            } case TARGET_TYPE.RANDOM_ENEMY_1: {
                let enemys = oppositeTeam.roles;
                if (enemys.length <= 1) {
                    target = enemys;
                } else {
                    let random = utils.getRandomInt(enemys.length);
                    let targetRandom = enemys[random];
                    if (targetRandom) {
                        target = [targetRandom];
                    }
                }
                break;
            } case TARGET_TYPE.RANDOM_ENEMY_2: {
                let enemys = oppositeTeam.roles;
                if (enemys.length <= 2) {
                    target = enemys;
                } else {
                    let cnt = 0;
                    while (target.length < 2 && cnt < 10) {
                        let random = utils.getRandomInt(enemys.length);
                        let targetRandom = enemys[random];
                        if (targetRandom) {
                            target.push(targetRandom);
                            enemys = enemys.filter( _r => {return _r != targetRandom});
                        }
                        cnt++;
                    }
                }
                break;
            } case TARGET_TYPE.RANDOM_ENEMY_3: {
                let enemys = oppositeTeam.roles;
                if (enemys.length <= 3) {
                    target = enemys;
                } else {
                    let cnt = 0;
                    while (target.length < 3 && cnt < 10) {
                        let random = utils.getRandomInt(enemys.length);
                        let targetRandom = enemys[random];
                        if (targetRandom) {
                            target.push(targetRandom);
                            enemys = enemys.filter( _r => {return _r != targetRandom});
                        }
                        cnt++;
                    }
                }
                break;
            } case TARGET_TYPE.RANDOM_1: {
                let all = selfTeam.roles.concat(oppositeTeam.roles).filter( _r => {return _r.roleUID != user.roleUID});
                if (all.length <= 1) {
                    target = all;
                } else {
                    let random = utils.getRandomInt(all.length);
                    let targetRandom = all[random];
                    if (targetRandom) {
                        target = [targetRandom];
                    }
                }
                break;
            } case TARGET_TYPE.RANDOM_ENEMY_ALL: {
                let defTarget = dataOptManager.battleOpt.findDefaultTarget(user);
                target.push(defTarget);
                let enemys = oppositeTeam.roles.filter( (_r)=> { return _r.roleUID != defTarget.roleUID && _r.hp});
                if (enemys.length) {
                    let cnt = 0;
                    while (enemys.length && cnt < 10) {
                        let random = utils.getRandomInt(enemys.length);
                        let targetRandom = enemys[random];
                        if (targetRandom) {
                            target.push(targetRandom);
                            enemys = enemys.filter( _r => {return _r != targetRandom});
                        }
                        cnt++;
                    }
                }
                break;
            }
            default: { break; }
        }
        return target;
    }

}

let skillManager = new SkillManager();
export {skillManager}


