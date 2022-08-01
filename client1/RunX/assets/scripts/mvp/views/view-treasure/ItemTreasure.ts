import { QUALITY_TYPE } from "../../../app/AppEnums";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { configManager } from "../../../common/ConfigManager";
import { logger } from "../../../common/log/Logger";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemTreasure extends cc.Component {
    @property(cc.Label)         nameLB: cc.Label = null;
    @property(cc.Sprite)        icon: cc.Sprite = null;
    @property(cc.Node)          quality: cc.Node = null;
    @property(cc.Node)          selected: cc.Node = null;

    private _treasureCfg: cfg.LeadTreasure = null;
    private _clickHandle: Function = null;
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _isMax: boolean = false;
    onInit(treasureCfg: cfg.LeadTreasure, clickHandle: Function) {
        this._treasureCfg = treasureCfg;
        this._clickHandle = clickHandle;
        this._isMax = this._checkTreasureIsMax();
        this._refreshView();
        this.refreshSelected(0);
    }

    get isMax() {
        return this._isMax;
    }

    onRelease() {
        this._spriteLoader.release();
    }

    private _refreshView() {
        let itemCfg: cfg.Item = configUtils.getItemConfig(this._treasureCfg.ItemID);
        if(!itemCfg) {
            logger.log(`ItemTreasure 暂未配置值 对应道具Id ${this._treasureCfg.ItemID}`);
            return;
        }
        // this.nameLB.string = this._isMax ? `满级 ${itemCfg.ItemName}` : `${this._treasureCfg.LeadTreasureGroupLevel}级 ${itemCfg.ItemName}`;

        // 现在没icon
        let iconUrl: string = resPathUtils.getItemIconPath(this._treasureCfg.ItemID);
        this._spriteLoader.changeSpriteP(this.icon, iconUrl).catch(() => {
            this._spriteLoader.deleteSprite(this.icon);
        });

        //TODO 品质 到时候会换成特效 现在暂时这么体现
        let qualityColor = null;
        switch (itemCfg.ItemQuality) {
            case QUALITY_TYPE.SSR:
                qualityColor = cc.Color.YELLOW;
                break;
            case QUALITY_TYPE.SR:
                qualityColor = cc.color().fromHEX("#FF00FF");
                break;
            case QUALITY_TYPE.R:
                qualityColor = cc.Color.GREEN;
                break;
            default:
                break;
        }
        this.quality.color = qualityColor;
    }

    onClickItem() {
        if(this._clickHandle) {
            this._clickHandle();
        }
    }

    refreshSelected(groupId: number) {
        this.selected.opacity = groupId == this._treasureCfg.ItemID ? 255 : 0;
    }

    private _checkTreasureIsMax() {
        // 现在没字段
        // let treasureCfgs: {[k: number]: cfg.LeadTreasure} = configManager.getConfigByKV('leadTreasure', 'LeadTreasureGroupId', this._treasureCfg.LeadTreasureGroupId);
        // let maxLevel: number = 0;
        // for(const k in treasureCfgs) {
        //     maxLevel = treasureCfgs[k].LeadTreasureGroupLevel
        // }
        // return this._treasureCfg.LeadTreasureGroupLevel >= maxLevel;
        return true
    }
}
