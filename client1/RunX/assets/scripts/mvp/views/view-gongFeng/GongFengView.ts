/**
 *  三皇供奉主页面
 */
import { VIEW_NAME } from "../../../app/AppConst";
import { CONSECRATE_GOODS_TYPE, CONSECRATE_STATUE_TYPE } from "../../../app/AppEnums";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { ConsecrateEvents } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import StepWork from "../../../common/step-work/StepWork";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { data } from "../../../network/lib/protocol";
import { consecrateData } from "../../models/ConsecrateData";
import GetItemView from "../view-other/GetItemView";
import GongFengBagView from "./GongFengBagView";
import GongFengBeFallView from "./GongFengBefallView";
import GongFengLvRewardView from "./GongFengLvRewardView";
import GongFengSingleSpeedView from "./GongFengSingleSpeedView";
import GongFengSpeedView from "./GongFengSpeedView";
import ItemGongFengBox from "./items/ItemGongFengBox";
import ItemGongFengMain, { GongFengViewUIEvent } from "./items/ItemGongFengMain";

const {ccclass, property} = cc._decorator;

const TRIBUTE_BOX_PER_FRAME_CNT = 3;
const MAX_CNT_OF_TRIBUTE_BOX = 18

@ccclass
export default class GongFengView extends ViewBaseComponent {
    @property(cc.Sprite) bgSp: cc.Sprite = null;
    @property(cc.Prefab) itemMain: cc.Prefab = null;
    @property(cc.Node) mainRootNode: cc.Node = null;
    @property(cc.Prefab) tributeBoxPfb: cc.Prefab = null;

    private _gongFengMains: ItemGongFengMain[] = null;
    private _lvRewardView: GongFengLvRewardView = null;
    private _bagView: GongFengBagView = null;
    private _speedView: GongFengSpeedView = null;
    private _singleSpeedView: GongFengSingleSpeedView = null;
    private _befallView: GongFengBeFallView = null;

    private _tributeBoxPool: cc.NodePool = new cc.NodePool();
    private _spLoader: SpriteLoader = new SpriteLoader();

    private _goodsCfgs: Map<number, number[]> = null;

