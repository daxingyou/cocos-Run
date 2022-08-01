import { RES_ICON_PRE_URL } from "../../../app/AppConst";
import { HEAD_ICON, QUALITY_TYPE } from "../../../app/AppEnums";
import { utils } from "../../../app/AppUtils";
import { CLOCK_INTERVAL, CLOCK_LEN, UI_LEN } from "../../../app/BattleConst";
import { ROLE_TYPE } from "../../../app/BattleConst";
import { configUtils } from "../../../app/ConfigUtils";
import engineHook from "../../../app/EngineHook";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import guiManager from "../../../common/GUIManager";
import { logger } from "../../../common/log/Logger";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { gamesvr } from "../../../network/lib/protocol";
import { battleUIData } from "../../models/BattleUIData";
import { pveData } from "../../models/PveData";
import { pvpData } from "../../models/PvpData";

const enum TIMER_TYPE {
    NORMAL,
    BOMB
}

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemTimerRole extends cc.Component {

    @property(cc.Label)         lbName:cc.Label = null;
    @property(cc.Sprite)        sprHead:cc.Sprite = null;
    @property(cc.Sprite)        qualitySp:cc.Sprite = null;
    @property(sp.Skeleton)      bombSpine: sp.Skeleton = null;
    @property(cc.Prefab)        bombBlast: cc.Prefab = null;           
    @property(cc.Prefab)        bombActivity: cc.Prefab = null;           

    private _info: gamesvr.IRoleTimer = null;
    private _state: number = 0;
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _type: TIMER_TYPE = TIMER_TYPE.NORMAL;

    onInit (info: gamesvr.IRoleTimer) {
        this._info = info;

        // TODO 需要区分是否是炸弹
        let isBoom = info.IsBomb;
        this._state = gamesvr.RoleState.Normal;

        if(!isBoom) {
            this.sprHead.node.active = true;
            let role = battleUIData.getRoleByUid(this._info.UID);
            let frameUrl: string = "";
            let headUrl: string = "";
            let pvp = !!pvpData.pvpConfig;
    
            // 奇门遁甲
            if (role.roleType == ROLE_TYPE.HERO || pveData.magicDoor || pvp) {
                let cfg = configUtils.getHeroBasicConfig(role.roleId);
                this.lbName.string = cfg.HeroBasicName;
                headUrl = resPathUtils.getItemIconPath(cfg.HeroBasicId, HEAD_ICON.CIRCLE);
                frameUrl = resPathUtils.getHeroHeadQualityIcon(cfg.HeroBasicQuality, true);
            } else {
                let cfg = configUtils.getMonsterConfig(role.roleId);
                this.lbName.string = cfg.Name;
                let cfgModel = configUtils.getModelConfig(cfg.ModelId);
                if (cfgModel) headUrl = `${RES_ICON_PRE_URL.HEAD_IMG}/${cfgModel.ModelHeadIconCircular}`;
                let quality = QUALITY_TYPE.R;
                if(cfg.NoumenonID) {
                    let heroConfig = configUtils.getHeroBasicConfig(cfg.NoumenonID);
                    quality = heroConfig.HeroBasicQuality;
                }
                frameUrl = resPathUtils.getHeroHeadQualityIcon(quality, true);
            }
    
            if (frameUrl) this._spriteLoader.changeSprite(this.qualitySp, frameUrl);
            if (headUrl) this._spriteLoader.changeSprite(this.sprHead, headUrl);
        } else {
            this._type = TIMER_TYPE.BOMB;
            this.changeZIndex(cc.macro.MAX_ZINDEX - 1);
            this.showBoomActive(null);
            this.sprHead.node.active = false;
            this.bombSpine.node.active = true;
        }
    }

    deInit () {
        this.node.stopAllActions();
        this._spriteLoader.release();
    }

    get uId () {
        return this._info.UID;
    }
    
    get distance () {
        return this._info.Position || 0;
    }

    get uiDistance () {
        return this.node.x;
    }

    set uiDistance (v: number) {
        let dis = v || 0;
        this.node.x = dis *(UI_LEN/CLOCK_LEN);
        if(this.bombSpine.node.active) {
            this.bombSpine.timeScale = 1 + this.node.x / UI_LEN;
        }
    }

    set state (v: gamesvr.RoleState) {
        this._state = v
    }

    changeZIndex(zIndex: number) {
        if(cc.isValid(this.node) && this.node.zIndex != zIndex) {
            this.node.zIndex = zIndex;
        }
    }

    updateTimer (info: gamesvr.IRoleTimer, currUid: number) {
        this._info = utils.deepCopy(info);
        this.node.active = this._state == gamesvr.RoleState.Dead? false: true;
        if (this.node.active == false) {
            logger.log("[Item Timer Role Dead]")
            return;
        }
        this.node.stopAllActions();
        let roleZIndex: number = 0;
        if (this._info.UID == currUid) {
            roleZIndex = cc.macro.MAX_ZINDEX;
            this._info.Position = CLOCK_LEN;
            this.uiDistance = CLOCK_LEN;
            // this.node.scale = 2;
            this.node.runAction(cc.scaleTo(0.1, 1.35).easing(cc.easeInOut(3)));
            if(this._type == TIMER_TYPE.BOMB) {
                let bombBlast = cc.instantiate(this.bombBlast);
                guiManager.sceneNode.addChild(bombBlast);
                let spine = bombBlast.getComponent(sp.Skeleton);
                spine.setCompleteListener(() => {
                    spine.clearTracks();
                    spine.skeletonData = null;
                    bombBlast.removeFromParent();
                    bombBlast.destroy();
                });
                spine.setAnimation(0, 'animation', false);
            }
        } else {
            if(info.IsBomb) {
                roleZIndex = cc.macro.MAX_ZINDEX - 1;
            } else {
                roleZIndex = Math.floor(info.Position/10);
            }
            if (this.node.scale != 1)
                this.node.scale = 1;
            this.uiDistance = info.Position || 0;
        }
        this.changeZIndex(roleZIndex);
    }

    autoMove (uiLength: number) {
        if (this._state != gamesvr.RoleState.Dead) {
            // let speed = this._info.Speed *  uiLength / CLOCK_LEN;
            // let speedFrame = speed /(CLOCK_INTERVAL / 1000) * engineHook.frameInterval;
            // let lenPerFrame = CLOCK_LEN / CLOCK_INTERVAL * engineHook.frameInterval * speed;
            let lenPerFrame = (this._info.Speed *  uiLength / CLOCK_INTERVAL * engineHook.frameInterval);
            lenPerFrame = Math.floor(lenPerFrame * 10)/10;
            let final = this.node.x + lenPerFrame;
            if (final > uiLength) final = uiLength;
            this.node.x = final;
        }
    }

    showBoomActive(endFunc: Function) {
        let bombActivity = cc.instantiate(this.bombActivity);
        guiManager.sceneNode.addChild(bombActivity);
        let spine = bombActivity.getComponent(sp.Skeleton);
        spine.setCompleteListener(() => {
            endFunc && endFunc();
            spine.clearTracks();
            spine.skeletonData = null;
            bombActivity.removeFromParent();
            bombActivity.destroy();
        });
        spine.setAnimation(0, 'star', false);
    }

    showBoom(endFunc: Function) {
        let bombBlast = cc.instantiate(this.bombBlast);
        guiManager.sceneNode.addChild(bombBlast);
        let spine = bombBlast.getComponent(sp.Skeleton);
        spine.setCompleteListener(() => {
            endFunc && endFunc();
            spine.clearTracks();
            spine.skeletonData = null;
            bombBlast.removeFromParent();
            bombBlast.destroy();
        });
        spine.setAnimation(0, 'animation', false);
    }
}