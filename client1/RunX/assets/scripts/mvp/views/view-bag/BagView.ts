import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { CACHE_MODE, resourceManager } from "../../../common/ResourceManager";
import { data } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { eventCenter } from "../../../common/event/EventCenter";
import { bagDataEvent } from "../../../common/event/EventData";
import { QUALITY_TYPE, EQUIP_TEXTURE_TYPE, BAG_ITEM_TYPE } from "../../../app/AppEnums";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { CustomDialogId, EQUIP_MAX_STAR, RES_ICON_PRE_URL, VIEW_NAME } from "../../../app/AppConst";
import { cfg } from "../../../config/config";
import { Equip } from "../../template/Equip";
import { configUtils } from "../../../app/ConfigUtils";
import { BagItemInfo } from "../../../app/AppType";
import { bagDataOpt } from "../../operations/BagDataOpt";
import { utils } from "../../../app/AppUtils";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { redDotMgr, RED_DOT_MODULE, RED_DOT_TYPE } from "../../../common/RedDotManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import List from "../../../common/components/List";
import guiManager from "../../../common/GUIManager";
import EquipDetailTmp from "./EquipDetailTmp";
import ItemBag from "../view-item/ItemBag";
import ItemRedDot from "../view-item/ItemRedDot";
import moduleUIManager from "../../../common/ModuleUIManager";
import StepWork from "../../../common/step-work/StepWork";

enum PAGE_TYPE { PROP, EQUIPMENT, MATERIAL }
const { ccclass, property } = cc._decorator;

@ccclass
export default class BagView extends ViewBaseComponent {
    @property(List) listView: List = null;                              //物品列表      
    @property(cc.Label) totalLabel: cc.Label = null;                    //物品数量
    @property(cc.Node) emptyLabel: cc.Node = null;                      //空列表提示
    @property(cc.Node) filterLayout: cc.Node = null;                    //筛选框
    @property(cc.Node) equipPropPage: cc.Node = null;                   //装备属性页面
    @property(cc.ScrollView) pAccessList: cc.ScrollView = null;         //道具获取途径
    @property(cc.ScrollView) mAccessList: cc.ScrollView = null;         //材料获取途径
    @property([cc.Toggle]) navButton: cc.Toggle[] = new Array<cc.Toggle>();   //导航按钮
    @property([cc.Node]) detailPag: cc.Node[] = new Array<cc.Node>();   //左侧详情页
    @property(ItemRedDot) propToggleRedDot: ItemRedDot = null;
    @property(ItemRedDot) equipToggleRedDot: ItemRedDot = null;
    @property(ItemRedDot) materToggleRedDot: ItemRedDot = null;
    @property(cc.Node) bubbleGreen: cc.Node = null;
    @property(cc.Node) bubbleYellow: cc.Node = null;

    private _curPageType: PAGE_TYPE = null;
    private _curSelID: number = -1;
    private _curSelItem: data.IBagUnit = null;
    private _equipData: data.IBagUnit[] = [];
    private _propData: data.IBagUnit[] = [];
    private _materialData: data.IBagUnit[] = [];
    private _spriteLoader: SpriteLoader = null;
    private _filterQuality: QUALITY_TYPE = null;
    private _filterType: EQUIP_TEXTURE_TYPE = null;
    private _filterNode: cc.Node = null;
    private _itemBags: ItemBag[] = [];
    private _currHero: number[] = []
    private _imgUrls: string[] = [];

    preInit(...rest: any[]) {
        let self = this;
        // 卡顿优化：预加载图片、初始化list
        return new Promise((resolve, reject) => {
            let stepWork = this._preloadImages();
            stepWork.addTask(() => {
                self._initListView();
            }).start(() => {
                resolve(true);
            })
        });
    }

    private _preloadImages() {
        let self = this;
        return new StepWork().addTask((cb: Function) => {
            self._imgUrls = this.getItemResPath();

            if (self._imgUrls.length === 0) {
                cb();
                return;
            }

            let count = self._imgUrls.length;
            for (let i = 0; i < self._imgUrls.length; ++i) {
            resourceManager.load(self._imgUrls[i], cc.SpriteFrame, CACHE_MODE.NONE).then(() => {
                count -= 1;
                count === 0 && cb();
            });
        }
        });
    }

    private _releaseImages() {
        for (let i = 0; i < this._imgUrls.length; ++i) {
            resourceManager.release(this._imgUrls[i], CACHE_MODE.NONE);
        }
        this._imgUrls = [];
    }

