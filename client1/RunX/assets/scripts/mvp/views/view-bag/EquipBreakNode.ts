
import { resourceManager } from "../../../common/ResourceManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { bagDataEvent } from "../../../common/event/EventData";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { configUtils } from "../../../app/ConfigUtils";
import { utils } from "../../../app/AppUtils";
import { data, gamesvr } from "../../../network/lib/protocol";
import { CustomDialogId, EQUIP_MAX_STAR, VIEW_NAME } from "../../../app/AppConst";
import { bagData } from "../../models/BagData";
import { Equip } from "../../template/Equip";
import { bagDataOpt } from "../../operations/BagDataOpt";
import { audioManager, SFX_TYPE } from "../../../common/AudioManager";
import { userData } from "../../models/UserData";
import { redDotMgr, RED_DOT_MODULE } from "../../../common/RedDotManager";
import RichTextEx from "../../../common/components/rich-text/RichTextEx";
import ItemRedDot from "../view-item/ItemRedDot";
import guiManager from "../../../common/GUIManager";
import EquipEnhanceView from "./EquipEnhanceView";
import moduleUIManager from "../../../common/ModuleUIManager";
import ItemBag from "../view-item/ItemBag";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { bagDataUtils } from "../../../app/BagDataUtils";
import EquipSubViewBase from "./EquipSubViewBase";
import { BagItemInfo, ItemInfo } from "../../../app/AppType";
import { cfg } from "../../../config/config";

export enum PAGE_TYPE { ENHANCE, BREAKTHROUGH, SPIRIT }

const { ccclass, property } = cc._decorator;

@ccclass
export default class EquipBreakNode extends EquipSubViewBase {
    @property(ItemRedDot) brokenItemRedDot: ItemRedDot = null;
    @property(cc.Node) breakButton: cc.Node = null;
    @property(cc.Node) addButton: cc.Node = null;
    @property(sp.Skeleton) addBtnEff: sp.Skeleton = null;
    @property(cc.Node) layout: cc.Node = null;
    @property(cc.Node) limit: cc.Node = null;
    @property(cc.Node) materialContainor: cc.Node = null;

    private _spriteLoader = new SpriteLoader();
    private _equipData: data.IBagUnit = null;
    private _equip: Equip = null;
    private _itemBags: ItemBag[] = [];
    private _rootNode: EquipEnhanceView = null;
    private _haveEnoughMat: boolean = false;
    private _requirItem: data.IBagUnit[] = [];       //升星使用材料
    private _haveEnoughBreakGold: boolean = false;
    private _specialMatCnt: number = 0;           // 升级本次材料的数量
    private _specialMats: data.IBagUnit[] = null; //当前使用特殊材料
    private _materialPool: cc.NodePool = null;  //本体材料池
    private _usedMaterials: cc.Node[] = [];
    private _usedMaterialItems: ItemBag[] = [];   // 作为升星非本体材料的材料


    onInit(equipData: data.IBagUnit, rootNode: EquipEnhanceView) {
        this._equip = new Equip(equipData);
        this._rootNode = rootNode;
        this._equipData = equipData;
        if(!this._materialPool) {
            this._materialPool = new cc.NodePool();
            this._materialPool.put(this.addButton);
        }
        this.registerAllEvent();
        this._updateData();
        this._initUI();
    }

    registerAllEvent() {
        eventCenter.register(bagDataEvent.EQUIP_BROKE, this, this._onEquipBroke);
    }

    deInit() {
        this._equipData = null;
        this._spriteLoader.release();
        this._clearItems();
        this._materialPool.clear();
        eventCenter.unregisterAll(this);
        resourceManager.release("prefab/views/view-bag/item/ItemPropAccess");
    }

    onRelease() {
        this.brokenItemRedDot.deInit();
        this.deInit();
    }

    private _clearItems() {
        this._itemBags.forEach(_i => {
            ItemBagPool.put(_i)
        })
        this._itemBags.length = 0;

        this._usedMaterials.forEach(ele => {
            this._materialPool.put(ele);
        });
        this._usedMaterials.length = 0;
        this._usedMaterialItems.length = 0;
    }

    private _refreshRedDot() {
        this.brokenItemRedDot.setData(RED_DOT_MODULE.EQUIP_BROKEN_BUTTON, {
            args: [this._equipData]
        });
    }

    private _updateData() {
        let equip = this._equip;
        this._requirItem = equip.getBreakMaterial();
        let selfItem = this._requirItem.shift();
        let selfCnt = utils.longToNumber(selfItem.Count || 0);
        this._specialMatCnt = selfCnt;
        this._specialMats = this._specialMats || [];
        this._specialMats.length = this._specialMatCnt;
        for(let i = 0; i < this._specialMatCnt; i++) {
            this._specialMats[i] = null;
        }
    }

