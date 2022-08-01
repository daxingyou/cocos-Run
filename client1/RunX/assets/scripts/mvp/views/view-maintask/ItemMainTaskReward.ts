import { ModuleName } from "../../../app/AppConst";
import { TaskState } from "../../../app/AppEnums";
import { eventCenter } from "../../../common/event/EventCenter";
import { mainTaskEvent } from "../../../common/event/EventData";
import moduleUIManager from "../../../common/ModuleUIManager";
import { RED_DOT_MODULE } from "../../../common/RedDotManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { gamesvr } from "../../../network/lib/protocol";
import { mainTaskOpt } from "../../operations/MainTaskOpt";
import ItemBag from "../view-item/ItemBag";

const {ccclass, property} = cc._decorator;
@ccclass
export default class ItemMainTaskReward extends cc.Component{

    private _itemBag: ItemBag = null;
    private _targetState = TaskState.Undo;
    private _itemID: number = 0;
    private _itemCount: number = 0;
    private _index: number = 0;
    init(itemID: number, count: number, index: number, state?: TaskState) {
        eventCenter.register(mainTaskEvent.MAIN_TASK_RES, this, this._reflashState);
        this._itemCount = count;
        this._itemID = itemID;
        this._index = index;
        this._targetState = state || TaskState.Undo;
        this.initIcon(itemID, count);
        this._showItemByState();
    }

    deInit() {
        eventCenter.unregisterAll(this);
        if (cc.isValid(this._itemBag) && cc.isValid(this._itemBag.node.parent)) {
            ItemBagPool.put(this._itemBag);
            this._itemBag = null;    
        }
    }

    initIcon(itemID:number,count:number) {
        this._itemBag = ItemBagPool.get();
        this._itemBag.node.setPosition(0, 30);
        this.node.addChild(this._itemBag.node)
        this._itemBag.node.setScale(0.9);
        this._itemBag.init({
            id: itemID,
            count: count,
            clickHandler: this._clickHandle.bind(this),
        })
    }

    setTargetState(state:TaskState) {
        this._targetState = state;
        this._showItemByState();
    }

    private _reflashState(cmd:any,result:gamesvr.TaskMainReceiveRewardRes) {
        if (result.TaskMainID != this._index) return;
        this._targetState = TaskState.Received;
        this._showItemByState();
    }

    private _showItemByState() {
        switch (this._targetState) {
            case TaskState.Undo: {
                break;
            }
            case TaskState.Completed: {
                this._itemBag.itemRedDot.showRedDot(true);
                break;
            }
            case TaskState.Received: {
                this._itemBag.showReceived();
                this._itemBag.itemRedDot.showRedDot(false);
                break;   
            }
        }
    }

    private _clickHandle() {
        switch (this._targetState) {
            case TaskState.Undo: {
                moduleUIManager.showItemDetailInfo(this._itemID, this._itemCount, this.node.parent);
                break;
            }
            case TaskState.Completed: {
                mainTaskOpt.seqTargerReward(this._index);
                break;
            }
            case TaskState.Received: {
                
                break;   
            }
        }
    }
}