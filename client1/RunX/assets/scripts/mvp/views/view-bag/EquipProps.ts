import { VIEW_NAME } from "../../../app/AppConst";
import { HERO_PROP, HERO_PROP_MAP, EQUIP_PART_TYPE } from "../../../app/AppEnums";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { data } from "../../../network/lib/protocol";
import { bagData, EquipProp } from "../../models/BagData"
import guiManager from "../../../common/GUIManager";
import RichTextEx from "../../../common/components/rich-text/RichTextEx";
import { uiHelper } from "../../../common/ui-helper/UIHelper";
import { Equip } from "../../template/Equip";
import { EquipAttr } from "../../../app/AppType";
import HeroUnit from "../../template/HeroUnit";
const { ccclass, property } = cc._decorator;
const FULL_PERCENT = 10000;
enum INFO_TYPE {
    GREEN,
    YELLOW
}
const ACTIVE_SUIT = '#D95D24';
const NON_ACTIVE_SUIT = '#BC9D87';

@ccclass
export default class EquipProps extends cc.Component {
    @property(cc.Node) basicNode: cc.Node = null;       //白属性
    @property(cc.Node) specialNode: cc.Node = null;     //绿属性
    @property(cc.Node) skillNode: cc.Node = null;       //黄属性
    @property(cc.Node) spiritNode: cc.Node = null;      //铸魂属性
    @property(cc.Node) tmpSpecialNode: cc.Node = null;  //绿模板
    @property(cc.Node) tmpSkillNode: cc.Node = null;    //黄模板
    @property(cc.Node) descTemplate: cc.Node = null;    //描述文本模板
    @property(cc.Node) descWithLvTemplate: cc.Node = null;  //带等级的描述文本模板
    @property(cc.Node) suitNode: cc.Node = null;        //套装
    @property(cc.Node) suitContainorNode: cc.Node = null;    //套装名称容器模板
    @property(cc.Node) parent: cc.Node = null;          //父节点

    private nodeStack: cc.Node[] = new Array<cc.Node>();
    private _equipData: data.IBagUnit = null;

    set equipData(val: data.IBagUnit) {
        this._equipData = val;
    }

