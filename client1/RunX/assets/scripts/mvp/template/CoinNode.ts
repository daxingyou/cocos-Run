/*
 * @Author: xuyang
 * @Date: 2021-06-05 14:22:17
 * @Description: 基础货币组件
 */
import { eventCenter } from "../../common/event/EventCenter";
import { bagDataEvent, useInfoEvent } from "../../common/event/EventData";
import { configUtils } from "../../app/ConfigUtils";
import { utils } from "../../app/AppUtils";
import { gamesvr } from "../../network/lib/protocol";
import CoinItem from "./CoinItem";
import { CustomItemId } from "../../app/AppConst";
const { ccclass, property } = cc._decorator;

const PER_FRAME_INIT_COUNT = 2;

@ccclass
export default class CoinNode extends cc.Component {
    @property({ type: cc.Prefab, tooltip: "模板Item"}) tmpItem: cc.Prefab = null;

    private _funcionId: number = 0;         // 模块ID：FunctionConfig配置
    private _partId: number = 0;            // 模块子ID：[0-?]
    private _coinItems: CoinItem[] = [];    // Item组件

    deInit () {
        eventCenter.unregisterAll(this);
        this.clear();
    }

    /**
     * @desc 初始化货币组件
     * @param funcId 模块ID
     * @param partId 页签ID
     */
    init (funcId?: number, partId?: number){
        eventCenter.register(bagDataEvent.ITEM_CHANGE, this, this.refeshView);
        eventCenter.register(useInfoEvent.USER_LEVEL_CHANGE, this, this.refeshView);
        this.adjustWidget();
        this.resetCfgs(funcId, partId);
    }

    resetCfgs(funcId?: number, partId?: number) {
        this._funcionId = funcId || 0;
        this._partId = partId || 0;
        this.showView();
    }

    initWithCfgs(ids: number[]){
        this._funcionId = 0;
        this._partId = 0;
        if (ids && ids.length){
            this.showView([ids]);
        }
    }

    clear(){
        this._coinItems.forEach( _e => {
            _e.deInit();
            _e.node.removeFromParent()
        })
        this._coinItems = [];
    }

    showView(ids?: number[][]){
        let funcCfg = configUtils.getFunctionConfig(this._funcionId);
        let itemIds = ids || [[3,2,1]];

        if (funcCfg && funcCfg.FunctionMoneyShow){
            if (funcCfg.FunctionMoneyShow.includes(';')){
                itemIds = utils.parseStingList(funcCfg.FunctionMoneyShow);
            } else if (funcCfg.FunctionMoneyShow.includes(';')){
                itemIds = utils.parseStingList(funcCfg.FunctionMoneyShow).map(id =>{
                    return [id];
                });
            } else {
                itemIds = [[parseInt(funcCfg.FunctionMoneyShow)]];
            }
        }

        // 清理节点和数据
        this.clear();
        if (!itemIds[this._partId] || itemIds[this._partId].length == 0) return;
        let curItems: number[] = [];
        for(let i = 0, len = itemIds[this._partId].length; i < len;){
            
            let j = 0;
            for(; j < PER_FRAME_INIT_COUNT && i + j < len; j++){
                curItems = curItems || [];
                curItems.push(itemIds[this._partId][i + j]);
            }
            i += j;
        }
        let total = curItems.length;
        curItems.forEach((ele, idx) => {
            let itemNode = cc.instantiate(this.tmpItem);
            let itemCmp = itemNode.getComponent(CoinItem);
            itemCmp.init(ele);
            // 不用layout了，会刷新一下，直接设置x轴坐标更好
            itemNode.parent = this.node;
            itemNode.x = this._getPos(idx, total, itemNode.width);
            this._coinItems.push(itemCmp);
        })
    }

    private _getPos (idx: number, total: number, width: number) {
        let totalLen = total * width + (total-1) * 50;
        let x = -totalLen + width /2  + (idx * (width+50));
        return x
    }

    refeshView(CMD: number, msg: gamesvr.ItemChangeNotify){
        if(!this._coinItems || this._coinItems.length == 0) return;
        let changeItems = msg ? msg.Units : null;
        if (changeItems)
            changeItems.forEach(item=>{
                let coinItem = this._coinItems.filter((coinItem)=>{
                    return coinItem.itemId == item.ID || (item.ID == CustomItemId.EXP && coinItem.itemId == CustomItemId.PHYSICAL);
                }).pop();
                coinItem && coinItem.init();
            })
    }

    adjustWidget(){
        let widget = this.node.getComponent(cc.Widget);
        if (widget && cc.sys.isNative){
            let screenWidth = cc.winSize.width, screenHeight = cc.winSize.height;
            let safeArea = cc.sys.getSafeAreaRect();
            widget.right += (screenWidth - safeArea.x - safeArea.width);
        }
    }
}
