import { VIEW_NAME } from "../../../app/AppConst";
import { BagItemInfo } from "../../../app/AppType";
import { utils } from "../../../app/AppUtils";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { cfg } from "../../../config/config";
import ItemBag from "../view-item/ItemBag";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemActivityPreivew extends cc.Component {

    @property(cc.Label) nameLb: cc.Label = null;
    @property(cc.Label) timeLb: cc.Label = null;
    @property(cc.Label) descLb: cc.Label = null;
    @property(cc.Node) rewardContainor: cc.Node  = null;

    private _cfg: cfg.ActivityNextShow = null;
    private _items: ItemBag[] = null;
    private _loadViewFn: Function = null;
    init(cfg: cfg.ActivityNextShow, loadViewFn: Function) {
        this._cfg = cfg;
        this._loadViewFn = loadViewFn;
        this._initUI();
    }

    private _initUI() {
        let atyPreviewCfg = this._cfg;
        this.nameLb.string = atyPreviewCfg.ActivityNextShowName;
        this.timeLb.string = `开启时间：${atyPreviewCfg.ActivityNextShowOpenTime}`;
        this.descLb.string = atyPreviewCfg.ActivityNextShowIntroduce || '';

        let rewards: number[] = null;
        if(atyPreviewCfg.ActivityNextShowReward && atyPreviewCfg.ActivityNextShowReward.length > 0) {
            let rewardCfgs = utils.parseStringTo1Arr(atyPreviewCfg.ActivityNextShowReward, ';');
            if( rewardCfgs && rewardCfgs.length > 0) {
              rewardCfgs.forEach(ele => {
                  rewards = rewards || [];
                  rewards.push(parseInt(ele));
              })
            }
        }
        this._genRewars(rewards);
    }

    private _genRewars(rewards: number[]) {
        if(!rewards || rewards.length == 0) return;
        let startX: number, spaceX = 10;
        let scale = 0.8;
        let itemW: number = 0;
        rewards.forEach(ele => {
            let item = ItemBagPool.get();
            if(itemW == 0) {
                itemW = item.node.width * scale;
                startX = 0;
            }
            this._items = this._items || [];
            this._items.push(item);
            item.node.scale = scale;
            item.init({id: ele, count: 0, clickHandler: this._onClickReward.bind(this)});
            item.node.setPosition(startX - (itemW >> 1), 0);
            item.node.parent = this.rewardContainor;
            startX -= (itemW + spaceX);
        })
    }

    private _onClickReward(info: BagItemInfo) {
         // 展示道具
         this._loadViewFn && this._loadViewFn(VIEW_NAME.TIPS_ITEM, {itemId: info.id, num: info.count})
    }

    deInit() {
        if(this._items) {
          this._items.forEach(ele => {
              ItemBagPool.put(ele);
          });
          this._items.length = 0
        }
    }
}