    private _initListView() {
        this.listView.node.active = true;
        this.listView._init();
        this.listView.setupExternalPool(ItemBagPool);

        this._propData = bagData.getItemsByType(BAG_ITEM_TYPE.PROP);
        this._equipData = bagData.equipList;
        this._materialData = bagData.getItemsByType(BAG_ITEM_TYPE.MATERIAL);

        // 用最多的数据初始化list
        let maxLength: number = this._propData.length;
        this._curPageType = PAGE_TYPE.PROP;
        if (this._equipData.length > maxLength) {
            maxLength = this._equipData.length;
            this._curPageType = PAGE_TYPE.EQUIPMENT;
        } else if (this._materialData.length > maxLength) {
            maxLength = this._materialData.length;
            this._curPageType = PAGE_TYPE.MATERIAL;
        }
        maxLength > 0 && (this.listView.numItems = maxLength);
        this._curPageType = null;
    }

    onInit(functionId?: number) {
        this._spriteLoader = new SpriteLoader()
        this._filterNode = this.filterLayout.parent;
        this.registerAllEvent();
        this.onClickProp(null, null, 0);
        this.refreshRedDot();
        guiManager.addCoinNode(this.node, functionId);
        this._currHero = bagData.heroList.map( _v => {return _v.ID});
    }

    registerAllEvent() {
        eventCenter.register(bagDataEvent.ITEM_CHANGE, this, this.onItemChange);
        eventCenter.register(bagDataEvent.ITEM_USE, this, this.onItemGet);       //掉落物品
    }

    deInit() {
        eventCenter.unregisterAll(this);
        this._spriteLoader.release();
        this._clearItems();
        this.releaseSubView();
        resourceManager.release("prefab/views/view-bag/item/ItemPropAccess");
        this._releaseImages();
    }

    private _clearItems() {
        this._itemBags.forEach(_i => {
            ItemBagPool.put(_i)
        })
        this._itemBags = [];
    }

    onRelease() {
        this._clearLastItemsNewTag(false);
        redDotMgr.fire(RED_DOT_MODULE.MAIN_BAG);
        this.propToggleRedDot.deInit();
        this.equipToggleRedDot.deInit();
        this.materToggleRedDot.deInit();
        let page = this.detailPag[PAGE_TYPE.EQUIPMENT];
        let equipDetailomp: EquipDetailTmp = page.getComponent("EquipDetailTmp");
        equipDetailomp.onRelease();

        guiManager.removeCoinNode(this.node);
        //资源复位s
        this.deInit();
        this.listView._deInit();
        bagData.updateLastData(BAG_ITEM_TYPE.EQUIP);
        bagData.updateLastData(BAG_ITEM_TYPE.PROP);
        bagData.updateLastData(BAG_ITEM_TYPE.MATERIAL);
    }

    onRefresh(){
        this.refreshRedDot();
        if (this._equipData[this._curSelID] && this._curPageType == PAGE_TYPE.EQUIPMENT)
            this.updateEquipDetailInfo(this._curSelID);
    }

    onClickProp(event: cc.Event, customEventData:string, dur?: number) {
        if (this._curPageType == PAGE_TYPE.PROP) return;
        this._clearLastItemsNewTag();
        this.navButton[PAGE_TYPE.PROP].isChecked = true;
        this.detailPag[PAGE_TYPE.EQUIPMENT].active = false;
        this.detailPag[PAGE_TYPE.MATERIAL].active = false;
        this._curPageType = PAGE_TYPE.PROP;
        //强制停止滑动视图滚动
        this.listView.scrollView.stopAutoScroll();
        this.detailPag[PAGE_TYPE.PROP].active = true;
        this.initPropView(true);
    }

    onClickEuipment(event: cc.Event, dur?: number) {
        if (this._curPageType == PAGE_TYPE.EQUIPMENT) return;
        this._clearLastItemsNewTag();
        this.navButton[PAGE_TYPE.EQUIPMENT].isChecked = true;
        this.detailPag[PAGE_TYPE.PROP].active = false;
        this.detailPag[PAGE_TYPE.MATERIAL].active = false;
        this._curPageType = PAGE_TYPE.EQUIPMENT;
        //强制停止滑动视图滚动
        this.listView.scrollView.stopAutoScroll();
        this.detailPag[PAGE_TYPE.EQUIPMENT].active = true;
        this.resetFilter();
        this.initEquipmentView(true);
    }


    onClickMaterial(event: cc.Event, dur?: number) {
        if (this._curPageType == PAGE_TYPE.MATERIAL) return;
        this._clearLastItemsNewTag();
        this.navButton[PAGE_TYPE.MATERIAL].isChecked = true;
        this.detailPag[PAGE_TYPE.PROP].active = false;
        this.detailPag[PAGE_TYPE.EQUIPMENT].active = false;
        this._curPageType = PAGE_TYPE.MATERIAL;
        //强制停止滑动视图滚动
        this.listView.scrollView.stopAutoScroll();
        this.detailPag[PAGE_TYPE.MATERIAL].active = true;
        this.initMaterialView(true);
    }

