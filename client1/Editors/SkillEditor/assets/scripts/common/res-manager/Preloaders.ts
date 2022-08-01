import { PreloaderValue, ResourcePreloader, LoadCallback } from "./ResourcePreloader";
import { HitLabelPool, ItemBuffPool, ItemRolePool, NodePool } from "./NodePool";
import { resourceManager, CACHE_MODE } from "../ResourceManager";
import { logger } from "../log/Logger";
import HitLabel from "../../mvp/views/view-item/HitLabel";
import ItemBuff from "../../mvp/views/view-item/ItemBuff";
import { uiConfig } from "../UIConfig";
import StepWork from "../step-work/StepWork";
import ItemRole from "../../mvp/views/view-item/ItemRole";


function preloadNodePool<Type extends cc.Component> (name: string, pool: NodePool<Type>): StepWork {
    const prefabLoader = ResourcePreloader.addLoader({
        name: `${name}PrefabLoader`,
        loadeHandler: (path: string, callback: LoadCallback) => {
            logger.info('Preloaders', `preloadNodePool. loadPrefab name = ${path}`);
            pool.preloadPrefab(callback);
        },
        releaseHandler: (path) => {
        },
        arrResource: [
            `${name}`,
        ]
    });

    const arrRes: string[] = [];
    const nowCount = pool.nowCount;
    const createPreFrame = pool.createPreFrame;
    for (let i=nowCount; i<pool.initCount; i+=createPreFrame) {
        let toIndex = Math.min(i + createPreFrame, pool.initCount);
        arrRes.push(`${name}Node${i}-${toIndex}`);
    }

    const nodeLoader = ResourcePreloader.addLoader({
        name: `${name}NodeLoader`,
        loadeHandler: (path: string) => {
            logger.info('Preloaders', `loadItem name = ${path}`);
            pool.preloadOneFrameItem();
        },
        releaseHandler: (path: string) => {
        },
        arrResource: arrRes,
    });

    return prefabLoader.stepWork.concact(nodeLoader.stepWork);
}


// Item
const preloadHitLabelPool = (): StepWork => {
    return preloadNodePool<HitLabel>('hitLabelPool', HitLabelPool);
}

const preloadBuffPool = (): StepWork => {
    return preloadNodePool<ItemBuff>('buffPool', ItemBuffPool);
}

const preloadItemRolePool = (): StepWork => {
    return preloadNodePool<ItemRole>('ItemRolePool', ItemRolePool);
}


const preloadUIPrefab = (): PreloaderValue => {
    return ResourcePreloader.addLoader({
        name: 'UIPreloader',
        loadeHandler: (path: string, callback: LoadCallback) => {
            const uiInfo = uiConfig.getConfig(path);
            if (uiInfo) {
                resourceManager.load(uiInfo.path, cc.Prefab)
                .then(() => {
                    callback();
                })
                .catch(err => {
                    callback(err);
                });
            }
        },
        releaseHandler: (path: string) => {

        },
        arrResource: uiConfig.getAllUI()
        .filter(info => {
            return info.preload;
        })
        .map(v => {
            return v.id;
        }),
    })
}

const preloadRoleSpines = (resPaths: string[], userTag: string): PreloaderValue => {
    return ResourcePreloader.addLoader({
        name: 'RoleSpinePreloader',
        loadeHandler: (path: string, callback: LoadCallback) => {
            resourceManager.load(path, sp.SkeletonData, CACHE_MODE.NONE, userTag)
            .then(cacheInfo => {
                // logger.log(`Preloaders`, `Role spine load finish. path = ${path}`);
                callback();
            })
            .catch(err => {
                callback(err);
            });
        },
        releaseHandler: (path: string) => {
            resourceManager.release(path);
        },
        arrResource: [...resPaths]
    });
}

const preloadScriptIcons = (resPaths: string[], userTag: string): PreloaderValue => {
    return ResourcePreloader.addLoader({
        name: 'ScriptIconPreloader',
        loadeHandler: (path: string, callback: LoadCallback) => {
            resourceManager.load(path, cc.SpriteFrame, CACHE_MODE.NONE, userTag)
            .then(cacheInfo => {
                // logger.log(`Preloaders`, `Card icon load finish. path = ${path}`);
                callback();
            })
            .catch(err => {
                callback(err);
            });
        },
        releaseHandler: (path: string) => {
            resourceManager.release(path);
        },
        arrResource: [...resPaths]
    });
};

export {
    preloadHitLabelPool,
    preloadBuffPool,
    preloadUIPrefab,
    preloadRoleSpines,
    preloadScriptIcons,
    preloadItemRolePool,
}