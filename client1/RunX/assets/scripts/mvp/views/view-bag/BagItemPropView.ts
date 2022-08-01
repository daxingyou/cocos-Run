/*
 * @Author: xuyang
 * @Date: 2021-05-19 17:36:53
 * @Description: 强化页面材料详情
 */
import { CustomItemId } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { resourceManager } from "../../../common/ResourceManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { data } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { Equip } from "../../template/Equip";
import ItemBag from "../view-item/ItemBag";
import EquipDetailTmp from "./EquipDetailTmp";
import ItemPropAccess from "./ItemPropAccess";

const { ccclass, property } = cc._decorator;


const EQUIP_PRO_LIST_VIEW_MINEST_HEIGHT = 80;

let AccessItemPfbPath = 'prefab/views/view-bag/item/ItemPropAccess2';

const enum VIEW_TAGS {
    PROP = 0,
    EQUIP
}

const DETAIL_MAX_RAW = 4;

@ccclass
export default class BagItemPropView extends ViewBaseComponent {
    @property(cc.Node) page: cc.Node = null;
    @property(cc.Node) emptyNode: cc.Node = null;
    @property(cc.Sprite) itemTitleBg: cc.Sprite = null;
    @property(cc.Node) pageE: cc.Node = null;
    @property(cc.Node) emptyNodeE: cc.Node = null;
    @property(cc.Node) equipPropPage: cc.Node = null;
    @property(cc.Sprite) equipTitleBg: cc.Sprite = null;
    @property(cc.SpriteFrame) sprs: cc.SpriteFrame[] = [];
    @property(cc.ScrollView) pAccessList: cc.ScrollView = null;
    @property(cc.ScrollView) equipPropList: cc.ScrollView = null;

    private _equipPropListOriH: number = 0;
    private _rootNodeOriH : number = 0;
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _itemData: data.IBagUnit = null;
    private _item: ItemBag[] = [];
    private _accessItemPool: cc.NodePool = null;
    private _accessItems: cc.Node[] = null;
    private _accessItemPfb: cc.Prefab = null;

    onInit(itemData: data.IBagUnit) {
        if(!itemData) return;
        cc.isValid(this.pageE) && (this._rootNodeOriH = this._rootNodeOriH || this.pageE.height);
        cc.isValid(this.equipPropList) && (this._equipPropListOriH = this._equipPropListOriH || this.equipPropList.node.height);
        this._itemData = itemData;
        this._accessItemPool = this._accessItemPool || new cc.NodePool('ItemPropAccess')
        this._refreshView();
    }

    deInit() {
        eventCenter.unregisterAll(this);
        this._spriteLoader.release();
        // 清理Item
        if (this._item.length) {
            this._item.forEach( _e => {
                ItemBagPool.put(_e);
            })
            
            this._item = [];
        }
        this._recycleAccessItems();
    }

    private _refreshView() {
        let cfg1 = configUtils.getItemConfig(this._itemData.ID);
        let cfg2 = configUtils.getEquipConfig(this._itemData.ID);
        if (cfg1) this.updatePropPage(this._itemData);
        if (cfg2) this.updateEquipPage(this._itemData);
    }

    private updateEquipPage(itemData: data.IBagUnit) {
        let page = this.pageE;
        let equip = new Equip(itemData);
        let cfg = configUtils.getEquipConfig(itemData.ID);
        let equipMaxExp = equip.getEquipCurMaxExp();
        let equipCurExp = equip.getEquipCurExp();
        let equipMaxLevel = bagDataUtils.curEquipMaxLevel;
        let equipLevel = equip.getEquipLevel();
        let equipProp = equip.getEquipDetailInfo();
        let equipNode: EquipDetailTmp = page.getComponent("EquipDetailTmp");
        //基础装备信息
        let item = this.emptyNodeE.getComponentInChildren(ItemBag);
        if (!item) {
            item = ItemBagPool.get();
            item.node.parent = this.emptyNodeE;
            this._item.push(item);
        }
        item.init({
            id: equip.equipData.ID,
            level: equip.getEquipLevel(),
            count: equip.equipData.Count,
            star: equip.equipData.EquipUnit.Star,
        });
        equipNode.eName.string = String(cfg.EquipName).split("-").pop();

        //专属装备没有升级，只有升星
        let isExclusive = equip.isExclusive();
        equipNode.eGrade.node.active = !isExclusive;
        equipNode.eExp.node.active = !isExclusive;
        equipNode.eExpP.node.active = !isExclusive;
        if(!isExclusive){
            equipNode.eGrade.string = `${equipLevel}/${equipMaxLevel}`;
            equipNode.eExp.string = `${equipCurExp}/${equipMaxExp}`;
            equipNode.eExpP.progress = equipCurExp / equipMaxExp;
        }

        this.equipTitleBg.spriteFrame = this.sprs[cfg.Quality - 1];
        this.equipPropPage.getComponent("EquipProps").equipData = itemData;
        this.equipPropPage.getComponent("EquipProps").updateInfo(equipProp);
        this.equipPropPage.getComponent("EquipProps").showCastSoulProps(itemData);
        this._spriteLoader.changeSprite(equipNode.eType, equip.getEquipTextureIcon());
        this._spriteLoader.changeSprite(equipNode.ePart, equip.getEquipPositionIcon());
        this._adapteEquipView(VIEW_TAGS.EQUIP);
    }

