import List from "../component/List";
import main from "../main";
import container from "../module/container";
import {nodeProp,configItem} from "../const/type";
import eleProps from "./eleProps";

const {ccclass, property} = cc._decorator;
@ccclass
export default class chapter extends cc.Component {

    @property(List) chapList: List = null;
    @property(container) containerManager: container = null; 

    private _chapters:configItem[]  = [];
    private _index:number = 0;

    get chapters(){
        return this._chapters;
    }
    get index(){
        return this._index;
    }
    set curNodeProp(prop:nodeProp[]){
        this._chapters[this._index].nodeList = prop;
        this.sendNodeChangedEvent();
    }
    get curNodeProp(){
        return this._chapters[this._index].nodeList;
    }
    set curRouteProp(prop:nodeProp[]){
        this._chapters[this._index].routeList = prop;
    }
    get curRouteProp(){
        return this._chapters[this._index].routeList;
    }
    set curChapSize(size:cc.Size){
        this._chapters[this._index].width = size.width;
        this._chapters[this._index].height = size.height;
    }
    get curChapSize(){
        return cc.size(this._chapters[this._index].width,this._chapters[this._index].height);
    }
    set curbgRes(res:string){
        this._chapters[this._index].bgRes = res;
    }
    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        //this.chapList.numItems = 5;
        this.addChapter();
    }

    start () {

    }

    addChapter(){
        let newChapter: configItem = {
            "name":  "chap"+(this._chapters.length+1),
            "bgRes": "",
            "width": 1280,
            "height": 720,
            "nodeList": [],
            "routeList":[]
        }
        this._chapters.push(newChapter);
        this._index = this._chapters.length-1;
        this.chapList.numItems = this._index;
        this.containerManager.clearDesk();
        this.containerManager.loadFromCfg(newChapter);
        this.chapList.numItems = this._chapters.length;
        //添加新界面需要手动清理旧章节内容
        this.curNodeProp = [];
    }

    subChapter(){
        if(this._index<1 || this._index>=this._chapters.length) return;
        this._chapters.splice(this._index,1);
        this._index -=1;
        this.containerManager.clearDesk();
        this.containerManager.loadFromCfg(this._chapters[this._index]); 
        this.chapList.numItems = this._chapters.length;
    }

    loadChapters(parseData:any[]){
        this._chapters = parseData;
        this._index  = 0;
        if(parseData && parseData.length>0){
            this.containerManager.clearDesk();
            this.containerManager.loadFromCfg(parseData[0]);
        }else{
           this.addChapter();
        }
        this.chapList.numItems = this._chapters.length;
    }

    onListRender(item:cc.Node,idx:number){
        let label:cc.Label = item.getComponentInChildren(cc.Label);
        if (label) label.string = this._chapters[idx].name =  "chap"+(idx+1);
        //设置选中色作标记区分
        if(this._index == idx){
            let bg:cc.Node = item.getChildByName("bg");
            bg.color = cc.color(150,150,150,255);
        }else{
            let bg:cc.Node = item.getChildByName("bg");
            bg.color = cc.color(50,50,50,255);
        }
    }

    onChapSelected(item: any, selectedId: number, lastSelectedId: number, val: number){
        this._index = selectedId;
        this.containerManager.clearDesk();
        this.containerManager.loadFromCfg(this._chapters[selectedId]); 
        this.chapList.numItems = this._chapters.length;
        this.sendNodeChangedEvent();
    }

    sendNodeChangedEvent(fromNode?:cc.Node){
        (fromNode || this.node).dispatchEvent(new cc.Event.EventCustom("chap_changed",true));
    }
    // update (dt) {}
}
