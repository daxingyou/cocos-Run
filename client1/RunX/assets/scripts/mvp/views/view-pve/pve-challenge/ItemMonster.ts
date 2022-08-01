import { SCENE_NAME } from "../../../../app/AppConst";
import { HEAD_ICON, PVE_MODE } from "../../../../app/AppEnums";
import { PveConfig } from "../../../../app/AppType";
import { battleUtils } from "../../../../app/BattleUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import { resPathUtils } from "../../../../app/ResPathUrlUtils";
import { configManager } from "../../../../common/ConfigManager";
import guiManager from "../../../../common/GUIManager";
import { SpriteLoader } from "../../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../../config/config";
import { data } from "../../../../network/lib/protocol";
import { pveData } from "../../../models/PveData";
import { pveTrialData } from "../../../models/PveTrialData";
import HeroUnit from "../../../template/HeroUnit";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemMonster extends cc.Component {

    @property([cc.SpriteFrame]) frameBgSps: cc.SpriteFrame[] = [];
    @property([cc.SpriteFrame]) frameSps: cc.SpriteFrame[] = [];

    @property(cc.Sprite) frameBg: cc.Sprite = null;
    @property(cc.Sprite) img: cc.Sprite = null;
    @property(cc.Label) enemyName: cc.Label = null;
    @property(cc.Label) power: cc.Label = null;
    @property(cc.ProgressBar) hpBar: cc.ProgressBar = null;
    @property(cc.Sprite) frame: cc.Sprite = null;

    private _spriteLoader: SpriteLoader = new SpriteLoader();

    private _clickHandler: Function = null;

    onInit(monsterInfo: data.ITrialRoleInfo, clickHandler: Function) {
        let monsterConfig: cfg.Monster = configManager.getConfigByKey("monster", monsterInfo.ID);
        let heroID: number = monsterConfig.NoumenonID;
        let heroConfig: cfg.HeroBasic = configUtils.getHeroBasicConfig(heroID);
        let quality: number = heroConfig.HeroBasicQuality;
        if ([3, 4, 5].indexOf(quality) === -1) {
            quality = 3;
        }
        this.frameBg.spriteFrame = this.frameBgSps[quality-3];
        this.frame.spriteFrame = this.frameSps[quality-3];

        let monsterRes: string = resPathUtils.getHeroCircleHeadIcon(monsterConfig.ModelId, HEAD_ICON.BIG);
        this._spriteLoader.changeSprite(this.img, monsterRes);

        this.enemyName.string = monsterConfig.Name;

        this.power.string = `战力：${battleUtils.getMonsterPower(monsterInfo.ID)}`;

        this.hpBar.progress = monsterInfo.HPPercent / 10000;

        this._clickHandler = clickHandler;
    }

    deInit() {
        this._spriteLoader.release();
    }

    onClickItem() {
        this._clickHandler != null && (this._clickHandler());
    }
}