     //适配界面大小
     private _adapteEquipView(viewTag: VIEW_TAGS){
        if(viewTag != VIEW_TAGS.EQUIP || !cc.isValid(this.equipPropList)) return;

        //适配装备页面
        let layoutComps : cc.Layout[] = this.equipPropPage.getComponentsInChildren(cc.Layout);
        layoutComps && layoutComps.forEach(ele => {
            ele.node != this.equipPropPage && ele.updateLayout();
        });
        this.equipPropPage.getComponent(cc.Layout).updateLayout();
        let height = this.equipPropPage.height;
        height = Math.max(height, EQUIP_PRO_LIST_VIEW_MINEST_HEIGHT);
        let adapteH = Math.min(this._equipPropListOriH, height);
        this.pageE.height = Math.min(this._rootNodeOriH, this._rootNodeOriH - (this._equipPropListOriH - adapteH)) ;
        this.equipPropList.node.height = adapteH;
    }

    private updatePropPage(itemData: data.IBagUnit) {
        let page = this.page;
        let topNode = page.getChildByName('top');
        let pDesc = page.getChildByName("txt_detail").getComponent(cc.Label);
        let pName = topNode.getChildByName("txt_name").getComponent(cc.Label);
        let pNum = topNode.getChildByName("txt_count1").getComponent(cc.Label);

        let config = configUtils.getItemConfig(itemData.ID);
        let bagItem = bagData.getItemByID(itemData.ID);
        pName.string = config.ItemName;
        pDesc.string = config.ItemIntroduce;
        let showCount = utils.longToNumber(itemData.Count || 0);
        let ownCount = utils.longToNumber(bagItem ? bagItem.Array[0].Count : 0);
        let cntDesc: string = `${ownCount}`;
        if(itemData.ID == CustomItemId.GONG_FENG_SPEED_UP_COIN) {
            //供奉加速时间
            ownCount = ownCount || 0;
            let timeArr = utils.getLeftTime(ownCount * 60);
            cntDesc = '';
            if(timeArr[0] != 0) {
                cntDesc = `${cntDesc}${timeArr[0]}天`;
            }
            if(timeArr[1] != 0) {
                cntDesc = `${cntDesc}${timeArr[1]}小时`;
            }
            if(timeArr[2] != 0) {
                cntDesc = `${cntDesc}${timeArr[2]}分`;
            }
        }

        pNum.string = cntDesc;
        //基础装备信息
        let item = this.emptyNode.getComponentInChildren(ItemBag);
        if (!item) {
            item = ItemBagPool.get();
            this._item.push(item);
            item.node.parent = this.emptyNode;
        }
        item.init({
            id: itemData.ID,
            count: showCount,
        });
        config.ItemGetAccess && this._updateAccessInfo(config.ItemGetAccess);
        this.itemTitleBg.spriteFrame = this.sprs[config.ItemQuality - 1];
        this._adaptePropView(VIEW_TAGS.PROP);
    }

    //适配道具页面
    private _adaptePropView(viewTag: VIEW_TAGS){
        if(viewTag != VIEW_TAGS.PROP) return;
        let page = this.page;
        let pDesc = page.getChildByName("txt_detail").getComponent(cc.Label);
        //@ts-ignore
        pDesc._forceUpdateRenderData();
        let labelFinalH = pDesc.node.height;
        let stdMaxH = pDesc.lineHeight * DETAIL_MAX_RAW;
        labelFinalH = Math.max(stdMaxH, labelFinalH);
        page.height = this._rootNodeOriH + labelFinalH - stdMaxH;
    }

    private _updateAccessInfo(accessStr: string) {
        this._recycleAccessItems();

        if(!accessStr || accessStr.length == 0) return;
        let accessList = accessStr.split("|");
        if(!accessList || accessList.length == 0) return;

        if(!cc.isValid(this._accessItemPfb)){
            resourceManager.load(AccessItemPfbPath, cc.Prefab).then(info => {
                this._accessItemPfb = info.res;
                this._setupAccessList(accessList);
            })
            return;
        }

        this._setupAccessList(accessList);
    }

    onRelease() {
        this.deInit();
        this._accessItemPool && this._accessItemPool.clear();
        this._accessItemPfb = null;
        resourceManager.release(AccessItemPfbPath);
    }

    onRefresh(){
        // 暂时只处理道具Item的异常、后续可能要统一防到ViewBaseComp
        this._refreshView();
    }

    private _setupAccessList(accessArr: string[]){
        if(!accessArr || accessArr.length == 0) return;
        accessArr.forEach((access) => {
            let cfg = configUtils.getAccessConfig(parseInt(access));
            if(!cfg) return;

            let itemNode = this._getAccessItem();
            if(!cc.isValid(itemNode)) return;
            this._accessItems =  this._accessItems || [];
            this._accessItems.push(itemNode);
            this.pAccessList.content.addChild(itemNode);
            let item = itemNode.getComponent(ItemPropAccess);
            item.parent = this;
            item.setJumpPage(access, this._itemData);
        });
    }

    private _getAccessItem(): cc.Node{
        if(this._accessItemPool.size() > 0) return this._accessItemPool.get();
        if(cc.isValid(this._accessItemPfb)) return cc.instantiate(this._accessItemPfb);
        return null;
    }

    private _recycleAccessItems() {
        if(!this._accessItems || this._accessItems.length == 0) return;
        this._accessItems.forEach(ele => {
            let comp = ele.getComponent("ItemPropAccess");
            comp && comp.deInit();
            this._accessItemPool.put(ele);
        });
        this._accessItems.length = 0;
    }
}
