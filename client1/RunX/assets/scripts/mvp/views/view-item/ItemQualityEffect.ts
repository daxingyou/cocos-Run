import { QUALITY_TYPE } from "../../../app/AppEnums";

const {ccclass, property} = cc._decorator;

export enum QUALITY_EFFECT_TYPE {
    ITEM = 1,
    CIRCLE,
    TAG,
    HERO_LIST,
    HERO_SMALL
}

@ccclass
export default class ItemQualityEffect extends cc.Component {
    @property(sp.SkeletonData)  itemEffects: sp.SkeletonData = null;
    @property(sp.SkeletonData)  circleEffects: sp.SkeletonData = null;
    @property(sp.SkeletonData)  heroListEffects: sp.SkeletonData = null;
    @property([cc.Vec2])    initSizes: cc.Vec2[] = [];
    @property(cc.Size)      skeletonSize: cc.Size = null;
    @property(sp.Skeleton)  effectSkt: sp.Skeleton = null;

    
    private _effectType: QUALITY_EFFECT_TYPE = null;

    onInit(quality: QUALITY_TYPE, size?: cc.Size, effectType?: QUALITY_EFFECT_TYPE) {
        if(!!effectType) {
            this._effectType = effectType;
        }
        this._refreshSkeleton(quality);
    }
    
    deInit() {
        this._clearSke();
    }

    private _refreshSkeleton(quality: number) {
        if (quality < QUALITY_TYPE.SSR) {
            this._clearSke();
            return
        }
        let skeletonData: sp.SkeletonData = null;
        switch(this._effectType) {
            case QUALITY_EFFECT_TYPE.TAG: {
                // skeletonData = this.tagEffects[quality - 1];
                break;
            }
            case QUALITY_EFFECT_TYPE.ITEM: {
                skeletonData = this.itemEffects;
                break;
            }
            case QUALITY_EFFECT_TYPE.CIRCLE: {
                skeletonData = this.circleEffects;
                break;
            }
            case QUALITY_EFFECT_TYPE.HERO_LIST: {
                skeletonData = this.heroListEffects;
                break;
            }
            case QUALITY_EFFECT_TYPE.HERO_SMALL: {
                skeletonData = this.itemEffects;
                break;
            }
            default:
                break;
        }
        if(!skeletonData) {
            this.node.active = false;
            this._clearSke()
        } else {
            if(!this.effectSkt.skeletonData || skeletonData.name != this.effectSkt.skeletonData.name) {
                this._clearSke()
                this.effectSkt.skeletonData = skeletonData;
            }
            this.node.active = true;
            if (this.effectSkt.skeletonData) {
                this.effectSkt.setAnimation(0, 'animation', true);
            } 
            this.effectSkt.node.active = true;
        } 
    }

    private _refreshSize(size?: cc.Size) {
        let contentSize: cc.Size = size ? size : this.skeletonSize;
        let scale: cc.Vec2 = this._calculateScale(contentSize);
        this.node.setScale(scale);
    }

    private _calculateScale(contentSize: cc.Size): cc.Vec2 {
        let initSize = this.initSizes[this._effectType - 1];
        let scaleX: number = contentSize.width / initSize.x;
        let scaleY: number = contentSize.height / initSize.y;
        return cc.v2(1/scaleX, 1/scaleY);
    }

    private _clearSke(){
        this.effectSkt.node.active = false
    }

    // onEnable(){
    //     if (this.effectSkt.skeletonData){
    //         this.node.active = true;
    //         this.effectSkt.setAnimation(0, 'animation', true);  
    //     }
    // }

}
