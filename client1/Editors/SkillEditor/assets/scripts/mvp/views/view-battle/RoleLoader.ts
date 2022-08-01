import { logger } from "../../../common/log/Logger";
import { resourceManager } from "../../../common/ResourceManager";
import skeletonManager from "../../../common/SkeletonManager";

export const HERO_PREFAB = 'prefab/hero/Hero';

const DEFAULT_SCALE = 1;
const SKELETON_NODE_NAME = 'sp';

class RoleLoader {

    /**
     * @desc 加载一个角色
     *
     * @param {string} name 武将的名称（一般是骨骼动画名字）
     * @param {boolean} isHero 是否是己方英雄角色
     * @returns {Promise<cc.Node>}
     * @memberof RoleLoader
     */
    public static loadRole (name: string, isHero: boolean = true, userTag?: string): Promise<cc.Node> {
        return new Promise((resolve, reject) => {
            resourceManager.load(HERO_PREFAB, cc.Prefab)
            .then(info => {
                const prefab = info.res;
                const node = cc.instantiate(prefab);
                // 加载Skeleton
                skeletonManager.loadSkeleton(name, userTag)
                .then(skeleton => {
                    skeleton.node.scale = DEFAULT_SCALE;
                    if (!isHero) {
                        skeleton.node.scaleX = -DEFAULT_SCALE;
                    }
                    skeleton.node.name = SKELETON_NODE_NAME;
                    
                    node.addChild(skeleton.node);
                    node.height = skeleton.node.height * DEFAULT_SCALE;
                    node.width = skeleton.node.width * DEFAULT_SCALE;

                    // // 设置一下角色的尺寸
                    // const info = cardSkillManager.getRoleInfo(name);
                    // if (info) {
                    //     if (info.width && info.width > 0) {
                    //         node.width = info.width;
                    //     }

                    //     if (info.height && info.height > 0) {
                    //         node.height = info.height;
                    //     }
                    // }
                    resolve(node);
                })
                .catch(err => {
                    logger.error('RoleLoader', `load Hero Skeleton failed. err = ${err}`);
                    reject(err);
                })

            })
            .catch(err => {
                logger.error('RoleLoader', `load Hero Prefab failed. err = ${err}`);
                reject(err);
            });
        })
    }

    /**
     * @desc 释放一个角色
     * @todo 需要先释放骨骼动画
     *
     * @param {string} name 加载的时候，使用的名字（一般是骨骼动画的名字）
     * @param {cc.Node} node 加载的时候，返回的node
     * @memberof RoleLoader
     */
    public static releaseRole (name: string, node: cc.Node, userTag?: string) {
        const spNode = node.getChildByName(SKELETON_NODE_NAME);
        if (spNode) {
            skeletonManager.releaseSkeleton(name, spNode.getComponent(sp.Skeleton), userTag);
        } else {
            logger.warn('RoleLoader', `Can not find Spine node for releaseRole. name = ${name}`);
        }

        if (cc.isValid(node)) {
            node.destroy();
        }
        
        resourceManager.release(HERO_PREFAB);
    }
}

export default RoleLoader;