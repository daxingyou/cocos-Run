import { VIEW_NAME } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import guiManager from "../../../common/GUIManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import HeroUnit from "../../template/HeroUnit";

export enum SKILL_TYPE {
    BASIC_SKILL = 1,
    PASSIVE_SKILL1,
    PASSIVE_SKILL2
}

enum SKILL_STATE {
    NOT_EXIST,
    LOCK,
    UNLOCK
}

const {ccclass, property} = cc._decorator;

@ccclass
export default class HeroSkillView extends ViewBaseComponent {
    @property(cc.Node) basicSkillNode: cc.Node = null;
    @property(cc.Sprite) basicSkillSp: cc.Sprite = null;
    @property(cc.Node) basicSkillLock: cc.Node = null;

    @property(cc.Node) passivelSkillParentNode: cc.Node = null;
    @property(cc.Sprite) passivelSkill1Sp: cc.Sprite = null;
    @property(cc.Node) passivelSkill1Lock: cc.Node = null;
    @property(cc.Sprite) passivelSkill2Sp: cc.Sprite = null;
    @property(cc.Node) passivelSkill2Lock: cc.Node = null;

    private _heroId: number = null;
    private _isMonster: boolean = false;
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _onlyShow: boolean = false;     //仅作图鉴展示用
    private _loadView: Function = null;
    private _monsterCfg: cfg.Monster = null;
    private _heroCfg: cfg.HeroBasic = null
    set onlyShow(val: boolean){
        this._onlyShow = val;
    }

    onInit(heroId: number, loadView: Function, isMonster: boolean = false) {
        this._heroId = heroId;
        this._loadView = loadView;
        this._isMonster = isMonster;
        !this._isMonster ? (this._heroCfg = configUtils.getHeroBasicConfig(this._heroId))
            : (this._monsterCfg = configUtils.getMonsterConfig(this._heroId));
        this.refreshView();
    }

    onRelease() {
        this._heroCfg = null;
        this._monsterCfg = null;
        if(this._spriteLoader) {
            this._spriteLoader.release();
        }
        this.releaseSubView();
    }

    refreshView() {
        this.refreshBasicSkillView();
        this.refreshPassiveView();
    }

    refreshBasicSkillView() {
        let skillState = this._getSkillConfig(SKILL_TYPE.BASIC_SKILL);
        let isSkillExist = skillState && skillState.state != SKILL_STATE.NOT_EXIST;
        this.basicSkillNode.active = isSkillExist;
        if(!isSkillExist) return;
        this.basicSkillLock.active = skillState.state == SKILL_STATE.LOCK;
        if(SKILL_STATE.LOCK == skillState.state) {
            this.basicSkillLock.getChildByName('unlockLvLb').getComponent(cc.Label).string = `${skillState.unlockStar}星解锁`;
        }
        let skillCfg = configUtils.getSkillConfig(skillState.skill);

        if(skillCfg) {
            let url = resPathUtils.getSkillIconUrl(skillCfg.Icon);
            this._spriteLoader.changeSpriteP(this.basicSkillSp, url).catch((err) => {
                if (err) {
                    this._spriteLoader.deleteSprite(this.basicSkillSp);
                    this.basicSkillNode.active = false;
                }
            });
            return;
        }

        let changeCfg = configUtils.getSkillChangeConfig(skillState.skill);
        if(!changeCfg) {
            this.basicSkillNode.active = false;
            return;
        }

        let skillId = changeCfg.NoumenonSkill ? changeCfg.NoumenonSkill.split('|')[0] : '0';
        let curSkillCfg = configUtils.getSkillConfig(parseInt(skillId));
        if(curSkillCfg) {
            let url = resPathUtils.getSkillIconUrl(curSkillCfg.Icon);
            this.basicSkillNode.active = true;
            this._spriteLoader.changeSpriteP(this.basicSkillSp, url).catch(() => {
                this._spriteLoader.deleteSprite(this.basicSkillSp);
                this.basicSkillNode.active && (this.basicSkillNode.active = false);
            });
        } else {
            this.basicSkillNode.active = false;
        }
    }