    private _initUI() {
        this._initBreakView();
        this._refreshRedDot();
    }

    private _initBreakView() {
        let star = this._equipData.EquipUnit.Star;

        let starNode = this.node.getChildByName("icon_star");
        starNode.children.forEach((child, index) => {
            let starIcon = child.getChildByName("open");
            starIcon.active = index <= star;
            starIcon.stopAllActions();
            starIcon.opacity = 255;
            if (index == star){
                cc.tween(starIcon).to(1.5, { opacity: 255 }, { easing: "sineIn" })
                    .to(1.5, { opacity: 0 }, { easing: "sineOut" }).union().repeatForever().start();
            }
        })
        let emptyNode = this.node.getChildByName("empty");
        // 展示Item
        let eItem: ItemBag = emptyNode.getComponentInChildren(ItemBag);
        if (!eItem) {
            eItem = ItemBagPool.get();
            eItem.node.parent = emptyNode;
            this._itemBags.push(eItem);
        }
        eItem.init({
            id: this._equip.equipData.ID,
            level: this._equip.getEquipLevel(),
            count: this._equip.equipData.Count,
            star: this._equip.equipData.EquipUnit.Star,
        });

        let copyData: data.IBagUnit = utils.deepCopy(this._equipData);
        copyData.EquipUnit.Star = Math.min(star + 1, EQUIP_MAX_STAR);
        this.updateBreakList();
        this._rootNode.updateEquipDetailInfo(copyData);
    }

    updateBreakList() {
        //金币数量刷新
        let haveGold = bagData.gold;
        let needGold = bagDataUtils.getBreakGold(this._equip);
        let goldLabel = this.layout.getChildByName("txt_gold");
        goldLabel.getComponent(RichTextEx).string = needGold <= haveGold ? `${needGold}` : `<color=#ff0000>${needGold}</c>`;
        this._haveEnoughBreakGold = needGold <= haveGold;

        let selfCnt = this._specialMatCnt;
        let totalCnt = selfCnt + this._requirItem.length;

        let startX: number, spaceX = 10;
        // 本体
        for(let i = 0; i < selfCnt; i++) {
            let addNode: cc.Node = null;
            if(i < this._usedMaterials.length) {
                addNode = this._usedMaterials[i];
            } else {
                addNode = this._getMaterialNode();
                this._usedMaterials.push(addNode);
            }
            if(typeof startX == 'undefined') {
                let totalW = 0;
                if(totalCnt != selfCnt) {
                  let item = ItemBagPool.get();
                  totalW += item.node.width * (totalCnt - selfCnt);
                  ItemBagPool.put(item);
                }
                totalW += (addNode.width) * selfCnt + (totalCnt - 1) * spaceX;
                startX = -(totalW >> 1)
            }
            addNode.setPosition(startX + (addNode.width >> 1), 0);
            addNode.parent = this.materialContainor;
            startX+= addNode.width + spaceX;
            this._updateSpeMatial(addNode, i);
        }

        if(selfCnt < this._usedMaterials.length) {
            for(let i = this._usedMaterials.length - 1; i >=  selfCnt; i--) {
                this._materialPool.put(this._usedMaterials[i]);
                this._usedMaterials.length -= 1;
            }
        }

        // 其他材料
        for(let i= 0, len = this._requirItem.length; i < len; i++) {
            let item: ItemBag = null;
            if(i < this._usedMaterialItems.length) {
                item = this._usedMaterialItems[i];
            } else {
                item = ItemBagPool.get();
                this._usedMaterialItems.push(item);
                this._itemBags.push(item);
            }

            if(typeof startX == 'undefined') {
                let totalW = item.node.width * len + (len - 1) * spaceX;
                startX = -(totalW >> 1);
            }
            item.node.setPosition(startX + (item.node.width >> 1), 0);
            item.node.parent = this.materialContainor;
            startX += item.node.width + spaceX;
            this._updateMaterial(item, {itemId: this._requirItem[i].ID, num: utils.longToNumber(this._requirItem[i].Count)}, true);
        }

        if(this._requirItem.length < this._usedMaterialItems.length) {
            for(let i = this._usedMaterialItems.length - 1; i >= this._requirItem.length; i--) {
                let item = this._usedMaterialItems[i];
                this._usedMaterialItems.length -= 1;
                utils.arrayFastRemoveEle(this._itemBags, item);
                ItemBagPool.put(this._usedMaterialItems[i]);
            }
        }

        // 按钮切换
        this.limit.active = this._equip.equip.Star == EQUIP_MAX_STAR;
        this.layout.active = this._equip.equip.Star != EQUIP_MAX_STAR;
        this.breakButton.active = this._equip.equip.Star != EQUIP_MAX_STAR;
    }

