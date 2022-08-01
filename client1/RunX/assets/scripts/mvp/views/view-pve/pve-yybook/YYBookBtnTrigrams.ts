import { TRIGRAMS } from "../../../../app/AppConst";
import { ROLE_TYPE } from "../../../../app/BattleConst";
import guiManager from "../../../../common/GUIManager";
import { ItemPveRolePool, ItemRolePool } from "../../../../common/res-manager/NodePool";
import { gamesvr } from "../../../../network/lib/protocol";
import { BASE_ANIM } from "../../view-item/ItemRole";
import ItemPveRole from "../common/ItemPveRole";
import PVEYYBookView from "./PVEYYBookView";

const {ccclass, property} = cc._decorator;

@ccclass
export default class YYBookBtnTrigrams extends cc.Component {
    @property([cc.SpriteFrame]) defaultSpriteFrames: cc.SpriteFrame[] = []; 
    @property([cc.SpriteFrame]) selectedSpriteFrames: cc.SpriteFrame[] = [];

    @property(cc.Sprite) bg: cc.Sprite = null;
    @property(cc.Node) skeletonParent: cc.Node = null;
    @property(cc.Sprite) trigramsImage: cc.Sprite = null;

    private _root: PVEYYBookView = null;    // 主界面脚本
    private _trigrams: number = null;       // 按钮对应卦象

    private _itemPveRole: ItemPveRole = null;     // 英雄模型脚本

    init(root: PVEYYBookView, trigrams: number, idx: number) {
        this._root = root;
        this._trigrams = trigrams;

        this.trigramsImage.spriteFrame = this.defaultSpriteFrames[trigrams-1];
        this.skeletonParent.scaleX = idx % 2 == 0 ? 1 : -1;
    }

    deInit() {
        this._root = null;
        this._trigrams = null;
        this.removeHeroRole();
    }

    onClickThis(eventTouch: cc.Event.EventTouch) {
        if (this._root.isProtalActive()) {
            guiManager.showDialogTips(1000153);
            return;
        }

        if (!this._root.isTrigramsHaveHero(this._trigrams)) {
            // 卦象上无英雄，则弹窗选择英雄
            this._root.showSelectHeroView(this._trigrams);
        } else {
            // 卦象上有英雄，则卸下
            this.removeHeroRole();
            this._root.removeHero(this._trigrams);
        }
    }

    /**
     * 添加英雄模型
     * @param heroID 英雄ID
     */
    addHeroRole(heroID: number) {
        this.removeHeroRole();

        this._itemPveRole = ItemPveRolePool.get();    // 后续考虑抽一个简单的人物模型出来，在战斗外其它界面展示用
        this._itemPveRole.init({roleID: heroID, roleType: ROLE_TYPE.HERO});
        this._itemPveRole.node.setPosition(0, 0);
        this.skeletonParent.addChild(this._itemPveRole.node);

        this.trigramsImage.spriteFrame = this.selectedSpriteFrames[this._trigrams-1];
    }

    removeHeroRole() {
        ItemPveRolePool.put(this._itemPveRole);
        this._itemPveRole = null;

        this.trigramsImage.spriteFrame = this.defaultSpriteFrames[this._trigrams-1];
    }
}
