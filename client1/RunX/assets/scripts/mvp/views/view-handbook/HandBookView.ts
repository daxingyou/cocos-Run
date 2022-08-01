/*
 * @Author: xuyang
 * @Date: 2021-06-19 15:02:26
 * @Description: 商店主界面
 */
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { cfg } from "../../../config/config";
import { bagData } from "../../models/BagData";
import { CustomItemId, VIEW_NAME } from "../../../app/AppConst";
import { redDotMgr, RED_DOT_MODULE } from "../../../common/RedDotManager";
import List from "../../../common/components/List";
import ListItem from "../../../common/components/ListItem";
import guiManager from "../../../common/GUIManager";
import HeroListItem from "../view-hero/HeroListItem";
import moduleUIManager from "../../../common/ModuleUIManager";
import { ItemHeroListPool } from "../../../common/res-manager/NodePool";
import { preloadItemHeroListPool } from "../../../common/res-manager/Preloaders";
import { audioManager, SFX_TYPE } from "../../../common/AudioManager";
import { taskDataOpt } from "../../operations/TaskDataOpt";
import GetAllRewardBtn from "../view-common/GetAllRewardBtn";
import { configUtils } from "../../../app/ConfigUtils";
import { utils } from "../../../app/AppUtils";
import { taskData } from "../../models/TaskData";
import { eventCenter } from "../../../common/event/EventCenter";
import { taskEvent } from "../../../common/event/EventData";
import { gamesvr } from "../../../network/lib/protocol";
import StepWork from "../../../common/step-work/StepWork";
import HeroUnit from "../../template/HeroUnit";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { HEAD_ICON } from "../../../app/AppEnums";
import { CACHE_MODE, resourceManager } from "../../../common/ResourceManager";
import TempNodePool from "../../../common/components/TempNodePool";
const { ccclass, property } = cc._decorator;
enum PAGE_MODE {
    PROP,
    RECHARGE,
    GIFT,
}

@ccclass
export default class HandBookView extends ViewBaseComponent {

    @property(cc.Label) heroHoldTxt: cc.Label = null;
    @property(cc.Label) pointTxt: cc.Label = null;
    @property(List) listView: List = null;
    @property(cc.Node) getAllBtn: cc.Node = null;

    private _moduleId: number = 0;
    private _pageMode: PAGE_MODE = -1;
    private _heros: number[] = [];

    private _imgUrls: string[] = [];   // 预加载并缓存图片Url,释放时使用

