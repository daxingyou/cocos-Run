import { CHARACTER_VIEW_TYPE } from "../../../app/AppEnums";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import List from "../../../common/components/List";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { taskEvent } from "../../../common/event/EventData";
import { logger } from "../../../common/log/Logger";
import { redDotMgr, RED_DOT_DATA_TYPE, RED_DOT_MODULE, RED_DOT_TYPE } from "../../../common/RedDotManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { cfg } from "../../../config/config";
import { bagData } from "../../models/BagData";
import { taskData } from "../../models/TaskData";
import ItemBag from "../view-item/ItemBag";
import ItemTreasureTask from "./ItemTreasureTask";

const {ccclass, property} = cc._decorator;

const TreasureMaxLv = 6;

@ccclass
export default class TreasureView extends ViewBaseComponent {
    @property(cc.Node) infosNode: cc.Node = null;
    @property(cc.Node) nullTips: cc.Node = null;
    @property(cc.Label) nameLB: cc.Label = null;
    @property(cc.Label) lvLB: cc.Label = null;
    @property(cc.Label) descLB: cc.Label = null;
    @property(cc.Label) upgradeTips: cc.Label = null;
    @property(cc.Node) jumpBtn: cc.Node = null;
    @property(List) treasureList: List = null;
    @property(cc.Node) treasureParent: cc.Node = null;
    @property(cc.Label) treasureName: cc.Label = null;
    @property(ItemTreasureTask) treasureTask: ItemTreasureTask = null;
    @property(cc.Node) tipNode: cc.Node = null;

    private _leadTreasureList: cfg.LeadTreasure[] = [];
    private _jumpFunc: Function = null;
    private _currTreasure: any = null;

    onInit(jumpFunc: Function) {
        this._initEvents();
        jumpFunc && (this._jumpFunc = jumpFunc);
        this._dueData();
    }

    private _initEvents(){
        eventCenter.register(taskEvent.TREASURE_ACHIEVE_COUNT_NTY, this, this._onTreasureAchieveCountNty);
    }

    onRelease() {
        cc.Tween.stopAllByTarget(this.tipNode);
        eventCenter.unregisterAll(this);
        this._currTreasure = null;
        this.treasureList._deInit();
        let children = [...this.treasureParent.children];
        children.forEach(_c => {
            _c.removeFromParent();
            ItemBagPool.put(_c.getComponent(ItemBag));
        });
    }

    private _onTreasureAchieveCountNty(){
        this._dueData();
    }

    refreshView() {
        this._dueData();
    }

    private _dueData() {
        this._leadTreasureList = bagData.getTreasures();
        this._refreshView();
    }

    private _refreshView() {
        let isNull: boolean = this._leadTreasureList.length <= 0;
        this.nullTips.active = isNull;
        this.infosNode.active = !isNull;
        this.treasureList.numItems = this._leadTreasureList.length;
        let seleIdx = this._getCurrSeleIdx();
        let lastSeleIdx = this.treasureList.selectedId;
        let realSeleIdx = Math.max(0, seleIdx);
        this.treasureList.selectedId = realSeleIdx;
        this.treasureList.scrollTo(realSeleIdx);

        //已经存在选中项并且和上次选中项相同时，更新选中项详情（因为滚动组件手动设置同一个选中项时，内部不会多次触发选中事件）
        if(lastSeleIdx == realSeleIdx){
            this._currTreasure = this._currTreasure || (realSeleIdx < this._leadTreasureList.length ? this._leadTreasureList[realSeleIdx] : null);
            this._refreshInfoView();
            this._refreshRedDots();
        }

        cc.Tween.stopAllByTarget(this.tipNode);
        this.tipNode.active = false;
    }

    private _getCurrSeleIdx(){
        if(!this._currTreasure || !this._leadTreasureList || this._leadTreasureList.length == 0) return -1;
        let seleIdx = -1;
        this._leadTreasureList.some((ele, idx) => {
            if(ele.ItemID == this._currTreasure.ItemID){
                seleIdx = idx;
                return true;
            }
            return false;
        });
        return seleIdx;
    }

