import { utils } from "../../../app/AppUtils";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { eventCenter } from "../../../common/event/EventCenter";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { data } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { Equip } from "../../template/Equip";

const { ccclass, property } = cc._decorator;

@ccclass
export default class EquipItem extends cc.Component {
    @property(cc.Boolean) isShowStarBg: boolean = false;
    @property(cc.Node) starsNode: cc.Node = null;
    @property(cc.Node) starsBgNode: cc.Node = null;
    @property(cc.Node) suitNode: cc.Node = null;
    @property(cc.Label) equipLvLb: cc.Label = null;
    @property(cc.Sprite) equipIconSp: cc.Sprite = null;
    @property(cc.Sprite) equipQualitySp: cc.Sprite = null;
    @property(cc.Node) selected: cc.Node = null;
    @property(cc.Node) isUsed: cc.Node = null;
    @property(cc.Boolean) isShowUsed: boolean = false;

    private _equip: data.IBagUnit = null;
    private _spriteLoader: SpriteLoader = null;
    onLoad() {
        this.selected.active && (this.selected.active = false);
    }

    setData(equip: data.IBagUnit, sub?: { isShowUsed: boolean }) {
        if (!this._spriteLoader) {
            this._spriteLoader = new SpriteLoader();
        }
        this._equip = equip;
        if (sub) {
            if (sub.isShowUsed) {
                this.isShowUsed = sub.isShowUsed;
            }
        }
        this.refreshView();
    }

    refreshView() {
        if(this._equip) {
            let equip: Equip = bagData.getEquipById(this._equip.ID, utils.longToNumber(this._equip.Seq));
            this.starsBgNode.active = this.isShowStarBg;
            let equipConfig: cfg.Equip = configUtils.getEquipConfig(this._equip.ID);
            this.equipLvLb.string = `${equip.getEquipLevel()}`;
            this.suitNode.active = equipConfig.SuitId != 0;
            this.isUsed.active = bagDataUtils.checkEquipIsDressed(this._equip) && this.isShowUsed;
            for (let i = 0; i < this.starsNode.childrenCount; ++i) {
                this.starsNode.children[i].active = i < this._equip.EquipUnit.Star;
            }
            // todo 加载武器品质框 有可能会改图片跟路径
            this._spriteLoader.changeSprite(this.equipQualitySp, resPathUtils.getQualityFrameUrl(this._equip.ID));
    
            // todo 加载武器icon
            this._spriteLoader.changeSprite(this.equipIconSp, resPathUtils.getEquipIcon(this._equip.ID));
        }
    }

    refreshSelect(equip: data.IBagUnit) {
        if (equip == this._equip) {
            !this.selected.active && (this.selected.active = true);
        } else {
            this.selected.active && (this.selected.active = false);
        }
    }

    removeEvent() {
        cc.isValid(this.node) && this.node.off(cc.Node.EventType.TOUCH_END);
        eventCenter.unregisterAll(this);
    }

    onDestroy() {
        this.removeEvent();
        if (this._spriteLoader) {
            this._spriteLoader.release();
            this._spriteLoader = null;
        }
    }

}
