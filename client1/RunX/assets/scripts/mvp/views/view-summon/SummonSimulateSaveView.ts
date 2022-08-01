import { CustomDialogId, MAX_SIMULATE } from "../../../app/AppConst";
import UIGridView, { GridData } from "../../../common/components/UIGridView";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import guiManager from "../../../common/GUIManager";
import { data } from "../../../network/lib/protocol";
import { trackData } from "../../models/TrackData";
import MessageBoxView, { MsgboxInfo } from "../view-other/MessageBoxView";
import ItemSummonList from "./ItemSummonList";

const { ccclass, property } = cc._decorator;

@ccclass
export default class SummonSimulateSaveView extends ViewBaseComponent {

    @property(cc.Prefab)    listTamplate: cc.Prefab = null;
    @property(cc.Node)      listRoot: cc.Node = null;
    @property(UIGridView)   gridView: UIGridView = null;

    private _items: ItemSummonList[] = [];
    private _confirm: Function = null;
    private _continue: Function = null;
    private _currGachaId: number = 0;
    private _currSeqIdx: number = -1;
    private _itemPool: cc.NodePool = new cc.NodePool();
    
    onInit (gachaId: number, confirmHandler: Function, continueHandler: Function) {
        this._confirm = confirmHandler;
        this._continue = continueHandler;
        this._currGachaId = gachaId;

        this._currSeqIdx = -1;// 默认是当前的，未必有暂存

        let currRecords = trackData.poolRecords[gachaId];
        if (currRecords) {
            this._showRecord(currRecords);
        }
    }

    private _showRecord (currRecords: data.ICardPoolRecord) {
        if (!currRecords) return;

        let v :data.ISimulateRecord[] = []
        if (currRecords.CurrentSimulate) {
            v.push(currRecords.CurrentSimulate)
        }

        let list = currRecords.SimulateRecords;
        for (let key in currRecords.SimulateRecords) {
            let info = list[key];
            v.push(info)
        }

        let gridDatas: GridData[]  = v.map( (_v, _idx) => {
            return {
                key: _idx.toString(),
                data: _v,
            }
        })

        // 默认选当前的
        this._currSeqIdx = -1;

        let self = this;
        this.gridView.init(gridDatas, {
            onInit: (itemCmp: ItemSummonList, data: GridData) => {
                let isCurr = data.key == "0"
                itemCmp.init(data.data, isCurr, this._onClickSeq.bind(self))
                itemCmp.select = itemCmp.seqIndex == this._currSeqIdx
            },
            getItem: (): ItemSummonList => {
                let itemNode: cc.Node = this._getItem();
                return itemNode.getComponent(ItemSummonList);
            },
            releaseItem: (itemCmp: ItemSummonList) => {
                // itemCmp.deInit();
                this._itemPool.put(itemCmp.node);
            },
            // updatePerFrame: 4,
        });
    }

    private _onClickSeq (seqIndex: number) {
        if (this._currSeqIdx == seqIndex) return; 
        
        this._currSeqIdx = seqIndex;
        this._items.forEach( _item => {
            _item.select = _item.seqIndex == seqIndex
        })
    }

    get sellectSeq () {
        let currSeq = 0;
        let currIdx = this._currSeqIdx
        this._items.forEach( _item => {
            if (_item.seqIndex == currIdx) {
                currSeq = _item.seq;
            }
        })
        return currSeq;
    }  

    onRelease () {
        this.gridView.clear();
        this._items.forEach( _item => {
            _item.deInit();
            _item.node.removeFromParent();
        })
        this._items.length = 0;
        this._itemPool.clear()
        this.unscheduleAllCallbacks()
    }
    
    onClickContinue () {
        let gachaId = this._currGachaId;

        let currSimulate = trackData.poolRecords[gachaId];
        if (currSimulate.SeqCounter == MAX_SIMULATE) {
            guiManager.showDialogTips(CustomDialogId.SUMMON_CHOOSE_RESULT);
            return;
        }

        this._continue && this._continue(this._currGachaId);
        this.closeView();
    }

    onClickConfirm () {
        let info: MsgboxInfo = {
            content: `确认后，以选中的模拟抽卡为最终结果，剩余未抽取的模拟次数消失，确定以该结果作为最终结果吗？`,
            leftStr: "取消",
            leftCallback: null,
            rightStr: "确定",
            rightCallback: (msgbox: MessageBoxView, checked?: boolean) => {
                this._confirm && this._confirm(this._currGachaId, this.sellectSeq);
                this.closeView();
                msgbox.closeView();
            }
        }
        guiManager.showMessageBox(this.node, info);
    }

    private _getItem () {
        if (this._itemPool.size() > 0) {
            return this._itemPool.get();
        } else {
            let nd = cc.instantiate(this.listTamplate);
            this._items.push(nd.getComponent(ItemSummonList))
            return nd
        }
    }

}