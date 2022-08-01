
import { XIN_MO_REWARD_TYPE } from "../../../../app/AppEnums";
import { BagItemInfo } from "../../../../app/AppType";
import { utils } from "../../../../app/AppUtils";
import UIGridView, { GridData } from "../../../../common/components/UIGridView";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { configManager } from "../../../../common/ConfigManager";
import { ItemBagPool } from "../../../../common/res-manager/NodePool";
import { cfg } from "../../../../config/config";
import ItemBag from "../../view-item/ItemBag";
import ItemXinMoDamageReward from "./ItemXinMoDamageReward";
import ItemXinMoRankReward from "./ItemXinMoRankReward";

enum VIEW_TYPE {
    DAMAGE = 0,
    RANK
}

const CNT_OF_PER_FRAME_CREATE_INS = 3;

/**
 * 心魔法相排行榜
 */
const { ccclass, property } = cc._decorator;
@ccclass
export default class PVEXinMoFaXiangReWardView extends ViewBaseComponent {
    @property(cc.ToggleContainer) toggleContainor: cc.ToggleContainer = null;
    @property(cc.Node) damageRewardRoot: cc.Node = null;
    @property(cc.Node) damageRewardContainor: cc.Node = null;
    @property(UIGridView) damageRewardList: UIGridView = null;
    @property(cc.Prefab) damageRewardItemPrefab: cc.Prefab = null;

    @property(cc.Node) rankRewardRoot: cc.Node = null;
    @property(UIGridView) rankRewardList: UIGridView = null;
    @property(cc.Prefab) rankRewardItemPrefab: cc.Prefab = null;

    private _curViewType: VIEW_TYPE = VIEW_TYPE.DAMAGE;
    private _isInitDamageView: boolean = false;
    private _isInitRankView: boolean = false;

    private _damageItemPool: cc.NodePool = new cc.NodePool();
    private _rankItemPool: cc.NodePool = new cc.NodePool();
    private _damageRewardItems: ItemBag[] = null;
    private _clickItemHandler: Function = null;

    preInit(...rest: any[]): Promise<any> {
        //分帧构建节点
        return new Promise((resolve, reject) => {
            for(let i = 0, len = 9; i < len; i += CNT_OF_PER_FRAME_CREATE_INS) {
                let curLen = Math.min(CNT_OF_PER_FRAME_CREATE_INS, len - i);
                this.stepWork.addTask(() => {
                    for(let j = 0; j < curLen; j++) {
                      this._damageItemPool.put(cc.instantiate(this.damageRewardItemPrefab));
                    }
                })
            }

            for(let i = 0, len = 6; i < len; i += CNT_OF_PER_FRAME_CREATE_INS) {
                let curLen = Math.min(CNT_OF_PER_FRAME_CREATE_INS, len - i);
                this.stepWork.addTask(() => {
                    for(let j = 0; j < curLen; j++) {
                      this._rankItemPool.put(cc.instantiate(this.rankRewardItemPrefab));
                    }
                })
            }

            this.stepWork.start(() => {
                resolve(true);
            });
        });
    }

    protected onInit(clickItemHandler: Function): void {
        this._clickItemHandler = clickItemHandler;
        this._switchViewType();
    }

    protected onRelease(): void {
        this._isInitDamageView = false;
        this._isInitRankView = false;
        this._clickItemHandler = null;
        if(this._damageRewardItems) {
            this._damageRewardItems.forEach(ele => {
                ItemBagPool.put(ele);
            });
            this._damageRewardItems.length = 0;
        }
        this.damageRewardList.clear();
        this.rankRewardList.clear();
        this._damageItemPool.clear();
        this._rankItemPool.clear();
    }

    onToggleChange(toggle: cc.Toggle) {
        let toggles = this.toggleContainor.toggleItems;
        this._curViewType = toggles.indexOf(toggle);
        this._switchViewType();
    }

    private _switchViewType() {
        if(this._curViewType == VIEW_TYPE.DAMAGE) {
            this.damageRewardRoot.active = true;
            this.rankRewardRoot.active = false;
            this._initDamageView();
            return;
        }

        if(this._curViewType == VIEW_TYPE.RANK) {
            this.damageRewardRoot.active = false;
            this.rankRewardRoot.active = true;
            this._initRankView();
        }
    }

