import { CustomDialogId, RES_ICON_PRE_URL } from "../../../app/AppConst";
import { QUALITY_TYPE } from "../../../app/AppEnums";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import guiManager from "../../../common/GUIManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ItemSmelt extends cc.Component {
    @property(cc.Label) count: cc.Label = null;
    @property(cc.Label) level: cc.Label = null;
    @property(cc.Node) levelBg: cc.Node = null;
    @property(cc.Label) selCount: cc.Label = null;
    @property(cc.Node) mask: cc.Node = null;
    @property(cc.Sprite) icon: cc.Sprite = null;
    @property(cc.Node) suitIcon: cc.Node = null;
    @property(cc.Node) buttonMinus: cc.Node = null;
    @property(cc.Node) buttonAdd: cc.Node = null;
    @property(cc.Node) chipTips: cc.Node = null;
    @property(cc.Node) countBg: cc.Node = null;
    @property([cc.SpriteFrame]) sprList: cc.SpriteFrame[] = new Array<cc.SpriteFrame>();

    private _spriteLoader = new SpriteLoader();
    private _totalCount = 0;
    private _step = 1;
    private _max = 0;
    private _min = 0;
    private _selCount = 0;
    private _isSingle = false;
    private _clickStatus = true;
    private _countBgOriWidth: number = 0;

    set clickStatus(val: boolean) {
        this._clickStatus = val;
    }

    set isSingle(val: boolean) {
        this._isSingle = val;
        this.level.node.active = val;
        this.count.node.active = !val;
        this.buttonAdd.active = !val;
        this.buttonMinus.active = !val;
    }

    set totalCount(val: number) {
        this._totalCount = val;
    }
    //获取选中数量
    get selectNum() {
        return this._selCount || 0;
    }
    
    set stepNum(step: number){
        if (step) this._step = step;
    }

    set maxNum(max: number){
        if (max) this._max = max;
    }

    set minNum(min: number){
        if (min) this._min = min;
    }


    public updateQuality(quality: QUALITY_TYPE) {
        if (quality - 2 >= this.sprList.length) return;
        this.node.getComponent(cc.Sprite).spriteFrame = this.sprList[quality - 2];
    }

    public updateIcon(url: string) {
        if (!url || url == "") return;
        this._spriteLoader.changeSpriteP(this.icon, `${RES_ICON_PRE_URL.BAG_ITEM}/${url}`).then(() => {
            this.icon.node.active = true;
        });
    }

    public updateCount(count: number) {
        this._totalCount = count;
        this.count.string = `${count}`;
        this.count.node.active = true;
        this.count.node.color = this._totalCount < this._step ? cc.Color.RED : cc.Color.WHITE;
        this.countBg.active = true;
        this._setupCountBgWidth();
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

    public updateChipStatus(){
       this.chipTips.active = true;
    }

    public updateSelectCount(count: number) {
        if (this._isSingle) return;
        if (!count || count == 0) {
            //不需处理选中状态，未选中
            this.count.node.active = true;
            this.selCount.node.active = false;
            this.buttonMinus.active = false;
        } else {
            this.count.node.active = false;
            this.selCount.node.active = true;
            // 固定数量不显示减号
            this.buttonMinus.active = true;
        }
        this._selCount = count;
        this.selCount.string = `${this._totalCount}/${count}`;
        this._setupCountBgWidth();
    }
    //恢复至初始状态
    public clear() {
        this.suitIcon && (this.suitIcon.active = false);
        this.icon.node.active = false;
        this.count.node.active = false;
        this.level.node.active = false;
        this.levelBg.active = false;
        this.selCount.node.active = false;
        this.chipTips.active = false;
        this.countBg.active = false;
        this._step = 1;
        this._max = 0;
        this._min = 0;
    }
    //减少材料数量
    private onButtonMinus() {
        let listItem = this.getComponent("ListItem");
        let showNum = this._selCount;
        if (!this._isSingle && showNum - this._step > this._min) {
            this.updateSelectCount(showNum - this._step);
            listItem.sendSelectEvent();
        }
        if (!this._isSingle && showNum == this._step) {
            this.updateSelectCount(0);
            this.buttonMinus.active = false;
            listItem.setItemUnselect();
        }
    }
    private onButtonSelected() {
        if (!this._clickStatus) return;
        let listItem = this.getComponent("ListItem");
        let showNum = this._selCount;
        let max = Math.min(this._totalCount, this._max);
        if (this._step > this._totalCount){
            guiManager.showDialogTips(CustomDialogId.SMELT_NO_ENOUGH);
            return;
        }

        if (!this._isSingle && !this.buttonMinus.active && showNum + this._step <= max) {
            //先更新数量，再更新选中状态
            this.updateSelectCount(this._step);
            // 固定数量不显示减号
            this.buttonMinus.active = true;;
            listItem.onClickThis();
            return;
        }

        if (!this._isSingle && showNum + this._step <= max) {
            this.updateSelectCount(showNum + this._step);
            listItem.sendSelectEvent();
        }
    }

    unuse(){
        this.clear();
        this._spriteLoader.release();
    }

    reuse(){

    }

    private _setupCountBgWidth(){
        !this._countBgOriWidth && (this._countBgOriWidth = this.countBg.width);
        if(this.count.node.active){
            //@ts-ignore
            this.count._forceUpdateRenderData();
            this.countBg.width = this.count.node.width + 10;
        }else if(this.selCount.node.active){
            //@ts-ignore
            this.selCount._forceUpdateRenderData();
            this.countBg.width = this.selCount.node.width + 10;
        }
    }
}
