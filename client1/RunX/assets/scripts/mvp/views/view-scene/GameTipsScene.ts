import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { resourceManager } from "../../../common/ResourceManager";
import { uiConfig } from "../../../common/UIConfig";

const { ccclass, property } = cc._decorator;

const DelayTime = 5;

@ccclass
export default class GameTipsScene extends ViewBaseComponent {
    private _finishCb: Function = null;
    onInit(finishCb: Function) {
        this._finishCb = finishCb;
        this._doBackTask();
        this.scheduleOnce(()=>{
            this._finishCb && this._finishCb();
            this._finishCb = null;
        }, DelayTime)
    }

    //利用空闲时间加载资源
    private async _doBackTask(){
        let uicfg = uiConfig.getConfig('LoginScene');
        let loginCache = await resourceManager.load(uicfg.path, cc.Prefab);
    }
}
