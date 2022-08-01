import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { resourceManager } from "../../../common/ResourceManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { configUtils } from "../../../app/ConfigUtils";
import { data } from "../../../network/lib/protocol";
import { EQUIP_MAX_STAR } from "../../../app/AppConst";
import { Equip } from "../../template/Equip";
import { RED_DOT_MODULE } from "../../../common/RedDotManager";
import { utils } from "../../../app/AppUtils";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { bagDataUtils } from "../../../app/BagDataUtils";
import ItemBag from "../view-item/ItemBag";
import EquipDetailTmp from "./EquipDetailTmp";
import ItemRedDot from "../view-item/ItemRedDot";
import guiManager from "../../../common/GUIManager";
import EquipSpiritNode from "./EquipSpiritNode";
import EquipBreakNode from "./EquipBreakNode";
import EquipEnhanceNode from "./EquipEnhanceNode";
import EquipSubViewBase from "./EquipSubViewBase";

export enum PAGE_TYPE { ENHANCE, BREAKTHROUGH, SPIRIT }
const { ccclass, property } = cc._decorator;

@ccclass
export default class EquipEnhanceView extends ViewBaseComponent {
    @property(cc.Node) equipPropPage: cc.Node = null;                       //装备属性页面
    @property(cc.Node) equipDetailPage: cc.Node = null;                     //装备详情页
    @property([cc.Toggle]) navButton: cc.Toggle[] = new Array<cc.Toggle>(); //导航按钮
    @property([cc.Prefab]) subNode: cc.Prefab[] = new Array<cc.Prefab>();      //分页

    @property(cc.Node) bubbleGreen: cc.Node = null;
    @property(cc.Node) bubbleYellow: cc.Node = null;
    @property(cc.Node) emptyNode: cc.Node = null;
    @property(cc.Label) title: cc.Label = null;
    @property(ItemRedDot) brokenToggleRedDot: ItemRedDot = null;
    @property(ItemRedDot) enchanceToggleRedDot: ItemRedDot = null;
    @property(ItemRedDot) splitToggleRedDot: ItemRedDot = null;

    private _moduleId: number = 0;
    private _curPageType: PAGE_TYPE = null;
    private _spriteLoader = new SpriteLoader();
    private _equipData: data.IBagUnit = null;
    private _equip: Equip = null;
    //强化装备使用数据
    private _initLevel: number = null;                          //装备当前等级
    private _coinNode: cc.Node = null;
    private _itemBags: ItemBag[] = [];

    onInit(moduleId: number, page: PAGE_TYPE, sId:number, equipData: data.IBagUnit) {
        this._moduleId = moduleId;
        this._equip = new Equip(equipData);
        this._equipData = equipData;
        this._equipData.EquipUnit.Exp = equipData.EquipUnit.Exp || 0;
        this._coinNode = guiManager.addCoinNode(this.node);
        this.refreshNavNode();
        this._updateRedDots();
        //初始选中装备强化
        if (page == PAGE_TYPE.ENHANCE) {
            this.onClickEnhance();
        } else if (page == PAGE_TYPE.BREAKTHROUGH) {
            this.onClickBreakthrough();
        } else if (page == PAGE_TYPE.SPIRIT && this.navButton[PAGE_TYPE.SPIRIT].node.active) {
            this.onClickSpirit();
        }
    }

    private _updateRedDots(){
        this.enchanceToggleRedDot.setData(RED_DOT_MODULE.EQUIP_ENHANCE_TOGGLE, {
            args: [this._equipData]
        });

        this.brokenToggleRedDot.setData(RED_DOT_MODULE.EQUIP_BROKEN_TOGGLE, {
            args: [this._equipData]
        });
        
        this.splitToggleRedDot.setData(RED_DOT_MODULE.EQUIP_SPIRIT_TOGGLE, {
            args: [this._equipData]
        });
    }

    deInit() {
        this._equipData = null;
        this.releaseSubView();
        this._clearItems();
        this._spriteLoader.release();
        eventCenter.unregisterAll(this);
        resourceManager.release("prefab/views/view-bag/item/ItemPropAccess");
    }

    onRelease() {
        this.brokenToggleRedDot.deInit();
        this.enchanceToggleRedDot.deInit();
        this.splitToggleRedDot.deInit();
        guiManager.removeCoinNode(this.node);
        this._coinNode = null
        this.deInit();
    }

    private _clearItems() {
        this._itemBags.forEach(_i => {
            _i.node.removeFromParent();
            _i.deInit();
            ItemBagPool.put(_i)
        })
        this._itemBags = [];
    }
    
    onRefresh(){
        let subView = this.emptyNode.getComponentInChildren(EquipSubViewBase);
        subView && subView.onRefresh();
    }

