
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { resourceManager } from "../../../common/ResourceManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { bagDataEvent } from "../../../common/event/EventData";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { data } from "../../../network/lib/protocol";
import { Equip } from "../../template/Equip";
import { configUtils } from "../../../app/ConfigUtils";
import { utils } from "../../../app/AppUtils";
import { bagData } from "../../models/BagData";
import { bagDataOpt } from "../../operations/BagDataOpt";
import { configManager } from "../../../common/ConfigManager";
import { cfg } from "../../../config/config";
import { serverTime } from "../../models/ServerTime";
import { commonData } from "../../models/CommonData";
import { CustomDialogId } from "../../../app/AppConst";
import ItemSpiritProp from "./ItemSpiritProp";
import ItemBag from "../view-item/ItemBag";
import List from "../../../common/components/List";
import EquipEnhanceView from "./EquipEnhanceView";
import RichTextEx from "../../../common/components/rich-text/RichTextEx";
import {scheduleManager} from "../../../common/ScheduleManager";
import guiManager from "../../../common/GUIManager";
import { BagItemInfo, EquipAttr } from "../../../app/AppType";
import EquipSubViewBase from "./EquipSubViewBase";
import ItemRedDot from "../view-item/ItemRedDot";
import { redDotMgr, RED_DOT_MODULE } from "../../../common/RedDotManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";

interface SpiritItem {
    itemID: number,
    costNum: number,
    price: number,
}

const { ccclass, property } = cc._decorator;

const qualityStr: string[] = ['', 'N', 'R', 'SR', 'SSR', 'SP'];

@ccclass
export default class EquipSpiritNode extends EquipSubViewBase {
    @property(cc.Node) needsRoot: cc.Node = null;
    @property(List) propList: List = null;
    @property(cc.Node) empty: cc.Node = null;
    @property(cc.Node) tipsProp: cc.Node = null;
    @property(cc.Node) tipsItem: cc.Node = null;
    @property(RichTextEx) gold: RichTextEx = null;
    @property(RichTextEx) title: RichTextEx = null;

    @property(cc.Button) spiritButton: cc.Button = null;
    @property(cc.Button) saveButton: cc.Button = null;
    @property(ItemRedDot) itemRedot: ItemRedDot = null;

    private _spriteLoader = new SpriteLoader();
    private _equipData: data.IBagUnit = null;
    private _spiritItems: SpiritItem[] = null;
    private _spiritProps: EquipAttr[] = [];
    private _equip: Equip = null;
    private _rootNode: EquipEnhanceView = null;
    private _limitCnt: number = NaN;
    private _selIdx: number = 0;
    private _scheduleId: number = 0;
    private _equipCastSoulCfg: any[] = null;
    private _equipCaseLimitCfg: any[] = null;
    private _bagItems: ItemBag[] = [];

    onInit(equipData: data.IBagUnit, rootNode: EquipEnhanceView) {
        this._equip = new Equip(equipData);
        this._rootNode = rootNode;
        this._equipData = equipData;
        this._registerAllEvent();
        this._initSpiritView();
        this._setupRedDot();
    }

    private _registerAllEvent() {
        eventCenter.register(bagDataEvent.EQUIP_CAST_SOUL, this, this._onEquipCastSoulRes);
        eventCenter.register(bagDataEvent.EQUIP_CAST_SOUL_CHOOSE, this, this._onEquipCastSoulChooseRes);
    }

    private _setupRedDot(){
        this.itemRedot.setData(RED_DOT_MODULE.EQUIP_SPIRIT_NODE_SPIRIT_BTN, {
            args: [this._equipData]
        });
    }

    deInit() {
        this._equipData = null;
        this._spriteLoader.release();
        this._clearItems();
        this.propList._deInit();
        eventCenter.unregisterAll(this);
        if (this._scheduleId) scheduleManager.unschedule(this._scheduleId);
        resourceManager.release("prefab/views/view-bag/item/ItemPropAccess");
    }

    onRelease() {
        this.itemRedot.deInit();
        this._equipCastSoulCfg = null;
        this._equipCaseLimitCfg = null;
        this._limitCnt = NaN;
        this.deInit();
    }

    onRefresh() {
        this._showGlodState();
    }

    private _initSpiritView() {
        this._prepareData();
        this._showView();
        this._showBase();
    }

    private _showBase () {
        let coldTime = (commonData.tmpCache.EQUIP_SPIRIT_COLDTIME || 0) - serverTime.currServerTime();
        if (coldTime > 0) {
            if (this._scheduleId) scheduleManager.unschedule(this._scheduleId);
            this._scheduleId = scheduleManager.schedule(() => {
                let coldTime = (commonData.tmpCache.EQUIP_SPIRIT_COLDTIME || 0) - serverTime.currServerTime();
                if (coldTime <= 0) {
                    scheduleManager.unschedule(this._scheduleId);
                    this.saveButton.interactable = true;
                    this.saveButton.node.getComponentInChildren(cc.Label).string = `保存`;
                } else {
                    this.saveButton.interactable = false;
                    this.saveButton.node.getComponentInChildren(cc.Label).string = `保存(${coldTime})`;
                }
            }, 1)
            this.saveButton.node.getComponentInChildren(cc.Label).string = `保存(${coldTime})`;
            this.saveButton.interactable = false;
        }
    }

