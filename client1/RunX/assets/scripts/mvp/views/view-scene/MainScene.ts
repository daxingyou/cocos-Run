import { CustomDialogId, FIRST_CHARGE_FUNC_ID, RES_ICON_PRE_URL, VIEW_NAME } from "../../../app/AppConst";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { bagDataEvent, chatEvent, commonEvent, hangUpEvent, pragmaticEvent, shopEvent, timeLimitEvent, useInfoEvent } from "../../../common/event/EventData";
import { configUtils } from "../../../app/ConfigUtils";
import { userData } from "../../models/UserData";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { data, gamesvr } from "../../../network/lib/protocol";
import { chatData } from "../../models/ChatData";
import guiManager from "../../../common/GUIManager";
import List from "../../../common/components/List"
import moduleUIManager from "../../../common/ModuleUIManager";
import { cfg } from "../../../config/config";
import { configManager } from "../../../common/ConfigManager";
import { utils } from "../../../app/AppUtils";
import { serverTime } from "../../models/ServerTime";
import { limitData, TimeLimitData, TIME_LIMIT_TYPE } from "../../models/LimitData";
import ItemHeroShow from "../view-item/ItemHeroShow";
import { logger } from "../../../common/log/Logger";
import { pveData } from "../../models/PveData";
import { pvpData } from "../../models/PvpData";
import { preloadHeadSquarePool, preloadItemBagPool, preloadItemIslandMapTilePool, preloadItemOnlineDetailPool, preloadItemQualityEffectPool, preloadUIPrefab } from "../../../common/res-manager/Preloaders";
import ScrollMsg from "../../../common/components/ScrollMsg";
import netStatusWatcher from "../../../common/components/NetStatusWatcher";
import ItemRedDot from "../view-item/ItemRedDot";
import { RED_DOT_MODULE } from "../../../common/RedDotManager";
import ItemChat from "../view-item/ItemChat";
import { localStorageMgr, SAVE_TAG } from "../../../common/LocalStorageManager";
import { trackData } from "../../models/TrackData";
import StepWork from "../../../common/step-work/StepWork";
import { limitDataOpt } from "../../operations/LimitDataOpt";
import { activityUtils } from "../../../app/ActivityUtils";
import { commonData } from "../../models/CommonData";
import { appCfg } from "../../../app/AppConfig";
import CoinNode from "../../template/CoinNode";
import ItemHangupIcon from "../view-item/ItemHangupIcon";
import LinearSortContainor from "../../../common/components/LinearSortContainor";
import MainDynamicAtyCtrl from "../view-main/MainDynamicAtyCtrl";
import ItemOnlineReward from "../view-online/ItemOnlineReward";


const { ccclass, property } = cc._decorator;

@ccclass
export default class MainScene extends ViewBaseComponent {
    @property(cc.Node) headNode: cc.Node = null;
    @property(cc.Node) frameNode: cc.Node = null;
    @property(cc.ProgressBar) expBar: cc.ProgressBar = null;
    @property(cc.Label) userNameLb: cc.Label = null;
    @property(cc.Label) userLvLb: cc.Label = null;
    @property(cc.Label) fightLb: cc.Label = null;

    @property(cc.Node) bgNode: cc.Node = null;
    @property(cc.Node) itemHeroShow: cc.Node = null;
    @property(cc.Node) leftTopNode: cc.Node = null;
    @property(cc.Node) leftBottomNode: cc.Node = null;
    @property(cc.Node) rightCenterNode: cc.Node = null;
    @property(cc.Node) bottomCenterNode: cc.Node = null;
    @property(cc.Node) blockMask: cc.Node = null;
    @property([cc.Prefab]) bgPrefabs: cc.Prefab[] = [];

    @property(List) chatList: List = null;
    @property(List) pageList: List = null;
    @property(cc.Node) broadcast: cc.Node = null;