    preInit(...rest: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            // 预加载所有英雄图片避免卡顿，如影响内存，考虑移除
            let stepWork = this._preloadImages();

            preloadItemHeroListPool().concact(stepWork).start(() => {
                resolve(true);
            });
        });
    }

    private _preloadImages() {
        let self = this;
        return new StepWork().addTask((cb: Function) => {
            // 英雄大图
            let configs = configManager.getConfigs("handBook");
            let config: cfg.HandBook = null;
            let keys: string[] = configManager.getConfigKeys("handBook");
            for (let i = 0; i < keys.length; ++i) {
                config = configs[keys[i]];
                if (config && config.HandBookHeroID && config.HandBookOpen) {
                    let heroUnit = bagData.getHeroById(Number(keys[i])) || new HeroUnit(Number(keys[i]));
                    let heroUrl = resPathUtils.getItemIconPath(heroUnit.basicId, HEAD_ICON.BIG);
                    self._imgUrls.push(heroUrl);
                }
            }

            // 列表底图、名称地图、星星底图
            let qualities: string[] = configManager.getConfigKeys("quality");
            for (let i = 0; i < qualities.length; ++i) {
                self._imgUrls.push(resPathUtils.getQualityHeroListBg(Number(qualities[i]), "heroBg"));
                self._imgUrls.push(resPathUtils.getQualityHeroListBg(Number(qualities[i]), "starBg"));
                self._imgUrls.push(resPathUtils.getQualityHeroListBg(Number(qualities[i]), "nameBg"));
            }

            if (self._imgUrls.length === 0) {
                cb();
                return;
            }

            let count = self._imgUrls.length;
            for (let i = 0; i < self._imgUrls.length; ++i) {
                resourceManager.load(self._imgUrls[i], cc.SpriteFrame, CACHE_MODE.NONE).then(()=> {
                    count -= 1;
                    if (count === 0) {
                        cb();
                    }
                });
            }

        });
    }

    private _releaseImages() {
        for (let i = 0; i < this._imgUrls.length; ++i) {
            resourceManager.release(this._imgUrls[i], CACHE_MODE.NONE);
        }
        this._imgUrls = [];
    }

    onInit(moduleId: number, partId: PAGE_MODE, subId: number) {
        this._moduleId = moduleId;
        eventCenter.register(taskEvent.RECEIVE_REWARD, this, this._recvTaskReceiveReward);
        
        this.listView.setupExternalPool(ItemHeroListPool);
        
        this.prepareData();
        guiManager.addCoinNode(this.node);
    }

    onRefresh() {
        this.prepareData();
    }

    prepareData () {
        if(!this._heros || this._heros.length == 0) {
            let allHeros = configManager.getConfigs("handBook");
            for(let key in allHeros) {
                if(allHeros.hasOwnProperty(key) && allHeros[key] && allHeros[key]['HandBookHeroID'] && allHeros[key]['HandBookOpen']) {
                    this._heros = this._heros || [];
                    this._heros.push(parseInt(key));
                }
            }

            this._heros.sort((_heroA, _heroB) => {
                let heroACfg: cfg.HandBook = configUtils.getHandBookCfgByHeroID(_heroA);
                let heroBCfg: cfg.HandBook = configUtils.getHandBookCfgByHeroID(_heroB);
                return (heroACfg.HandBookHeroOrder || 0) - (heroBCfg.HandBookHeroOrder || 0);
            });
        }

        let holdCnt = 0;
        this._heros && this._heros.forEach(hero => {
            let cfg = configUtils.getHandBookCfgByHeroID(hero);
            if(cfg && bagData.getItemByID(cfg.HandBookHeroID)) {
                holdCnt++;
            }
        });

        this.heroHoldTxt.string = `已获得英雄：${holdCnt}/${this._heros.length}`;
        let point = bagData.getItemCountByID(CustomItemId.PRAGMATIC_SKILL_POINT);
        this.pointTxt.string = `可使用修炼点：${point}`;
        this.listView.numItems = this._heros.length;
        this.scheduleOnce(() => {
            this._updateGetAllRewardBtn();
        });
    }

    onListRender(item: cc.Node, idx: number) {
        let script = item.getComponent(HeroListItem);
        let listItemScript = item.getComponent(ListItem);
        script.onlyShow = true;
        script.setData(this._heros[idx], RED_DOT_MODULE.HERO_HANDBOOK_ITEM);
        listItemScript.clearSelectFlag();
    }

    onClickGoPromote(){
        moduleUIManager.jumpToModule(19000, 1);
    }

    onSelectRender(item: cc.Node, sID: number) {
        guiManager.loadModuleView("HandBookHeroView", 0, this._heros[sID], this._heros);
        audioManager.playSfx(SFX_TYPE.BUTTON_CLICK);
    }

    onRelease(){
        eventCenter.unregisterAll(this);
        this.releaseSubView();
        this.unscheduleAllCallbacks();
        guiManager.removeCoinNode(this.node);
        this.listView._deInit();
        this._releaseImages();
    }

    //一键领取
    onClickAutoTake(){
        let completedTasks = this._getReceivebleTasks()
        if(!completedTasks || completedTasks.length == 0){
            let getAllRewardBtn = this.getAllBtn.getComponent(GetAllRewardBtn);
            if(cc.isValid(getAllRewardBtn))  getAllRewardBtn.showNotReward();
            return;
        }
        taskDataOpt.sendReceiveTaskReward(completedTasks);
    }

    private _getReceivebleTasks(): number[]{
        if(!this._heros || this._heros.length == 0) return null;
        let tasks: number[] = null;
        this._heros.forEach(ele => {
            let cfg = configUtils.getHandBookCfgByHeroID(ele);
            if(!cfg || !cfg.HandBookHeroTask || cfg.HandBookHeroTask.length == 0) return;
            let taskStr = cfg.HandBookHeroTask;
            let tasksArr = utils.parseStringTo1Arr(taskStr, ';');
            if(!tasksArr || tasksArr.length == 0) return;
            tasksArr.forEach(taskID => {
                let task = parseInt(taskID);
                let aCompleted: boolean = taskData.getTaskIsCompleted(task);
                let aReceivedReward: boolean = taskData.getTaskIsReceiveReward(task);
                if(aCompleted && !aReceivedReward){
                    tasks = tasks || [];
                    tasks.push(task);
                }
            });
        });
        return tasks;
    }

    //更新一键领取按钮状态
    private _updateGetAllRewardBtn(){
        let getAllRewardBtn = this.getAllBtn.getComponent(GetAllRewardBtn);
        if(!cc.isValid(getAllRewardBtn)) return;
        getAllRewardBtn.gray = !this._checkRecvAble();
    }

    private _checkRecvAble(): boolean {
        if(!this._heros || this._heros.length == 0) return false;
        return this._heros.some(ele => {
            let cfg = configUtils.getHandBookCfgByHeroID(ele);
            if(!cfg || !cfg.HandBookHeroTask || cfg.HandBookHeroTask.length == 0) return false;
            let taskStr = cfg.HandBookHeroTask;
            let tasksArr = utils.parseStringTo1Arr(taskStr, ';');
            if(!tasksArr || tasksArr.length == 0) return false;
            return tasksArr.some(taskID => {
                let task = parseInt(taskID);
                let aCompleted: boolean = taskData.getTaskIsCompleted(task);
                let aReceivedReward: boolean = taskData.getTaskIsReceiveReward(task);
                return aCompleted && !aReceivedReward;
            });
        });
    }

    private _recvTaskReceiveReward(eventId: number, msg: gamesvr.TaskTargetReceiveRewardRes){
        //当前页面不是正在打开的页面
        if(!this.node.activeInHierarchy) return;
        if (msg && msg.Prizes){
            this.loadSubView(VIEW_NAME.GET_ITEM_VIEW, msg.Prizes);
            this._updateGetAllRewardBtn();
            redDotMgr.fire(RED_DOT_MODULE.MAIN_HERO_HANDBOOK);
        }
    }
}
