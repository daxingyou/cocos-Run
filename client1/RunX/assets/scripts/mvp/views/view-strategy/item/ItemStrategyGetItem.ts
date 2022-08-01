

import { CustomDialogId } from "../../../../app/AppConst";
import guiManager from "../../../../common/GUIManager";
import moduleUIManager from "../../../../common/ModuleUIManager";
import { ItemStrategyDescPool } from "../../../../common/res-manager/NodePool";
import { cfg } from "../../../../config/config";
import ItemStrategyDesc from "./ItemStrategyDesc";

const {ccclass, property} = cc._decorator;

interface StrategyGetItemWayInfo {
    title: string,
    desc?: string,
    jumpParam?: number[],
}

@ccclass
export default class ItemStrategyGetItem extends cc.Component {
    @property(cc.Label) title: cc.Label = null;
    @property(cc.Button) btnGo: cc.Button = null;
    @property(cc.Node) descContainor: cc.Node = null;

    private _descItems: ItemStrategyDesc[] = [];
    private _cfg:cfg.StrategyMoney = null;
    private _itemInfo: StrategyGetItemWayInfo = null;

    init(cfg: cfg.StrategyMoney, item: StrategyGetItemWayInfo) {
        this._cfg = cfg;
        this._itemInfo = item;
        this._initUI();
    }

    deInit() {
        if(this._descItems && this._descItems.length > 0) {
            this._descItems.forEach(ele => {
                ItemStrategyDescPool.put(ele);
            });
            this._descItems.length = 0;
        }
    }

    private _initUI() {
        this.title.string = `${this._itemInfo.title || ''}`;

        let desc = this._itemInfo.desc;
        if(!desc) return;
        let descArr = Array.isArray(desc) ? desc : [desc];
        let curPosy = 0, spaceY = 5;
        descArr.forEach((ele, idx) => {
            let comp = ItemStrategyDescPool.get();
            this._descItems.push(comp);
            comp.init(ele);
            let nodeHeight = comp.itemHeight;
            if(idx != 0) {
              curPosy -= spaceY;
            }
            comp.node.setPosition(0, curPosy);
            comp.node.parent = this.descContainor;
            curPosy -= nodeHeight;
        })
    }

    onClickGo() {
        let jumpCfg = this._itemInfo.jumpParam;
        if(!jumpCfg || jumpCfg.length == 0){
            guiManager.showDialogTips(CustomDialogId.TASK_NO_DESTINATION);
            return;
        }

        let mID: number = jumpCfg[0];
        let pID: number = jumpCfg[1] ? jumpCfg[1] : 0;
        let sID: number = jumpCfg[2] ? jumpCfg[2] : 0;
        moduleUIManager.jumpToModule(mID, pID, sID);
    }
 }

 export {
  StrategyGetItemWayInfo
}
