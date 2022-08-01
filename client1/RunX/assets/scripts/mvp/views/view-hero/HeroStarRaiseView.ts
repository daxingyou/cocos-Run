import { VIEW_NAME } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import guiManager from "../../../common/GUIManager";
import { logger } from "../../../common/log/Logger";
import skeletonManager from "../../../common/SkeletonManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { bagData } from "../../models/BagData";
import HeroUnit from "../../template/HeroUnit";
import { SKILL_TYPE } from "./HeroSkillView";
import ItemSkill from "./ItemSkill";

const {ccclass, property} = cc._decorator;

const CLOSE_DELAY_TIME = 1000;
const HERO_MAX_STAR = 6;

enum SKILL_STATE {
  NOT_EXIST,
  LOCK,
  UNLOCK
}

const TAG_SPINE = "HERO_RAISE"

@ccclass
export default class HeroStarRaiseView extends ViewBaseComponent {
    @property(sp.Skeleton) bgEff: sp.Skeleton = null;
    @property(cc.Node) skillTemplate: cc.Node = null;
    @property([cc.Node]) propNodes: cc.Node[] = [];
    @property(cc.Node) tagTemplate: cc.Node = null;
    @property(cc.Node) starBgNode: cc.Node = null;
    @property(cc.Node) starNode: cc.Node = null;
    @property(cc.Node) propContainor: cc.Node = null;
    @property(cc.Node) skillContainor: cc.Node = null;
    @property(cc.Sprite) heroIcon: cc.Sprite = null;
    @property(cc.Node) spineParent: cc.Node = null;
    @property(cc.Node) closeTip: cc.Node = null;
    @property(cc.Node) starEff: cc.Node = null;
    @property(cc.Node) titleNode: cc.Node = null;

    private _openTime: number = 0;
    private _spriteLoader: SpriteLoader = null;
    private _heroID: number = 0;
    private _darkStars: cc.Node[] = null;
    private _lightStars: cc.Node[] = null;
    private _heroInfo: HeroUnit = null;
    private _skillComps: ItemSkill[] = null;
    private _skillTypeMap: Map<number, SKILL_TYPE> = new Map();
    private _curSpineName: string = null;

    onInit(heroID: number) {
        this._openTime = new Date().getTime();
        this._heroID = heroID;
        this._heroInfo = bagData.getHeroById(heroID);
        this.closeTip.active = false;
        this.starEff.active = false;
        this._initUI();
        this.scheduleOnce(()=> {
            this.closeTip.active = true;
            this.closeTip.opacity = 0;
            cc.tween(this.closeTip).repeatForever(cc.tween().to(2, {opacity: 255}).to(2, {opacity: 0})).start()
        }, 1);
    }

    private _initUI(){
        this._playBgEff();
        this._setHeroStar();
        this._setHeroProp();
        this._setSkill();
        this._setHeroImage();
    }

    private _playBgEff(){
        if(this.titleNode.parent == this.node){
            //@ts-ignore
            let bones = this.bgEff.attachUtil.generateAttachedNodes('bone5');
            if(bones && bones.length > 0){
                this.titleNode.setPosition(cc.Vec2.ZERO);
                this.titleNode.parent = bones[0];
            }
        }

        this.bgEff.clearTracks();
        this.bgEff.setAnimation(0, 'animation', false);
    }

    //设置英雄星级
    private _setHeroStar(){
        if(!this._darkStars){
            this._darkStars = [];
            for(let i = 0; i < HERO_MAX_STAR; i++){
                let star = cc.find(`star_${i}`, this.starBgNode);
                star.active = false;
                this._darkStars.push(star);
            }
        }

        if(!this._lightStars){
            this._lightStars = [];
            for(let i = 0; i < HERO_MAX_STAR; i++){
                let star = cc.find(`star_${i}`, this.starNode);
                star.active = false;
                this._lightStars.push(star);
            }
        }

        if(!this._heroInfo) return;
        let star =  this._heroInfo.star;

        let delay = 0.05;
        for(let i = 0; i < HERO_MAX_STAR; i++){
            let idx = i;
            let delayTime = delay * idx;
            this._darkStars[idx].active = true;
            if(idx < star){
                this._lightStars[i].active = true;
                this._lightStars[i].scale = 0;

                cc.tween(this._lightStars[idx]).delay(delayTime).call(() => {
                  this._lightStars[idx].scale = 5;
                }, this).to(0.2, {scale: 1}, {easing: 'quadIn'}).call(() => {
                  this._darkStars[idx].active = true;
                  idx == star - 1 && this._playStarEff();
                }, this).start();
            }
        }
    }