    refreshPassiveView() {
        let updatePassiveParent = () => {
            this.passivelSkillParentNode.active = this.passivelSkill1Sp.node.parent.active || this.passivelSkill2Sp.node.parent.active;
        }

        // 被动技能1
        let skillState1 = this._getSkillConfig(SKILL_TYPE.PASSIVE_SKILL1);
        let passive1Node = this.passivelSkill1Sp.node.parent;
        let isSkillExist = skillState1 && skillState1.state != SKILL_STATE.NOT_EXIST;
        passive1Node.active = isSkillExist;
        if(isSkillExist) {
            this.passivelSkill1Lock.active = skillState1.state == SKILL_STATE.LOCK;
            if(SKILL_STATE.LOCK == skillState1.state) {
                this.passivelSkill1Lock.getChildByName('unlockLvLb').getComponent(cc.Label).string = `${skillState1.unlockStar}星解锁`;
            }
            let skillCfg = configUtils.getSkillConfig(skillState1.skill);
            if(!skillCfg) {
                let changeCfg = configUtils.getSkillChangeConfig(skillState1.skill);
                if(!changeCfg) {
                    passive1Node.active = false;
                } else {
                    let skillId = changeCfg.NoumenonSkill ? changeCfg.NoumenonSkill.split('|')[0] : '0';
                    let curSkillCfg = configUtils.getSkillConfig(parseInt(skillId));
                    if(curSkillCfg) {
                        let url = resPathUtils.getSkillIconUrl(curSkillCfg.Icon);
                        passive1Node.active = true;
                        this._spriteLoader.changeSpriteP(this.passivelSkill1Sp, url).catch(() => {
                            this._spriteLoader.deleteSprite(this.passivelSkill1Sp);
                            passive1Node.active && (passive1Node.active = false);
                            updatePassiveParent();
                        });
                    } else {
                        passive1Node.active = false;
                    }
                }
            } else {
                let url = resPathUtils.getSkillIconUrl(skillCfg.Icon);
                this._spriteLoader.changeSpriteP(this.passivelSkill1Sp, url).catch(() => {
                    this._spriteLoader.deleteSprite(this.passivelSkill1Sp);
                    passive1Node.active && (passive1Node.active = false);
                    updatePassiveParent();
                });
            }
        }

        // 被动技能2
        let skillState2 = this._getSkillConfig(SKILL_TYPE.PASSIVE_SKILL2);
        let passive2Node = this.passivelSkill2Sp.node.parent;
        isSkillExist = skillState2 && skillState2.state != SKILL_STATE.NOT_EXIST
        passive2Node.active = isSkillExist;
        if(isSkillExist) {
            this.passivelSkill2Lock.active = skillState2.state == SKILL_STATE.LOCK;
            if(SKILL_STATE.LOCK == skillState2.state) {
                this.passivelSkill2Lock.getChildByName('unlockLvLb').getComponent(cc.Label).string = `${skillState2.unlockStar}星解锁`;
            }
            let skillCfg = configUtils.getSkillConfig(skillState2.skill);
            if(!skillCfg) {
                let changeCfg = configUtils.getSkillChangeConfig(skillState2.skill);
                if(!changeCfg) {
                    passive2Node.active = false;
                } else {
                    let skillId = changeCfg.NoumenonSkill ? changeCfg.NoumenonSkill.split('|')[0] : '0';

                    let curSkillCfg = configUtils.getSkillConfig(parseInt(skillId));
                    if(curSkillCfg) {
                        let url = resPathUtils.getSkillIconUrl(curSkillCfg.Icon);
                        passive2Node.active = true;
                        this._spriteLoader.changeSpriteP(this.passivelSkill2Sp, url).catch(() => {
                            this._spriteLoader.deleteSprite(this.passivelSkill2Sp);
                            passive2Node.active && (passive2Node.active = false);
                            updatePassiveParent();
                        });
                    } else {
                        passive2Node.active = false;
                    }
                }
            } else {
                let url = resPathUtils.getSkillIconUrl(skillCfg.Icon);
                this._spriteLoader.changeSpriteP(this.passivelSkill2Sp, url).catch(() => {
                    this._spriteLoader.deleteSprite(this.passivelSkill2Sp);
                    passive2Node.active && (passive2Node.active = false);
                    updatePassiveParent();
                });
            }
        }
        updatePassiveParent();
    }

