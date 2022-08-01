import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import HeroUnit from "../../template/HeroUnit";
import { SKILL_TYPE } from "../view-hero/HeroSkillView";

const {ccclass, property} = cc._decorator;

type SkillLockInfo = {unlock: number[], lock: number[]};

@ccclass
export default class TipsSkill extends ViewBaseComponent {
    @property(cc.Sprite)                skillIcon: cc.Sprite = null;
    @property(cc.Label)                 iconLvLb: cc.Label = null;
    @property(cc.Label)                 skillNameLb: cc.Label = null;
    @property(cc.Sprite)                 skillType: cc.Sprite = null;
    @property(cc.Node)                  skillIntroduceTempItem: cc.Node = null;
    @property([cc.SpriteFrame])         skillTypeIcons: cc.SpriteFrame[] = [];

    private _heroId: number = 0;
    private _skillType: number = 1;
    private _isMonster: boolean = false;
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _heroCfg: cfg.HeroBasic = null;
    private _monsterCfg: cfg.Monster = null;
    private _heroUnit: HeroUnit = null;
    onInit(heroId: number, skillType: SKILL_TYPE, isMonster: boolean = false) {
        this._heroId = heroId;
        this._skillType = skillType;
        this._isMonster = isMonster;
        if(this._isMonster){
            this._monsterCfg = configUtils.getMonsterConfig(this._heroId);
            this._monsterCfg.NoumenonID && (this._heroCfg = configUtils.getHeroBasicConfig(this._monsterCfg.NoumenonID));
        }else{
            this._heroUnit = new HeroUnit(this._heroId);
            this._heroCfg = this._heroUnit.heroCfg;
        }
        this._refreshView();
    }

    onRelease() {
        if(this._spriteLoader) {
            this._spriteLoader.release();
        }
    }

    private _refreshView() {
        let skills = this._getSkills();
        if(!skills || !((skills.unlock && skills.unlock.length > 0) || (skills.lock && skills.lock.length > 0))) return;
        let skillList = skills.unlock.concat(skills.lock);
        if(!skillList || skillList.length === 0) return;

        let initStar = 1;
        if(this._isMonster){
            this._monsterCfg.NoumenonID && (initStar = bagDataUtils.getHeroInitStar(this._monsterCfg.NoumenonID));
        }else{
            initStar = bagDataUtils.getHeroInitStar(this._heroId);
        }

        let currStar = 1;
        if(this._isMonster){
            this._monsterCfg.NoumenonHeroStar && (currStar = this._monsterCfg.NoumenonHeroStar);
        }else{
            currStar = this._heroUnit.star;
        }
        for(let i = 0; i < skillList.length; ++i) {
            i == currStar && (this.iconLvLb.string = `${i}`);
            let id = skillList[i];
            if(!!id) {
                let skillIntroduce: string = null;
                let skillCfg = configUtils.getSkillConfig(id);
                skillCfg && (skillIntroduce = skillCfg.Illustrate);

                if(!skillIntroduce) {
                    let changeCfg = configUtils.getSkillChangeConfig(id);
                    if(!changeCfg || !changeCfg.NoumenonSkill || changeCfg.NoumenonSkill.length === 0)  continue;
                    skillIntroduce = changeCfg.Desc;
                }
                let introduceItem: cc.Node = cc.instantiate(this.skillIntroduceTempItem);
                this.skillIntroduceTempItem.parent.addChild(introduceItem);
                this._refreshSkillIntroduceView(introduceItem, skillIntroduce,currStar, initStar + i);
            }
        }
        let skillId: number = this._getSkillID();
        this.skillType.spriteFrame = this.skillTypeIcons[this._skillType - 1]
        if(!!skillId) {
            let changeSkillInfoFunc = (skillId: number) => {
                let skillCfg = configUtils.getSkillConfig(skillId);
                if(skillCfg) {
                    let url = resPathUtils.getSkillIconUrl(skillCfg.Icon);
                    this._spriteLoader.changeSprite(this.skillIcon, url);
                    this.skillNameLb.string = skillCfg.Name;
                }
            }
            let changeCfg = configUtils.getSkillChangeConfig(skillId);
            if(changeCfg) {
                if(changeCfg.ChangeSkillID) {
                    changeSkillInfoFunc(changeCfg.ChangeSkillID);
                }
            } else {
                changeSkillInfoFunc(skillId);
            }
        }
    }

    private _refreshSkillIntroduceView(item: cc.Node, introduceStr: string, heroStar: number, curStar: number) {
        item.active = true;
        let color = new cc.Color().fromHEX(heroStar >= curStar ? '#FFFF00' : '#A4A4A4');
        let introduce: cc.Node = item.getChildByName('skillIntroduceLb');
        let lvNode: cc.Node = introduce.getChildByName('lv');
        let unlockNode: cc.Node = item.getChildByName('unlock');
        introduce.color = color;
        introduce.getComponent(cc.Label).string = introduceStr;
        lvNode.color = color;
        lvNode.getComponent(cc.Label).string = `${curStar}星`;
        unlockNode.color = color;
        unlockNode.getComponent(cc.Label).string = `${curStar}星解锁`;
        unlockNode.getComponent(cc.Widget).updateAlignment();
    }

