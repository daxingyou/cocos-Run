import { ResultType, TEAM_TYPE } from "../../app/AppEnums";
import { BuffResult, HPResult, PowerResult, ResultData } from "../../game/CSInterface";
import UIRole from "../template/UIRole";
import UITeam from "../template/UITeam";

export default class BattleUIData {

    private _roundIdx: number = 0;
    private _teams: UITeam[] = [];

    init () {
        this.clear();
    }

    clear () {
        this._roundIdx = 0;
        this._teams = [];
    }

    battleBegin () {
        this.clear();
    }

    addOneTeam (team: UITeam) {
        this._teams.push(team);
    }

    getRoleByUid (uid: number) {
        let findRole: UIRole = null;
        this._teams.forEach( _team => {
            _team.roles.forEach( _r=> {
                if (_r.uid == uid) 
                    findRole = _r;
            })
        })
        return findRole;
    }

    getTeamByRoleUid (roleUid: number) {
        for (let i = 0; i < this._teams.length; i++) {
            let roles = this._teams[i].roles;
            for (let i = 0; i < roles.length; i++) {
                if (roles[i].uid == roleUid)
                    return this._teams[i];
            }
        }
        return null;
    }

    getSelfTeam () {
        for (let i = 0; i < this._teams.length; i++) {
            if (this._teams[i].type == TEAM_TYPE.SELF) {
                return this._teams[i];
            }
        }
        return null;
    }

    getOppositeTeam () {
        for (let i = 0; i < this._teams.length; i++) {
            if (this._teams[i].type != TEAM_TYPE.SELF) {
                return this._teams[i];
            }
        }
        return null;
    }

    get teams () {
        return this._teams;
    }

    updateResultData (resultData: ResultData) {
        switch (resultData.ResultType) {
            case ResultType.RTChangePower:
                this._updatePower(resultData.PowerResult);
                break;
            case ResultType.RTHPResult:
                this._updateHp(resultData.HPResult);
                break;
            case ResultType.RTBuffCntChange:
                this._updateBuff(resultData.BuffResult);
                break;
            case ResultType.RTChangePower:
                this._updatePower(resultData.PowerResult);
                break;
            default:
                break;
        }
    }

    
    private _updatePower (result: PowerResult) {
        if (!result) return;

        let role = this.getRoleByUid(result.RoleUID);
        role.power = result.Power;
    }

    private _updateHp (result: HPResult) {
        if (!result) return;

        let role = this.getRoleByUid(result.RoleUID);
        if (result.HP)
            role.hp = result.HP;
         
        if (result.MaxHP)
            role.maxHp = result.MaxHP;
    }

    private _updateBuff (result: BuffResult) {
        if (!result) return;
         
        let role = this.getRoleByUid(result.RoleId);
        if (role) {
            role.updateRoleBuff(result);
        }
    }


}