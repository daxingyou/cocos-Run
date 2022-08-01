import { ALLTYPE_TYPE, HEAD_ICON } from "../../../app/AppEnums";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import HeroSkillView from "../view-hero/HeroSkillView";
import PreinstallRoleItem from "../view-preinstall/PreinstallRoleItem";

const {ccclass, property} = cc._decorator;

@ccclass
export default class TipsMonster extends ViewBaseComponent {
    @property(cc.Sprite)                headIcon: cc.Sprite = null;
    @property(cc.Label)                 monsterName: cc.Label = null;
    @property(cc.Sprite)                abilityIcon: cc.Sprite = null;
    @property(cc.Label)                 lv: cc.Label = null;
    @property(cc.Label)                 attack: cc.Label = null;
    @property(cc.Label)                 defend: cc.Label = null;
    @property(cc.Label)                 hp: cc.Label = null;
    @property(cc.Label)                 speed: cc.Label = null;
    @property(cc.Node)                  monsterModel: cc.Node = null;
    @property(cc.Prefab)                itemModelPfb: cc.Prefab = null;
    @property(HeroSkillView)            heroSkillView: HeroSkillView = null;
    @property(cc.Node)                  passSkillNode: cc.Node = null;

    private _monsterId: number = 0;
    private _modelArr: PreinstallRoleItem[] = null;
    private _spriteLoader = new SpriteLoader();
    onInit(monsterId: number) {
        this._monsterId = monsterId;
        this._refreshView();
    }

    onRelease() {
        this._modelArr && this._modelArr.forEach(ele => {
            cc.isValid(ele) && ele.deInit(true);
        });
        this._modelArr = null;

        this._spriteLoader.release();
        this.heroSkillView.onRelease();
    }

    private _refreshView() {
        let monsterCfg: cfg.Monster = configUtils.getMonsterConfig(this._monsterId);
        this.monsterName.string = `${monsterCfg.Name}`;
        this.attack.string = `${monsterCfg.Attack}`;
        this.defend.string = `${monsterCfg.Defend}`;
        this.hp.string = `${monsterCfg.Hp}`;
        this.speed.string = `${monsterCfg.Speed}`;
        // 模型
        let monsterModel: cc.Node = cc.instantiate(this.itemModelPfb);
        this.monsterModel.addChild(monsterModel);
        let roleComp = monsterModel.getComponent(PreinstallRoleItem);
        this._modelArr = this._modelArr || [];
        this._modelArr.push(roleComp);
        roleComp.setData(monsterCfg.MonsterId);

        //定位
        let heroAbilityAllTypeConfig = configUtils.getAllTypeConfig(ALLTYPE_TYPE.HERO_ABILITY, monsterCfg.MonsterType);
        this._spriteLoader.changeSprite(this.abilityIcon, resPathUtils.getHeroAllTypeIconUrl(heroAbilityAllTypeConfig.HeroTypeIcon));

        this._spriteLoader.changeSpriteP(this.headIcon, resPathUtils.getItemIconPath(monsterCfg.MonsterId, HEAD_ICON.CIRCLE));

        this.heroSkillView.onInit(this._monsterId, null, true);

        if (this.heroSkillView.basicSkillNode.active) {
            this.passSkillNode.y = -76.784
        } else {
            this.passSkillNode.y = 53.466
        }
    }
}
