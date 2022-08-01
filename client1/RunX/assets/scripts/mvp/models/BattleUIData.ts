import { BTResult, ROLE_STATE, TEAM_TYPE } from "../../app/BattleConst";
import { gamesvr } from "../../network/lib/protocol";
import UIRole from "../template/UIRole";
import UITeam from "../template/UITeam";
import BaseModel from "./BaseModel";

class BattleUIData extends BaseModel {

    private _roundIdx: number = 0;
    private _teams: UITeam[] = [];
    private _playDeadList: number[] = [];
    private _teamPowers: number[] = [];
    private _rawRes: gamesvr.IEnterBattleResult = {};
    
    get rawRes () {
        return this._rawRes;
    }

    get isBattle(): boolean {
        return !!(this._rawRes && this._rawRes.BattleStartRes && this._rawRes.BattleEndRes)
    }

    init () {
        this.clear();
    }

    deInit () {

    }

    clear () {
        this._roundIdx = 0;
        this._teams = [];
        this.clearPlayDeadList();
    }

    get playDeadList() {
        return this._playDeadList;
    }

    get isBattleValid () {
        return 
    }

    battleBegin () {
        this.clear();
    }

    battleEnd () {
        this._teamPowers = [];
        this._rawRes = {}
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

    isRoleInSelfTeam(uid: number): boolean{
        return !!this.getSelfTeam().getRoleByUid(uid);
    }

    getRoleByRoleId (roleId: number): UIRole {
        let findRole: UIRole = null;
        this._teams.forEach( _team => {
            _team.roles.forEach( _r=> {
                if (_r.roleId == roleId) 
                    findRole = _r;
            })
        })
        return findRole;
    }

    getTeamByRoleUid (roleUid: number) {
        for (let i = 0; i < this._teams.length; i++) {
            let roles = this._teams[i].roles;
            for (let j = 0; j < roles.length; j++) {
                if (roles[j].uid == roleUid)
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

    getRoleByBuffUid(buffUid: number): UIRole {
        let findRole: UIRole = null;
        this._teams.forEach( _team => {
            _team.roles.forEach(_r => {
                if(_r.getBuff(buffUid)) {
                    findRole = _r;
                }
            });
        })
        return findRole;
    }

    getRoleByHaloUid(haloUid: number): UIRole {
        let findRole: UIRole = null;
        this._teams.forEach( _team => {
            _team.roles.forEach(_r => {
                if(_r.getHalo(haloUid)) {
                    findRole = _r;
                }
            });
        })
        return findRole;
    }

    get teams () {
        return this._teams;
    }

    updateResultData (resultData: BTResult) {
        switch (resultData.ResultType) {
            case gamesvr.ResultType.RTPowerResult:
                this._updatePower(resultData.PowerResult);
                break;
            case gamesvr.ResultType.RTHPResult:
                this._updateHp(resultData.HPResult);
                break;
            case gamesvr.ResultType.RTBuffResult:
                this._updateBuff(resultData.BuffResult);
                break;
            case gamesvr.ResultType.RTHaloResult:
                this._updateHalo(resultData.HaloResult);
                break;
            case gamesvr.ResultType.RTRoleDeadResult:
                this._updateState(resultData.RoleDeadResult.RoleUID, resultData.RoleDeadResult.RoleState);
                break;
            default:
                break;
        }
    }

    
    private _updatePower (result: gamesvr.IPowerResult) {
        if (!result) return;

        let role = this.getRoleByUid(result.RoleUID);
        if (role) {
            role.power = result.Delta + role.power >= role.maxPower ? role.maxPower : (result.Delta + role.power <= 0 ? 0 : result.Delta + role.power);
        }
    }

    private _updateState (roleUid: number, state: number) {
        let role = this.getRoleByUid(roleUid);
        if (role) role.state = state;
    }

    private _updateHp (result: gamesvr.IHPResult) {
        if (!result) return;

        let role = this.getRoleByUid(result.RoleUID);
        if(!role) return;
        role.hp = result.HP || 0;
        role.maxHp = result.MaxHP;
    }

    private _updateBuff (result: gamesvr.IBuffResult) {
        if (!result) return;

        let role = this.getRoleByUid(result.RoleUID);
        if (role) role.updateRoleBuff(result);
    }

    private _updateHalo (result: gamesvr.IHaloResult) {
        if (!result) return;

        let role = this.getRoleByUid(result.RoleUID);
        if (role) role.updateRoleHalo(result);
        if (result.RangeUid) {
            for (let i = 0; i < result.RangeUid.length; i++) {
                let rUID = result.RangeUid[i];
                if (rUID && rUID != role.uid) {
                    let rangeRole = this.getRoleByUid(rUID);
                    rangeRole.updateRoleHalo(result);
                }
            }
        } 
    }

    addDeadUid(uId: number) {
        if(this._playDeadList.indexOf(uId) == -1) {
            this._playDeadList.push(uId);
        }
    }

    clearPlayDeadList() {
        this._playDeadList = [];
    }

    setTeamPower (powers: number[]) {
        this._teamPowers = powers;
    }

    getTeamPower () {
        return this._teamPowers;
    }

    setRawResultRes (res: gamesvr.IEnterBattleResult) {
        this._rawRes = res;
    }
}

let battleUIData = new BattleUIData();
export {battleUIData}