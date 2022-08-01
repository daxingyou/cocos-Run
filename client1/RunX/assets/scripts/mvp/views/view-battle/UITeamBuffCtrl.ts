
import { ROLE_TYPE } from "../../../app/BattleConst";
import { gamesvr } from "../../../network/lib/protocol";
import { battleUIOpt } from "../../operations/BattleUIOpt";
import BattleScene from "../view-scene/BattleScene";
import FriendSkillComp from "../view-scene/FriendSkillComp";


const {ccclass, property} = cc._decorator;

@ccclass
export default class UITeamBuffCtrl extends cc.Component {
    @property(FriendSkillComp) friendCompS: FriendSkillComp = null;// 自己的羁绊
    @property(FriendSkillComp) friendCompE: FriendSkillComp = null;// 地方的羁绊

    private _game: BattleScene = null
    init (root: BattleScene) {
        this._game = root
        // this.node.active = false;
        // eventCenter.register(battleEvent.ROLE_STATE_CHANGE, this, this._updateRoleState);
    }

    deInit () {
        this.friendCompS.deInit();
        this.friendCompE.deInit();
    }

    showTeamBuff (type: ROLE_TYPE, currHero: number[], candidate: number[], needEff: boolean = false) {
        if (type == ROLE_TYPE.HERO) {
            this.friendCompS.show(currHero, candidate, needEff)
        } else {
            this.friendCompE.show(currHero, candidate, needEff)
        }
    }

    updateTeamBuff (msg: gamesvr.ITeamBuffResult) {
        let comp = !msg.Team? this.friendCompS:this.friendCompE
        comp.updateTeamBuff(msg);
    }

    onClickWatchBuff(eventId: number, customEventData: string) {
        let roleType = Number(customEventData);
        if (roleType == ROLE_TYPE.HERO) {
            if (this.friendCompS.canShowSkill()) {
                battleUIOpt.pause()
                this._game.showSubViewInGame('BattleWatchBuffView', roleType, this._game);
            }
        } else if (roleType == ROLE_TYPE.MONSTER) {
            if (this.friendCompE.canShowSkill()) {
                battleUIOpt.pause()
                this._game.showSubViewInGame('BattleWatchBuffView', roleType, this._game);
            }
        } 
    }

}
