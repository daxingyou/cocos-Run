import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../../common/event/EventCenter";
import { operationSvr } from "../../../../network/OperationSvr";
import { bagData } from "../../../models/BagData";
import { pveTrialData } from "../../../models/PveTrialData";
import { pveDataOpt } from "../../../operations/PveDataOpt";
import ItemIslandBuff from "./itemIslandBuff";

const {ccclass, property} = cc._decorator;
@ccclass
export default class PVEFairyIslandBuffView extends ViewBaseComponent {

    @property(cc.Button) confirmBtn: cc.Button = null;
    @property(cc.Label) title: cc.Label = null;
    @property(cc.Label) noTag: cc.Label = null;
    @property(cc.ToggleContainer) buffContainer: cc.ToggleContainer = null;
    @property(cc.Node) buffToggle: cc.Node = null;
    @property(cc.Button) closeBtn: cc.Button = null;

    private _isGetBuff: boolean = true;
    private _buffList: number[] = [];

    /**根据传入buffId得到是否获得buff界面*/
    onInit(buffIds: number[]): void { 
        this._buffList = buffIds;
        this._isGetBuff = !!(buffIds && buffIds.length);
        this.title.string = this._isGetBuff ? "获得效果" : "本层效果";
        this._loadLayoutEffect(buffIds);
    }

    /**页面释放清理*/
    onRelease() {
       eventCenter.unregisterAll(this);
    }



    /**根据传输数据加载buff效果*/
    private _loadLayoutEffect(buffIds:number[]) {
        this.buffContainer.node.removeAllChildren();
        if (!buffIds) {
            //获取目标身上挂着的buff列表
            buffIds =  pveTrialData.islandData.BuffList;
        }
        if (!buffIds || !buffIds.length) {
            this.noTag.node.active = true;
            return;
        }

        this.closeBtn.node.active = !this._isGetBuff;

        buffIds.forEach((buffid, index) => {
            if (buffIds) {
                let buffItem = cc.instantiate(this.buffToggle);
                buffItem.parent = this.buffContainer.node;
                this.buffContainer.node.height += buffItem.height;
                let buffComp: ItemIslandBuff = buffItem.getComponent(ItemIslandBuff);
                buffComp.onInit(buffid, index == 0, this._isGetBuff);    
            }
        })
    }

    closeView1() {
        if (this._isGetBuff) {
            return;
        }
        this.closeView();
    }

    confirmClick() {
        if (this._isGetBuff) {
            this.buffContainer.toggleItems.forEach((toggle,index) => {
                if (toggle.isChecked) {
                    pveDataOpt.reqSelectBuff(this._buffList[index]);
                }
            })
        }

        this.closeView();
    }

}