import { Hero_Ability_Max, VIEW_NAME } from "../../../app/AppConst";
import { ALLTYPE_TYPE, HERO_PROP } from "../../../app/AppEnums";
import { utils } from "../../../app/AppUtils";
import { battleUtils } from "../../../app/BattleUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import guiManager from "../../../common/GUIManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { bagData } from "../../models/BagData";
import { pveFakeData } from "../../models/PveFakeData";
import HeroUnit from "../../template/HeroUnit";
import HeroSkillView from "./HeroSkillView";

const enum FIVE_PROP_TYPE {
    ATTACK,
    DEFEND,
    CONTROL,
    SUPPORT,
    TREAT
}

const {ccclass, property} = cc._decorator;

@ccclass
export default class HeroPropertyView extends cc.Component {
    @property(HeroSkillView)            heroSkillView: HeroSkillView = null;
    @property([cc.Node])                abilityBtsNodes: cc.Node[] = [];
    @property(cc.Node)                  abilityGraphicsParent: cc.Node = null;
    @property([cc.Node])                propertyLBs: cc.Node[] = []
    @property([cc.Sprite])              heroBasicPropertyLevelIconList: cc.Sprite[] = [];
    @property(cc.Mask)                  mask: cc.Mask = null;
    @property(cc.Label)                 powerLB: cc.Label = null;

    private _heroId: number = 0;
    private _heroUnit: HeroUnit = null;
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _loadView: Function = null;
    onInit(heroId: number, loadView?: Function) {
        this._heroId = heroId;
        this._loadView = loadView;

        let isFake = pveFakeData.fakeHero.hasOwnProperty(heroId);
        //暂时只为了展示空英雄保留
        isFake && (this._heroId = pveFakeData.fakeHero[heroId].Array[0].ID);
        this._heroUnit = isFake ? pveFakeData.getFakeHeroById(heroId) : bagData.getHeroById(heroId);

        let commonInfoNode = cc.find('commonInfo', this.node.parent);
        cc.isValid(commonInfoNode) && (commonInfoNode.active = true);
        this.refreshView();
        this.heroSkillView.onInit(this._heroId, loadView);
    }

    //这个东西待定,
    private _addUIListeners() {
        /** 策划想要的功能 */
        // 输出
        let attackText: string = this.getHero5PropertyAllTypeConfig(FIVE_PROP_TYPE.ATTACK).HeroTypeText;
        if (attackText) {
            this.abilityBtsNodes[FIVE_PROP_TYPE.ATTACK].targetOff(this);
            this.abilityBtsNodes[FIVE_PROP_TYPE.ATTACK].on(cc.Node.EventType.TOUCH_END, () => {
                this._showTipsMessage(attackText);
            }, this);
        }
        // 承伤
        let defendText: string = this.getHero5PropertyAllTypeConfig(FIVE_PROP_TYPE.DEFEND).HeroTypeText;
        if (defendText) {
            this.abilityBtsNodes[FIVE_PROP_TYPE.DEFEND].targetOff(this);
            this.abilityBtsNodes[FIVE_PROP_TYPE.DEFEND].on(cc.Node.EventType.TOUCH_END, () => {
                this._showTipsMessage(defendText);
            }, this);
        }
        // 辅助
        let supportText: string = this.getHero5PropertyAllTypeConfig(FIVE_PROP_TYPE.SUPPORT).HeroTypeText;
        if (supportText) {
            this.abilityBtsNodes[FIVE_PROP_TYPE.SUPPORT].targetOff(this);
            this.abilityBtsNodes[FIVE_PROP_TYPE.SUPPORT].on(cc.Node.EventType.TOUCH_END, () => {
                this._showTipsMessage(supportText);
            }, this);
        }
        // 控制
        let controlText: string = this.getHero5PropertyAllTypeConfig(FIVE_PROP_TYPE.CONTROL).HeroTypeText;
        if (controlText) {
            this.abilityBtsNodes[FIVE_PROP_TYPE.CONTROL].targetOff(this);
            this.abilityBtsNodes[FIVE_PROP_TYPE.CONTROL].on(cc.Node.EventType.TOUCH_END, () => {
                this._showTipsMessage(controlText);
            }, this);
        }
        // 治疗
        let treatText: string = this.getHero5PropertyAllTypeConfig(FIVE_PROP_TYPE.TREAT).HeroTypeText;
        if (treatText) {
            this.abilityBtsNodes[FIVE_PROP_TYPE.TREAT].targetOff(this);
            this.abilityBtsNodes[FIVE_PROP_TYPE.TREAT].on(cc.Node.EventType.TOUCH_END, () => {
                this._showTipsMessage(treatText);
            }, this);
        }
    }

