import { ALLTYPE_TYPE, HEAD_ICON, QUALITY_TYPE } from "../../../app/AppEnums";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { configManager } from "../../../common/ConfigManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { bagData } from "../../models/BagData";
import { divineData } from "../../models/DivineData";
import { serverTime } from "../../models/ServerTime";
import { DISPATCH_STATE } from "./DivineDispatchView";
import ItemQualityEffect, { QUALITY_EFFECT_TYPE }from "../view-item/ItemQualityEffect";
import { ItemQualityPool } from "../../../common/res-manager/NodePool";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemDispatchHero extends cc.Component {
    @property(cc.Node) rootNode: cc.Node = null;
    @property(cc.Node) selectedNode: cc.Node = null;
    @property(cc.Node) starsContent: cc.Node = null;
    @property(cc.Sprite) heroHead: cc.Sprite = null;
    @property(cc.Sprite) heroType: cc.Sprite = null;
    @property(cc.Sprite) equipType: cc.Sprite = null;
    @property(cc.Sprite) heroTrigram: cc.Sprite = null;
    @property(cc.Node) dispatchedNode: cc.Node = null;
    @property(cc.Node) quality: cc.Node = null;
    @property(cc.Node) qualityEffNode: cc.Node = null;
    private _itemQuality: ItemQualityEffect = null;

    private _heroId: number = 0;
    private _clickHandle: Function = null;
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    
    deInit() {
        this._spriteLoader.release();
        cc.isValid(this._itemQuality) && ItemQualityPool.put(this._itemQuality);
        this._itemQuality = null;
    }

    unuse() {
        this.deInit();
    }

    reuse() {
    }

    init(heroId: number, isSelected: boolean = false, clickHandle: Function = null) {
        this._heroId = heroId;
        this._clickHandle = clickHandle;
        this._refreshView();
        this.refreshSelected(isSelected);
    }

    private _refreshView() {
        this.rootNode.active = this._heroId > 0;
        if(!(this._heroId > 0)) return;

        let heroCfg = configUtils.getHeroBasicConfig(this._heroId);
        let headUrl = resPathUtils.getItemIconPath(this._heroId, HEAD_ICON.SQUARE);
        this._spriteLoader.changeSprite(this.heroHead, headUrl);

        // 定位
        let ability = heroCfg.HeroBasicAbility;
        let abilityCfg = configManager.getOneConfigByManyKV('allType', 'HeroTypeForm', ALLTYPE_TYPE.HERO_ABILITY, 'HeroTypeFormNum', ability);
        let abilityUrl = resPathUtils.getHeroAllTypeIconUrl(abilityCfg.HeroTypeIcon);
        this._spriteLoader.changeSprite(this.heroType, abilityUrl);

        // 装备类型
        let equipType = heroCfg.HeroBasicEquipType;
        let equipTypeCfg = configManager.getOneConfigByManyKV('allType', 'HeroTypeForm', ALLTYPE_TYPE.HERO_EQUIP_TYPE, 'HeroTypeFormNum', equipType);
        let equipTypeUrl = resPathUtils.getHeroAllTypeIconUrl(equipTypeCfg.HeroTypeIcon);
        this._spriteLoader.changeSprite(this.equipType, equipTypeUrl);
        
        // 卦象
        let trigrams = heroCfg.HeroBasicTrigrams;
        let trigramsCfg = configManager.getOneConfigByManyKV('allType', 'HeroTypeForm', ALLTYPE_TYPE.HERO_TRIGRAMS, 'HeroTypeFormNum', trigrams);
        let trigramsUrl = resPathUtils.getHeroAllTypeIconUrl(trigramsCfg.HeroTypeIcon);
        this._spriteLoader.changeSprite(this.heroTrigram, trigramsUrl);

        let heroUnit = bagData.getItemByID(this._heroId);
        let star = heroUnit.Array[0] && heroUnit.Array[0].HeroUnit && heroUnit.Array[0].HeroUnit.Star;
        this.starsContent.children.forEach((_star, _index) => {
            _star.active = _index <= star - 1;
        });

        let qualityUrl: string = resPathUtils.getHeroHeadQualityIcon(heroCfg.HeroBasicQuality);
        let qualitySpComp = this.quality.getComponent(cc.Sprite);
        cc.isValid(qualitySpComp) && this._spriteLoader.changeSprite(qualitySpComp, qualityUrl);
        
        let dispatchState = this._getHeroDispatchState(this._heroId);
        this.dispatchedNode.active = DISPATCH_STATE.DISPATCHED == dispatchState;

        if(this._checkNeedShowQualityEffect(heroCfg.HeroBasicQuality)) {
            this._itemQuality = this._itemQuality || ItemQualityPool.get();
            if (!cc.isValid(this._itemQuality.node.parent)) {
                this.qualityEffNode.addChild(this._itemQuality.node);
            }
            this._itemQuality.node.active = true;
            this._itemQuality.onInit(heroCfg.HeroBasicQuality, cc.size(108, 108), QUALITY_EFFECT_TYPE.CIRCLE);
            return;
        }
        
        if(cc.isValid(this._itemQuality)) {
            ItemQualityPool.put(this._itemQuality);
            this._itemQuality = null;
        }
    }

    refreshSelected(isSelected: boolean) {
        this.selectedNode.active = isSelected;
    }

    onClickItem() {
        if(this._clickHandle) {
            this._clickHandle();
        }
    }

    private _getHeroDispatchState(heroId: number): DISPATCH_STATE {
        let tasks = divineData.tasksList;
        for(const k in tasks) {
            let task = tasks[k];
            if(task.HeroIDList && task.HeroIDList.indexOf(heroId) > -1 && !this._checkTaskHeroNotDispatch(Number(k))) {
                return DISPATCH_STATE.DISPATCHED;
            }
        }
        return DISPATCH_STATE.NOT_DISPATCH;
    }

    private _checkTaskHeroNotDispatch(seq: number) {
        let task = divineData.getTaskById(seq);
        if(task && task.IsExecute) {
            let curTime = serverTime.currServerTime();
            let taskCfg = configUtils.getDispatchTaskConfig(task.TaskID);
            return curTime >= Number(task.ExecuteTime) + taskCfg.CostTime;
        }
        return true;
    }


    private _checkNeedShowQualityEffect(quality: QUALITY_TYPE): boolean {
        return typeof quality != 'undefined' && quality >= QUALITY_TYPE.SSR;
    }
}