    onItemChange() {
        switch (this._curPageType) {
            case PAGE_TYPE.PROP:
                this.initPropView();
                this.propToggleRedDot.refreshView();
                break;
            case PAGE_TYPE.MATERIAL:
                this.initMaterialView();
                this.materToggleRedDot.refreshView();
                break;
            case PAGE_TYPE.EQUIPMENT:
                this.initEquipmentView();
                this.equipToggleRedDot.refreshView();
                break;
        }
    }

    onItemGet(event: any, data: data.IItemInfo[]) {
        if (data && data.length > 0) {
            let realGet = bagDataUtils.getItemTransform(data, this._currHero);
            this.loadSubView(VIEW_NAME.GET_ITEM_VIEW, data, [], realGet);
            this._currHero = bagData.heroList.map( _v => {return _v.ID});
            guiManager.showDialogTips(CustomDialogId.BAG_ITEM_USED);
        }
    }

    initPropView(reset?: boolean) {
        let propList = bagData.getItemsByType(BAG_ITEM_TYPE.PROP)
            .sort((a, b) => {
                let qA = configUtils.getItemConfig(a.ID).ItemQuality;
                let qB = configUtils.getItemConfig(b.ID).ItemQuality;
                return qB - qA;
            });
        if (propList.length == 0) {
            this.detailPag[PAGE_TYPE.PROP].active = false;
            this.listView.node.active = false;
            this.emptyLabel.active = true;
            this.emptyLabel.getComponentInChildren(cc.Label).string = `背包中没有道具哟`;
            this._filterNode.parent.active = false;
            this._curSelItem = null;
            return;
        }
        this._filterNode.parent.active = true;
        this._filterNode.active = false;
        this.emptyLabel.active = false;
        this.listView.node.active = true;
        this.detailPag[PAGE_TYPE.PROP].active = true;

        this._propData = propList;
        this.totalLabel.string = `${this._propData.length}/99999`;
        this.listView.numItems = this._propData.length;
        this.listView.selectedId = this.calSelItemIndex(this._curSelItem);
        reset && this.listView.scrollTo(0, 0);
    }

    initEquipmentView(reset?: boolean) {
        let equipList = bagData.equipList;
        if (equipList.length == 0) {
            this.detailPag[PAGE_TYPE.EQUIPMENT].active = false;
            this.listView.node.active = false;
            this.emptyLabel.getComponentInChildren(cc.Label).string = `背包中没有装备哟`;
            this.emptyLabel.active = true;
            this._filterNode.parent.active = false;
            this._curSelItem = null;
            return;
        }
        this._filterNode.parent.active = true;
        this._filterNode.active = true;
        this.emptyLabel.active = false;
        this.listView.node.active = true;
        this.detailPag[PAGE_TYPE.EQUIPMENT].active = true;

        this._equipData = this.getPartEquipsByQualityAndType(this._filterQuality, this._filterType);
        if (this._equipData.length == 0) {
            this.detailPag[PAGE_TYPE.EQUIPMENT].active = false;
            this.emptyLabel.active = true;
            this.emptyLabel.getComponentInChildren(cc.Label).string = `无符合条件装备`;
            this.totalLabel.string = `${this._equipData.length}/99999`;
            this.scheduleOnce(() => {
                this.listView.numItems = this._equipData.length;
            });
            return;
        }
        this.emptyLabel.active = false;
        this.totalLabel.string = `${this._equipData.length}/99999`;
        this.listView.numItems = this._equipData.length;
        this.listView.selectedId = this.calSelItemIndex(this._curSelItem);
        reset && this.listView.scrollTo(0, 0);
    }

    initMaterialView(reset?: boolean) {
        let materialList = bagData.getItemsByType(BAG_ITEM_TYPE.MATERIAL)
            .sort((a, b) => {
                let qA = configUtils.getItemConfig(a.ID).ItemQuality;
                let qB = configUtils.getItemConfig(b.ID).ItemQuality;
                return qB - qA;
            });
        if (materialList.length == 0) {
            this.detailPag[PAGE_TYPE.MATERIAL].active = false;
            this.listView.node.active = false;
            this.emptyLabel.active = true;
            this.emptyLabel.getComponentInChildren(cc.Label).string = `背包中没有材料哟`;
            this._filterNode.parent.active = false;
            this._curSelItem = null;
            return;
        }
        this._filterNode.parent.active = true;
        this._filterNode.active = false;
        this.emptyLabel.active = false;
        this.listView.node.active = true;
        this.detailPag[PAGE_TYPE.MATERIAL].active = true;

        this._materialData = materialList;
        this.totalLabel.string = `${this._materialData.length}/99999`;
        this.listView.numItems = this._materialData.length;
        this.listView.selectedId = this.calSelItemIndex(this._curSelItem);
        reset && this.listView.scrollTo(0, 0);
    }