    private _prepareData() {
        if(!this._equipCastSoulCfg || !this._equipCaseLimitCfg){
            let moduleCfg = configUtils.getModuleConfigs();
            this._equipCastSoulCfg = this._equipCastSoulCfg || utils.parseStingList(moduleCfg.ItemCastSoulNum);
            this._equipCaseLimitCfg =  this._equipCaseLimitCfg || utils.parseStingList(moduleCfg.EquipCastSoulNum);
        }

        if(!this._spiritItems){
            this._spiritItems = [];
            let items = this._equipCastSoulCfg;
            let castSoulCfgs = configManager.getConfigList("equipCastSoul");
            let itemLen = items.length;
            items.forEach((ele)=>{
                let find = castSoulCfgs.findIndex(cfg => {
                    return cfg.EquipCastSoulItemId == ele[0] && cfg.EquipCastSoulEquipType == this._equip.equipCfg.TextureType
                        && cfg.EquipCastSoulEquipPart == this._equip.equipCfg.PositionType;
                });
                if(!itemLen || find == -1) return;

                this._spiritItems.push({
                    itemID: parseInt(ele[0]),
                    costNum: 1,
                    price: parseInt(ele[2])});
            })
        }

        if(isNaN(this._limitCnt)){
            let limits = this._equipCaseLimitCfg;
            let limit = limits.find((limit) => { return limit[0] && limit[0] == this._equip.equipCfg.Quality });
            this._limitCnt = (limit && limit[1]) ? parseInt((limit[1])) : 0;
        }
      
        this._spiritProps = this._calEquipAttrs(this._equipData.EquipUnit.CastSoulPoolMap, true)
            .concat(this._calEquipAttrs(this._equipData.EquipUnit.CastSoulChooseMap));
    }

    private _showView() {
        //标题提示字
        let castSoulPool = this._calEquipAttrs(this._equipData.EquipUnit.CastSoulPoolMap);
        let quality = qualityStr[this._equip.equipCfg.Quality - 1] || "";
        let selMap: number[]  = [];
        this.title.string = `<color = #eb6f08> ${quality} </c> 装备最多可以保留${this._limitCnt}条铸魂属性`;
        this.empty.active = !this._spiritProps.length;
        this.tipsProp.active = !!this._spiritProps.length;
        this.propList.node.active = !!this._spiritProps.length;

        this.tipsItem.active = !castSoulPool.length;
        this.needsRoot.active = !castSoulPool.length;
        this.gold.node.parent.active = !castSoulPool.length;
        this.spiritButton.node.active = !castSoulPool.length;
        this.saveButton.node.active = !!castSoulPool.length;

        this.propList.numItems = this._spiritProps.length;

        this._spiritProps.forEach((_vv, _kk)=>{
            !_vv.new && selMap.push(_kk);
        })
        this.propList.setMultSelected(selMap, true);
        this._showGlodState();
        this._showNeedCast();
    }

    private _showNeedCast () {
        this._clearItems();
        let self = this;
        this._spiritItems.forEach( (_v, _idx) => {
            let item = ItemBagPool.get();
            let itemId = _v.itemID;
            let haveCount = bagData.getItemCountByID(itemId);
            let txtColor = !!haveCount ? '#ffffff' : '#ff0000';
            item.init({
                id: itemId,
                count: 0,
                richTxt: `<color=${txtColor}>${haveCount}</c>`,
                clickHandler: (info: BagItemInfo) => {
                    self._selIdx = _idx;
                    self._showGlodState();
                    self._bagItems.forEach(_item => {
                        _item.refreshSelect(info.id)
                    })
                }
            })
            this.needsRoot.addChild(item.node);
            this._bagItems.push(item);
        })
    }

    private _showGlodState() {
        let needGold = this._spiritItems[this._selIdx] ? 
            this._spiritItems[this._selIdx].price : 0;
        let haveGold = bagData.gold;
        this.gold.string = needGold <= haveGold ? `${needGold}` : `<color=#ff0000>${needGold}</c>`;
    }
  
    private _onEquipCastSoulRes() {
        let newEquipData = bagData.getItemBySeq(this._equipData.Seq, this._equipData.ID);
        let castSoulPool = this._calEquipAttrs(newEquipData.EquipUnit.CastSoulPoolMap);
        this._equipData = utils.deepCopy(newEquipData);
        this._equip.setData(this._equipData);
        this._rootNode.updateEquipData(newEquipData);
        if (castSoulPool && castSoulPool.length){
            commonData.spiritColdTime = serverTime.currServerTime() + 3;
        }
        this._initSpiritView();
        redDotMgr.fire(RED_DOT_MODULE.EQUIP_SPIRIT_NODE_SPIRIT_BTN);
        redDotMgr.fire(RED_DOT_MODULE.EQUIP_SPIRIT_TOGGLE);
        redDotMgr.fire(RED_DOT_MODULE.BAG_VIEW_EQUIP_SPIRIT_BTN);
    }

