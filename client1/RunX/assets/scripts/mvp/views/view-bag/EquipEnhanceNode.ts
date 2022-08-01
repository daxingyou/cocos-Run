import { QUALITY_TYPE, EQUIP_TEXTURE_TYPE, BAG_ITEM_TYPE } from "../../../app/AppEnums";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { resourceManager } from "../../../common/ResourceManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { bagDataEvent } from "../../../common/event/EventData";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { configUtils } from "../../../app/ConfigUtils";
import { utils } from "../../../app/AppUtils";
import { data, gamesvr } from "../../../network/lib/protocol";
import { CustomDialogId, CustomItemId, EQUIP_MAX_STAR, XUANTIE_TO_EXP} from "../../../app/AppConst";
import { bagData } from "../../models/BagData";
import { Equip } from "../../template/Equip";
import { bagDataOpt } from "../../operations/BagDataOpt";
import { audioManager, SFX_TYPE } from "../../../common/AudioManager";
import { userData } from "../../models/UserData";
import { bagDataUtils } from "../../../app/BagDataUtils";
import EquipEnhanceView from "./EquipEnhanceView";
import guiManager from "../../../common/GUIManager";
import List from "../../../common/components/List";
import RichTextEx from "../../../common/components/rich-text/RichTextEx";
import EquipSubViewBase from "./EquipSubViewBase";
import ItemRedDot from "../view-item/ItemRedDot";
import { redDotMgr, RED_DOT_MODULE } from "../../../common/RedDotManager";
import ItemMaterial from "./ItemMaterial";
import { cfg } from "../../../config/config";

export enum PAGE_TYPE { ENHANCE, BREAKTHROUGH, SPIRIT }

const { ccclass, property } = cc._decorator;
const FULL_PERCENT = 10000;
const SLIDE_TIME = 200;// 滑动最少间隔避免频繁刷新

@ccclass
export default class EquipEnhanceNode extends EquipSubViewBase {
    @property(List) listView: List = null;                              //物品列表     
    @property(cc.Node) filterNode: cc.Node = null;                      //获取物品按钮
    @property(cc.Label) levelLabel: cc.Label = null;                    //等级提示字
    @property(cc.Slider) levelSlider: cc.Slider = null;                //等级滑动条
    @property(ItemRedDot) enchanceRedot: ItemRedDot = null;
    @property(cc.Node)  emptyTips: cc.Node = null;

    private _filterQuality: QUALITY_TYPE = null;
    private _filterType: EQUIP_TEXTURE_TYPE = null;
    private _spriteLoader = new SpriteLoader();
    private _equipData: data.IBagUnit = null;
    private _equip: Equip = null;
    private _itemExpList: data.IBagUnit[] = [];
    //强化装备使用数据
    private _initLevel: number = null;                          //装备当前等级
    private _curLevel: number = null;                           //临时数据记录强化等级
    private _curMaxLevel: number = null;                        //当前材料装备强化上限
    //辅助数据，用于组件状态保存
    private _listSelNumber: number[] = [];
    private _rootNode: EquipEnhanceView = null;

    onInit(equipData: data.IBagUnit, rootNode: EquipEnhanceView) {
        this._equip = new Equip(equipData);
        this._rootNode = rootNode;
        this._equipData = equipData;
        this._equipData.EquipUnit.Exp = equipData.EquipUnit.Exp || 0;
        this.registerAllEvent();
        this.initEnhanceView();
        this._updateRedot();
        this.levelSlider.node.on(cc.Node.EventType.TOUCH_END, this._onTouchEnd, this, true);
        this.levelSlider.node.on(cc.Node.EventType.TOUCH_CANCEL, this._onTouchEnd, this, true);
    }

    registerAllEvent() {
        eventCenter.register(bagDataEvent.EQUIP_ENHANCED, this, this.onEquipEnhanced);
    }

    deInit() {
        this.levelSlider.node.targetOff(this)
        this.enchanceRedot.deInit();
        this._equipData = null;
        this._spriteLoader.release();
        this.listView._deInit();
        eventCenter.unregisterAll(this);
        resourceManager.release("prefab/views/view-bag/item/ItemPropAccess");
    }