    private _playStarEff(){
        this.starEff.parent = this._lightStars[this._heroInfo.star - 1];
        this.starEff.setPosition(cc.Vec2.ZERO);
        this.starEff.active = true;
    }

    //设置技能
    private _setSkill(){
        if(!this._heroInfo) return;

        let basicSkillState = this._getSkillConfig(SKILL_TYPE.BASIC_SKILL);
        let passiveskillState1 = this._getSkillConfig(SKILL_TYPE.PASSIVE_SKILL1);
        let passiveskillState2 = this._getSkillConfig(SKILL_TYPE.PASSIVE_SKILL2);

        let basicSkills: cc.Node = null;
        let spaceX = 80;
        if(basicSkillState){
            basicSkills = cc.instantiate(this.tagTemplate);
            let tagName = `必\n杀\n技`;
            cc.find('Label', basicSkills).getComponent(cc.Label).string = tagName;
            let skillNode = cc.instantiate(this.skillTemplate);
            let skillComp = skillNode.getComponent(ItemSkill);
            this._skillTypeMap.set(basicSkillState.skill, SKILL_TYPE.BASIC_SKILL);
            skillComp.onInit(basicSkillState.skill, resPathUtils.getSkillIconPathByID(basicSkillState.skill), this._onSkillClick.bind(this));
            let isLock = basicSkillState.state == SKILL_STATE.LOCK;
            cc.find('basicSkill/lock', skillNode).active = isLock;
            isLock && (cc.find('basicSkill/lock/unlockLvLb', skillNode).getComponent(cc.Label).string = `${basicSkillState.unlockStar}星解锁`);

            let isNewSkill = false;
            !isLock && (isNewSkill = this._heroInfo.star == basicSkillState.unlockStar);
            cc.find('basicSkill/levelup', skillNode).active = !isLock && !isNewSkill;
            cc.find('basicSkill/new', skillNode).active = !isLock && isNewSkill;

            this._skillComps = this._skillComps || [];
            this._skillComps.push(skillComp);
            skillNode.active = true;
            skillNode.x = spaceX;
            basicSkills.addChild(skillNode);
        }

        let passiveSkills: cc.Node = null;
        let tagName = `被\n动\n技`;
        if(passiveskillState1){
            passiveSkills = cc.instantiate(this.tagTemplate);
            cc.find('Label', passiveSkills).getComponent(cc.Label).string = tagName;
            let skillNode = cc.instantiate(this.skillTemplate);
            let skillComp = skillNode.getComponent(ItemSkill);
            this._skillTypeMap.set(passiveskillState1.skill, SKILL_TYPE.PASSIVE_SKILL1);
            skillComp.onInit(passiveskillState1.skill, resPathUtils.getSkillIconPathByID(passiveskillState1.skill), this._onSkillClick.bind(this));
            let isLock =  passiveskillState1.state == SKILL_STATE.LOCK;
            cc.find('basicSkill/lock', skillNode).active = isLock;
            isLock && (cc.find('basicSkill/lock/unlockLvLb', skillNode).getComponent(cc.Label).string = `${passiveskillState1.unlockStar}星解锁`);

            let isNewSkill = false;
            !isLock && (isNewSkill = this._heroInfo.star == basicSkillState.unlockStar);
            cc.find('basicSkill/levelup', skillNode).active = !isLock && !isNewSkill;
            cc.find('basicSkill/new', skillNode).active = !isLock && isNewSkill;

            this._skillComps = this._skillComps || [];
            this._skillComps.push(skillComp);
            skillNode.active = true;
            skillNode.x = spaceX;
            spaceX += 130;
            passiveSkills.addChild(skillNode);
        }

        if(passiveskillState2){
            if(!cc.isValid(passiveSkills)){
                passiveSkills = cc.instantiate(this.tagTemplate);
                cc.find('Label', passiveSkills).getComponent(cc.Label).string = tagName;
            }
            let skillNode = cc.instantiate(this.skillTemplate);
            let skillComp = skillNode.getComponent(ItemSkill);
            this._skillTypeMap.set(passiveskillState2.skill, SKILL_TYPE.PASSIVE_SKILL2);
            skillComp.onInit(passiveskillState2.skill, resPathUtils.getSkillIconPathByID(passiveskillState2.skill), this._onSkillClick.bind(this));
            let isLock = passiveskillState2.state == SKILL_STATE.LOCK;
            cc.find('basicSkill/lock', skillNode).active = isLock;
            isLock && (cc.find('basicSkill/lock/unlockLvLb', skillNode).getComponent(cc.Label).string = `${passiveskillState2.unlockStar}星解锁`);

            let isNewSkill = false;
            !isLock && (isNewSkill = this._heroInfo.star == basicSkillState.unlockStar);
            cc.find('basicSkill/levelup', skillNode).active = !isLock && !isNewSkill;
            cc.find('basicSkill/new', skillNode).active = !isLock && isNewSkill;

            this._skillComps = this._skillComps || [];
            this._skillComps.push(skillComp);
            skillNode.active = true;
            skillNode.x = spaceX;
            passiveSkills.addChild(skillNode);
        }

        if(cc.isValid(basicSkills)){
            basicSkills.active = true;
            this.skillContainor.addChild(basicSkills)
        }

        if(cc.isValid(passiveSkills)){
            passiveSkills.active = true;
            this.skillContainor.addChild(passiveSkills);
        }
    }

