
import moduleUIManager from "../../../common/ModuleUIManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { uiHelper } from "../../../common/ui-helper/UIHelper";
import { cfg } from "../../../config/config";
import ItemBag from "../view-item/ItemBag";

const { ccclass, property } = cc._decorator;

const UP_NODE = "UP_NODE";
const LAYOUT_PARA = {
    SPACEX:12,
    SPACEY:12,
    PENDING: 10,
    COLCNT:7,
    ITEM_HEIGHT: 100
}

const ORIGIH_HEIGHT = 45;

@ccclass
export default class ItemSummonPool extends cc.Component {
    // 英雄
    @property(cc.Label)     lbTitle: cc.Label = null;
    @property(cc.Label)     lbRate: cc.Label = null;
    @property(cc.Label)     lbUpInfo: cc.Label = null;
    @property(cc.Node)      ndToggle: cc.Node = null;
    @property(cc.Node)      cardsRoot: cc.Node = null;
    @property(cc.Node)      upNode: cc.Node = null;
    @property(cc.Node)      ctxNode: cc.Node = null;

    private _spriteLoader = new SpriteLoader();
    private _cfg:cfg.SummonCardShow = null
    private _items: ItemBag[] = [];
    private _ctxHeight: number = 0;
    private _showRange: {ceil: number, floor: number} = null;

    init (cfg: cfg.SummonCardShow) {
        if (!cfg) return;
 
        this._cfg = cfg;

        this._showBase();
        this._showCards();
        this.show = true;
    }

    deInit () {
        this._items.forEach( _item => {
            let nd = _item.node.getChildByName(UP_NODE);
            if (nd && cc.isValid(nd)) nd.removeFromParent();
            ItemBagPool.put(_item)
        })
        this._items.length = 0;

        this._spriteLoader.release();
    }

    update () {
        if (!this._showRange) return;
        if (!this.cardsRoot.active) return;

        this._items.forEach( _item => {
            let y = _item.node.convertToWorldSpaceAR(cc.v2(0, 0)).y;
            if (y > (this._showRange.ceil + LAYOUT_PARA.ITEM_HEIGHT/2 + 10) || y < (this._showRange.floor - LAYOUT_PARA.ITEM_HEIGHT/2 - 10)) {
                _item.node.active = false;
            } else {
                _item.node.active = true;
            }
        })

    }

    set show (v: boolean) {
        this.cardsRoot.active = v;
        this.ndToggle.angle = v? 0:-90;
    }

    setShowRange (ceil: number, floor: number) {
        this._showRange = {
            ceil: ceil,
            floor: floor
        }
    }

    onClickToggle () {
        this.show = this.cardsRoot.active? false:true;
        this.node.height = this.cardsRoot.active? this._ctxHeight:ORIGIH_HEIGHT + 10
    }

    private _showBase () {
        this.lbTitle.string = `${this._cfg.SummonCardShowName}`;
        this.lbRate.string = `${this._cfg.SummonCardShowProbability/100}%`;
        if (this._cfg.SummonCardShowUPProbability) {
            let baseRate = this._cfg.SummonCardShowUPProbability;
            let total = this._cfg.SummonCardShowUPProbability * this._cfg.SummonCardShowProbability /100;
            this.lbUpInfo.string = `UP英雄占该概率的${baseRate/100}%（即获取概率${total/10000}%）`
        } else {
            this.lbUpInfo.string = "";
        }
    }

    private _showCards () {
        let self = this;
        const addUpIcon = (root: cc.Node)=> {
            let ndUp = cc.instantiate(self.upNode);
            ndUp.active = true;
            root.addChild(ndUp, 1, UP_NODE);
            ndUp.setPosition(28,28);
        }

        const getPos = (idx: number) => {
            let rawNo = Math.floor(idx/LAYOUT_PARA.COLCNT);
            let colNo = idx - rawNo *LAYOUT_PARA.COLCNT;
            let x = -this.ctxNode.width/2 + LAYOUT_PARA.PENDING + colNo * (LAYOUT_PARA.ITEM_HEIGHT + LAYOUT_PARA.SPACEX) + LAYOUT_PARA.ITEM_HEIGHT/2;
            let y = -LAYOUT_PARA.PENDING - rawNo * (LAYOUT_PARA.ITEM_HEIGHT + LAYOUT_PARA.SPACEY ) - LAYOUT_PARA.ITEM_HEIGHT/2;
            return cc.v2(x, y);
        }

        const addOneItem = (_item: number, isUp: boolean = false, _idx: number)=> {
            let rootNode = uiHelper.getRootViewComp(this.node).node;
            let comp: ItemBag = ItemBagPool.get();
            self.cardsRoot.addChild(comp.node);
            comp.init({
                id: _item,
                clickHandler: ()=> {
                    moduleUIManager.showItemDetailInfo(_item, 0, rootNode);
                }
            })
    
            this._items.push(comp)
            comp.node.setPosition(getPos(_idx));
            if (isUp) addUpIcon(comp.node)
        }

        let _upList: number[] = null;
        let _list: number[] = null;
        if (this._cfg.SummonCardShowUPContent && this._cfg.SummonCardShowUPContent.length > 0) {
            _upList = this._cfg.SummonCardShowUPContent.split(";").map( _s => {return parseInt(_s)});

        }

        if (this._cfg.SummonCardShowNormalContent && this._cfg.SummonCardShowNormalContent.length > 0) {
            _list = this._cfg.SummonCardShowNormalContent.split(";").map( _s => {return parseInt(_s)});
        }

        this._updateCtxSize((_upList ? _upList.length : 0) + (_list ? _list.length : 0));

        let startIdx = 0;
        if (_upList && _upList.length) {
            startIdx = _upList.length;
            _upList.forEach(( _item, _idx) => {
                addOneItem(_item, true, _idx);
            })
        }
        if (_list && _list.length) {
            _list.forEach( (_item, _idx) => {
                addOneItem(_item, false, _idx + startIdx);
            })
        } 
        this.node.height = this.ctxNode.height + ORIGIH_HEIGHT;
        this._ctxHeight = this.ctxNode.height + ORIGIH_HEIGHT;
    }

    private _updateCtxSize (itemCnt: number) {
        let rawCnt = Math.ceil(itemCnt/LAYOUT_PARA.COLCNT);
        let height = rawCnt * LAYOUT_PARA.ITEM_HEIGHT + (rawCnt - 1) * LAYOUT_PARA.SPACEY + LAYOUT_PARA.PENDING*2;
        this.ctxNode.height = height;
        this.ctxNode.width = LAYOUT_PARA.ITEM_HEIGHT * LAYOUT_PARA.COLCNT + (LAYOUT_PARA.COLCNT - 1) * LAYOUT_PARA.SPACEX  + LAYOUT_PARA.PENDING*2;
    }

}