    refreshRedDot() {
        this.propToggleRedDot.setData(RED_DOT_MODULE.BAG_PROP_TOGGLE);
        this.equipToggleRedDot.setData(RED_DOT_MODULE.BAG_EQUIP_TOGGLE);
        this.materToggleRedDot.setData(RED_DOT_MODULE.BAG_MATERIAL_TOGGLE);
    }

    calSelItemIndex(item: data.IBagUnit) {
        if (!item) return 0;
        switch (this._curPageType) {
            case PAGE_TYPE.PROP:
                for (const k in this._propData) {
                    let ele = this._propData[k];
                    if (ele.ID == item.ID && utils.longToNumber(ele.Seq) == utils.longToNumber(item.Seq))
                        return Number(k);
                };
                break;
            case PAGE_TYPE.MATERIAL:
                for (const k in this._materialData) {
                    let ele = this._materialData[k];
                    if (ele.ID == item.ID && utils.longToNumber(ele.Seq) == utils.longToNumber(item.Seq))
                        return Number(k);
                };
                break;
            case PAGE_TYPE.EQUIPMENT:
                for (const k in this._equipData) {
                    let ele = this._equipData[k];
                    if (ele.ID == item.ID && utils.longToNumber(ele.Seq) == utils.longToNumber(item.Seq))
                        return Number(k);
                };
                break;
        }
        return 0;
    }

    onListRender(item: cc.Node, idx: number) {
        let itemScript: ItemBag = item.getComponent("ItemBag");
        if (this._curPageType == PAGE_TYPE.EQUIPMENT) {
            let equip = new Equip(this._equipData[idx]);
            let level = equip.getEquipLevel();
            let itemInfo: BagItemInfo = {
                id: equip.equipData.ID,
                count: equip.equipData.Count,
                star: equip.equipData.EquipUnit.Star,
                level: level,
                currEquip: bagDataUtils.checkEquipIsDressed(this._equipData[idx])
            }
            itemScript.init(itemInfo);
            itemScript.setRedDotData(RED_DOT_MODULE.BAG_ITEM_EQUIP, {
                redDotType: RED_DOT_TYPE.NEW,
                args: [this._equipData[idx]],
                subName: `${this._equipData[idx].ID}-${this._equipData[idx].Seq}`
            });
            return;
        }

        if (this._curPageType == PAGE_TYPE.PROP) {
            let cfg = configUtils.getItemConfig(this._propData[idx].ID);
            let count = this._propData[idx].Count;
            let leastCount = cfg.ItemComposeNum || 0;
            let itemInfo: BagItemInfo = {
                id: this._propData[idx].ID,
                count: count,
            }

            if(leastCount){
                delete itemInfo.count;
                itemInfo.richTxt = `<color=${count >= leastCount ? '#ffffff' : '#ff0000'}>${count}</color>/<color=#ffffff>${leastCount}</color>`;
            }
            itemScript.init(itemInfo);
            itemScript.setRedDotData(RED_DOT_MODULE.BAG_ITEM_PROP, {
                args: [this._propData[idx]],
                subName: this._propData[idx].ID + ''
            });
            return;
        }

        if (this._curPageType == PAGE_TYPE.MATERIAL) {
            let cfg = configUtils.getItemConfig(this._materialData[idx].ID);
            let itemInfo: BagItemInfo = {
                id: this._materialData[idx].ID,
                count: this._materialData[idx].Count,
                isNew: bagData.checkItemNew(BAG_ITEM_TYPE.MATERIAL, this._materialData[idx].ID),
            }
            itemScript.init(itemInfo);
            itemScript.setRedDotData(RED_DOT_MODULE.BAG_ITEM_MATERIAL, {
                args: [this._materialData[idx]],
                subName: this._materialData[idx].ID + ''
            });
        }
    }

