import { ROLE_TYPE, TEAM_TYPE } from "../../app/BattleConst";
import { gamesvr } from "../../network/lib/protocol";
import UIRole from "./UIRole";

export default class UITeam {

    private _roles: UIRole[] = [];
    private _type: TEAM_TYPE;

    init () {
        this._roles = [];
    }

    clear () {
        this._roles = [];
    }

    setTeam (team: gamesvr.ITeam, type: TEAM_TYPE) {
        this._roles = [];
        this._type = type;
        team.Roles.forEach( _r => {
            let role = new UIRole(_r, type == TEAM_TYPE.SELF? ROLE_TYPE.HERO:ROLE_TYPE.MONSTER);
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

}