    onRelease() {
        this.deInit();
        this.listView._deInit();
    }

    onRefresh() {
        this.updateEnhanceGoldButton();
    }

    initEnhanceView() {
        this._initLevel = this._equip.getEquipLevel();
        this._curLevel = this._initLevel;
        this.updateMaterialView();
        
        this._rootNode.updateEquipDetailInfo();
    }

    private _updateRedot(){
        this.enchanceRedot.setData(RED_DOT_MODULE.EQUIP_ENHANCE_NODE_ENGANCE_BTN, {
            args: [this._equipData]
        });
    }
 
    //更新材料数据
    updateMaterialView() {
        this._itemExpList = bagDataUtils.getItemExpByQualityAndType(this._equipData, this._filterQuality, this._filterType);
        this._listSelNumber = Array.from({ length: this._itemExpList.length }, () => 0);
        this._curMaxLevel = this.getMaxLevel();
        this._curLevel = this._initLevel;
        this.filterNode.parent.active = true;
        this.listView.node.active = !!this._itemExpList.length;
        this.listView.numItems = this._itemExpList.length;
        this.listView.setMultSelected([], true);

        this.emptyTips.active = this._itemExpList.length == 0;

        //滑动条
        this.levelSlider.progress = 0;
        this.levelLabel.string = `${this._initLevel}/${this._curMaxLevel}`;
        this.initSlideProgress();
        //金币数
        let layout = this.node.getChildByName("layout"); 
        let btnEnhance = this.node.getChildByName("button_enchance");
        let slider = this.node.getChildByName("enhance_slider");
        let tips = this.node.getChildByName("tips");
        let meetCurMaxLevel = this._curLevel == bagDataUtils.curEquipMaxLevel;
        let meetMaxLevel = this._curLevel == bagDataUtils.equipMaxLevel;
        // 如果已经满级
        btnEnhance.active = !meetCurMaxLevel;
        slider.active = !meetCurMaxLevel;
        layout.active = !meetCurMaxLevel;
        tips.active = meetCurMaxLevel;
        tips.getComponent(cc.Label).string = meetMaxLevel ? `已强化到满级` : `玩家升级后才可继续升级`;

        this.updateEnhanceGoldButton();
    }

    //刷新Item数据，注意Item复用做好数据清理
    onListRender(item: cc.Node, idx: number) {
        let itemScript:ItemMaterial = item.getComponent("ItemMaterial");
        if (this._itemExpList.length > idx) {
            let itemData = this._itemExpList[idx]
            let cfg = configUtils.getItemConfig(itemData.ID);
            itemScript.seq = idx;
            itemScript.setHandler(this.onClickItem.bind(this))
            //经验材料
            if (cfg) {
                itemScript.isEquipment = false;
                itemScript.clear();
                itemScript.updateIcon(cfg.ItemIcon);
                itemScript.updateCount(this._itemExpList[idx].Count);
                itemScript.updateSelectCount(this._listSelNumber[idx]);
                itemScript.updateQuality(cfg.ItemQuality);
                //如果已经满级，设置不可点击
                itemScript.clickStatus = this._curLevel < bagDataUtils.curEquipMaxLevel;
                return;
            }

            let cfg1 = configUtils.getEquipConfig(this._itemExpList[idx].ID);
            //经验装备
            if (cfg1) {
                let equipLevel = new Equip(this._itemExpList[idx]).getEquipLevel();
                itemScript.isEquipment = true;
                itemScript.clear();
                itemScript.updateIcon(cfg1.Icon);
                itemScript.updateSuitIcon(cfg1.SuitId);
                itemScript.updateLevel(equipLevel);
                itemScript.updateQuality(cfg1.Quality);
                itemScript.updateStar(this._itemExpList[idx].EquipUnit.Star);
            }
        }
    }

