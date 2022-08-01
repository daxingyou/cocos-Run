/*
 * @Author: xuyang
 * @Date: 2021-07-06 20:26:28
 * @Description: 飞升之路
 */
import { CHARACTER_VIEW_TYPE, HERO_ABILITY, HERO_EQUIP_TYPE, PVE_MODE, QUALITY_TYPE } from "../../../app/AppEnums";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { dailyLessonEvent, heroViewEvent } from "../../../common/event/EventData";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { data, gamesvr } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { userData } from "../../models/UserData";
import { PveConfig } from "../../../app/AppType";
import { pveData } from "../../models/PveData";
import { CustomDialogId, SCENE_NAME, VIEW_NAME } from "../../../app/AppConst";
import { bagDataOpt } from "../../operations/BagDataOpt";
import HeroListItemSmall from "../view-hero/HeroListItemSmall";
import PVELessonListItem from "./PVELessonListItem";
import HeroUnit from "../../template/HeroUnit";
import List from "../../../common/components/List";
import guiManager from "../../../common/GUIManager";
import { localStorageMgr, SAVE_TAG } from "../../../common/LocalStorageManager";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { pveDataOpt } from "../../operations/PveDataOpt";

const { ccclass, property } = cc._decorator;

const HERO_MAX_STAR = 6;
const COLOR_GREEN = cc.color().fromHEX("#44E647");
const COLOR_RED = cc.color().fromHEX("#E53737");

@ccclass
export default class PVERiseRoadView extends ViewBaseComponent {
    //英雄部分
    @property(cc.Sprite) heroStagePhoto: cc.Sprite = null;
    @property(List) heroViewList: List = null;
    @property(cc.Node) filterLayout: cc.Node = null;
    @property(cc.Label) filterLb: cc.Label = null;
    @property(cc.Node) advanceNode: cc.Node = null;
    @property(cc.Sprite) advanceTipsSp: cc.Sprite = null;
    @property([cc.SpriteFrame]) advanceTipsSFs: cc.SpriteFrame[] = []
    @property(cc.Node) stickyBtn: cc.Node = null;
    @property(cc.Node) unstickyBtn: cc.Node = null;
    @property({ type: cc.Label, tooltip: '进阶碎片数量' }) advanceNumLb: cc.Label = null;
    //关卡部分
    @property(List) lessonListView: List = null;
    @property(cc.Node) emptyNode: cc.Node = null;
    @property(cc.Toggle) toggleInitTeam: cc.Toggle = null;

    //英雄部分
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _mainHeroViewFilterInfo: number[] = [-1, -1];                // 筛选记录
    private _heroViewShowInfos: number[] = [];                          // 英雄列表总数据
    private _curSelectHeroId: number = 0;                               // 当前选择的英雄id
    private _stickyData: number[] = [];
    //关卡部分
    private _pveID: number = 0;
    private _pveCfg: cfg.PVEList = null;
    private _pveRiseLesson: cfg.PVERiseRoad[] = [];       //PVE数据列表
    private _oldUseDefaultTeam: boolean = false;

    onInit(mId: number, pID: number, sId: number, itemID?: number) {
        this._pveID = pID;
        this._oldUseDefaultTeam = localStorageMgr.getAccountStorage(SAVE_TAG.PVE_MODE_DEFAULT_TEAM.replace(/%d/, this._pveID +''));
        this._oldUseDefaultTeam = !!this._oldUseDefaultTeam;
        if(itemID){
            let heroConfig = configUtils.getHeroBasicConfig(itemID);
            heroConfig && (this._curSelectHeroId = heroConfig.HeroBasicId);
        }
        this.stepWork.addTask(()=>{
            this.registerEvent();
            this.prepareData();
            this.updateFilterData(true);
            guiManager.addCoinNode(this.node, pID);
        })
    }

    deInit() {
        eventCenter.unregisterAll(this);
        this._spriteLoader.release();
    }


    onRelease() {
        guiManager.removeCoinNode(this.node);
        this.lessonListView._deInit();
        this.heroViewList._deInit();
        this.releaseSubView();
        this.unscheduleAllCallbacks();
        this.deInit();
    }

    registerEvent() {
        eventCenter.register(heroViewEvent.COMPOUND_HERO_SUC, this, this._recvCompoundHeroSuc);
        eventCenter.register(heroViewEvent.ADD_HERO_STAR_SUC, this, this._recvAddHeroStarSuc);
        eventCenter.register(dailyLessonEvent.FINISH_PVE_RISEROAD_RES, this, this._recvPVEFinishRes);
        eventCenter.register(dailyLessonEvent.SWEET_PVE_RES, this, this._onRecvSweetPveRes);
    }

