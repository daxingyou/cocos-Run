import { ROLE_TYPE, TEAM_TYPE } from "../../app/AppEnums";
import BTBaseRole from "./BTBaseRole";
import Hero from "./Hero";
import Monster from "./Monster";

export default class Team {

    private _roles: BTBaseRole[] = [];
    private _type: TEAM_TYPE;
    private _teamId: number = -1;

    constructor () {
        
    }

    init () {
        this._roles = [];
    }

    clear () {
        this._roles = [];
    }

    addOneRole (roleId: number, idx: number) {
        if (this._type == TEAM_TYPE.OPPOSITE) {
            let monster = new Monster(roleId, idx)
            this._roles.push(monster);
        } else {
            let hero = new Hero(roleId, idx)
            this._roles.push(hero);
        }
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
            if (this._roles[i].roleUID == uid) {
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