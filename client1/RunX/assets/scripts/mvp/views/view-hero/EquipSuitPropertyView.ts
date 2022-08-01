import { utils } from "../../../app/AppUtils";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { data } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { Equip } from "../../template/Equip";
import HeroUnit from "../../template/HeroUnit";

const {ccclass, property} = cc._decorator;

@ccclass
export default class EquipSuitPropertyView extends cc.Component {

    @property(cc.Node)              suitPart: cc.Node = null;
    @property(cc.Node)              twoSuit: cc.Node = null;
    @property(cc.Node)              fourSuit: cc.Node = null;
    @property(cc.Node)              suitDescTempalete: cc.Node = null;

    private _equip: data.IBagUnit = null;
    private _heroId: number = 0;

    setData(equip: data.IBagUnit, heroId: number) {
        this._equip = equip;
        this._heroId = heroId;
        this.refreshView();
    }

    refreshView() {
        let heroUnit: HeroUnit = bagData.getHeroById(this._heroId);
        let isDressed: boolean = this.checkIsDressed(heroUnit);
        this.node.active = isDressed;
        if(!isDressed) return;
        let suitInfo = heroUnit.getSuitInfoByEquip(this._equip.ID);
        if (suitInfo.suitId == 0) {
            this.node.active = false;
            return;
        }
        let suitCfg = configUtils.getEquipSuitConfig(suitInfo.suitId);
        if (!suitCfg) {
            this.node.active = false;
            return;
        }
        this.node.active = true;
        let activeColor = cc.Color.fromHEX(cc.color(), 'FFC41C');
        let notActiveColor = cc.Color.fromHEX(cc.color(), 'BC9D87');
        this.suitPart.children.forEach(part => {
            part.active = false;
        });

        let equip = new Equip(this._equip);
        let sultCfg = equip.getSultSkillCfg();
        let starLv = 0;
        for (let i = 0; i < sultCfg.equips.length; ++i) {
            let part = this.suitPart.children[i];
            let needEquipId = sultCfg.equips[i];
            let equipCfg = configUtils.getEquipConfig(needEquipId);
            let equipInfo = heroUnit.getHeroEquipById(needEquipId);
            equipInfo && (starLv += equipInfo.EquipUnit.Star || 0)
            part.getComponent(cc.Label).string = equipCfg.EquipName;
            let isDressed = this.checkEquipIsDressed(needEquipId, heroUnit);
            let color = isDressed ? activeColor : notActiveColor;
            part.color = color;
            part.active =  true;
        }
        let suitCount: number = suitInfo.suitCount;

        this.fourSuit.active = sultCfg.fourPartSkills && sultCfg.fourPartSkills.length > 0;
        this.twoSuit.active = sultCfg.twoPartSkills && sultCfg.twoPartSkills.length > 0;

        let createDesc = (desc: string, star: number, parentNode: cc.Node, color: cc.Color) => {
            (!desc || desc.length == 0) && (desc = '暂未配置');
            let node = cc.instantiate(this.suitDescTempalete);
            node.color = color;
            let lvComp = node.getChildByName('lv').getComponent(cc.Label);
            lvComp.string = `${star}星`;
            lvComp.node.color = color;
            node.active = true;
            node.getComponent(cc.Label).string = desc;
            node.parent = parentNode;
        }

        let initstar = bagDataUtils.getEquipBeginStar(equip.equipCfg);
        sultCfg.twoPartSkills.forEach((ele, idx) => {
            let desc: string = '';
            let color = notActiveColor;
            let star = 0;
            if(idx == 0){
                star = initstar * 2;
                suitCount >= 2 && (color = activeColor);
                desc = configUtils.getSkillConfig(ele as number).Illustrate;
            }else{
                suitCount >= 2 && sultCfg.twoPartLevels && sultCfg.twoPartLevels[idx - 1] && starLv >= sultCfg.twoPartLevels[idx - 1]
                    && (color = activeColor);
                star = sultCfg.twoPartLevels[idx - 1];
                if(typeof ele == 'number') {
                    desc = configUtils.getSkillChangeConfig(ele).Desc;
                } else {
                    ele.forEach(changeID => {
                        desc.length > 0 && (desc = `${desc}；`);
                        desc = `${desc}${configUtils.getSkillChangeConfig(changeID).Desc}`;
                    });
                }
            }

            createDesc(desc, star, this.twoSuit, color);
        });

        sultCfg.fourPartSkills.forEach((ele, idx) => {
            let desc: string = '';
            let color = notActiveColor;
            let star = 0;
            if(idx == 0){
                star = initstar * 4;
                suitCount >= 4 && (color = activeColor);
                desc = configUtils.getSkillConfig(ele as number).Illustrate;
            }else{
                suitCount >= 4 && sultCfg.fourPartLevels && sultCfg.fourPartLevels[idx - 1] && starLv >= sultCfg.fourPartLevels[idx - 1]
                    && (color = activeColor);
                star = sultCfg.fourPartLevels[idx - 1];
                if(typeof ele == 'number') {
                    desc = configUtils.getSkillChangeConfig(ele).Desc;
                } else {
                    ele.forEach(changeID => {
                        desc.length > 0 && (desc = `${desc}；`);
                        desc = `${desc}${configUtils.getSkillChangeConfig(changeID).Desc}`;
                    });
                }
            }
            createDesc(desc, star, this.fourSuit, color);
        });
    }

    checkIsDressed(heroUnit: HeroUnit) {
        if(heroUnit && heroUnit.isHeroBasic) {
            const equips = heroUnit.hero.Equips;
            for(const k in equips) {
                let equip = equips[k];
                if(equip.ID == this._equip.ID && utils.longToNumber(equip.Seq) == utils.longToNumber(this._equip.Seq)) {
                    return true;
                }
            }
        }
        return false;
    }

    checkEquipIsDressed(equipId: number, heroUnit: HeroUnit) {
        return bagDataUtils.checkEquipDressedByHero(equipId, heroUnit);
    }
}
