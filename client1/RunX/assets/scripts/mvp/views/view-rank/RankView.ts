import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { rankViewEvent } from "../../../common/event/EventData";
import { data, gamesvr } from "../../../network/lib/protocol";
import { rankDataOpt } from "../../operations/RankDataOpt";
import ItemRank from "./ItemRank";
import List from "../../../common/components/List";
import { userData } from "../../models/UserData";
import { bagData } from "../../models/BagData";
import { utils } from "../../../app/AppUtils";
import HeroUnit from "../../template/HeroUnit";
import { VIEW_NAME } from "../../../app/AppConst";
import guiManager from "../../../common/GUIManager";
import UIGridView, { GridData, GridItem } from "../../../common/components/UIGridView";
import ItemTotalRank from "./ItemTotalRank";
import { cfg } from "../../../config/config";
import { configManager } from "../../../common/ConfigManager";
import { scheduleManager } from "../../../common/ScheduleManager";
import { pveData } from "../../models/PveData";
import { pveTrialData } from "../../models/PveTrialData";

export enum RANK_TYPE {
    NONE = 0,
    FIVE = 1,
    MAO_XIAN,
    TAI_XU_HUAI_JING,
    PURGATORY,
    ALL,
    ONE
}

const {ccclass, property} = cc._decorator;

@ccclass
export default class RankView extends ViewBaseComponent {
    @property(cc.Node)          selfNode: cc.Node = null;
    @property(List)             rankList: List = null;
    @property(cc.Node)          emptyNode: cc.Node = null;
    @property(cc.Prefab)        itemRankPfb: cc.Prefab = null;
    @property(UIGridView) toalRankView: UIGridView = null;
    @property(cc.Node) lingerNode: cc.Node = null;  //排行榜驻留节点
    @property(cc.Prefab) itemTotalRankPfb: cc.Prefab = null;
    @property(cc.Node) rightPanel: cc.Node = null;

    private _rankType: RANK_TYPE = RANK_TYPE.NONE;
    private _rankDatas: any[] = [];
    private _mySelfRankData: any[] = [];

    private _rankListCfg: {[key: string]: cfg.RankName} = null;
    private _rankRewardCfg: {[key: string]: cfg.RankReward[]} = null;
    private _itemTotalPool: cc.NodePool = new cc.NodePool();
    private _currRankItem: ItemTotalRank = null;

    private _homeData: gamesvr.IRankHomePageGetFirstRes = null;

    private _rankHomePromise: Promise<any> = null;
    private _schedulerReqHome: number = 0;

    private _jumpRankType: RANK_TYPE = null;    // 跳转打开的RankType

    preInit(...rest: any[]): Promise<any> {
        this._registerEvents();
        this._rankHomePromise = new Promise((resolve, reject) => {
            this._schedulerReqHome =  scheduleManager.schedule(() => {
                if(this._homeData){
                    this._clearScheduler();
                    this._rankHomePromise = null;
                    resolve(true);
                }
            }, 0);
            rankDataOpt.sendGetRankHome();
        });
        return this._rankHomePromise;
    }

    onInit(functionID: number, jumpRankType: RANK_TYPE) {
        this._jumpRankType = jumpRankType;

        this.rightPanel.x = cc.winSize.width >> 1;
        guiManager.addCoinNode(this.node);
        this._initCfgs();
        this._initUI();
        this._mySelfRankData = this._getSelfRankDatas();

        // 跳转到排行榜详情页
        this._jumpToRankList(jumpRankType);
    }

    onRelease() {
        eventCenter.unregisterAll(this);
        this._rankHomePromise = null;
        this.toalRankView.clear();
        this._itemTotalPool && this._itemTotalPool.clear();
        guiManager.removeCoinNode(this.node);

        this.rankList._deInit();
        this.releaseSubView();

        this.unscheduleAllCallbacks();

        let children = [...this.selfNode.children]
        children.forEach(_c => {
            _c.getComponent(ItemRank).deInit();
            _c.removeFromParent();
        });
    }

    private _clearScheduler(){
        if(this._schedulerReqHome) {
            scheduleManager.unschedule(this._schedulerReqHome);
        }
        this._schedulerReqHome = 0;
    }