    //设置属性
    private _setHeroProp(){
        let self = this;

        if(!this._heroInfo) return;

        let heroPropCfg = configUtils.getHeroPropertyConfig(this._heroID);
        if(!heroPropCfg) return;

        let star = this._heroInfo.star;
        let level = this._heroInfo.lv - 1;

        type PropInfo = {lastValue: number, currValue: number, desc: string, url: string}
        let collectProp = (propName: string, desc: string) : PropInfo =>{
            //@ts-ignore
            let propArr = utils.parseStringTo1Arr(heroPropCfg[propName]);
            //@ts-ignore
            let propAddArr = utils.parseStringTo1Arr(heroPropCfg[`${propName}Add`]);
            let lastProp = parseInt(propArr[star - 2]) + level * parseInt(propAddArr[star - 2]);
            let currProp = parseInt(propArr[star - 1]) + level * parseInt(propAddArr[star -1]);
            return {lastValue: lastProp, currValue: currProp, desc: desc, url: ''};
        }


        let props: PropInfo[] = [];
        props.push(collectProp('Hp', '血量'));
        props.push(collectProp('Attack', '攻击'));
        props.push(collectProp('Speed', '速度'));
        props.push(collectProp('Defend', '防御'));

        props.forEach((ele, idx) => {
            let propNode = self.propNodes[idx];
            cc.find('propName', propNode).getComponent(cc.Label).string = ele.desc;
            cc.find('oldProp', propNode).getComponent(cc.Label).string = `${ele.lastValue}`;
            cc.find('newProp', propNode).getComponent(cc.RichText).string = `<color=#00ff00>${ele.currValue}</color>`;
            //<color=#00FF00>(${ele.currValue - ele.lastValue})</color> 属性增量，暂时不显示，备用
        });
    }

    //设置英雄立绘
    private _setHeroImage(){
        if(!this._heroInfo) return;

        let heroModelCfg = configUtils.getModelConfig(this._heroInfo.heroCfg.HeroBasicModel);
        if(!heroModelCfg) return;

        //spine
        if(heroModelCfg.ModelLive2d) {
            this.heroIcon.node.active = false;
            this.spineParent.active = true;
            let spineUrl: string = resPathUtils.getModelLive2dPath(heroModelCfg.ModelLive2d);
            this._loadModelSpine(spineUrl, heroModelCfg);
            return;
        }

        //静态图
        if(heroModelCfg.ModelPhoto) {
            this.heroIcon.node.active = true;
            this.spineParent.active = false;
            this._spriteLoader = this._spriteLoader || new SpriteLoader();
            cc.isValid(this.heroIcon.spriteFrame) && this._spriteLoader.deleteSprite(this.heroIcon);
            let url = resPathUtils.getModelPhotoPath(this._heroInfo.heroCfg.HeroBasicModel);
            this._spriteLoader.changeSpriteP(this.heroIcon, url).then(() => {

            }).catch((err) => {
                logger.error(err);
                this._spriteLoader.deleteSprite(this.heroIcon);
            });
            return;
        }
    }

