import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import RoleLoader from "../view-battle/RoleLoader";

const { ccclass, property } = cc._decorator;

export enum Ani_Name {
    Idle = 'Idle',
    Attack = 'Attack',
}

const PRE_INSTALL_ROLEITEM_TAG = 'PRE_INSTALL_ROLEITEM_TAG';
let PREINSTALL_ROLE_SEQ: number = 1;

@ccclass
export default class PreinstallRoleItem extends cc.Component {
    @property(cc.Node)          heroSpineParent: cc.Node = null;

    private _heroId: number = null;
    private _heroListIndex: number = -1;
    private _skeletonName: string = null;
    private _tag: string = '';
    private _spNode: cc.Node = null;

    get tag() {
        return this._tag;
    }

    set tag(tag: string) {
        this._tag = tag;
    }

    setData(heroId: number, index?: number) {
        this._heroId = heroId;
        this._heroListIndex = index;
        this.tag = PRE_INSTALL_ROLEITEM_TAG + (++PREINSTALL_ROLE_SEQ);
        this.refreshView();
    }

    updateData(heroId: number, index: number) {
        this._heroId = heroId;
        this._heroListIndex = index;
        this.refreshView();
    }

    getData() {
        return this._heroId;
    }

    getIndex() {
        return this._heroListIndex;
    }

    setIdx(idx: number){
        this._heroListIndex = idx;
    }

    getHeroId() {
        return this._heroId;
    }

    refreshView() {
        this.node.active = true;
        this.loadSkeletonData();
    }

    loadSkeletonData() {
        // let newSkeletonName: string = this.tempUrl[Math.floor(Math.random() * this.tempUrl.length)];
        let cfg = null;
        let modelId: number = 0;
        cfg = configUtils.getHeroBasicConfig(this._heroId);
        let scale: number = 1;
        if(!cfg) {
            cfg = configUtils.getMonsterConfig(this._heroId);
            modelId = cfg.ModelId
        } else {
            modelId = cfg.HeroBasicModel;
        }
        let modelCfg = configUtils.getModelConfig(modelId);
        if(modelCfg) {
            scale = modelCfg.ModelAttackSize / 10000;
        }
        let skletonName: string = resPathUtils.getModelSpinePath(modelId);
        if (skletonName != this._skeletonName) {
            this._skeletonName = skletonName;
            this._releaseSpine();
            RoleLoader.loadRole(skletonName, true, this._tag)
            .then(skeletonNode => {
                if(skletonName != this._skeletonName){
                    RoleLoader.releaseRole(skletonName, skeletonNode, this._tag);
                    return;
                }

                //@ts-ignore
                skeletonNode.srcPath = skletonName;
                this._spNode = skeletonNode;
                this.heroSpineParent.addChild(skeletonNode);
                skeletonNode.scale = scale;
                this.unscheduleAllCallbacks();
                this.scheduleOnce(() => {
                    this.playAni(Ani_Name.Idle, true);
                })
            });
        } else {
            this.scheduleOnce(() => {
                this.playAni(Ani_Name.Idle, true);
            })
        }
    }

    playAni(aniName: Ani_Name, isLoop: boolean) {
        let spine: sp.Skeleton = this._getSpine();
        if (spine) {
            let curAni: string = spine.animation;
            if(curAni != aniName) {
                spine.setAnimation(0, aniName, isLoop);
            }
        }
    }
    /**
     * @param isCleanUp 是否被清除 removeFromParent
     */
    deInit(isCleanUp: boolean = false) {
        this.unscheduleAllCallbacks();
        this._releaseSpine();
        this._skeletonName = null;
        this._spNode = null;
        if(isCleanUp) {
            if(cc.isValid(this.node)) {
                this.node.removeFromParent();
                this.node.destroy();
            }
        }
    }

    _getSpine(): sp.Skeleton {
        if (this._spNode && cc.isValid(this._spNode)) {
            let ndSk = this._spNode.getChildByName("sp");
            let sk = ndSk.getComponent(sp.Skeleton)
            if (sk && cc.isValid(sk)) 
                return sk
        }
        return null;
    }

    _releaseSpine() {
        let children = [...this.heroSpineParent.children];
        this.heroSpineParent.removeAllChildren();
        children.forEach(ele => {
            cc.isValid(ele) && RoleLoader.releaseRole(ele.srcPath, ele, this._tag);
        });
    }
}
