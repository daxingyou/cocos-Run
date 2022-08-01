import { VIEW_NAME } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import UIGridView, { GridData } from "../../../common/components/UIGridView";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { rankViewEvent } from "../../../common/event/EventData";
import { scheduleManager } from "../../../common/ScheduleManager";
import { cfg } from "../../../config/config";
import { data, gamesvr } from "../../../network/lib/protocol";
import { taskData } from "../../models/TaskData";
import { rankDataOpt } from "../../operations/RankDataOpt";
import GetAllRewardBtn from "../view-common/GetAllRewardBtn";
import ItemRankReward from "./ItemRankReward";
import RankUserView from "./RankUserView";
import { RANK_TYPE } from "./RankView";

const {ccclass, property} = cc._decorator;

@ccclass
export default class RankRewardView extends ViewBaseComponent {
    @property(UIGridView) rewardList: UIGridView = null;
    @property(cc.Prefab) rewardItemTmp: cc.Prefab = null;
    @property(RankUserView) detailView: RankUserView = null;
    @property(cc.Node) getAllBtn: cc.Node = null;

    private _rankRewardCfgs: cfg.RankReward[] = null;
    private _rankRewardCfgMap: Map<number, number> = null;
    private _rankType: RANK_TYPE = RANK_TYPE.NONE;
    private _getRankRewardPromise: Promise<any> = null;
    private _schedulerReqRankReward: number = 0;
    private _rankRewardData: data.IEpochRewardTheme = null;
    private _rankUserInfos: { [k: string]: data.IUniversalViewOtherData } = null;

    private _rewardItemPool: cc.NodePool = new cc.NodePool();

    preInit(rankType: number): Promise<any> {
        this.detailView.node.active = false;
        this._rankType = rankType;
        this._registerEvents();
          this._getRankRewardPromise = new Promise((resolve, reject) => {
            this._schedulerReqRankReward =  scheduleManager.schedule(() => {
                if(this._rankRewardData){
                    this._clearScheduler();
                    this._getRankRewardPromise = null;
                    resolve(true);
                }
            }, 0);
            rankDataOpt.sendEpochRewardViewRewardReq(rankType);
        });
        return this._getRankRewardPromise;
    }

    protected onInit(rankType: number): void {
        this._initCfgs();
        this._initUI();
    }

    protected onRelease(): void {
        eventCenter.unregisterAll(this);
        this._clearScheduler();
        this.rewardList.clear();
        this.detailView.onRelease();
        this._clearPool();
        this._getRankRewardPromise = null;
    }

    private _initCfgs() {
        this._rankRewardCfgMap = this._rankRewardCfgMap || new Map();
        this._rankRewardCfgMap.clear();
        this._rankRewardCfgs = configManager.getConfigs('rankReward')[this._rankType];
        this._rankRewardCfgs && this._rankRewardCfgs.forEach((ele, idx) => {
            this._rankRewardCfgMap.set(ele.RankRewardId, idx);
        });
    }

    private _registerEvents() {
        eventCenter.register(rankViewEvent.RECV_RANK_REWARD, this, this._onRecvRankRewards);
        eventCenter.register(rankViewEvent.RECV_TAKE_RANK_REWARD, this, this._onRecvTakeRankRewards);
    }

    private _getRewardData(): GridData[] {
        let rewardDatas: GridData[] = [];
        this._rankRewardCfgs.forEach(ele => {
            let condi = utils.parseStringTo1Arr(ele.ShowCondition || '', ';');
            if(!condi || condi.length == 0) {
                rewardDatas.push({
                  key: ele.RankRewardNum + '',
                  data: ele
                })
                return;
            }

            let type = parseInt(condi[0]), value = parseInt(condi[1]);
            if(type == 1) {
                rewardDatas.push({
                  key: ele.RankRewardNum + '',
                  data: ele
                })
                return;
            }

            if(type == 2) {
                let lastRewardNum = this._rankRewardCfgs[this._rankRewardCfgMap.get(value)].RankRewardNum + '';
                let userList = (this._rankRewardData && this._rankRewardData.OrderReachUserGroupMap) ?
                    this._rankRewardData.OrderReachUserGroupMap[lastRewardNum] : null;
                userList && userList.EpochRewardReachUserList && userList.EpochRewardReachUserList.length > 0
                    && (rewardDatas.push({key: ele.RankRewardNum + '', data: ele}));
            }
        });
        return rewardDatas
    }

