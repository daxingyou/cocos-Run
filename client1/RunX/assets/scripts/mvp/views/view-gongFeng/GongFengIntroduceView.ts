/*
 * @Description:
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2022-06-08 20:03:15
 * @LastEditors: lixu
 * @LastEditTime: 2022-06-18 14:08:39
 */

import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { cfg } from "../../../config/config";


const {ccclass, property} = cc._decorator;

@ccclass
export default class GongFengIntroduceView extends ViewBaseComponent {
    @property(cc.Label) title: cc.Label = null;
    @property(cc.Label) introduce: cc.Label = null;

    protected onInit(): void {
        this._initUI();
    }

    protected onRelease(): void {

    }

    private _initUI() {
        let dialogCfg: cfg.Dialog = configUtils.getDialogCfgByDialogId(99000078);
        this.introduce.string = dialogCfg.DialogText || '';
    }
}