    private _getSkills(): SkillLockInfo {
        if(this._isMonster){
            return  this._getMonsterSkills();
        }

        let skillID = this._getSkillID();
        if(!skillID) return null;
        let initStar = configUtils.getSkillConfig(skillID).Star;
        let skillList: number[] = [];
        skillList[initStar - 1] = skillID;
        let changeStr = this._heroCfg.HeroBasicChangeSkill;
        if(!changeStr || changeStr.length === 0) return null;

        let skills: SkillLockInfo = {
            unlock: [],
            lock: []
        };
        let changeArr: string[] = changeStr.split('|');
        changeArr.forEach((ele, idx) => {
            if(!ele || ele.length === 0 || ele === '0') return;
            let starChangeArr: string[] = ele.split(';');
            if(!starChangeArr || starChangeArr.length == 0) return;
            starChangeArr.forEach((ele1) => {
                let changeCfg = configUtils.getSkillChangeConfig(parseInt(ele1));
                if(!changeCfg || !changeCfg.NoumenonSkill || changeCfg.NoumenonSkill.length === 0) return;
                let skillCfg: string[] = changeCfg.NoumenonSkill.split('|');
                if(!skillCfg || skillCfg.length === 0 || parseInt(skillCfg[0]) !== skillID) return;
                skillList[idx] = parseInt(ele1);
            });
        });
        let heroInitStar = this._heroUnit.isHeroBasic ? bagDataUtils.getHeroInitStar(this._heroId) : this._heroUnit.star;
        skills.unlock = skillList.slice(heroInitStar - 1, this._heroUnit.star);
        skills.lock = skillList.slice(this._heroUnit.star);
        return skills;
    }

    private _getMonsterSkills(): SkillLockInfo{
        let skillID: number = this._getSkillID();
        if(!skillID) return null;
        let initStar = configUtils.getSkillConfig(skillID).Star;
        let monsterStar = this._monsterCfg.NoumenonHeroStar || 1;
        let skillList: number[] = [];
        skillList[initStar - 1] = skillID;

        let skills: SkillLockInfo = {
            unlock: [],
            lock: null
        };

        if(!this._heroCfg){
            skills.unlock = skillList.slice(monsterStar - 1, monsterStar);
            return skills;
        }

        let changeStr = this._heroCfg.HeroBasicChangeSkill;
        if(!changeStr || changeStr.length === 0) return null;

        let changeArr: string[] = changeStr.split('|');
        changeArr.forEach((ele, idx) => {
            if(!ele || ele.length === 0 || ele === '0') return;
            let starChangeArr: string[] = ele.split(';');
            if(!starChangeArr || starChangeArr.length == 0) return;
            starChangeArr.forEach((ele1) => {
                let changeCfg = configUtils.getSkillChangeConfig(parseInt(ele1));
                if(!changeCfg || !changeCfg.NoumenonSkill || changeCfg.NoumenonSkill.length === 0) return;
                let skillCfg: string[] = changeCfg.NoumenonSkill.split('|');
                if(!skillCfg || skillCfg.length === 0 || parseInt(skillCfg[0]) !== skillID) return;
                skillList[idx] = parseInt(ele1);
            });
        });
        skills.unlock = skillList.slice(monsterStar - 1, monsterStar);
        return skills;
    }

    private _getSkillID() : number{
        let skillID: number = 0;

        //怪物技能
        if(this._isMonster && !this._monsterCfg.NoumenonID){
            if(this._skillType == SKILL_TYPE.BASIC_SKILL) skillID = this._monsterCfg.Skill;
            else if(this._skillType == SKILL_TYPE.PASSIVE_SKILL1) skillID = this._monsterCfg.Passive1;
            else if(this._skillType == SKILL_TYPE.PASSIVE_SKILL2) skillID = this._monsterCfg.Passive2;
            return skillID;
        }

        if(this._skillType == SKILL_TYPE.BASIC_SKILL && this._heroCfg.HeroBasicSkill) {
            skillID = this._heroCfg.HeroBasicSkill;
        }
        if(this._skillType == SKILL_TYPE.PASSIVE_SKILL1 && this._heroCfg.HeroBasicPassive1) {
            skillID = this._heroCfg.HeroBasicPassive1;
        }
        if(this._skillType == SKILL_TYPE.PASSIVE_SKILL2 && this._heroCfg.HeroBasicPassive2) {
            skillID = this._heroCfg.HeroBasicPassive2;
        }
        return skillID;
    }
}
