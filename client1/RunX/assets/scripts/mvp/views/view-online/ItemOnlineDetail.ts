import { RES_ICON_PRE_URL } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { onlineEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import moduleUIManager from "../../../common/ModuleUIManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { gamesvr } from "../../../network/lib/protocol";
import { onlineData, ONLINE_ITEM_RESULT } from "../../models/OnlineData";
import { onlineOpt } from "../../operations/OnlineOpt";
import ItemBag from "../view-item/ItemBag";

const {ccclass, property} = cc._decorator;
@ccclass
export default class ItemOnlineDetail extends cc.Component{
    @property(cc.Sprite) isRewarded: cc.Sprite = null;
    private _itemId: number = 0;
    private _itemCount: number = 0;
    private _resultState: ONLINE_ITEM_RESULT = ONLINE_ITEM_RESULT.WAITRECEIVED;
    private _index: number = 0;

    private _itemBag: ItemBag = null;
    private _spriteLoader: SpriteLoader = new SpriteLoader();

    protected onEnable(): void {
        eventCenter.register(onlineEvent.ITEM_STATE_NTY, this, this._reflashState);
        eventCenter.register(onlineEvent.ONLINE_REWARDS_RES, this, this._getItemReward);
    }

    protected onDisable(): void {
        eventCenter.unregisterAll(this);
        this._spriteLoader.release();
    }

    /**
     * @param index 下标id
     */
    public init(index: number) {
        this._reset();
        this._index = index;
        let cfg:cfg.OnlineReward = configManager.getConfigByKey(`onlineReward`, index);
        if (!cfg) return;
        let propInfo = cfg.OnlineRewardExhibition?.split(`;`);
        if (propInfo) {
            this._itemId = parseInt(propInfo[0]);
            this._itemCount = parseInt(propInfo[1]);
            this._initIcon();
        }   
        let state = onlineData.onlineIdStateGet(index);
        if (!state) state = ONLINE_ITEM_RESULT.UNRECEIVED;
        this.setItemResultState(state);
    }

    deInit() {
        this._reset();
        if (this._itemBag) {
            this._itemBag.deInit();
            ItemBagPool.put(this._itemBag);
            this._itemBag = null;
        }
        eventCenter.unregisterAll(this);
    }

     registerAllEvents() {
        
    }

    private _initIcon() {
        if (this._itemBag) return;
        this._itemBag = ItemBagPool.get();
        if (!this._itemBag) return;
        this._itemBag.node.setScale(0.8);
        this._itemBag.node.parent = this.node;
        this._itemBag.node.zIndex = -1;
        this._itemBag.init({
            id: this._itemId,
            count: this._itemCount,
            clickHandler: this.clickItem.bind(this),
        });
    }

    /**设置当前物品的领取状态*/
    setItemResultState(state: ONLINE_ITEM_RESULT) {
        if (!state) state = ONLINE_ITEM_RESULT.WAITRECEIVED;
        this._resultState = state;

        switch (this._resultState) {
            case ONLINE_ITEM_RESULT.RECEIVED: {
                this.isRewarded.node.active = true;
                let url = `${RES_ICON_PRE_URL.ONLINE}/${`yilingqu`}`;
                this._spriteLoader.changeSprite(this.isRewarded, url);
                this.node.getComponent(cc.Button).enabled = false;
                this._itemBag && this._itemBag.itemRedDot.showRedDot(false);
                break;
            }
            case ONLINE_ITEM_RESULT.UNRECEIVED: {
                break;
            }
            case ONLINE_ITEM_RESULT.WAITRECEIVED: {
                // this.redDot.showRedDot(true);
                this._itemBag && this._itemBag.itemRedDot.showRedDot(true);
                break;
            }
        }
    }

    private _reset() {
        this.isRewarded.node.active = false;
        this._itemBag && this._itemBag.itemRedDot.showRedDot(false);
    }

    /**
     * 
     * @param cmd 
     * @param stateChangeIndex 需要变换的下标值
     */
    private _reflashState(cmd:any,stateChangeIndex:number) {
        if (this._index != stateChangeIndex) return;
        this._reset();
        this.setItemResultState(ONLINE_ITEM_RESULT.WAITRECEIVED);
    }

    private _getItemReward(cmd: any, msg: gamesvr.ActivityOnlineRewardReceiveRewardRes) {
        if (msg.ReceiveIDList && msg.ReceiveIDList.length) {
            let show = msg.ReceiveIDList.indexOf(this._index);
            if (show < 0) return;
            this._reset();
            this.setItemResultState(ONLINE_ITEM_RESULT.RECEIVED);
            onlineData.onlineIdStateSave(this._index, ONLINE_ITEM_RESULT.RECEIVED);
        }
        
    }

    //领取道具
    clickItem() {
        switch (this._resultState) {
            case ONLINE_ITEM_RESULT.RECEIVED: { 
                guiManager.showTips(`当前物品已领取`);
                break;
            }
            case ONLINE_ITEM_RESULT.UNRECEIVED: {
                moduleUIManager.showItemDetailInfo(this._itemId, this._itemCount, this.node.parent);
                break;
            }
            case ONLINE_ITEM_RESULT.WAITRECEIVED: { 
                onlineOpt.sendGetRewardReq([this._index]);
                break;
            }
        } 
        
    }   
}