import List from "../../../../common/components/List";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../../common/event/EventCenter";
import ItemMemberRank from "./ItemMemberRank";

const {ccclass, property} = cc._decorator;
@ccclass
export default class GuildWarMemberRankView extends ViewBaseComponent {
   @property(List) rankList: List = null;
   @property(ItemMemberRank) selfRank: ItemMemberRank = null;

    onInit(): void {
       this._registerEvent();
       this.rankList.numItems = 10;
    }

    /**页面释放清理*/
    onRelease() {
       eventCenter.unregisterAll(this);
       this.rankList._deInit();
    }

    /**页面来回跳转刷新*/
    onRefresh(): void {

    }

    onRankListRender(rankNode:cc.Node,idx:number) {
        
    }

    private _registerEvent() {

    }
}