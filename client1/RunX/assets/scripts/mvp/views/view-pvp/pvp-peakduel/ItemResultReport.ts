import guiManager from "../../../../common/GUIManager";
import { gamesvr } from "../../../../network/lib/protocol";
import { pvpData } from "../../../models/PvpData";
import { ADJUST_TEAM_TYPE } from "./PVPPeakDuelChangeTeamView";

const {ccclass, property} = cc._decorator;
@ccclass
export default class ItemResultReport extends cc.Component {
    @property(cc.SpriteFrame) reportSprFrams: cc.SpriteFrame[] = [];
    @property(cc.Sprite) reportBg: cc.Sprite = null;
    @property(cc.Node) reportBtnNode: cc.Node = null
    @property(cc.Node) indexBg: cc.Node = null;

    onInit(index:number,type:ADJUST_TEAM_TYPE): void {
        this._refreshSprs(index,type);
        this._refreshReprotBtn(type);
    }

    /**item释放清理*/
    deInit() {
    
    }

    private _refreshReprotBtn(type:ADJUST_TEAM_TYPE) {
        this.reportBtnNode.active = (type == ADJUST_TEAM_TYPE.COMBAT_SETTLEMENT);
        this.indexBg.active = (type != ADJUST_TEAM_TYPE.COMBAT_SETTLEMENT);
    }

    private _refreshSprs(idx: number,type:ADJUST_TEAM_TYPE) {
        let isWin = pvpData.pvpPeakDuekFinishData?.EnterBattleResultList[idx]?.BattleEndRes?.Win || true;
        //判断输赢与是否结算
        let sprIdx = isWin ? 1 : 2;
        sprIdx = (type == ADJUST_TEAM_TYPE.COMBAT_SETTLEMENT) ? sprIdx : 0;
        this.reportBg.spriteFrame = this.reportSprFrams[sprIdx];
    }

    openReportView(event: any, customData: string) {
        let reportIndex = Number(customData);
        let result:gamesvr.IEnterBattleResult[] = pvpData.pvpPeakDuekFinishData.EnterBattleResultList;
        guiManager.loadView("BattleReportView", this.node.parent.parent, result[reportIndex],reportIndex);
    }
}