    refreshHeroStage() {
        if (!this._curSelectHeroId) return;
        let heroUnit: HeroUnit = new HeroUnit(this._curSelectHeroId);
        let heroPhotoPath: string = resPathUtils.getModelPhotoPath(heroUnit.heroCfg.HeroBasicModel);
        if (heroPhotoPath)
            this._spriteLoader.changeSprite(this.heroStagePhoto, heroPhotoPath);

        // 展示英雄碎片
        let roleChipCount: number = bagDataUtils.getHeroChipCnt(this._curSelectHeroId);
        let chipCountNeed: number = bagDataUtils.getHeroNeedChipCount(this._curSelectHeroId);
        if (heroUnit.isHeroBasic) {
            // 更换碎片头像
            if (heroUnit.star >= 6) {
                this.advanceTipsSp.spriteFrame = this.advanceTipsSFs[2];
                this.advanceNumLb.node.color = COLOR_GREEN;
                this.advanceNumLb.string = `${roleChipCount}`;
            } else {
                this.advanceTipsSp.spriteFrame = this.advanceTipsSFs[1];
                
                this.advanceNumLb.string = `${roleChipCount}/${chipCountNeed}`;
                if (roleChipCount >= chipCountNeed) {
                    this.advanceNumLb.node.color = COLOR_GREEN;
                } else {
                    this.advanceNumLb.node.color = COLOR_RED;
                }
            }
            this.advanceNode.active = true
        } else {
            this.advanceTipsSp.spriteFrame = this.advanceTipsSFs[0];
            this.advanceNumLb.string = `${roleChipCount}/${chipCountNeed}`;
            let color = bagDataUtils.checkHeroMerge(heroUnit.basicId) ? COLOR_GREEN : COLOR_RED;
            this.advanceNumLb.node.color = color;
        }
    }

    prepareData() {
        this.toggleInitTeam.isChecked = this._oldUseDefaultTeam;
        this._heroViewShowInfos = this.getFilterData();
        this._stickyData = this.getStickyData();
    }

    prepareLessonData() {
        this._pveRiseLesson.length = 0;
        let configs = configManager.getConfigs("pveRiseRoad");
        this._pveCfg = configManager.getConfigByKey("pveList", this._pveID);
        for (let k in configs) {
            let cfg: cfg.PVERiseRoad = configs[k];
            if (cfg.PVERiseRoadHeroId == this._curSelectHeroId) {
                this._pveRiseLesson.push(cfg);
            }
        }
        this.lessonListView.numItems = this._pveRiseLesson.length;
        //空页面提示
        this.lessonListView.node.active = !!this._pveRiseLesson.length;
        this.emptyNode.active = !this._pveRiseLesson.length;
    }

