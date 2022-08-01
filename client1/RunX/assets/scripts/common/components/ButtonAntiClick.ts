import { appCfg } from "../../app/AppConfig";
import { GLOBAL_CLICK_INTERVAL } from "../../app/AppConst";
import { logger } from "../log/Logger";

/**
 * @desc 防止按钮连点
 * 
 */
const { ccclass, property, requireComponent, disallowMultiple, menu } = cc._decorator;

@ccclass
@disallowMultiple
@menu('自定义组件/ButtonAntiClick')

export default class ButtonAntiClick extends cc.Component {

    @property({
        displayName: "最小点击间隔",
    })
    clickDuration: number = 0.5;

    onLoad() {
        let selfButton = this.node.getComponent(cc.Button);
        if (cc.isValid(selfButton) && this.clickDuration > 0) {
            //@ts-ignore
            let _onTouchEnded = selfButton._onTouchEnded;
            if (_onTouchEnded) {
                //@ts-ignore
                selfButton._onTouchEnded = (event: any) => {
                    let curr = new Date().getTime();
                    if (curr - appCfg.globalClick > GLOBAL_CLICK_INTERVAL) {
                        appCfg.globalClick = curr
                        _onTouchEnded.call(selfButton, event);

                        if (selfButton.interactable) {
                            selfButton.interactable = false;
                            this.scheduleOnce(() => {
                                selfButton.interactable = true;
                            }, this.clickDuration);
                        }
                    } else {
                        logger.warn(`_onTouchEnded is to fast`);
                    }
                }
            } else {
                logger.error(`_onTouchEnded is invalid. pls handle mulit click.`);
            }
        }
    };

    protected onDisable(): void {
        this.unscheduleAllCallbacks();
        let selfButton = this.node.getComponent(cc.Button);
        if (cc.isValid(selfButton)){
            selfButton.interactable = true;
        }
    }
}
