import { SCENE_NAME } from "../../../app/AppConst";
import { eventCenter } from "../../../common/event/EventCenter";
import guiManager from "../../../common/GUIManager";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";

const { ccclass, property } = cc._decorator;


@ccclass
export default class LoginView extends ViewBaseComponent {

    onInit() {
    }

    onClickClose() {
        eventCenter.unregisterAll(this);
        this.closeView();
    }

    onClickGoBattle() {
        this.closeView();
        guiManager.loadScene(SCENE_NAME.BATTLE);
    }

    onClickGoRunCool() {

    }

}
