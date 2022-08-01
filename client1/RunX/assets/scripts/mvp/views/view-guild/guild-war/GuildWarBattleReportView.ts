import List from "../../../../common/components/List";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../../common/event/EventCenter";

const {ccclass, property} = cc._decorator;
@ccclass
export default class GuildWarBattleReportView extends ViewBaseComponent {
    @property(List) reportList: List = null;

    onInit(): void {
        this._registerEvent();
        this.reportList.numItems = 10;
    }

    /**页面释放清理*/
    onRelease() {
        this.reportList._deInit();
        eventCenter.unregisterAll(this);
    }

    /**页面来回跳转刷新*/
    onRefresh(): void {

    }

    onReportRender(report: cc.Node, idx: number) {
        
    }

    private _registerEvent() {

    }
}