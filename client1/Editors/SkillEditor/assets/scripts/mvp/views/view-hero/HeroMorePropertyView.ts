import { data } from "../../../network/lib/protocol";
import { HeroProperty } from "../../models/HeroData";
import { utils } from "../../../app/AppUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";

const { ccclass, property } = cc._decorator;

@ccclass
export default class HeroMorePropertyView extends ViewBaseComponent {
    @property({ type: cc.Node }) morePropertyParent: cc.Node = null;

    private _heroProperConfig: HeroProperty = null;
    private _heroUnitConfig: data.IBagUnit = null;
    onInit(heroUnit: data.IBagUnit, heroPropertyConfig: HeroProperty) {
        this._heroUnitConfig = heroUnit;
        this._heroProperConfig = heroPropertyConfig;
        // console.log('HeroAddPropertyView onInit heroPropertyConfig:', heroPropertyConfig);
        this.refreshView();
    }

    refreshView() {
        let basicProperty: string = '0';
        let addProperty: string = '0';
        // todo 得到装备附加信息
        for (let i = 0; i < 6; ++i) {
            let nameLb: cc.Label = this.morePropertyParent.children[i].getComponent(cc.Label);
            let propertyLb: cc.Label = this.morePropertyParent.children[i].children[0].getComponent(cc.Label);
            switch (i) {
                case 0:
                    basicProperty = utils.parseStingList(this._heroProperConfig.Attack)[this._heroUnitConfig.HeroUnit.Star - 1];
                    addProperty = utils.parseStingList(this._heroProperConfig.AttackAdd)[this._heroUnitConfig.HeroUnit.Star - 1];
                    nameLb.string = '攻击：';
                    break;
                case 1:
                    basicProperty = utils.parseStingList(this._heroProperConfig.Defend)[this._heroUnitConfig.HeroUnit.Star - 1];
                    addProperty = utils.parseStingList(this._heroProperConfig.DefendAdd)[this._heroUnitConfig.HeroUnit.Star - 1];
                    nameLb.string = '防御：';
                    break;
                case 2:
                    basicProperty = utils.parseStingList(this._heroProperConfig.Hp)[this._heroUnitConfig.HeroUnit.Star - 1];
                    addProperty = utils.parseStingList(this._heroProperConfig.HpAdd)[this._heroUnitConfig.HeroUnit.Star - 1];
                    nameLb.string = '血量：';
                    break;
                case 3:
                    basicProperty = utils.parseStingList(this._heroProperConfig.Critical)[this._heroUnitConfig.HeroUnit.Star - 1];
                    addProperty = utils.parseStingList(this._heroProperConfig.CriticalAdd)[this._heroUnitConfig.HeroUnit.Star - 1];
                    nameLb.string = '暴击：';
                    break;
                case 4:
                    basicProperty = utils.parseStingList(this._heroProperConfig.CriticalHarm)[this._heroUnitConfig.HeroUnit.Star - 1];
                    addProperty = utils.parseStingList(this._heroProperConfig.CriticalHarmAdd)[this._heroUnitConfig.HeroUnit.Star - 1];
                    nameLb.string = '暴击伤害：';
                    break;
                case 5:
                    basicProperty = utils.parseStingList(this._heroProperConfig.Speed)[this._heroUnitConfig.HeroUnit.Star - 1];
                    addProperty = utils.parseStingList(this._heroProperConfig.SpeedAdd)[this._heroUnitConfig.HeroUnit.Star - 1];
                    nameLb.string = '速度：';
                    break;
                default:
                    break;
            }
            propertyLb.string = `${basicProperty}+${addProperty}`;
        }
    }
}