    preInit(...rest: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            for(let i = 0; i < MAX_CNT_OF_TRIBUTE_BOX; i+= TRIBUTE_BOX_PER_FRAME_CNT) {
              this.stepWork.addTask(() => {
                  for(let j = 0; j < TRIBUTE_BOX_PER_FRAME_CNT && this._tributeBoxPool.size() < MAX_CNT_OF_TRIBUTE_BOX; j++) {
                      this._tributeBoxPool.put(cc.instantiate(this.tributeBoxPfb));
                  }
              })
            }
            this.stepWork.concact(new StepWork().addTask((cb: Function) => {
                this._spLoader.changeSprite(this.bgSp, resPathUtils.getGongFengViewBgPath(), () => {
                   cb && cb();
                })
            }));
            this.stepWork.start(() => {
                resolve(true);
            })
        });
    }

    protected onInit(fID: number): void {
        guiManager.addCoinNode(this.node, fID);
        this._registerEvents();
        this._initUI();
        this._checkXinYangFull();
    }

    private _registerEvents() {
        eventCenter.register(ConsecrateEvents.RECV_ADD_TRIBUTE, this, this._onRecvAddTribute);
        eventCenter.register(ConsecrateEvents.RECV_REMOVE_TRIBUTE, this, this._onRecvRemoveTribute);
        eventCenter.register(ConsecrateEvents.RECV_SPEED_TRIBUTE, this, this._onRecvSpeedUpTribute);
        eventCenter.register(ConsecrateEvents.RECV_TAKE_TRIBUTE_REWARD, this, this._onRecvTakeTributeReward);
        eventCenter.register(ConsecrateEvents.RECV_TAKE_LV_REWARD, this, this._onRecvTakeLvReward);
        eventCenter.register(ConsecrateEvents.RECV_TAKE_BEFALL_REWARD, this, this._onRecvTakeBefallReward);
    }

    private _initUI() {
        this._gongFengMains = this._gongFengMains || [];
        for(let k in CONSECRATE_STATUE_TYPE){
            //@ts-ignore
            if(!isNaN(k)) {
                let item = cc.instantiate(this.itemMain);
                let gongFengMainComp = item.getComponent(ItemGongFengMain);
                gongFengMainComp.init(parseInt(k), {
                    clickFn: this._onClickItem.bind(this),
                    getTributeBoxFn: this._getTributeBox.bind(this),
                    releaseTributeBoxFn: this._recycleTributeBox.bind(this),
                });
                this._gongFengMains.push(gongFengMainComp);
                 //@ts-ignore
                item.setPosition(-415 + (k - 1) * 415, -25);
                this.mainRootNode.addChild(item);
            }
        }
    }

    protected onRelease(): void {
        this._spLoader.release();
        this.unscheduleAllCallbacks();
        eventCenter.unregisterAll(this);
        guiManager.removeCoinNode(this.node);
        this._lvRewardView && this._lvRewardView.closeView();
        this._lvRewardView = null;
        this._bagView && this._bagView.closeView();
        this._bagView = null;
        this._speedView && this._speedView.closeView();
        this._speedView = null;
        this._singleSpeedView && this._singleSpeedView.closeView();
        this._singleSpeedView = null;
        this._befallView && this._befallView.closeView();
        this._befallView = null;
        if(this._gongFengMains) {
            this._gongFengMains.forEach(ele => {
                ele.deInit();
            });
        }
        this._gongFengMains.length = 0;
    }

    onClickTips() {
        guiManager.loadView('GongFengIntroduceView', null);
    }

    //内部子供奉实体的点击事件响应
    private _onClickItem(evenType: GongFengViewUIEvent, ...rest: any[]) {
        switch(evenType) {
          case GongFengViewUIEvent.OPEN_LV_REWARD_VIEW:
              this._openLvRewardView(...rest);
              break;
          case GongFengViewUIEvent.OPEN_BAG_VIEW:
              this._openBagView(...rest);
              break;
          case GongFengViewUIEvent.OPEN_SPEED_VIEW:
              this._openSpeedView(...rest);
              break;
          case GongFengViewUIEvent.OPEN_SINGLE_SPEED_VIEW:
              this._openSingleSpeedView(...rest);
              break;
        }
    }

    private _backToMainView(view: GongFengBeFallView) {
        view.hide();
        let statueType = consecrateData.getFullXinYangStatue();
          //还有降临
        if(statueType != -1) {
            this._checkXinYangFull();
            return
        }
    }

    private _openLvRewardView(...rest: any[]) {
        if(!this._lvRewardView) {
            guiManager.loadView('GongFengLvRewardView', this.node, ...rest, this._onClickItem.bind(this)).then((view: ViewBaseComponent) => {
                this._lvRewardView = view as GongFengLvRewardView;
            })
        } else {
            //@ts-ignore
            this._lvRewardView.onInit(...rest, this._onClickItem.bind(this));
        }
    }

    private _openBagView(...rest: any[]) {
        let statueID = rest[0];
        if(!this._bagView) {
            guiManager.loadView('GongFengBagView', this.node, ...rest, this._getGoodsCfgs(statueID)).then((view: ViewBaseComponent) => {
                this._bagView = view as GongFengBagView;
            })
        } else {
            //@ts-ignore
            this._bagView.onInit(...rest, this._getGoodsCfgs(statueID));
        }
    }

    private _openSpeedView(...rest: any[]) {
        if(!this._speedView) {
            guiManager.loadView('GongFengSpeedView', this.node, ...rest).then((view: ViewBaseComponent) => {
                this._speedView = view as GongFengSpeedView;
            })
        } else {
            //@ts-ignore
            this._speedView.onInit(...rest);
        }
    }

    private _openSingleSpeedView(...rest: any[]) {
        if(!this._singleSpeedView) {
            guiManager.loadView('GongFengSingleSpeedView', this.node, ...rest).then((view: ViewBaseComponent) => {
                this._singleSpeedView = view as GongFengSingleSpeedView;
            })
        } else {
            //@ts-ignore
            this._singleSpeedView.onInit(...rest);
        }
    }

    private _openBeFallView(...rest: any) {
        if(!this._befallView) {
            guiManager.loadView('GongFengBefallView', this.node, ...rest).then((view: ViewBaseComponent) => {
                this._befallView = view as GongFengBeFallView;
            })
        } else {
            //@ts-ignore
            this._befallView.onInit(...rest);
        }
    }

    private _getTributeBox(): ItemGongFengBox {
        let node: cc.Node = null;
        if(this._tributeBoxPool.size() > 0) {
            node = this._tributeBoxPool.get();
        } else {
            node = cc.instantiate(this.tributeBoxPfb);
        }
        return node.getComponent(ItemGongFengBox);
    }

    private _recycleTributeBox(item: ItemGongFengBox) {
        if(!item || !cc.isValid(item.node)) return;
        item.deInit();
        this._tributeBoxPool.put(item.node);
    }

    private _getGoodsCfgs(statueID: CONSECRATE_GOODS_TYPE) {
        if(!this._goodsCfgs) {
            this._goodsCfgs = this._goodsCfgs || new Map();
            let goodsCfgs = configManager.getConfigs('consecrateGoods');
            for (let k in goodsCfgs) {
                let item = goodsCfgs[k];
                let type: number = item.ConsecrateGoodsType;
                if(!this._goodsCfgs.has(type)) {
                  this._goodsCfgs.set(type, []);
                }
                this._goodsCfgs.get(type).push(parseInt(k));
            }
        }

        let speGoods = this._goodsCfgs.get(statueID) || [];
        let uniGoods = this._goodsCfgs.get(CONSECRATE_GOODS_TYPE.UNIVERAL) || [];
        let finalGoods = speGoods.concat(uniGoods);
        finalGoods.sort((a, b) => {
            let aCfg = configUtils.getConsecrateGoodsCfg(a);
            let bCfg = configUtils.getConsecrateGoodsCfg(b);
            return bCfg.ConsecrateGoodsOrder - aCfg.ConsecrateGoodsOrder;
        })
        return finalGoods;
    }

    //添加贡品
    private _onRecvAddTribute(event: number, statueID: number,  tribute: data.IUniversalConsecrateTribute) {
        let main: ItemGongFengMain = this._gongFengMains[statueID - 1];
        main &&  main.addTribute();

        if(this._bagView && this._bagView.node.active) {
            this._bagView.upateItemBag(statueID, tribute.ItemID);
        }
        guiManager.showTips('贡品添加成功');
    }

    //移除贡品
    private _onRecvRemoveTribute(event: number, statueID: number) {
        let main: ItemGongFengMain = this._gongFengMains[statueID - 1];
        if(!main) return;
        main.refreshView();
        guiManager.showTips('贡品移除成功');
    }

    //贡品加速
    private _onRecvSpeedUpTribute(event: number, statueType: number) {
        this._speedView && this._speedView.hideView();
        this.scheduleOnce(() => {
            let main: ItemGongFengMain = this._gongFengMains[statueType - 1];
            if(!main) return;
            main.refreshView();
            guiManager.showTips('贡品加速成功');
        });
    }

    //领取贡品奖励
    private _onRecvTakeTributeReward(event: number, statueID: number, prizes: data.IItemInfo[], exp: number){
        prizes && prizes.length > 0 && guiManager.loadView(VIEW_NAME.GET_ITEM_VIEW, this.node, prizes).then((view) => {
            if(!view) return;
            (view as GetItemView).closeFunc = this._checkXinYangFull.bind(this);
        });
        let main: ItemGongFengMain = this._gongFengMains[statueID - 1];
        if(!main) return;
        main.refreshView();
    }

    //领取等级奖励
    private _onRecvTakeLvReward(event: number, statueID: number, lv: number, prizes: data.IItemInfo[], exp: number){
        prizes && prizes.length > 0 && guiManager.loadView(VIEW_NAME.GET_ITEM_VIEW, this.node, prizes);
        let main: ItemGongFengMain = this._gongFengMains[statueID - 1];
        main && main.refreshView();

        if(this._lvRewardView && this._lvRewardView.node.active) {
            this._lvRewardView.updateReward(statueID, main.visibleLv);
        }
    }

    //领取降临奖励
    private _onRecvTakeBefallReward(event: number, statueID: number, prizes: data.IItemInfo[], exp: number){
        let main: ItemGongFengMain = this._gongFengMains[statueID - 1];
        if(!main) return;
        main.refreshView();
    }

    //检查信仰奖励是否触发并打开
    private _checkXinYangFull() {
        let statueType = consecrateData.getFullXinYangStatue();
        if(statueType == -1) return;
        this._openBeFallView(statueType, this._backToMainView.bind(this));
    }
}
