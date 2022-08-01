import { CustomDialogId, VIEW_NAME } from "../../../app/AppConst";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import guiManager from "../../../common/GUIManager";
import moduleUIManager from "../../../common/ModuleUIManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { data } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { guildData } from "../../models/GuildData";
import { guildOpt } from "../../operations/GuildOpt";
import ItemBag from "../view-item/ItemBag";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemDonate extends cc.Component {
    @property(cc.Label) donateType: cc.Label = null;
    @property(cc.Sprite) donateTypeIcon: cc.Sprite = null;
    @property(cc.Node) rewardsParent: cc.Node = null;
    @property(cc.Sprite) costIcon: cc.Sprite = null;
    @property(cc.Label) costNum: cc.Label = null;

    private _donateId: number = 0;
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _loadView: Function = null;
    init(donateId: number, loadView: Function) {
        this._donateId = donateId;
        this._loadView = loadView;
        this._refreshView();
    }

    deInit() {
        this._spriteLoader.release();
        this._clearRewards();
    }

    reuse() {
    }

    unuse () {
        this.deInit()
    }

    private _refreshView() {
        const donateCfg = configUtils.getGuildDonateConfig(this._donateId);
        if(donateCfg) {
            if(donateCfg.UseImage) {
                this._spriteLoader.changeSprite(this.donateTypeIcon, donateCfg.UseImage);
            }
            if(donateCfg.MoneyCost) {
                const costs = donateCfg.MoneyCost.split(';');
                const itemId = Number(costs[0]);
                const count = Number(costs[1]);
                const costIconUrl = resPathUtils.getItemIconPath(itemId);
                this._spriteLoader.changeSprite(this.costIcon, costIconUrl);
                this.costNum.string = `${count}`;

                const itemCfg = configUtils.getItemConfig(itemId);
                if(itemCfg) {
                    this.donateType.string = `捐献${itemCfg.ItemName}`;
                }
            }
            if(donateCfg.RewardShow) {
                this._clearRewards()
                const rewards = donateCfg.RewardShow.split('|');
                for(let i = 0; i < rewards.length; ++i) {
                    const reward = rewards[i].split(';');
                    const itemId = Number(reward[0]);
                    const count = Number(reward[1]);
                    const itemBagCmp = ItemBagPool.get();
                    this.rewardsParent.addChild(itemBagCmp.node);
                    itemBagCmp.node.scale = 0.6;
                    itemBagCmp.init({
                        id: itemId,
                        count: count,
                        clickHandler: () => {
                            let newitem: data.IBagUnit = { ID: itemId, Count: count, Seq: 0 };
                            let findItem = bagData.getItemByID(itemId);
                            let item: data.IBagUnit = (count || !findItem) ? newitem : findItem.Array[0];
                            this._loadView(VIEW_NAME.TIPS_ITEM, item);
                        }
                    })
                }
            }
        }
    }

    onClickDonate() {
        const donateCfg = configUtils.getGuildDonateConfig(this._donateId);
        const costs = donateCfg.MoneyCost.split(';');
        const itemId = Number(costs[0]);
        const count = Number(costs[1]);
        const bagMoney = bagData.getItemCountByID(itemId);
        if(bagMoney >= count) {
            const maxDonateCount = this._getMaxDonateCount();
            if(guildData.donateTimes < maxDonateCount) {
                guildOpt.sendDonate(this._donateId);
            } else {
                guiManager.showDialogTips(99000051);
            }
        } else {
            guiManager.showDialogTips(CustomDialogId.COMMON_ITEM_NOT_ENOUGH, itemId);
        }
    }

    private _getMaxDonateCount(): number {
        const lv = guildData.lv;
        const lvCfg = configUtils.getGuildLevelCfg(lv);
        if(lvCfg) {
            return lvCfg.GuildLevelDonateNum;
        }
        return 0;
    }

    private _clearRewards() {
        const children = [...this.rewardsParent.children];
        children.forEach(_c => {
            _c.removeFromParent();
            _c.scale = 1;
            ItemBagPool.put(_c.getComponent(ItemBag));
        });
    }

}
