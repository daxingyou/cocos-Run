import { HEAD_ICON } from "../../../app/AppEnums";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { RoleReport } from "./BattleReportView";

const { ccclass, property } = cc._decorator;

@ccclass export default class ItemReportRole extends cc.Component {
    private _spriteLoader = new SpriteLoader();

    @property(cc.Node)      ndHead: cc.Node = null;
    @property(cc.Sprite)    sprHead: cc.Sprite = null;
    @property(cc.Node)      ndNonRole: cc.Node = null;
    @property(cc.Node)      ndContent: cc.Node = null;

    @property(cc.ProgressBar)   progressInfo: cc.ProgressBar[] = [];
    @property(cc.Label) labelInfo: cc.Label[] = [];

    onInit(info: RoleReport, maxNum: number[]) {
        this._updateHeadSp(info.ID);
        this._updateDetail(info, maxNum);
    }

    deInit () {
        this._spriteLoader.release();
    }

    reflashContent(show:boolean) {
        this.ndContent && (this.ndContent.active = show);
    }

    private _updateHeadSp (heroID: number) {
        if (heroID == -1) {
            this.ndContent.active = false;
            return;
        }
        this.ndContent.active = true;
        if (heroID) {
            this.ndHead.active = true;
            this.ndNonRole.active = false;
            let headIcon: string = resPathUtils.getItemIconPath(heroID, HEAD_ICON.CIRCLE);
            this._spriteLoader.changeSpriteP(this.sprHead, headIcon).catch(() => {
                this.sprHead.spriteFrame = null;
            });
        } else {
            this.ndNonRole.active = true;
            this.ndHead.active = false;
        }
    }

    private _updateDetail (info: RoleReport, maxNum: number[]) {
        let attack = info.Attack;
        let maxAttack = maxNum[0] || 1;
        this.progressInfo[0].progress = attack/maxAttack;
        this.labelInfo[0].string = `${attack}`

        let hurt = info.Hurt;
        let maxHurt = maxNum[1] || 1;
        this.progressInfo[1].progress = hurt/maxHurt;
        this.labelInfo[1].string = `${hurt}`

        let cure = info.Cure;
        let maxCure = maxNum[2] || 1;
        this.progressInfo[2].progress = cure/maxCure;
        this.labelInfo[2].string = `${cure}`
    }
}