    onSelectRender(item: cc.Node, selectedId: number, lastSelectedId: number, val: number) {
        if (this._curPageType == PAGE_TYPE.EQUIPMENT && this._equipData[selectedId]) {
            this._curSelItem != this._equipData[selectedId] && this.updateEquipDetailInfo(selectedId);
            this._curSelItem = this._equipData[selectedId];
            redDotMgr.clearNewEquip(this._equipData[selectedId]);
            redDotMgr.fire(RED_DOT_MODULE.BAG_EQUIP_TOGGLE);
        }

        if (this._curPageType == PAGE_TYPE.PROP && this._propData[selectedId]) {
            let cfg = configUtils.getItemConfig(this._propData[selectedId].ID);;
            this.updatePropDetailInfo(cfg, selectedId);
            this.updateAccessInfo(cfg.ItemGetAccess);
            redDotMgr.clearNewProp(this._propData[selectedId]);
            this._curSelItem = this._propData[selectedId];
            redDotMgr.fire(RED_DOT_MODULE.BAG_PROP_TOGGLE);
        }

        if (this._curPageType == PAGE_TYPE.MATERIAL && this._materialData[selectedId]) {
            let cfg = configUtils.getItemConfig(this._materialData[selectedId].ID);
            this.updateMaterialDetailInfo(cfg, selectedId);
            this.updateAccessInfo(cfg.ItemGetAccess);
            this._curSelItem = this._materialData[selectedId];
            redDotMgr.clearNewMaterial(this._materialData[selectedId]);
            redDotMgr.fire(RED_DOT_MODULE.BAG_MATERIAL_TOGGLE);
        }
        this._curSelID = selectedId;
    }

    private updateEquipDetailInfo(sId: number) {
        let page = this.detailPag[PAGE_TYPE.EQUIPMENT];
        let equipData = this._equipData[sId];
        let equip = new Equip(equipData);
        let config = equip.equipCfg;
        let equipMaxLevel = bagDataUtils.curEquipMaxLevel;
        let equipMaxExp = equip.getEquipCurMaxExp();
        let equipCurExp = equip.getEquipCurExp();
        let equipLevel = equip.getEquipLevel();
        let equipProp = equip.getEquipDetailInfo();
        let equipNode: EquipDetailTmp = page.getComponent("EquipDetailTmp");
        //基础装备信息
        let emptyNode = page.getChildByName("empty");
        let eItem: ItemBag = emptyNode.getComponentInChildren(ItemBag);
        if (!eItem){
            eItem = ItemBagPool.get();
            eItem.node.parent = emptyNode;
            this._itemBags.push(eItem);
        } 
        eItem.init({
            id: equip.equipData.ID,
            level: equip.getEquipLevel(),
            count: equip.equipData.Count,
            star: equip.equipData.EquipUnit.Star,
            currEquip: bagDataUtils.checkEquipIsDressed(equipData)
        });

        let isExclusive = equip.isExclusive();
        let arriveMax = equipLevel >= equipMaxLevel;

        //专属装备没有升级，只有升星
        equipNode.enhanceBtn.active = !isExclusive && !arriveMax;
        equipNode.breakBtn.active =  equip.equipData.EquipUnit.Star < EQUIP_MAX_STAR;
        equipNode.spiritBtn.active = bagDataUtils.checkEquipCastSoul(equip);

        equipNode.eName.string = config.EquipName || '';

        equipNode.eGrade.node.active = !isExclusive;
        equipNode.eExp.node.active = !isExclusive;
        equipNode.eExpP.node.active = !isExclusive;
        if(!isExclusive){
            equipNode.eGrade.string = `等级：${equipLevel}/${equipMaxLevel}`;
            equipNode.eExp.string = `经验：${equipCurExp}/${equipMaxExp}`;
            equipNode.eExpP.progress = equipCurExp / equipMaxExp;
            //如果已经满级
            if (equipLevel == equipMaxLevel) {
                equipNode.eExp.string = `满级`;
                equipNode.eExpP.progress = 1;
            }
        }

        //装备属性提示
        let parseRes = utils.parseStingList(config.GreenId);
        let index = equip.getIndexOfGreenID();
        let nextLevel = bagDataUtils.equipMaxLevel;
        let isTop: boolean = false;
        if (parseRes.length > 0 && index >= 0) {
            isTop = index === parseRes.length-1;
            nextLevel = index < parseRes.length-1 ? Number(parseRes[index+1][0]) : Number(parseRes[index][0]);
        }
        
        this.bubbleGreen.parent.active = Boolean(equipProp.green.length);
        this.bubbleGreen.active = !isTop;
        this.bubbleYellow.parent.active = Boolean(equipProp.yellow);
        this.bubbleYellow.active = equipData.EquipUnit.Star != EQUIP_MAX_STAR;
        this.bubbleGreen.getComponentInChildren(cc.Label).string = `强化至${nextLevel}级可提升`;
        this.bubbleYellow.getComponentInChildren(cc.Label).string = `突破至${equipData.EquipUnit.Star + 1}星可提升`;
        this.equipPropPage.getComponent("EquipProps").equipData = equipData;
        this.equipPropPage.getComponent("EquipProps").updateInfo(equipProp);
        this.equipPropPage.getComponent("EquipProps").showCastSoulProps(equipData);

        this._spriteLoader.changeSprite(equipNode.eType, equip.getEquipTextureIcon());
        this._spriteLoader.changeSprite(equipNode.ePart, equip.getEquipPositionIcon());

        equipNode.enhanceBtnRedot.setData(RED_DOT_MODULE.BAG_VIEW_EQUIP_ENHANCE_BTN, {
            args: [equipData]
        });
        
        equipNode.breakBtnRedot.setData(RED_DOT_MODULE.BAG_VIEW_EQUIP_BREAK_BTN, {
            args: [equipData]
        });

        equipNode.spiritBtnRedot.setData(RED_DOT_MODULE.BAG_VIEW_EQUIP_SPIRIT_BTN, {
            args: [equipData]
        });
    }

