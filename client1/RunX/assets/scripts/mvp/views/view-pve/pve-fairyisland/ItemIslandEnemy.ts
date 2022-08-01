import { RES_ICON_PRE_URL } from "../../../../app/AppConst";
import { configUtils } from "../../../../app/ConfigUtils";
import { eventCenter } from "../../../../common/event/EventCenter";
import { SpriteLoader } from "../../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../../config/config";

const {ccclass, property} = cc._decorator;
@ccclass
export default class ItemIslandEnemy extends cc.Component {

    @property(cc.Sprite) bossImgBg: cc.Sprite = null;
    @property(cc.Sprite) enemySp: cc.Sprite = null;

    private _spriteLoader: SpriteLoader = new SpriteLoader();

    onInit(): void {
       
    }

    /**item释放清理*/
    deInit() {
        this._spriteLoader.release();
        eventCenter.unregisterAll(this);
    }

    checkIsBoss(boss: boolean) {
        this.bossImgBg.node.active = boss;
    }

    loadEnemeySp(monsterId:number) {
        let cfg = configUtils.getMonsterConfig(monsterId);
        if (cfg) {
            let modelCfg: cfg.Model = configUtils.getModelConfig(cfg.ModelId);
            let url = `${RES_ICON_PRE_URL.HEAD_IMG}/${modelCfg.ModelHeadIconSquare}`;
            this.enemySp.node.scale = 0.6;
            this._spriteLoader.changeSprite(this.enemySp, url);
        }
    }        
}