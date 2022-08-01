/*
 * @Description:Boss血条组件
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-07-24 17:22:08
 * @LastEditors: lixu
 * @LastEditTime: 2021-09-29 18:58:24
 */
import { RES_ICON_PRE_URL } from "../../../app/AppConst";
import { configUtils } from "../../../app/ConfigUtils";
import { cfg } from "../../../config/config";
import { ParkourScene } from "../view-scene/ParkourScene";
import { HP_BAR_LERP_MIN_TRRESSHOLD, HP_BAR_LERP_RATIO } from "./ParkourConst";
import { MonsterInfo } from "./ParkourMonster";

const {ccclass, property} = cc._decorator;

const DefaultHPBarCount = 1;

@ccclass
export default class BossHpBarComp extends cc.Component {
    @property(cc.Node) head: cc.Node = null;
    @property(cc.ProgressBar) hpBar: cc.ProgressBar = null;
    @property(cc.Label) hpText: cc.Label = null;
    @property(cc.Node) hpEffect: cc.Node = null;
    @property(cc.Label) bossName: cc.Label = null;
    @property([cc.SpriteFrame]) hpBarSpriteFrames: cc.SpriteFrame[] = [];

    private _bossInfo: MonsterInfo = null;
    private _perBarHP: number = 0;
    private _hpBarCount: number = DefaultHPBarCount;
    private _defaultHpBarBgSf: cc.SpriteFrame = null;

    private _effectTargetWidth: number = -1;  //血条效果的目标宽度
    private _effectTween: cc.Tween = null;

    onInit(...params: any[]){
        this._defaultHpBarBgSf = this._defaultHpBarBgSf || this.hpBar.node.getComponent(cc.Sprite).spriteFrame;
    }

    deInit(...params: any[]){
        cc.Tween.stopAllByTarget(this.hpEffect);
        this._effectTween = null;
        this.hpEffect.active = false;
        this.head.getComponent(cc.Sprite).spriteFrame = null;
        this._bossInfo = null;
        this.hpBar.node.getComponent(cc.Sprite);
        this._defaultHpBarBgSf = null;

    }

    private _resetBossHead(config: cfg.RunXMonster){
        if(!this._bossInfo) return;
        if(!this._bossInfo.isBoss()) return;
        let modelConfig = configUtils.getModelConfig(config.ArtID);
        this.head.getComponent(cc.Sprite).spriteFrame = ParkourScene.getInstance().getSprite(`${RES_ICON_PRE_URL.HEAD_IMG}/${modelConfig.ModelHeadIconCircular}`);
        this.bossName.string = config.MonsterName || '';
    }

    private _resetBossHP(config: cfg.RunXMonster){
        if(!this._bossInfo) return;
        if(!this._bossInfo.isBoss()) return;
        this._hpBarCount = config.RunXMonsterBossHpBarNum || DefaultHPBarCount;
        this._perBarHP = this._bossInfo.maxHp / this._hpBarCount;
        this._updateHP();
        this.hpEffect.width = this.hpBar.totalLength;
        this.hpEffect.active = true;
    }

    updateHP(){
        if(!this._bossInfo || this._bossInfo.currHp <= 0) return;
        this._updateHP();
        this._updateHPEffect();
    }

    private _updateHP(){
        //当前剩余血条数量
        let remainderBar = Math.floor(this._bossInfo.currHp / this._perBarHP);
        //当前总的血条数
        let currBar = Math.ceil(this._bossInfo.currHp / this._perBarHP);
        //当前血条的剩余血量
        let curBarHp = this._bossInfo.currHp % this._perBarHP;
        this._effectTargetWidth = curBarHp / this._perBarHP * this.hpBar.totalLength;
        if(curBarHp == 0 && remainderBar != 0 && remainderBar == currBar ){
            remainderBar -= 1;
            curBarHp = this._perBarHP;
            if(this._effectTween){
              cc.Tween.stopAllByTarget(this.hpEffect);
              this._effectTargetWidth = this.hpBar.totalLength;
              this.hpEffect.width = this._effectTargetWidth;
              this._effectTween = null;
          }
        }

        let bgBarSf = remainderBar == 0 ? this._defaultHpBarBgSf : this.hpBarSpriteFrames[(remainderBar - 1) % this.hpBarSpriteFrames.length];
        let barSf= currBar == 0 ? this.hpBarSpriteFrames[0] : this.hpBarSpriteFrames[(currBar - 1) % this.hpBarSpriteFrames.length];
        this.hpBar.node.getComponent(cc.Sprite).spriteFrame = bgBarSf;
        this.hpBar.barSprite.spriteFrame = barSf;
        this.hpBar.progress = curBarHp / this._perBarHP;
        let barDesc = remainderBar == 0 ? '' : `X${remainderBar}`;
        this.hpText.string = `${barDesc}`;
    }

    private _updateHPEffect(){
        if(this._effectTween) return;
        let tween = cc.tween().delay(0).call(() =>{
            this.hpEffect.width = cc.misc.lerp(this.hpEffect.width, this._effectTargetWidth, HP_BAR_LERP_RATIO);
            if(Math.abs(this.hpEffect.width - this._effectTargetWidth) <= HP_BAR_LERP_MIN_TRRESSHOLD){
                cc.Tween.stopAllByTarget(this.hpEffect);
                this.hpEffect.width = this._effectTargetWidth;
                this._effectTween = null;
            }
        }, this);
        this._effectTween = cc.tween(this.hpEffect).repeatForever(tween).start();
    }

    resetBossUI(bossInfo: MonsterInfo){
        this._bossInfo = bossInfo;
        if(!this._bossInfo) return;
        let config = configUtils.getRunXMonsterCfg( this._bossInfo.ID);
        this._resetBossHead(config);
        this._resetBossHP(config);
    }
}
