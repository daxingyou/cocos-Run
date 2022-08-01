import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { data } from "../../../network/lib/protocol";
import { EquipInfo } from "../../models/HeroData";
import { modelManager } from "../../models/ModeManager";
import { optManager } from "../../operations/OptManager";

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

    private _equip: data.IBagUnit = null;
    private _spriteLoader: SpriteLoader = null;
    onLoad() {
        if (!this._spriteLoader) {
            this._spriteLoader = new SpriteLoader();
        }
        this.addEvent();
    }

    start() {
        this.refreshView();
    }

    setData(equip: data.IBagUnit) {
        this._equip = equip;
    }

    refreshView() {
        this.starsBgNode.active = this.isShowStarBg;
        let equipConfig: EquipInfo = modelManager.bagData.getEquipBasicConfig(this._equip);
        this.equipLvLb.string = `${modelManager.bagData.getEquipLevel(this._equip)}`;
        this.suitNode.active = equipConfig.SuitId != 0;
        for (let i = 0; i < this.starsNode.childrenCount; ++i) {
            this.starsNode.children[i].active = i < this._equip.EquipUnit.Star;
        }
        // todo 加载武器品质框 有可能会改图片跟路径
        this._spriteLoader.changeSprite(this.equipQualitySp, `textures/equipQuality/common_bg_character_${equipConfig.Quality}`);
        // todo 加载武器icon
        // this._spriteLoader.changeSprite(this.equipIconSp, equipConfig.Icon);
    }

    onClickEquip() {
        // todo 显示装备详情
        // let equipConfig: EquipInfo = modelManager.bagData.getEquipBasicConfig(this._equip);
        optManager.heroOpt.showEquipPropertyDlg(this._equip, this.node.parent);
    }

    addEvent() {
        this.node && this.node.on(cc.Node.EventType.TOUCH_END, this.onClickEquip, this);
    }

    removeEvent() {
        cc.isValid(this.node) && this.node.off(cc.Node.EventType.TOUCH_END);
    }

    onDestroy() {
        this.removeEvent();
        if (this._spriteLoader) {
            this._spriteLoader.release();
            this._spriteLoader = null;
        }
    }
}