    private _initDamageView() {
        if(this._isInitDamageView) return;
        this._isInitDamageView = true;

        let baseRewardCfgs: cfg.PVEMindDemonReward[] = configManager.getConfigByKey('pveMindDemonReward', XIN_MO_REWARD_TYPE.BASE);
        let baseRewards: number[][] = null;
        baseRewardCfgs && baseRewardCfgs.forEach(ele => {
            if(!ele.PVEMindDemonRewardShow || ele.PVEMindDemonRewardShow.length == 0) return;
            utils.parseStingList(ele.PVEMindDemonRewardShow, (strArr: string[]) => {
                if(!strArr || strArr.length == 0) return;
                let itemID = parseInt(strArr[0]), cnt = parseInt(strArr[1]);
                baseRewards = baseRewards || [];
                baseRewards.push([itemID, cnt]);
            })
        });

        // 初始化挑战奖励
        if(baseRewards && baseRewards.length > 0) {
            let spaceX = 10;
            let startX: number = undefined;
            let itemW: number = 0;
            let scale: number = 0.75;
            baseRewards.forEach(ele => {
                let item = ItemBagPool.get();
                if(typeof startX == 'undefined') {
                    itemW = item.node.width * scale;
                    let totalW = itemW * baseRewards.length + (baseRewards.length - 1) * spaceX;
                    startX = -(totalW >> 1);
                }

                item.node.setPosition(startX + (itemW >> 1), 0);
                item.node.scale = scale;
                item.node.parent = this.damageRewardContainor;
                item.init({id: ele[0], count: ele[1], clickHandler: (info: BagItemInfo) => {
                    this._clickItemHandler && this._clickItemHandler(info);
                }});
                this._damageRewardItems = this._damageRewardItems || [];
                this._damageRewardItems.push(item);
                startX += (itemW + spaceX);
            })
        }

        // 初始化伤害奖励
        let gridData = this._genListDataSource(XIN_MO_REWARD_TYPE.DAMAGE_LIST);
        if(!gridData) return;

        this.damageRewardList.init(gridData, {
            onInit: (item: ItemXinMoDamageReward, data: GridData) => {
                let cfg:cfg.PVEMindDemonReward  = data.data.cfg, rewards: number[][] = data.data.rewards;
                item.init(cfg, rewards, (info: BagItemInfo) => {
                    this._clickItemHandler && this._clickItemHandler(info);
                });
            },
            releaseItem: (item: ItemXinMoDamageReward) => {
                item.deInit();
                this._damageItemPool.put(item.node);
            },
            getItem: (): ItemXinMoDamageReward => {
                let node = this._getDamageRewardNode();
                node.active = true;
                return node.getComponent(ItemXinMoDamageReward);
            }
        })
    }

    private _initRankView() {
        if(this._isInitRankView) return;
        this._isInitRankView = true;

        // 初始化排行奖励
        let gridData = this._genListDataSource(XIN_MO_REWARD_TYPE.RANK_LIST);
        if(!gridData) return;

        this.rankRewardList.init(gridData, {
            onInit: (item: ItemXinMoRankReward, data: GridData) => {
                let cfg:cfg.PVEMindDemonReward  = data.data.cfg, rewards: number[][] = data.data.rewards;
                item.init(cfg, rewards, (info: BagItemInfo) => {
                  this._clickItemHandler && this._clickItemHandler(info);
                });
            },
            releaseItem: (item: ItemXinMoRankReward) => {
              item.deInit();
              this._rankItemPool.put(item.node);
            },
            getItem: (): ItemXinMoRankReward => {
              let node = this._getRankRewardNode();
              node.active = true;
              let item = node.getComponent(ItemXinMoRankReward)
              return item;
            }
        })
    }

    private _genListDataSource(type: XIN_MO_REWARD_TYPE): GridData[] {
        let rankRewardCfgs: cfg.PVEMindDemonReward[] = configManager.getConfigByKey('pveMindDemonReward', type);

        if(!rankRewardCfgs || rankRewardCfgs.length == 0) return null;
        let gridData: GridData[] = rankRewardCfgs.map((ele, idx) => {
            let rewards: number[][] = null;
            if(ele.PVEMindDemonRewardShow && ele.PVEMindDemonRewardShow.length > 0) {
                utils.parseStingList(ele.PVEMindDemonRewardShow, (strArr: string[]) => {
                    if(!strArr || strArr.length == 0) return;
                    let itemID = parseInt(strArr[0]), cnt = parseInt(strArr[1]);
                    rewards = rewards || [];
                    rewards.push([itemID, cnt]);
                });
            }
            return {
                key: idx +'',
                data: {
                    cfg: ele,
                    rewards: rewards
                }
            }
        });
        return gridData;
    }

    private _getDamageRewardNode() {
        if(this._damageItemPool.size() > 0){
            return this._damageItemPool.get();
        }
        return cc.instantiate(this.damageRewardItemPrefab);
    }

    private _getRankRewardNode() {
      if(this._rankItemPool.size() > 0){
          return this._rankItemPool.get();
      }
      return cc.instantiate(this.rankRewardItemPrefab);
  }
}