    onItemTreasureRender(item: cc.Node, index: number) {
        let treasure = this._leadTreasureList[index];
        let itemBagCmp = item.getComponent(ItemBag);
        itemBagCmp.init({
            id: treasure.ItemID,
            level: this._getTreasureLv(treasure)
        });
        let bagItem = bagData.getItemByID(treasure.ItemID);
            if(bagItem) {
                itemBagCmp.setRedDotData(RED_DOT_MODULE.BAG_ITEM_TREASURE, {
                    subName: `${bagItem.Array[0].ID}-${bagItem.Array[0].Seq}`,
                    redDotType: RED_DOT_TYPE.NEW,
                    args: [bagItem.Array[0]]
                });
            }
    }

    onItemTreasureSelect(item: cc.Node, index: number) {
        let treasure = this._leadTreasureList[index];
        if(!treasure || this._currTreasure == treasure) return;
        this._currTreasure = treasure;
        this._refreshInfoView();
        this._refreshRedDots();
    }

    private _refreshRedDots(){
        let treasureCfg = this._currTreasure;
        if(!treasureCfg) return;
        const bagItem = bagData.getItemByID(treasureCfg.ItemID);
        if(!bagItem) return;

        redDotMgr.clearNewData(RED_DOT_DATA_TYPE.TREASURE, bagItem.Array[0]);
        redDotMgr.fire(RED_DOT_MODULE.TREASURE_TOGGLE);
        redDotMgr.fire(RED_DOT_MODULE.BAG_ITEM_TREASURE, `${bagItem.Array[0].ID}-${bagItem.Array[0].Seq}`);
    }

    private _refreshInfoView() {
        let treasureCfg = this._currTreasure;
        if(!treasureCfg) return;
        let itemCfg: cfg.Item = configUtils.getItemConfig(treasureCfg.ItemID);
        if(!itemCfg) {
            logger.warn(`TreasureView _refreshInfoView itemCfg notFind ${treasureCfg.ItemID}`);
            return;
        }
        let treasureItem = this.treasureParent.children[0];
        let treasureCmp = null;
        if(!treasureItem) {
            treasureCmp = ItemBagPool.get();
            this.treasureParent.addChild(treasureCmp.node);
        } else {
            treasureCmp = treasureItem.getComponent(ItemBag);
        }
        treasureCmp.init({
            id: treasureCfg.ItemID
        });
        this.treasureName.string = `${itemCfg.ItemName}`;

        const treasureLv = this._getTreasureLv(treasureCfg);
        const treasureMaxLv = this._getTreasureMaxLv(treasureCfg);
        const isMax = treasureLv >= treasureMaxLv;
        this.infosNode.opacity = 255;
        this.nameLB.string = `${itemCfg.ItemName}`;
        this.lvLB.string = `${isMax ? '满' : treasureLv}级`;
        this.descLB.string = this._getDesc(treasureLv) || '';
        this.jumpBtn.active = !isMax;
        this.upgradeTips.node.opacity = isMax ? 0 : 255;
        this.treasureTask.init(treasureCfg.ItemID);
    }

    onTipClicked(){
        this._showTipNode();
    }

    private _showTipNode(){
        if(this.tipNode.active) return;
        this.tipNode.scale = 0;
        this.tipNode.active = true;
        cc.Tween.stopAllByTarget(this.tipNode);
        cc.tween(this.tipNode).to(0.2, {scale: 1}, {easing: 'elasticOut'}).delay(3).to(0.2, {scale: 0}, {easing: 'elasticIn'}).call(() => {
            this.tipNode.active = false;
        }, this).start();
    }

