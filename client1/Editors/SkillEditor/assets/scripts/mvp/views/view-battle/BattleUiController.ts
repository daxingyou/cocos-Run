import { modelManager } from "../../models/ModeManager";

const {ccclass, property} = cc._decorator;

@ccclass
export default class BattleUiController extends cc.Component {

    @property(cc.Node)          ndPlus: cc.Node[] = [];
    @property(cc.Node)          ndShadow: cc.Node[] = [];

    init () {
        this.ndPlus.forEach(_nd=> _nd.active = false);
        this.ndShadow.forEach(_nd=> _nd.active = true);
    }

    setPlus (idx: number, active: boolean) {
        if (cc.isValid(this.ndPlus[idx])) {
            this.ndPlus[idx].active = active;
        }
    }

    battleBegin () {
        this.ndPlus.forEach(_nd=> _nd.active = false);
        this.ndShadow.forEach(_nd=> _nd.active = false);

        let currHero = modelManager.battleUIData.getSelfTeam().roles;
        currHero.forEach(_uiRole => {
            let pos = _uiRole.pos;
            if (cc.isValid(this.ndShadow[pos])) {
                this.ndShadow[pos].active = true;
            }
        })
    }

}