import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { resourceManager } from "../../../common/ResourceManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { configUtils } from "../../../app/ConfigUtils";
import { Equip } from "../../template/Equip";
import { data } from "../../../network/lib/protocol";
import { cfg } from "../../../config/config";
import { BagItemInfo } from "../../../app/AppType";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import EquipDetailTmp from "./EquipDetailTmp";
import ItemBag from "../view-item/ItemBag";
import List from "../../../common/components/List";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { utils } from "../../../app/AppUtils";

enum PAGE_TYPE { PROP, EQUIPMENT }
const { ccclass, property } = cc._decorator;

@ccclass
export default class EquipBreakMatView extends ViewBaseComponent {

    @property(List) listView: List = null;                          //物品列表
    @property([cc.Node]) detailPag: cc.Node[] = new Array<cc.Node>();//左侧详情页
    @property(cc.Node) equipPropPage: cc.Node = null;               //装备属性页面
    @property(cc.ScrollView) pAccessList: cc.ScrollView = null;     //道具获取途径

    private _curPageType: PAGE_TYPE = PAGE_TYPE.PROP;
    private _curSelID: number = -1;
    private _equip: data.IBagUnit= null;
    private _useCallBack: Function = null;
    private _spriteLoader = new SpriteLoader();
    private _itemBags: ItemBag[] = [];
    private _selebleMats: data.IBagUnit[] = null;

    private _totalLable: cc.Label = null;
    onInit(equipData: data.IBagUnit, selectedMats: data.IBagUnit[], useCb: Function) {
        this._equip = equipData;
        this._selebleMats = selectedMats;
        this._useCallBack = useCb;
        this.listView.setupExternalPool(ItemBagPool);
        this._totalLable = this.listView.node.getChildByName("txt_total").getComponent(cc.Label);
        this.initPropView();
    }

    deInit() {
        this._spriteLoader.release();
        this._clearItems();
        resourceManager.release("prefab/views/view-bag/item/ItemPropAccess");
    }

    private _clearItems() {
        this._itemBags.forEach(_i => {
            _i.node.removeFromParent();
            _i.deInit();
            ItemBagPool.put(_i)
        })
        this._itemBags = [];
    }

    onRelease() {
        this.listView._deInit();
        this.deInit();
        this._selebleMats = null;
    }

    onClickProp(event: cc.Event) {
        let clickNode: cc.Node = event.target;
        this.detailPag[PAGE_TYPE.EQUIPMENT].active = false;
        this._curPageType = PAGE_TYPE.PROP;
    }

    onItemChange() {
        switch (this._curPageType) {
            case PAGE_TYPE.PROP:
                this.initPropView();
                break;
        }
    }

    initPropView() {
        if (!this._selebleMats || this._selebleMats.length == 0) {
            this.detailPag[PAGE_TYPE.PROP].active = false;
            this.detailPag[PAGE_TYPE.EQUIPMENT].active = false;
            this.listView.node.active = false;
            return;
        }

        this.listView.numItems = this._selebleMats.length;
        this.listView.selectedId = 0;
        this._totalLable.string = `${(this._selebleMats.length)}/99999`;
    }

    onListRender(item: cc.Node, idx: number) {
        let itemScript = item.getComponent("ItemBag");
        let cfg = configUtils.getItemConfig(this._selebleMats[idx].ID);
        let cfg1 = configUtils.getEquipConfig(this._selebleMats[idx].ID);
        if (cfg) {
            let itemInfo: BagItemInfo = {
                id: this._selebleMats[idx].ID,
                count: this._selebleMats[idx].Count,
            }
            itemScript.init(itemInfo);
            return;
        }

        if (cfg1) {
            let equipData = this._selebleMats[idx];
            let level = bagDataUtils.getEquipLVByExp(equipData.EquipUnit.Exp, cfg1.Quality);
            let itemInfo: BagItemInfo = {
                id: equipData.ID,
                count: equipData.Count,
                star: equipData.EquipUnit.Star,
                level: level,
            }
            itemScript.init(itemInfo);
        }


    }

