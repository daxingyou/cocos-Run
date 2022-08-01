import { CustomDialogId, CustomItemId, VIEW_NAME } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import UIGridView, { GridData } from "../../../common/components/UIGridView";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { commonEvent, hangUpEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import moduleUIManager from "../../../common/ModuleUIManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { scheduleManager } from "../../../common/ScheduleManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { data, gamesvr } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { serverTime } from "../../models/ServerTime";
import { userData } from "../../models/UserData";
import { userOpt } from "../../operations/UserOpt";
import ItemBag from "../view-item/ItemBag";

const { ccclass, property } = cc._decorator;

@ccclass
export default class HangUpRewardView extends ViewBaseComponent {

    @property(UIGridView)       grid: UIGridView = null;
    @property(cc.Node)          ndEmpty: cc.Node = null;
    @property(cc.Node)          ndContent: cc.Node = null;
    @property(cc.ProgressBar)   progress: cc.ProgressBar = null;    // 挂机进度条
    @property(cc.Label)         labelCountDown: cc.Label = null;    // 挂机时间Label
    @property(cc.Button)        btnReceive: cc.Button = null;       // 领取按钮
    @property(cc.Button)        btnFast: cc.Button = null;          // 快速挂机
    @property(cc.Label)         labelMaxTime: cc.Label = null;      // 最大挂机时间
    @property(cc.Label)         labelFreeTime: cc.Label = null;     // 免费次数
    @property(cc.Label)         labelFastHangUp: cc.Label = null;   // 快速挂机说明
    @property(cc.Label)         labelBtnFast: cc.Label = null;      // 付费按钮文字
    @property(cc.Sprite)        iconCost: cc.Sprite = null;         // 付费价格Icon
    @property(cc.Label)         labelCost: cc.Label = null;         // 付费价格文字

    countDownScheduleID: number = null; // 倒计时scheduleID
    curTime: number = null;             // 当前已挂机时间(s)
    maxTime: number = null;             // 最大挂机时间(s)

    spriteLoader: SpriteLoader = new SpriteLoader();

    preInit():Promise<any> {
        this.ndEmpty.active = true;
        this.ndContent.active = false;
        this.btnReceive.interactable = false;
        return Promise.resolve(true);
    }

    protected onInit(): void {
        this._registerEvents();
        this._initView();
        userOpt.reqHangUpGainPreview();
    }

    private _registerEvents() {
        eventCenter.register(hangUpEvent.HANGUP_PREVIEW_RES, this, this._onReceivePreview);
        eventCenter.register(hangUpEvent.HANGUP_REWARD_RES, this, this._onReceiveReward);
        eventCenter.register(hangUpEvent.HANGUP_FAST_RES, this, this._onHangUpFastRes);
        eventCenter.register(commonEvent.JUMP_MODULE, this, this.closeView);
        eventCenter.register(hangUpEvent.REFRESH_VIEW, this, this._onRefreshView);
    }

    protected onRelease(): void {
        this.unscheduleAllCallbacks();
        eventCenter.unregisterAll(this);
        this._stopCountDown();
        this.grid.clear();
        this.spriteLoader.release();
    }

    private _initView() {
        // 最大挂机时间
        let configModule = configUtils.getModuleConfigs();
        let dialogMaxTime = configUtils.getDialogCfgByDialogId(99000079);
        this.labelMaxTime.string = utils.convertFormatString(dialogMaxTime.DialogText, [{num: configModule.AccumulateRewardMaxTime / 3600}]);
        // 快速挂机说明
        this.labelFastHangUp.string = configUtils.getDialogCfgByDialogId(99000081).DialogText;
        // 仙玉ICON
        this.spriteLoader.changeSprite(this.iconCost,  resPathUtils.getItemIconPath(CustomItemId.DIAMOND));
        this._updateView();
    }

    private _updateView() {
        // 倒计时
        let curTime = serverTime.currServerTime() - utils.longToNumber(userData.universalData.UniversalHangUpGainData.StartTime);
        this.maxTime = configUtils.getModuleConfigs().AccumulateRewardMaxTime;
        this.curTime = Math.min(this.maxTime, curTime);
        this._updateHandUpProgress();
        this._startCountDown();
        this._onRefreshView();
    }

    private _onRefreshView() {
        let configModule = configUtils.getModuleConfigs();
        let universalHangUpGainData = userData.universalData.UniversalHangUpGainData;
        let freeTime: number = configModule.AccumulateRewardFastFreeCount - universalHangUpGainData.FastHangUpCount;
        freeTime = Math.max(freeTime, 0);
        let parseResult = utils.parseStringTo1Arr(configModule.AccumulateRewardFast, ";");
        let costTime: number = configModule.AccumulateRewardFastFreeCount + parseResult.length - universalHangUpGainData.FastHangUpCount;
        costTime = Math.max(costTime, 0);

        // 免费快速挂机次数
        if (freeTime > 0) {
            this.labelBtnFast.node.y = 0;
            this.iconCost.node.active = false;
            this.labelCost.node.active = false;

            let dialogFreeTime = configUtils.getDialogCfgByDialogId(99000080);
            this.labelFreeTime.string = utils.convertFormatString(dialogFreeTime.DialogText, [{num: freeTime}]);
        } else {
            this.labelBtnFast.node.y = 10;
            this.iconCost.node.active = true;
            this.labelCost.node.active = true;

            let idx = parseResult.length - costTime;
            idx >= parseResult.length && (idx = parseResult.length - 1);
            this.labelCost.string = parseResult[idx];
            let dialogFreeTime = configUtils.getDialogCfgByDialogId(99000084);
            this.labelFreeTime.string = utils.convertFormatString(dialogFreeTime.DialogText, [{num: costTime}]);
        }

        // 免费+付费都用完，按钮置灰
        if ( costTime <= 0) {
            utils.setButtonInteractable(this.btnFast, false);
        } else {
            utils.setButtonInteractable(this.btnFast, true);
        }
    }

    onClickGet () {
        userOpt.reqHangUpReward();
    }

    onBtnFast() {
        let configModule = configUtils.getModuleConfigs();
        let freeCount = configModule.AccumulateRewardFastFreeCount;
        let parseResult = utils.parseStringTo1Arr(configModule.AccumulateRewardFast, ";");

        let hangUpData = userData.universalData.UniversalHangUpGainData;
        // 1、有免费次数 2、有付费次数且仙玉足够。 否则提示仙玉不足
        if (hangUpData.FastHangUpCount > freeCount) {
            let idx = hangUpData.FastHangUpCount - freeCount;   // 能点击肯定有次数，计算付费配置下标
            let count = bagData.getItemCountByID(CustomItemId.DIAMOND);
            if (count < Number(parseResult[idx])) {
                guiManager.showDialogTips(CustomDialogId.COMMON_ITEM_NOT_ENOUGH, CustomItemId.DIAMOND);
                return;
            }
        }

        userOpt.reqUniversalHangUpGainFastHangUp();
    }

    private _onReceiveReward (cmd: any, msg: gamesvr.IUniversalHangUpGainReceiveRewardRes) {
        this._setBtnRecvEnable(false);
        this._updateView();
        let info = msg.Prizes;
        this.scheduleOnce(() => {
            this.loadSubView(VIEW_NAME.GET_ITEM_VIEW, info, [], []);
        })
    }

    private _onReceivePreview (cmd: any, msg: gamesvr.IUniversalHangUpGainPreviewRewardRes) {
        this._showPrize(msg.Prizes);
    }

    private _onHangUpFastRes(event: number, msg: gamesvr.UniversalHangUpGainFastHangUpRes) {
        this.loadSubView(VIEW_NAME.GET_ITEM_VIEW, msg.Prizes, [], []);
    }

    private _setBtnRecvEnable(enable: boolean) {
        this.ndEmpty.active = !enable;
        this.ndContent.active = enable;
        utils.setButtonInteractable(this.btnReceive, enable);
    }

    private _showPrize (prize: data.IItemInfo[]) {
        if (!prize || prize.length <= 0) {
            this._setBtnRecvEnable(false);
            return;
        }
        let items = utils.mergeItemList(prize);
        this._setBtnRecvEnable(true);
        this.grid.clear();
        let self = this;
        let gridDatas: GridData[]  = items.map( (_v, _idx) => {
            return {
                key: _idx.toString(),
                data: _v,
            }
        });
        this.grid.init(gridDatas, {
            onInit: (itemCmp: ItemBag, data: GridData) => {
                self._onItemUpdate(itemCmp, data.data);
            },
            getItem: (): ItemBag => {
                let itemNode = ItemBagPool.get()
                return itemNode;
            },
            releaseItem: (itemCmp: ItemBag) => {
                ItemBagPool.put(itemCmp)
            },
        });
    }

    private _onItemUpdate (item: ItemBag, data: data.IItemInfo, isExtra: boolean = false) {
        let prizeItem = data;
        let count = utils.longToNumber(prizeItem.Count)
        item.init({
            id: prizeItem.ID,
            clickHandler: () => { moduleUIManager.showItemDetailInfo(prizeItem.ID, count, this.node); },
            count: count,
            getItem: true,
            isNew:false,
            extra: isExtra
        });
    }

    private _updateHandUpProgress() {
        this.progress.progress = this.curTime / this.maxTime;
        this.labelCountDown.string = utils.getTimeIntervalHour(this.curTime, "HH:MM:SS");
    }

    private _startCountDown() {
        this._stopCountDown();
        this.countDownScheduleID = scheduleManager.schedule(this._countDown.bind(this), 1);
    }

    private _countDown() {
        let curTime = serverTime.currServerTime() - utils.longToNumber(userData.universalData.UniversalHangUpGainData.StartTime);
        this.curTime = Math.min(this.maxTime, curTime);
        if (this.curTime >= this.maxTime) {
            this.curTime = this.maxTime;
            this._stopCountDown();
        }
        this._updateHandUpProgress();
    }

    private _stopCountDown() {
        if(!this.countDownScheduleID) return;

        let schID = this.countDownScheduleID;
        this.countDownScheduleID = 0;
        scheduleManager.unschedule(schID);
    }
}
