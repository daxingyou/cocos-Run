import { logger } from "../../../common/log/Logger";
import { CACHE_MODE, resourceManager } from "../../../common/ResourceManager";
import skeletonManager from "../../../common/SkeletonManager";

const { ccclass, property } = cc._decorator;
const DEFAULT_SCALE = 1;
const SKELETON_NODE_NAME = 'sp';
const HERO_PREFAB = 'prefab/hero/Hero';

/**
 * @description 在战斗外展示spine角色效果的item
 */

interface ROLE_INFO {
    scale?: number,
    position?: cc.Vec3,
    anima?: string,
    loop?: boolean,
}

@ccclass
export default class ItemRoleSpine extends cc.Component {

    @property(cc.Node)  spRoot: cc.Node = null;

    private _spinePath = 'icon/role/1';
    private _skNode: cc.Node = null;
    private _roleInfo: ROLE_INFO = null;
    private _loading: boolean = false;
    private _userTag: string = 'ITEM_ROLE_SPINE'

    init (bodyPath: string, roleInfo: ROLE_INFO, callback?: Function, userTag?: string) {
        if(userTag) this._userTag = userTag;
        this._roleInfo = roleInfo;
        this.loadRes(bodyPath, callback);
        this._spinePath = bodyPath;
    }

    private _releaseSpine () {
        if (cc.isValid(this._skNode)) {
            this._releaseRole(this._spinePath, this._skNode);
            this._skNode = null;
            this._spinePath = null;
        }
    }

    deInit () {
        this._releaseSpine();
    }

    loadRes (skPath: string, callback?: Function) {
        if (this._loading) {
            if (this._spinePath == skPath) return;
        }

        if (!this._skNode || !cc.isValid(this._skNode)) {
            this._loading = true;
            this._loadRole(skPath, this._userTag)
            .then ((skeleton) => {
                if (skPath != this._spinePath) {
                    skeleton.active = false;

                    // 注意，这里如果loadRole之后，发现不是最新应该显示的角色，说明最新要显示的还在加载当中
                    this._releaseRole(skPath, skeleton);
                } else {
                    if(cc.isValid(this._skNode) || this._skNode) {
                        let destNode = this._skNode;
                        this._releaseRole(skPath, destNode);
                        this._skNode = null;
                    }
                    this._loading = false;
                    this._skNode = skeleton;
                    this._updateSktAfterLoad(skeleton);
                    callback && callback();
                }
            })
        } else {
            if (this._spinePath == skPath) {
                logger.log('ItemRoleSpine', "dont need load spine res");

                if (this._skNode.parent != this.spRoot) {
                    this._skNode.removeFromParent();
                    this._skNode.parent = this.spRoot;
                }

                this._updateSktAfterLoad(this._skNode);
                callback && callback();
                this._loading = false;
            } else {
                // 要读取的和当前的spine不同，先释放
                
                if (this._spinePath) {
                    this._skNode.active = false;
                    this._releaseRole(this._spinePath, this._skNode);
                }
                    
                this._loading = true;
                this._loadRole(skPath, this._userTag)
                .then ((skeleton) => {
                    if (skPath != this._spinePath) {
                        skeleton.active = false;
                        this._releaseRole(skPath, skeleton);
                    } else {
                        this._loading = false;
                        this._skNode = skeleton;
                        skeleton.parent = this.spRoot;
                        this._updateSktAfterLoad(this._skNode);
                        callback && callback();
                    }
                })
            }
        }
    }

    get currSpine () {
        return this._spinePath;
    }

    hideShadow () {
        if (this._skNode && cc.isValid(this._skNode)) {
            let sk = this._skNode.getChildByName('sp').getComponent(sp.Skeleton);
            let shadowBone = sk.findBone('yingzi');
            if (shadowBone) {
                shadowBone.scaleX = 0;
                shadowBone.scaleY = 0;
            }   
        }
    }

    showShadow () {
        if (this._skNode && cc.isValid(this._skNode)) {
            let sk = this._skNode.getChildByName('sp').getComponent(sp.Skeleton);
            let shadowBone = sk.findBone('yingzi');
            if (shadowBone) {
                shadowBone.scaleX = 1;
                shadowBone.scaleY = 1;
            }   
        }
    }

