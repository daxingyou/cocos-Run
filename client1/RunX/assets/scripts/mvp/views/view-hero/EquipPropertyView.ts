import { EQUIP_MAX_STAR } from "../../../app/AppConst";
import { LEVEL_EXP_TYPE, QUALITY_TYPE, EQUIP_PART_TYPE,  } from "../../../app/AppEnums";
import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { heroViewEvent } from "../../../common/event/EventData";
import { cfg } from "../../../config/config";
import { data } from "../../../network/lib/protocol";
import EquipBasicInfoView from "./EquipBasicInfoView";
import { Equip } from "../../template/Equip";
import { bagData } from "../../models/BagData";
import { utils } from "../../../app/AppUtils";
import EquipSuitPropertyView from "./EquipSuitPropertyView";
import moduleUIManager from "../../../common/ModuleUIManager";
import { bagDataUtils } from "../../../app/BagDataUtils";

const { ccclass, property } = cc._decorator;

const PRO_LIST_VIEW_MINEST_HEIGHT = 80;

@ccclass
export default class EquipPropertyView extends ViewBaseComponent {
    // 装备信息区域
    @property(EquipBasicInfoView)   equipBasicInfoCmp: EquipBasicInfoView = null;
    @property(cc.ScrollView)        proListView: cc.ScrollView = null;
    @property(cc.Node)              titleTemplate: cc.Node = null;
    @property(cc.Node)              itemTemplate: cc.Node = null;
    @property(EquipSuitPropertyView) equipSuitPropertyCmp: EquipSuitPropertyView = null;
    @property(cc.Node)              skillDescTemplate: cc.Node = null;
    @property(cc.Node)              skillDescWithLvTemplate : cc.Node = null;
    @property(cc.Node)              btnStrength: cc.Node = null;
    @property(cc.Node)              btnBroken: cc.Node = null;
    @property(cc.Node)              btnCostSoul: cc.Node = null;
    @property(cc.Node)              rootNode: cc.Node = null;
    @property(cc.Sprite)            basicInfoBg: cc.Sprite = null;
    @property([cc.SpriteFrame])     bgSpFrames: cc.SpriteFrame[] = [];

    private _equip: data.IBagUnit = null;
    private _rootNodeOriH : number = 0;
    private _scrollViewOriH: number = 0;
    onInit(equip: data.IBagUnit, heroId: number) {
        this._rootNodeOriH = this._rootNodeOriH || this.rootNode.height;
        this._scrollViewOriH = this._scrollViewOriH || this.proListView.node.height;
        this._equip = equip;
        this.refreshView(heroId);
    }

    onRelease() {
        this.equipBasicInfoCmp.deInit();
    }

    refreshView(heroId: number) {
        this.equipBasicInfoCmp.setData(this._equip);

        let equip: Equip = bagData.getEquipById(this._equip.ID, utils.longToNumber(this._equip.Seq));
        let props = equip.getEquipDetailInfo();
        let selector = function (value: number) {
            return value > 0;
        };
        let keys = [
            ['Attack', selector, '攻击'],
            ['Defend', selector, '防御'],
            ['Hp', selector, '血量'],
            ['Critical',selector, '暴击率'],
            ['CriticalHarm', selector, '暴击伤害'],
            ['AttackPercent', selector, '攻击百分比'],
            ['DefendPercent', selector, '防御百分比'],
            ['HpPercent', selector, '血量百分比'],
            ['Speed', selector, '速度'],
            ['HarmImmunity', selector, '免伤率'],
            ['Parry', selector, '招架率'],
            ['Miss', selector, '躲避率'],
            ['Blood', selector, '吸血率'],
            ['Harm', selector, '伤害放大'],
            ['Through', selector, '护甲穿透'],
            ['CounterAttack', selector, '反击率'],
            ['Sputtering', selector, '溅射率'],
            ['Continuity', selector, '连击率'],
        ];

        this.basicInfoBg.spriteFrame = this.bgSpFrames[equip.equipCfg.Quality - 1];
        //统一字段
        if((props.white as Object).hasOwnProperty('Defence')){
            props.white.Defend = props.white.Defend;
            delete props.white.Defend;
        }
        this._genProView('基础属性', props.white, keys);
        this._genProView('特殊属性', bagDataUtils.mergeGreenProp(props.green), keys);

        let yellowProps: any = utils.deepCopy(props.yellow);
        
        this._genProView('装备特技', yellowProps, keys, equip.getPartSKill() || equip.getExclusiveSKill(), equip.equipCfg);
        this.equipSuitPropertyCmp.setData(this._equip, heroId);
        if(this.equipSuitPropertyCmp.node.active && this.proListView.content !== this.equipSuitPropertyCmp.node.parent){
          this.equipSuitPropertyCmp.node.parent = this.proListView.content;
        }
        // 铸魂属性
        let attrs: any = {};
        for (let k in equip.equipData.EquipUnit.CastSoulChooseMap) {
            let cfg = configUtils.getEquipCastSoulConfig(Number(k));
            attrs[cfg.EquipCastSoulPropertyId] = equip.equipData.EquipUnit.CastSoulChooseMap[k];
        }
        this._genSpiritProView('铸魂属性', attrs);
        this.refreshBtns();
        this._adapteView();
    }

