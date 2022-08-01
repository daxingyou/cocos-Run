/*
 * @Author:xuyang
 * @Date: 2021-05-21 16:17:35
 * @Description: 基础物品领取弹窗，可复用
 */
import { data } from "../../../network/lib/protocol";
import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { bagData } from "../../models/BagData";
import { audioManager, SFX_TYPE } from "../../../common/AudioManager";
import { utils } from "../../../app/AppUtils";
import UIGridView, { GridData } from "../../../common/components/UIGridView";
import ItemBag from "../view-item/ItemBag";
import { TransPiece } from "../../../app/AppType";
import moduleUIManager from "../../../common/ModuleUIManager";
import { QUALITY_TYPE } from "../../../app/AppEnums";
import StepWork from "../../../common/step-work/StepWork";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { userData } from "../../models/UserData";
import guiManager from "../../../common/GUIManager";

const { ccclass, property } = cc._decorator;

interface uiCfg {
    bgHeight: number,
    titlePos: number,
    ctxPos: number,
    gridPos: number,
    downLinePos: number
}

// 别人我为什么做的这么low，UI效果图排得没逻辑，我就写死了
const cfgCountLess5:uiCfg = {
    bgHeight: 260,
    titlePos:140,
    ctxPos: 60,     
    gridPos: -120,     
    downLinePos: -128
}

const cfgCountLess10:uiCfg = {
    bgHeight: 350,
    titlePos: 182.221,
    ctxPos: 124.294,
    gridPos: -55,
    downLinePos:-175.583
}

const cfgCountMore10:uiCfg = {
    bgHeight: 350,
    titlePos: 182.221,
    ctxPos: 135.189,  
    gridPos: -40,     
    downLinePos: -175.583
}

const X_SPACE = 25;
const Y_SPACE = 14;

@ccclass
export default class GetItemView extends ViewBaseComponent {

    // resize
    @property(cc.Node)      ndTitle: cc.Node = null;
    @property(cc.Node)      ndGridView: cc.Node = null;
    @property(cc.Node)      ndCtx: cc.Node = null;
    @property(UIGridView)   grid: UIGridView = null;
    @property(cc.Node)      tipsLabel: cc.Node = null;
    @property(sp.Skeleton)  bgEff: sp.Skeleton = null;

    private _items: data.IItemInfo[] = [];
    private _extra: data.IItemInfo[] = [];
    private _trans: TransPiece[] = [];
    private _closeFunc: Function = null;
    private _canClickClose: boolean = false;

    set closeFunc(func: Function){
        this._closeFunc = func;
    }

    onInit(itemList: data.IItemInfo[], extra: data.IItemInfo[] = [], transPiece: TransPiece[]) {
        audioManager.playSfx(SFX_TYPE.EQUIO_BROKE);
        this.scheduleOnce(()=> { this._canClickClose = true; }, 0.1);
        let _extra = extra || [];
        let _items = utils.mergeItemList(itemList) || [];

        let func = () => {
            if (!cc.isValid(this.node)) return;
            this._playBgEff();
            this.scheduleOnce(() => {
                this._resizeCtx(_items.length + _extra.length);
                this._updateGrid(_items.concat(_extra), _items.length, transPiece);
            }, 0.3);

            if (transPiece && transPiece.length) {
                // this.loadSubView("TransformView", transPiece)
                // this._showTramsForm();
            }
            cc.tween(this.tipsLabel)
                .to(1.5, { opacity: 64 }, { easing: "sineOut" })
                .to(1.5, { opacity: 255 }, { easing: "sineIn" })
                .union().repeatForever().start();
        }
        
        this._items = itemList;
        this._extra = extra;
        this._trans = transPiece;

        let newSSR: number[] = [];
        let hasNewHero: boolean = false;
        transPiece = transPiece || [];
        this._items.forEach((_item, idx) =>{
            let heroCfg = configUtils.getHeroBasicConfig(_item.ID);
            if (heroCfg && heroCfg.HeroBasicId === _item.ID){
                hasNewHero = hasNewHero || (!transPiece || transPiece.length == 0 || (transPiece.length > 0 && !transPiece.some(ele => { return ele.idx == idx})))
                heroCfg.HeroBasicQuality >= QUALITY_TYPE.SSR && newSSR.push(_item.ID);
            }
        });

        if(hasNewHero) {
            const preCapability = userData.preCapability;
            const capability = userData.capability;
            guiManager.showCapabilityChange(preCapability, capability);
        }
        if (!newSSR || newSSR.length == 0){
            func();
            return;
        }
        this.stepWork.concact(new StepWork().addTask(() => {
            moduleUIManager.showGetNewSSRHero(newSSR, func, this.node);
        }));
    }

