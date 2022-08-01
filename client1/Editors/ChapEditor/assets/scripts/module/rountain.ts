import List from "../component/List"
import container from "./container"
const {ccclass, property} = cc._decorator;

@ccclass
export default class chapter extends cc.Component {

    @property(List) routeList: List = null;ainer: container = null;
    @property(container) container: container = null;
    private dataList:Array<string> = new Array<string>();
    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.dataList = ["bg1", "bg2","lesson_bg"];
        this.routeList.numItems = this.dataList.length;
    }

    start () {

    }

    onSlideCallBackRoutine(target:cc.Slider) {
        // 回调的参数是 slider
        let progress = target.progress;
        this.container.setOpacityForBg(Math.ceil(progress*255))
     }

    onListRender(item:cc.Node,idx:number){
        let label: cc.Label = item.getComponentInChildren(cc.Label);
        let img: cc.Sprite = item.getComponentInChildren(cc.Sprite);
        let url: string = `bg/${this.dataList[idx]}`;
        cc.resources.load(url,cc.SpriteFrame,(err:Error,res:cc.SpriteFrame)=>{
            if(!err){
                img.spriteFrame = res;
            }
            else{
                cc.error(`Load ${url} error!`,err)
            }
        })
        if (label) label.string = this.dataList[idx];
    }
    // update (dt) {}
}
