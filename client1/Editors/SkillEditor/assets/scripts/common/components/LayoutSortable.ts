/******************************************
 * @desc 仅用于可配置的Layout组件排序 
 * @end
 ******************************************/
import {configUtils} from "../../app/ConfigUtils"
import {configManager} from "../../common/ConfigManager"
const {ccclass, property} = cc._decorator;

@ccclass
export default class LayoutSortable extends cc.Component {
    @property(cc.Layout) Layout: cc.Layout = null;
    @property(cc.String) ConfigName: string = "";
    @property({
        type: [cc.Node],
        tooltip: "节点列表",
    })
    Nodes: cc.Node[] = new Array<cc.Node>();
    @property({
        type:[cc.Integer],
        tooltip: "配置ID(长度与按钮数保持一致)"
    })
    FIDs: number[] = new Array<number>();
    /**
     * @desc 加载时就自动进行排序
     */
    start(){
        if(!this.Nodes || !this.FIDs || this.Nodes.length!=this.FIDs.length){
            cc.error("[LayoutSortable]:请检查参数以确认组件被正常使用！");
        }
        this.Nodes.forEach((node,index)=>{
            if (this.Layout.type!= cc.Layout.Type.HORIZONTAL && this.Layout.type!= cc.Layout.Type.VERTICAL) return;
             let layOutType: number = this.Layout.type;
             let direction: number = layOutType==cc.Layout.Type.HORIZONTAL ? this.Layout.horizontalDirection :this.Layout.verticalDirection;
             let factor: number = (layOutType + direction)%2==0 ? -1 : 1;
             let itemConfig: any = configManager.getConfigByKey(this.ConfigName,this.FIDs[index]); 
             node.zIndex =  node.zIndex+(itemConfig.FunctionOrder || 0);
             //按配置控制显示隐藏
             let openCondition:string = itemConfig.FunctionOpenCondition || "1|1";
             let conditionArr:Array<string>  = openCondition.split("|");
             switch(conditionArr[0]){
                case "1" :  
                    let curLevel: number = 0;
                    node.active = Number(conditionArr[0])>curLevel;  //等级
                    break;
                case "2":
                    let taskCompleted: boolean = true;
                    node.active = taskCompleted;
                    break;
             }
             //按配置控制显示状态
             let lockType: number = itemConfig.FunctionLockType || 2;
             switch(lockType){
                case 0 : 
                    node.active = false;
                    break;
                case 1 :
                    node.active = true;
                    node.color = new cc.Color(128,128,128,128);
                    break;
                case 2 :
                    node.active = true;
                    break;
             }
        })
    }
}