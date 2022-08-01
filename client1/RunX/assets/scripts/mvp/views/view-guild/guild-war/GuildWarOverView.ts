import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../../common/event/EventCenter";

const {ccclass, property} = cc._decorator;
@ccclass
export default class GuildWarOverView extends ViewBaseComponent {

    onInit(): void {
       this._registerEvent();
    }

    /**页面释放清理*/
    onRelease() {
       eventCenter.unregisterAll(this);
    }

    /**页面来回跳转刷新*/
    onRefresh(): void {

    }

    private _registerEvent() {

    }
}