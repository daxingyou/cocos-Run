import { utils } from "../../../../app/AppUtils";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { data, gamesvr } from "../../../../network/lib/protocol";
import { pvpData } from "../../../models/PvpData";
import List from "../../../../common/components/List";
import HttpRequest from "../../../../network/HttpRequest";
import { appCfg } from "../../../../app/AppConfig";
import guiManager from "../../../../common/GUIManager";
import { logger } from "../../../../common/log/Logger";
import { PVP_MODE } from "../../../../app/AppEnums";
import { SCENE_NAME } from "../../../../app/AppConst";
import base64 from "../../../../basic/Base64";
import ItemPeakDuelRecord from "./ItemPeakDuelRecord";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PVPPeakDuelRecordView extends ViewBaseComponent {
    @property(List) listPeakDuelView: List = null;
    @property(cc.Node) empty: cc.Node = null;
    private _recordList:data.IPVPPeakDuelFight[] = [];
    private _multBattleResult: gamesvr.IEnterBattleResult[] = [];
    private _record:data.IPVPPeakDuelFight = null;

    onInit() {
        this.refreshView();
    }

    onRelease() {
        this.listPeakDuelView._deInit();
    }

    onPeakDuelListRender(itemNode: cc.Node, idx: number) {
        let fight = this._recordList[idx];
        itemNode.getComponent(ItemPeakDuelRecord).onInit(fight, this.onClickRecodMore.bind(this));
    }

    private _getBattleRes(uidList: string[]) {
        if (!uidList || !uidList.length) { 
            //一份数据全部储存完毕
            if (!pvpData.pvpPeakDuekFinishData)
                pvpData.pvpPeakDuekFinishData = new gamesvr.PvpPeakDuelEnterRes();
            
            pvpData.pvpPeakDuekFinishData.EnterBattleResultList = this._multBattleResult.concat();

            pvpData.pvpConfig = {
                pvpMode: PVP_MODE.PEAK_DUEL,
                replay: pvpData.pvpPeakDuekFinishData.EnterBattleResultList[0],
                replayDetail: this._record,
                step:0,
            }
            this.closeView();
            guiManager.loadScene(SCENE_NAME.BATTLE);
            return;
        }
        
        let id = uidList.shift();
        this._getBattleRecall(id).then((battleRes:gamesvr.IEnterBattleResult) => { 
            this._multBattleResult.push(battleRes);
            this._getBattleRes(uidList);
        })    
    }

    onClickRecodMore(record: data.IPVPPeakDuelFight) {
        pvpData.updatePeakDuelRecordInfo(record);
        this._record = record;
        let resUid = record.FightUIDList.concat();
        this._getBattleRes(resUid)
    }

    private async _getBattleRecall (battleUid: string) {
        try {
            let result = await new HttpRequest().request(appCfg.reportUrl+"/game-battle-download", {FightUID:battleUid}, null, true);
            let resObj = JSON.parse(result);
            let res = resObj.data
            if (res && res.Status == 200 && res.Data) {
                let decodeStr = base64.decode(res.Data);
                let decodeObj: gamesvr.IEnterBattleResult = JSON.parse(decodeStr);
                return decodeObj
            } else {
                guiManager.showTips("拉取回放数据失败.")
            }
        } catch (e) {
            logger.log("_getBattleRecall fail by error", e)
            return null
        }
        return null
    }

    refreshView() {
        //根据pvp类型来确定历史记录
        let fightList = pvpData.peakDuelData?.FightList || [];

        this._recordList = utils.deepCopy(fightList);
        this._recordList.sort((recordA, recordB)=>{
            let timeA = utils.longToNumber(recordA.FightTime);
            let timeB = utils.longToNumber(recordB.FightTime);
            return timeB - timeA;
        });
        this.empty.active = !this._recordList.length;
        this.listPeakDuelView.node.active = !!this._recordList.length;
        this.listPeakDuelView.numItems = this._recordList.length;        
    }
}
