/*
 * @Author: xuyang
 * @Date: 2021-07-20 13:49:48
 * @Description: 云端梦境主页面Item
 */
import { RES_ICON_PRE_URL, SCENE_NAME } from "../../../app/AppConst";
import { PVE_MODE } from "../../../app/AppEnums";
import { PveConfig } from "../../../app/AppType";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { configManager } from "../../../common/ConfigManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { pveData } from "../../models/PveData";
import { pveTrialData } from "../../models/PveTrialData";
import { userData } from "../../models/UserData";
import guiManager from "../../../common/GUIManager";
import ItemHeadCircle from "../view-item/ItemHeadCircle";
import { ItemHeroHeadCirclePool } from "../../../common/res-manager/NodePool";

const {ccclass, property} = cc._decorator;

@ccclass
export default class PVECloudLessonItem extends cc.Component {
    @property(cc.Label)     ruleTxt: cc.Label = null;
    @property(cc.Node)      challengeBtn: cc.Node = null;
    @property(cc.Node)      passTxt: cc.Node = null;
    @property(cc.Sprite)    heroSpr: cc.Sprite = null;
    @property(cc.Sprite)    bgSpr: cc.Sprite = null;
    @property(cc.Node)      heroRoot: cc.Node = null;

    private _spriteLoader:SpriteLoader = new SpriteLoader();
    private _lessonId:number = 0;
    private _headItems: ItemHeadCircle[] = null;
    private _getBanHeroFn: Function = null;

    init (lessonId: number, getBanHerosFn?: Function) {
        this._lessonId = lessonId;
        this._getBanHeroFn = getBanHerosFn;
        this.showView();
    }

    deInit () {
        this._getBanHeroFn = null;
        this._clearHeadItems();
        this._spriteLoader.release();
        let bgSpComp: cc.Sprite = cc.find('bg', this.node).getComponent(cc.Sprite);
        let sp = bgSpComp.spriteFrame;
        if (sp) sp.decRef();
        bgSpComp.spriteFrame = null;
    }

    unuse (){
        this.deInit();
    }

    reuse(){
    }

    showView(bgSp?: cc.SpriteFrame){
        let lessonInfo  = pveTrialData.cloudInfo.LessonMap[this._lessonId];
        if (!lessonInfo) return;
        let monster = lessonInfo.MonsterIDList[0];
        let monsterCfg: cfg.Monster = configManager.getConfigByKey("monster",monster);
        let passHeros: any = pveTrialData.cloudData.TrialCloudDreamPassLessonMap[this._lessonId];
        let lessonCfg: cfg.PVECloudDreamLesson = configManager.getConfigByKey("cloudDreamLesson", this._lessonId);
        if (monsterCfg && monsterCfg.ModelId){
            let modelPhoto = resPathUtils.getModelPhotoPath(monsterCfg.ModelId);
            let bgPath = `${RES_ICON_PRE_URL.PVE}/${lessonCfg.PVECloudDreamLessonBg}`;
            this._spriteLoader.changeSprite(this.heroSpr, modelPhoto);
            this._spriteLoader.changeSprite(this.bgSpr, bgPath);
        }

        let isPass = !!(passHeros && Object.keys(passHeros).length > 0);
        this.challengeBtn.getChildByName('Label').getComponent(cc.Label).string = isPass ? '重新挑战' : '挑战';
        this.passTxt.active = isPass;
        this.node.active = true;
        this._genPassHeros();
    }

    private _genPassHeros() {
        let cloudData = pveTrialData.cloudData;
        if(!cloudData || !cloudData.TrialCloudDreamPassLessonMap
            || !cloudData.TrialCloudDreamPassLessonMap.hasOwnProperty(this._lessonId+'')
            || !cloudData.TrialCloudDreamPassLessonMap[this._lessonId+'']
            || !cloudData.TrialCloudDreamPassLessonMap[this._lessonId+''].UseHeroMap) return;

        let heroMap = cloudData.TrialCloudDreamPassLessonMap[this._lessonId+''].UseHeroMap;

        let heroIDs = Object.keys(heroMap);
        if(this._headItems && this._headItems.length > heroIDs.length) {
            for(let i = heroIDs.length, len = this._headItems.length; i < len; i++) {
                ItemHeroHeadCirclePool.put(this._headItems[i]);
            }
            this._headItems.splice(heroIDs.length, this._headItems.length - heroIDs.length);
        }

        this._headItems = this._headItems || [];
        let spaceX = -5, headW = 50;
        let startX = -((heroIDs.length * headW + (heroIDs.length - 1) * spaceX) >> 1);
        heroIDs.forEach((ele, idx) => {
            let headItem: ItemHeadCircle = null;
            if(this._headItems.length <= idx) {
                headItem = ItemHeroHeadCirclePool.get();
                headItem.node.parent = this.heroRoot;
                headItem.node.scale = headW / headItem.node.width;
                this._headItems.push(headItem);
            }
            headItem = headItem || this._headItems[idx];
            startX += (headW >> 1);
            headItem.node.setPosition(startX, 0);
            headItem.init(parseInt(ele), null, null, {showQuality: false, showType: false});
            startX += ((headW >> 1) + spaceX);
        })
    }

    private _clearHeadItems() {
        if(!this._headItems || this._headItems.length == 0) return;
        this._headItems.forEach(ele => {
            ItemHeroHeadCirclePool.put(ele);
        });
        this._headItems.length = 0;
    }

    onClickEnter(){
        let banHeroes: number[] = this._getBanHeroFn && this._getBanHeroFn(this._lessonId) || null;
        let pveConfig: PveConfig = {
            lessonId: this._lessonId,
            userLv: userData.lv,
            banHeroList: banHeroes,
            useDefaultSquad: false,
            pveMode: PVE_MODE.CLOUD_DREAM,
            pveListId: 17015
        }
        pveData.pveConfig = pveConfig;
        guiManager.loadScene(SCENE_NAME.BATTLE);
    }
}