    updateInfo(propList: EquipProp, newPropList?: EquipProp) {
        this.clear();
        //白属性
        if (newPropList && newPropList.white) {
            let whiteProp = propList.white;
            let newWhiteProp = newPropList.white;
            let attakNode = this.basicNode.getChildByName("title_attack");
            let defenceNode = this.basicNode.getChildByName("title_defence");
            let hpNode = this.basicNode.getChildByName("title_hp");
            let attackCfg = configUtils.getAttributeCfg("Attack");
            let defendCfg = configUtils.getAttributeCfg("Defend");
            let hpCfg = configUtils.getAttributeCfg("Hp");
            whiteProp.Attack && (attakNode.getComponentInChildren(RichTextEx).string = String(whiteProp.Attack));
            whiteProp.Defend && (defenceNode.getComponentInChildren(RichTextEx).string = String(whiteProp.Defend));
            whiteProp.Hp && (hpNode.getComponentInChildren(RichTextEx).string = String(whiteProp.Hp));
            if (newWhiteProp.Attack != whiteProp.Attack) {
                attakNode.getComponentInChildren(RichTextEx).string = `${whiteProp.Attack} -> <color=#e9822d>${newWhiteProp.Attack}</c>`;
            }
            if (newWhiteProp.Defend != whiteProp.Defend) {
                defenceNode.getComponentInChildren(RichTextEx).string = `${whiteProp.Defend} -> <color=#e9822d>${newWhiteProp.Defend}</c>`;
            }
            if (newWhiteProp.Hp != whiteProp.Hp) {
                hpNode.getComponentInChildren(RichTextEx).string = `${whiteProp.Hp} -> <color=#e9822d>${newWhiteProp.Hp}</c>`;
            }

            attackCfg && (attakNode.getComponent(RichTextEx).string = attackCfg.Name);
            defendCfg && (defenceNode.getComponent(RichTextEx).string = defendCfg.Name);
            hpCfg && (hpNode.getComponent(RichTextEx).string = hpCfg.Name);
            attakNode.active = (newWhiteProp.Attack != 0 || whiteProp.Attack != 0);
            defenceNode.active = (newWhiteProp.Defend != 0 || whiteProp.Defend != 0);
            hpNode.active = (newWhiteProp.Hp != 0 || whiteProp.Hp != 0);
        } else if (propList.white) {
            let whiteProp = propList.white;
            let attakNode = this.basicNode.getChildByName("title_attack");
            let defenceNode = this.basicNode.getChildByName("title_defence");
            let hpNode = this.basicNode.getChildByName("title_hp");
            let attackCfg = configUtils.getAttributeCfg("Attack");
            let defendCfg = configUtils.getAttributeCfg("Defend");
            let hpCfg = configUtils.getAttributeCfg("Hp");
            whiteProp.Attack && (attakNode.getComponentInChildren(RichTextEx).string = String(whiteProp.Attack));
            whiteProp.Defend && (defenceNode.getComponentInChildren(RichTextEx).string = String(whiteProp.Defend));
            whiteProp.Hp && (hpNode.getComponentInChildren(RichTextEx).string = String(whiteProp.Hp));
            attackCfg && (attakNode.getComponent(RichTextEx).string = attackCfg.Name);
            defendCfg &&(defenceNode.getComponent(RichTextEx).string = defendCfg.Name);
            hpCfg && (hpNode.getComponent(RichTextEx).string = hpCfg.Name);
            attakNode.active = (whiteProp.Attack != 0);
            defenceNode.active = (whiteProp.Defend != 0);
            hpNode.active = (whiteProp.Hp != 0);
        }
        //绿属性
        if (newPropList && newPropList.green) {
            let greenProp = bagDataUtils.mergeGreenProp(propList.green || newPropList.green);
            let newGreenProp = bagDataUtils.mergeGreenProp(newPropList.green);
            // newPropList.green.forEach(green => {
            //     // 添加后清理数据避免多次添加，使用遍历保证排序由策划配置
            //     Object.keys(green).forEach((_k) => {
            //         // @ts-ignore
            //         let prop = greenProp[_k]; let newProp = newGreenProp[_k];
            //         let attrCfg = configUtils.getAttributeCfg(_k);
            //         if (attrCfg) {
            //             this.addGreenItem(attrCfg.Name, prop, attrCfg.AttributeValueType == 2, newProp);
            //             // @ts-ignore
            //             newGreenProp[_k] = 0;
            //         }
            //     })
            // })
            Object.keys(newGreenProp).forEach((_k) => {
                // @ts-ignore
                let prop = greenProp[_k]; let newProp = newGreenProp[_k];
                let attrCfg = configUtils.getAttributeCfg(_k);
                if (attrCfg && (prop || newProp)) {
                    this.addGreenItem(attrCfg.Name, prop, attrCfg.AttributeValueType == 2, newProp);
                    // @ts-ignore
                    // newGreenProp[_k] = 0;
                }
            })
        }
        else if (propList.green) {
            let greenProp = bagDataUtils.mergeGreenProp(propList.green);
            // propList.green.forEach(green => {
            //     // 添加后清理数据避免多次添加，使用遍历保证排序由策划配置
            //     Object.keys(green).forEach((_k) => {
            //         // @ts-ignore
            //         let prop = greenProp[_k];
            //         let attrCfg = configUtils.getAttributeCfg(_k);
            //         if (attrCfg) {
            //             this.addGreenItem(attrCfg.Name, prop, attrCfg.AttributeValueType == 2);
            //             // @ts-ignore
            //             greenProp[_k] = 0;
            //         }

            //     })
            // })
            Object.keys(greenProp).forEach((_k) => {
                // @ts-ignore
                let prop = greenProp[_k];
                let attrCfg = configUtils.getAttributeCfg(_k);
                if (attrCfg && prop) {
                    this.addGreenItem(attrCfg.Name, prop, attrCfg.AttributeValueType == 2);
                    // @ts-ignore
                    // greenProp[_k] = 0;
                }

            })
        }
        //黄属性
        if (newPropList && newPropList.yellow) {
            let yellowProp = propList.yellow || newPropList.yellow;
            let newYellowProp = newPropList.yellow;
            Object.keys(newYellowProp).forEach((_k) => {
                // @ts-ignore
                let prop = yellowProp[_k];
                let attrCfg = configUtils.getAttributeCfg(_k);
                if (attrCfg) {
                    this.addYellowItem(attrCfg.Name, prop, attrCfg.AttributeValueType == 2);
                } else if (_k == 'Continuity') {
                    let attrCfg = configUtils.getAttributeCfg(HERO_PROP_MAP[HERO_PROP.DOUBLE_HIT_RATE]);
                    this.addYellowItem(attrCfg.Name, prop, attrCfg.AttributeValueType == 2);
                }
            })
        }
        else if (propList.yellow) {
            let yellowProp = propList.yellow;
            Object.keys(yellowProp).forEach((_k) => {
                // @ts-ignore
                let prop = yellowProp[_k];
                let attrCfg = configUtils.getAttributeCfg(_k);
                if (attrCfg) {
                    this.addYellowItem(attrCfg.Name, prop, attrCfg.AttributeValueType == 2);
                } else if (_k == 'Continuity') {
                    let attrCfg = configUtils.getAttributeCfg(HERO_PROP_MAP[HERO_PROP.DOUBLE_HIT_RATE]);
                    this.addYellowItem(attrCfg.Name, prop, attrCfg.AttributeValueType == 2);
                }
            })
        }

         let equip = new Equip(this._equipData);
        let skillInfo = this._addEquipSkillInfo(equip);
        let suitInfo = this._addSuit(equip);
        let checkWhiteValid = (white: any)=>{
            return white && (white.Attack || white.Defend || white.Hp);
        }
        this.basicNode.active = (propList && checkWhiteValid(propList.white)) || (newPropList && checkWhiteValid(newPropList.white));
        this.specialNode.active = Boolean(propList.green.length) || Boolean(newPropList && newPropList.green.length);
        this.skillNode.active = Boolean(propList.yellow) || Boolean(newPropList && newPropList.yellow) || (skillInfo && skillInfo.length > 0);
        cc.isValid(this.suitNode) && (this.suitNode.active = !!(suitInfo));

        let fadeAction = (nd: cc.Node)=> {
            if (nd) {
                nd.opacity = 1;
                nd.stopAllActions();
                cc.tween(nd).to(0.1, {opacity: 255}, { easing: "sineIn" }).start();
            }
        }

        fadeAction(this.basicNode);
        fadeAction(this.specialNode);
        fadeAction(this.skillNode);
        fadeAction(this.suitNode);
        fadeAction(this.spiritNode);
    }