    //适配界面大小
    private _adapteView(){
        let layoutComps = this.proListView.content.getComponentsInChildren(cc.Layout);
        layoutComps && layoutComps.forEach(ele => {
            ele.node != this.proListView.content && ele.updateLayout();
        });
        this.proListView.content.getComponent(cc.Layout).updateLayout();
        let height = this.proListView.content.height;
        height = Math.max(height, PRO_LIST_VIEW_MINEST_HEIGHT);
        let adapteH = Math.min(this._scrollViewOriH, height);
        this.rootNode.height = Math.min(this._rootNodeOriH, this._rootNodeOriH - (this._scrollViewOriH - adapteH)) ;
        this.proListView.node.height = adapteH;
    }

    refreshBtns() {
        this.btnStrength.parent.getComponent(cc.Layout).enabled = true;
        let equip: Equip = bagData.getEquipById(this._equip.ID, utils.longToNumber(this._equip.Seq));
        let isExclusive = equip.isExclusive();
        let isCanBreak: boolean = this.checkEquipCanBroken(this._equip);
        this.btnBroken.active = isCanBreak && equip.getEquipLevel() != bagDataUtils.equipMaxLevel;
        //专属装备不能强化
        this.btnStrength.active = !isExclusive && !isCanBreak && equip.getEquipLevel() != bagDataUtils.equipMaxLevel;
        this.btnCostSoul.active = bagDataUtils.checkEquipCastSoul(equip);
        this.scheduleOnce(() => {
            this.btnStrength.parent.getComponent(cc.Layout).enabled = false;
        });
    }

    onClickStrengh() {
        moduleUIManager.jumpToModule(21001, 0, 0,this._equip).then(() => {
            this.closeView();
        });
    }

    onClickBroken() {
        moduleUIManager.jumpToModule(21001, 1, 0,this._equip).then(() => {
            this.closeView();
        });
    }

    onClickCostSoul() {
        moduleUIManager.jumpToModule(21001, 2, 0,this._equip).then(() => {
            this.closeView();
        });
    }

    onClickReplace() {
        this._fireOpenEquipListView();
        this.closeView();
    }

    private _fireOpenEquipListView() {
        let equipConfig = configUtils.getEquipConfig(this._equip.ID);
        eventCenter.fire(heroViewEvent.OPEN_EQUIP_LIST_VIEW, equipConfig.PositionType, this._equip);
    }

    /**
     * 装备是否满足突破
     * @param equip
     * @returns
     */
    checkEquipCanBroken(equip: data.IBagUnit) {
        let equipConfig = configUtils.getEquipConfig(equip.ID);
        //专属不能强化，只能突破
        if(equipConfig.PositionType == EQUIP_PART_TYPE.EXCLUSIVE){
            return equip.EquipUnit.Star < EQUIP_MAX_STAR;
        }
        let expList = this.getEquipExpConfigByEquipConfig(equipConfig);
        let expCount: number = 0;
        let level: number = 1;
        for (let i = 0; i < expList.length; ++i) {
            expCount += (expList[i].LevelExpNeedNum || 0);
            if (equip.EquipUnit.Exp == 0 || equip.EquipUnit.Exp < expCount) {
                level = i + 1;
                break;
            }
            if(i == expList.length - 1 && level == 1) {
                level = bagDataUtils.equipMaxLevel;
                break;
            }
        }
        level = Math.min(level, bagDataUtils.equipMaxLevel);
        if (level >= bagDataUtils.equipMaxLevel) {
            return false;
        } else {
            return expCount == equip.EquipUnit.Exp;
        }
    }
    /**
     * 判断装备是否能铸魂
     * @param equip
     * @returns
     */
    checkEquipCanCostSoul(equip: data.IBagUnit) {
        let equipConfig = configUtils.getEquipConfig(equip.ID);
        return equipConfig.Quality >= QUALITY_TYPE.R;
    }

