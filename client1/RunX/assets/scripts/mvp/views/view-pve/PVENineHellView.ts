/*
 * @Author: xuyang
 * @Date: 2021-07-05 19:17:31
 * @Description: PVE 试炼玩法通用主线界面
 */
import { RES_ICON_PRE_URL } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { nineHellEvent } from "../../../common/event/EventData";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { pveTrialData } from "../../models/PveTrialData";
import { serverTime } from "../../models/ServerTime";
import { pveDataOpt } from "../../operations/PveDataOpt";
import List from "../../../common/components/List";
import PVENineHellLessonItem from "./PVENineHellLessonItem";
import {scheduleManager} from "../../../common/ScheduleManager";
import guiManager from "../../../common/GUIManager";

const { ccclass, property } = cc._decorator;
@ccclass
export default class PVENineHellView extends ViewBaseComponent {
    @property(List) listView: List = null;
    @property(cc.Sprite) heroImg: cc.Sprite = null;
    @property(cc.Label) reloadTimeLb: cc.Label = null;           //重置时间

    private _pveID: number = 0;
    private _pveCfg: cfg.PVEList = null;
    private _scheduleId: number = 0;
    private _reloadTime: number = 0;
    private _sprLoader: SpriteLoader = new SpriteLoader();
    private _pveNineHellLesson: cfg.PVECopy[] = null;       //PVE数据列表
    private _refreshCnt: number = 0; // 页面刷新标记， 非0时表示需要刷新

    preInit(pveID: number) : Promise<any>{
        this._pveID = pveID;
        this._pveCfg = configManager.getConfigByKey("pveList", this._pveID);
        guiManager.addCoinNode(this.node, pveID);
        return Promise.resolve(true);
    }

    onInit(pveID: number) {
        this._initLessonCfgs();
        this._registerEvent();
        this._refreshCnt += 1;
        pveDataOpt.reqGetTrialHellInfo();
    }

    onRelease() {
        eventCenter.unregisterAll(this);
        this.unscheduleAllCallbacks();
        if(this._scheduleId) {
            scheduleManager.unschedule(this._scheduleId);
            this._scheduleId = 0;
        }
        guiManager.removeCoinNode(this.node);
        this.listView._deInit();
        this._pveNineHellLesson = null;
        this._refreshCnt = 0;
        this._sprLoader.release();
    }

    onRefresh() {
        if(!this._refreshCnt) return;
        this._refreshCnt = 0;
        this._prepareData();
    }

    private _registerEvent() {
        eventCenter.register(nineHellEvent.FINISH_PVE_RES, this, this._updateView);
        eventCenter.register(nineHellEvent.SYNC_HELL_INFO, this, this._updateView);
    }

    onListRender(itemNode: cc.Node, idx: number) {
        let item = itemNode.getComponent(PVENineHellLessonItem);
        let cfg = this._pveNineHellLesson[idx];
        item.init(cfg);
    }

    private _updateView() {
        if(this.node.activeInHierarchy) {
            this._prepareData();
        } else {
            this._refreshCnt += 1;
        }
    }

    private _prepareData(pID?: number) {
        this._reloadTime = pveTrialData.hellInfo.NextTime;
        this._refreshView();
    }

    private _refreshView() {
        let heroUrl = `${RES_ICON_PRE_URL.HERO_PHOTO}/${this._pveCfg.PVEListLessonBgImage}`;
        let timeStr = utils.getTimeInterval(this._reloadTime - serverTime.currServerTime())
        this._sprLoader.changeSprite(this.heroImg, heroUrl);
        //启动倒计时刷新
        let remainTime = this._reloadTime - serverTime.currServerTime();
        if (remainTime > 0) {
            scheduleManager.unschedule(this._scheduleId);
            this._scheduleId = scheduleManager.schedule(() => {
                let remainTime = this._reloadTime - serverTime.currServerTime();
                if (remainTime > 0) {
                    let timeStr = utils.getTimeInterval(remainTime);
                    this.reloadTimeLb.string = `重置时间：${timeStr}后`;
                } else {
                    pveDataOpt.reqGetTrialHellInfo();
                    pveTrialData.clearTrailMiracleData();
                }
            }, 60)
            this.reloadTimeLb.string = `重置时间：${timeStr}后`;
            this.scheduleOnce(() => {
                this.listView.numItems = this._pveNineHellLesson.length;
            })
        }
    }

    private _initLessonCfgs() {
        if(this._pveNineHellLesson) return;
        this._pveNineHellLesson = this._pveNineHellLesson || [];

        let configs = configManager.getConfigKeys("pveCopy");
        configs && configs.forEach(ele => {
            let pveCfg: cfg.PVECopy = configManager.getConfigByKey('pveCopy', ele);
            if(!pveCfg || pveCfg.PVECopyType != 1) return;
            this._pveNineHellLesson.push(pveCfg);
        });
    }
}
