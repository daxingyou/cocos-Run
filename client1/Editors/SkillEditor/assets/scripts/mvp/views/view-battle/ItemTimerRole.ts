import { CLOCK_INTERVAL, CLOCK_LEN } from "../../../app/AppConst";
import { ROLE_TYPE, TIMER_STATE } from "../../../app/AppEnums";
import { configUtils } from "../../../app/ConfigUtils";
import { RoleTimer } from "../../../game/CSInterface";
import { modelManager } from "../../models/ModeManager";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemTimerRole extends cc.Component {

    @property(cc.Label)         lbName:cc.Label = null;
    @property(cc.Sprite)        sprHead:cc.Sprite = null;
    @property(cc.SpriteFrame)   sprfsHead:cc.SpriteFrame[] = [];

    private _info: RoleTimer = null;
    private _distance: number = 0;

    onInit (info: RoleTimer) {
        this._info = info;
        this._distance = 0;
        let role = modelManager.battleUIData.getRoleByUid(this._info.roleUid);
        let cfg = role.roleType == ROLE_TYPE.MONSTER? configUtils.getMonsterConfig(role.roleId) : configUtils.getHeroConfig(role.roleId) 
        if (cfg) {
            this.lbName.string = cfg.Name;
            this.sprHead.spriteFrame = role.roleType == ROLE_TYPE.MONSTER? this.sprfsHead[0]:this.sprfsHead[1];
        }
    }

    deInit () {
        
    }

    get uId () {
        return this._info.roleUid;
    }

    updateInfo (info: RoleTimer) {
        this._info = info;
    }

    setDistance (dValue: number) {
        this.node.x = dValue;
    }

    autoMove (uiLength: number) {
        if (this._info.state == TIMER_STATE.MOVING) {
            let speed = this._info.currSpeed *  uiLength / CLOCK_LEN;
            let speedFrame = speed /(cc.game.getFrameRate() * CLOCK_INTERVAL / 1000);
            let final = this.node.x + speedFrame;
            if (final > uiLength) final = uiLength;
            this.node.x = final;
        }
    }


}