    onClickItem (item: ItemMaterial, add: boolean) {
        let multSelecArr = this.listView.getMultSelected();
        let currIdx = multSelecArr.indexOf(item.seq);
        if (!add) {
            if (!item.isEquipment && item.selectNum > 0) {
                let originCnt = item.selectNum;
                originCnt--;
                item.updateSelectCount(originCnt);
            }
            this._listSelNumber[item.seq] = item.selectNum
            if (item.selectNum <= 0) {
                item.buttonMinus.active = false;

                this.listView.setMultSelected(item.seq, false);
                this.onSelectRender(item.node, item.seq, 0, false)
            }
        } else {

            if (!item.isEquipment && !item.buttonMinus.active) {
            //先更新数量，再更新选中状态
                item.updateSelectCount(1);
                item.buttonMinus.active = true;
            } else if (!item.isEquipment && item.selectNum < item.totalCount) {
                item.updateSelectCount(item.selectNum + 1);
            }
            this._listSelNumber[item.seq] = item.selectNum
            if (multSelecArr.indexOf(item.seq) < 0) {
                multSelecArr.push(item.seq)
            }

            this.listView.setMultSelected(multSelecArr, true);
            this.onSelectRender(item.node, item.seq, 0, true);
        }
       
    }

    //选中材料操作
    onSelectRender(item: cc.Node, selectedId: number, lastSelectedId: number, val: boolean) {
        //如果已经满级，则不允许点击
        if (this._curLevel >= bagDataUtils.curEquipMaxLevel && val) {
            this.listView.setMultSelected(selectedId, false);
            return;
        }
        //遍历更新,清理驻留选中条目，刷新新的选中条目
        let multSelecArr = this.listView.getMultSelected();
        let listItem = this.listView.getItemByListId(selectedId).getComponent("ItemMaterial");

        if (listItem) {
            if (listItem.isEquipment) {
                // 装备选中就是1件
                this._listSelNumber[selectedId] = val? 1:0
            } else {
                this._listSelNumber[selectedId] = listItem.selectNum;
            }
        }

        let copyData: data.IBagUnit = utils.deepCopy(this._equipData);
        let addExp = this.getTotalExp(this.listView.getMultSelected());
        copyData.EquipUnit.Exp += addExp;
        let newEquip = new Equip(copyData);
        let newLevel = newEquip.getEquipLevel();
        addExp = Math.min(newEquip.getEquipMaxExp(), newEquip.equip.Exp) - this._equip.equip.Exp;
        copyData.EquipUnit.Exp = this._equip.equip.Exp + addExp;
        // 更新强化信息
        let capacity = (this._curMaxLevel - this._initLevel) || 0;
        this.levelSlider.progress = capacity == 0 ? 0 : (newLevel - this._initLevel) / capacity;
        this.levelLabel.string = `${newLevel}/${this._curMaxLevel}`;
        this._curLevel = newLevel;
        this._rootNode.updateEquipDetailInfo(copyData);
        this.listView.setMultSelected(multSelecArr, true);
        this.initSlideProgress();
        this.updateEnhanceGoldButton(addExp);
    }

    private _onTouchEnd (event: cc.Event) {
        let target = this.levelSlider
        if (!target) return;

        //@ts-ignore 避免过度计算导致卡顿
        let progress = target.progress;
        let capacity = (this._curMaxLevel - this._initLevel) || 0;
        let lv = this._initLevel + Math.floor(capacity * progress);
        if (lv != this._curLevel){
            let newLv = this.calNearestItems(lv);
            target.progress = capacity == 0 ? 0 : (newLv - this._initLevel) / capacity;
            this.levelLabel.string = `${newLv}/${this._curMaxLevel}`;
            this._curLevel = lv
        } else {
            target.progress = capacity == 0 ? 0 : (lv - this._initLevel) / capacity;
            this.levelLabel.string = `${lv}/${this._curMaxLevel}`;
        }
        this.initSlideProgress();
    }

