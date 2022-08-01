import { ROLE_TYPE, TEAM_TYPE } from "../../app/AppEnums";
import { dataManager } from "../data-manager/DataManager";
import BTBaseRole from "../data-template/BTBaseRole";
import Team from "../data-template/Team";

export default class BattleOpt {

    init () {

    }

    deInit () {
        
    }
    
    initBattleBegin (heros: number[], monsters: number[]) {
        dataManager.battleData.clear();

        this.addOndTeam(heros, TEAM_TYPE.SELF);
        this.addOndTeam(monsters, TEAM_TYPE.OPPOSITE, 0);
    }

    addOndTeam (roleIds: number[], type: TEAM_TYPE, groupId?: number) {
        let team = new Team();
        team.type = type;
        roleIds.forEach( (_rId, _idx) =>{
            if (_rId) team.addOneRole(_rId, _idx);
        })
        if (groupId) team.groupId = groupId;
        dataManager.battleData.addOneTeam(team);
    }

    changeRoleHp (target: number, changV: number): number {
        if (changV == 0) return 0;

        let role = dataManager.battleData.getRoleByUid(target);
        if (!role) return 0;

        let realChangeV = 0;
    
        let originHp = role.hp;
        if (Math.abs(changV) >= 1) {
            role.hp += changV;
        }

        if (role.hp < 0) role.hp = 0;
        if (role.hp > role.maxHp) role.hp = role.maxHp;

        realChangeV = role.hp - originHp;
        return realChangeV;
    }

    changeRolePower (target: number, changV: number): number {
        if (changV == 0) return 0;

        let role = dataManager.battleData.getRoleByUid(target);
        if (!role) return 0;

        let realChangeV = 0;
    
        let origin = role.power;
        role.power += changV;

        if (role.power < 0) role.power = 0;
        if (role.power > role.maxPower) role.power = role.maxPower;

        realChangeV = role.power - origin;
        return realChangeV;
    }

    findDefaultTarget (user: BTBaseRole) {
        let selfPos = user.pos;

        let oppoTeam = user.roleType == ROLE_TYPE.HERO? dataManager.battleData.getOppositeTeam():dataManager.battleData.getSelfTeam()
        let roles = oppoTeam.roles;

        const maxRole = 5;
        let validRole: BTBaseRole = null;
        for (let intv = 0; intv < maxRole; intv++) {
            let currPos = selfPos + intv;
            let findRole = oppoTeam.getRoleByPos(currPos);
            if ( !findRole || !findRole.isAlive()) {
                currPos = selfPos - intv;
                findRole = oppoTeam.getRoleByPos(currPos);
            }

            if (findRole && findRole.isAlive()) {
                validRole = findRole;
                break;
            }
        }
        return validRole
    }


}