    refreshNavNode(){
        // N卡装备、专属无铸魂功能
        this.navButton[PAGE_TYPE.SPIRIT].node.active = bagDataUtils.checkEquipCastSoul(this._equip);
        //专属装备不能强化
         this.navButton[PAGE_TYPE.ENHANCE].node.active = !this._equip.isExclusive();
    }

    onClickEnhance(event?: cc.Event) {
        if (this._curPageType == PAGE_TYPE.ENHANCE) return;
        this.navButton[PAGE_TYPE.ENHANCE].isChecked = true;
        this._curPageType = PAGE_TYPE.ENHANCE;
        // 更新货币组件
        this._coinNode.getComponent("CoinNode").init(this._moduleId, this._curPageType);
        // 添加节点
        let enhanceNode = cc.instantiate(this.subNode[PAGE_TYPE.ENHANCE]);
        let emptyChild = [...this.emptyNode.children]
        emptyChild.forEach(child=>{
            let viewComp  = child.getComponent(EquipSubViewBase);
            //@ts-ignore
            viewComp.onRelease();
            viewComp.node.destroy();
        })

        this.title.string = "强化";
        enhanceNode.parent = this.emptyNode;
        enhanceNode.getComponent(EquipEnhanceNode).onInit(utils.deepCopy(this._equipData), this);
    }

    onClickBreakthrough(event?: cc.Event) {
        if (this._curPageType == PAGE_TYPE.BREAKTHROUGH) return;
        this.navButton[PAGE_TYPE.BREAKTHROUGH].isChecked = true;
        this._curPageType = PAGE_TYPE.BREAKTHROUGH;
        // 更新货币组件
        this._coinNode.getComponent("CoinNode").init(this._moduleId, this._curPageType);
        // 添加节点
        let breakNode = cc.instantiate(this.subNode[PAGE_TYPE.BREAKTHROUGH]);
        let emptyChild = [...this.emptyNode.children]
        emptyChild.forEach(child => {
            let viewComp = child.getComponent(EquipSubViewBase);
            viewComp.onRelease();
            viewComp.node.destroy();
        })

        this.title.string = "突破";
        breakNode.parent = this.emptyNode;
        breakNode.getComponent(EquipBreakNode).onInit(utils.deepCopy(this._equipData), this);
    }


