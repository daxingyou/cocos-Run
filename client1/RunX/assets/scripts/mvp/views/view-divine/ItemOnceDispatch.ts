import { ItemBagPool, ItemHeroHeadSquarePool } from "../../../common/res-manager/NodePool";
import ItemBag from "../view-item/ItemBag";
import ItemHeadSquare from "../view-item/ItemHeadSquare";
import ItemDivineBase from "./ItemDivineBase";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemOnceDispatch extends ItemDivineBase {
    @property(cc.Node) dispatchHerosParent: cc.Node = null;
    @property(cc.Node) selectNode: cc.Node = null;
    @property(cc.Node) notMatchTips: cc.Node = null;
    @property([cc.SpriteFrame]) qualitySPArr: cc.SpriteFrame[] = [];

    private _isSelected: boolean = false;
    init(taskId: number, dispatchHeros: number[], loadView: Function, isSelected: boolean = false) {
        super.baseInit(taskId, loadView);
        this._isSelected = isSelected;
        this._refreshView(dispatchHeros);
        this.refreshSelectView();
    }

    deInit() {
        this._releaseItemHeadSquare();
        let children = [...this.itemBagParent.children]
        children.forEach(_c => {
            _c.scale = 1;
            ItemBagPool.put(_c.getComponent(ItemBag));
        })
    }

    unuse() {
        this.deInit();
    }

    set select(isSelected: boolean) {
        this._isSelected = isSelected;
    }

    private _refreshView(dispatchHeros: number[]) {
        this._releaseItemHeadSquare();
        this.notMatchTips.active = dispatchHeros.length <= 0;
        this.dispatchHerosParent.active = dispatchHeros.length > 0;
        if(dispatchHeros.length <= 0) {
            this._releaseItemHeadSquare();
            return;
        }
        for(let i = 0; i < dispatchHeros.length; ++i) {
            let heroId = dispatchHeros[i];
            let itemHeadSquareNode = this.dispatchHerosParent.children[i];
            let itemHeadSquare = null;
            if(!itemHeadSquareNode) {
                itemHeadSquare = ItemHeroHeadSquarePool.get();
                itemHeadSquareNode = itemHeadSquare.node;
                this.dispatchHerosParent.addChild(itemHeadSquareNode);
            } else {
                itemHeadSquare = itemHeadSquareNode.getComponent(ItemHeadSquare);
            }
            itemHeadSquare.init(heroId);
            itemHeadSquareNode.scale = 0.6;
        }
    }

    private _releaseItemHeadSquare() {
        let children = [...this.dispatchHerosParent.children]
        children.forEach(_c => {
            _c.scale = 1;
            ItemHeroHeadSquarePool.put(_c.getComponent(ItemHeadSquare));
        });
    }

    refreshSelectView() {
        this.selectNode.active = this._isSelected;
    }

    protected setQualityBG(quality: number){
      let quaiityBGSp = this.qualityBg.getComponent(cc.Sprite);
      quality < this.qualitySPArr.length && (quaiityBGSp.spriteFrame = this.qualitySPArr[quality - 1]);
  }

}
