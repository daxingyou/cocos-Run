/*
 * @Author: xuyang
 * @Date: 2021-07-05 19:17:31
 * @Description: PVP-斩将封神-奖励页面
 */
import { utils } from "../../../app/AppUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { data, gamesvr } from "../../../network/lib/protocol";
import { pvpData } from "../../models/PvpData";
import List from "../../../common/components/List";
import PVPDeifyRecordItem from "./PVPDeifyRecordItem";
import { redDotMgr, RED_DOT_MODULE } from "../../../common/RedDotManager";
import HttpRequest from "../../../network/HttpRequest";
import { appCfg } from "../../../app/AppConfig";
import guiManager from "../../../common/GUIManager";
import { logger } from "../../../common/log/Logger";
import { PVP_MODE } from "../../../app/AppEnums";
import { SCENE_NAME } from "../../../app/AppConst";
import base64 from "../../../basic/Base64";
import ItemPeakDuelRecord from "./pvp-peakduel/ItemPeakDuelRecord";
import StepWork from "../../../common/step-work/StepWork";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PVPDeifyRecordView extends ViewBaseComponent {

    @property(List) listView: List = null;
    @property(cc.Node) empty: cc.Node = null;
    private _recordList: data.IPVPSpiritFight[]= [];
    private _pvpModel: PVP_MODE = PVP_MODE.DEIFY_COMBAT;
    private _multBattleResult: gamesvr.IEnterBattleResult[] = [];

    onInit() {
        this.refreshView();
    }

    onRelease() {
        this.listView._deInit();
    }

    onListRender(itemNode: cc.Node, idx: number) {
        let fight = this._recordList[idx];
        itemNode.getComponent(PVPDeifyRecordItem).init(fight, this.onClickRecod.bind(this));
    }


    onClickRecod (record: data.IPVPSpiritFight) {
        // pvpDataOpt.reqBuyFairyTicket();
        this._getBattleRecall(record.FightUID).then((battleRes)=> {
        if (battleRes && battleRes.RoundRes) {
                pvpData.pvpConfig = {
                    pvpMode: this._pvpModel,
                    replay: battleRes,
                    replayDetail: record,
                }
                this.closeView();
                guiManager.loadScene(SCENE_NAME.BATTLE);
            }
        })
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
        // 点进这个界面 上一个界面的红点会消失 移除PVPData里的数据
        pvpData.hasNewDefendRecord = false;
        redDotMgr.fire(RED_DOT_MODULE.PVP_DEIFY_FIGHT_RECORD);
        let  fightList = pvpData.spiritData?.FightList || [];
   
        
        this._recordList = utils.deepCopy(fightList);
        this._recordList.sort((recordA, recordB)=>{
            let timeA = utils.longToNumber(recordA.FightTime);
            let timeB = utils.longToNumber(recordB.FightTime);
            return timeB - timeA;
        });
        this.empty.active = !this._recordList.length;
        this.listView.node.active = !!this._recordList.length;
        this.listView.numItems = this._recordList.length;    
    }
}
