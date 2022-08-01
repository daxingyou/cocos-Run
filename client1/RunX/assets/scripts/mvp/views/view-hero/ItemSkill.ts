import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { logger } from "../../../common/log/Logger";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemSkill extends cc.Component {
    @property(cc.Sprite)            skillIconSp: cc.Sprite = null;
    @property(cc.Node)              selectBg: cc.Node = null;
    @property(cc.Label)             skillNameLb: cc.Label = null;

    private _skillId: number = 0;
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _clickHandler: Function = null;
    private _showName: boolean = false;
    onInit (skillId: number, iconName: string, clickHandler: Function = null, isShowName: boolean = false) {
        this._skillId = skillId;
        clickHandler && (this._clickHandler = clickHandler);
        this._showName = isShowName;
        cc.isValid(this.skillNameLb) && (this.skillNameLb.node.active = isShowName);
        this.refreshView(iconName);
    }

    deInit () {
        if(this._spriteLoader) {
            this._spriteLoader.release();
        }
    }

    refreshView(iconName: string) {
        // changeId
        let isAbsPath = iconName.includes('/');
        let path = isAbsPath ? iconName : resPathUtils.getSkillIconUrl(iconName);
        let changeCfg = configUtils.getSkillChangeConfig(this._skillId);
        if(changeCfg) {
            cc.isValid(this.skillNameLb) && (this.skillNameLb.string = changeCfg.Title);
            this._spriteLoader.changeSprite(this.skillIconSp, path);
        } else {
            let skillCfg: cfg.Skill = configUtils.getSkillConfig(this._skillId);
            if(skillCfg) {
                cc.isValid(this.skillNameLb) && (this.skillNameLb.string = `${skillCfg.Name}`);
                this._spriteLoader.changeSprite(this.skillIconSp, path);
            } else {
                logger.warn(`${this._skillId}不存在技能配置 也不存在change配置`);
                cc.isValid(this.skillNameLb) && (this.skillNameLb.node.active = false);
                return;
            }
        }
    }

    refreshSelect(skillId: number) {
        this.selectBg.active = skillId == this._skillId;
    }

    onClickSkillItem() {
        if(this._clickHandler) {
            this._clickHandler(this._skillId);
        }
    }
}
