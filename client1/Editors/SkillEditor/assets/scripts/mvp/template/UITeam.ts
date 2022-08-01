import { TEAM_TYPE } from "../../app/AppEnums";
import { RoleData, TeamData } from "../../game/CSInterface";
import UIRole from "./UIRole";

export default class UITeam {

    private _roles: UIRole[] = [];
    private _type: TEAM_TYPE;
    private _teamId: number = -1;

    init () {
        this._roles = [];
    }

    clear () {
        this._roles = [];
    }

    addOneRole (role: RoleData) {
        let uiRole = new UIRole(role)
        this._roles.push(uiRole);
    }

    updateTeamData (team: TeamData) {
        this._roles = [];
        this._teamId = team.GroupId;
        this._type = team.TeamType;
        team.Roles.forEach( _r => {
            let role = new UIRole(_r);
            this._roles.push(role)
        })
    }

    getRoleByPos (pos: number) {
        if (pos < 0) {
            return null;
        }
        for (let i = 0; i < this._roles.length; i++) {
            if (this._roles[i].pos == pos) {
                return this._roles[i];
            }
        }
        return null;
    }
    
    getRoleByUid (uid: number) {
        for (let i = 0; i < this._roles.length; i++) {
            if (this._roles[i].uid == uid) {
                return this._roles[i];
            }
        }
        return null;
    }

    get roles () {
        return this._roles;
    }

    set type (type: TEAM_TYPE) {
        this._type = type;
    }

    get type () {
        return this._type;
    }

    set groupId (v: number) {
        this._teamId = v;
    }

    get groupId () {
        return this._teamId;
    }
    
}