    private _initCfgs() {
        this._rankListCfg = this._rankListCfg || configManager.getConfigs('rankName');
        this._rankRewardCfg = this._rankRewardCfg || configManager.getConfigs('rankReward');
    }

    private _initUI() {
        let self = this;

        let data: GridData[] = [];
        for(let k in this._rankListCfg) {
            if(!this._rankListCfg.hasOwnProperty(k)) continue;
            let cfg = this._rankListCfg[k];
            let rewardCfgs = this._rankRewardCfg[k];
            data.push({key: k, data:{rankCfg: cfg, rewardCfgs: rewardCfgs}});
        }

        let isInit: boolean = true;
        let count = 0;
        this.toalRankView.init(data, {
            onInit: (item: ItemTotalRank, gridData: GridData) =>{
                let rankType: number = gridData.data.rankCfg.RankNameRewardList;
                item.init(gridData.data.rankCfg, gridData.data.rewardCfgs, this._getRankDataByType(rankType)
                    , this._openRankList.bind(this), this._openRankReward.bind(this));
                if(self._jumpRankType != null) return;
                
                count += 1;
                let idx = parseInt(gridData.key);
                item.rootNode.x = 200;
                item.rootNode.opacity = 0;
                cc.tween(item.rootNode).delay(0.05 * idx).call(() => {
                    item.rootNode.opacity = 255;
                }).to(0.1, {x: 0}).call(() => {
                    count -= 1;
                    if(count == 0) isInit = false;
                }).start();
            },
            releaseItem: (item: ItemTotalRank) => {
                cc.Tween.stopAllByTarget(item.rootNode);
                item.rootNode.opacity = 255;
                item.rootNode.x = 0;
                this._itemTotalPool.put(item.node);
            },
            getItem: ():ItemTotalRank => {
                let node = this._getItemTotalRank();
                return node.getComponent(ItemTotalRank);
            }
        });
    }

    // 获取主页中不同排行榜的数据
    private _getRankDataByType(type: RANK_TYPE): data.IPVEAdventureScale|data.IPVEDreamScale|data.IPowerFiveHero {
        if(type == RANK_TYPE.FIVE) {
            return this._homeData.PowerFiveHeroUnit;
        }

        if(type == RANK_TYPE.MAO_XIAN) {
            return this._homeData.PVEAdventureUnit;
        }

        if(type == RANK_TYPE.TAI_XU_HUAI_JING) {
            return this._homeData.PVEDreamScaleUnit;
        }

        if(type == RANK_TYPE.PURGATORY) {
            return this._homeData.TrialPurgaUnit;
        }
        return null;
    }

    private _getItemTotalRank() {
        if(this._itemTotalPool.size() > 0)
            return this._itemTotalPool.get();

        return cc.instantiate(this.itemTotalRankPfb);
    }

    private _registerEvents() {
        eventCenter.register(rankViewEvent.REVE_RANK_HOME_RES, this, this._recvRankHomeRes);
        eventCenter.register(rankViewEvent.RECV_FIVE_RANK_RES, this, this._recvFiveRankRes);
        eventCenter.register(rankViewEvent.RECV_ALL_RANK_RES, this, this._recvAllRankRes);
        eventCenter.register(rankViewEvent.RECV_ONE_RANK_RES, this, this._recvOneRankRes);
        eventCenter.register(rankViewEvent.RECV_DREAM_LIST_RES, this, this._recvDreamListRes);
        eventCenter.register(rankViewEvent.RECV_ADVENTURE_LIST_RES, this, this._recvAdventureListRes);
        eventCenter.register(rankViewEvent.RECV_PURGATORY_LIST_RES, this, this._recvPurgatoryListRes);
    }

    refreshView() {
        let datas = this._rankDatas[this._rankType];
        this.rankList.numItems = datas.length;
        this.emptyNode.active = datas.length == 0;
        this.scheduleOnce(() => {
            this.rankList.scrollTo(0);
        });
    }