    private _updateSktAfterLoad (skeleton: cc.Node) {
        let name = this._roleInfo.anima? this._roleInfo.anima : "stand";
        let loop = this._roleInfo.loop? true:false;
        let pos = this._roleInfo.position? this._roleInfo.position : cc.v2(0, 0);
        let scale = this._roleInfo.scale? this._roleInfo.scale : 1;

        if(skeleton && cc.isValid(skeleton)) {
            skeleton.scaleX = scale;
            skeleton.scaleY = Math.abs(scale);
            skeleton.parent = this.spRoot;
            skeleton.setPosition(pos);
            this._updateAnima(name, loop);
        }
    }

    private _updateAnima (anim: string, loop: boolean) {
        let spine = this._skNode.getChildByName('sp').getComponent(sp.Skeleton);
        if (spine.animation != anim) {
            spine.setAnimation(0, anim, loop);
        }
    }

    roleValid(): boolean {
        return this._skNode && cc.isValid(this._skNode)
    }

    getRoleSize () {
        if (this.roleValid()) {
            let roleSp = this._skNode.getChildByName("sp");
            if (roleSp) {
                let scale = Math.abs(this.getScale() * roleSp.scale);
                let size = new cc.Size(roleSp.width *(scale), roleSp.height * scale);
                return size;
            }
            return new cc.Size(0, 0);
        }
        else 
            return new cc.Size(0, 0);
    }

    getScale () {
        if (this._roleInfo)
            return this._roleInfo.scale || 1;
        else 
            return 1;
    }

    getRoleWorldPos ():cc.Vec2  {
        if (this._roleInfo && this._roleInfo.position) {
            // @ts-ignore
            return this.node.convertToWorldSpaceAR(this._roleInfo.position);
        } else {
            return cc.Vec2.ZERO;
        }
    }

    changeAction (anim: string, loop: boolean, timeScale?: number) {
        if (this._loading) return;
        
        let childComp = this._skNode.getChildByName('sp');
        if (childComp) {
            let spine = childComp.getComponent(sp.Skeleton);
            if(timeScale) {
                spine.timeScale = timeScale;
            } else {
                spine.timeScale = 1;
            }
            spine.setAnimation(0, anim, loop);
        }
    }

    /**
     * @description 此操作都基于角色已经加载完的前提下去改变大小，
     *              如果处于读取状态，则不需要执行，读取之后会设置成最新的sacle
     * @param scaleX 
     */
    changeScale (scaleX: number) {
        if (this._loading) return;

        if (this._skNode) {
            this._skNode.scaleX = scaleX;
        }
    }


    private _loadRole (name: string, userTag: string): Promise<cc.Node> {
        return new Promise((resolve, reject) => {
            resourceManager.load(HERO_PREFAB, cc.Prefab)
            .then(info => {
                const prefab = info.res;
                const node = cc.instantiate(prefab);
                // 加载Skeleton
                skeletonManager.loadSkeleton(name, userTag)
                .then(skeleton => {
                    skeleton.node.scale = DEFAULT_SCALE;
                    skeleton.node.name = SKELETON_NODE_NAME;
                    node.addChild(skeleton.node);

                    resolve(node);
                })
                .catch(err => {
                    logger.error('ItemRoleSpine', `load Hero Skeleton failed. err = ${err}`);
                    reject(err);
                })

            })
            .catch(err => {
                logger.error('ItemRoleSpine', `load Hero Prefab failed. err = ${err}`);
                reject(err);
            });
        })
    }

    private _releaseRole (name: string, node: cc.Node) {
        const spNode = node.getChildByName(SKELETON_NODE_NAME);
        if (spNode) {
            skeletonManager.releaseSkeleton(name, spNode.getComponent(sp.Skeleton), this._userTag);
        } else {
            logger.warn('RoleLoader', `Can not find Spine node for releaseRole. name = ${name}`);
        }

        if (cc.isValid(node)) {
            node.destroy();
        }
        
        resourceManager.release(HERO_PREFAB, CACHE_MODE.NONE, this._userTag);
    }
}