    @property(ItemRedDot) heroRedDot: ItemRedDot = null;
    @property(ItemRedDot) handbookRedDot: ItemRedDot = null;
    @property(ItemRedDot) taskRedDot: ItemRedDot = null;
    @property(ItemRedDot) mailRedDot: ItemRedDot = null;
    @property(ItemRedDot) bagRedDot: ItemRedDot = null;
    @property(ItemRedDot) activityRedDot: ItemRedDot = null;
    @property(ItemRedDot) shopRedDot: ItemRedDot = null;
    @property(ItemRedDot) summonRedDot: ItemRedDot = null;
    @property(ItemRedDot) levelMapRedDot: ItemRedDot = null;
    @property(ItemRedDot) pveRedDot: ItemRedDot = null;
    @property(ItemRedDot) guildRedDot: ItemRedDot = null;
    @property(ItemRedDot) divineSystemRedDot: ItemRedDot = null;
    @property(ItemRedDot) characterRedDot: ItemRedDot = null;
    @property(ItemRedDot) treasureRedDot: ItemRedDot = null;

    @property(cc.Label) levelMapTitle: cc.Label = null;
    @property(ItemRedDot) firstChargeRedot: ItemRedDot = null;
    @property(cc.Node) ndGm: cc.Node = null;
    @property(cc.Node) ndTest: cc.Node = null;
    @property(ItemHangupIcon) hangUp: ItemHangupIcon = null;

    @property(LinearSortContainor) bottomContaior: LinearSortContainor = null;
    @property(LinearSortContainor) leftContaior: LinearSortContainor = null;
    @property(LinearSortContainor) rightContaior: LinearSortContainor = null;
    @property(MainDynamicAtyCtrl) mainDynamicAtyCtrl: MainDynamicAtyCtrl = null;

    private _bannerIndex: number = 0;
    private _coinNode: cc.Node = null;
    private _isEnter: boolean = true;
    private _adViewUpdateHandler: Function = null;
    private _bannerList: cfg.AdvertShow[] = [];
    private _msgList: gamesvr.IChatMessageNotify[] = [];
    private _spriteLoader: SpriteLoader = new SpriteLoader();

    onInit() {
        netStatusWatcher.watchNet();
        this._addEvent();
        this.resetView();
        guiManager.isDebug && this.test();
    }