    //滑动事件监听
    onSlideCallBack(target: cc.Slider) {
        // //@ts-ignore 避免过度计算导致卡顿
        // let progress = target.progress;
        // let capacity = (this._curMaxLevel - this._initLevel) || 0;
        // let lv = this._initLevel + Math.floor(capacity * progress);
        // if (lv != this._curLevel){
        //     let newLv = this.calNearestItems(lv);
        //     target.progress = capacity == 0 ? 0 : (newLv - this._initLevel) / capacity;
        //     this.levelLabel.string = `${newLv}/${this._curMaxLevel}`;
        //     this._curLevel = lv
        // } else {
        //     target.progress = capacity == 0 ? 0 : (lv - this._initLevel) / capacity;
        //     this.levelLabel.string = `${lv}/${this._curMaxLevel}`;
        // }
        // this.initSlideProgress();
        this._updateSlideProgress()
    }

    initSlideProgress() {
        //特殊情况
        if (this._initLevel == this._curMaxLevel){
            this.levelSlider.progress = 1;
        } else if (this._curLevel == this._initLevel){
            this.levelSlider.progress = 0;
        }
        this._updateSlideProgress();
    }

    private _updateSlideProgress () {
         //进度条移动
         let totalWidth: number = this.levelSlider.node.width + 10;
         let percent: number = Math.floor(this.levelSlider.progress * 100) / 100;
         let handleBg: cc.Node = this.levelSlider.node.getChildByName("handleBg");
         handleBg.width = percent * totalWidth;
    }

    //辅助加减按钮
    onClickButtonAdd() {
        if (this._curLevel < this._curMaxLevel) {
            this._curLevel += 1;
            this.calNearestItems(this._curLevel);
            let capacity = (this._curMaxLevel - this._initLevel) || 0;
            this.levelSlider.progress = capacity == 0 ? 0 : (this._curLevel - this._initLevel) / capacity;
            this.levelLabel.string = `${this._curLevel}/${this._curMaxLevel}`;
            this.initSlideProgress();
        }
    }

    onClickButtonMinus() {
        let anchor = this._curLevel;
        if (this._curLevel > this._initLevel) {
            let targetLv = anchor - 1;
            let lv = this.calNearestItems(targetLv);
            while (lv == anchor) {
                targetLv -= 1;
                lv = this.calNearestItems(targetLv);
            }
            let capacity = (this._curMaxLevel - this._initLevel) || 0;
            this.levelSlider.progress = capacity == 0 ? 0 : (this._curLevel - this._initLevel) / capacity;
            this.levelLabel.string = `${this._curLevel}/${this._curMaxLevel}`;
            this.initSlideProgress();
        }
    }
    //获取选中Item总经验值
    getTotalExp(itemList: number[]) {
        let expNumber = 0;
        itemList.forEach((id) => {
            let item = this._itemExpList[id];
            let itemMaterial = this.listView.getItemByListId(id);
            let cfg1 = configManager.getConfigByKey("equip", item.ID);
            // 经验材料/装备材料
            if (item.ID === CustomItemId.XUANTIE) {
                let count = this._listSelNumber[id];
                expNumber += XUANTIE_TO_EXP * count;
            }
            else if (cfg1) {
                expNumber += bagDataUtils.getEquipExpProvide(item);
            }
        })
        return expNumber;
    }

    //获取当前材料最多升级的等级
    getMaxLevel() {
        let copyData: data.IBagUnit = utils.deepCopy(this._equipData);
        let expNumber = 0;
        this._itemExpList.forEach((item) => {
            let cfg1 = configManager.getConfigByKey("equip", item.ID);
            // 经验材料/装备材料
            if (item.ID === CustomItemId.XUANTIE) {
                expNumber += XUANTIE_TO_EXP * item.Count;
            }
            else if (cfg1) {
                expNumber += bagDataUtils.getEquipExpProvide(item);
            }
        })
        copyData.EquipUnit.Exp += expNumber;
        let equipCopy = new Equip(copyData);
        return Math.min(equipCopy.getEquipLevel(), bagDataUtils.curEquipMaxLevel);
    }

