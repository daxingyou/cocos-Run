
import UIGridView, { GridData } from "../../../../common/components/UIGridView";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../../common/event/EventCenter";
import { commonEvent, trialDevilEvent } from "../../../../common/event/EventData";
import guiManager from "../../../../common/GUIManager";
import { data } from "../../../../network/lib/protocol";
import { pveTrialData } from "../../../models/PveTrialData";
import { userData } from "../../../models/UserData";
import { pveDataOpt } from "../../../operations/PveDataOpt";
import ItemPVEXinMoFaXiangRank from "./ItemPVEXinMoFaXiangRank";

/**
 * 心魔法相排行榜
 */
const { ccclass, property } = cc._decorator;

const CNT_OF_PER_FRAME_CREATE_INS = 3;

@ccclass
export default class PVEXinMoFaXiangRankView extends ViewBaseComponent {
    @property(UIGridView) rankList: UIGridView = null;
    @property(cc.Node) selfRankCOntainor: cc.Node = null;
    @property(cc.Prefab) rankItemPrefab: cc.Prefab = null;
    @property(cc.Node) emptyNode: cc.Node = null;

    private _rankItemPool: cc.NodePool = new cc.NodePool();
    private _selfRankItem: ItemPVEXinMoFaXiangRank = null;

    preInit(...rest: any[]): Promise<any> {
        this.emptyNode.active = false;
        return new Promise((resolve, reject) => {
            for(let i = 0, len = 9; i < len; i += CNT_OF_PER_FRAME_CREATE_INS) {
                let curLen = Math.min(CNT_OF_PER_FRAME_CREATE_INS, len - i);
                this.stepWork.addTask(() => {
                    for(let j = 0; j < curLen; j++) {
                      this._rankItemPool.put(cc.instantiate(this.rankItemPrefab));
                    }
                })
            }

            this.stepWork.start(() => {
                resolve(true);
            })
        });
    }

    protected onInit(...args: any[]): void {
        this._registerEvents();
        pveDataOpt.reqGetTrialDevilRankList();
    }

    protected onRelease(): void {
        eventCenter.unregisterAll(this);
        this.rankList.clear();
        if(this._selfRankItem) {
            this._selfRankItem.deInit();
            this._rankItemPool.put(this._selfRankItem.node);
            this._selfRankItem = null;
        }
        this._rankItemPool.clear();
    }

    private _registerEvents() {
        eventCenter.register(commonEvent.TIME_DAY_RESET, this, this._onDayReset);
        eventCenter.register(trialDevilEvent.RECV_RANK_LIST, this, this._recvRankList);
    }

    private _updateRankList(rankData: data.ITrialDevilDamage[]) {
        this.rankList.clear();
        if(!rankData || rankData.length == 0) {
            this.emptyNode.active = true;
            return;
        }
        this.emptyNode.active = false;

        let gridData: GridData[] = [];
        rankData.forEach((ele, idx) => {
            gridData.push({key: idx+'', data: ele});
        })

        this.rankList.init(gridData, {
            onInit: (item: ItemPVEXinMoFaXiangRank, data: GridData) => {
                let rankNo = parseInt(data.key);
                let itemData: data.ITrialDevilDamage = data.data;
                item.init(rankNo, itemData.User, itemData.Damage || 0);
            },
            releaseItem: (item: ItemPVEXinMoFaXiangRank) => {
                item.deInit();
                this._rankItemPool.put(item.node);
            },
            getItem: (): ItemPVEXinMoFaXiangRank => {
                let node = this._getRankItemNode();
                node.active = true;
                return node.getComponent(ItemPVEXinMoFaXiangRank);
            }
        });
    }

    private _updateSelfRank() {
        if(!this._selfRankItem) {
            this._selfRankItem = this._getRankItemNode().getComponent(ItemPVEXinMoFaXiangRank);
            this._selfRankItem.node.parent = this.selfRankCOntainor;
            this._selfRankItem.node.setPosition(0, 0);
        }

        let rankNo = pveTrialData.trialDevilData.selfRank;
        this._selfRankItem.init(rankNo || -1, {UserID: userData.accountData.UserID
            , Name: userData.accountData.Name
            , HeadID: userData.accountData.HeadID
            , HeadFrameID: userData.accountData.HeadFrameID
            , Exp: userData.accountData.Exp
        }, pveTrialData.trialDevilData.data.TotalDamage);
    }

    private _getRankItemNode() {
        if(this._rankItemPool.size() > 0) {
            return this._rankItemPool.get();
        }
        return cc.instantiate(this.rankItemPrefab);
    }

    private _recvRankList(event: number, onlySelf: boolean, selfRank: number, rankList: data.ITrialDevilDamage[]) {
        if(onlySelf) {
            this._updateSelfRank();
            return;
        }
        this._updateSelfRank();
        this._updateRankList(rankList);
    }

    //0点刷新
    private _onDayReset() {
        guiManager.showTips('当前排行榜已重置');
        this.closeView();
    }
}