    private _getDesc(level: number): string{
        let treasureCfg: cfg.LeadTreasure = this._currTreasure;
        if(!treasureCfg) return null;

        let intro = treasureCfg.Introduce;
        if(!intro) return null;

        let treasureProp = bagData.treasureProp.get(treasureCfg.ItemID);
        let finishTimes = treasureProp.taskCurProgress;

        let reg = /\%d11/g;
        if(intro.match(reg)){
            let replaceCfg = treasureCfg.FixedAttributeValue1;
            if(replaceCfg && replaceCfg.length > 0){
                let attrArr = treasureProp.fixAttr1Values;
                intro = intro.replace(reg, `${attrArr[level - 1]}`);
            }
        }

        reg = /\%d12/g;
        if(intro.match(reg)){
            let replaceCfg = treasureCfg.FixedAttributeValue2;
            let valueType = 1;
            if(treasureCfg.FixedAttributeID2){
               let attrID = treasureCfg.FixedAttributeID2;
               let attrCfg = configUtils.getAttributeConfig(attrID);
               attrCfg && (valueType = attrCfg.AttributeValueType);
            }

            if(replaceCfg && replaceCfg.length > 0){
                let attrArr = treasureProp.fixAttr2Values;
                let value:number|string =  attrArr[level - 1];
                //百分比数值
                if(valueType == 2){
                    value = `${value / 100}%`;
                }
                intro = intro.replace(reg, `${value}`);
            }
        }

        reg = /\%d2\*\%N/g;
        if(intro.match(reg)){
            let replaceCfg = treasureCfg.AttributeConditionValue;
            if(replaceCfg && replaceCfg.length > 0){
                let attrArr = utils.parseStringTo1Arr(replaceCfg);
                intro = intro.replace(reg, `${parseFloat(attrArr[level - 1]) * finishTimes}`);
            }
        }

        reg = /\%d2/g;
        if(intro.match(reg)){
          let replaceCfg = treasureCfg.AttributeConditionValue;
            if(replaceCfg && replaceCfg.length > 0){
                let attrArr = treasureProp.addOnAttrValues;
                intro = intro.replace(reg, `${attrArr[level - 1]}`);
            }
        }

        reg = /\%N\/\%d3/g;
        if(intro.match(reg)){
            let curNum: number = bagData.convertUnitOfTreasureTaskNumByConditionType(treasureProp.taskCurNum, treasureCfg.ConditionID);
            let replaceCfg = treasureProp.taskMaxCount * treasureProp.taskPerStepNeedNum;
            replaceCfg = bagData.convertUnitOfTreasureTaskNumByConditionType(replaceCfg, treasureCfg.ConditionID);
            intro = intro.replace(reg, `${curNum}/${replaceCfg}`);
        }

        reg = /\%d3/g;
        if(intro.match(reg)){
            let replaceCfg = treasureCfg.AttributeConditionMax;
            intro = intro.replace(reg, `${replaceCfg}`);
        }

        reg = /\%d4/g;
        if(intro.match(reg)){
            let replaceCfg = treasureCfg.SystemPowerFactor;
            let attrArr: string[] = null;
            if(replaceCfg){
                attrArr = utils.parseStringTo1Arr(replaceCfg);
            }

            if(attrArr){
                intro = intro.replace(reg, `${(level > attrArr.length) ? parseFloat(attrArr[attrArr.length - 1]) : parseFloat(attrArr[level - 1])}`);
            }
        }

        reg = /\%p4/g;
        if(intro.match(reg)){
            let replaceCfg = treasureCfg.SystemPowerFactor;
            let attrArr: string[] = null;
            if(replaceCfg){
                attrArr = utils.parseStringTo1Arr(replaceCfg);
            }

            if(attrArr){
                intro = intro.replace(reg, `${(level > attrArr.length) ? parseFloat(attrArr[attrArr.length - 1]) / 100 : parseFloat(attrArr[level - 1]) / 100}%`);
            }
        }

        reg = /\%M/g;
        if(intro.match(reg)){
            let replaceCfg = treasureCfg.SystemPowerFactor;
            if(!replaceCfg || replaceCfg.indexOf('|') == -1) {
                intro = intro.replace(reg, `满`);
            }else{
                intro = intro.replace(reg, `${level >= TreasureMaxLv ? '满' : level}`);
            }
        }

        reg = /\%L/g;
        if(intro.match(reg)){
            intro = intro.replace(reg, `${level >= TreasureMaxLv ? '满' : level}`);
        }

        return intro;
    }

    onClickJumpToRefiner() {
        if(this._jumpFunc) {
            this._jumpFunc(CHARACTER_VIEW_TYPE.SMELT);
        }
    }

    private _getTreasureLv(treasureCfg: cfg.LeadTreasure): number {
        let treasureProp = bagData.treasureProp;
        return treasureProp.get(treasureCfg.ItemID).lv;
    }

    private _getTreasureMaxLv(treasureCfg: cfg.LeadTreasure): number {
        let treasureProp = bagData.treasureProp;
        return treasureProp.get(treasureCfg.ItemID).LvUpNeedCount.length + 1;
    }
}
