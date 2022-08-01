/*
 * @Author: xuyang
 * @Description: 活动-至尊战令
 */
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configUtils } from "../../../app/ConfigUtils";
import { activityData } from "../../models/ActivityData";
import { utils } from "../../../app/AppUtils";
import { serverTime } from "../../models/ServerTime";
import { activityUtils } from "../../../app/ActivityUtils";
import {scheduleManager} from "../../../common/ScheduleManager";
import { shopOpt } from "../../operations/ShopOpt";
import blurManager from "../../../common/BlurManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { appCfg } from "../../../app/AppConfig";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { CustomItemId } from "../../../app/AppConst";

const { ccclass, property } = cc._decorator;
@ccclass
export default class ActivityBattlePassTipsView extends ViewBaseComponent {
    @property(cc.Label) priceLb: cc.Label = null;
    @property(cc.Label) tipsLb: cc.Label = null;
    @property(cc.Label) introLb: cc.Label = null;
    @property(cc.Label) reaminTimeLb: cc.Label = null;
    @property(cc.Toggle) toggleItem: cc.Toggle = null;
    @property(cc.Node) toggleLayout: cc.Node = null;
    @property(cc.Sprite) priceIcon: cc.Sprite = null;

    private _scheduleId: number = 0;
    private _spLoader: SpriteLoader = null;

    onInit(moduleId: number, partId: number, subId: number) {
        this._refreshView();
    }

    protected onRelease(): void {
        this._spLoader && this._spLoader.release();
        this._scheduleId && scheduleManager.unschedule(this._scheduleId);
        this._scheduleId = 0;
    }


    onClickBuy(){
        let rechargeId = activityUtils.getBattlePassRechargeId();
        let price = activityUtils.getBattlePassCost();
        let needMoney = price / 100;
        shopOpt.sendRechargeReq(rechargeId, needMoney);
        this.closeView();
    }

    private _refreshView(){
        // 清理Items
        let moduleCfg = configUtils.getModuleConfigs();
        let buyCnt = activityData.battlePassData.BuyCount || 0;
        let needCnt = moduleCfg.BattlePassForeverNeed || 0;
        let itemNodes = [...this.toggleLayout.children];
        let price = activityUtils.getBattlePassCost();
        itemNodes.forEach(itemNode => {
            if (cc.isValid(itemNode) && itemNode.active) {
                itemNode.removeFromParent();
            }
        })
        if (needCnt) {
            for (let i = 0; i < needCnt; i++) {
                let check = i < buyCnt;
                let newItem = cc.instantiate(this.toggleItem.node);
                newItem.active = true;
                newItem.getComponent(cc.Toggle).isChecked = check;
                this.toggleLayout.addChild(newItem);
            }
        }

        if(appCfg.UseTestMoney){
            this._spLoader = this._spLoader || new SpriteLoader();
            this._spLoader.changeSprite(this.priceIcon, resPathUtils.getItemIconPath(CustomItemId.ZI_YV), () => {
                this.priceIcon.node.active = true;
            });
            this.priceLb.string = `至尊战令${price/100}`;
            //@ts-ignore
            this.priceLb._forceUpdateRenderData();
            let totalWh = this.priceIcon.node.width + this.priceLb.node.width;
            let halfWh = totalWh >> 1;
            this.priceLb.node.x = -halfWh + (this.priceLb.node.width >> 1);
            this.priceIcon.node.x = halfWh - (this.priceIcon.node.width >> 1);
        } else {
            this.priceLb.string = `至尊战令${price/100}元`;
            this.priceLb.node.x = 0;
        }

        this.tipsLb.node.active = buyCnt < needCnt;
        this.tipsLb.string = `再开启${needCnt - buyCnt}次后，即可永久获得`;

        // 重置时间
        let resetTime = utils.getStageTimeStamp(2) + 60 * 60 * 24 * 7;
        let warnTime = moduleCfg.BattlePassWarningTime;
        let remainTime = resetTime - serverTime.currServerTime();
        if (this._scheduleId)
            scheduleManager.unschedule(this._scheduleId);

        if (remainTime > 0 && remainTime < warnTime) {
            this.reaminTimeLb.string = `${utils.getTimeInterval(remainTime)}后重置`;
            this._scheduleId = scheduleManager.schedule(() => {
                remainTime = remainTime - 1;
                if (remainTime > 0) {
                    this.reaminTimeLb.string = `${utils.getTimeInterval(remainTime)}后重置`;
                } else {
                    this.reaminTimeLb.string = "";
                }
            }, 1)
        } else {
            this.reaminTimeLb.string = "";
        }

        // 战令描述
        let dialogCfg = configUtils.getDialogCfgByDialogId(99000043);
        if (dialogCfg) {
            this.introLb.string = dialogCfg.DialogText;
        }
    }

    closeView(){
        super.closeView();
        blurManager.snap();
    }

}