import { utils } from "../../../../app/AppUtils";
import moduleUIManager from "../../../../common/ModuleUIManager";
import { RED_DOT_MODULE } from "../../../../common/RedDotManager";
import { ItemBagPool } from "../../../../common/res-manager/NodePool";
import { cfg } from "../../../../config/config";
import { pveDataOpt } from "../../../operations/PveDataOpt";
import ItemBag, { ITEM_RECEIVED_TYPE } from "../../view-item/ItemBag";
import ItemRedDot from "../../view-item/ItemRedDot";
import PVEChallengeView, { CHALLENGE_REWARD_STATE } from "./PVEChallengeView";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemStageAward extends cc.Component {
    @property([cc.SpriteFrame]) numberSprites: cc.SpriteFrame[] = [];

    @property(cc.Sprite) levelIcon: cc.Sprite = null;
    @property(cc.Node) receivedGou: cc.Node = null;
    @property(ItemRedDot) itemRedDot: ItemRedDot = null;
    @property(cc.Node) itemAwards: cc.Node = null;

    items: ItemBag[] = [];
    rewardID: number;

    onInit(rootView: PVEChallengeView, rewardConfig: cfg.PVEChallengeReward, rewardState: CHALLENGE_REWARD_STATE) {
        // 仅在可领取状态下允许点击
        this.node.getComponent(cc.Button).interactable = rewardState === CHALLENGE_REWARD_STATE.CAN_RECEIVE;

        // 根据次数显示ICON的SpriteFrame
        let idx: number = (rewardConfig.PVEChallengeRewardNeed / 3) - 1;
        this.levelIcon.spriteFrame = this.numberSprites[idx];

        // 根据状态调整ICON颜色
        if (rewardState === CHALLENGE_REWARD_STATE.HAVE_RECEIVED) {
            this.levelIcon.node.color = cc.Color.GRAY;
            this.receivedGou.active = true;
        } else {
            this.levelIcon.node.color = cc.Color.WHITE;
            this.receivedGou.active = false;
        }
        
        // 可领取状态下item不能点击，其它情况下可以点击
        let clickHandler: Function = null;
        // 已领取的item显示已领取ICON
        let receivedType: ITEM_RECEIVED_TYPE = rewardState === CHALLENGE_REWARD_STATE.HAVE_RECEIVED ? ITEM_RECEIVED_TYPE.GREEN : null;

        this.clearItems();
        let parseResult =  utils.parseStingList(rewardConfig.PVEChallengeRewardShow);
        let item: ItemBag = null;
        for (let i = 0; i < parseResult.length; ++i) {
            item = ItemBagPool.get();
            this.items.push(item);

            if (rewardState !== CHALLENGE_REWARD_STATE.CAN_RECEIVE) {
                clickHandler = () => {
                    moduleUIManager.showItemDetailInfo(Number(parseResult[i][0]), Number(parseResult[i][1]), rootView.node);
                }
            } else {
                item.getComponent(cc.Button).enabled = false;
            }

            item.init({
                id: Number(parseResult[i][0]),
                count: Number(parseResult[i][1]),
                clickHandler: clickHandler,
                receivedType: receivedType
            });

            this.itemAwards.addChild(item.node);
        }

        this.node.width += item.node.width * parseResult.length + 
                            this.itemAwards.getComponent(cc.Layout).spacingX * (parseResult.length - 1);

        this.itemRedDot.setData(RED_DOT_MODULE.CHALLENGE_STAGE_AWARD, {
            args: [rewardConfig]
        });

        this.rewardID = rewardConfig.PVEChallengeRewardId;
    }

    onClickItemStageAward() {
        pveDataOpt.reqTrialRespectReward(this.rewardID);
    }

    deInit() {
        this.clearItems();
        this.itemRedDot.deInit();
    }

    clearItems() {
        this.items.forEach((item) => {
            item.getComponent(cc.Button).enabled = true;
            ItemBagPool.put(item);
        });

        this.items = [];
    }
}