    calNearestItems(level: number) {
        let itemList: number[] = [];
        let lv = this._initLevel;
        let copyData: data.IBagUnit = utils.deepCopy(this._equipData);
        let equipCfg: cfg.Equip = configUtils.getEquipConfig(copyData.ID);
        //选中数据清空
        this._listSelNumber = Array.from({ length: this._itemExpList.length }, () => 0);
        //不选中任何数据
        if (level == this._initLevel) {
            this._curLevel = level;
            this.listView.setMultSelected(itemList, true);
            this._rootNode.updateEquipDetailInfo(copyData);
            this.updateEnhanceGoldButton(copyData.EquipUnit.Exp - this._equipData.EquipUnit.Exp);
            return level;
        }

        let lvCfg = bagDataUtils.getEquipLVCfg(level, equipCfg.Quality);
        let minNeedExp = lvCfg.minExp - copyData.EquipUnit.Exp;
        for (let i = 0; i < this._itemExpList.length; i++) {
            let item = this._itemExpList[i];
            if (item.ID === CustomItemId.XUANTIE) {
                //经验材料
                itemList.push(i);
                let count = utils.longToNumber(item.Count);
                let needCnt = Math.ceil(minNeedExp / XUANTIE_TO_EXP);
                if(needCnt < count) {
                    lv = level;
                    this._listSelNumber[i] = needCnt;
                    copyData.EquipUnit.Exp += (needCnt *  XUANTIE_TO_EXP);
                    break;
                }

                copyData.EquipUnit.Exp += (count *  XUANTIE_TO_EXP);
                lv = bagDataUtils.getEquipLVByExp(copyData.EquipUnit.Exp, equipCfg.Quality);
                this._listSelNumber[i] = count;
            } else if (configUtils.getEquipConfig(item.ID)) {
                //未穿戴装备
                copyData.EquipUnit.Exp += bagDataUtils.getEquipExpProvide(item);
                lv = bagDataUtils.getEquipLVByExp(copyData.EquipUnit.Exp, equipCfg.Quality);
                itemList.push(i);
                if (lv >= level) {
                    break;
                }
            }
        }

        let addExp = Math.min(this._equip.getEquipMaxExp(), copyData.EquipUnit.Exp) - this._equip.equip.Exp;
        copyData.EquipUnit.Exp = this._equip.equip.Exp + addExp;
        this._rootNode.updateEquipDetailInfo(copyData);
        this.updateEnhanceGoldButton(addExp);
        this._curLevel = lv;
        this.listView.setMultSelected(itemList, true);
        return lv;
    }
   

    //金币展示
    private updateEnhanceGoldButton(addExp?: number) {
        if (!addExp) {
            addExp = this.getTotalExp(this.listView.getMultSelected());
            addExp = Math.min(addExp, this._equip.getEquipMaxExp() - (this._equip.equip.Exp | 0));
        }
        let layout = this.node.getChildByName("layout");
        let txtGold = layout.getComponentInChildren(RichTextEx);
        let haveGold = bagData.gold;
        let needGold = addExp ? addExp * bagDataUtils.getEnhanceGoldMulti() : 0;
        if (needGold <= haveGold) {
            txtGold.string = `${needGold}`;
        } else {
            txtGold.string = `<color=#ff0000>${needGold}</c>`;
        }
        return needGold <= haveGold;
    }
    //筛选按钮
    private onClickFliter(event: cc.Event) {
        this.filterNode.active = !this.filterNode.active;
    }
    //筛选框子选项
    private onClickSubFilter(event: cc.Event) {
        let subBtns = event.target.getChildByName("subBtns");
        let qualityBtn = this.filterNode.getChildByName("qualityBtn");
        let typeBtn = this.filterNode.getChildByName("typeBtn");
        qualityBtn.getChildByName("subBtns").active = false;
        typeBtn.getChildByName("subBtns").active = false;
        subBtns.active = !subBtns.active;
    }
    //筛选品质选项
    private onClickQualityFilter(event: cc.Event, customEventData: string) {
        let subBtns = event.target.parent;
        subBtns.active = false;
        this.filterNode.active = false;
        this._filterQuality = Number(customEventData);
        subBtns.parent.getComponentInChildren(cc.Label).string = event.target.getComponentInChildren(cc.Label).string;
        this.updateMaterialView();
        this.listView.scrollTo(0, 0);
    }
    //筛选类型选项
    private onClickTypeFilter(event: cc.Event, customEventData: string) {
        let subBtns = event.target.parent;
        subBtns.active = false;
        this.filterNode.active = false;
        this._filterType = Number(customEventData);
        subBtns.parent.getComponentInChildren(cc.Label).string = event.target.getComponentInChildren(cc.Label).string;
        this.updateMaterialView();
        this.listView.scrollTo(0, 0);
    }

