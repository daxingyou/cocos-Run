import { EQUIP_MAX_STAR } from "../../../app/AppConst";
import { HERO_PROP, HERO_PROP_MAP } from "../../../app/AppEnums";
import { utils } from "../../../app/AppUtils";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { data } from "../../../network/lib/protocol";
import { Equip } from "../../template/Equip";
import ItemBag from "../view-item/ItemBag";

enum INFO_TYPE {
    GREEN,
    YELLOW
}
const FULL_PERCENT = 10000;
const { ccclass, property } = cc._decorator;

@ccclass
export default class EquipInfoView extends ViewBaseComponent {
    @property(cc.Label) txtLevel: cc.Label = null;
    @property(cc.Label) txtCondition: cc.Label = null;
    @property(cc.Label) txtPage: cc.Label = null;
    @property(cc.Label) pageItem: cc.Label = null;
    @property(cc.Node) emptyNode: cc.Node = null;

    private _equip: Equip = null;
    private _infoType: INFO_TYPE = null;
    private _beginStar: number = null;
    private _curIndex: number = -1;
    private _idList: string[] = [];
    private _item: ItemBag = null;

    onInit(data: data.IBagUnit, type: INFO_TYPE) {
        let equip = new Equip(data);
        this._infoType = type;
        this._equip = equip;
        this.updatePageView();
    }

    deInit(){
        if (this._item) {
            ItemBagPool.put(this._item);
            this._item = null;
        }
    }

    onRelease(){
        this.deInit();
    }

    updatePageView() {
        let cfg = configUtils.getEquipConfig(this._equip.equipData.ID);
        let star = this._equip.equipData.EquipUnit.Star;
        //未满10级时展示10级特殊属性
        let grade = Math.max(this._equip.getEquipLevel(), 1);
        let defaultStar: number = this._equip.getEquipBeginStarByUnit();
        cfg.YellowId = cfg.YellowId || "";
        cfg.GreenId = cfg.GreenId || "";

        let gIdList = utils.parseStingList(cfg.GreenId);
        let yIdList = cfg.YellowId.split("|");
        let greenId: number = this._equip.getIndexOfGreenID();
        let yellowId: number = star;

        this._beginStar = defaultStar;
        //装备Item
        let item = this.emptyNode.getComponentInChildren(ItemBag);
        if (!item) {
            item = ItemBagPool.get();
            item.node.parent = this.emptyNode;
            this._item = item;
        }
        if (this._infoType == INFO_TYPE.GREEN) {
            this._curIndex = greenId;
            this._idList = gIdList;
            this.updatePageContent();
        }
        if (this._infoType == INFO_TYPE.YELLOW) {
            this._curIndex = yellowId;
            this._idList = yIdList;
            this.updatePageContent();
        }
    }
    //创建特殊属性条目
    private updatePageContent() {
        if (this._curIndex > this._idList.length || this._idList.length == 0) return;
        this.pageItem.string = "";
        if (this._infoType == INFO_TYPE.GREEN) {
            let gIDs = [].concat(this._idList[this._curIndex].slice(1));
            let greenLv;
            let gCfgs = gIDs.map(gID=>{
                return configUtils.getEquipGreenConfig(Number(gID));
            })
            let greenProp = bagDataUtils.mergeGreenProp(gCfgs);
            Object.keys(greenProp).forEach((_k) => {
                    // @ts-ignore
                let prop = greenProp[_k];
                let attrCfg = configUtils.getAttributeCfg(_k);
                if (attrCfg && prop) {
                    this.addStringItem(attrCfg.Name, prop, attrCfg.AttributeValueType == 2);
                }
            })
            greenLv = greenProp.Level >= this._idList.length ? '满' : greenProp.Level;
            //提示字刷新
            let level: number = Number(this._idList[this._curIndex][0]);
            this.txtLevel.string = `特殊属性${greenLv}级`;
            this.txtCondition.string = `装备强化${level >= bagDataUtils.equipMaxLevel ? "满" : level || 1}级可用`;
            this.txtPage.string = `${this._curIndex + 1}/${this._idList.length}`;

            this.emptyNode.getComponentInChildren(ItemBag).init({
                id: this._equip.equipData.ID,
                count: this._equip.equipData.Count,
                star: this._equip.equipData.EquipUnit.Star,
                level: level,
            })
        } else if (this._infoType == INFO_TYPE.YELLOW) {
            let yID = this._idList[this._curIndex];
            let yellowProp = utils.deepCopy(configUtils.getEquipYellowConfig(Number(yID)));
            Object.keys(yellowProp).forEach((_k) => {
                // @ts-ignore
                let prop = yellowProp[_k];
                let attrCfg = configUtils.getAttributeCfg(_k);
                if (attrCfg) {
                    this.addStringItem(attrCfg.Name, prop, attrCfg.AttributeValueType == 2);
                } else if (_k == 'Continuity') {
                    let attrCfg = configUtils.getAttributeCfg(HERO_PROP_MAP[HERO_PROP.DOUBLE_HIT_RATE]);
                    this.addStringItem(attrCfg.Name, prop, attrCfg.AttributeValueType == 2);
                }
            })
            //提示字刷新
            let yellowLv = this._idList[this._curIndex];
            let star = this._curIndex + this._beginStar;
            this.txtLevel.string = `特殊技能${this._curIndex + 1}级`;
            this.txtCondition.string = `装备突破${star}星可用`;
            this.txtPage.string = `${this._curIndex + 1}/${this._idList.length}`;
            this.emptyNode.getComponentInChildren(ItemBag).init({
                id: this._equip.equipData.ID,
                count: this._equip.equipData.Count,
                star: star,
                level: this._equip.getEquipLevel() || 1,
            })
        }
    }

    private onClickNextPage() {
        if (this._curIndex < this._idList.length - 1) {
            this._curIndex += 1;
            this.updatePageContent();
        }
    }


    private onClickPrePage() {
        if (this._curIndex > 0) {
            this._curIndex -= 1;
            this.updatePageContent();
        }
    }
    //创建特殊技能条目
    private addStringItem(name: string, val: number | string, isPercent?: boolean) {
        val = Number(val) || 0;
        let prop = isPercent ? String(val * 100 / FULL_PERCENT) + "%" : String(val);
        this.pageItem.string += `${name}:  ${prop}\n`;
    }

}
