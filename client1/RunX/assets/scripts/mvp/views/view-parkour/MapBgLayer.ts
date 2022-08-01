import { utils } from '../../../app/AppUtils';
import { resourceManager } from '../../../common/ResourceManager';
import { getMapBgAbsPath } from './ParkourConst';
import { ParkourScene } from "../view-scene/ParkourScene";

/**
 * 地图背景层组件，代表一个背景层，使用循环方式移动
 */
const {ccclass, property} = cc._decorator;

@ccclass
export default class MapBgLayer extends cc.Component {

    private _isBuild: boolean = false;
    private _layerIdx: number = 0;  //当前层的索引
    private _startPos: cc.Vec2 = null;//层中第一个节点的初始位置
    private _res: Array<string> = null; //层中元素的资源资源路径，该组件中通常为纹理路径
    private _gapX: number[] = null; //各节点的x方向的间隔,有多个元素时，表示取一个随机值
    private _gapY: number[] = null; //同gapX
    private _layerSpeed: number = 0;    //层的移动速度
    private _speed: number = 0;    //层的真正移动速度
    private _children: cc.Node[] = null;
    private _isPaused: boolean = false; //是否暂停
    private _isInit: boolean = false;
    private _resetNodes: cc.Node[] = [];  //需要重新设置位置的节点

    onInit(params: any){
        this._init();
    }

    private _init(){
        if(this._isInit) return;
        this._isInit = true;
    }

    deInit(){
        this._isBuild = false;
        this._isPaused = false;
        this._resetNodes.length = 0;
        this._speed = 0;
    }

    onRelease(){
        this._startPos = null;
        this._res && (this._res.length = 0);
        this._res = null;
        this._gapX && (this._gapX.length = 0);
        this._gapX = null;
        this._gapY && (this._gapY.length = 0);
        this._gapY = null;
        for(let i = 0, len = this._children.length; i < len; i++){
            this._children[i].getComponent(cc.Sprite).spriteFrame = null;
            this._children[i].destroy();
        }
        this._children = null;
    }

    private _convertStringToNumber(param: string[]): number[]{
        if(!param || param.length == 0) return null;
        let arr:number[] = [];
        param.forEach(ele => {
            let ret = parseFloat(ele);
            !isNaN(ret) && arr.push(ret);
        });
        return arr;
    }

    private _initData(params: any){
        this._layerIdx = params.LessonRunBgImageLevel || 0;
        this._res = utils.parseStringTo1Arr(params.LessonRunBgImage || '');
        let elem;
        for(let i = 0, len = this._res.length; i < len; i++){
            elem = getMapBgAbsPath(this._res[i], params.LessonRunBgChapterId, params.LessonRunBgImageLevel);
            this._res[i] = elem;
        }
     
        let x = params.LessonRunBgBeginX, y = params.LessonRunBgBeginY;
        this._startPos = cc.v2(x, y);
        params.LessonRunBgGapX && (this._gapX = this._convertStringToNumber(utils.parseStringTo1Arr(params.LessonRunBgGapX, ';')));
        params.LessonRunBgGapY && (this._gapY = this._convertStringToNumber(utils.parseStringTo1Arr(params.LessonRunBgGapY, ';')));
        this._layerSpeed = params.LessonRunBgSpeed || 0;
    }

    async buildMapBg(params: any){
        this._initData(params);
        this._children = this._children || [];
        let tasks : Promise<any>[] = [];
        this._res.forEach((elem, idx)=>{
            tasks.push(this._createImgEle(elem, idx));
        });
        if(tasks.length == 0) return true;

        await Promise.all<boolean>(tasks)
        this._initChildrenPos();
        this._isBuild = true;
        return true;
    }

    private async _createImgEle(path: string, idx: number){
        let node = new cc.Node();
        node.name = `${idx}`;
        node.parent = this.node;
        this._children.push(node);
        let comp = node.addComponent(cc.Sprite);
        comp.type = cc.Sprite.Type.SIMPLE;
        comp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        node.setAnchorPoint(cc.Vec2.ZERO);
        let ret = await resourceManager.load(path, cc.SpriteFrame);
        comp.spriteFrame = ret.res;
        let size = (ret.res as cc.SpriteFrame).getOriginalSize();
        let ratio = cc.winSize.width / cc.view.getDesignResolutionSize().width;
        comp.node.width =  size.width * ratio;
        comp.node.height = size.height * ratio;
        return node;
    }

    private _initChildrenPos(){
        this._children.sort((a, b) => {
            let aIdx = parseInt(a.name);
            let bIdx = parseInt(b.name);
            return aIdx - bIdx;
        });
        let lastNodePosition = cc.v2(Math.floor(this._startPos.x), Math.floor(this._startPos.y));
        this._children.forEach((child) => {
            child.setPosition(lastNodePosition);
            lastNodePosition = this._calculateNextPos(child.width, lastNodePosition);
        });
    }

    //重新构建
    reBuildIn(){
        if(!this._children || this._children.length == 0) return;
        this._initChildrenPos();
        this._isBuild = true;
    }

    private _calculateNextPos(width: number, pos: cc.Vec2){
        pos.y = this._startPos.y;
        pos.x = pos.x + width;
        let gapX = 0;
        if(Array.isArray(this._gapX)){
            if(this._gapX.length > 1){
                gapX = utils.getRandomInBlock(this._gapX);
            }else{
                gapX = this._gapX[0];
            }
        }

        let gapY = 0;
        if(Array.isArray(this._gapY)){
            if(this._gapY.length > 1){
                gapY = utils.getRandomInBlock(this._gapY);
            }else{
                gapY = this._gapY[0];
            }
        }
        pos.x += gapX;
        pos.y += gapY;
        return pos;
    }

    lateUpdate(dt: number){
        if(!this._isBuild) return;
        if(this._isPaused) return;
        if(this._speed === 0) return;
        this._resetNodes.length = 0;
        let dis = dt * this._speed;
        this._children.forEach((node) =>{
            if(node.x < -node.width){
                this._resetNodes.push(node)
                return;
            }
            let normalPos = node.x;
            let currPosX = normalPos - dis;
            node.x = currPosX;
        });

        if(this._resetNodes.length == 0) return;
        this._resetNodes.forEach(node => {
            let idx = this._children.indexOf(node);
            if(idx == -1) return;
            this._children.splice(idx, 1);
            let lastNode = this._children[this._children.length - 1];
             //防止一层背景只配置了一个元素又移动的情况，移出屏幕后，补位过程中没有了参考节点
            let  width = 0, pos = null;
            if(!cc.isValid(lastNode)){
                pos = cc.v2(cc.winSize.width, node.y);
            }else{
                pos = lastNode.getPosition();
                width = lastNode.width;
            }
            pos = this._calculateNextPos(width, pos);
            node.x = Math.max(cc.winSize.width, pos.x);
            this._children.push(node);
        });
    }

    pause(){
        this._isPaused = true;
    }

    resume(){
        this._isPaused = false;
    }

    fastMove(){
        this._speed *= 3;
    }

    stopMove(){
        this._speed = 0;
    }

    normalMove(){
        this._speed = this._layerSpeed;
    }
}
