import { NODE_LOCK_TYPE, NODE_OPEN_CONDI_TYPE } from "../../app/AppEnums";
import { utils } from "../../app/AppUtils";
import { taskData } from "../../mvp/models/TaskData";
import { userData } from "../../mvp/models/UserData";
import ItemRedDot from "../../mvp/views/view-item/ItemRedDot";
import { configManager } from "../ConfigManager";
import { eventCenter } from "../event/EventCenter";
import { commonEvent, useInfoEvent } from "../event/EventData";
const { ccclass, property, disallowMultiple } = cc._decorator;

enum LAYOUT_DIRECTION {
    NONE = 0,
    LEFT,
    DOWN,
    RIGHT,
    UP
}

enum HORIZONTAL_MULTI_LINE_DIRECTION {
    DOWN = 0,
    UP
}

enum VARTICAL_MULTI_LINE_DIRECTION {
  LEFT = 2,
  RIGHT
}

const INVALID_FUNC_ID = 0;

type LinearContainorInitFuncCb = (order: number, condi: number[], lockType: number) => void
type LinearContainorInitFunc = (idx: number, functionID: number, cb: LinearContainorInitFuncCb) => void;
type LinearContainorGetStateFn = (idx: number, condi: number[]) => boolean;

let _onInitBottomLinearContainor = function(idx: number, funcID: number, cb: LinearContainorInitFuncCb) {
    let itemConfig: any = configManager.getConfigByKey("function", funcID);
    let order: number = idx;
    if(itemConfig &&  itemConfig.FunctionOrder) {
        order = itemConfig.FunctionOrder;
    }

    let condi: number[] = null;
    if(itemConfig && itemConfig.FunctionOpenCondition && itemConfig.FunctionOpenCondition.length > 0) {
        let condiStr = utils.parseStringTo1Arr(itemConfig.FunctionOpenCondition);
        condi = [parseInt(condiStr[0]), parseInt(condiStr[1])];
    }

    let lockType = NODE_LOCK_TYPE.NORMAL;
    if(itemConfig && typeof itemConfig.FunctionLockType != 'undefined') {
        lockType = itemConfig.FunctionLockType;
    }
    cb && cb(order, condi, lockType);
}

let _getOpenStateOfBottomLinearCntr = function(idx: number, condi: number[]): boolean {
    if(!condi || condi.length == 0) return true;
    let type = condi[0], value = condi[1];
    let isOpen = false;
    if(type == NODE_OPEN_CONDI_TYPE.USER_LV) {
        isOpen = value <= userData.lv;
    } else if(type == NODE_OPEN_CONDI_TYPE.TASK) {
        isOpen = taskData.getTaskIsCompleted(value);
    }
    return isOpen;
}

/**
 * @description 子节点排序, 调用成员函数之前，务必将功能节点和对应的ID进行绑定(Nodes属性和FIDs进行一一对应)
 */
@ccclass
@disallowMultiple()
export default class LinearSortContainor extends cc.Component {
    @property({
        type: [cc.Node],
        tooltip: "节点列表",
    })
    Nodes: cc.Node[] = new Array<cc.Node>();
    @property({
        type: [cc.Integer],
        tooltip: "配置ID(长度与按钮数保持一致)"
    })
    FIDs: number[] = new Array<number>();

    @property()
    private _direction: LAYOUT_DIRECTION = LAYOUT_DIRECTION.NONE

    @property({type: cc.Enum(LAYOUT_DIRECTION), tooltip: "布局方向"})
    set direction(direction: LAYOUT_DIRECTION) {
        this._direction = direction;
    }

    get direction() {
        return this._direction;
    }

    @property({
        type: cc.Float,
        visible() { return this.direction == LAYOUT_DIRECTION.LEFT || this.direction == LAYOUT_DIRECTION.RIGHT}
    })  spaceX: number = 0;

    @property()
    private _isMultiLine: boolean = false;

    @property(cc.Boolean)
    set isMultiLine(multi: boolean) {
        this._isMultiLine = multi;
    }

    get isMultiLine() {
        return this._isMultiLine;
    }

    @property({
        type: cc.Integer,
        visible() {return this.isMultiLine}
    })  singleLineNum: number = 5;

    @property({
        type: cc.Enum(HORIZONTAL_MULTI_LINE_DIRECTION),
        visible() {return this.isMultiLine && (this.direction == LAYOUT_DIRECTION.LEFT || this.direction == LAYOUT_DIRECTION.RIGHT);}
    })  hMultiLineDirection: HORIZONTAL_MULTI_LINE_DIRECTION = HORIZONTAL_MULTI_LINE_DIRECTION.DOWN;

