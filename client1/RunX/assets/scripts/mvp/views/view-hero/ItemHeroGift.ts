import { GIFT_STATE, NumberValueType } from "../../../app/AppEnums";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { RED_DOT_MODULE } from "../../../common/RedDotManager";
import { cfg } from "../../../config/config";
import { bagData } from "../../models/BagData";
import HeroUnit from "../../template/HeroUnit";
import ItemRedDot from "../view-item/ItemRedDot";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemHeroGift extends cc.Component {
    @property(cc.Node) bgNode: cc.Node= null;
    @property(cc.Label) lv: cc.Label = null;
    @property(cc.Node) containor: cc.Node = null;
    @property(ItemRedDot) redotComp: ItemRedDot = null;

    private _giftId: number = 0;
    private _heroUnit: HeroUnit = null;
    private _giftCfg: cfg.HeroGift = null;
    private _clickHandler: Function = null;
    private _getDescNodeFn: Function = null;
    private _putDescNodeFn: Function = null;
    private _oriContainH: number = null;

    get giftID () {
        return this._giftId;
    }

    onInit(giftId: number, clickHandler: Function, getDescNodeFn: Function, putDescNodeFn: Function) {
        this._giftId = giftId;
        this._clickHandler = clickHandler;
        this._getDescNodeFn = getDescNodeFn;
        this._putDescNodeFn = putDescNodeFn;
        this.redotComp.clear();
        this._giftCfg = configUtils.getHeroGiftConfig(this._giftId);
        this._heroUnit = bagData.getHeroById(this._giftCfg.HeroGiftHeroId);
        this._oriContainH = this._oriContainH || this.containor.height;

        this._initUI();
        this.redotComp.setData(RED_DOT_MODULE.HERO_GIF_ICON, {
            args: [this._heroUnit.basicId, this._getGiftState(), this._isEnoughMaterial()],
            subName: `${this._heroUnit.basicId}`
        });
    }

    deInit() {
        let descNodes = [...this.containor.children];
        descNodes.forEach(ele => {
            this._putDescNodeFn(ele);
        });
        this.redotComp.deInit();
        this._clickHandler = null;
        this._getDescNodeFn = null;
        this._putDescNodeFn = null;
    }

    onClickSelBtn() {
        this._clickHandler &&  this._clickHandler(this._giftId);
    }

    private _initUI() {
        this.lv.string = `${this._giftCfg.HeroGiftNeedLevel}`;
        let isSkill = !!(this._giftCfg.HeroGiftSkill && this._giftCfg.HeroGiftSkill.length > 0);
        let state = this._updateState();
        if(!isSkill) {
            this._initPropGift(state);
        } else {
            this._initSkillGift(state);
        }
        this.bgNode.height = this.node.height = (this.containor.height + 20);
    }

    private _initPropGift(state: GIFT_STATE) {
        let props: number[][] = null;
        if(this._giftCfg.HeroGiftAttribute && this._giftCfg.HeroGiftAttribute.length > 0) {
            utils.parseStingList(this._giftCfg.HeroGiftAttribute, (strArr: string[]) => {
                if(!strArr || !Array.isArray(strArr) || strArr.length == 0) return;
                props = props || [];
                props.push([parseInt(strArr[0]), parseFloat(strArr[1])]);
            });
        }

        if(props) {
            let row =  Math.ceil(props.length / 2);
            let spaceY = 5;
            let containorH: number, startY = 0;
            props.forEach((ele, idx) => {
                let node = this._getDescNodeFn();
                let labelComp: cc.Label = node.getComponent(cc.Label);
                labelComp.overflow = cc.Label.Overflow.NONE;
                let attrCfg: cfg.Attribute = configUtils.getAttributeConfig(ele[0]);
                let attrV = attrCfg.AttributeValueType == NumberValueType.REAL_VALUE ? ele[1] : ele[1] / 100;
                labelComp.string = `${attrCfg.Name}+${attrCfg.AttributeValueType == NumberValueType.REAL_VALUE ? attrV : `${attrV}%`}`;
                labelComp._forceUpdateRenderData();
                if(typeof containorH == 'undefined') {
                  containorH = row * node.height + (row - 1) * spaceY;
                  startY = (containorH >> 1);
                }
                let posX = (node.width >> 1) + 30;
                node.setPosition(idx % 2 == 0 ? -posX : posX, startY - (node.height >> 1));
                node.parent = this.containor;
                if(idx % 2 == 1) {
                  startY -= (node.height + spaceY);
                }
            });
            this.containor.height = Math.max(this._oriContainH, containorH);
        }
    }

    private _initSkillGift(state: GIFT_STATE) {
        let isSkill = !!(this._giftCfg.HeroGiftSkill && this._giftCfg.HeroGiftSkill.length > 0);
        if(!isSkill) return;
        if(this.containor.childrenCount == 0) {
            let node = this._getDescNodeFn();
            node.setPosition(0, 0);
            node.parent = this.containor;
        }
        this._updateSkillGift(state);
    }

    private _updateSkillGift(state: GIFT_STATE) {
        let isSkill = !!(this._giftCfg.HeroGiftSkill && this._giftCfg.HeroGiftSkill.length > 0);
        if(!isSkill) return;
        let node = this.containor.children[0];
        let labelComp = node.getComponent(cc.Label);
        labelComp.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
        node.width = this.node.width - 80;
        if(state != GIFT_STATE.ACTIVE) {
            labelComp.string = '技能强化';
        } else {
            let skillID: number;
            if(this._heroUnit && this._heroUnit.isHeroBasic && this._heroUnit.gift[this._giftId] && this._heroUnit.gift[this._giftId].SkillID) {
                skillID = this._heroUnit.gift[this._giftId].SkillID;
            }
            if(typeof skillID == 'undefined') {
                skillID = utils.parseStingList(this._giftCfg.HeroGiftSkill)[0];
            }

            let skillDesc: string = null;
            let skillCfg: cfg.Skill = configUtils.getSkillConfig(skillID);
            if(skillCfg) {
                skillDesc = `${skillCfg.Illustrate || '暂未配置'}`;
            } else {
                let changeCfg: cfg.SkillChange = configUtils.getSkillChangeConfig(skillID);
                skillDesc = `${changeCfg && changeCfg.Desc ? changeCfg.Desc : '暂未配置'}`;
            }
            labelComp.string = skillDesc;
        }
        //@ts-ignore
        labelComp._forceUpdateRenderData();
        this.containor.height = Math.max(this._oriContainH, node.height);
    }

    updateState() {
        let state = this._updateState();
        this._updateSkillGift(state);
        this.redotComp.setData(RED_DOT_MODULE.HERO_GIF_ICON, {
            args: [this._heroUnit.basicId, this._getGiftState(), this._isEnoughMaterial()],
            subName: `${this._heroUnit.basicId}`
        });
    }

    private _updateState() {
        let giftState = this._getGiftState();
        let color: cc.Color = null;
        if(GIFT_STATE.LOCK == giftState) {
            color = cc.Color.GRAY;
        } else if(GIFT_STATE.UNLOCK == giftState) {
            color = cc.Color.YELLOW;
        } else if(GIFT_STATE.ACTIVE == giftState) {
            color = cc.Color.GREEN;
        }
        this.bgNode.color = color;
        return giftState;
    }

    private _getGiftState() {
        let state = GIFT_STATE.LOCK;
        if(!this._heroUnit || !this._heroUnit.isHeroBasic) return state;

        if(this._heroUnit.lv >= this._giftCfg.HeroGiftNeedLevel){
            state = GIFT_STATE.UNLOCK;
            this._heroUnit.gift[this._giftId] && (state = GIFT_STATE.ACTIVE);
        }
        return state;
    }

    private _isEnoughMaterial(){
        let costList = utils.parseStingList(this._giftCfg.HeroGiftCost);
        if(!costList || costList.length == 0) return true;
        return costList.every(ele => {
            let itemId: number = Number(ele[0]), itemCount: number = Number(ele[1]);
            let bagItem = bagData.getItemByID(itemId);
            let haveCount: number = bagItem ? utils.longToNumber(bagItem.Array[0].Count) : 0;
            return haveCount >= itemCount;
        });
    }
}