    deInit() {
        if(this._spriteLoader) {
            this._spriteLoader.release();
        }
        this.heroSkillView.onRelease();
        eventCenter.unregisterAll(this);
        this.abilityBtsNodes.forEach(_c => {
            _c.targetOff(this);
        });
    }

    onRelease() {
        this.deInit();
    }

    refreshView() {
        this._set5DimensionGraph();
        this._setHeroBasicView();
        this.heroSkillView.refreshView();
    }

    private _set5DimensionGraph() {
        this.mask.node.parent.active = true;
        let heroBasicConfig: cfg.HeroBasic = configUtils.getHeroBasicConfig(this._heroId);;
        // 根据五维图 绘制
        let abilityList = utils.parseStingList(heroBasicConfig.HeroBasicCapabilityMap);
        let curPos: cc.Vec3;
        let poses: cc.Vec2[] = [];
        for (let i = 0; i < this.abilityGraphicsParent.childrenCount; ++i) {
            let ability = abilityList[i];
            curPos = this.abilityGraphicsParent.children[i].position.mul(Number(ability) / Hero_Ability_Max);
            poses.push(cc.v2(curPos));
        }
        //@ts-ignore
        this.mask._updateGraphics = () => {
            //@ts-ignore
            let graphics = this.mask._graphics;
            if(!graphics) {
                return;
            }
            graphics.clear(false);
            graphics.lineWidth = 1;
            graphics.fillColor.fromHEX('#ff0000');
            graphics.lineJoin = cc.Graphics.LineJoin.ROUND;
            graphics.lineCap = cc.Graphics.LineCap.BUTT;
            graphics.moveTo(poses[0].x, poses[0].y);
            for(let i = 0; i < poses.length; ++i) {
                graphics.lineTo(poses[i].x, poses[i].y);
            }
            graphics.close();
            graphics.stroke();
            graphics.fill();
        }
        //@ts-ignore
        this.mask._updateGraphics();
    }