    @property({
        type: cc.Enum(VARTICAL_MULTI_LINE_DIRECTION),
        visible() {return this.isMultiLine && (this.direction == LAYOUT_DIRECTION.UP || this.direction == LAYOUT_DIRECTION.DOWN);}
    })  vMultiLineDirection: VARTICAL_MULTI_LINE_DIRECTION = VARTICAL_MULTI_LINE_DIRECTION.RIGHT;

    @property({
        type: cc.Float,
        visible() { return this.direction == LAYOUT_DIRECTION.UP || this.direction == LAYOUT_DIRECTION.DOWN}
    })  spaceY: number = 0;

    @property(cc.Float) paddingStart : number = 0;

    @property(cc.Boolean) isAnim: boolean = true;

    private _orderMap: Map<number, number> = null;
    private _condiMap: Map<number, number []> = null;
    private _lockTypeMap: Map<number, number> = null;

    private _initFunc: LinearContainorInitFunc = null;
    private _getOpenStateFn: LinearContainorGetStateFn = null;

    init(initFunc?: LinearContainorInitFunc, getOpenStateFn?: LinearContainorGetStateFn) {
        this._initFunc = initFunc || _onInitBottomLinearContainor;
        this._getOpenStateFn = getOpenStateFn || _getOpenStateOfBottomLinearCntr;
        this.reset();
        eventCenter.register(commonEvent.NEW_TASK_FINISHED, this, this.refreshView);
        eventCenter.register(useInfoEvent.USER_EXP_CHANGE, this, this.refreshView)
    }

    deInit() {
        eventCenter.unregisterAll(this);
        this._orderMap && this._orderMap.clear();
        this._condiMap && this._condiMap.clear();
        this._lockTypeMap && this._lockTypeMap.clear();
        this._initFunc = null;
        this._getOpenStateFn = null;
    }

    reset() {
        this._initCfg();
        this._refreshView();
    }

    refreshView() {
        this._refreshView();
    }

    private _initCfg() {
        if(!this.Nodes || this.Nodes.length == 0) return;

        this._orderMap = this._orderMap || new Map();
        this._orderMap.clear();

        this._condiMap =  this._orderMap || new Map();
        this._condiMap.clear();

        this._lockTypeMap = this._lockTypeMap || new Map();
        this._lockTypeMap.clear();

        let isFuncNoEmpty = this.FIDs &&  this.FIDs.length > 0;
        this.Nodes.forEach((ele, idx) => {
            let funcID = isFuncNoEmpty ? (idx >= this.FIDs.length ? INVALID_FUNC_ID : this.FIDs[idx]) : INVALID_FUNC_ID;
            if(funcID == INVALID_FUNC_ID || !this._initFunc) {
                this._orderMap.set(idx, idx);
                this._condiMap.set(idx, null);
                this._lockTypeMap.set(idx, NODE_LOCK_TYPE.NORMAL);
                return;
            }

            this._initFunc(idx, funcID, (order: number, condi: number[], lockType: number) => {
                this._orderMap.set(idx, order);
                this._condiMap.set(idx, condi);
                this._lockTypeMap.set(idx, lockType);
            });
        })
    }

    private _genSortedList(): {nodeIdxs: number[], nodeLockState: number[]} {
        let idxs: number[] = [];
        this._orderMap.forEach((vaule, key) => {
          idxs.push(key);
        });
        idxs.sort((a,b) => {
            return this._orderMap.get(a) - this._orderMap.get(b);
        });

        let nodeIdxs: number[] = [];
        let nodeLockStates: number[] = [];
        idxs.forEach(ele => {
            if(!this._condiMap.has(ele)) {
                nodeIdxs.push(ele);
                nodeLockStates.push(NODE_LOCK_TYPE.NORMAL);
                return;
            }

            let condi = this._condiMap.get(ele);
            if(!condi || condi.length == 0) {
                nodeIdxs.push(ele);
                nodeLockStates.push(NODE_LOCK_TYPE.NORMAL);
                return;
            }


            if(!this._getOpenStateFn) {
                nodeIdxs.push(ele);
                nodeLockStates.push(NODE_LOCK_TYPE.NORMAL);
                return;
            }

            let isOpen = this._getOpenStateFn(ele, condi);
            if(isOpen || (!isOpen && this._lockTypeMap.get(ele) != NODE_LOCK_TYPE.HIDE)) {
                nodeIdxs.push(ele);
                nodeLockStates.push(isOpen ? NODE_LOCK_TYPE.NORMAL : this._lockTypeMap.get(ele));
            }
        })
        return {nodeIdxs: nodeIdxs, nodeLockState: nodeLockStates};
    }

