import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { logger } from "../../../common/log/Logger";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { gamesvr } from "../../../network/lib/protocol";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemBuff extends cc.Component {
    @property(cc.Label)     lbName: cc.Label = null;
    @property(cc.Sprite)    sprIcon: cc.Sprite = null;
    @property(cc.Label)     countLb: cc.Label = null;
    
    private _buff: gamesvr.IBuffResult = null;
    private _asyncLoader: SpriteLoader = new SpriteLoader();
    private _cfg: cfg.SkillBuff = null;
    
    init (buff: gamesvr.IBuffResult, preadd?: boolean) {
        let cfg = configUtils.getBuffConfig(buff.BuffID);
        this.lbName.string = cfg.Name;
        let buffCount: number = buff.Count || 0;
        this.countLb.string = (buff.Count || 0) + '';
        this.countLb.node.opacity = buffCount > 1 ? 255 : 0;
        if (preadd) {
            this.node.opacity = 0;
        } else {
            this.node.opacity = 255;
        }

        if (this._dataEqual(buff)) {
            return;
        }
        this._buff = buff
        this._cfg = configUtils.getBuffConfig(buff.BuffID);
        if (this._cfg) {
            this._asyncLoader.changeSprite(this.sprIcon, resPathUtils.getBuffIconPath(this._cfg.Icon));
        } else {
            this.node.active = false;
            logger.error('ItemBuff', `没有找到配置. buff id = ${buff.BuffID}`);
        }
    }

    deInit () {
        this._asyncLoader.release();
    }

    get buff () {
        return this._buff;
    }

    // 来一个缓动的出现效果（一般是用作没有飞行动画的时候用的）
    fadeIn () {
        this.node.opacity = 0;
        this.node.scale = 0;
        this.node.stopAllActions();
        this.node.runAction(cc.spawn(
            cc.fadeIn(0.3).easing(cc.easeBackOut()),
            cc.scaleTo(0.3, 1).easing(cc.easeBackOut()),
        ));
    }
    
    // 移除动画
    fadeOut (callback: () => void) {
        this.node.stopAllActions();
        this.node.runAction(cc.sequence(
            cc.scaleTo(0.4, 0).easing(cc.easeBackIn()),
            cc.callFunc(() => {
                callback();
            })
        ));
    }

    private _dataEqual (info: gamesvr.IBuffResult): boolean {
        if (this._buff) {
            return this._buff.BuffID === info.BuffID 
                && this._buff.Count === info.Count
                && this._buff.BuffUID === info.BuffUID;
        }
        
        return false;
    }
}