    refreshSelfView() {
        let selfItem: cc.Node = this.selfNode.children[0];
        if(!cc.isValid(selfItem)) {
            selfItem = cc.instantiate(this.itemRankPfb);
            this.selfNode.addChild(selfItem);
        }
        let data = this._mySelfRankData[this._rankType];
        // @ts-ignore
        let selfIndex: number = this._rankDatas[this._rankType].findIndex(temp => {
            return temp.User.UserID == data.User.UserID;
        });
        selfItem.getComponent(ItemRank).onInit(data, this._rankType, selfIndex, true, null);
    }

    onRenderEvent(item: cc.Node, index: number) {
        let _rankData = this._rankDatas[this._rankType];
        if (!_rankData) return;

        let _userRank = _rankData[index];
        if (!_userRank) return;

        let isMySelf: boolean = _userRank.User.UserID == userData.accountData.UserID;
        item.getComponent(ItemRank).onInit(_userRank, this._rankType, index, isMySelf, (myself: boolean, rankData: any)=> {
            if (!myself && rankData && rankData.User) {
                this.loadSubView(VIEW_NAME.USER_INFO_VIEW, {UserID: rankData.User.UserID});
            }
        });
    }

    private _recvRankHomeRes(event: number, msg: gamesvr.IRankHomePageGetFirstRes) {
        this._homeData = msg;
    }

    private _recvAdventureListRes(event: number, msg: gamesvr.IRankPveAdventureScaleGetListRes) {
        if (this._checkDataIsChange(msg.PVEAdventureScaleList, RANK_TYPE.MAO_XIAN)) {
            this._rankDatas[RANK_TYPE.MAO_XIAN] = msg.PVEAdventureScaleList;
            this._rankDatas[RANK_TYPE.MAO_XIAN] = this._rankDatas[RANK_TYPE.MAO_XIAN] || [];
            this.refreshView();
            this.refreshSelfView();
        }
    }

    private _recvPurgatoryListRes(event: number, msg: gamesvr.IRankTrialPurgatoryScaleGetListRes) {
        if (this._checkDataIsChange(msg.TrialPurgatoryScaleList, RANK_TYPE.PURGATORY)) {
            this._rankDatas[RANK_TYPE.PURGATORY] = msg.TrialPurgatoryScaleList;
            this._rankDatas[RANK_TYPE.PURGATORY] = this._rankDatas[RANK_TYPE.PURGATORY] || [];
            this.refreshView();
            this.refreshSelfView();
        }
    }

    private _recvDreamListRes(event: number, msg: gamesvr.IRankPveDreamScaleGetListRes) {
        if (this._checkDataIsChange(msg.PVEDreamScaleList, RANK_TYPE.TAI_XU_HUAI_JING)) {
            this._rankDatas[RANK_TYPE.TAI_XU_HUAI_JING] = msg.PVEDreamScaleList;
            this._rankDatas[RANK_TYPE.TAI_XU_HUAI_JING] = this._rankDatas[RANK_TYPE.TAI_XU_HUAI_JING] || [];
            this.refreshView();
            this.refreshSelfView();
        }
    }

    private _recvFiveRankRes(eventId: number, msg: gamesvr.RankPowerFiveHeroGetListRes) {
        if (this._checkDataIsChange(msg.PowerFiveHeroList, RANK_TYPE.FIVE)) {
            this._rankDatas[RANK_TYPE.FIVE] = msg.PowerFiveHeroList;
            this._rankDatas[RANK_TYPE.FIVE] = this._rankDatas[RANK_TYPE.FIVE] || [];
            this.refreshView();
            this.refreshSelfView();
        }
    }

    private _recvAllRankRes(eventId: number, msg: gamesvr.RankPowerTotalHeroGetListRes) {
        if (this._checkDataIsChange(msg.PowerTotalHeroList, RANK_TYPE.ALL)) {
            this._rankDatas[RANK_TYPE.ALL] = msg.PowerTotalHeroList;
            this._rankDatas[RANK_TYPE.ALL] = this._rankDatas[RANK_TYPE.ALL] || [];
            this.refreshView();
            this.refreshSelfView();
        }
    }

