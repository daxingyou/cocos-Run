/**
 * File: SkeletonManager.ts
 * Created Date: Thu May 13 2021
 * Author: Dex
 * Description: 这个类使用的SkeletonData，是从resourceManager中获取的
 * 
 * Copyright (c) 2020 YokaGames
 */

import { logger } from "../../../../common/log/Logger";
import { CACHE_MODE, resourceManager } from "../../../../common/ResourceManager";


interface spAnimation {
    name: string;
    duration: number;
}
class SkeletonManager {
    constructor () {
    }

    /**
     * @desc 根据名称加载骨骼动画的数据，异步返回
     * @todo 缓存
     * @param path 骨骼动画的目录，相对resource路径
     * @param userTag 用作异步停止使用的，自己保证key
     * @return {sp.SkeletonData} 
     */
    loadSkeletonData (path: string, userTag?: string) : Promise<sp.SkeletonData> {
        return new Promise((resolve, reject) => {
            resourceManager.load(path, sp.SkeletonData, CACHE_MODE.NONE, userTag)
            .then(data => {
                resolve(data.res);
            })
            .catch(err => {
                reject(err);
            })
        });
    }

    loadSkeleton (skeletonName: string) : Promise<sp.Skeleton> {
        return new Promise((resolve, reject) => {
            this.loadSkeletonData(skeletonName).then(dataRet => {
                const node = new cc.Node();
                const skeletonRet = node.addComponent(sp.Skeleton);
                skeletonRet.skeletonData = dataRet;
                resolve(skeletonRet);
            })
            .catch(err => {
                reject(err);
            })
        })
    }

    releaseSkeletonData (path: string) {
        resourceManager.release(path);
    }

    releaseSkeleton (path: string, sk: sp.Skeleton) {
        if (sk && cc.isValid(sk.node)) {
            sk.node.destroy();
            resourceManager.release(path);
        }
    }

    findAnimation(skeletonData: sp.SkeletonData, name: string): spAnimation {
        // @ts-ignore
        const _cache = skeletonData.getRuntimeData(true);
        if (!_cache) {
            logger.error('SkeletonManager', `Can not find SkeletonCache in skeleton.`);
            return null;
        }
        const animations = _cache.animations;
        for (let i=0; i<animations.length; ++i) {
            if (animations[i].name == name) {
                return animations[i];
            }
        }
        return null;
    }

    parseAnimations (skeletonData: sp.SkeletonData) : spAnimation []{
        let ret: any [] = [];
        const animations = skeletonData.skeletonJson.animations;
        for (let k in animations) {
            const aniInfo = this.findAnimation(skeletonData, k);
            aniInfo && ret.push(aniInfo);
        } 
        return ret;
    }

    parseSkin (skeletonData: sp.SkeletonData): string[] {
        const ret = [];
        const skins = skeletonData.skeletonJson.skins;
        for (let k in skins) {
            if (skins.hasOwnProperty(k)) {
                ret.push(k);
            }
        }
        return ret;
    }
};

let skeletonManager = new SkeletonManager();

export default skeletonManager;