    private _refreshView() {
        if(this.direction == LAYOUT_DIRECTION.NONE) return;
        if (!this.Nodes || !this.FIDs || this.Nodes.length != this.FIDs.length || this.FIDs.length == 0) return;

        let validNodeData = this._genSortedList();
        let nodeIdxs = validNodeData.nodeIdxs, nodeLockStates = validNodeData.nodeLockState;
        this.Nodes.forEach((ele, idx) => {
            if(nodeIdxs.indexOf(idx) == -1) ele.active = false;
        });

        let curPos: number = (this.direction == LAYOUT_DIRECTION.LEFT || this.direction == LAYOUT_DIRECTION.DOWN) ? -this.paddingStart : this.paddingStart;
        nodeIdxs.forEach((ele, idx) => {
            let node = this.Nodes[ele];
            let lockType = nodeLockStates[idx];
            if(cc.isValid(node)) {
                let oriActive = node.active;
                node.active = true;
                if(this.direction == LAYOUT_DIRECTION.LEFT) {
                    let width = node.width;
                    let posX = width * (1 - node.anchorX);
                    posX = curPos - (((idx != 0) ? this.spaceX : 0) + posX);
                    curPos -= (((idx != 0) ? this.spaceX : 0) + width);
                    this._playAnim(node, oriActive ? {x: posX, scale: 1} : {scale: 1}, oriActive);
                } else if(this.direction == LAYOUT_DIRECTION.RIGHT) {
                    let width = node.width;
                    let posX = width * node.anchorX;
                    posX = curPos + (((idx != 0) ? this.spaceX : 0) + posX);
                    this._playAnim(node, oriActive ? {x: posX, scale: 1} : {scale: 1}, oriActive);
                    curPos += (((idx != 0) ? this.spaceX : 0) + width);
                } else if(this.direction == LAYOUT_DIRECTION.DOWN) {
                    let height = node.height;
                    let posY = height *(1 - node.anchorY);
                    posY = curPos - (((idx != 0) ? this.spaceY : 0) + posY);
                    this._playAnim(node, oriActive ? {y: posY, scale: 1} : {scale: 1}, oriActive);
                    curPos -= (((idx != 0) ? this.spaceY : 0) + height);
                } else if(this.direction == LAYOUT_DIRECTION.UP) {
                    let height = node.height;
                    let posY = height *node.anchorY;
                    posY = curPos + (((idx != 0) ? this.spaceY : 0) + posY);
                    this._playAnim(node, oriActive ? {y: posY, scale: 1} : {scale: 1}, oriActive);
                    curPos += (((idx != 0) ? this.spaceY : 0) + height);
                }

                let material = cc.assetManager.builtins.getBuiltin('material', lockType == NODE_LOCK_TYPE.GRAY ? 'builtin-2d-gray-sprite' : 'builtin-2d-sprite');
                this._changeNodeEff(node, material as cc.Material);
            }
        });
    }

    private _playAnim(node: cc.Node, props: any, lastActive: boolean) {
        if(!cc.isValid(node)) return;

        //不使用动画
        if(!this.isAnim) {
            props = props || Object.create(null);
            for(let k in props) {
                k == 'x' && (node.x = props[k]);
                k == 'y' && (node.y = props[k]);
                k == 'scale' && (node.scale = props[k]);
                k == 'position' && (node.setPosition(props[k]));
                k == 'opacity' && (node.opacity = props[k]);
            }
            return;
        }

        //使用动画
        if(lastActive) {
            node.scale = 1;
            let action = cc.tween(node).to(0.05, props);
            action.start()
        } else {
            node.scale = 0;
            cc.tween(node).delay(0.05).to(0.05, props).start();
        }
    }

    private _changeNodeEff(node: cc.Node, material: cc.Material) {
        if(!cc.isValid(node)) return;
        let spComp = node.getComponent(cc.Sprite);
        spComp && material && spComp.setMaterial(0, material);
        node.children.forEach(ele => {
            if(node.getComponent(ItemRedDot)){
                return;
            }
            this._changeNodeEff(ele, material);
        });
    }
}

export {
    NODE_LOCK_TYPE,
    LinearContainorInitFuncCb,
    NODE_OPEN_CONDI_TYPE
}