    getFilterData(): number[] {
        let hasRoleList: data.IBagUnit[] = utils.deepCopyArray(bagData.heroList);
        let returnHasRoleList: number[] = [];
        let fullStarRoleList: number[] = [];
        let allRoleConfigs = configManager.getConfigs('heroBasic');
        let findIndexCb = (cfg: cfg.HeroBasic, isReduce: boolean = false) => {
            let heroIdx = hasRoleList.findIndex(heroUnit => {return heroUnit.ID == cfg.HeroBasicId});
            //拥有的英雄
            if(heroIdx != -1 && !isReduce){
                let heroUnit = bagData.getHeroById(cfg.HeroBasicId);
                if(heroUnit.star >= HERO_MAX_STAR){
                    fullStarRoleList.push(cfg.HeroBasicId);
                    return;
                }
                returnHasRoleList.push(cfg.HeroBasicId);
                return;
            }
             
            //下面是对不拥有的英雄的处理，暂时不需要
        }
        for (const k in allRoleConfigs) {
            let heroCfg: cfg.HeroBasic = allRoleConfigs[k];
            if (this._mainHeroViewFilterInfo[0] != -1 && this._mainHeroViewFilterInfo[1] != -1) {
                if ((this._mainHeroViewFilterInfo[0] == 1 && this._mainHeroViewFilterInfo[1] == heroCfg.HeroBasicQuality)
                    || (this._mainHeroViewFilterInfo[0] == 2 && this._mainHeroViewFilterInfo[1] == heroCfg.HeroBasicTrigrams)
                    || (this._mainHeroViewFilterInfo[0] == 3 && this._mainHeroViewFilterInfo[1] == heroCfg.HeroBasicAbility)
                    || (this._mainHeroViewFilterInfo[0] == 4 && this._mainHeroViewFilterInfo[1] == heroCfg.HeroBasicEquipType)) {
                    findIndexCb(heroCfg);
                } else {
                    findIndexCb(heroCfg, true)
                }
            } else {
                findIndexCb(heroCfg);
            }
        }

        //暂时不需要不拥有的英雄
        // let sortCb = (a: number, b: number) => {
        //     let aCfg = configUtils.getHeroBasicConfig(a);
        //     let bCfg = configUtils.getHeroBasicConfig(b);
        //     return bCfg.HeroBasicQuality - aCfg.HeroBasicQuality;
        // };
        // returnCanCompoundList.sort(sortCb)
        // returnNotHasRoleList.sort(sortCb);

        let sortPower = (a: number, b: number) => {
            let aUnit: HeroUnit = bagData.getHeroById(a);
            let bUnit: HeroUnit = bagData.getHeroById(b);
            let aPower = aUnit.getCapability();
            let bPower = bUnit.getCapability();
            if (aPower == bPower) {
                return bUnit.heroCfg.HeroBasicQuality - aUnit.heroCfg.HeroBasicQuality;
            } else {
                return bPower - aPower;
            }
        }
        returnHasRoleList.sort(sortPower);

        fullStarRoleList.sort((a:number, b: number) => {
            let aUnit: HeroUnit = bagData.getHeroById(a);
            let bUnit: HeroUnit = bagData.getHeroById(b);
            if(bUnit.heroCfg.HeroBasicQuality == aUnit.heroCfg.HeroBasicQuality){
                return bUnit.getCapability() - aUnit.getCapability();
            }
            return bUnit.heroCfg.HeroBasicQuality - aUnit.heroCfg.HeroBasicQuality;
        });

        return returnHasRoleList.concat(fullStarRoleList);
    }

    saveStickyData() {
        localStorageMgr.setAccountStorage(SAVE_TAG.RISE_ROAD, this._stickyData); 
    }


    getStickyData() {
        let stickyData = localStorageMgr.getAccountStorage(SAVE_TAG.RISE_ROAD) || [];
        return stickyData.filter((ele: number) => {
            let heroID = Number(ele);
            return this._heroViewShowInfos.indexOf(heroID) != -1;
        });
    }

    onClickSticky() {
        let stickyID = this._curSelectHeroId;
        let index = this._stickyData.indexOf(stickyID);
        if (index != -1) {
            this._stickyData.splice(index, 1);
        }
        this._stickyData.unshift(stickyID);
        this.updateFilterData();
        this.saveStickyData();
    }

    onClickUnsticky() {
        let stickyID = this._curSelectHeroId;
        let index = this._stickyData.indexOf(stickyID);
        if (index != -1) {
            this._stickyData.splice(index, 1);
        }
        this.updateFilterData();
        this.saveStickyData();
    }


