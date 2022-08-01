import { ALLTYPE_TYPE, EQUIP_PART_TYPE } from "../../../app/AppEnums";
import { utils } from "../../../app/AppUtils";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { data } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { Equip } from "../../template/Equip";
import ItemBag from "../view-item/ItemBag";

const { ccclass, property } = cc._decorator;

@ccclass
export default class EquipBasicInfoView extends cc.Component {
    @property(cc.Label)             nameLb: cc.Label = null;
    @property(cc.Label)             lvLb: cc.Label = null;
    @property(cc.Label)             expLb: cc.Label = null;
    @property(cc.Sprite)            equipTextureTypeSp: cc.Sprite = null;
    @property(cc.ProgressBar)       expProgress: cc.ProgressBar = null;
    @property(cc.Sprite)            equipPartTypeSp: cc.Sprite = null;
    @property(cc.Node)              itemRoot: cc.Node = null;

    private _equip: data.IBagUnit = null;
    private _spriteLoader: SpriteLoader = null;
    private _itemBag: ItemBag = null;
    setData(equip: data.IBagUnit) {
        this._spriteLoader = this._spriteLoader || new SpriteLoader();
        this._equip = equip;
        this.refreshView();
    }

    refreshView() {
        this.node.active = true;
        let equip: Equip = bagData.getEquipById(this._equip.ID, utils.longToNumber(this._equip.Seq));
        let equipLv: number = equip.getEquipLevel();
        if(!this._itemBag) {
            let itemBag = ItemBagPool.get().node;
            itemBag.parent = this.itemRoot || this.node;
            this._itemBag = itemBag.getComponent(ItemBag);
        }
        this._itemBag.init({
            id: this._equip.ID,
            level: equipLv,
            star: this._equip.EquipUnit.Star
        });

        this.nameLb.string = equip.equipCfg.EquipName;

        //专属装备没有升级，只有升星
        let isExclusive = equip.isExclusive();
        this.expProgress.node.active = !isExclusive;
        this.expLb.node.active = !isExclusive;
        this.lvLb.node.active = !isExclusive;
        if(!isExclusive){
            // exp
            this.lvLb.string = `等级：${equipLv}/${bagDataUtils.curEquipMaxLevel}`;
            if (equipLv == bagDataUtils.curEquipMaxLevel) {
                this.expProgress.progress = 1;
                this.expLb.string = `满级`;
            } else {
                let curExp: number = equip.getEquipCurExp();
                let curMaxExp: number = equip.getEquipCurMaxExp();
                this.expProgress.progress = curExp / curMaxExp;
                this.expLb.string = `经验：${curExp}/${curMaxExp}`;
            }
        }

        if (!bagDataUtils.checkCommonEquip(equip.equipCfg.PositionType)) {
            !this.equipTextureTypeSp.node.active && (this.equipTextureTypeSp.node.active = true);
            this._spriteLoader.changeSprite(this.equipTextureTypeSp, resPathUtils.getHeroAllTypeIconUrl(configUtils.getAllTypeConfig(ALLTYPE_TYPE.HERO_EQUIP_TYPE, equip.equipCfg.TextureType).HeroTypeIcon));
        } else {
            this.equipTextureTypeSp.node.active && (this.equipTextureTypeSp.node.active = false);
        }
        let partUrl: string = equip.getEquipPositionIcon();
        this._spriteLoader.changeSpriteP(this.equipPartTypeSp, partUrl).catch(() => {
            this.equipPartTypeSp.spriteFrame = null;
        });
    }

    deInit(){
        if (this._itemBag){
            ItemBagPool.put(this._itemBag);
            this._itemBag = null;
        }
    }
}
