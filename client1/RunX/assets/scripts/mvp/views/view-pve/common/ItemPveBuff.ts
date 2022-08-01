import { resPathUtils } from "../../../../app/ResPathUrlUtils";
import RichTextEx from "../../../../common/components/rich-text/RichTextEx";
import { SpriteLoader } from "../../../../common/ui-helper/SpriteLoader";


export enum PVE_BUFF_TYPE {
    BUFF,
    DEBUFF
}

export interface PveBuffInfo {
    buffType: PVE_BUFF_TYPE,    // 增益类型：增益、减益
    buffStr: string,            // 增益描述
    heroTypeForm?: number,      // 英雄类型
    heroTypeFormNum?: number    // 英雄编号
}

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemPveBuff extends cc.Component {
    @property([cc.SpriteFrame]) spriteFrames: cc.SpriteFrame[] = [];

    @property(cc.Sprite) img: cc.Sprite = null;
    @property(cc.Sprite) buffIcon: cc.Sprite = null;
    @property(RichTextEx) description: RichTextEx = null;

    private _spriteLoader: SpriteLoader = new SpriteLoader();

    init(buffInfo: PveBuffInfo) {
        this.node.active = true;

        this.img.spriteFrame = buffInfo.buffType === PVE_BUFF_TYPE.BUFF ? this.spriteFrames[0] : this.spriteFrames[1];

        this.description.string = buffInfo.buffStr;

        if (buffInfo.heroTypeForm > 0 && buffInfo.heroTypeFormNum > 0) {
            let iconUrl: string = resPathUtils.getPveBuffIcon(buffInfo.heroTypeForm, buffInfo.heroTypeFormNum);
            iconUrl.length > 0 && (this._spriteLoader.changeSprite(this.buffIcon, iconUrl));
        }
    }

    deInit() {
        this._spriteLoader.release();
    }
}