    onClickFilterBtn() {
        this.filterLayout.active = !this.filterLayout.active;
    }
    /**
     * 点击某个筛选大选项
     * @param event 
     * @param customEventData 
     */
    onClickFilterBtns(event: cc.Event, customEventData: number) {
        for (let i = 0; i < this.filterLayout.childrenCount; ++i) {
            let filterBtn: cc.Node = this.filterLayout.children[i];
            let btns: cc.Node = filterBtn.getChildByName('btns');
            if (i == customEventData) {
                if (btns) {
                    btns.active = !btns.active;
                }
            } else {
                if (btns && btns.active) {
                    btns.active = false;
                }
            }
        }
    }
    // 点击战斗力
    onClickCapbility() {
        // todo 根据战斗力排下序
        this._mainHeroViewFilterInfo = [0, -1];
        this.resetFilter();
    }
    // 英雄品质
    onClickQuality(toogle: cc.Toggle, customEventData: QUALITY_TYPE, isClick: Boolean = true) {
        if (isClick) {
            let curQualityIndex = this._mainHeroViewFilterInfo[1];
            if (curQualityIndex != customEventData) {
                this._mainHeroViewFilterInfo = [1, Number(customEventData)];
                // 刷新筛选按钮状态
                let tipsString: string[] = ['', '', '', 'R', 'SR', 'SSR', 'SP'];
                toogle.node.parent.active = false;
                this.updateFilterView(tipsString[Number(customEventData)]);
            } else {
                this.filterLayout.active = false;
                toogle.node.parent.active = false;
            }
        } else {
            // 刷新筛选按钮状态
            let tipsString: string[] = ['', '', '', 'R', 'SR', 'SSR', 'SP'];
            this.updateFilterView(tipsString[Number(customEventData)]);
        }
    }
    // 英雄卦象
    onClickTrigrames(event: cc.Toggle, customEventData: HERO_ABILITY, isClick: Boolean = true) {
        if (isClick) {
            let curTrigramsIndex: number = this._mainHeroViewFilterInfo[1];
            if (curTrigramsIndex != Number(customEventData)) {
                this._mainHeroViewFilterInfo = [2, Number(customEventData)];

                // 刷新筛选按钮状态
                let tipsString: string[] = ['', '天', '地', '风', '雷', '水', '火', '山', '泽'];
                event.node.parent.active = false;
                this.updateFilterView(tipsString[Number(customEventData)]);
            } else {
                this.filterLayout.active = false;
                event.node.parent.active = false;
            }
        } else {
            // 刷新筛选按钮状态
            let tipsString: string[] = ['', '天', '地', '风', '雷', '水', '火', '山', '泽'];
            this.updateFilterView(tipsString[Number(customEventData)]);
        }
    }
    // 英雄定位
    onClickAbility(event: cc.Toggle, customEventData: HERO_ABILITY, isClick: Boolean = true) {
        if (isClick) {
            let cuiAbilityIndex: number = this._mainHeroViewFilterInfo[1];
            if (cuiAbilityIndex != Number(customEventData)) {
                this._mainHeroViewFilterInfo = [3, Number(customEventData)];
                // 刷新筛选按钮状态
                let tipsString: string[] = ['', '输出', '承伤', '控制', '辅助', '治疗'];
                event.node.parent.active = false;
                this.updateFilterView(tipsString[Number(customEventData)]);

            } else {
                this.filterLayout.active = false;
                event.node.parent.active = false;
            }
        } else {
            // 刷新筛选按钮状态
            let tipsString: string[] = ['', '输出', '承伤', '控制', '辅助', '治疗'];
            this.updateFilterView(tipsString[Number(customEventData)]);
        }
    }
    // 英雄装备类型
    onClickEquipType(event: cc.Toggle, customEventData: HERO_EQUIP_TYPE, isClick: Boolean = true) {
        if (isClick) {
            let curEquipType: number = this._mainHeroViewFilterInfo[1];
            if (curEquipType != Number(customEventData)) {
                this._mainHeroViewFilterInfo = [4, Number(customEventData)];
                // 刷新筛选按钮状态
                let tipsString: string[] = ['', '板甲', '皮甲', '布甲'];
                event.node.parent.active = false;
                this.updateFilterView(tipsString[Number(customEventData)]);
            } else {
                this.filterLayout.active = false;
                event.node.parent.active = false;
            }
        } else {
            // 刷新筛选按钮状态
            let tipsString: string[] = ['', '板甲', '皮甲', '布甲'];
            this.updateFilterView(tipsString[Number(customEventData)]);
        }
    }

    onClickAdvanceBtn() {
        if (this._curSelectHeroId) {
            if (bagDataUtils.checkHeroCanAddStar(this._curSelectHeroId)) {
                bagDataOpt.sendAddHeroStar(this._curSelectHeroId);
            } else {
                let heroUnit: HeroUnit = new HeroUnit(this._curSelectHeroId);
                if (heroUnit.isHeroBasic && heroUnit.star >= 6) {
                    guiManager.loadModuleView(VIEW_NAME.COMPOUND_VIEW, 47000, CHARACTER_VIEW_TYPE.SMELT);
                } else {
                    guiManager.showDialogTips(CustomDialogId.HERO_CHIPS_NO_ENOUGH);
                    // todo 打开碎片获取
                    guiManager.loadModuleView("SummonView");
                }
            }
        }
    }

    updateFilterView(string: string) {
        this.filterLb.string = string;
        this.filterLayout.active = false;
        this.updateFilterData();
    }

    updateFilterData(isForceUpdate: boolean = false) {
        this._heroViewShowInfos = this.getFilterData();
        //置顶数据预设
        this._stickyData.reverse().forEach(heroID => {
            let index = this._heroViewShowInfos.indexOf(heroID)
            if (index != -1) {
                this._heroViewShowInfos.unshift(
                    this._heroViewShowInfos.splice(index, 1)[0]
                );
            }
        })
        this._stickyData.reverse();
        this.refreshHeroList(isForceUpdate);
    }

    resetFilter() {
        this._mainHeroViewFilterInfo = [-1, -1];
        this.filterLayout.active = false;
        this.filterLb.string = '全部';
        this.updateFilterData();
    }

