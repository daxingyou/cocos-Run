import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import guiManager from "../../../common/GUIManager";
import { data, gamesvr } from "../../../network/lib/protocol";
import { CustomDialogId, VIEW_NAME } from "../../../app/AppConst"
import { eventCenter } from "../../../common/event/EventCenter";
import { bagDataEvent, gachaEvent, heroViewEvent } from "../../../common/event/EventData";
import { BAG_ITEM_TYPE, EQUIP_PART_TYPE, HEAD_ICON, QUALITY_TYPE } from "../../../app/AppEnums";
import { bagData } from "../../models/BagData";
import { utils } from "../../../app/AppUtils";
import { redDotMgr, RED_DOT_MODULE } from "../../../common/RedDotManager";
import HeroListComp from "./HeroListComp";
import HeroRoleComp from "./HeroRoleComp";
import HeroPropComp from "./HeroPropComp";
import { userData } from "../../models/UserData";
import { configUtils } from "../../../app/ConfigUtils";
import moduleUIManager from "../../../common/ModuleUIManager";
import { preloadItemHeroListPool } from "../../../common/res-manager/Preloaders";
import StepWork from "../../../common/step-work/StepWork";
import { CACHE_MODE, resourceManager } from "../../../common/ResourceManager";
import HeroUnit from "../../template/HeroUnit";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { configManager } from "../../../common/ConfigManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class HeroView extends ViewBaseComponent {
    @property(cc.Node)          bgNode: cc.Node = null;
    @property(cc.Node)          heroBasicNode: cc.Node = null;
    @property(cc.Node)          heroListViewParent: cc.Node = null;
    @property(cc.Node)          heroDetialBtn: cc.Node = null;
    @property(cc.Node)          leftBtn: cc.Node = null;
    @property(cc.Node)          rightBtn: cc.Node = null;
    @property(cc.Node)          mask: cc.Node = null;

    @property(HeroListComp) heroList: HeroListComp = null;
    @property(HeroRoleComp) heroRole: HeroRoleComp = null;
    @property(HeroPropComp) heroProp: HeroPropComp = null;

    private _isBackMain: boolean = false;
    private _heroListOriginX: number = 0;
    private _imgUrls: string[] = [];        // 缓存图片url，记得释放

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
            this.heroList.preInit();
            let heroIDs: number[] = this.heroList.currList;
            let heroUnit: HeroUnit = null;
            let imgUrl: string = null;
            for (let i = 0; i < heroIDs.length; ++i) {
                heroUnit = bagData.getHeroById(Number(heroIDs[i])) || new HeroUnit(Number(heroIDs[i]));
                imgUrl = resPathUtils.getItemIconPath(heroUnit.basicId, HEAD_ICON.BIG);
                self._imgUrls.push(imgUrl);
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

    onInit(moduleId: number, pID?: number, sId?: number, ...args:any[]) {
        this._initView(moduleId, pID, sId, args);
        this._registerEvent();
        this.bgNode.width = cc.winSize.width
        this.scheduleOnce(() => {
            this._heroListOriginX = this.heroListViewParent.x
        });
    }

    private _registerEvent() {
        eventCenter.register(heroViewEvent.COMPOUND_HERO_SUC, this, this._recvCompoundHeroSuc);
        eventCenter.register(heroViewEvent.ADD_HERO_STAR_SUC, this, this._recvAddHeroStarSuc);
        eventCenter.register(heroViewEvent.HERO_DRESS_EQUIP, this, this._recvDressEquipSuc);
        eventCenter.register(heroViewEvent.HERO_UNDRESS_EQUIP, this, this._recvUnDressEquipSuc);
        eventCenter.register(heroViewEvent.HERO_ONCE_DRESS_EQUIP, this, this._recvOnceDressEquipSuc);
        eventCenter.register(heroViewEvent.HERO_ONCE_UNDRESS_EQUIP, this, this._recvOnceUnDressEquipSuc);
        eventCenter.register(heroViewEvent.OPEN_EQUIP_LIST_VIEW, this, this.openEquipListView);
        eventCenter.register(bagDataEvent.EQUIP_BROKE, this, this._recvEquipBrokenSuc);
        eventCenter.register(bagDataEvent.EQUIP_ENHANCED, this, this._recvEquipStrengthSuc);
        eventCenter.register(gachaEvent.GACHA_RES, this, this._updateRoleStatu);
        eventCenter.register(gachaEvent.SELECT_SIMULATE_RES, this, this._updateRoleStatu);
        eventCenter.register(heroViewEvent.GAIN_GIFT, this, this._recvGainGift);
        eventCenter.register(bagDataEvent.EQUIP_TOTAL_ENHANCED, this, this._recvEquipTotalStrengthSuc);
    }

    onRelease() {
        guiManager.removeCoinNode(this.node);
        this.heroList.onRelease();
        this.heroProp.deInit()
        this.heroRole.deInit()
        this.releaseSubView();
        eventCenter.unregisterAll(this);
        redDotMgr.fire(RED_DOT_MODULE.MAIN_HERO);
        this._releaseImages();
    }

    set mainBack (v: boolean) {
        this._isBackMain = v;
    }

    get mainBack () {
        return this._isBackMain;
    }

    private _initView (moduleId: number, pID?: number, sId?: number, args?:any[]) {
        this._preload();
        this.heroRole.onInit(this);
        this.heroProp.onInit(this);
        this.heroList.onInit(this, this._onSelectHero.bind(this), args != null ? args[0] : null);
        this._updateHeroRoleComp(this.heroList.currHero)
        this.heroDetialBtn.active = true;
        guiManager.addCoinNode(this.node, moduleId);
    }

    private _onSelectHero (heroID: number) {
        this._updateHeroRoleComp(heroID)
        this.heroProp.updateRole(heroID);
    }
    
    /**
     * 接受到合成英雄成功信息
     */
    private _recvCompoundHeroSuc(eventId: number, data: gamesvr.ComposeHeroRes) {
        guiManager.showDialogTips(CustomDialogId.HERO_GAIN_NEW);
        if(data.HeroID) {
            let heroCfg = configUtils.getHeroBasicConfig(data.HeroID);
            if(heroCfg.HeroBasicQuality >= QUALITY_TYPE.SSR) {
                moduleUIManager.showGetNewSSRHero([data.HeroID], null, this.node.parent);
            }
            this.updateAll(data.HeroID);
        }
    }
    /**
     * 接受到升星成功
     */
    private _recvAddHeroStarSuc(eventId: number, data: gamesvr.ComposeHeroRes) {
        guiManager.showDialogTips(CustomDialogId.HERO_UPGRADE_SUNCESS);
        if (data.HeroID) {
            this.loadSubView('HeroStarRaiseView', data.HeroID);
            this.updateAll(data.HeroID);
        }
    }

    updateAll (heroID: number) {
        userData.updateCapability();
        this.heroList.refreshList();
        this.heroList.updateListOne(heroID);
        this.heroRole.updateStatueInfo(heroID);
        this.heroProp.updateRole(heroID);
        this.heroRole.updateRedots();
    }
    
    private _updateHeroRoleComp(heroID: number){
        this.heroRole.updateRole(heroID);
        this.heroRole.updateRedots();
    }

    /**
     * 接受到穿戴装备成功
     */
    private _recvDressEquipSuc(msg: gamesvr.HeroEquipRes) {
        //todo 展示升降战斗力特效
       this._updateAfterEquipChanged();
       this.heroList.updateListOne(msg.HeroID);
       this.heroList.updateItemsRedDot();
       this.heroRole.updateRedots();
    }
    /**
     * 接受到卸载装备成功
     */
    private _recvUnDressEquipSuc(msg: gamesvr.HeroUnequipRes) {
        //TODO 展示升降战斗力特效
        this._updateAfterEquipChanged();
        this.heroList.updateListOne(msg.HeroID);
        this.heroList.updateItemsRedDot();
        this.heroRole.updateRedots();
    }
    /**
     * 接收到一键穿戴
     */
     private _recvOnceDressEquipSuc(eventId: number, data: gamesvr.OnceEquipRes) {
        //TODO 展示升降战斗力特效
        this._updateAfterEquipChanged();
        this.heroList.updateListOne();
        this.heroList.updateItemsRedDot();
        this.heroRole.updateRedots();
    }
    /**
     * 接收到一键卸载
     */
     private _recvOnceUnDressEquipSuc() {
        //TODO 展示升降战斗力特效
        this._updateAfterEquipChanged();
        this.heroList.updateListOne();
        this.heroList.updateItemsRedDot();
        this.heroRole.updateRedots();
    }

    /**
     * 接收装备突破
     */
    private _recvEquipBrokenSuc() {
        //TODO 展示升降战斗力特效
        this._updateAfterEquipChanged();
    }
    /**
     * 接收装备强化
     */
    private _recvEquipStrengthSuc() {
        //TODO 展示升降战斗力特效
        this._updateAfterEquipChanged();
    }

    // 装备一键强化成功
    private _recvEquipTotalStrengthSuc() {
        //TODO 展示升降战斗力特效
        this._updateAfterEquipChanged();
    }

    private _updateAfterEquipChanged () {
        userData.updateCapability();
        this.heroRole.refreshCapability();
        this.heroRole.updateEquipPreview();
        this.heroProp.updateRole(this.heroList.currHero);
    }

    private _updateRoleStatu() {
        //TODO 展示升降战斗力特效
        this.heroRole.updateStatueInfo(this.heroList.currHero);
    }

    //解锁天赋
    private _recvGainGift(eventId: number, msg: gamesvr.GainGiftRes) {
        this.heroList.updateListOne(msg.HeroID);
        this._refreshGiftRedDot();
    }

    private _refreshGiftRedDot() {
        this.heroRole.updateRedots();
        redDotMgr.fire(RED_DOT_MODULE.HERO_GIFT_TOGGLE);
    }

    onClickNextBtn(event: any, customEventData: string) {
        let addIndex = parseInt(customEventData) 
        if(this.heroList.currList.length <= 0) {
            guiManager.showTips('当前无合适的英雄列表');
            return;
        }
        this.heroList.onSelectNext(addIndex);
    }

    onClickCloseView() {
        if(!this.heroBasicNode.active) {
            this.closeView();
        } else {
            this._switchHeroShowView();
        }
    }
    
    onClickRoleDeltaBtn() {
        this._switchHeroShowView();
    }

    onClickTeamBtn() {
        // 打开预设编队
        guiManager.loadModuleView(VIEW_NAME.PREINSTALL_VIEW);
    }

    onClickHeroListBtn() {
        this.closeView();
    }

    onClickPreinstall() {
        this.loadHeroSubView(VIEW_NAME.PREINSTALL_VIEW, 1);
    }
    
    openEquipListView(eventId: number, partPositon: EQUIP_PART_TYPE, equip: data.IBagUnit) {
        this.loadHeroSubView(VIEW_NAME.EQUIPS_LIST_VIEW, 2, partPositon, this.heroList.currHero, equip);
    }

    private _switchHeroShowView() {
        let distance: cc.Vec2 = cc.v2(0, 0);
        let startCb: Function = null;
        let endCb: Function = null;
        // 适配逻辑
        let moveOffsetX: number = 0;
        if(this.heroBasicNode.active) {
            // 英雄列表界面
            distance.x = 560;
            startCb = () => {
                this.heroDetialBtn.active = false;
            }
            endCb = () => {
                utils.fadeToAction(this.heroDetialBtn, 0.1, 255, 0, () => {
                    this.heroDetialBtn.active = true;
                });
                this.heroBasicNode.active = false;
                this.leftBtn.active = false;
                this.rightBtn.active = false;
            }
            moveOffsetX = 0;
        } else {
            // 英雄详情界面
            distance.x = -560;
            startCb = () => {
                utils.fadeToAction(this.heroDetialBtn, 0.1, 0, 0, null, () => {
                    this.heroDetialBtn.active = false;
                });
                this.heroBasicNode.active = true;
                this.heroProp.updateRole(this.heroList.currHero);
                this.leftBtn.active = true;
                this.rightBtn.active = true;
            }
            endCb = () => {
                
            }
            moveOffsetX = -560;
        }
        this.mask.active = true;
        this.bgNode.stopAllActions();
        
        cc.tween(this.heroListViewParent).to(0.25, 
            { position: cc.v3(this._heroListOriginX + moveOffsetX, this.heroListViewParent.y)},
        ).delay(0.15).start()
        
        cc.tween(this.bgNode).
        call(()=> {startCb && startCb()})
        .to(0.3, {position: cc.v3(this.bgNode.x + distance.x, distance.y)}, cc.easeIn(0.2))
        .call(()=> {
                endCb && endCb(); 
                this.mask.active = false; 
        })
        .delay(0.15).start()
    }

    // 重新加载后，根节点位置重置
    onRefresh() {
        this.heroList.onRefresh();
    }

    loadHeroSubView(name: string, viewType: number, ...args: any[]) {
        if(viewType == 1) {
            guiManager.loadModuleView(name, ...args);
        } else {
            this.loadSubView(name, ...args);
            // this.loadSubView(name, ...args)
        }
    }

    private _preload() {

    }
}
