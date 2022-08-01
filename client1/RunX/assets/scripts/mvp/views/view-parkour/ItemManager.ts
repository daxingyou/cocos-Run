/*
 * @Description:
 * @Autor: lixu
 * @Date: 2021-04-27 19:22:20
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-31 15:57:17
 */
import {parkourEvent} from "../../../common/event/EventData";
import {eventCenter} from "../../../common/event/EventCenter";
import { parkourItemPoolMananger } from "./ItemPoolManager";
import { ActorManager } from "./ActorManager";
import { data } from "../../../network/lib/protocol";
import { cfg } from "../../../config/config";
import { configUtils } from "../../../app/ConfigUtils";
import ItemBase from "./ItemBase";
const {ccclass, property} = cc._decorator;

const RADIUS_ITEM_DISTRIBUTE = 50;

enum RewardAninType{
    //以给定位置为圆心，一帧内在给定半径内生成所有道具
    Circle = 1,
    //一个一个金币蹦出掉落
    StepDrop,
}

@ccclass
class ItemManager extends cc.Component {
    private _itemCfgMap: Map<number, cfg.RunXItem> = null;

    private _isInit: boolean = false;
    onInit(){
       this._init();
    }

    private _init(){
        if(this._isInit) return;
        this._isInit = true;
        this._initEvent();
    }

    deInit(){

        this._recycleReMainNodes();
    }

    private _initEvent (){
        eventCenter.register(parkourEvent.PRODUCT_ITEM, this, this.onProduceItem);
    }

    attachNodeToSelf(node: cc.Node){
        if(!cc.isValid(node)) return;
        node.parent = this.node;
    }

    onProduceItem(...params: any[]){
        if(!params || params.length <= 1) return;

        let pos = params[1];

        let itemCfgs : Array<data.IItemInfo> = params[2];
        if(!itemCfgs || itemCfgs.length == 0) return;
        let animType:RewardAninType  = params[3] || RewardAninType.Circle;
        this._itemCfgMap = this._itemCfgMap || new Map<number, cfg.RunXItem>();
        if(animType == RewardAninType.Circle){
            this._doCircleDrop(itemCfgs, pos);
        }

        if(animType == RewardAninType.StepDrop){
            this._doStepDrop(itemCfgs, pos, this);
        }
    }

    private _doStepDrop(itemCfgs: data.IItemInfo[], startPos: cc.Vec2, comp: cc.Component){
        let itemArr: number[] = [];
        itemCfgs.forEach(ele => {
            for(let i = 0; i < ele.Count; i++){
                itemArr.push(ele.ID);
            }
        });
        let self = this;
        let curIdx = 0;
        if(comp){
            comp.schedule(()=>{
                if(!this._itemCfgMap.has(itemArr[curIdx])){
                    this._itemCfgMap.set(itemArr[curIdx], configUtils.getRunXItemCfgByID(itemArr[curIdx]));
                }
                self._createItem(self._itemCfgMap.get(itemArr[curIdx]), startPos);
                curIdx += 1;
            }, 0.1, itemArr.length - 1);
        }
    }

    private _doCircleDrop(itemCfgs: data.IItemInfo[], pos: cc.Vec2){
        itemCfgs.forEach((ele) =>{
          if(!this._itemCfgMap.has(ele.ID)){
              this._itemCfgMap.set(ele.ID, configUtils.getRunXItemCfgByID(ele.ID));
          }
          let itemConfig: cfg.RunXItem = this._itemCfgMap.get(ele.ID);
          this._generateItems(ele.Count, itemConfig, pos);
        });
    }

    //生成掉落道具，掉落道具可以不加节点名称，因为节点的回收是自己回收自己，内部通过key进行回收
    private _generateItems(count: number, itemConfig: cfg.RunXItem, startPos: cc.Vec2){
        if(!itemConfig || count <= 0) return;
        for(let i = 0; i < count; i++){
            this._createItem(itemConfig, startPos);
        }
    }

    private _createItem(itemConfig: cfg.RunXItem, startPos: cc.Vec2): cc.Node{
        let node = parkourItemPoolMananger.getItem(itemConfig.ArtID, itemConfig);
        let itemCfg = parkourItemPoolMananger.getItemCfg(itemConfig.ArtID);
        itemCfg && (node.name = itemCfg.comp);
        node.parent = this.node;
        let colliderComps = node.getComponents(cc.BoxCollider);
        colliderComps && colliderComps.forEach(ele => { ele.enabled = false });
        node.x = startPos.x;
        node.y = startPos.y;
        let endPos = this._getEndPosInCircle(RADIUS_ITEM_DISTRIBUTE, startPos);
        cc.tween(node).to(0.2, {position: endPos}, {easing: "smooth"}).delay(0.1).call(() => {
            let itemComp: ItemBase = node.getComponent(node.name);
            itemComp.target = ActorManager.getInstance().getFirstRole(true).node;
            itemComp.isTrig = true;
        }).start();
        return node;
    }

    //回收残余的道具节点
    private _recycleReMainNodes(){
        let children = [...this.node.children];
        children.forEach(ele => {
            let itemComp: ItemBase = ele.getComponent(ele.name);
            itemComp.doRecycle();
        });
        children.length = 0;
    }

    onRelease(){
        eventCenter.unregisterAll(this);
        this._isInit = false;
        if(this._itemCfgMap){
          this._itemCfgMap.clear();
        }
        this._itemCfgMap = null;
    }

    private _getEndPosInCircle(radius: number, centerPos: cc.Vec2, randomScope: number = 20): cc.Vec3{
        let radian = Math.random() * Math.PI * 2;
        let x = centerPos.x + radius * Math.cos(radian);
        let y = centerPos.y + radius * Math.sin(radian);
        x = x + randomScope * (Math.random() > 0.5 ?  1 : -1) * Math.random();
        y = y + randomScope * (Math.random() > 0.5 ?  1 : -1) * Math.random();
        return cc.v3(x, y, 0);
    }
}

export {
    ItemManager,
    RewardAninType
}
