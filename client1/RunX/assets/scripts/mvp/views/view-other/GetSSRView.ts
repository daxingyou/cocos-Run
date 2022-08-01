import { QUALITY_TYPE } from "../../../app/AppEnums";
import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { data } from "../../../network/lib/protocol";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GetSSRView extends ViewBaseComponent {
    @property(sp.Skeleton) ske: sp.Skeleton = null;

    private _touched = false;
    private _items: data.IItemInfo[] = [];
    private _closeCb: Function = null;

    protected onLoad(): void {
        //spine屏幕适配
        let designSize = cc.view.getDesignResolutionSize();
        let wRatio = designSize.width / cc.winSize.width;
        let hRatio = designSize.height / cc.winSize.height;
        let sRatio = Math.min(wRatio, hRatio);
        this.node.children.forEach(ele => {
            if(cc.isValid(ele.getComponent(sp.Skeleton))){
                ele.scale = ele.scale / sRatio;
            }
        });
    }

    onInit(items: data.IItemInfo[], closeCb: Function){
        this._items = items;
        this._closeCb  = closeCb;
        this.ske.setAnimation(0, "chouka1", true);

        this.node.on(cc.Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this._onTouchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this._onTouchEnd, this);
    }

    private _onTouchStart(){
        if (this._touched) return;
        this.ske.setAnimation(0, "chouka2", true);
    }

    private _onTouchEnd() {
        if (this._touched) return;
        this._touched = true;
        
        let quality = this._getBestQuality();
        let skeAnim = `chouka${quality}01`
        if (quality < QUALITY_TYPE.R) {
            this._closeCb && this._closeCb();
            this.closeView();
            return; 
        }

        this.ske.setAnimation(0, skeAnim, true);
        this.scheduleOnce(()=>{
            this._closeCb && this._closeCb();
            // this.closeView();
        }, 1.3)

        this.scheduleOnce(()=>{
            // this._closeCb && this._closeCb();
            this.closeView();
        }, 2)

    }

    private _getBestQuality() {
        let quality: number = 0;
        this._items.forEach(_item => {
            let heroCfg = configUtils.getHeroBasicConfig(_item.ID);
            if (heroCfg) {
                quality = Math.max(heroCfg.HeroBasicQuality, quality);
                return;
            }

            let equipCfg = configUtils.getEquipConfig(_item.ID);
            if (equipCfg) {
                quality = Math.max(equipCfg.Quality, quality);
                return;
            }

            let beastCfg = configUtils.getBeastConfig(_item.ID);
            if (beastCfg) {
                quality = Math.max(beastCfg.BeastQuality, quality);
            }
        })
        return quality;
    }

    onRelease(){
        this.unscheduleAllCallbacks()
        this.ske.clearTracks();
        this.node.off(cc.Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this._onTouchEnd, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this._onTouchEnd, this);
    }
}