    private _setHeroBasicView() {
        // 星星数的显示
        let heroUnit: HeroUnit = new HeroUnit(this._heroId, this._heroUnit && this._heroUnit.fakeId);
        this.powerLB.string = `战力：${heroUnit.getCapability()}`;
        // 四维属性
        let basicNum: number = 0;
        let addNum: number = 0;
        let basicProperty = heroUnit.getHeroBasicProperty();
        let equipAddProperty = heroUnit.getHeroEquipsAddProperty();
        let giftAddProperty = heroUnit.getGiftAddProperty();
        let pragmaticAddProperty = heroUnit.getPragmaticAddProperty();
        let treasureProps = heroUnit.getTreasureAddProps();
        let wuDaoProp = heroUnit.getWuDaoAddProps();

        let attributeCfgs: {[k: number]: cfg.Attribute} = configManager.getConfigs('attribute');
        let getPropNameFunc = (prop: HERO_PROP): string => {
            return attributeCfgs[prop].Name;
        }
        for (let i = 0; i < this.propertyLBs.length; ++i) {
            let heroBasicPropertyLevelIcon: cc.Sprite = this.heroBasicPropertyLevelIconList[i];
            let propName: cc.Node = this.propertyLBs[i].children[0];
            let propBasic: cc.Node = this.propertyLBs[i].children[1];
            let propAdd: cc.Node = this.propertyLBs[i].children[2];
            if (i == 0) {
                basicNum = basicProperty.Attack;
                addNum = equipAddProperty.attack + equipAddProperty.green.Attack + (equipAddProperty.castSoul[HERO_PROP.BASE_ATTACK] || 0)
                + ((equipAddProperty.beast && equipAddProperty.beast[HERO_PROP.BASE_ATTACK]) || 0)
                + (giftAddProperty[HERO_PROP.BASE_ATTACK] | 0) + ((pragmaticAddProperty[HERO_PROP.BASE_ATTACK]) || 0);
                if(treasureProps.has(HERO_PROP.BASE_ATTACK)){
                    let propValue = treasureProps.get(HERO_PROP.BASE_ATTACK);
                    addNum += propValue;
                }
                wuDaoProp && wuDaoProp.has(HERO_PROP.BASE_ATTACK) && (addNum += wuDaoProp.get(HERO_PROP.BASE_ATTACK));

                let equipCastSoulPro = (equipAddProperty.castSoul[HERO_PROP.BASE_ATTACK_PCT] || 0);
                let beastProp = ((equipAddProperty.beast && equipAddProperty.beast[HERO_PROP.BASE_ATTACK_PCT]) || 0);
                let attackAddPct = equipAddProperty.green.AttackPercent + equipCastSoulPro + beastProp
                    + (giftAddProperty[HERO_PROP.BASE_ATTACK_PCT] || 0)
                    + (pragmaticAddProperty[HERO_PROP.BASE_ATTACK_PCT] || 0);
                if(treasureProps.has(HERO_PROP.BASE_ATTACK_PCT)){
                    let propValue = treasureProps.get(HERO_PROP.BASE_ATTACK_PCT) * 100;
                    attackAddPct += propValue;
                }
                wuDaoProp && wuDaoProp.has(HERO_PROP.BASE_ATTACK_PCT) && (attackAddPct += wuDaoProp.get(HERO_PROP.BASE_ATTACK_PCT));

                addNum += Math.floor(basicNum * attackAddPct / 10000);
                propName.getComponent(cc.Label).string = getPropNameFunc(HERO_PROP.BASE_ATTACK);
            } else if (i == 1) {
                basicNum = basicProperty.Defend;
                addNum = equipAddProperty.defend + equipAddProperty.green.Defend + (equipAddProperty.castSoul[HERO_PROP.DEFEND] || 0)
                + ((equipAddProperty.beast && equipAddProperty.beast[HERO_PROP.DEFEND]) || 0)
                + (giftAddProperty[HERO_PROP.DEFEND] || 0) + (pragmaticAddProperty[HERO_PROP.DEFEND] || 0);
                if(treasureProps.has(HERO_PROP.DEFEND)){
                    let propValue = treasureProps.get(HERO_PROP.DEFEND);
                    addNum += propValue;
                }
                wuDaoProp && wuDaoProp.has(HERO_PROP.DEFEND) && (addNum += wuDaoProp.get(HERO_PROP.DEFEND));

                let equipCastSoulPro = (equipAddProperty.castSoul[HERO_PROP.DEFEND_PCT] || 0);
                let beastPro = ((equipAddProperty.beast && equipAddProperty.beast[HERO_PROP.DEFEND_PCT]) || 0);
                let defendAddPct = equipAddProperty.green.DefendPercent + equipCastSoulPro + beastPro;
                    + (giftAddProperty[HERO_PROP.DEFEND_PCT] || 0)
                    + (pragmaticAddProperty[HERO_PROP.DEFEND_PCT] || 0);
                if(treasureProps.has(HERO_PROP.DEFEND_PCT)){
                    let propValue = treasureProps.get(HERO_PROP.DEFEND_PCT) * 100;
                    defendAddPct += propValue;
                }
                wuDaoProp && wuDaoProp.has(HERO_PROP.DEFEND_PCT) && (defendAddPct += wuDaoProp.get(HERO_PROP.DEFEND_PCT));
                addNum += Math.floor(basicNum * defendAddPct / 10000);

                propName.getComponent(cc.Label).string = getPropNameFunc(HERO_PROP.DEFEND);
            } else if (i == 2) {
                basicNum = basicProperty.Hp;
                addNum = equipAddProperty.hp + equipAddProperty.green.Hp + (equipAddProperty.castSoul[HERO_PROP.MAX] || 0)
                + ((equipAddProperty.beast && equipAddProperty.beast[HERO_PROP.MAX]) || 0)
                + (giftAddProperty[HERO_PROP.MAX] || 0) + (pragmaticAddProperty[HERO_PROP.MAX] || 0);
                if(treasureProps.has(HERO_PROP.MAX)){
                    let propValue = treasureProps.get(HERO_PROP.MAX);
                    addNum += propValue;
                }
                wuDaoProp && wuDaoProp.has(HERO_PROP.MAX) && (addNum += wuDaoProp.get(HERO_PROP.MAX));

                let equipCastSoulPro = (equipAddProperty.castSoul[HERO_PROP.HP_PCT] || 0);
                let beastPro = ((equipAddProperty.beast && equipAddProperty.beast[HERO_PROP.HP_PCT]) || 0);
                let hpAddPct = (equipAddProperty.green.HpPercent || 0) + equipCastSoulPro + beastPro
                  + (giftAddProperty[HERO_PROP.HP_PCT] || 0) + (pragmaticAddProperty[HERO_PROP.HP_PCT] || 0);
                if(treasureProps.has(HERO_PROP.HP_PCT)){
                    let propValue = treasureProps.get(HERO_PROP.HP_PCT) * 100;
                    hpAddPct += propValue;
                }
                wuDaoProp && wuDaoProp.has(HERO_PROP.HP_PCT) && (hpAddPct += wuDaoProp.get(HERO_PROP.HP_PCT));
                addNum += Math.floor(basicNum * hpAddPct / 10000);

                propName.getComponent(cc.Label).string = getPropNameFunc(HERO_PROP.MAX);
            } else {
                basicNum = basicProperty.Speed;
                addNum = equipAddProperty.yellow.Speed + (equipAddProperty.castSoul[HERO_PROP.SPEED] || 0)
                + ((equipAddProperty.beast && equipAddProperty.beast[HERO_PROP.SPEED]) || 0)
                + (giftAddProperty[HERO_PROP.SPEED] || 0) + (pragmaticAddProperty[HERO_PROP.SPEED] || 0);
                if(treasureProps.has(HERO_PROP.SPEED)){
                    let propValue = treasureProps.get(HERO_PROP.SPEED);
                    addNum += propValue;
                }
                wuDaoProp && wuDaoProp.has(HERO_PROP.SPEED) && (addNum += wuDaoProp.get(HERO_PROP.SPEED));

                let equipCastSoulPro = (equipAddProperty.castSoul[HERO_PROP.SPEED_PCT] || 0);
                let beastPro = ((equipAddProperty.beast && equipAddProperty.beast[HERO_PROP.SPEED_PCT]) || 0);
                let speedAddPct = equipCastSoulPro + beastPro + (giftAddProperty[HERO_PROP.SPEED_PCT] || 0) + (pragmaticAddProperty[HERO_PROP.SPEED_PCT] || 0);
                if(treasureProps.has(HERO_PROP.SPEED_PCT)){
                    let propValue = treasureProps.get(HERO_PROP.SPEED_PCT) * 100;
                    speedAddPct += propValue;
                }
                wuDaoProp && wuDaoProp.has(HERO_PROP.SPEED_PCT) && (speedAddPct += wuDaoProp.get(HERO_PROP.SPEED_PCT));

                addNum += Math.floor(basicNum * speedAddPct / 10000);
                propName.getComponent(cc.Label).string = getPropNameFunc(HERO_PROP.SPEED);
            }
            let basicPropertyLevelIconUrl: string = configUtils.getAllTypeConfig(ALLTYPE_TYPE.HERP_PROP_LEVEL, this.getPropertyLevel(this._heroId, i)).HeroTypeIcon;
            let propLevelIconUrl = resPathUtils.getHeroAllTypeIconUrl(basicPropertyLevelIconUrl);
            this._spriteLoader.changeSprite(heroBasicPropertyLevelIcon, propLevelIconUrl);
            propBasic.getComponent(cc.Label).string = `${basicNum}`;
            propAdd.active = addNum > 0;
            if(addNum > 0) {
                propAdd.getComponent(cc.Label).string = `+${addNum}`;
            }
        }
    }

    private _showTipsMessage(content: string) {

    }

    onClickMorePropertyBtn() {
        if(this._loadView) {
            this._loadView(VIEW_NAME.HERO_MOREPROPERTY_VIEW, 2, this._heroId);
        } else {
            guiManager.loadView(VIEW_NAME.HERO_MOREPROPERTY_VIEW, guiManager.sceneNode, this._heroId);
        }
    }

    getHero5PropertyAllTypeConfig(propertyType: number) {
        return configUtils.getAllTypeConfig(4, propertyType + 1)
    }

    getPropertyLevel(heroId: number, propertyType: number) {
        let cfgs = configUtils.getHeroBasicConfig(heroId);
        let propertyList = utils.parseStingList(cfgs.HeroBasicPropertyLevel);
        return Number(propertyList[propertyType])
    }
}
