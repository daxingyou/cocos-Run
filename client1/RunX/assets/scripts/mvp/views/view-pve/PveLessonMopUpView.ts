/*
 * @Description:
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2022-05-09 13:55:41
 * @LastEditors: lixu
 * @LastEditTime: 2022-05-20 11:15:39
 */
import { CustomDialogId, RES_ICON_PRE_URL } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import RichTextEx from "../../../common/components/rich-text/RichTextEx";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { dailyLessonEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import moduleUIManager from "../../../common/ModuleUIManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { uiHelper } from "../../../common/ui-helper/UIHelper";
import { cfg } from "../../../config/config";
import { bagData } from "../../models/BagData";
import ItemBag from "../view-item/ItemBag";

const {ccclass, property} = cc._decorator;

@ccclass
export default class PveLessonMopUpView extends ViewBaseComponent {
    @property(cc.Label) lessonDesc: cc.Label = null;
    @property(cc.Node) prizeParentNode: cc.Node = null;
    @property(cc.Sprite) propSp: cc.Sprite = null;
    @property(RichTextEx) propCount: RichTextEx = null;
    @property(cc.Label) inputLb: cc.Label = null;       //选择数量

    private _clickCb: Function = null;
    private _currCount: number = 1;
    private _lessonCfg: cfg.PVEDailyLesson | cfg.PVERiseRoad = null;
    private _isRiseRoadCfg: boolean = false;
    private _singleRoundCost: number = 0;
    private _costItemID: number = 0;
    private _sprLoader: SpriteLoader = new SpriteLoader();
    private _itemBag: ItemBag[] = [];
    private _mopUpMaxCount: number = 0; //单次扫荡最大次数限制

    protected onInit(lessonCfg: cfg.PVEDailyLesson | cfg.PVERiseRoad,  riseRoad: boolean = false, clickCb: Function): void {
        this._lessonCfg = lessonCfg;
        this._isRiseRoadCfg = riseRoad;
        this._clickCb = clickCb;
        this._mopUpMaxCount = configUtils.getConfigModule('AutoFightMaxTime') || 99;
        eventCenter.register(dailyLessonEvent.SWEET_PVE_RES, this, this.closeView);
        this._initUI();
    }

    protected onRelease(): void {
        this._clearItems();
        this._sprLoader.release();
    }

    onClickMopUp(){
        let lessonID = this._isRiseRoadCfg ? (this._lessonCfg as cfg.PVERiseRoad).PVERiseRoadId : (this._lessonCfg as cfg.PVEDailyLesson).PVEDailyLessonId;
        let haveCnt = bagData.getItemCountByID(this._costItemID);
        let needCnt = this._currCount * this._singleRoundCost;
        if (haveCnt < needCnt) {
            let dialogCfg = configUtils.getDialogCfgByDialogId(CustomDialogId.PVE_TICKET_NO_ENOUGH);
            let nameStr = configUtils.getItemConfig(this._costItemID).ItemName;
            let text = utils.convertFormatString(dialogCfg.DialogText, [{ itemname: nameStr }]);
            guiManager.showTips(text);
            return;
        }

        this._clickCb && this._clickCb(lessonID, this._currCount);
    }

    onClickAdd(event: cc.Event.EventTouch, customData: string) {
        let offset = parseInt(customData);

        let currCount = this._currCount + offset;
        if(currCount < 1 || currCount > this._mopUpMaxCount) return;

        let haveCnt = bagData.getItemCountByID(this._costItemID);
        let maxRound = Math.max(Math.floor(haveCnt / this._singleRoundCost), this._currCount);
        if(currCount > maxRound) return;
        this._currCount = currCount;
        this._changePriceStatus();
    }

    onClickMin() {
        if(this._currCount == 1) return;
        this._currCount = 1;
        this._changePriceStatus();
    }

    onClickMax() {
        let haveCnt = bagData.getItemCountByID(this._costItemID);
        let maxRound = Math.max(Math.floor(haveCnt / this._singleRoundCost), this._currCount);
        maxRound = Math.min(maxRound, this._mopUpMaxCount);
        if(maxRound == this._currCount) return;
        this._currCount = maxRound;
        this._changePriceStatus();
    }

    private _initUI() {
        let url: string = null;
        this._clearItems();
        let spaceX = 10;
        let prizeArr: any[] = null;
        if(this._isRiseRoadCfg) {
            let cfg: cfg.PVERiseRoad = this._lessonCfg as cfg.PVERiseRoad
            this.lessonDesc.string = cfg.PVERiseRoadLessonName;
            let cfg1: cfg.PVEList = configManager.getConfigByKey("pveList", 17005);
            let numShow = cfg1.PVEListNumShow.split(";");
            let type = parseInt(numShow[0]);
            if (type == 1) {
                let parseInfo = utils.parseStingList(cfg.PVERiseRoadCost)[0];
                let itemID = parseInt(parseInfo[0]);
                this._costItemID = itemID;
                let needCnt = parseInt(parseInfo[1]);
                this._singleRoundCost = needCnt;
                url = `${RES_ICON_PRE_URL.BAG_ITEM}/${configUtils.getItemConfig(itemID).ItemIcon}`;
            }

            cfg.PVERiseRoadRewardShow && (prizeArr = utils.parseStingList(cfg.PVERiseRoadRewardShow));
        } else {
            let cfg: cfg.PVEDailyLesson = this._lessonCfg as cfg.PVEDailyLesson
            this.lessonDesc.string = cfg.PVEDailyLessonName;
            let cfg1: cfg.PVEList = configManager.getConfigByKey("pveList", cfg.PVEDailyLessonBelong);
            let numShow = cfg1.PVEListNumShow.split(";");
            let type = parseInt(numShow[0]);
            let parseInfo = utils.parseStingList(cfg.PVEDailyLessonCost)[0];
            let itemID = parseInt(parseInfo[0]);
            let needCnt = parseInt(parseInfo[1]);
            this._singleRoundCost = needCnt;
            this._costItemID = itemID;
            url = `${RES_ICON_PRE_URL.BAG_ITEM}/${configUtils.getItemConfig(itemID).ItemIcon}`;
            cfg.PVEDailyLessonRewardShow && (prizeArr = utils.parseStingList(cfg.PVEDailyLessonRewardShow));
        }

        prizeArr && prizeArr.forEach((ele, index) => {
            if (ele && ele.length) {
                let item = ItemBagPool.get();
                item.init({
                    id: parseInt(ele[0]),
                    clickHandler: () => {
                        moduleUIManager.showItemDetailInfo(parseInt(ele[0]), parseInt(ele[1]), uiHelper.getRootViewComp(this.node).node);
                    }
                });
                // 新创建节点，加入回收池
                this._itemBag.push(item);
                item.node.y = 0;
                item.node.parent = this.prizeParentNode;
            }
        });

        if(this._itemBag.length > 0) {
            let startX = -(((this._itemBag.length - 1) * (this._itemBag[0].node.width + spaceX)) >> 1);
            this._itemBag.forEach((ele, idx) => {
                ele.node.x = startX;
                startX += (ele.node.width + spaceX);
            })
        }
        url && this._sprLoader.changeSprite(this.propSp, url);
        this._changePriceStatus();
    }

    private _clearItems () {
        this._itemBag.forEach(_i => {
            ItemBagPool.put(_i)
        })
        this._itemBag = [];
    }

    private _changePriceStatus() {
        let haveCnt = bagData.getItemCountByID(this._costItemID);
        let needCnt = this._currCount * this._singleRoundCost;
        this.inputLb.string = `${this._currCount}`;
        let needStr = needCnt < 1000000 ? `${needCnt}` : `${Math.floor(needCnt / 10000)}万`;
        this.propCount.string = needStr;
        this.propCount.node.color = (needCnt <= haveCnt) ? cc.color(138, 94, 40) : cc.color(255, 0, 0);
    }
}
