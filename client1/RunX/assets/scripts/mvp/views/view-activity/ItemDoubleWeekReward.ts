import { CustomDialogId, VIEW_NAME } from "../../../app/AppConst";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import ButtonEx from "../../../common/components/ButtonEx";
import guiManager from "../../../common/GUIManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { activityData } from "../../models/ActivityData";
import { bagData } from "../../models/BagData";
import { activityOpt } from "../../operations/ActivityOpt";
import ItemBag from "../view-item/ItemBag";
import ItemRedDot from "../view-item/ItemRedDot";
import ItemDoubleWeekBase from "./ItemDoubleWeekBase";

const enum STATE_TYPE {
    LOCK,
    UNLOCK,
    REWARDED
}

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemDoubleWeekReward extends ItemDoubleWeekBase {
    @property(cc.Node) bg: cc.Node = null;
    @property(cc.Sprite) needIcon: cc.Sprite = null;
    @property(cc.Label) needNum: cc.Label = null;
    @property(cc.Node) rewarded: cc.Node = null;
    @property(ButtonEx) exchangeBtn: ButtonEx = null;
    @property(cc.Node) cantExchangeTips: cc.Node = null;
    @property(ItemRedDot) itemRedDot: ItemRedDot = null;

    private _activityId: number = 0;
    private _cfg: cfg.ActivityWeekSummonReward = null;
    private _spriteLoader: SpriteLoader = new SpriteLoader();

    init (cfg: cfg.ActivityWeekSummonReward, activityId: number, loadView: Function) {
        this._cfg = cfg;
        this._activityId = activityId;
        this.baseInit(loadView);
        this._refreshView();
    }

    deInit() {
        super.deInit();
        this._spriteLoader.release();
    }

    private _refreshView() {
        const state = this._getState();
        // this.bg.color = this._colors[state];

        this.exchangeBtn.setActivity(STATE_TYPE.UNLOCK == state);
        this.rewarded.active = STATE_TYPE.REWARDED == state;
        this.cantExchangeTips.active = STATE_TYPE.LOCK == state;

        const needs = this._cfg.NeedMoney.split(';');
        const needIconUrl = resPathUtils.getItemIconPath(Number(needs[0]));
        const itemId = Number(needs[0]);
        const needNum = Number(needs[1]);
        this._spriteLoader.changeSprite(this.needIcon, needIconUrl);
        this.needNum.string = `${needNum}`;
       
        this._refreshReward(this._cfg.RewardShow);

        
        const bagCount = bagData.getItemCountByID(itemId);
        if(bagCount >= needNum) {
            this.itemRedDot && this.itemRedDot.showRedDot(STATE_TYPE.UNLOCK == state);
        }
    }

    onClickExchange() {
        const needs = this._cfg.NeedMoney.split(';');
        const itemId = Number(needs[0]);
        const count = Number(needs[1]);
        const bagCount = bagData.getItemCountByID(itemId);
        if(bagCount >= count) {
            activityOpt.exchangeDoubleWeekReward(this._activityId, this._cfg.GetOrder);
        } else {
            guiManager.showDialogTips(CustomDialogId.COMMON_ITEM_NOT_ENOUGH, itemId);
        }
    }

    private _getState() {
        // return STATE_TYPE.LOCK;
        if(this._cfg.RewardGetCondition) {
            const preOrderRewarded = activityData.doubleWeekData.ActivityDoubleWeekFunctionMap[this._activityId] 
            && !!activityData.doubleWeekData.ActivityDoubleWeekFunctionMap[this._activityId].ReceiveOrderMap[this._cfg.GetOrder - 1];
            if(!preOrderRewarded) {
                return STATE_TYPE.LOCK;
            }
            const curOrderRewarded = activityData.doubleWeekData.ActivityDoubleWeekFunctionMap[this._activityId]
            && !!activityData.doubleWeekData.ActivityDoubleWeekFunctionMap[this._activityId].ReceiveOrderMap[this._cfg.GetOrder];
            return curOrderRewarded ? STATE_TYPE.REWARDED : STATE_TYPE.UNLOCK;
        } else {
            const curOrderRewarded = activityData.doubleWeekData.ActivityDoubleWeekFunctionMap[this._activityId]
            && activityData.doubleWeekData.ActivityDoubleWeekFunctionMap[this._activityId].ReceiveOrderMap
            && !!(activityData.doubleWeekData.ActivityDoubleWeekFunctionMap[this._activityId].ReceiveOrderMap[this._cfg.GetOrder]);
            return curOrderRewarded ? STATE_TYPE.REWARDED : STATE_TYPE.UNLOCK;
        }
    }
}