    /**
     * 获得装备经验config
     * @param equipConfig
     * @returns
     */
    getEquipExpConfigByEquipConfig(equipConfig: cfg.Equip): cfg.LevelExp[] {
        let expConfig: cfg.LevelExp[] = configManager.getConfigs('levelExp');
        let equipExpList: cfg.LevelExp[] = [];
        for (const k in expConfig) {
            if (expConfig[k].LevelExpType == LEVEL_EXP_TYPE.EQUIP && expConfig[k].LevelExpQuality == equipConfig.Quality) {
                equipExpList.push(expConfig[k]);
            }
        }
        return equipExpList;
    }

    //生成装备属性
    private _genProView(title: string, props: any, keys: Array<Array<any>>, skillInfo?: (number|number[])[], equipCfg?: cfg.Equip){
        if((!props || Object.keys(props).length) === 0 && (!skillInfo || skillInfo.length == 0)) return;

        let titleNode: cc.Node = null;

        let createTitle = () => {
            if(!cc.isValid(titleNode)){
                titleNode = cc.instantiate(this.titleTemplate);
                titleNode.active = true;
                titleNode.getChildByName('text').getComponent(cc.Label).string = title;
                this.proListView.content.addChild(titleNode);
            }
        }

        props && Object.keys(props).length > 0 && keys.forEach((ele)=> {
            let checkFunc: Function = ele[1];
            if(checkFunc(props[ele[0]])){
                createTitle();
                let itemNode = cc.instantiate(this.itemTemplate);
                itemNode.active = true;
                let attrCfg = configUtils.getAttributeCfg(ele[0]);
                itemNode.getChildByName('title').getComponent(cc.Label).string = attrCfg.Name;
                let propValue = props[ele[0]];
                attrCfg.AttributeValueType == 2 && (propValue = `${parseInt(propValue) / 100}%`);
                itemNode.getChildByName('text').getComponent(cc.Label).string = propValue;
                this.proListView.content.addChild(itemNode);
            }
        });

        //装备技能描述
        if(!skillInfo || skillInfo.length == 0) return;
        let isPart = equipCfg.PositionType != EQUIP_PART_TYPE.EXCLUSIVE;
        let equipSKill = isPart ? (equipCfg.GeneralAddSkill || 0) : (equipCfg.ExclusiveAddSkill || 0);
        let star = this._equip.EquipUnit.Star;
        let activeColor = cc.Color.fromHEX(cc.color(), 'FFC41C');
        let notActiveColor = cc.Color.fromHEX(cc.color(), 'BC9D87');
        skillInfo.forEach((ele, idx) => {
            if(ele == 0) return;
            createTitle();
            let itemNode = cc.instantiate(this.skillDescWithLvTemplate);
            let lvComp = itemNode.getChildByName('lv').getComponent(cc.Label);
            itemNode.active = true;
            let desc: string = '';
            //装备自己有新技能
            if(typeof ele == 'number' && ele == equipSKill){
                desc = isPart ? configUtils.getBuffConfig(ele).Illustrate : configUtils.getSkillConfig(ele).Illustrate;
            }else{
                if(typeof ele == 'number')  {
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
            lvComp.node.color = itemNode.color = star >= (idx) ? activeColor : notActiveColor;
            this.proListView.content.addChild(itemNode);
        });
    }

    private _genSpiritProView(title: string, props: any) {
        if (!props || Object.keys(props).length === 0) return;
        let titleNode: cc.Node = null;
        Object.keys(props).forEach((key: string) => {
            if (!cc.isValid(titleNode)) {
                titleNode = cc.instantiate(this.titleTemplate);
                titleNode.active = true;
                titleNode.getChildByName('text').getComponent(cc.Label).string = title;
                this.proListView.content.addChild(titleNode);
            }
            let itemNode = cc.instantiate(this.itemTemplate);
            itemNode.active = true;
            let attrCfg = configUtils.getAttributeConfig(Number(key));
            itemNode.getChildByName('title').getComponent(cc.Label).string = attrCfg.Name;
            let propValue = props[key];
            attrCfg.AttributeValueType == 2 && (propValue = `${parseInt(propValue) / 100}%`);
            itemNode.getChildByName('text').getComponent(cc.Label).string = propValue;
            this.proListView.content.addChild(itemNode);
        });
    }
    
}