    //设置装备的技能
    private _addEquipSkillInfo(equip : Equip): (number|number[])[]{
        if(!equip) return null;
        let isSuit = equip.equipCfg.SuitId && equip.equipCfg.SuitId > 0;
        let isPart = equip.equipCfg.PositionType != EQUIP_PART_TYPE.EXCLUSIVE;
        let equipSKill = isPart ? equip.equipCfg.GeneralAddSkill : equip.equipCfg.ExclusiveAddSkill;
        let skillInfo = isSuit ? null : (isPart ? equip.getPartSKill() : equip.getExclusiveSKill());
        let activeColor = cc.Color.fromHEX(cc.color(), ACTIVE_SUIT);
        let notActiveColor = cc.Color.fromHEX(cc.color(), NON_ACTIVE_SUIT);
         let star = this._equipData.EquipUnit.Star;
        //装备技能
        if(skillInfo && skillInfo.length > 0) {
            skillInfo.forEach((ele, idx) => {
                if(ele == 0) return;
                let itemNode = cc.instantiate(this.descWithLvTemplate);
                let lvComp = itemNode.getChildByName('lv').getComponent(cc.Label);
                itemNode.active = true;
                itemNode.parent = this.skillNode;
                lvComp.node.color = itemNode.color = star >= idx ? activeColor : notActiveColor;
                let desc: string = '';
                if(typeof ele == 'number' && equipSKill == ele){
                    desc = isPart ? configUtils.getBuffConfig(ele).Illustrate : configUtils.getSkillConfig(ele).Illustrate;
                }else{
                    if(typeof ele == 'number'){
                        desc = configUtils.getSkillChangeConfig(ele).Desc;
                    } else {
                        ele.forEach(changeID => {
                            desc.length > 0 && (desc = `${desc}；`);
                            desc = `${desc}${configUtils.getSkillChangeConfig(changeID).Desc}`;
                        });
                    }
                }
                (!desc || desc.length == 0) && (desc = '暂未配置');
                itemNode.getComponent(cc.Label).string = desc;
                lvComp.string = `${idx}星`;
                this.nodeStack.push(itemNode);
            });
        }

        return skillInfo;
    }

