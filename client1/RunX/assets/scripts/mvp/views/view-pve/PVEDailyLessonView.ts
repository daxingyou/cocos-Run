/*
 * @Author: xuyang
 * @Date: 2021-07-05 19:17:31
 * @Description: PVE 试炼玩法通用主线界面
 */
import { CustomDialogId, RES_ICON_PRE_URL, SCENE_NAME, VIEW_NAME } from "../../../app/AppConst";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { LESSON_TYPE, PVE_MODE } from "../../../app/AppEnums";
import { PveConfig } from "../../../app/AppType";
import { utils } from "../../../app/AppUtils";
import { cfg } from "../../../config/config";
import { bagData } from "../../models/BagData";
import { pveData } from "../../models/PveData";
import { userData } from "../../models/UserData";
import { configUtils } from "../../../app/ConfigUtils";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { dailyLessonEvent } from "../../../common/event/EventData";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import List from "../../../common/components/List";
import guiManager from "../../../common/GUIManager";
import PVELessonListItem from "./PVELessonListItem";
import { localStorageMgr, SAVE_TAG } from "../../../common/LocalStorageManager";
import { data, gamesvr } from "../../../network/lib/protocol";
import { pveDataOpt } from "../../operations/PveDataOpt";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PVEDailyLessonView extends ViewBaseComponent {

    @property(List) listView: List = null;
    @property(cc.Sprite) heroImg: cc.Sprite = null;
    @property(cc.Toggle) toggleInitTeam: cc.Toggle = null;
    @property(cc.Node) remainNode: cc.Node = null;      //普通剩余挑战次数
    @property(cc.Node) doubleNode: cc.Node = null;      //高倍剩余挑战次数
    @property(cc.Label) title: cc.Label = null;

    private _pveID: number = 0;
    private _pveCfg: cfg.PVEList = null;
    private _sprLoader: SpriteLoader = new SpriteLoader();
    private _pveDailyLesson: cfg.PVEDailyLesson[] = [];       //PVE数据列表
    private _oldUseDefaultTeam: boolean = false;

    onInit(pveID: number) {
        this._pveID = pveID;
        this._oldUseDefaultTeam = localStorageMgr.getAccountStorage(SAVE_TAG.PVE_MODE_DEFAULT_TEAM.replace(/%d/, this._pveID +''));
        this._oldUseDefaultTeam = !!this._oldUseDefaultTeam;
        this.registerEvent();
        this.prepareData(pveID);
        guiManager.addCoinNode(this.node, pveID);
    }

    deInit() {
        this._sprLoader.release();
    }

    registerEvent() {
        eventCenter.register(dailyLessonEvent.FINISH_PVE_DAILY_RES, this, this.refreshView);
        eventCenter.register(dailyLessonEvent.SWEET_PVE_RES, this, this._onRecvSweetPveRes);
    }

    onRelease() {
        guiManager.removeCoinNode(this.node);
        this.deInit();
        this.releaseSubView();
        this.unscheduleAllCallbacks();
        this.listView._deInit();
        eventCenter.unregisterAll(this);
    }

    onListRender(itemNode: cc.Node, idx: number) {
        let item = itemNode.getComponent(PVELessonListItem);
        let cfg = this._pveDailyLesson[idx];
        item.init(cfg, false, (viewName:string, ...args:any[])=>{
            args.push(this._mopUpLesson.bind(this));
            this.loadSubView(viewName, ...args);
        }, (lessonId: number) => {
            this.enterPveGame(lessonId);
        }, true);
    }

    prepareData(pID?: number) {
        let configs = configManager.getConfigs("pveDailyLesson");
        this._pveCfg = configManager.getConfigByKey("pveList", this._pveID);
        this._pveDailyLesson.length = 0;
        for (let k in configs) {
            let cfg: cfg.PVEDailyLesson = configs[k];
            if (cfg.PVEDailyLessonBelong == this._pveID) {
                this._pveDailyLesson.push(cfg);
            }
        }
        this.refreshView();
    }

    refreshView() {
        this.toggleInitTeam.isChecked = this._oldUseDefaultTeam;
        //挑战次数
        let numShow = utils.parseStingList(this._pveCfg.PVEListNumShow)[0];
        let num = bagData.getItemCountByID(parseInt((numShow[1])));
        let itemcfg = configUtils.getItemConfig(parseInt((numShow[1])));
        let url = `${RES_ICON_PRE_URL.BAG_ITEM}/${itemcfg.ItemIcon}`;
        let heroUrl = `${RES_ICON_PRE_URL.HERO_PHOTO}/${this._pveCfg.PVEListLessonBgImage}`;
        this.doubleNode.active = numShow[0] == 2;
        if (this.doubleNode.active) {
            this._refreshDoubleToggle(num);
        }
        this._sprLoader.changeSprite(this.heroImg, heroUrl);
        this.unscheduleAllCallbacks()
        this.scheduleOnce(() => {
            this.listView.numItems = this._pveDailyLesson.length;
        })
        this.title.string = this._pveCfg.PVEListName;
    }

    private _refreshDoubleToggle(num?: number) {
        if (!this.doubleNode.active) return;
        let cacheFlag = `DOUBLE_${this._pveID}_${userData.uId}`;
        if(typeof num == 'undefined'){
            let numShow = utils.parseStingList(this._pveCfg.PVEListNumShow)[0];
            num = bagData.getItemCountByID(parseInt((numShow[1])));
        }
        let remainCnt = this.doubleNode.getComponentInChildren(cc.Label);
        let doubleTog = this.doubleNode.getComponentInChildren(cc.Toggle);
        remainCnt.string = `高倍次数：${num}`;
        let check = localStorageMgr.getAccountStorage(cacheFlag) != false;
        doubleTog.isChecked = !!num && check;
    }

    enterPveGame(lessionId: number){
        let isUseInitTeam = this.toggleInitTeam.isChecked;
        let doubleTog = this.doubleNode.getComponentInChildren(cc.Toggle);
        let lessonCfg:cfg.PVEDailyLesson = configManager.getConfigByKey("pveDailyLesson", lessionId);
        if(!lessonCfg) return;

        let pveConfig: PveConfig = {
            lessonId: lessionId,
            userLv: userData.lv,
            useDefaultSquad: isUseInitTeam,
            pveMode: PVE_MODE.DAILY_LESSON,
            dailyCfg: lessonCfg,
            doubleDrop: doubleTog && doubleTog.isChecked,
            pveListId: lessonCfg.PVEDailyLessonBelong
        }
        pveData.pveConfig = pveConfig;

        if(this._oldUseDefaultTeam != isUseInitTeam){
            localStorageMgr.setAccountStorage(SAVE_TAG.PVE_MODE_DEFAULT_TEAM.replace(/%d/, this._pveID + ''), isUseInitTeam);
            this._oldUseDefaultTeam = isUseInitTeam;
        }

        // 高倍道具检测
        if (lessonCfg && this.doubleNode.active) {
            //检查高倍道具是否足够
            let pasrseInfo = utils.parseStingList(lessonCfg.PVEDailyLessonDoubleDropCost)[0];
            let toggle = this.doubleNode.getComponentInChildren(cc.Toggle);
            if (pasrseInfo.length && toggle.isChecked) {
                let haveCount = bagData.getItemCountByID(parseInt(pasrseInfo[0]));
                if (!(haveCount && haveCount >= parseInt(pasrseInfo[1]))) {
                    let dialogCfg = configUtils.getDialogCfgByDialogId(CustomDialogId.PVE_DOUBLE_ITEM_NO_ENOUGH);
                    let nameStr = configUtils.getItemConfig(parseInt(pasrseInfo[0])).ItemName;
                    let text = utils.convertFormatString(dialogCfg.DialogText, [{ itemname: nameStr }]);
                    guiManager.showTips(text);
                    return;
                }
            }
        }

        if (lessonCfg.PVEDailyLessonType == LESSON_TYPE.Battle){
            guiManager.loadScene(SCENE_NAME.BATTLE);
        } else if (lessonCfg.PVEDailyLessonType == LESSON_TYPE.Parkour){
            if (isUseInitTeam){
                let localTeam:number[] = localStorageMgr.getAccountStorage(SAVE_TAG.PARKOUR_LAST_TEAM) || []
                if (!localTeam || localTeam.length === 0) {
                    let heroHad = bagData.heroList;
                    heroHad.sort((hero1, hero2) => {
                        let heroUnit1 = bagData.getHeroById(hero1.ID);
                        let heroUnit2 = bagData.getHeroById(hero2.ID);
                        return heroUnit2.getCapability() - heroUnit1.getCapability();
                    })
                    localTeam = heroHad.map(hero => { return hero.ID }).slice(0, 5);
                }
                guiManager.loadScene(SCENE_NAME.RUN_COOL, null, localTeam.filter((hero) => {
                    return hero != 0;
                }));
                return;
            }
            guiManager.loadView(VIEW_NAME.PARKOUR_PREPARE_VIEW, null, null);
            pveConfig.pveMode = PVE_MODE.DAILY_LESSON;
        }
    }

    // 高倍选中回调
    onDoubleToggleChecked(target:cc.Toggle){
        let show = this.doubleNode.active;
        let cacheFlag = `DOUBLE_${this._pveID}_${userData.uId}`;
        if(show && target.isChecked){
            let numShow = utils.parseStingList(this._pveCfg.PVEListNumShow)[0];
            let num = bagData.getItemCountByID(parseInt((numShow[1])));
            if (!num){
                target.isChecked = false;
                let dialogCfg = configUtils.getDialogCfgByDialogId(CustomDialogId.PVE_DOUBLE_ITEM_NO_ENOUGH);
                let nameStr = configUtils.getItemConfig(parseInt(numShow[1])).ItemName;
                let text = utils.convertFormatString(dialogCfg.DialogText, [{ itemname: nameStr }]);
                guiManager.showTips(text);
            } else {
                localStorageMgr.setAccountStorage(cacheFlag, target.isChecked);
            }
        } else if (show) {
            localStorageMgr.setAccountStorage(cacheFlag, target.isChecked);
        }
    }

    private _mopUpLesson(lessonID: number, count: number){
        let doubleTog = this.doubleNode.getComponentInChildren(cc.Toggle);
        pveDataOpt.reqMopUpLesson(lessonID, (doubleTog && doubleTog.isChecked), count);
    }

    private _onRecvSweetPveRes(cmd: number, prizes: data.IItemInfo[]) {
        this._refreshDoubleToggle();
        this._sortPrizes(prizes);
        guiManager.loadView(VIEW_NAME.GET_ITEM_VIEW, this.node, prizes);
    }

    private _sortPrizes(prizes: data.IItemInfo[]) {
        if(prizes.length > 0) {
            let getOrderFunc = (id: number): number => {
                let cfg = configUtils.getItemConfig(id);
                if(cfg) {
                    return cfg.ProduceOrder ? cfg.ProduceOrder : 9999;
                }
                let eCfg = configUtils.getEquipConfig(id);
                if(eCfg) {
                    let configModule = configUtils.getConfigModule('ProduceOrderEquip');
                    return configModule ? configModule : 9999;
                }
                let hCfg = configUtils.getHeroBasicConfig(id);
                if(hCfg) {
                    let configModule = configUtils.getConfigModule('ProduceOrderHero');
                    return configModule ? configModule : 9999;
                }
                return 9999;
            }
            prizes.sort((_a, _b) => {
                let _aOrder = getOrderFunc(_a.ID);
                let _bOrder = getOrderFunc(_b.ID);
                return _aOrder - _bOrder;
            });
        }

        return prizes;
    }
}