    private updatePropDetailInfo(config: cfg.Item, sId: number) {
        let page = this.detailPag[PAGE_TYPE.PROP];
        let propInfo = this._propData[sId];
        let emptyNode = page.getChildByName("empty")
        let mName = page.getChildByName("txt_name").getComponent(cc.Label);
        let mDesc = page.getChildByName("txt_detail").getComponent(cc.Label);
        let mNum = page.getChildByName("txt_count1").getComponent(cc.Label);
        let mItem: ItemBag = emptyNode.getComponentInChildren(ItemBag);
        if (!mItem) {
            mItem = ItemBagPool.get();
            mItem.node.parent = emptyNode;
            this._itemBags.push(mItem);
        }
        mItem.init({
            id: propInfo.ID,
            count: 0, 
        })
        mNum.string = propInfo.Count;
        mName.string = config.ItemName;
        mDesc.string = config.ItemIntroduce;
    }

    private updateMaterialDetailInfo(config: cfg.Item, sId: number) {
        let page = this.detailPag[PAGE_TYPE.MATERIAL];
        let materialInfo = this._materialData[sId];
        let emptyNode = page.getChildByName("empty")
        let mName = page.getChildByName("txt_name").getComponent(cc.Label);
        let mDesc = page.getChildByName("txt_detail").getComponent(cc.Label);
        let mNum = page.getChildByName("txt_count1").getComponent(cc.Label);
        let mItem: ItemBag = emptyNode.getComponentInChildren(ItemBag);
        if (!mItem) {
            mItem = ItemBagPool.get();
            mItem.node.parent = emptyNode;
            this._itemBags.push(mItem);
        }
        mItem.init({
            id: materialInfo.ID,
            count: 0,
        })
        mNum.string = materialInfo.Count;
        mName.string = config.ItemName;
        mDesc.string = config.ItemIntroduce;
    }

    private updateAccessInfo(accessStr: string) {
        let accessList = accessStr ? accessStr.split("|") : [];
        let accessNode = this._curPageType == PAGE_TYPE.MATERIAL ? this.mAccessList : this.pAccessList;
        if (accessList.length > 0) {
            resourceManager.load("prefab/views/view-bag/item/ItemPropAccess", cc.Prefab)
                .then((info) => {
                    accessNode.content.children.forEach(child =>{
                        let comp = child.getComponent("ItemPropAccess");
                        comp && comp.deInit();
                    });
                    accessNode.content.removeAllChildren();
                    accessList.forEach((access) => {
                        let itemNode = cc.instantiate(info.res);
                        let cfg = configUtils.getAccessConfig(Number(access) || -1);
                        if (cfg) {
                            accessNode.content.addChild(itemNode);
                            itemNode.getComponent("ItemPropAccess").jumpPage = access;
                        }
                    })
                });
        }
    }
    //使用道具
    private onClickUseItem(event: cc.Event) {
        if (this._curPageType == PAGE_TYPE.PROP) {
            let item = this._propData[this._curSelID];
            let cfg = configUtils.getItemConfig(item.ID);

            switch (cfg.ItemUseEffect) {
                //跳转到指定模块
                case 1:
                    let parseList = utils.parseStingList(cfg.ItemUseEffectNum);
                    parseList = cfg.ItemUseEffectNum.search(";") == -1 ? parseList : parseList[0];
                    let moduleId = parseList && parseList[0] ? parseList[0] : 0;
                    let partId = parseList && parseList[1] ? parseList[1] : 0;
                    let subId = parseList && parseList.length != 0 ? parseList[2] : 0;
                    this._clearLastItemsNewTag();
                    moduleUIManager.jumpToModule(moduleId, partId, subId);
                    break;
                //选择使用数量
                case 2:
                case 4:
                case 5:
                    if (!cfg.ItemUseNum) {
                        let copyItem: any = utils.deepCopy(item);
                        copyItem.Count = 1;
                        bagDataOpt.sendItemUseRequst(copyItem);
                    } else {
                        let minNum = cfg.ItemComposeNum || 1;
                        let cnt = utils.longToNumber(item.Count);
                        cnt >= minNum && (this.loadSubView(VIEW_NAME.BAGITEM_USE_VIEW, item, minNum));
                        cnt < minNum && guiManager.showDialogTips(CustomDialogId.BAG_ITEM_NO_ENOUGH);
                    }
                    break;
                case 3:
                    if (cfg.ItemUseNum) {
                        let minNum = cfg.ItemComposeNum || 1;
                        let cnt = utils.longToNumber(item.Count);
                        cnt >= minNum && (this.loadSubView(VIEW_NAME.BAGITEM_USE_VIEW, item, 1, (cnt: number) => {
                            this.loadSubView(VIEW_NAME.GIFT_CHOOSE_VIEW, item.ID, cnt);
                        }));
                    } else {
                        this.loadSubView(VIEW_NAME.GIFT_CHOOSE_VIEW, item.ID, 1);
                    }

                    break;
                default:
                    guiManager.showDialogTips(CustomDialogId.BAG_ITEM_NO_SUPPORT);;
            }
        }
    }