    private _recvOneRankRes(eventId: number, msg: gamesvr.RankPowerOneHeroGetListRes) {
        if (this._checkDataIsChange(msg.PowerOneHeroList, RANK_TYPE.ONE)) {
            this._rankDatas[RANK_TYPE.ONE] = msg.PowerOneHeroList;
            this._rankDatas[RANK_TYPE.ONE] = this._rankDatas[RANK_TYPE.ONE] || msg.PowerOneHeroList;
            this.refreshView();
            this.refreshSelfView();
        }
    }

    private _checkDataIsChange(msg: any, rankType: RANK_TYPE): boolean {
        if (!this._rankDatas[rankType] || (msg && msg.length != this._rankDatas[rankType])) return true;
        for(let i = 0; i < this._rankDatas[rankType].length; ++i) {
            if (!this._checkObjectsIsSame(this._rankDatas[rankType][i], msg[i])) {
                return true;
            }
        }
        return false;
    }

    private  _checkObjectsIsSame(obj1: Object, obj2: Object): boolean {
        if(!obj1 || !obj2) return false;
        let props1 = Object.getOwnPropertyNames(obj1);
        let props2 = Object.getOwnPropertyNames(obj2);
        if(props1.length != props2.length) return false;
        for(let i = 0; i < props1.length; ++i) {
            let propName = props1[i];
            // @ts-ignore
            if (obj1[propName] != obj2[propName]) {
                return false;
            }
        }
        return true;
    }

    private _getSelfRankDatas(): any[] {
        let heros: data.IBagUnit[] = utils.deepCopyArray(bagData.heroList);
        heros.sort((a: data.IBagUnit, b: data.IBagUnit) => {
            let unitA = bagData.getHeroById(a.ID);
            let unitB = bagData.getHeroById(b.ID);
            let aPower: number = unitA.getCapability();
            let bPower: number = unitB.getCapability();

            if (aPower == bPower) {
                if(unitA.heroCfg.HeroBasicQuality == unitB.heroCfg.HeroBasicQuality) {
                    return unitA.heroCfg.HeroBasicId - unitB.heroCfg.HeroBasicId;
                } else {
                    return unitB.heroCfg.HeroBasicQuality - unitA.heroCfg.HeroBasicQuality
                }
            } else {
                return bPower - aPower;
            }
        });
        let selfRankData = [];
        // 五人排行榜
        let fiveHero: data.IPowerFiveHero = {
            HeroIDList: [],
            Power: 0,
            User: userData.accountData,
            Time: 0
        };
        let allHero: data.IPowerTotalHero = {
            Count: heros.length,
            Power: 0,
            User: userData.accountData,
            Time: 0
        }
        let oneHero: data.IPowerOneHero = {
            User: userData.accountData,
            Power: 0,
            Time: 0,
            HeroID: 0
        }

        let maoXian: data.IPVEAdventureScale = {
            User: userData.accountData,
            LessonId: pveData.getCurrPassedLesson(),
            Time: 0,
        }

        let  taiXuHuanjing: data.IPVEDreamScale = {
            User: userData.accountData,
            LessonId: pveData.getDreamLastLessonId(),
            Time: 0,
        }
        for(let i = 0; i < heros.length; ++i) {
            let heroUnit: HeroUnit = bagData.getHeroById(heros[i].ID);
            let power: number = heroUnit.getCapability();
            if(i == 0) {
                oneHero.Power += power;
                oneHero.HeroID = heroUnit.basicId;
            }
            if(i < 5) {
                fiveHero.HeroIDList.push(Number(heroUnit.basicId));
                fiveHero.Power += power;
            }
            allHero.Power += power;
        }

        let purgatory: data.ITrialPurgatoryScale = {
            User: userData.accountData,
            Progress: pveTrialData.purgatoryData != null ? pveTrialData.purgatoryData.Progress : 0,
            Time: 0
        }

        selfRankData[RANK_TYPE.ALL] = allHero;
        selfRankData[RANK_TYPE.ONE] = oneHero;
        selfRankData[RANK_TYPE.FIVE] = fiveHero;
        selfRankData[RANK_TYPE.MAO_XIAN] = maoXian;
        selfRankData[RANK_TYPE.TAI_XU_HUAI_JING] = taiXuHuanjing;
        selfRankData[RANK_TYPE.PURGATORY] = purgatory;
        return selfRankData;
    }

