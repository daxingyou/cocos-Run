import { RES_ICON_PRE_URL } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { data } from "../../../network/lib/protocol";
import { taskData } from "../../models/TaskData";
import ItemBag from "../view-item/ItemBag";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemRankReward extends cc.Component {

    @property(cc.Label) desc: cc.Label = null;
    @property(cc.Sprite) headSp: cc.Sprite = null;
    @property(cc.Sprite) headFrame: cc.Sprite = null;
    @property(cc.Label) userName: cc.Label = null;
    @property(cc.Node) takeTag: cc.Node = null;
    @property(cc.Node) rewardContainor: cc.Node = null;
    @property(cc.Node) btnDetail: cc.Node = null;
    @property(cc.Node) noPayerTag: cc.Node = null;

    private _rewardCfg: cfg.RankReward = null;
    private _rewardData: data.IEpochRewardReachUserGroup = null;
    private _getUserInfoCb: Function = null;
    private _clickDetailCb: Function = null;

    private _spLoader: SpriteLoader = new SpriteLoader();

    init(rewardCfg: cfg.RankReward, data: data.IEpochRewardReachUserGroup, getUserInfoCb: Function, clickDeatilCb: Function) {
        this._rewardCfg = rewardCfg || {};
        this._rewardData = data;
        this._getUserInfoCb = getUserInfoCb;
        this._clickDetailCb = clickDeatilCb;
        this._initUI();
    }

    deInit() {
        this._spLoader.release();
    }

    reuse(...rest: any[]) {

    }

    unuse() {
        this.deInit();
    }

    onClickDetail() {
        this._clickDetailCb && this._clickDetailCb(this._rewardCfg,  this._rewardData)
    }

    private _initUI() {
        this.desc.string = this._rewardCfg.GoalIntroduce || '';
        let rewards = utils.parseStr2Iteminfo(this._rewardCfg.RewardShow || '');
        if(rewards && rewards.length > 0) {
            let item: ItemBag = null;
            if(this.rewardContainor.childrenCount > 0) {
                item = this.rewardContainor.children[0].getComponent(ItemBag);
                this.rewardContainor.children[0].active = true;
            }else {
                item = ItemBagPool.get();
                item.node.parent = this.rewardContainor;
            }
            item.init({id: rewards[0].ID, count: rewards[0].Count});

        }else {
            if(this.rewardContainor.childrenCount > 0) {
                this.rewardContainor.children[0].active = false;
            }
        }

        let no1Player: any = (this._rewardData && this._rewardData.EpochRewardReachUserList && this._rewardData.EpochRewardReachUserList.length > 0)
            ? this._rewardData.EpochRewardReachUserList[this._rewardData.EpochRewardReachUserList.length - 1] : null;

        let userInfo = no1Player ? this._getUserInfoCb(no1Player.UserID) : null;
        let isReceived = taskData.isRankRewardReceived(this._rewardCfg.RankRewardId);
        if(userInfo) {
            this.btnDetail.active = true;
            this.noPayerTag.active = false;
            this.userName.string = userInfo.Name || '';
            this.takeTag.active = isReceived;
        } else {
            this.userName.string = '虚位以待';
            this.btnDetail.active = false;
            this.noPayerTag.active = true;
            this.takeTag.active = false;
        }

        if(userInfo) {
            let headUrl = `${RES_ICON_PRE_URL.HEAD_IMG}/` + configUtils.getHeadConfig(userInfo.HeadID).HeadFrameImage;
            let frameUrl = `${RES_ICON_PRE_URL.HEAD_FRAME}/` + configUtils.getHeadConfig(userInfo.HeadFrameID).HeadFrameImage;
            this._spLoader.changeSprite(this.headSp, headUrl);
            this._spLoader.changeSprite(this.headFrame, frameUrl);
        }
    }

    refreshView() {
        let no1Player: any = (this._rewardData && this._rewardData.EpochRewardReachUserList && this._rewardData.EpochRewardReachUserList.length > 0)
            ? this._rewardData.EpochRewardReachUserList[this._rewardData.EpochRewardReachUserList.length - 1] : null;
        let userInfo = no1Player ? this._getUserInfoCb(no1Player.UserID) : null;
        let isReceived = taskData.isRankRewardReceived(this._rewardCfg.RankRewardId);
        if(userInfo) {
            this.takeTag.active = isReceived;
        } else {
            this.takeTag.active = false;
        }
    }

    clear() {
        while(this.rewardContainor && this.rewardContainor.childrenCount > 0) {
            let lastChild = this.rewardContainor.children[this.rewardContainor.childrenCount - 1];
            lastChild.removeFromParent();
            let itemBag = lastChild.getComponent(ItemBag);
            if(itemBag) {
                ItemBagPool.put(itemBag);
            }
        }
    }
}