    onRelease(): void {
        this._spriteLoader && this._spriteLoader.release();
        this._spriteLoader = null;
        this._releaseSpine();
        this._skillComps && this._skillComps.forEach(ele => {
            ele.deInit();
        })
        this._skillComps = null;

        this._darkStars && this._darkStars.forEach(ele => { cc.Tween.stopAllByTarget(ele);});
        this._darkStars && (this._darkStars.length = 0);
        this._darkStars = null;

        this._lightStars && this._lightStars.forEach(ele => { cc.Tween.stopAllByTarget(ele);});
        this._lightStars && (this._lightStars.length = 0);
        this._lightStars = null;
        this._skillTypeMap.clear();
        this.unscheduleAllCallbacks();
        this.node.stopAllActions();
        cc.Tween.stopAllByTarget(this.closeTip);
        this.bgEff.clearTracks();
         //@ts-ignore
         let bones = this.bgEff.attachUtil.generateAttachedNodes('bone5');
         if(bones && bones.length > 0){
            this.titleNode.parent = this.node;
            //@ts-ignore
            this.bgEff.attachUtil.destroyAttachedNodes('bone5');
         }
    }

    onClickClose(){
        if(!this._openTime) return;
        if(new Date().getTime() - this._openTime >= CLOSE_DELAY_TIME){
            this._openTime = 0;
            this.closeView();
        }
    }

    private _getSkillConfig(skillType: SKILL_TYPE) {
        if(!this._heroInfo || !this._heroInfo.heroCfg) return null;
        let heroCfg = this._heroInfo.heroCfg;
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
        let initStar = bagDataUtils.getHeroInitStar(this._heroID);
        let skillCfg = {
            state: this._heroInfo.isHeroBasic ? SKILL_STATE.UNLOCK : SKILL_STATE.LOCK,
            unlockStar: initStar,
            skill: skillId
        };

        let unlockStar = configUtils.getSkillConfig(skillId).Star;
        skillCfg.unlockStar = unlockStar;
        if(this._heroInfo.isHeroBasic && unlockStar > this._heroInfo.star){
              skillCfg.state = SKILL_STATE.LOCK;
        }else {
              skillCfg.state = SKILL_STATE.UNLOCK;
        }
        return skillCfg;
    }

    private _onSkillClick(skillID: number){
        guiManager.loadView(VIEW_NAME.TIPS_SKILL, guiManager.sceneNode, this._heroID, this._skillTypeMap.get(skillID));
    }


    private _loadModelSpine(url: string, modelCfg: cfg.Model) {
        if(!url || this._curSpineName == url) return;

        if(this.spineParent.childrenCount > 0) {
            this._releaseSpine();
        }
        this._curSpineName = url;
        // 加载Skeleton
        skeletonManager.loadSkeleton(url, TAG_SPINE)
          .then(skeleton => {
            let spineNode = skeleton.node;
            this.spineParent.addChild(spineNode);
            let modelSizeList = utils.parseStingList(modelCfg.ModelLive2dSize);
            this.spineParent.setScale(cc.v2(Number(modelSizeList[0]) / 10000, Number(modelSizeList[1]) / 10000));
            this.spineParent.setPosition(cc.v2(Number(modelSizeList[2]), Number(modelSizeList[3])));
            skeleton.setAnimation(0, 'animation', true);
        });

    }

    private _releaseSpine() {
        if (this.spineParent.childrenCount == 0) {
            this._curSpineName = null;
            return;
        }

        let childSpine = this.spineParent.children[0];
        if(childSpine && cc.isValid(childSpine) && childSpine.getComponent(sp.Skeleton)) {
            skeletonManager.releaseSkeleton(this._curSpineName, childSpine.getComponent(sp.Skeleton), TAG_SPINE);
        }
        this._curSpineName = null;
    }
}