    onSelectRender(item: cc.Node, selectedId: number, lastSelectedId: number, val: number) {
        if(this._curSelID == selectedId) return;
        this._curSelID = selectedId;
        let cfg = configUtils.getItemConfig(this._selebleMats[selectedId].ID);
        let cfg1 = configUtils.getEquipConfig(this._selebleMats[selectedId].ID);
        if (cfg1) {
            this.detailPag[PAGE_TYPE.EQUIPMENT].active = true;
            this.detailPag[PAGE_TYPE.PROP].active = false;
            this.updateEquipDetailInfo(cfg1, selectedId);
        }
        else if (cfg) {
            this.detailPag[PAGE_TYPE.PROP].active = true;
            this.detailPag[PAGE_TYPE.EQUIPMENT].active = false;
            this.updatePropDetailInfo(cfg, selectedId);
            this.updateAccessInfo(cfg.ItemGetAccess);
        }
    }

    private updateEquipDetailInfo(config: cfg.Equip, sId: number) {
        let page = this.detailPag[PAGE_TYPE.EQUIPMENT];
        let equipData = this._selebleMats[sId];
        let equip = new Equip(equipData);
        let equipMaxExp = equip.getEquipCurMaxExp();
        let equipCurExp = equip.getEquipCurExp();
        let equipMaxLevel = bagDataUtils.curEquipMaxLevel;
        let equipLevel = equip.getEquipLevel();
        let equipProp = equip.getEquipDetailInfo();
        let emptyNode = page.getChildByName("empty")
        let equipNode: EquipDetailTmp = page.getComponent("EquipDetailTmp");
        //基础装备信息
        let eItem: ItemBag = emptyNode.getComponentInChildren(ItemBag);
        if (!eItem) {
            eItem = ItemBagPool.get();
            eItem.node.parent = emptyNode;
            this._itemBags.push(eItem);
        }
        eItem.init({
            id: equip.equipData.ID,
            level: equip.getEquipLevel(),
            count: equip.equipData.Count,
            star: equip.equipData.EquipUnit.Star,
        });

        equipNode.eName.string = String(config.EquipName);
        equipNode.eGrade.string = `等级：${equipLevel}/${equipMaxLevel}`;
        equipNode.eExp.string = `经验：${equipCurExp}/${equipMaxExp}`;
        equipNode.eExpP.progress = equipCurExp / equipMaxExp;
        if (equipLevel == equipMaxLevel) {
            equipNode.eExp.string = `满级`;
            equipNode.eExpP.progress = 1;
        }
        this.equipPropPage.getComponent("EquipProps").equipData = equipData;
        this.equipPropPage.getComponent("EquipProps").updateInfo(equipProp);
        this.equipPropPage.getComponent("EquipProps").showCastSoulProps(equipData);
        this._spriteLoader.changeSprite(equipNode.eType, new Equip(equipData).getEquipTextureIcon());
        this._spriteLoader.changeSprite(equipNode.ePart, equip.getEquipPositionIcon());
    }

    private updatePropDetailInfo(config: cfg.Item, sId: number) {
        let page = this.detailPag[PAGE_TYPE.PROP];
        let propInfo = this._selebleMats[sId];
        let emptyNode = page.getChildByName("empty")
        let pName = page.getChildByName("txt_name").getComponent(cc.Label);
        let pDesc = page.getChildByName("txt_detail").getComponent(cc.Label);
        let pNum = page.getChildByName("txt_count1").getComponent(cc.Label);

        let pItem: ItemBag = emptyNode.getComponentInChildren(ItemBag);
        if (!pItem) {
            pItem = ItemBagPool.get();
            pItem.node.parent = emptyNode;
            this._itemBags.push(pItem);
        }
        pItem.init({
            id: propInfo.ID,
            count: 0,
        })

        pName.string = config.ItemName;
        pDesc.string = config.ItemIntroduce;
        pNum.string = propInfo.Count;
    }

    private updateAccessInfo(accessStr: string) {
        let accessList = accessStr ? accessStr.split("|") : [];
        if (accessList.length > 0) {
            resourceManager.load("prefab/views/view-bag/item/ItemPropAccess", cc.Prefab)
                .then((info) => {
                    this.pAccessList.content.children.forEach(child => {
                        let comp = child.getComponent("ItemPropAccess");
                        comp && comp.deInit();
                    })
                    this.pAccessList.content.removeAllChildren();
                    accessList.forEach((access) => {
                        let cfg = configUtils.getAccessConfig(Number(access) || -1);
                        if (cfg) {
                            let itemNode = cc.instantiate(info.res);
                            this.pAccessList.content.addChild(itemNode);
                            itemNode.getComponent("ItemPropAccess").parent = this;
                            itemNode.getComponent("ItemPropAccess").jumpPage = access;
                        }
                    })
                })
        }
    }

    onClickUseMat() {
        this._useCallBack && this._useCallBack(this._selebleMats[this._curSelID]);
        this.closeView();
    }
}