    onRelease() {
        this.unscheduleAllCallbacks();
        bagData.updateLastData(null, true);
        this.releaseSubView()
        this.grid.clear();
        cc.tween(this.tipsLabel).stop();
    }

    onItemUpdate (item: ItemBag, data: data.IItemInfo, isExtra: boolean = false) {
        let prizeItem = data;
        let isNew = bagData.getItemByID(prizeItem.ID) == null
        item.init({
            id: prizeItem.ID,
            // clickHandler: () => { moduleUIManager.showItemDetailInfo(_item.ID, 0, this.node); },
            count: utils.longToNumber(prizeItem.Count),
            getItem: true,
            isNew:isNew,
            extra: isExtra
        })
    }

    private _updateGrid (v: data.IItemInfo[], originCnt: number, transPiece: TransPiece[] = []) {
        let gridDatas: GridData[]  = v.map( (_v, _idx) => {
            return {
                key: _idx.toString(),
                data: _v,
            }
        })
        this.grid.clear();
        let self = this;
        this.grid.init(gridDatas, {
            onInit: (itemCmp: ItemBag, data: GridData) => {
                self.onItemUpdate(itemCmp, data.data,  parseInt(data.key) >= originCnt);
                let idx = parseInt(data.key);
                let findPiece = transPiece.filter( _v => {return _v.idx == idx})[0];
                if (findPiece) {
                    itemCmp.showPiece(findPiece)
                }
            },
            getItem: (): ItemBag => {
                let itemNode = this._getBagItem();
                return itemNode;
            },
            releaseItem: (itemCmp: ItemBag) => {
                ItemBagPool.put(itemCmp)
            },
        });
    }

    private _resizeCtx (cnt: number) {
        let cfg: uiCfg = null;

        let ctxWidth = 620;
        let ctxHeight = 250;
        if (cnt <= 5) {
            cfg = cfgCountLess5;
            ctxWidth = cnt * 100 + (cnt - 1)* X_SPACE + 10;
            ctxHeight = 120;
        } else if (cnt <= 10) {
            cfg = cfgCountLess10;
            this.ndCtx.height = 220;
        } else {
            cfg = cfgCountMore10;
            ctxWidth = 620;
        }

        this.ndCtx.width = ctxWidth;
        this.ndGridView.width = ctxWidth;
        this.grid.node.width = ctxWidth;
        this.grid.node.height = ctxHeight;
        this.grid.node.y = cfg.gridPos;
    }

    private _getBagItem () {
        return ItemBagPool.get()
    }

    onClickClose (isUseCloseAction?: boolean): void {
        if (!this._canClickClose) {
            return;
        }

        this.closeView()
        this._closeFunc && this._closeFunc();
    }

    private _playBgEff(){
      if(this.ndTitle.parent == this.node){
          //@ts-ignore
          let bones = this.bgEff.attachUtil.generateAttachedNodes('bone5');
          if(bones && bones.length > 0){
              this.ndTitle.setPosition(cc.Vec2.ZERO);
              this.ndTitle.parent = bones[0];
          }
      }

      this.bgEff.clearTracks();
      this.bgEff.setAnimation(0, 'animation', false);
  }
}
