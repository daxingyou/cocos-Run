import { ROLE_TYPE, TEAM_TYPE } from "../../app/AppEnums";
import BTBaseRole from "../data-template/BTBaseRole";
import Team from "../data-template/Team";

export default class BattleData {

    private _roundIdx: number = 0;
    private _teams: Team[] = [];

    init () {
        this._roundIdx = 0;
    }

    clear () {
        this._roundIdx = 0;
        this._teams = [];
    }

    addOneTeam (team: Team) {
        this._teams.push(team);
    }

    getRoleByUid (uid: number) {
        let findRole: BTBaseRole = null;
        this._teams.forEach( _team => {
            _team.roles.forEach( _r=> {
                if (_r.roleUID == uid) 
                    findRole = _r;
            })
        })
        return findRole;
    }

    getTeamByRoleUid (roleUid: number) {
        for (let i = 0; i < this._teams.length; i++) {
            let roles = this._teams[i].roles;
            for (let j = 0; j < roles.length; j++) {
                if (roles[j].roleUID == roleUid)
                    return this._teams[i];
            }
        }
        return null;
    }

    getSelfTeam (selfTeam = TEAM_TYPE.SELF) {
        for (let i = 0; i < this._teams.length; i++) {
            if (this._teams[i].type == selfTeam) {
                return this._teams[i];
            }
        }
        return null;
    }

    getSelfTeamByRoleType (roleType = ROLE_TYPE.HERO) {
        if (roleType == ROLE_TYPE.HERO)
            return this.getSelfTeam(TEAM_TYPE.SELF)
        else 
            return this.getSelfTeam(TEAM_TYPE.OPPOSITE)
    }

    getOppoTeamByRoleType (roleType = ROLE_TYPE.HERO) {
        if (roleType == ROLE_TYPE.HERO)
            return this.getOppositeTeam(TEAM_TYPE.SELF)
        else 
            return this.getOppositeTeam(TEAM_TYPE.OPPOSITE)
    }

    getOppositeTeam (selfTeam = TEAM_TYPE.SELF): Team {
        for (let i = 0; i < this._teams.length; i++) {
            if (this._teams[i].type != selfTeam) {
                return this._teams[i];
            }
        }
        return null;
    }

    get teams () {
        return this._teams;
    }

    get roundIdx () {
        return this._roundIdx;
    }

    set roundIdx (v: number) {
        this._roundIdx = v;
    }

    checkInSameTeam (uid1: number, uid2: number): boolean {
        if (!uid1 || !uid2) return false;

        let team1 = this.getTeamByRoleUid(uid1);
        let team2 = this.getTeamByRoleUid(uid2);
        return team1.type == team2.type;
    }
}