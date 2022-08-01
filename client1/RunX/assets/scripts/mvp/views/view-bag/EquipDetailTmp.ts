import RichTextEx from "../../../common/components/rich-text/RichTextEx";
import ItemRedDot from "../view-item/ItemRedDot";

/*
 * @Author: xuyang
 * @Date: 2021-06-01 16:50:09
 * @Description: 绑定装备详情组件
 */
const { ccclass, property } = cc._decorator;
@ccclass
export default class EquipDetailTmp extends cc.Component {

    @property(cc.ProgressBar) eExpP: cc.ProgressBar = null;
    @property(RichTextEx) eExp: RichTextEx = null;
    @property(RichTextEx) eGrade: RichTextEx = null;
    @property(cc.Label) eName: cc.Label = null;
    @property(cc.Sprite) eType: cc.Sprite = null;
    @property(cc.Sprite) ePart: cc.Sprite = null;
    @property(cc.Node) enhanceBtn: cc.Node = null;
    @property(cc.Node) breakBtn: cc.Node = null;
    @property(cc.Node) spiritBtn: cc.Node = null;
    @property(ItemRedDot) enhanceBtnRedot: ItemRedDot = null;
    @property(ItemRedDot) breakBtnRedot: ItemRedDot = null;
    @property(ItemRedDot) spiritBtnRedot: ItemRedDot = null;

    onRelease(){
        cc.isValid(this.enhanceBtnRedot) && this.enhanceBtnRedot.deInit();
        cc.isValid(this.breakBtnRedot) && this.breakBtnRedot.deInit();
        cc.isValid(this.spiritBtnRedot) && this.spiritBtnRedot.deInit();
    }
}
