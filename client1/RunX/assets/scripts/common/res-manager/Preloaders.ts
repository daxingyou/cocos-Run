import { PreloaderValue, ResourcePreloader, LoadCallback } from "./ResourcePreloader";
import { HitLabelPool, ItemBuffPool, ItemRolePool, NodePool, FloatLabelPool, ItemHaloPool, BuffFloatLabelPool, ItemBagPool, ItemQualityPool, ItemHeroHeadCirclePool, ItemHeroHeadSquarePool, LimitIconPool, ItemLevelMapLessonPool, ItemLevelMapRoadLinePool, ItemModelSpinePool, ItemLevelMapMoveRolePool, ItemPragmaticSkillIconPool, ItemDoubleWeekIconPool, ItemHeroListPool, ItemShopPool, MailItemPool, ItemLotteryIconPool, ItemStrategyDescPool, ItemOnlineDetailPool, ItemIslandMapTilePool, ItemPveShopPool, ItemPveBuffPool, ItemHeadMonsterPool, ItemPveRolePool } from "./NodePool";
import { resourceManager, CACHE_MODE } from "../ResourceManager";
import { logger } from "../log/Logger";
import HitLabel from "../../mvp/views/view-item/HitLabel";
import ItemBuff from "../../mvp/views/view-item/ItemBuff";
import { uiConfig } from "../UIConfig";
import StepWork from "../step-work/StepWork";
import ItemRole from "../../mvp/views/view-item/ItemRole";
import ItemFloatLabel from "../../mvp/views/view-item/ItemFloatLabel";
import ItemHalo from "../../mvp/views/view-role/ItemHalo";
import ItemBuffFloatLabel from "../../mvp/views/view-item/ItemBuffFloatLabel";
import ItemBag from "../../mvp/views/view-item/ItemBag";
import ItemQualityEffect from "../../mvp/views/view-item/ItemQualityEffect";
import ItemHeadCircle from "../../mvp/views/view-item/ItemHeadCircle";
import ItemHeadSquare from "../../mvp/views/view-item/ItemHeadSquare";
import ItemLimitIcon from "../../mvp/views/view-timelimit/ItemLimitIcon";
import ItemLevelMapLesson from "../../mvp/views/view-levelmap/ItemLevelMapLesson";
import ItemLevelMapRoadLine from "../../mvp/views/view-levelmap/ItemLevelMapRoadLine";
import ItemModelSpine from "../../mvp/views/view-item/ItemModelSpine";
import ItemLevelMapMoveRole from "../../mvp/views/view-levelmap/ItemLevelMapMoveRole";
import ItemPragmaticSkillIcon from "../../mvp/views/view-pragmatic/ItemPragmaticSkillIcon";
import ItemDoubleWeekIcon from "../../mvp/views/view-activity/ItemDoubleWeekIcon";
import HeroListItem from "../../mvp/views/view-hero/HeroListItem";
import ShopItem from "../../mvp/views/view-shop/ShopItem";
import MailItem from "../../mvp/views/view-mail/MailItem";
import ItemLotteryIcon from "../../mvp/views/view-activity/ItemLotteryIcon";
import ItemStrategyDesc from "../../mvp/views/view-strategy/item/ItemStrategyDesc";
import ItemOnlineDetail from "../../mvp/views/view-online/ItemOnlineDetail";
import ItemIslandMapTile from "../../mvp/views/view-pve/pve-fairyisland/ItemIslandMapTile";
import ItemPveShop from "../../mvp/views/view-pve/common/ItemPveShop";
import ItemPveBuff from "../../mvp/views/view-pve/common/ItemPveBuff";
import ItemHeadMonster from "../../mvp/views/view-item/ItemHeadMonster";
import ItemPveRole from "../../mvp/views/view-pve/common/ItemPveRole";

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

const preloadFloatLabelPool = (): StepWork => {
    return preloadNodePool<ItemFloatLabel>('floatLabelPool', FloatLabelPool);
}

const preloadBuffFloatLabelPool = (): StepWork => {
    return preloadNodePool<ItemBuffFloatLabel>('buffFloatLabelPool', BuffFloatLabelPool);
}

const preloadBuffPool = (): StepWork => {
    return preloadNodePool<ItemBuff>('buffPool', ItemBuffPool);
}

const preloadHaloPool = (): StepWork => {
    return preloadNodePool<ItemHalo>('buffPool', ItemHaloPool);
}

const preloadItemRolePool = (): StepWork => {
    return preloadNodePool<ItemRole>('ItemRolePool', ItemRolePool);
}

const preloadItemBagPool = (): StepWork => {
    return preloadNodePool<ItemBag>('ItemBagPool', ItemBagPool);
}

const preloadHeadCirclePool = (): StepWork => {
    return preloadNodePool<ItemHeadCircle>('ItemHeadCircle', ItemHeroHeadCirclePool);

}
const preloadHeadSquarePool = (): StepWork => {
    return preloadNodePool<ItemHeadSquare>('ItemHeadSquare', ItemHeroHeadSquarePool);
}

const preloadItemQualityEffectPool = (): StepWork => {
    return preloadNodePool<ItemQualityEffect>('ItemQualityEffectPool', ItemQualityPool);
}

const preloadItemLimitIconPool = (): StepWork => {
    return preloadNodePool<ItemLimitIcon>('ItemLimitIconPool', LimitIconPool);
}

const preloadItemLevelMapLessonPool = (): StepWork => {
    return preloadNodePool<ItemLevelMapLesson>('ItemLevelMapLessonPool', ItemLevelMapLessonPool);
}

