/*
 * @Author: xuyang
 * @Date: 2021-07-05 19:17:31
 * @Description: PVE极限试炼-云端梦境
 */
import { utils } from "../../../app/AppUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { cloudDreamEvent, } from "../../../common/event/EventData";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { serverTime } from "../../models/ServerTime";
import { pveDataOpt } from "../../operations/PveDataOpt";
import { pveTrialData } from "../../models/PveTrialData";
import { gamesvr } from "../../../network/lib/protocol";
import { VIEW_NAME } from "../../../app/AppConst";
import { redDotMgr, RED_DOT_MODULE } from "../../../common/RedDotManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import ItemBag from "../view-item/ItemBag";
import moduleUIManager from "../../../common/ModuleUIManager";
import PVECloudLessonItem from "./PVECloudLessonItem";
import {scheduleManager} from "../../../common/ScheduleManager";
import guiManager from "../../../common/GUIManager";
import { pveData } from "../../models/PveData";
import { preloadHeadCirclePool } from "../../../common/res-manager/Preloaders";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PVECloudDreamView extends ViewBaseComponent {

    @property(cc.Layout) mainLayout: cc.Layout = null;
    @property(cc.Node)   tempLesson: cc.Node = null;
    @property(cc.Node)   prizeNode: cc.Node = null;
    @property(cc.Label)  chapterLb: cc.Label = null;
    @property(cc.Label)  reloadTimeLb: cc.Label = null;
    @property(cc.Node)   prizeBtn: cc.Node = null;
    @property(cc.Node)   prizeTxt: cc.Node = null;

    private _scheduleId: number = 0;
    private _chapterId: number = 0;
    private _reloadTime: number = 0;
    private _itemBags: ItemBag[] = [];
    private _sprLoader: SpriteLoader = new SpriteLoader();
    private _chapterCfg: cfg.PVECloudDreamChapter = null;       //PVE章节列表
    private _lessonCfgs: cfg.PVECloudDreamLesson[] = [];        //PVE关卡列表

    preInit(...rest: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            preloadHeadCirclePool().start(() => {
                resolve(true);
            })
        })
    }

    onInit(moduleId: number) {
        guiManager.addCoinNode(this.node, moduleId);
        this.registerEvent();
        // 请求活动相关配置
        pveDataOpt.reqGetTrialCloudInfo();
    }

    deInit() {
        guiManager.removeCoinNode(this.node);
        
        this._clearItems();
        this._clearMainItems();
        this._sprLoader.release();
    }

    private _clearItems() {
        this._itemBags.forEach(_i => {
            _i.node.removeFromParent();
            ItemBagPool.put(_i)
        })
        this._itemBags = [];
    }

    private _clearMainItems(){
        let children = [...this.mainLayout.node.children]
        children.forEach(child =>{
            let cloudItem = child.getComponent(PVECloudLessonItem);
            if (cloudItem){
                cloudItem.deInit();
            }
            child.destroy();
        })
    }

    registerEvent() {
        eventCenter.register(cloudDreamEvent.FINISH_PVE_RES, this, this.prepareData);
        eventCenter.register(cloudDreamEvent.SYNC_CLOUD_INFO, this, this.prepareData);
        eventCenter.register(cloudDreamEvent.TAKE_REWARD_RES, this, this.recvTakeRewardRes);
    }

    onRelease() {
        this.deInit();
        this.releaseSubView();
        this.mainLayout.node.removeAllChildren();
        scheduleManager.unschedule(this._scheduleId);
        eventCenter.unregisterAll(this);
    }

    onRefresh(){
        this.refreshView();
    }

    prepareData() {
        let lessonCfgs = configManager.getConfigList("cloudDreamLesson");
        let cloudInfo = pveTrialData.cloudInfo;

        this._chapterId = pveTrialData.cloudChapId;
        this._lessonCfgs = lessonCfgs.filter(cfg=>{
            return cfg.PVECloudDreamLessonChapter == this._chapterId;
        });
        this._chapterCfg = configManager.getConfigByKey("cloudDreamChapter", this._chapterId);
        // 每周一重置时间
        this._reloadTime = cloudInfo ? utils.longToNumber(cloudInfo.NextTime) : 0;

        this.refreshView();
        redDotMgr.fire(RED_DOT_MODULE.PVE_EXTREME_TOGGLE);
    }

    refreshView() {
        let timeStr = utils.getTimeInterval(this._reloadTime - serverTime.currServerTime());
        let cloudData = pveTrialData.cloudData;
        let chapterPassed = this._lessonCfgs.every((lesson)=>{
            return !!(cloudData.TrialCloudDreamPassLessonMap
                && cloudData.TrialCloudDreamPassLessonMap.hasOwnProperty(lesson.PVECloudDreamLessonId+''));
        });

        //奖励道具展示
        this._clearItems();
        if (this._chapterCfg.PVECloudDreamChapterRewardShow) {
            let parseArr = utils.parseStingList(this._chapterCfg.PVECloudDreamChapterRewardShow);
            parseArr.forEach((ele, index) => {
                if (ele && ele.length) {
                    let itemNode = ItemBagPool.get().node;
                    let item = itemNode.getComponent(ItemBag);
                    item.init({
                        id: parseInt(ele[0]),
                        count: parseInt(ele[1]),
                        prizeItem: true,
                        clickHandler: () => { moduleUIManager.showItemDetailInfo(parseInt(ele[0]), parseInt(ele[1]), this.node); }
                    })
                    // 新创建节点，加入回收池
                    itemNode.parent = this.prizeNode;
                    this._itemBags.push(item);
                }
            })
        }

        let isRecved = !!(pveTrialData.cloudData.ReceiveRewardMap && pveTrialData.cloudData.ReceiveRewardMap[`${this._chapterId}`]);
        this.prizeTxt.active = !chapterPassed && !isRecved;
        this.prizeBtn.active = chapterPassed && !isRecved;

        //关卡信息展示，立绘、描述、场景等配置由服务生成
        this._lessonCfgs.forEach((lesson, idx)=>{
            let item = this.mainLayout.node.children[idx] || cc.instantiate(this.tempLesson);
            let itemScript  = item.getComponent(PVECloudLessonItem);
            !item.parent && (item.parent = this.mainLayout.node);
            itemScript.init(lesson.PVECloudDreamLessonId, this._getCloudDreamBanHeros.bind(this));
        })
        this.mainLayout.updateLayout();
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
                    //主动请求获取同步信息
                    pveDataOpt.reqGetTrialCloudInfo();
                    pveTrialData.clearTrailCloudData();
                }
            }, 1)
        }
        this.reloadTimeLb.string = `重置时间：${timeStr}后`;
        this.chapterLb.string = `${this._chapterCfg.PVECloudDreamChapterName}`;
    }

    /**
     * @desc 奖励预览界面
     */
    onClickRewardShow(){
        this.loadSubView("PVECloudDreamRewardView");
    }

    onClickTakeReward(){
        pveDataOpt.reqTakeCloudReward(this._chapterId);
    }

    recvTakeRewardRes(cmd:any, msg:gamesvr.TrialCloudDreamReceiveRewardRes){
        this.loadSubView(VIEW_NAME.GET_ITEM_VIEW, msg.Prizes);
        //章节信息同步
        this.prepareData();
        redDotMgr.fire(RED_DOT_MODULE.PVE_EXTREME_TOGGLE);
    }

    //获取云端梦境单关禁用英雄
    private _getCloudDreamBanHeros(lessonID: number): number[] {
        if(!this._lessonCfgs || this._lessonCfgs.length == 0) return null;
        let banHeros: number[] = null;
        this._lessonCfgs.forEach(ele => {
            if(ele.PVECloudDreamLessonId == lessonID) return;
            if(!pveTrialData.cloudData || !pveTrialData.cloudData.TrialCloudDreamPassLessonMap
                || !pveTrialData.cloudData.TrialCloudDreamPassLessonMap.hasOwnProperty(ele.PVECloudDreamLessonId+'')
            ){
                return;
            }

            let usedHeros = pveTrialData.cloudData.TrialCloudDreamPassLessonMap[ele.PVECloudDreamLessonId+''];
            if(usedHeros && usedHeros.UseHeroMap) {
                for(let k in usedHeros.UseHeroMap) {
                    banHeros = banHeros || [];
                    banHeros.push(parseInt(k));
                }
            }
        })
        return banHeros;
    }
}
