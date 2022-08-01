import { RES_ICON_PRE_URL } from "../../../app/AppConst";
import { QUALITY_TYPE } from "../../../app/AppEnums";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ItemMaterial extends cc.Component {
    @property(cc.Label) count: cc.Label = null;
    @property(cc.Label) level: cc.Label = null;
    @property(cc.Node) levelBg: cc.Node = null;
    @property(cc.Label) selCount: cc.Label = null;
    @property(cc.Node) mask: cc.Node = null;
    @property(cc.Sprite) icon: cc.Sprite = null;
    @property(cc.Node) starNode: cc.Node = null;
    @property(cc.Node) starBg: cc.Node = null;
    @property(cc.Node) suitIcon: cc.Node = null;
    @property(cc.Node) buttonMinus: cc.Node = null;
    @property(cc.Node) buttonAdd: cc.Node = null;
    @property([cc.SpriteFrame]) sprList: cc.SpriteFrame[] = new Array<cc.SpriteFrame>();

    private _spriteLoader = new SpriteLoader();
    private _totalCount = 0;
    private _selCount = 0;
    private _isEquipMent = false;
    private _clickStatus = true;
    private _itemID: number = 0;
    private _seq: number = -1;
    private _handler: Function = null;
    
    get itemID () {
        return this._itemID; 
    }

    set itemID (v: number) {
        this._itemID = v
    }

    set clickStatus(val: boolean) {
        this._clickStatus = val;
    }

    set seq (v: number) {
        this._seq = v;
    }

    get seq () {
        return this._seq
    }

    set isEquipment(val: boolean) {
        this._isEquipMent = val;
        this.level.node.active = val;
        this.count.node.active = !val;
        this.buttonAdd.active = !val;
        this.buttonMinus.active = !val;
    }

    get isEquipment () {
        return this._isEquipMent
    }
    
    set totalCount(val: number) {
        this._totalCount = val;
    }

    get totalCount () {
        return this._totalCount
    }

    //获取选中数量
    get selectNum() {
        return this._selCount || 0;
    }
    // onLoad () {}

    start() {
    }

    setHandler (handle: Function) {
        this._handler = handle
    }

    public updateQuality(quality: QUALITY_TYPE) {
        if (quality - 2 >= this.sprList.length) return;
        this.node.getComponent(cc.Sprite).spriteFrame = this.sprList[quality - 2];
    }

    public updateStar(star: number) {
        if (!this.starNode) return;

        let isZeroStar = star <= 0;
        this.starBg.active = !isZeroStar;
        this.starNode.active = !isZeroStar;
        if(isZeroStar) return;

        for (let i = 0; i < 6; i++) {
            this.starNode.getChildByName(`${i}`).active = true;
            this.starNode.getChildByName(`${i}`).children[0].active = i < star;
        }
    }

    public updateIcon(url: string) {
        if (!url || url == "") { 
            this.icon.node.active = false;
            return;
        } 
        // resourceManager.load(`textures/item/${url}`, cc.SpriteFrame).then((info) => {
        //     this.icon.spriteFrame = info.res;
        //     this.icon.node.active = true;
        // })

        this._spriteLoader.changeSpriteP(this.icon, `${RES_ICON_PRE_URL.BAG_ITEM}/${url}`).then(() => {
            this.icon.node.active = true;
        });
    }

    public updateCount(count: number) {
        this._totalCount = count;
        this.count.string = count < 1000000? `${count}` : `${Math.floor(count / 10000)}万`;
        this.count.node.active = true;
    }

    public updateLevel(level: number) {
        this.level.node.active = true;
        this.levelBg.active = true;
        this.level.string = level >= bagDataUtils.equipMaxLevel ? `满级` : `${level}级`;
    }

    public updateSuitIcon(suitID: number) {
        if (suitID) {
            this.suitIcon.active = true;
            let iconPath: string = resPathUtils.getEquipSuitIconPath(suitID);
            this._spriteLoader.changeSpriteP(this.suitIcon.getComponent(cc.Sprite), iconPath).catch(() => {
                this.suitIcon.getComponent(cc.Sprite).spriteFrame = null;
            });
        }
    }

    public updateSelectCount(count: number) {
        if (this._isEquipMent) return;
        if (!count || count == 0) {
            //不需处理选中状态，未选中
            this.count.node.active = true;
            this.selCount.node.active = false;
            this.buttonMinus.active = false;
        } else {
            this.count.node.active = false;
            this.selCount.node.active = true;
            this.buttonMinus.active = true;
        }
        this._selCount = count;
        this.selCount.string = `${count}/${this._totalCount}`;
    }
    //恢复至初始状态
    public clear() {
        this.suitIcon && (this.suitIcon.active = false);
        this.icon.node.active = false;
        this.count.node.active = false;
        this.level.node.active = false;
        this.levelBg.active = false;
        this.selCount.node.active = false;
        if (!this.starNode) return;
        this.starBg.active = false;
        this.starNode.active = false;
        for (let i = 0; i < 6; i++) {
            this.starNode.getChildByName(String(i)).active = false;
        }
    }
    //减少材料数量
    onButtonMinus() {
        this._handler && this._handler(this, false);
    }

    onButtonSelected() {
        if (!this._clickStatus) return;
        this._handler && this._handler(this, true);
    }

    unuse() {
        this.clear();
        this._spriteLoader.release();
    }

    reuse() {

    }
}
