import { cfg } from "../../../config/config";
import { data } from "../../../network/lib/protocol";
import ItemRankUser from "./ItemRankUser";

const {ccclass, property} = cc._decorator;

@ccclass
export default class RankUserView extends cc.Component {

    @property(cc.Label) title: cc.Label = null;
    @property(cc.Label) desc: cc.Label = null;
    @property(cc.Node) containor: cc.Node = null;
    @property(cc.Prefab) rankUserPfb: cc.Prefab = null;
    @property(cc.Node) rootNode: cc.Node = null;

    private _pool: cc.NodePool = new cc.NodePool();
    private _OriPos: cc.Vec2 = null;

    init(rewardCfg: cfg.RankReward, data: data.IEpochRewardReachUserGroup, getUserInfoCb: Function) {
        // this.title.string = rewardCfg.GoalIntroduce || '';
        this.desc.string = `前${(data && data.EpochRewardReachUserList) ? data.EpochRewardReachUserList.length : 0}名达成玩家`;
        this._OriPos = this._OriPos || this.rootNode.getPosition();
        if(!data || !data.EpochRewardReachUserList || data.EpochRewardReachUserList.length == 0) return;
        let userArr = data.EpochRewardReachUserList;
        userArr.forEach((ele, idx)=> {
            let itemUser = this._getItemUser();
            itemUser.init(idx + 1, ele, getUserInfoCb ? getUserInfoCb(ele.UserID) : null);
            itemUser.node.x = 0;
            itemUser.node.y = 0 - ((idx * 2 + 1) * itemUser.node.height >> 1) - idx * 10;
            itemUser.node.parent = this.containor;
        });
        this._playOpenEffect();
    }

    deInit() {
        let userNodes = [...this.containor.children];
        userNodes.forEach(ele => {
            ele.getComponent(ItemRankUser).deInit();
            this._pool.put(ele);
        })
    }

    onRelease() {
        this.deInit();
        this._pool.clear();
    }

    private _getItemUser(): ItemRankUser {
        if(this._pool.size() > 0) {
            let node = this._pool.get();
            return node.getComponent(ItemRankUser);
        }

        let node = cc.instantiate(this.rankUserPfb);
        return node.getComponent(ItemRankUser);
    }

    private _playOpenEffect() {
        cc.Tween.stopAllByTarget(this.rootNode);
        this.rootNode.y = (cc.winSize.height >> 1) + (this.rootNode.height >> 1);
        cc.tween(this.rootNode).to(0.1, {y: this._OriPos.y}, {easing: 'backOut'}).start();
    }

    private _playCloseEffect(cb: Function) {
      cc.Tween.stopAllByTarget(this.rootNode);
      cc.tween(this.rootNode).to(0.1, {y: (cc.winSize.height >> 1) + (this.rootNode.height >> 1)}, {easing: 'backIn'}).call(() => {
        cb && cb();
      }).start();
  }

    onClickCloseView() {
        this._playCloseEffect(() => {
            this.node.active = false;
            this.deInit();
        });
    }
}