    private _addSuit(equip : Equip){
        if(!equip || !equip.equipCfg.SuitId) return null;
        let suitCount: number = 0;
        let suitSkillCfg  = equip.getSultSkillCfg();
        let sultCfg = equip.getSultSkillCfg();
        let starLv = 0;
        let dressedHero = bagDataUtils.checkEquipIsDressed(equip.equipData);
        if(dressedHero){
            let heroUnit: HeroUnit = bagData.getHeroById(dressedHero);
            let suitInfo = heroUnit.getSuitInfoByEquip(equip.equipData.ID);
            suitInfo && suitInfo.suitId != 0 && (suitCount = suitInfo.suitCount);
            for (let i = 0; i < sultCfg.equips.length; ++i) {
                let needEquipId = sultCfg.equips[i];
                let equipInfo = heroUnit.getHeroEquipById(needEquipId);
                equipInfo && (starLv += equipInfo.EquipUnit.Star || 0);
            }
        }

        //套装
        if(suitSkillCfg && suitSkillCfg.sultID > 0 && suitSkillCfg.equips && suitSkillCfg.equips.length > 0){
            let suitNode: cc.Node = null;
            suitSkillCfg.equips.forEach((ele, idx) =>{
                let suffix = idx % 2;
                if(suffix == 0){
                    suitNode = cc.instantiate(this.suitContainorNode);
                    suitNode.active = true;
                    suitNode.parent = this.suitNode;
                    this.nodeStack.push(suitNode);
                }
                let node = suitNode.getChildByName('node'+ suffix);
                node.active = true;
                let cfg = configUtils.getEquipConfig(ele)
                let desc = cfg.EquipName;
                node.getComponent(cc.Label).string = desc;
                if (ele == equip.equipCfg.EquipId) {
                    node.color = cc.color().fromHEX(ACTIVE_SUIT)
                } else {
                    node.color = cc.color().fromHEX(NON_ACTIVE_SUIT)
                }
            });

            let createSultSkillDesc = (isMultiDesc: boolean,desc: string, star?: number, color?: string) => {
                let node: cc.Node = null;
                if(isMultiDesc) {
                    node = cc.instantiate(this.descWithLvTemplate);
                    let lvComp = node.getChildByName('lv').getComponent(cc.Label);
                    lvComp.string = `${star}星`;
                    let c = cc.color().fromHEX(color || '#FFFFFF');
                    lvComp.node.color = c;
                    (!desc || desc.length == 0) && (desc = '暂未配置');
                    node.getComponent(cc.Label).string = desc;
                    node.color = c;
                } else {
                    node = cc.instantiate(this.descTemplate);
                    (!desc || desc.length == 0) && (desc = '暂未配置');
                    node.getComponent(cc.Label).string = desc;
                }

                node.active = true;
                node.parent = this.suitNode;
                this.nodeStack.push(node);
                return node;
            }
            let initStar = bagDataUtils.getEquipBeginStar(equip.equipCfg);
            let suit2Title: cc.Node = null, suit4Title : cc.Node = null;
            suitSkillCfg.twoPartSkills && suitSkillCfg.twoPartSkills.forEach((ele, idx) =>{
                if(!cc.isValid(suit2Title)){
                    suit2Title = createSultSkillDesc(false, '2件套装');
                }
                let desc: string = '';
                let star = 0;
                let color = NON_ACTIVE_SUIT;
                if(idx == 0){
                    star =  initStar * 2;
                    suitCount >= 2 && (color = ACTIVE_SUIT);
                    desc =  configUtils.getSkillConfig(ele as number).Illustrate;
                } else {
                    star = suitSkillCfg.twoPartLevels[idx - 1];
                    suitCount >= 2 && sultCfg.twoPartLevels && sultCfg.twoPartLevels[idx - 1] && starLv >= sultCfg.twoPartLevels[idx - 1]
                    && (color = ACTIVE_SUIT);
                    if(typeof ele == 'number'){
                        desc = configUtils.getSkillChangeConfig(ele).Desc;
                    } else {
                        ele.forEach(changeID => {
                            desc.length > 0 && (desc = `${desc}；`);
                            desc = `${desc}${configUtils.getSkillChangeConfig(changeID).Desc}`
                        });
                    }
                }
                createSultSkillDesc(true, desc, star, color);
            });

            suitSkillCfg.fourPartSkills && suitSkillCfg.fourPartSkills.forEach((ele, idx) =>{
                if(!cc.isValid(suit4Title)){
                    suit4Title = createSultSkillDesc(false, '4件套装');
                }
                let desc: string = '';
                let star = 0;
                let color = NON_ACTIVE_SUIT;
                if(idx == 0) {
                    star =  initStar * 4;
                    suitCount >= 4 && (color = ACTIVE_SUIT);
                    desc = configUtils.getSkillConfig(ele as number).Illustrate;
                }else{
                    suitCount >= 4 && sultCfg.fourPartLevels && sultCfg.fourPartLevels[idx - 1] && starLv >= sultCfg.fourPartLevels[idx - 1]
                        && (color = ACTIVE_SUIT);
                    star = suitSkillCfg.fourPartLevels[idx - 1];
                    if(typeof ele == 'number'){
                        desc = configUtils.getSkillChangeConfig(ele).Desc;
                    } else {
                        ele.forEach(changeID => {
                            desc.length > 0 && (desc = `${desc}；`);
                            desc = `${desc}${configUtils.getSkillChangeConfig(changeID).Desc}`
                        });
                    }
                }
                createSultSkillDesc(true, desc, star, color);
            });
        }
        return suitSkillCfg;
    }

