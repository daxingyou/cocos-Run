

import { ABILITY_ICON_TYPE } from "../../../../app/AppEnums";
import { ItemHeroHeadSquarePool, ItemStrategyDescPool } from "../../../../common/res-manager/NodePool";
import { cfg } from "../../../../config/config";
import ItemHeadSquare from "../../view-item/ItemHeadSquare";
import ItemStrategyDesc from "./ItemStrategyDesc";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemStrategyRecommandTeam extends cc.Component {
    @property(cc.Node) rootNode: cc.Node = null;
    @property(cc.Label) title: cc.Label = null;
    @property(cc.Button) btnDetail: cc.Button = null;
    @property(cc.Node) actorContainor: cc.Node = null;
    @property(cc.Node) descContainor: cc.Node = null;
    @property(cc.Node) labelContainor: cc.Node = null;
    @property(cc.Label) btnLb: cc.Label = null;

    private _cfg:cfg.StrategyTeam = null;
    private _actors: number[] = null;
    private _actorComps: ItemHeadSquare[] = null;
    private _clickHeadFn: Function = null;
    private _clickHandler: Function = null;
    private _isOpen: boolean = false;
    private _descItems: ItemStrategyDesc[] = [];
    private _isIntroduceInited: boolean = false;

    init(cfg: cfg.StrategyTeam, isOpen: boolean, actors: number[],  clickHandler: Function, clickHeadFn?: Function) {
        this._cfg = cfg;
        this._isOpen = isOpen;
        this._actors = actors;
        this._clickHeadFn = clickHeadFn;
        this._clickHandler = clickHandler;
        this._initUI();
    }

    deInit() {
        this._clickHeadFn = null;
        this._clickHandler = null;
        this._cfg = null;
        this._actors = null;
        if(this._actorComps && this._actorComps.length > 0) {
            this._actorComps.forEach(ele => {
                ItemHeroHeadSquarePool.put(ele);
            });
            this._actorComps.length = 0;
        }
        if(this._descItems && this._descItems.length > 0) {
            this._descItems.forEach(ele => {
                ItemStrategyDescPool.put(ele);
            });
            this._descItems.length = 0;
        }
        this._isIntroduceInited = false;
    }

    private _initUI() {
        this.title.string = this._cfg.StrategyTeamTitle || '';
        if(!this._actors || this._actors.length == 0) return;

        let curPosX = 0, spaceY = 5, scale = 0.8
        this._actors.forEach((ele, idx) => {
            let comp = ItemHeroHeadSquarePool.get();
            this._actorComps = this._actorComps || [];
            this._actorComps.push(comp);
            comp.node.scale = scale;
            let nodeWidth = comp.node.width * scale;
            comp.init(ele, this._onClickHead.bind(this), null, {abilityIconType: ABILITY_ICON_TYPE.INCIUDE_BG, abilityIconPos: cc.v2((comp.node.width >> 1) - 10, (comp.node.height >> 1) - 10)});
            if(idx != 0) {
              curPosX += spaceY;
            }
            curPosX += nodeWidth;
            comp.node.parent = this.actorContainor;
            comp.node.setPosition(curPosX - (nodeWidth >> 1), 0);
        })
        this.btnLb.string = this._isOpen ? '收起' : '详情';
        this._initIntroduces();
        this._updateItemSize(true);
    }

    private _initIntroduces() {
        if(this._isIntroduceInited) return;
        this._isIntroduceInited = true;
        let descArr = this._getIntroduces();
        let curPosy = 0, spaceY = 5;

        descArr.forEach((ele, idx) => {
            let comp = ItemStrategyDescPool.get();
            this._descItems.push(comp);
            comp.init(ele);
            let nodeHeight = comp.itemHeight;
            if(idx != 0) {
              curPosy -= spaceY;
            }
            comp.node.setPosition(0, curPosy);
            comp.node.parent = this.labelContainor;
            curPosy -= nodeHeight;
        })
        this.labelContainor.height = Math.abs(curPosy);
    }

    onClickDetail() {
        this._clickHandler && this._clickHandler(this._cfg, this);
    }

    updateOpenState(isOpen: boolean): cc.Size {
        if(isOpen == this._isOpen) return null;
        this._isOpen = isOpen;
        this.btnLb.string = this._isOpen ? '收起' : '详情';
        return this._updateItemSize();
    }

    private _onClickHead(heroID: number) {
        this._clickHeadFn && this._clickHeadFn(heroID);
    }

    private _updateItemSize(isUpdateSize: boolean = false): cc.Size {
        let height = 0;
        if(this._isOpen){
            this.descContainor.active = true;
            let descContainorHeight = this.labelContainor.height + 70;
            this.descContainor.height = descContainorHeight;
            height = this.rootNode.height + descContainorHeight - 10;
            isUpdateSize && (this.node.height = height);
        } else {
            this.descContainor.active = false;
            height = this.rootNode.height;
            isUpdateSize && (this.node.height = height);
        }
        return cc.size(this.node.width, height);
    }

    private _getIntroduces() {
        let strs: string[] = null;
        if(!this._cfg.StrategyTeamIntroduce || this._cfg.StrategyTeamIntroduce.length == 0) return strs;
        let introduce = this._cfg.StrategyTeamIntroduce;
        let results = introduce.match(/\S+$/gm);
        return results;
    }
 }