    //筛选按钮
    private onClickFliter(event: cc.Event) {
        this.filterLayout.active = !this.filterLayout.active;
    }
    //筛选框子选项
    private onClickSubFilter(event: cc.Event) {
        let subBtns = event.target.getChildByName("subBtns");
        let qualityBtn = this.filterLayout.getChildByName("qualityBtn");
        let typeBtn = this.filterLayout.getChildByName("typeBtn");
        qualityBtn.getChildByName("subBtns").active = false;
        typeBtn.getChildByName("subBtns").active = false;
        subBtns.active = !subBtns.active;
    }
    //筛选品质选项
    private onClickQualityFilter(event: cc.Event, customEventData: string) {
        let subBtns = event.target.parent;
        subBtns.active = false;
        this.filterLayout.active = false;
        this._filterQuality = Number(customEventData);
        subBtns.parent.getComponentInChildren(cc.Label).string = event.target.getComponentInChildren(cc.Label).string;
        if (this._curPageType == PAGE_TYPE.EQUIPMENT) {
            this.initEquipmentView();
            this.listView.scrollTo(0, 0);
        }
    }
    //筛选类型选项
    private onClickTypeFilter(event: cc.Event, customEventData: string) {
        let subBtns = event.target.parent;
        subBtns.active = false;
        this.filterLayout.active = false;
        this._filterType = Number(customEventData);
        subBtns.parent.getComponentInChildren(cc.Label).string = event.target.getComponentInChildren(cc.Label).string;
        if (this._curPageType == PAGE_TYPE.EQUIPMENT) {
            this.initEquipmentView();
            this.listView.scrollTo(0, 0);
        }
    }
    private resetFilter() {
        let qualityBtn = this.filterLayout.getChildByName("qualityBtn");
        let typeBtn = this.filterLayout.getChildByName("typeBtn");
        qualityBtn.getComponentInChildren(cc.Label).string = "品质";
        typeBtn.getComponentInChildren(cc.Label).string = "类型";
        this._filterQuality = null;
        this._filterType = null;
        this.filterLayout.active = false;
    }
    /**
     * @description: 装备强化和突破、分解
     * @param {*}
     * @return {*}
     */
    private onClickEquipEnchance(event: cc.Event) {
        this._clearLastItemsNewTag();
        moduleUIManager.jumpToModule(21001, 0, 0, this._equipData[this._curSelID]);
    }

    private onClickEquipBreak(event: cc.Event) {
        this._clearLastItemsNewTag();
        moduleUIManager.jumpToModule(21001, 1, 0, this._equipData[this._curSelID]);
    }
    private onClickEquipSpirit(event: cc.Event) {
        this._clearLastItemsNewTag();
        moduleUIManager.jumpToModule(21001, 2, 0, this._equipData[this._curSelID]);
    }

    private onClickEquipSplit() {
        this._clearLastItemsNewTag();
        guiManager.loadModuleView("EquipRevertView", 38000, 1);
    }

    /**
     * =======================================
     * @desc 辅助背包数据运算方法
     * =======================================
     */

    //按照位置和品质筛选装备
    getPartEquipsByQualityAndType(quality: QUALITY_TYPE, type: EQUIP_TEXTURE_TYPE) {
        let equips = bagData.equipList;
        let filterEquips: data.IBagUnit[] = [];
        equips.sort((a, b) => {
            return b.EquipUnit.Star - a.EquipUnit.Star;
        });
        equips.sort((a, b) => {
            return b.EquipUnit.Exp - a.EquipUnit.Exp;
        });
        equips.sort((a, b) => {
            let qA = configUtils.getEquipConfig(a.ID).Quality;
            let qB = configUtils.getEquipConfig(b.ID).Quality;
            return qB - qA;
        });
        for (let i = 0; i < equips.length; ++i) {
            let config = configUtils.getEquipConfig(equips[i].ID);
            if (quality && type && config.Quality == quality && config.TextureType == type) {
                filterEquips.push(equips[i]);
            } else if (quality && !type && config.Quality == quality) {
                filterEquips.push(equips[i]);
            } else if (type && !quality && config.TextureType == type) {
                filterEquips.push(equips[i]);
            } else if (!type && !quality) {
                filterEquips.push(equips[i]);
            }
        }
        return filterEquips;
    }