    //打开奖励
    private _openRankReward(type: number, item: ItemTotalRank) {
        guiManager.loadView('RankRewardView', null, type);
    }

    // 打开具体排行榜
    private _openRankList(type: number, item: ItemTotalRank) {
        if(this._currRankItem) {
            return;
        }

        this._currRankItem = item;
        this._rankType = item.rankType;
        this._refreshRankView();
        this._playOpenEffect();
    }

    private _playOpenEffect() {
        let worldPos = this._currRankItem.node.convertToWorldSpaceAR(this._currRankItem.rootNode.getPosition());
        let localPos = this.lingerNode.convertToNodeSpaceAR(worldPos);
        this._currRankItem.rootNode.parent = this.lingerNode;
        this._currRankItem.rootNode.setPosition(localPos);
        cc.Tween.stopAllByTarget(this._currRankItem.rootNode);
        this.toalRankView.node.active = false;
        //新版背景图过大，缩小至0.93显示
        cc.tween(this._currRankItem.rootNode).to(0.2, {position: cc.Vec3.ZERO, scale:0.95}).start();

        cc.Tween.stopAllByTarget(this.rightPanel);
        cc.tween(this.rightPanel).to(0.2, {x: this.lingerNode.x + 150}).start();
    }

    private _playCloseEffect() {
        let worldPos = this._currRankItem.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        let localPos = this.lingerNode.convertToNodeSpaceAR(worldPos);
        cc.Tween.stopAllByTarget(this._currRankItem.rootNode);
        cc.tween(this._currRankItem.rootNode).to(0.2, {x: localPos.x, y: localPos.y, scale: 1}).call(() => {
            this.toalRankView.node.active = true;
            this._currRankItem.rootNode.parent = this._currRankItem.node;
            this._currRankItem.rootNode.setPosition(cc.Vec3.ZERO);
            this._currRankItem = null;
        }).start();

        cc.Tween.stopAllByTarget(this.rightPanel);
        cc.tween(this.rightPanel).to(0.2, {x: cc.winSize.width >> 1}).start();
    }

    closeView(isUseCloseAction?: boolean): void {
        if(this._currRankItem && this._jumpRankType == null) {
            this._playCloseEffect();
            return;
        }
        super.closeView(isUseCloseAction);
    }

    // 获取排行榜数据
    private _refreshRankView() {
        let rankType = this._rankType;
        if(rankType == RANK_TYPE.NONE) return;

        if(!this._rankDatas[rankType]) {
            this._reqRankData(rankType);
            return;
        }

        this.refreshView();
        this.refreshSelfView();
    }

    private _reqRankData(rankType: RANK_TYPE) {
        if(rankType == RANK_TYPE.FIVE) {
            rankDataOpt.sendGetFiveRankReq();
        } else if(rankType == RANK_TYPE.ONE) {
            rankDataOpt.sendGetOneRankReq();
        } else if(rankType == RANK_TYPE.ALL) {
            rankDataOpt.sendGetAllRankReq();
        } else if(rankType == RANK_TYPE.MAO_XIAN) {
            rankDataOpt.sendGetRankPveAdventuresReq();
        } else if(rankType == RANK_TYPE.TAI_XU_HUAI_JING) {
            rankDataOpt.sendGetRankPveDreamListReq();
        } else if(rankType == RANK_TYPE.PURGATORY) {
            rankDataOpt.sendRankTrialPurgatoryScaleGetListReq();
        }
    }

    private _jumpToRankList(rankKey: RANK_TYPE) {
        let gridData = this.toalRankView.gridDatas;
        let data = gridData.find((item) => { return Number(item.key) === rankKey; });
        if (data) {
            this.toalRankView.scrollTo(data, null);
            scheduleManager.scheduleOnce(() => {
                let item = this.toalRankView.getItemBykey(data.key);
                item && (this._openRankList(null, item.node.getComponent(ItemTotalRank)));
            }, 0);
        }
    }
}