    private _initUI() {
        this.rewardList.init(this._getRewardData(), {
            onInit: (item: ItemRankReward, data: GridData) => {
                let rewardID = data.key;
                let rewardData = this._rankRewardData.OrderReachUserGroupMap && this._rankRewardData.OrderReachUserGroupMap[rewardID];
                item.init(data.data, rewardData, this._getUserInfo.bind(this), this._onClickDetail.bind(this));
            },
            releaseItem: (item: ItemRankReward) => {
                item.deInit();
                this._rewardItemPool.put(item.node);
            },
            getItem: (): ItemRankReward => {
                let item = this._getRewardItem();;
                item.node.active = true;
                return item;
            }
        });
        this._updateGetAllRewardBtn();
    }

    private _clearScheduler() {
        if(this._schedulerReqRankReward) {
            scheduleManager.unschedule(this._schedulerReqRankReward);
        }
        this._schedulerReqRankReward = 0;
    }

    private _onRecvRankRewards(event: number, data: gamesvr.IEpochRewardViewRewardRes) {
        if(data.ThemeID != this._rankType) return;
        this._rankRewardData = data.EpochRewardThemeUnit || {};
        this._rankUserInfos = data.UniversalViewOtherMap || {};
    }

    private _onRecvTakeRankRewards(event: number, data: gamesvr.IEpochRewardReceiveRewardRes) {
        let rewardsList = data.RankRewardIDList;
        this._updateGetAllRewardBtn();
        let prizes = data.Prizes || [];
        prizes && prizes.length > 0 && this.loadSubView(VIEW_NAME.GET_ITEM_VIEW, prizes);
        let items = this.rewardList.getItems();
        rewardsList.forEach(ele => {
            if(this._rankRewardCfgMap.has(ele)){
                let rewardCfg = this._rankRewardCfgs[this._rankRewardCfgMap.get(ele)];
                let rewardNum = rewardCfg.RankRewardNum || -1;
                items.has(rewardNum + '') &&  (items.get(rewardNum + '') as ItemRankReward).refreshView();
            }
        });
    }

    private _getRewardItem(): ItemRankReward {
        if(this._rewardItemPool.size() > 0) {
            return this._rewardItemPool.get().getComponent(ItemRankReward);
        }

        let node = cc.instantiate(this.rewardItemTmp);
        return node.getComponent(ItemRankReward);
    }

    private _getUserInfo(userID: number) {
        if(!this._rankUserInfos) return null;
        return this._rankUserInfos[userID];
    }

    private _clearPool() {
        while(this._rewardItemPool.size() > 0) {
            let item = this._rewardItemPool.get().getComponent(ItemRankReward);
            item.clear();
            item.node.destroy();
        }
    }

    onClickGetAllReward() {
        let rewardIDs = this._getReceivebleRewards();
        if(!rewardIDs || rewardIDs.length == 0) return;
        rankDataOpt.sendEpochRewardReceivedReewardReq(rewardIDs);
    }

    private _onClickDetail(rewardCfg: cfg.RankReward, data: data.IEpochRewardReachUserGroup) {
        if(this.detailView.node.active) return;
        this.detailView.node.active = true;
        this.detailView.init(rewardCfg, data, this._getUserInfo.bind(this));
    }

    //更新一键领取按钮状态
    private _updateGetAllRewardBtn(){
        let getAllRewardBtn = this.getAllBtn.getComponent(GetAllRewardBtn);
        if(!cc.isValid(getAllRewardBtn)) return;
        getAllRewardBtn.gray = !this._checkRecvAble();
    }

    private _getReceivebleRewards() : number[] {
        let rewardIDs: number[] = null;
        this._rankRewardCfgs.forEach(ele => {
            if(taskData.isRankRewardReceived(ele.RankRewardId)) return;
            if(!this._rankRewardData || !this._rankRewardData.OrderReachUserGroupMap || !this._rankRewardData.OrderReachUserGroupMap.hasOwnProperty(ele.RankRewardNum+'')) return;
            let userList = this._rankRewardData.OrderReachUserGroupMap[ele.RankRewardNum+''];
            if(userList && userList.EpochRewardReachUserList && userList.EpochRewardReachUserList.length > 0) {
                rewardIDs = rewardIDs || [];
                rewardIDs.push(ele.RankRewardId);
            }
        });
        return rewardIDs;
    }

    private _checkRecvAble(): boolean {
        return this._rankRewardCfgs.some(ele => {
            if(taskData.isRankRewardReceived(ele.RankRewardId)) return false;
            if(!this._rankRewardData || !this._rankRewardData.OrderReachUserGroupMap || !this._rankRewardData.OrderReachUserGroupMap.hasOwnProperty(ele.RankRewardNum+'')) return false;
            let userList = this._rankRewardData.OrderReachUserGroupMap[ele.RankRewardNum+''];
            if(userList && userList.EpochRewardReachUserList && userList.EpochRewardReachUserList.length > 0) {
                return true;
            }
            return false;
        });
    }
}