    onClickSpirit(event?: cc.Event) {
        if (this._curPageType == PAGE_TYPE.SPIRIT) return;
        this.navButton[PAGE_TYPE.SPIRIT].isChecked = true;
        this._curPageType = PAGE_TYPE.SPIRIT;
        this.updateEquipDetailInfo();
        // 更新货币组件
        this._coinNode.getComponent("CoinNode").init(this._moduleId, this._curPageType);
        let spiritNode = cc.instantiate(this.subNode[PAGE_TYPE.SPIRIT]);
        let emptyChild = [...this.emptyNode.children]
        emptyChild.forEach(child => {
            let viewComp = child.getComponent(EquipSubViewBase);
            viewComp.onRelease();
            viewComp.node.destroy();
        })

        this.title.string = "铸魂";
        spiritNode.parent = this.emptyNode;
        spiritNode.getComponent(EquipSpiritNode).onInit(utils.deepCopy(this._equipData), this);
    }

    
    //更新装备详细信息
    public updateEquipDetailInfo(newEquipData?: data.IBagUnit) {
        let page = this.equipDetailPage;
        let equip = this._equip;
        let equipData = equip.equipData;
        let star = equipData.EquipUnit.Star;
        let config = configUtils.getEquipConfig(equipData.ID);
        let equipLevel = equip.getEquipLevel();
        let equipMaxLevel = bagDataUtils.curEquipMaxLevel;
        let equipMaxExp = equip.getEquipCurMaxExp();
        let equipCurExp = equip.getEquipCurExp();
        let equipProp = equip.getEquipDetailInfo(equipLevel);
        let equipNode: EquipDetailTmp = page.getComponent("EquipDetailTmp");
        //基础装备信息
        let emptyNode = page.getChildByName("empty");
        let eItem: ItemBag = emptyNode.getComponentInChildren(ItemBag);
        if (!eItem) {
            eItem = ItemBagPool.get();
            eItem.node.parent = emptyNode;
            this._itemBags.push(eItem);
        }
        eItem.init({
            id: equip.equipData.ID,
            count: equip.equipData.Count,
            level: equip.getEquipLevel(),
            star: equip.equipData.EquipUnit.Star,
        });

        equipNode.eName.string = config.EquipName || '';
        this.equipPropPage.getComponent("EquipProps").equipData = this._equipData;

        let isExclusive = this._equip.isExclusive();
        //专属装备没有升级，只有升星
        equipNode.eGrade.node.active = !isExclusive;
        equipNode.eExp.node.active = !isExclusive;
        equipNode.eExpP.node.active = !isExclusive;

        //装备升级或装备升星
        if (newEquipData && (newEquipData.EquipUnit.Exp != equipData.EquipUnit.Exp || newEquipData.EquipUnit.Star != equipData.EquipUnit.Star)) {
            let starNew = newEquipData.EquipUnit.Star;
            let newEquip = new Equip(newEquipData);
            let equipMaxLevelNew = bagDataUtils.curEquipMaxLevel;
            let equipLevelNew = newEquip.getEquipLevel();
            let equipMaxExpNew = newEquip.getEquipCurMaxExp();
            let equipCurExpNew = newEquip.getEquipCurExp();
            let equipPropNew = newEquip.getEquipDetailInfo(equipLevelNew);

            //专属装备没有升级，只有升星
            if(!isExclusive){
                if (starNew != star) {
                    equipNode.eGrade.string = `等级：${equipLevel}/${equipMaxLevel} -> <color=#e9822d>${equipMaxLevelNew}</c>`;
                    equipNode.eExpP.progress = equipCurExp / equipMaxExp;
                    equipNode.eExp.string = `经验：${equipCurExp}/${equipMaxExp}`;
                }
                //不存在突破和强化同时出现的情况
                else {
                    equipNode.eGrade.string = `${equipLevel} -> <color=#e9822d>${equipLevelNew}</c>/${equipMaxLevel}`;
                    equipNode.eExp.string = `${equipCurExp} -> <color=#e9822d>${equipCurExpNew}</c>/${equipMaxExpNew}`;
                    equipNode.eExpP.progress = equipCurExpNew / equipMaxExpNew;
                }
                //如果已经满级
                if (equipLevelNew == equipMaxLevel) {
                    equipNode.eExp.string = `满级`;
                    equipNode.eExpP.progress = 1;
                }
            }

            //装备属性提示
            let parseRes = utils.parseStingList(configUtils.getEquipConfig(newEquipData.ID).GreenId);
            let index = newEquip.getIndexOfGreenID();
            let nextLevel = bagDataUtils.equipMaxLevel;
            let isTop: boolean = false;
            if (parseRes.length > 0 && index >= 0) {
                isTop = index === parseRes.length-1;
                nextLevel = index < parseRes.length-1 ? Number(parseRes[index+1][0]) : Number(parseRes[index][0]);
            }

            this.bubbleGreen.parent.active = Boolean(equipPropNew.green) && this._curPageType == PAGE_TYPE.ENHANCE;
            this.bubbleGreen.active = !isTop;
            this.bubbleYellow.parent.active = Boolean(equipPropNew.yellow) && this._curPageType == PAGE_TYPE.BREAKTHROUGH;
            this.bubbleYellow.active = starNew != EQUIP_MAX_STAR;
            this.bubbleGreen.getComponentInChildren(cc.Label).string = `强化至${nextLevel}级可提升`;
            this.bubbleYellow.getComponentInChildren(cc.Label).string = `突破至${star + 1}星可提升`;
            //真实等级小于10，强化等级>10的情况
            this.equipPropPage.getComponent("EquipProps").updateInfo(equipProp, equipPropNew);
        } else {

            //专属装备没有升级，只有升星
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
            
            this.bubbleGreen.parent.active = Boolean(equipProp.green) && this._curPageType == PAGE_TYPE.ENHANCE;
            this.bubbleGreen.active = !isTop;
            this.bubbleYellow.parent.active = Boolean(equipProp.yellow) && this._curPageType == PAGE_TYPE.BREAKTHROUGH;
            this.bubbleYellow.active = this._equipData.EquipUnit.Star != EQUIP_MAX_STAR;
            this.bubbleGreen.getComponentInChildren(cc.Label).string = `强化至${nextLevel}级可提升`;
            this.bubbleYellow.getComponentInChildren(cc.Label).string = `突破至${star + 1}星可提升`;
            this.equipPropPage.getComponent("EquipProps").updateInfo(equipProp);
        }
        this.equipPropPage.getComponent("EquipProps").showCastSoulProps(equipData);
        this._spriteLoader.changeSprite(equipNode.eType, equip.getEquipTextureIcon());
        this._spriteLoader.changeSprite(equipNode.ePart, equip.getEquipPositionIcon());
    }

    updateEquipData(equipData: data.IBagUnit){
        if (equipData) {
            this._equipData = utils.deepCopy(equipData);
            this._equip.setData(this._equipData);
            this.updateEquipDetailInfo();
        }
    }

    closeView(){
        // 子页面销毁
        let emptyChild = [...this.emptyNode.children]
        emptyChild.forEach(
            child => {
                let viewComp = child.getComponent(EquipSubViewBase);
                //@ts-ignore
                viewComp.onRelease();
                viewComp.node.destroy();
            }
        )
        super.closeView();
    }
}
