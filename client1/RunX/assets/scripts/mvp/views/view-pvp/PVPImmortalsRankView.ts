/*
 * @Author: xuyang
 * @Date: 2021-07-05 19:17:31
 * @Description: PVP-斩将封神-奖励页面
 */
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { data } from "../../../network/lib/protocol";
import { pvpData } from "../../models/PvpData";
import List from "../../../common/components/List";
import PVPImmortalsRankItem from "./PVPImmortalsRankItem";
import { configUtils } from "../../../app/ConfigUtils";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PVPImmortalsRankView extends ViewBaseComponent {

    @property(List) listView: List = null;
    @property(cc.Node) selfNode: cc.Node = null;
    @property(cc.Node) rankTips: cc.Node = null;
    @property(cc.Node) emptyNode: cc.Node = null;
    private _rankList: data.IPVPFairyIntegral[] = [];

    onInit() {
        this.refreshView();
    }

    deInit() {
        this.selfNode.getComponent(PVPImmortalsRankItem).unuse();
    }

    onRelease() {
        this.deInit();
        this.listView._deInit();
    }

    onListRender(itemNode: cc.Node, idx: number) {
        let fight = this._rankList[idx];
        itemNode.getComponent(PVPImmortalsRankItem).init(fight);
    }

    refreshView(){
        let descCfg = configUtils.getDialogCfgByDialogId(99000054);
        let labelComp = cc.find('label', this.rankTips).getComponent(cc.Label);
        labelComp.string = descCfg.DialogText;

        this._rankList = pvpData.fairyRank;
        if(!this._rankList || this._rankList.length == 0){
            this.emptyNode.active = true;
            let text = configUtils.getDialogCfgByDialogId(99000053).DialogText;
            let labelComp = cc.find('label', this.emptyNode).getComponent(cc.Label);
            labelComp.string = text;
            //@ts-ignore
            labelComp._forceUpdateRenderData();
            cc.find('spr1', this.emptyNode).width = labelComp.node.width + 80;
        }else{
            this.emptyNode.active = false;
        }

        this.listView.numItems = this._rankList.length;
        this.selfNode.getComponent(PVPImmortalsRankItem).init(null, true);
    }
}