    private _changeSpecialMat(itemData: data.IBagUnit, node: cc.Node, idx: number) {
        if(!cc.isValid(node) || !itemData) return;

        this._specialMats[idx] = utils.deepCopy(itemData);
        let addIcon = node.getChildByName("iconAdd");
        let emptyNode = node.getChildByName('empty');
        let effectNode = node.getChildByName('effect_tupo');
        addIcon.active = effectNode.active = false;
        emptyNode.active = true;

        let item: ItemBag = null
        if (emptyNode.childrenCount > 0) {
            item = emptyNode.children[0].getComponent(ItemBag);
        } else {
            item = ItemBagPool.get();
            item.node.parent = emptyNode;
            this._itemBags.push(item);
        }

        let cfg = configUtils.getItemConfig(itemData.ID);
        if (cfg) {
            item.init({
                id: itemData.ID,
                count: 0,
            });
            return;
        }
        let cfg1 = configUtils.getEquipConfig(itemData.ID);
        if(cfg1) {
            let equipLevel = bagDataUtils.getEquipLVByExp(itemData.EquipUnit.Exp, cfg1.Quality);
            item.init({
                id: itemData.ID,
                count: 0,
                level: equipLevel,
                star: itemData.EquipUnit.Star,
            });
        }
    }

    private _updateSpeMatial(node: cc.Node, idx: number) {
        if(!cc.isValid(node) || idx < 0 || idx >= this._specialMatCnt) return;

        let bagUnit = this._specialMats[idx];
        let effectNode = node.getChildByName('effect_tupo');
        let emptyNode = node.getChildByName('empty');
        let addNode = node.getChildByName('iconAdd');
        if(!bagUnit) {
            effectNode.active = addNode.active =  true;
            emptyNode.active = false;
            return;
        }

        effectNode.active = addNode.active =  false;
        emptyNode.active = true;
        let itemBag: ItemBag = null;
        if(emptyNode.childrenCount > 0) {
            itemBag = emptyNode.children[0].getComponent(ItemBag);
        } else {
            itemBag = ItemBagPool.get();
            itemBag.node.setPosition(0, 0);
            itemBag.node.parent = emptyNode;
            this._itemBags.push(itemBag);
        }
        itemBag.init({id: bagUnit.ID});
    }

    private _updateMaterial(item: ItemBag, itemInfo: ItemInfo, isClickable: boolean = false) {
        let cfg = configUtils.getItemConfig(itemInfo.itemId);
        let itemScript = item;
        if(!cfg) return;

        let needCount = itemInfo.num;
        let haveCount = bagData.getItemCountByID(itemInfo.itemId) || 0;
        if (haveCount < needCount) {
            this._haveEnoughMat = false;
            itemScript.init({
                id: itemInfo.itemId,
                count: 0,
                isMat: true,
                richTxt: `<color=#ff0000>${haveCount}</c>/${needCount}`,
                clickHandler: (itemInfo: BagItemInfo) => {
                    if(!isClickable) return;
                    moduleUIManager.showItemDetailInfo(itemInfo.id, 0, this._rootNode.node);
                }
            })
        } else {
            this._haveEnoughMat = true;
            itemScript.init({
                id: itemInfo.itemId,
                count: 0,
                isMat: true,
                richTxt: `<color=#ffffff>${haveCount}</c>/${needCount}`,
                clickHandler: (itemInfo: BagItemInfo) => {
                    if(!isClickable) return;
                    moduleUIManager.showItemDetailInfo(itemInfo.id, 0, this._rootNode.node);
                }
            });
        }
    }

    //特殊突破材料
    onClickBreakMatSpecial(event: cc.Event.EventTouch) {
        let mats = this._getSpecialMats();
        if (!mats || mats.length == 0) {
            guiManager.showDialogTips(CustomDialogId.EQUIP_BREAK_MAT_NO_AVALIABLE);
            return;
        }

        let parent = event.target.parent;
        guiManager.loadModuleView(VIEW_NAME.EQUIP_BREAK_MATERIAL, this._equipData, mats, (eData: data.IBagUnit) => {
            if(!eData) return;
            let idx = this._usedMaterials.indexOf(parent);
            this._changeSpecialMat(eData, parent, idx);
        });
    }