    showCastSoulProps(equip: data.IBagUnit){
        if(!equip) return;
        let attrs: EquipAttr[] = [];
        for (let k in equip.EquipUnit.CastSoulChooseMap) {
            attrs.push({
                attributeId: parseInt(k),
                value: equip.EquipUnit.CastSoulChooseMap[k],
            })
        }

        attrs.sort((attrA, attrB)=>{
            let cfgA = configUtils.getEquipCastSoulConfig(attrA.attributeId);
            let cfgB = configUtils.getEquipCastSoulConfig(attrB.attributeId);
            return cfgA.EquipCastSoulPropertyId - cfgB.EquipCastSoulPropertyId;
        })
        attrs.forEach(attr => {
            let cfg = configUtils.getEquipCastSoulConfig(attr.attributeId);
            let attrCfg = configUtils.getAttributeConfig(cfg.EquipCastSoulPropertyId);
            this.addCastSoulItem(attrCfg.Name, attr.value, attrCfg.AttributeValueType == 2);
        })

        this.spiritNode.active = !!attrs.length;
    }

    private addGreenItem(name: string, val: number | string, isPercent?: boolean, newVal?: number | string) {
        let item = cc.instantiate(this.tmpSpecialNode);
        val = Number(val) || 0;
        newVal = Number(newVal) || 0;
        item.getComponent(RichTextEx).string = name;
        item.getComponentInChildren(RichTextEx).string = isPercent ? String((newVal || val) * 100 / FULL_PERCENT) + "%" : String(val);
        if (newVal && val != newVal) {
            let oldP = val * 100 / FULL_PERCENT;
            let newP = newVal * 100 / FULL_PERCENT;
            let strP = `${oldP}% -> <color=#e9822d>${newP}%</c>`;
            let str = `${val} -> <color=#e9822d>${newVal}</c>`;
            item.getComponentInChildren(RichTextEx).string = isPercent ? strP : str;
        }
        item.parent = this.specialNode;
        item.active = true;
        this.nodeStack.push(item);
    }