    private _preloadProp: boolean = false;
    private _preloadMat: boolean = false;
    private _preloadEquip: boolean = false;
    //获取当前背包内所有数据图片路径
    getItemResPath(type?: PAGE_TYPE): string[] {
        let resPathArr: string[] = [];
        if (!this._preloadEquip) {
            let equips = bagData.getItemsByType(BAG_ITEM_TYPE.EQUIP);
            equips.forEach((ele) => {
                let cfg = configUtils.getEquipConfig(ele.ID);
                if (cfg && cfg.Icon) {
                    let resPath = `${RES_ICON_PRE_URL.BAG_ITEM}/${cfg.Icon}`;
                    resPathArr.indexOf(resPath) == -1 && resPathArr.push(resPath);
                }
            })
            this._preloadEquip = true;
        }
        if (!this._preloadProp) {
            let props = bagData.getItemsByType(BAG_ITEM_TYPE.PROP);
            props.forEach((ele) => {
                let cfg = configUtils.getItemConfig(ele.ID);
                if (cfg && cfg.ItemIcon) {
                    let resPath = `${RES_ICON_PRE_URL.BAG_ITEM}/${cfg.ItemIcon}`;
                    resPathArr.indexOf(resPath) == -1 && resPathArr.push(resPath);
                }
            });
            this._preloadProp = true;
        }
        if (!this._preloadMat) {
            let mats = bagData.getItemsByType(BAG_ITEM_TYPE.MATERIAL);
            mats.forEach((ele) => {
                let cfg = configUtils.getItemConfig(ele.ID);
                if (cfg && cfg.ItemIcon) {
                    let resPath = `${RES_ICON_PRE_URL.BAG_ITEM}/${cfg.ItemIcon}`;
                    resPathArr.indexOf(resPath) == -1 && resPathArr.push(resPath);
                }
            });
            this._preloadMat = true;
        }
        return resPathArr;
    }

    private _clearLastItemsNewTag(isRefreshView: boolean = true){
        if (this._curPageType == PAGE_TYPE.PROP) {
            this._clearPropsNewTag(isRefreshView);
            return;
        }

        if(this._curPageType == PAGE_TYPE.EQUIPMENT) {
            this._clearEquipNewTag(isRefreshView);
            return;
        }

        if(this._curPageType == PAGE_TYPE.MATERIAL) {
            this._clearMaterialsNewTag(isRefreshView);
            return;
        }
    }

    private _clearPropsNewTag(isRefreshView: boolean) {
        redDotMgr.clearAllNewProps();
        if(!isRefreshView) return;
        let items: cc.Node[] = this.listView.getInsideItem();
        items.forEach(ele => {
            let itembagComp = ele.getComponent(ItemBag);
            if(!cc.isValid(itembagComp)) return;
            let showData = itembagComp.itemRedDot.showData;
            if(typeof showData == 'object') showData.isNew = false;
            cc.isValid(itembagComp) && itembagComp.itemRedDot.showRedDot(showData);
        });
        redDotMgr.fire(RED_DOT_MODULE.BAG_PROP_TOGGLE);
    }

    private _clearEquipNewTag(isRefreshView: boolean) {
        redDotMgr.clearEquipAllNewData();
        if(!isRefreshView) return;
        let items: cc.Node[] = this.listView.getInsideItem();
        items.forEach(ele => {
            let itembagComp = ele.getComponent(ItemBag);
            cc.isValid(itembagComp) && itembagComp.itemRedDot.clear();
        })
        redDotMgr.fire(RED_DOT_MODULE.BAG_EQUIP_TOGGLE);
    }

    private _clearMaterialsNewTag(isRefreshView: boolean) {
        redDotMgr.clearAllNewMaterials()
        if(!isRefreshView) return;
        let items: cc.Node[] = this.listView.getInsideItem();
        items.forEach(ele => {
            let itembagComp = ele.getComponent(ItemBag);
            if(!cc.isValid(itembagComp)) return;
            itembagComp.itemRedDot.clear();
        });
        redDotMgr.fire(RED_DOT_MODULE.BAG_MATERIAL_TOGGLE);
    }

}
