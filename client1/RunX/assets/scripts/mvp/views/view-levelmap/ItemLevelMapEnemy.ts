/**
 * 张海洋
 * 2021.4.26
 * 关卡 敌方阵容一个Item
 */

import { RES_ICON_PRE_URL } from "../../../app/AppConst";
import { configUtils } from "../../../app/ConfigUtils";
import { logger } from "../../../common/log/Logger";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ItemLevelMapEnemy extends cc.Component {

    @property(cc.Label) lvLabel: cc.Label = null;
    @property(cc.Node) bossIconNode: cc.Node = null;
    @property(cc.Sprite) headSprite: cc.Sprite = null;

    private _enemyInfo: cfg.Monster = null;
    private isLoaded: boolean = false;
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _clickHandler: Function = null
    onLoad() {
        this.isLoaded = true;
    }

    deInit() {
        if (this._spriteLoader) {
            this._spriteLoader.release();
        }
    }

    unuse() {
        this.deInit();
    }

    reuse() {

    }

    init (monsterId: number, isBoss: boolean, clickHandler?: Function) {
        if (!monsterId) return;
        let cfg = configUtils.getMonsterConfig(monsterId);
        if (cfg) {
            this._enemyInfo = cfg;
        }
        if (this.isLoaded) {
        }
        this._clickHandler = clickHandler;
        this.refreshEnemyView(isBoss);
    }

    onClick () {
        this._clickHandler && this._clickHandler(this._enemyInfo.MonsterId)
    }

    refreshEnemyView(isBoss: boolean) {
        if (this._enemyInfo) {
            this.node.active = true;
            this.bossIconNode.active = isBoss;
            let modelCfg: cfg.Model = configUtils.getModelConfig(this._enemyInfo.ModelId);
            let url: string = `${RES_ICON_PRE_URL.HEAD_IMG}/${modelCfg.ModelHeadIconSquare}`;
            this._spriteLoader.changeSprite(this.headSprite, url);
        } else {
            logger.error(`LevelEnemyItem 怪物信息获取失败`);
            return;
        }
    }

    onDestroy() {
        this.deInit();
    }
}
