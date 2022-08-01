import { AppUtils, utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { WatcherHelper } from "../../../common/components/WatcherHelper";
import { logger } from "../../../common/log/Logger";
import {scheduleManager} from "../../../common/ScheduleManager";
import skeletonManager from "../../../common/SkeletonManager";
import { gamesvr } from "../../../network/lib/protocol";
import skillDisplayManager from "../view-actor/SkillDisplayManager";
import { ANIMATION_GROUP, EffectConst, EffectGfxInfo, EffectInfo } from "../view-actor/SkillUtils";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemHalo extends cc.Component {

    @property(cc.Node)  spRoot: cc.Node = null;

    private _halo: gamesvr.IHaloResult = null;
    private _ownerId: number = 0;
    private _skeleton: sp.Skeleton = null;
    private _path: string = "";
    private _stoped: boolean = false;

    init (halo: gamesvr.IHaloResult, ownerRole: number) {
        this._halo = halo
        this.valid = halo.isAdd;
        this._ownerId = ownerRole;
        this._releaseSkeleton();

        this._stoped = false;
        this._updateHaloEffect(halo.HaloID);
    }

    deInit () {
        this._stoped = true;
        this._releaseSkeleton();
    }
    
    private _releaseSkeleton () {
        if (this._skeleton) {
            this._skeleton.clearTracks();
            WatcherHelper.removeWatcher(this._skeleton.node);
            skeletonManager.releaseSkeleton(this._path, this._skeleton);
            this.spRoot.removeAllChildren();
            this._skeleton = null;
        }
    }

    private _updateHaloEffect (haloId: number) {
        let cfg = configUtils.getHaloConfig(haloId);
        if (cfg) {
            let name = utils.getRoleSketonById(this._ownerId)
            let skillInfo = skillDisplayManager.getSkill(haloId, name);
            if (!skillInfo) {
                logger.warn(`ItemHalo updateHaloEffect`, `Halo${haloId} has no effect config. check pls.`);
                return;
            }

            for (let i= 0; i<skillInfo.effectList.length; ++i) {
                const info: EffectInfo = skillInfo.effectList[i];
                // 如果Group不匹配的话，直接返回
                if (info.tag && (info.tag & ANIMATION_GROUP.SOURCE) == 0) {
                    continue;
                }

                const gfxInfo = info.gfxInfo;
                if (!gfxInfo)
                    continue;

                this._addHaloGfx(gfxInfo);
            }
        }
    }

    private _addHaloGfx (gfxInfo: EffectGfxInfo) {
        let resPath = EffectConst.toGfxPath(gfxInfo.skeleton);
        const skeletonRet = skeletonManager.loadSkeleton(resPath);
            skeletonRet.then ((skeleton) => {
                this._skeleton = skeleton;
                this._path = resPath;
                const onFinish = () => {
                    WatcherHelper.removeWatcher(skeleton.node);
                    skeletonManager.releaseSkeleton(resPath, skeleton);
                }

                gfxInfo.offset && (skeleton.node.position = gfxInfo.offset);
                gfxInfo.scale && (skeleton.node.scale = gfxInfo.scale);

                // 光环暂时不需要翻转吧
                // if (gfxInfo.flipX) {
                //     skeleton.node.scaleX *= -1;
                // }
                
                const idx = resPath.lastIndexOf('/');
                if (idx >= 0) {
                    skeleton.node.name = `SkeletonHalo_${resPath.substr(idx+1)}`;
                } else {
                    skeleton.node.name = `SkeletonHalo_${resPath}`;
                }

                if (gfxInfo.skin && gfxInfo.skin.length > 1) {
                    skeleton.defaultSkin = gfxInfo.skin;
                }

                let playAnim = () => {
                    if (this._stoped || !cc.isValid(this.spRoot)) {
                        onFinish();
                        return;
                    }

                    if (this.spRoot.active == false) {
                        onFinish();
                        return;
                    }
                    
                    this.spRoot.addChild(skeleton.node);
                    WatcherHelper.addWatcher({
                        node: skeleton.node,
                        parent: this.spRoot,
                        onDisable: () => {
                            onFinish();
                        }
                    });

                    skeleton.setAnimation(0, gfxInfo.animation, true);
                }

                if (gfxInfo.delay && scheduleManager) {
                    scheduleManager.scheduleOnce(() => {
                        playAnim();
                    }, gfxInfo.delay);
                } else {
                    playAnim();
                }
            })
    }

    set valid (v: boolean) {
        this._halo.isAdd = v;
        this.node.active = v;
        this._stoped = v;
    }

    get valid () {
        return this._halo.isAdd;
    }

    get haloId () {
        return this._halo.HaloID
    }

    get haloUid () {
        return this._halo.HaloUID
    }

    get owner () {
        return this._halo.RoleUID
    }
}