    onClickSkill(event: any,  skillType: string) {
        guiManager.loadView(VIEW_NAME.TIPS_SKILL, guiManager.sceneNode, this._heroId, parseInt(skillType), this._isMonster);
    }

    //获取英雄技能配置
    private _getSkillConfig(skillType: SKILL_TYPE) {
        if(this._isMonster){
            return this._getMonsterSkillCfg(skillType);
        }

        let heroCfg: cfg.HeroBasic = this._heroCfg;
        if(!heroCfg || !heroCfg.HeroBasicChangeSkill) return null;

        let skillId: number = NaN;
        switch(skillType){
            case SKILL_TYPE.BASIC_SKILL:
                skillId = heroCfg.HeroBasicSkill;
                break;
            case SKILL_TYPE.PASSIVE_SKILL1:
                skillId = heroCfg.HeroBasicPassive1;
                break;
            case SKILL_TYPE.PASSIVE_SKILL2:
                skillId = heroCfg.HeroBasicPassive2;
                break;
        }

        if(isNaN(skillId)) return null;
        let heroUnit: HeroUnit = new HeroUnit(this._heroId);
        let skillCfg = configUtils.getSkillConfig(skillId);
        let initStar = bagDataUtils.getHeroInitStar(this._heroId);
        let skillCfgEntity = {
            state: (heroUnit.isHeroBasic || this._onlyShow) ? SKILL_STATE.UNLOCK : SKILL_STATE.LOCK,
            unlockStar: initStar,
            skill: skillId,
        };

        let unlockStar = skillCfg.Star;
        skillCfgEntity.unlockStar = unlockStar;
        if(heroUnit.isHeroBasic && unlockStar > heroUnit.star){
            skillCfgEntity.state = SKILL_STATE.LOCK;
        }else {
            skillCfgEntity.state = SKILL_STATE.UNLOCK;
        }
        return skillCfgEntity;
    }

    //获取怪物技能配置
    private _getMonsterSkillCfg(skillType: SKILL_TYPE){
        let monsterCfg: cfg.Monster = this._monsterCfg;
        if(!monsterCfg) return null;

        if(monsterCfg.NoumenonID){
            this._heroCfg = this._heroCfg || configUtils.getHeroBasicConfig(monsterCfg.NoumenonID);
        }

        let skillId: number = NaN;
        switch(skillType){
            case SKILL_TYPE.BASIC_SKILL:
                if(monsterCfg.NoumenonID && this._heroCfg){
                    skillId = this._heroCfg.HeroBasicSkill;
                }else if(monsterCfg.Skill){
                    skillId = monsterCfg.Skill;
                }
                break;
            case SKILL_TYPE.PASSIVE_SKILL1:
                if(monsterCfg.NoumenonID && this._heroCfg){
                    skillId = this._heroCfg.HeroBasicPassive1;
                }else if(monsterCfg.Passive1){
                    skillId = monsterCfg.Passive1;
                }
                break;
            case SKILL_TYPE.PASSIVE_SKILL2:
                if(monsterCfg.NoumenonID && this._heroCfg){
                    skillId = this._heroCfg.HeroBasicPassive2;
                }else if(monsterCfg.Passive2){
                    skillId = monsterCfg.Passive2;
                }
                break;
        }
        if(isNaN(skillId)) return null;

        let skillCfg = configUtils.getSkillConfig(skillId);
        let skillCfgEntity = {
            state: SKILL_STATE.UNLOCK,
            unlockStar: 1,
            skill: skillId,
        };

        if(!this._monsterCfg.NoumenonID){
            return skillCfgEntity;
        }

        let monsterStar = this._monsterCfg.NoumenonHeroStar || 1;
        let unlockStar = skillCfg.Star;
        skillCfgEntity.unlockStar = unlockStar;

        if(unlockStar <= monsterStar){
            skillCfgEntity.state = SKILL_STATE.UNLOCK;
            return skillCfgEntity;
        }

        return  null;
    }
}