    //突破请求
    sendBreakReq() {
        let equip = this._equip;

        // 满星
        if (equip.equip.Star == EQUIP_MAX_STAR) {
            guiManager.showDialogTips(CustomDialogId.EQUIP_BREAK_MATCH_LIMIT);
            return;
        }

        // 金币不足
        if (!this._haveEnoughBreakGold) {
            guiManager.showDialogTips(CustomDialogId.EQUIP_BREAK_GOLD_NO_ENOUGH);
            return;
        }

        let selfCnt = 0;
        let speItems: any = {};
        let itemList: data.IBagUnit[] = [];
        this._specialMats.forEach((ele, idx) => {
            if(!ele) return;
            ele && (selfCnt += 1);
            // 万能材料
            if(!ele.EquipUnit) {
                if(!speItems.hasOwnProperty(`${ele.ID}`)) {
                    ele.Count = 1;
                    speItems[`${ele.ID}`] = ele;
                } else {
                    speItems[`${ele.ID}`].Count += 1;
                }
            } else {
                itemList.push(ele);
            }
        });

        //材料不足
        if ( selfCnt < this._specialMatCnt || !this._haveEnoughMat) {
            guiManager.showDialogTips(CustomDialogId.EQUIP_BREAK_MAT_NO_ENOUGH);
            return;
        }

        for(let k in speItems) {
            if(!speItems.hasOwnProperty(k)) continue;
            itemList.push(speItems[k]);
        }

        itemList.splice(itemList.length, 0, ...this._requirItem);
        bagDataOpt.sendBreakEquipRequest(this._equipData, itemList);
    }

    //突破成功响应
    private _onEquipBroke(event: any, msg: gamesvr.BreakEquipmentRes) {
        if(this._equipData.ID != msg.ID || utils.longToNumber(this._equipData.Seq) != utils.longToNumber(msg.Seq)) return;
        userData.updateCapability();
        this._equipData.EquipUnit.Star = msg.Star;
        this._equip = new Equip(this._equipData);
        this._updateData();
        this._rootNode.updateEquipData(this._equipData);
        this._rootNode.updateEquipDetailInfo();
        this._initBreakView();
        guiManager.showDialogTips(CustomDialogId.EQUIP_BREAK_SUCCESS);
        audioManager.playSfx(SFX_TYPE.EQUIO_BROKE);
        redDotMgr.fire(RED_DOT_MODULE.EQUIP_BROKEN_BUTTON);
        redDotMgr.fire(RED_DOT_MODULE.EQUIP_BROKEN_TOGGLE);
        redDotMgr.fire(RED_DOT_MODULE.BAG_VIEW_EQUIP_BREAK_BTN);
    }

    private _getMaterialNode() {
        let node: cc.Node = null;
        if(this._materialPool.size() > 0) {
            node = this._materialPool.get();
        } else {
            node = cc.instantiate(this.addButton);
            let emptyNode = node.getChildByName('empty');
            if(emptyNode.childrenCount > 0) {
                this._itemBags.push(emptyNode.getComponent(ItemBag));
            }
        }
        node.active = true;
        return node;
    }

    // 获取升星材料
    private _getSpecialMats(): data.IBagUnit[] {
        let mats = this._equip.getBreakSpecialMaterial();
        if(!mats || mats.length == 0) return mats;

        // 过滤已经选中的突破材料
        let seleEquips: any = {};
        let seleItems: any ={};
        if(this._specialMats) {
            this._specialMats.forEach(ele => {
                if(!ele) return;
                let equipCfg: cfg.Equip = configUtils.getEquipConfig(ele.ID);
                if(equipCfg && ele.EquipUnit) {
                    seleEquips[`${ele.ID}_${utils.longToNumber(ele.Seq)}`] = 1;
                    return;
                }
                seleItems[`${ele.ID}`] = seleItems[`${ele.ID}`] || 0;
                seleItems[`${ele.ID}`] += 1;
            });
        }

        for(let i = 0, len = mats.length; i < len; i++) {
            let bagUnit = mats[i];
            let isEquip = !!(bagUnit.EquipUnit);
            if(isEquip && seleEquips[`${bagUnit.ID}_${bagUnit.Seq}`]) {
                mats.splice(i, 1);
                i -= 1, len -= 1;
            } else {
                let surplusCnt = utils.longToNumber(bagUnit.Count) -  (seleItems[`${bagUnit.ID}`] || 0);
                if(surplusCnt <= 0) {
                    mats.splice(i, 1);
                    i -= 1, len -= 1;
                } else {
                    mats[i] = utils.deepCopy(bagUnit);
                    mats[i].Count = surplusCnt;
                }
            }
        }
        return mats;
    }
}
