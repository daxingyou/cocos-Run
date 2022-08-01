/**
 * 张海洋
 * 2021.4.26
 * 关卡 奖励物品的一个item
 */

import { RES_ICON_PRE_URL } from "../../../app/AppConst";
import { configUtils } from "../../../app/ConfigUtils";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";

const { ccclass, property } = cc._decorator;

interface ItemInfo {
    itemId: number;
    num: number;
}

@ccclass
export default class LevelGoodItem extends cc.Component {

    @property(cc.Sprite)
    bgSprite: cc.Sprite = null;

    @property(cc.Sprite)
    goodSprite: cc.Sprite = null;

    private _goodInfo: any = null;
    private _spriteLoader: SpriteLoader = null;
    onLoad() {
        if (!this._spriteLoader) {
            this._spriteLoader = new SpriteLoader();
        }
    }

    start() {

    }
    /**
     * 
     * @param lessonRewardItemInfo
     */
    setData(lessonRewardItemInfo: ItemInfo) {
        let cfg: any = configUtils.getItemConfig(lessonRewardItemInfo.itemId);
        if (!cfg) cfg = configUtils.getEquipConfig(lessonRewardItemInfo.itemId);
        if (cfg) {
            this._goodInfo = cfg;
        }
        this.refreshGoodView();
    }
    /**
     * 更新物品显示
     */
    refreshGoodView() {
        // 动态更换物品icon 更换物品品质
        if (this._goodInfo && this._goodInfo.ItemIcon) {
            if (this._spriteLoader) {
                this._spriteLoader.changeSprite(this.goodSprite, `${RES_ICON_PRE_URL.BAG_ITEM}/${this._goodInfo.ItemIcon}`);
            }
        }
    }

    onDestroy() {
        if (this._spriteLoader) {
            this._spriteLoader.release();
            this._spriteLoader = null;
        }
    }
}