    resetView(){
        this._coinNode = guiManager.addCoinNode(this.node);
        this.bottomContaior.init();
        this.leftContaior.init();
        this.rightContaior.init();
        this.mainDynamicAtyCtrl.init(this);
        this.stepWork
        .addTask(() => {
            this._refreshView();
        }).addTask(() => {
            this._updateChatView();
        }).addTask(() => {
            this._refreshUsrInfo();
            this._updateAdView(); // 首充广告
            this._updateScrollMsg();
        }).addTask(() => {
            this._updateMainBgView();
        }).addTask(()=> {
            this._delayLoadRes();
        }).addTask(()=> {
            if(appCfg.UseTestMoney) {
                this._coinNode.getComponent(CoinNode).showView([[999, 3,2,1]]);
            }
        })
        .concact(preloadItemBagPool())
        .concact(preloadHeadSquarePool())
        .concact(preloadItemQualityEffectPool())
        .concact(preloadItemOnlineDetailPool())
        .concact(preloadItemIslandMapTilePool())
        .concact(this._getDelayRefreshUITask());
        this._refreshDebug();
        this._clearBattleConfigs();
    }
    /**
     * 注册监听事件
     */
    private _addEvent() {
        eventCenter.register(commonEvent.CAPABILITY_CHANGE, this, this._refreshUsrInfo);
        eventCenter.register(useInfoEvent.USER_HEAD_CHANGE, this, this._refreshUsrInfo);
        eventCenter.register(useInfoEvent.USER_NAME_CHANGE, this, this._refreshUsrInfo);
        eventCenter.register(useInfoEvent.USER_EXP_CHANGE, this, this._onUserExpChange);
        eventCenter.register(pragmaticEvent.CHANGE_LEAD_SKILL_SUC, this, this._refreshUsrInfo);
        eventCenter.register(pragmaticEvent.RESET_LEAD_SKILLS_SUC, this, this._refreshUsrInfo);
        eventCenter.register(commonEvent.UPDATE_CAPABILITY, this, this._refreshCapability);

        eventCenter.register(useInfoEvent.USER_MSG_NOTIFY, this, this._updateScrollMsg);
        eventCenter.register(chatEvent.CHAT_NOTIFY, this, this._updateChatView);

        eventCenter.register(timeLimitEvent.RECV_RANDOM_FIGHT_EVENT, this, this._receiveLimitRes);
        eventCenter.register(timeLimitEvent.RECV_RANDOM_SHOP_EVENT, this, this._receiveLimitRes);

        eventCenter.register(shopEvent.BUY_GIFT, this, this._showLimitedGiftBuyRes);
        eventCenter.register(bagDataEvent.ITEM_CHANGE, this, this._onItemChange);
        eventCenter.register(hangUpEvent.HANGUP_REWARD_RES, this, this._updateHangup);
        //限时礼包
        eventCenter.register(timeLimitEvent.REVCE_QUERY_LIMIT_TIME_GIFT_BAG, this, this._showLimitedGiftRes);
        //GM快捷打开
        if(cc.sys.os == cc.sys.OS_WINDOWS){
            cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this._onKeyDown, this);
        }
    }

    //需要使用到预加载内容的主界面UI,放到这里进行刷新
    private _getDelayRefreshUITask() {
        let work = new StepWork();
        work.addTask(() => {
            this._checkNeedUpdateGiftBag(); // 限时礼包
            this._refreshDynamicAty(); // 双周活动-7日活动,梦幻仙缘和云游商人
            this._refreshOnlineRewardItem(); //在线奖励-暂时是放置在主页内，需要使用itemBag
        });
        return work;
    }

    // 更新UI
    private _refreshView() {
        this._refreshRedDot();
        this._refreshAdventure();
        this._updateHangup();

        // 更换背景
        this._isEnter = true;
        this.blockMask.active = false;
    }

    private _refreshUsrInfo() {
        let uInfo = userData.accountData;
        this.userNameLb.string = `${uInfo.Name}`;
        this.userLvLb.string = `${userData.lv}`;
        this._refreshCapability();
        this.expBar.progress = (userData.maxExp) ? (userData.exp || 0) / (userData.maxExp || Infinity) : 1;

        let maxIcon = this.expBar.node.getChildByName('max');
        maxIcon.active = this.expBar.progress == 1 && !userData.maxExp;

        //头像与头像框部分,每次加载前需手动释放引用，但保留最后一次更新头像
        let headUrl = `${RES_ICON_PRE_URL.HEAD_IMG}/` + configUtils.getHeadConfig(uInfo.HeadID).HeadFrameImage;
        let frameUrl = `${RES_ICON_PRE_URL.HEAD_FRAME}/` + configUtils.getHeadConfig(uInfo.HeadFrameID).HeadFrameImage;
        this._spriteLoader.changeSprite(this.headNode.getComponent(cc.Sprite), headUrl);
        this._spriteLoader.changeSprite(this.frameNode.getComponent(cc.Sprite), frameUrl);
    }

    private _onUserExpChange(eventId: number, preUserLv: number) {
        let curLv = userData.lv;
        if (preUserLv && curLv > preUserLv && this.enabled) {
            guiManager.showLevelUpView(preUserLv);
        }

        this._refreshUsrInfo();
    }

    private _refreshCapability() {
        this.fightLb.string = `${userData.capability}`;
    }

    private _refreshAdventure() {
        // 更新章节显示
        const curChapter = pveData.getCurrChapterId();
        const chapterCfg = configUtils.getChapterConfig(curChapter);
        const lessonId = pveData.getCurrLessonId();
        const lessonCfg = configUtils.getLessonConfig(lessonId);
        if(!chapterCfg.ChapterBehind) {
            // 最后一章
            if(lessonCfg.LessonLast) {
                this.levelMapTitle.string = `已全部通关`;
            } else {
                this.levelMapTitle.string = `${chapterCfg.ChapterName}-${lessonCfg.LessonName}`;
            }
        } else {
            this.levelMapTitle.string = `${chapterCfg.ChapterName}-${lessonCfg.LessonName}`;
        }
    }

    private _refreshDebug () {
        this.ndGm.active = false;
        this.ndTest.active = false;

        //#ZQBDEBUG
        this.ndGm.active = true;
        this.ndTest.active = true;
        //ZQBDEBUG#
    }

    private _updateMainBgView () {
        let changeBgInfo = localStorageMgr.getAccountStorage(SAVE_TAG.CHANGE_BG);
        this._updateBgView(changeBgInfo);
        this._updateBgModelView(changeBgInfo);
    }

    private _updateBgView (changeBgInfo: any) {
        let changeBgCfg: cfg.ChangeBg = null;
        if(changeBgInfo && changeBgInfo.bgName != '') {
            changeBgCfg = configManager.getConfigByKV('changeBg', 'ChangeBgImage', changeBgInfo.bgName)[0];
        }
        if(!changeBgInfo || changeBgInfo.bgName == '' || !changeBgCfg) {
            let basicConfig: cfg.ConfigBasic = configUtils.getBasicConfig();
            let mainDefaultBg = basicConfig.MainDefaultBg || 1001;
            changeBgCfg = configUtils.getChangeBgConfig(mainDefaultBg);
        }
        let bgIndex: number = changeBgCfg.ChangeBgNum;
        if(this.bgNode.childrenCount > 0) {
            this.bgNode.removeAllChildren(true);
        }
        let bg = cc.instantiate(this.bgPrefabs[bgIndex - 1]);
        this.bgNode.addChild(bg);
    }

    private _updateBgModelView (changeBgInfo: any) {
        let modelId: number = 0;
        if(changeBgInfo && changeBgInfo.modelId) {
            modelId = changeBgInfo.modelId;
        } else {
            let basicConfig: cfg.ConfigBasic = configUtils.getBasicConfig();
            let mainDefaultHero = basicConfig.MainDefaultHero || 2018;
            modelId = Number(configUtils.getChangeBgConfig(mainDefaultHero).ChangeBgImage);
        }
        if(modelId) {
            let modelCfg: cfg.Model = configUtils.getModelConfig(Number(modelId));
            if(modelCfg) {
                this.itemHeroShow.getComponent(ItemHeroShow).onInit(modelCfg.ModelId);
            }
        }
    }

    switchMainView(type: number, value: string) {
        if(type == 1) {
            let itemHeroShpwCmp = this.itemHeroShow.getComponent(ItemHeroShow);
            let preModelId: number = itemHeroShpwCmp.modelId;
            let modelCfg: cfg.Model = configUtils.getModelConfig(Number(value));
            if(preModelId != modelCfg.ModelId) {
                // TODO 保存数据
                itemHeroShpwCmp.onInit(modelCfg.ModelId);
                let changeBgInfo = {
                    modelId: 0,
                    bgName: ''
                }
                let local = localStorageMgr.getAccountStorage(SAVE_TAG.CHANGE_BG);
                if(local) {
                    changeBgInfo = local;
                }
                if(changeBgInfo.modelId != modelCfg.ModelId) {
                    changeBgInfo.modelId = modelCfg.ModelId;
                    localStorageMgr.setAccountStorage(SAVE_TAG.CHANGE_BG, changeBgInfo);
                }
                this._updateBgModelView(changeBgInfo);
            }
        } else {
            let changeBgInfo = {
                modelId: 0,
                bgName: ''
            }
            let local = localStorageMgr.getAccountStorage(SAVE_TAG.CHANGE_BG);
            if(local) {
                changeBgInfo = local;
                if(changeBgInfo.bgName != value) {
                    changeBgInfo.bgName = value;
                    localStorageMgr.setAccountStorage(SAVE_TAG.CHANGE_BG, changeBgInfo);
                }
            } else {
                changeBgInfo.bgName = value;
                localStorageMgr.setAccountStorage(SAVE_TAG.CHANGE_BG, changeBgInfo);
            }
            this._updateBgView(changeBgInfo);
        }
    }

    private _onItemChange() {
        this.bagRedDot.refreshView();
        // this.handbookRedDot.refreshView();
    }

    private _clearBattleConfigs(){
        pveData.clearPveConfig();
        pvpData.clearPvpConfig();
    }

    onClickGoPVE(event: cc.Event, customEventData: string) {
        let openInfo = activityUtils.checkMeetCond(parseInt(customEventData))
        if (openInfo && openInfo.length > 2) {
            guiManager.showTips(openInfo);
            return;
        }
        guiManager.loadModuleView("PVEHomeView", customEventData);
    }

    onClickGoPVP(event: cc.Event, customEventData: string) {
        let openInfo = activityUtils.checkMeetCond(parseInt(customEventData))
        if (openInfo && openInfo.length > 2) {
            guiManager.showTips(openInfo);
            return;
        }
        guiManager.loadModuleView("PVPHomeView", customEventData);
    }

    onClickGoGMView(){
        guiManager.loadModuleView("GMView");
    }

    onClickGoTestView(){
        // scheduleManager.checkHander()`
        this.loadSubView("SkillTestView");
    }

    onClickHangUp() {
        this.loadSubView('HangUpRewardView');
    }

    /**
     * @desc 模块入口点击
     */
    onClickModule(event: cc.Event, customEventData: string) {
        if (customEventData == "32000") {

        }

        if (customEventData == '36000'){
            this.loadSubView(VIEW_NAME.PARKOUR_PREPARE_VIEW, null, true);
            return;
        }

        //测试字段-在线奖励接口
        if (customEventData == `10086`) {
            guiManager.loadView(VIEW_NAME.ONLINE_REWARD_VIEW, this.node);
            return;
        }

        //测试字段-主线任务接口
        if (customEventData == `10087`) {
            guiManager.loadView(VIEW_NAME.MAIN_TASK_REWARD_VIEW, this.node);
            return;
        }

        // 点击更换主页背景功能
        if(customEventData == '34000') {
            this._switchMainAct(false);
            this.scheduleOnce(() => {
                guiManager.loadModuleView(VIEW_NAME.SWITCH_MAIN_VIEW, (type: number, value: string) => {
                    this.switchMainView(type, value);
                }, () => {
                    this._switchMainAct(true);
                });
            }, 0.35);
            return;
        }

        if (customEventData == `10003`){
            guiManager.loadModuleView("HandBookView");
            return;
        }

        // if(customEventData == '50000') {
        //     let random = Math.round(Math.random() * 10) % 2 == 0 ? true : false;
        //     eventCenter.fire(`test-HeroView-Icon`, random);
        //     return;
        // }

        // 首充
        if(parseInt(customEventData) == FIRST_CHARGE_FUNC_ID){
            commonData.tmpCache.FirstChargeClicked = true;
            this.firstChargeRedot.showRedDot(false);
        }

        let mID = Number(customEventData);
        moduleUIManager.jumpToModule(mID);
    }

    /**
     * @desc 广告banner自动刷新部分
     */
    private _updateAdView() {
        this._bannerList = configManager.getConfigList("advertShow");
        this._bannerList = this._bannerList.filter((cfg)=>{
            let timeOpen = true;
            let functionOpen = true;
            if (cfg.AdvertShowOpenTime && cfg.AdvertShowHoldTime) {
                let activeTime = utils.getActiveTime(cfg.AdvertShowOpenTime, cfg.AdvertShowHoldTime);
                let curTime = serverTime.currServerTime();
                if(activeTime.length>0){
                    timeOpen = activeTime[0]<curTime && activeTime[1]>curTime;
                }
            }
            if (cfg.FunctionID) {
                let errInfo = activityUtils.checkMeetCond(cfg.FunctionID);
                if (errInfo) {
                    functionOpen = false
                }

                if (cfg.FunctionID == FIRST_CHARGE_FUNC_ID){
                    functionOpen &&= trackData.checkFirstCharge();
                }
            }
            return timeOpen && functionOpen;
        });

        this._adViewUpdateHandler && this.unschedule(this._adViewUpdateHandler);
        // 归位
        this.pageList.scrollTo(this._bannerIndex, 0, 0);
        this.pageList.numItems = this._bannerList.length;
        this._adViewUpdateHandler = this._adViewUpdateHandler || (() => {
            if (!this.pageList.scrolling){
                let idx = this.pageList.getCurIndex() || 0;
                this._bannerIndex = idx == this.pageList.numItems ? idx : idx + 1;
                this.pageList.scrollTo(this._bannerIndex, 1, 0);
            }
        });
        this.schedule(this._adViewUpdateHandler, 5)
    }

    private _updateScrollMsg(cmd?: any) {
        let scrollMsg = this.broadcast.getComponent(ScrollMsg);
        scrollMsg.startScroll();
    }
    /**
     * @desc 广告页面刷新
     * @param 单页面 Item
     * @param 刷新页面下标
     */
    onPageListRender(item: cc.Node, idx: number) {
        if (this._bannerList.length == 0 || !this._bannerList[idx]) {
            return;
        }
        let bannerPath = this._bannerList[idx].AdvertShowImage;
        this._spriteLoader.changeSprite(item.getComponentInChildren(cc.Sprite),bannerPath);
    }
    /**
     * @desc 广告页面点击
     * @param item
     * @param selectedId
     */
    onPageListSelected(item: any, selectedId: number, lastSelectedId: number, val: number) {
        if (this._bannerList.length == 0 || !this._bannerList[selectedId]) {
            return;
        }
        let jumStr = this._bannerList[selectedId].AdvertShowJump;
        let parseList = utils.parseStingList(jumStr);
        parseList = jumStr.search(";") == -1 ? parseList : parseList[0];

        let moduleId = parseList && parseList[0] ? parseList[0] : 0;
        let partId = parseList && parseList[1] ? parseList[1] : 0;
        let subId = parseList && parseList.length != 0 ? parseList[2] : 0;
        moduleUIManager.jumpToModule(moduleId, partId, subId);
    }
    /**
     * @desc 聊天广播刷新
     * @param item
     * @param selectedId
     */
    onChatListRender(item: cc.Node, idx: number) {
        item.getComponent(ItemChat).init(item, this._msgList[idx]);
    }

    onClickChatList(event: cc.Event) {
        if (event && event.target){
            let chatNode: cc.Node = event.target;
            if (!chatNode.getComponent(List).scrolling){
                moduleUIManager.jumpToModule(12000);
            }
        }
    }

    /**
     * @desc 聊天广播数据更新
     * @param item
     * @param selectedId
     */
    private _updateChatView() {
        this._msgList = chatData.chatDataList;
        //当前最多展示10条
        this._msgList = this._msgList.slice(Math.max(0, this._msgList.length - 10), this._msgList.length);
        this.chatList.numItems = this._msgList.length;
        this.chatList.scrollTo(this._msgList.length, 0);
    }

    private _refreshRedDot() {
        // TODO 确实有点多 是不是考虑动态生成

        this.heroRedDot.setData(RED_DOT_MODULE.MAIN_HERO);
        this.handbookRedDot.setData(RED_DOT_MODULE.MAIN_HERO_HANDBOOK);
        this.taskRedDot.setData(RED_DOT_MODULE.MAIN_TASK);
        this.mailRedDot.setData(RED_DOT_MODULE.MAIN_MAIL);
        this.bagRedDot.setData(RED_DOT_MODULE.MAIN_BAG);
        this.activityRedDot.setData(RED_DOT_MODULE.MAIN_ACTIVITY);
        this.shopRedDot.setData(RED_DOT_MODULE.MAIN_SHOP);
        this.summonRedDot.setData(RED_DOT_MODULE.MAIN_SUMMON);
        this.levelMapRedDot.setData(RED_DOT_MODULE.MAIN_LEVEL_MAP);
        this.pveRedDot.setData(RED_DOT_MODULE.MAIN_PVE);
        this.guildRedDot.setData(RED_DOT_MODULE.MAIN_GUILD);
        this.divineSystemRedDot.setData(RED_DOT_MODULE.MAIN_DIVINE_SYSTEM);
        // this.characterRedDot.setData(RED_DOT_MODULE.MAIN_CHARACTER);
        this.treasureRedDot.setData(RED_DOT_MODULE.MAIN_TREASURE);
        this.firstChargeRedot.showRedDot(!commonData.tmpCache.FirstChargeClicked)
    }

    private _receiveLimitRes (eventId?: number, msg?: TimeLimitData) {
        this._refreshDynamicAty();
        if(msg) {
            //限时挑战
            if(TIME_LIMIT_TYPE.FIGHT == msg.limitType) {
                guiManager.showDialogTips(CustomDialogId.LIMIT_SHOP_TIPS1);
            }

            //限时商店
            if (TIME_LIMIT_TYPE.SHOP == msg.limitType) {
                guiManager.showDialogTips(CustomDialogId.LIMIT_SHOP_TIPS2);
            }
        }
    }

    private _refreshDynamicAty() {
        this.mainDynamicAtyCtrl.refreshView();
        this.mainDynamicAtyCtrl.popLimitView();
    }

    private _refreshOnlineRewardItem() {
        let item = this.node.getComponentInChildren(ItemOnlineReward);
        if (item) { 
            item.node.active = true;
        } 
    }

    unScheduleAll() {
        this._adViewUpdateHandler && this.unschedule(this._adViewUpdateHandler);
        this._adViewUpdateHandler = null;
    }

    onRelease() {
        netStatusWatcher.unwatchNet();

        this.chatList._deInit();
        this.pageList._deInit();
        guiManager.removeCoinNode(this.node);
        this._coinNode = null

        this.releaseSubView();
        this.unScheduleAll();
        this._spriteLoader.release();
        eventCenter.unregisterAll(this);
        this.itemHeroShow.getComponent(ItemHeroShow).onRelease();
        this.bottomContaior.deInit();
        this.leftContaior.deInit();
        this.rightContaior.deInit();
        this.mainDynamicAtyCtrl.deInit();

        //GM快捷打开
        if(cc.sys.os == cc.sys.OS_WINDOWS){
            cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this._onKeyDown, this);
        }
    }

    private _switchMainAct (isEnter: boolean) {
        if(isEnter != this._isEnter) {
            let moveTime: number = 0.35;
            let leftTopPos: cc.Vec2 = isEnter ? cc.v2(cc.winSize.width, 0) : cc.v2(-cc.winSize.width, 0);
            let leftBottomPos: cc.Vec2 = isEnter ? cc.v2(cc.winSize.width, 0) : cc.v2(-cc.winSize.width, 0);
            let bottomCenterPos: cc.Vec2 = isEnter ? cc.v2(0, cc.winSize.height) : cc.v2(0, -cc.winSize.height);
            let rightCenterPos: cc.Vec2 = isEnter ? cc.v2(-cc.winSize.width, 0) : cc.v2(cc.winSize.width, 0);
            let broadcastPos: cc.Vec2 = isEnter ? cc.v2(0, -cc.winSize.height) : cc.v2(0, cc.winSize.height);
            this.blockMask.active = true;
            if(this._coinNode) {
                this._coinNode.runAction(cc.moveBy(moveTime, broadcastPos).easing(cc.easeIn(1)));
            }
            this.leftTopNode.runAction(cc.moveBy(moveTime, leftTopPos).easing(cc.easeIn(1)));
            this.leftBottomNode.runAction(cc.moveBy(moveTime, leftBottomPos).easing(cc.easeIn(1)));
            this.bottomCenterNode.runAction(cc.moveBy(moveTime, bottomCenterPos).easing(cc.easeIn(1)));
            this.rightCenterNode.runAction(cc.moveBy(moveTime, rightCenterPos).easing(cc.easeIn(1)));

            this.broadcast.runAction(cc.moveBy(moveTime, broadcastPos).easing(cc.easeIn(1)));
            this.unscheduleAllCallbacks();
            this.scheduleOnce(() => {
                this._isEnter = isEnter;
                this.blockMask.active = false;
            });
        }
    }

    test(){
        let node = new cc.Node();
        let labelComp = node.addComponent(cc.Label);
        labelComp.string = '跑酷测试';
        labelComp.fontSize = 20;
        node.width = 50;
        node.height = 50;
        let btnComp = node.addComponent(cc.Button);
        let eventHandler = new cc.Component.EventHandler();
        eventHandler.component = 'MainScene';
        eventHandler.handler = 'onClickModule';
        eventHandler.customEventData = '36000';
        eventHandler.target = this.node;
        btnComp.clickEvents.push(eventHandler);
        node.parent = this.node;
    }

    onRestart(){
        this._resumeMsg();
    }

    onPause() {
        this._stopMsg();
    }

    onRefresh() {
        if (!userData.accountData) {
            return;
        }
        this._refreshView();
        this._checkNeedUpdateGiftBag();
        this._refreshDynamicAty();

        let idx = this.pageList.getCurIndex() || 0;
        this._bannerIndex = idx
        this.pageList.scrollTo(this._bannerIndex, 1, 0);
        this._resumeMsg();
    }

    // 打开跑马灯
    private _resumeMsg () {
        let scrollMsg = this.broadcast.getComponent(ScrollMsg);
        scrollMsg.playStaus = true;
        scrollMsg.startScroll();
    }

    // 关闭跑马灯
    private _stopMsg () {
        let scrollMsg = this.broadcast.getComponent(ScrollMsg);
        scrollMsg.playStaus = false;
        scrollMsg.pauseScroll();
    }

    private _onKeyDown(event: any){
        if(event.keyCode === cc.macro.KEY.f3){
            this.onClickGoGMView();
        }
    }

    private _delayLoadRes () {
        preloadUIPrefab().stepWork.start(() => {
            logger.log(`Mainscene`, `delay ui resource finish.`);
        })
    }

    // 收到res要弹出现实礼包
    private _showLimitedGiftRes () {
        this.mainDynamicAtyCtrl.popLimitGiftView();
        this._refreshDynamicAty();
    }

    //限时礼包购买后获得物品展示
    private _showLimitedGiftBuyRes (cmd: any, msg: gamesvr.IPayResultNotify){
        if(!msg) return;

        let shopGiftCfg: cfg.ShopGift = configUtils.getNormalShopGift(msg.ProductID);
        //首充礼包
        if(shopGiftCfg && shopGiftCfg.ShopGiftType == 2){
            this._refreshDynamicAty();
            this._updateAdView();
            return;
        }

        //限时礼包
        let limitedTimeGiftBagCfg = configUtils.getShopGiftCfgByID(msg.ProductID);
        if(!limitedTimeGiftBagCfg) return;
        let items: data.IItemInfo[] = [];
        utils.parseStingList(limitedTimeGiftBagCfg.GiftItemShow, (item: string[]) => {
            if(!item || item.length < 2) return;
            let itemID = parseInt(item[0]);
            let count = parseInt(item[1]);
            items.push({ID: itemID, Count: count});
        });
        guiManager.loadView("GetItemView", guiManager.sceneNode, items);
        this._refreshDynamicAty();
    }

    private _checkNeedUpdateGiftBag () {
        // TODO，4-15测试关闭 请求条件缺失了1个，需要判断多一个条件-详情查询泽坤
        return;
        //触发次数为零或者可以触发新的礼包，主动触发礼包
        let giftBagData = limitData.shopTimeFiniteGiftData;
        if (!giftBagData) {
            return;
        }
        let touchCount = giftBagData.TouchCount || 0;
        let moduleCfg: string[] = utils.parseStringTo1Arr((configUtils.getConfigModule('ShopGiftSceneConfig') || ''), ';');
        let maxTimes = moduleCfg && parseInt(moduleCfg[0]) || 0;
        //每天最大次数已经触发完了
        if (touchCount >= maxTimes) {
            this.mainDynamicAtyCtrl.popLimitGiftView();
            return;
        }

        if (touchCount == 0 || serverTime.currServerTime() >= utils.longToNumber(giftBagData.NextFoundGiftTime)) {
            limitDataOpt.sendQueryLimitedTimeGiftBag();
        } else {
            this.mainDynamicAtyCtrl.popLimitGiftView();
        }
    }

    private _updateHangup () {
        this.hangUp.onRefresh();
    }

}
