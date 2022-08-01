import { VIEW_NAME } from "../../../../app/AppConst";
import { resPathUtils } from "../../../../app/ResPathUrlUtils";
import guiManager from "../../../../common/GUIManager";
import { SpriteLoader } from "../../../../common/ui-helper/SpriteLoader";
import PVEChallengeView from "./PVEChallengeView";

const {ccclass, property} = cc._decorator;

@ccclass
export default class PVEChallengeReadyNode extends cc.Component {
    private _loadSubView: Function = null;

    @property(cc.Sprite) imgModel: cc.Sprite = null;

    spriteLoader: SpriteLoader = new SpriteLoader();

    onInit(loadSubView: Function) {
        this._loadSubView = loadSubView;

        this.spriteLoader.changeSprite(this.imgModel, resPathUtils.getModelPhotoPath(1092));
    }

    deInit() {
        this.spriteLoader.release();
    }

    onRefresh() {}

    /** 展示英雄选择界面 */
    onBtnShowSelectHerosView() {
        this._loadSubView(VIEW_NAME.PVE_CHALLENGE_SELECT_HERO_VIEW);
    }
}