    private resetFilter() {
        let qualityBtn = this.filterNode.getChildByName("qualityBtn");
        let typeBtn = this.filterNode.getChildByName("typeBtn");
        qualityBtn.getComponentInChildren(cc.Label).string = "品质";
        typeBtn.getComponentInChildren(cc.Label).string = "类型";
        this._filterQuality = null;
        this._filterType = null;
        this.filterNode.active = false;
    }
    
    //发送强化请求
    sendEnhanceRequest() {
        if (this._initLevel == bagDataUtils.equipMaxLevel) {
            guiManager.showDialogTips(CustomDialogId.EQUIP_ENHANCE_LIMIT);
            return;
        }
        if (!this.updateEnhanceGoldButton()) {
            guiManager.showDialogTips(CustomDialogId.EQUIP_ENHANCE_GOLD_NO_ENOUGH);
            return;
        }
        let multSelecArr = this.listView.getMultSelected();
        let enhanceMaterial: data.IBagUnit[] = [];
        let containSR = false;
        multSelecArr.forEach((id) => {
            let bagUnit: data.IBagUnit = utils.deepCopy(this._itemExpList[id]);
            let cfg = configUtils.getEquipConfig(bagUnit.ID);
            if (this._listSelNumber[id]) {
                bagUnit.Count = this._listSelNumber[id];
            }
            containSR ||= (cfg && cfg.Quality && cfg.Quality >= QUALITY_TYPE.SR);
            enhanceMaterial.push(bagUnit);
        })

        enhanceMaterial.forEach(_v=> {
            _v.Count = utils.longToNumber(_v.Count)
        })
        // 使用SR装备作提示
        if (enhanceMaterial.length && containSR){
            guiManager.showMessageBox(this._rootNode.node, {
                content: "强化所用材料包含史诗品阶以上装备，是否继续？",
                leftStr: "取消",
                leftCallback: (msgBox: ViewBaseComponent) => {
                    msgBox.closeView();
                },
                rightStr: "确认",
                rightCallback: (msgBox: ViewBaseComponent) => {
                    msgBox.closeView();
                    bagDataOpt.sendEnhanceEquipRequest(this._equipData, enhanceMaterial);
                }
            })
        } else if (enhanceMaterial.length)
            bagDataOpt.sendEnhanceEquipRequest(this._equipData, enhanceMaterial);
    }
    //强化成功响应
    onEquipEnhanced(event: any, msg: gamesvr.EnhanceEquipmentRes) {
        if (this._equipData.ID == msg.ID && utils.longToNumber(this._equipData.Seq) == utils.longToNumber(msg.Seq)) {
            userData.updateCapability();
            this._equipData.EquipUnit.Exp = msg.Exp;
            this._equip = new Equip(this._equipData);
            this._rootNode.updateEquipData(this._equipData);
            this.initEnhanceView();
            guiManager.showDialogTips(CustomDialogId.EQUIP_ENHANCE_SUCCESS);
            audioManager.playSfx(SFX_TYPE.EQUIP_ENHANCE);
        }
        this.listView.setMultSelected([], true);
        redDotMgr.fire(RED_DOT_MODULE.EQUIP_ENHANCE_TOGGLE);
        redDotMgr.fire(RED_DOT_MODULE.BAG_VIEW_EQUIP_ENHANCE_BTN);
        redDotMgr.fire(RED_DOT_MODULE.EQUIP_ENHANCE_NODE_ENGANCE_BTN);
    }
}