const preloadItemLevelMapRoadLinePool = (): StepWork => {
    return preloadNodePool<ItemLevelMapRoadLine>('ItemLevelMapRoadLinePool', ItemLevelMapRoadLinePool);
}

const preloadItemModelSpinePool = (): StepWork => {
    return preloadNodePool<ItemModelSpine>('ItemModelSpinePool', ItemModelSpinePool);
}

const preloadItemLevelMapMoveRolePool = (): StepWork => {
    return preloadNodePool<ItemLevelMapMoveRole>('ItemLevelMapMoveRolePool', ItemLevelMapMoveRolePool);
}

const preloadItemPragmaticSkillIconPool = (): StepWork => {
    return preloadNodePool<ItemPragmaticSkillIcon>('ItemPragmaticSkillIcon', ItemPragmaticSkillIconPool);
}

const preloadItemDoubleWeekIconPool = (): StepWork => {
    return preloadNodePool<ItemDoubleWeekIcon>('ItemDoubleWeekIcon', ItemDoubleWeekIconPool);
}

const preloadItemHeroListPool = () : StepWork => {
    return preloadNodePool<HeroListItem>('ItemHeroList', ItemHeroListPool);
}

const preloadShopItemPool = () : StepWork => {
    return preloadNodePool<ShopItem>('ItemShop', ItemShopPool);
}

const preloadMailItemPool = (): StepWork => {
    return preloadNodePool<MailItem>('MailItem', MailItemPool);
}

const preloadItemLotteryIconPool = (): StepWork => {
  return preloadNodePool<ItemLotteryIcon>('ItemLotteryIcon', ItemLotteryIconPool);
}

const preloadItemStrategyDescPool = (): StepWork => {
  return preloadNodePool<ItemStrategyDesc>('ItemStrategyDesc', ItemStrategyDescPool);
}

const preloadItemOnlineDetailPool = (): StepWork => {
    return preloadNodePool<ItemOnlineDetail>('ItemOnlineDetail', ItemOnlineDetailPool);
}

const preloadItemIslandMapTilePool = (): StepWork => {
    return preloadNodePool<ItemIslandMapTile>(`ItemIslandMapTitle`, ItemIslandMapTilePool);
}

const PreloadItemPveShopPool = (): StepWork => {
    return preloadNodePool<ItemPveShop>(`ItemPveShop`, ItemPveShopPool);
}

const PreloadItemPveBuffPool = (): StepWork => {
    return preloadNodePool<ItemPveBuff>(`ItemPveBuff`, ItemPveBuffPool);
}

const PreloadItemHeadMonsterPool = (): StepWork => {
    return preloadNodePool<ItemHeadMonster>(`ItemHeadMonster`, ItemHeadMonsterPool);
}

const PreloadItemPveRolePool = (): StepWork => {
    return preloadNodePool<ItemPveRole>(`ItemPveRole`, ItemPveRolePool);
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

const preloadRoleSpines = (resPaths: string[], userTag: string, cb?: Function): PreloaderValue => {
    return ResourcePreloader.addLoader({
        name: 'RoleSpinePreloader',
        loadeHandler: (path: string, callback: LoadCallback) => {
            resourceManager.load(path, sp.SkeletonData, CACHE_MODE.NONE, userTag)
            .then(cacheInfo => {
                cb && cb(cacheInfo);
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

//预加载地形文件
const preloadTmxs = (resPaths: string[], userTag: string, loadCb?: Function): PreloaderValue => {
    return ResourcePreloader.addLoader({
        name: 'TerrTmxLoader',
        loadeHandler: (path: string, callback: LoadCallback) => {
            resourceManager.load(path, cc.TiledMapAsset, CACHE_MODE.NONE, userTag)
            .then(cacheInfo => {
                loadCb && loadCb(path, cacheInfo.res);
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

const preloadPrefab = (resPaths: string[], userTag: string): PreloaderValue => {
    return ResourcePreloader.addLoader({
        name: 'PrefabPreloader',
        loadeHandler: (path: string, callback: LoadCallback) => {
            resourceManager.load(path, cc.Prefab, CACHE_MODE.NONE, userTag)
            .then(cacheInfo => {
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

export {
    preloadHitLabelPool,
    preloadBuffFloatLabelPool,
    preloadBuffPool,
    preloadHaloPool,
    preloadUIPrefab,
    preloadRoleSpines,
    preloadScriptIcons,
    preloadItemRolePool,
    preloadTmxs,
    preloadFloatLabelPool,
    preloadPrefab,
    preloadItemBagPool,
    preloadHeadCirclePool,
    preloadHeadSquarePool,
    preloadItemQualityEffectPool,
    preloadItemLimitIconPool,
    preloadItemLevelMapLessonPool,
    preloadItemLevelMapRoadLinePool,
    preloadItemModelSpinePool,
    preloadItemLevelMapMoveRolePool,
    preloadItemPragmaticSkillIconPool,
    preloadItemDoubleWeekIconPool,
    preloadItemHeroListPool,
    preloadShopItemPool,
    preloadMailItemPool,
    preloadItemLotteryIconPool,
    preloadItemStrategyDescPool,
    preloadItemOnlineDetailPool,
    preloadItemIslandMapTilePool,
    PreloadItemPveShopPool,
    PreloadItemPveBuffPool,
    PreloadItemHeadMonsterPool,
    PreloadItemPveRolePool
}