    private _onEquipCastSoulChooseRes() {
        let newEquipData = bagData.getItemBySeq(this._equipData.Seq, this._equipData.ID)
        this._equipData = utils.deepCopy(newEquipData);
        this._equip.setData(this._equipData);
        this._rootNode.updateEquipData(newEquipData);
        this._initSpiritView();
        guiManager.showDialogTips(CustomDialogId.EQUIP_SPIRIT_SAVED);
    }

    onPropListRender(itemNode: cc.Node, idx: number) {
        let itemComp = itemNode.getComponent(ItemSpiritProp);
        let castSoulPool = this._calEquipAttrs(this._equipData.EquipUnit.CastSoulPoolMap);
        let selectMap = this.propList.getMultSelected();
        let isChecked = selectMap.findIndex((_sId) => { return _sId == idx }) != -1;
        itemComp.isChecked = isChecked;
        itemComp.init(this._spiritProps[idx], castSoulPool.length==0);
    }

    onPropSelectRender(itemNode: cc.Node, selIdx: number) {
        let itemComp = itemNode.getComponent(ItemSpiritProp);
        let selectMap = this.propList.getMultSelected();
        let isChecked = selectMap.findIndex((_sId) => { return _sId == selIdx }) != -1;;
        let findSame = selectMap.findIndex((_sId) => { return _sId != selIdx && 
            this._getCastSoulPropertyId(this._spiritProps[_sId].attributeId) == 
                this._getCastSoulPropertyId(this._spiritProps[selIdx].attributeId)});
        if (findSame == -1 && selectMap.length <= this._limitCnt){
            itemComp.isChecked = isChecked;
        } else if (findSame != -1) {
            this.propList.setMultSelected(selIdx, false);
            itemComp.isChecked = false;
            guiManager.showMessageBox(this._rootNode.node, { titleStr: "铸魂", content: "当前已选择同类型铸魂属性，请重新选择"});
        } else {
            this.propList.setMultSelected(selIdx, false);
            itemComp.isChecked = false;
            guiManager.showMessageBox(this._rootNode.node, { titleStr: "铸魂", content: "已达到最大保存数量，请重新选择" });
        }
    }

    onClickCastSoul() {
        let currSelect = this._spiritItems[this._selIdx];
        if (!currSelect) {
            guiManager.showDialogTips(CustomDialogId.EQUIP_SPIRIT_MAT_NO_SELECT);
            return;
        }

        let itemId = currSelect.itemID;
        let needGold = currSelect.price || 0;
        let haveGold = bagData.gold;
        let needCount = currSelect.costNum;
        let haveCount = bagData.getItemCountByID(itemId);
        
        if (needCount <= haveCount && needGold <= haveGold){
            bagDataOpt.sendEquipCastSoulRequest(this._equipData, itemId);
        } else if (needCount <= haveCount) {
            guiManager.showDialogTips(CustomDialogId.EQUIP_SPIRIT_GOLD_NO_ENOUGH);
        } else if (needGold <= haveGold) {
            guiManager.showDialogTips(CustomDialogId.EQUIP_SPIRIT_MAT_NO_ENOUGH);
        }
    }

    onClickSaveProps(){
        let selMap = this.propList.getMultSelected();
        let chooseMap: {[k:string]: number} = {};
        let noRepeatItem: number[] = [];
        selMap.forEach((_selId, _index)=>{
            chooseMap[this._spiritProps[_selId].attributeId] = this._spiritProps[_selId].value;
        })
        this._spiritProps.forEach((_prop) => {
            if (noRepeatItem.findIndex((_item) => { return _item == _prop.attributeId }) == -1) 
                noRepeatItem.push(_prop.attributeId);
        })
        if (!selMap.length || (selMap.length && selMap.length < Math.min(this._limitCnt, noRepeatItem.length)))
            guiManager.showMessageBox(this._rootNode.node, { 
                content: "当前还有可勾选的铸魂属性，确定要放弃选择",
                leftStr: "取消",
                leftCallback: null,
                rightStr: "确定",
                rightCallback: (msgBox: ViewBaseComponent)=>{
                    msgBox.closeView();
                    bagDataOpt.sendEquipCastSoulChooseRequest(this._equipData, chooseMap);
                },
                titleStr: "铸魂",
            });
        else 
            bagDataOpt.sendEquipCastSoulChooseRequest(this._equipData, chooseMap);
    }

    private _calEquipAttrs(attrMap: {[k: string]: number}, isNew?: boolean): EquipAttr[]{
        let attrs: EquipAttr[] = [];
        for (let k in attrMap){
            attrs.push({
                attributeId: parseInt(k),
                value: attrMap[k],
                new: isNew
            })
        }
        return attrs;
    }

    private _getCastSoulPropertyId(attrId: number){
        let castSoulCfg: cfg.EquipCastSoul = configManager.getConfigByKey("equipCastSoul", attrId);
        return castSoulCfg ? castSoulCfg.EquipCastSoulPropertyId : -1;
    }

    private _clearItems () {
        this._bagItems.forEach(_v=> {
            ItemBagPool.put(_v)
        })
        this._bagItems = [];
    }
        
}