    private addYellowItem(name: string, val: number | string, isPercent?: boolean, newVal?: number) {
        let item = cc.instantiate(this.tmpSkillNode);
        val = Number(val) || 0;
        item.getComponent(RichTextEx).string = name;
        item.getComponentInChildren(RichTextEx).string = isPercent ? String((newVal || val) * 100 / FULL_PERCENT) + "%" : String(val);
        if (!val && !newVal){
            return;
        }
        if (newVal && val != newVal) {
            let oldP = val * 100 / FULL_PERCENT;
            let newP = newVal * 100 / FULL_PERCENT;
            let strP = `${oldP}% -> <color=#e9822d>${newP}%</c>`;
            let str = `${val} -> <color=#e9822d>${newVal}</c>`;
            item.getComponentInChildren(RichTextEx).string = isPercent ? strP : str;
        }
        item.parent = this.skillNode;
        item.active = true;
        this.nodeStack.push(item);
    }

    private addCastSoulItem(name: string, val: number | string, isPercent?: boolean, newVal?: number) {
        let item = cc.instantiate(this.tmpSkillNode);
        val = Number(val) || 0;
        item.getComponent(RichTextEx).string = name;
        item.getComponentInChildren(RichTextEx).string = isPercent ? String((newVal || val) * 100 / FULL_PERCENT) + "%" : String(val);
        if (newVal && val != newVal) {
            let oldP = val * 100 / FULL_PERCENT;
            let newP = newVal * 100 / FULL_PERCENT;
            let strP = `${oldP}% -> <color=#e9822d>${newP}%</c>`;
            let str = `${val} -> <color=#e9822d>${newVal}</c>`;
            item.getComponentInChildren(RichTextEx).string = isPercent ? strP : str;
        }
        item.parent = this.spiritNode;
        item.active = true;
        this.nodeStack.push(item);
    }

    private showGreenStatus(disable: boolean) {
        let greenItems = this.specialNode.children;
        greenItems.forEach(_gItem => {
            if (_gItem.getComponentInChildren(RichTextEx)) {
                _gItem.color = disable ? cc.color(180, 180, 180) : cc.color(93, 56, 6);
                _gItem.getComponentInChildren(RichTextEx).node.color = disable ? cc.color(180, 180, 180) : cc.color(68, 36, 25);
            }
        })
    }

    clear() {
        this.nodeStack.forEach(item => {
            item.removeFromParent();
        })
        this.nodeStack = [];
    }

    //特殊属性
    onClickSpecial(event: cc.Event) {
        let parent = uiHelper.getRootViewComp(this.node).node;
        if (this._equipData) {
            //特殊处理，0-10级没有属性的情况
            guiManager.loadView(VIEW_NAME.EQUIP_INFO_VIEW, parent, this._equipData, INFO_TYPE.GREEN);
        }
    }
    //特技
    onClickSkill(event: cc.Event) {
        let parent = uiHelper.getRootViewComp(this.node).node;
        if (this._equipData)
            guiManager.loadView(VIEW_NAME.EQUIP_INFO_VIEW, parent, this._equipData, INFO_TYPE.YELLOW);
    }

    //套装
    onClickSuit(){

    }

    onDestroy(){
        this.clear();
    }
}
