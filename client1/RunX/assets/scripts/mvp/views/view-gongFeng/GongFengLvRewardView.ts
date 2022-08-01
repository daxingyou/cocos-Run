/*
 * @Description:
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2022-06-08 20:03:15
 * @LastEditors: lixu
 * @LastEditTime: 2022-06-15 19:49:50
 */

import { CONSECRATE_STATUE_NAME } from "../../../app/AppEnums";
import { BagItemInfo } from "../../../app/AppType";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import UIGridView, { GridData } from "../../../common/components/UIGridView";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import moduleUIManager from "../../../common/ModuleUIManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { data } from "../../../network/lib/protocol";
import { consecrateData } from "../../models/ConsecrateData";
import { consecrateOpt } from "../../operations/ConsecrateOpt";
import ItemGongFengLvReward from "./items/ItemGongFengLvReward";
import { ConsecreateStatueLVData } from "./items/ItemGongFengMain";

const {ccclass, property} = cc._decorator;

const PER_FRAME_NEW_CNT = 2;

@ccclass
export default class GongFengLvRewardView extends ViewBaseComponent {
    @property(cc.Node) rootNode: cc.Node = null;
    @property(UIGridView) rewardList: UIGridView = null;
    @property(cc.Label) nameLb: cc.Label = null;
    @property(cc.Label) lv: cc.Label = null;
    @property(cc.Label) exp: cc.Label = null;
    @property(cc.ProgressBar) expProgress: cc.ProgressBar = null;
    @property(cc.Label) tributeBox: cc.Label = null;
    @property(cc.Label) speed: cc.Label = null;
    @property(cc.Sprite) iconSp: cc.Sprite = null;
    @property(cc.Prefab) itemPfb: cc.Prefab = null;

    private _statueID: number = 0;
    private _statueInfo: data.IUniversalConsecrateStatue = null;
    private _lvData: ConsecreateStatueLVData = null;
    private _lvRewards: Map<number, BagItemInfo[]> = null;
    private _operHandler: Function = null;
    private _itemLvRewardPool: cc.NodePool = new cc.NodePool();
    private _spLoader: SpriteLoader = new SpriteLoader();

    preInit(...rest: any[]): Promise<any> {
        // 分帧加载Item
        return new Promise((resolve, reject) => {
            let totoalCnt = 6;
            for(let i = 0; i < totoalCnt; i += PER_FRAME_NEW_CNT){
                let newCnt = Math.min(totoalCnt - i, PER_FRAME_NEW_CNT);
                this.stepWork.addTask(() => {
                    for(let j = 0; j < newCnt; j++) {
                      this._itemLvRewardPool.put(cc.instantiate(this.itemPfb));
                    }
                });
            }
            this.stepWork.start(() => {
                resolve(true);
            });
        });
    }

    protected onInit(statueID: number, lvData: ConsecreateStatueLVData, lvRewards: Map<number, BagItemInfo[]>, visibleLv: number, operHandler?: Function): void {
        this._statueID = statueID;
        this._statueInfo = consecrateData.getStatueInfo(this._statueID);
        this._lvData = lvData;
        this._lvRewards = lvRewards;
        this._operHandler = operHandler;
        this.node.active = true;
        this._initUI();
        this.rewardList.scrollTo({key: visibleLv + '', data: null})
    }

    protected onRelease(): void {
        this._spLoader.release();
        this.rewardList.clear();
        this._itemLvRewardPool.clear();
        this._statueInfo = null;
        this._lvRewards = null;
        this._lvData = null;
        this._operHandler = null;
    }

    onClickClose() {
        this.node.active = false;
    }

    private _initUI() {
        this._spLoader.changeSprite(this.iconSp, resPathUtils.getGongFengStatueIconPath(this._statueID, true));
        this.nameLb.string = `雕像：${CONSECRATE_STATUE_NAME[this._statueID+'']}`;
        this.lv.string = `等级：${this._lvData.lv}`;
        let consecrateCfg = configUtils.getConsecrateCfgByIDAndLv(this._statueID, this._lvData.lv + 1);
        if(!consecrateCfg) {
            this.exp.string = '已满级';
            this.expProgress.progress = 1;
        } else {
            this.exp.string = `${(this._statueInfo.StatueExp || 0) - this._lvData.expCnt}/${consecrateCfg.ConsecrateLevelExp}`;
            this.expProgress.progress = ((this._statueInfo.StatueExp || 0) - this._lvData.expCnt) / consecrateCfg.ConsecrateLevelExp;
        }

        this.tributeBox.string = `供奉栏：${this._lvData.tributeBoxCnt || 0}`;
        this.speed.string = `加速：${(this._lvData.speedCnt || 0) / 100}%`;

        this._initRewardList();
    }

    private _initRewardList() {
        this.rewardList.clear();
        if(!this._lvRewards || this._lvRewards.size == 0) return;
        let gridData: GridData[] = [];
        this._lvRewards.forEach((value, key) => { gridData.push({key: key + '', data: value})});

        this.rewardList.init(gridData, {
            onInit: (item: ItemGongFengLvReward, data: GridData) => {
              let lv = parseInt(data.key);
              let items = data.data as BagItemInfo[];
              item.init(items, lv, this._statueID, this._lvData.lv, (itemInfo: BagItemInfo) => {
                  moduleUIManager.showItemDetailInfo(itemInfo.id, itemInfo.count, this.node.parent);
              }, (rewardLv: number) => {
                  consecrateOpt.sendGetRewardOfStatueLvReq(this._statueID, rewardLv);
              });
            },
            getItem: (): ItemGongFengLvReward => {
                let node = this._getLvRewardItem();
                node.active = true;
                return node.getComponent(ItemGongFengLvReward);
            },
            releaseItem: (item: ItemGongFengLvReward) => {
                item.deInit();
                this._itemLvRewardPool.put(item.node);
            }
        });
    }

    private _getLvRewardItem(): cc.Node {
        if(this._itemLvRewardPool.size() > 0) {
            return this._itemLvRewardPool.get();
        }

        let node = cc.instantiate(this.itemPfb);
        return node;
    }

    updateReward(statueID: number, visibleLv?: number) {
        if(this._statueID != statueID) return;
        this._statueInfo = consecrateData.getStatueInfo(this._statueID);
        let items: Map<string, ItemGongFengLvReward> = this.rewardList.getItems() as  Map<string, ItemGongFengLvReward>;
        items.forEach(ele => {
            ele.updateTakeRewardState(this._lvData.lv);
        });
        if(typeof visibleLv != 'undefined') {
            this.rewardList.scrollTo({key: visibleLv +'', data: null});
        }
    }
}