    refreshHeroList(isForceUpdate: boolean = false) {
        this.heroViewList.numItems = this._heroViewShowInfos.length;
        let index: number = this._heroViewShowInfos.indexOf(this._curSelectHeroId);
        if (index == -1) {
            index = 0;
        }

        isForceUpdate && this._refreshLessonList(this._heroViewShowInfos[index]);
        if (this.heroViewList.selectedId != index) {
            this.heroViewList.selectedId = index;
        }
        this._heroViewShowInfos.length && this.heroViewList.scrollTo(index);
        this.refreshHeroStage();
    }

    onListRenderEvent(item: cc.Node, index: number) {
        let heroListItemCmp: HeroListItemSmall = item.getComponent(HeroListItemSmall);
        heroListItemCmp.setData(this._heroViewShowInfos[index]);
    }

    onListItemClick(item: cc.Node, index: number) {
        let heroID = this._heroViewShowInfos[index];
        if(heroID != this._curSelectHeroId){
            this._curSelectHeroId = heroID;
            this._refreshLessonList(heroID);
            return;
        }

        this._compoundHero(heroID);
    }

    //刷新任务
    private _refreshLessonList(id: number){
        this.stickyBtn.active = (this._stickyData.indexOf(id) == -1);
        this.unstickyBtn.active = (this._stickyData.indexOf(id) != -1);
        this.prepareLessonData();
        this.refreshHeroStage();
    }

    //合成英雄
    private _compoundHero(id: number){
        this.stickyBtn.active = (this._stickyData.indexOf(id) == -1);
        this.unstickyBtn.active = (this._stickyData.indexOf(id) != -1);
        if (bagDataUtils.checkHeroMerge(this._curSelectHeroId)) {
            let hereId: number = configUtils.getHeroBasicConfig(this._curSelectHeroId).HeroBasicId;
            bagDataOpt.sendCompoundHero(hereId);
        }
    }

    onLessonListRender(itemNode: cc.Node, idx: number) {
        let item = itemNode.getComponent(PVELessonListItem);
        let cfg = this._pveRiseLesson[idx];
        item.init(cfg, true, (viewName: string, ...args: any[]) => {
            args.push(this._mopUpLesson.bind(this));
            this.loadSubView(viewName, ...args);
        }, (lessonId: number)=> {
            this.enterPveGame(lessonId);
        }, true);
    }


    // 服务事件回调
    private _recvCompoundHeroSuc(eventId: number, data: gamesvr.ComposeHeroRes) {
        guiManager.showDialogTips(CustomDialogId.HERO_GAIN_NEW);
        if (data.HeroID) {
            userData.updateCapability();
            this._curSelectHeroId = data.HeroID;
            this.refreshHeroList();
        }
    }

    private _recvAddHeroStarSuc(eventId: number, data: gamesvr.ComposeHeroRes) {
        //todo 可能需要展示 升星特效
        guiManager.showDialogTips(CustomDialogId.HERO_UPGRADE_SUNCESS);
        if (data.HeroID) {
            userData.updateCapability();
            this._curSelectHeroId = data.HeroID;
            this.refreshHeroList();
        }
    }

    enterPveGame(lessonId: number) {
        let isUseInitTeam = this.toggleInitTeam.isChecked;
        let lessonCfg: cfg.PVERiseRoad = configManager.getConfigByKey("pveRiseRoad", lessonId);
        if (lessonCfg) {
            let pveConfig: PveConfig = {
                lessonId: lessonId,
                userLv: userData.lv,
                useDefaultSquad: isUseInitTeam,
                pveMode: PVE_MODE.RISE_ROAD,
                riseRoadCfg: lessonCfg,
                pveListId: 17005
            }
            pveData.pveConfig = pveConfig;
            guiManager.loadScene(SCENE_NAME.BATTLE);
        }

        if(this._oldUseDefaultTeam != isUseInitTeam){
            localStorageMgr.setAccountStorage(SAVE_TAG.PVE_MODE_DEFAULT_TEAM.replace(/%d/, this._pveID + ''), isUseInitTeam);
            this._oldUseDefaultTeam = isUseInitTeam;
        }
    }

    private _recvPVEFinishRes(cdm:any, msg: gamesvr.FinishPveRes){
        this.updateFilterData(true);
    }

    private _mopUpLesson(lessonID: number, count: number){
        pveDataOpt.reqMopUpLesson(lessonID, false, count);
    }

    private _onRecvSweetPveRes(cmd: number, prizes: data.IItemInfo[]) {
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
