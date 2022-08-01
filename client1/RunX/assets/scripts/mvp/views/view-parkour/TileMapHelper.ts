import { utils } from '../../../app/AppUtils';
import { InitTerrLayerHandler } from './MapTerrComp';
import { terrConfigManager, TiledInfo, TiledLayerInfo, TiledShadeInfo } from './MapTerrManager';
import { TERR_LAYER, TileSetBasicGIDS } from './ParkourConst';
export default class TileMapHelper  {
    private constructor(){}

    /**
     * 初始化地图中的特定层
     * @param tileMap
     * @param layerName
     * @param target
     * @param handler
     * @param forceCreate
     */
    static initTileLayerWithEmpty(tileMapName: string, tileMap: cc.TiledMap, layerName: string, target: Object, handler: InitTerrLayerHandler, getLayerConfigFunc: Function){
        TileMapHelper.initTileLayer(tileMapName, tileMap, layerName, target, handler, getLayerConfigFunc);
    }

    static initTileShadeLayer(tileMapName: string, tileMap: cc.TiledMap, target: Object, handler: Function, getLayerConfigFunc: Function, getGidFunc: Function){
        if(!tileMap || !tileMap.isValid) return;
        let layer = tileMap.getLayer(TERR_LAYER.SHADE);
        if(!layer){
            cc.warn(`关卡地形异常: ${tileMapName}.tmx 没有shade层`);
            return;
        }
        let layerConfig: TiledShadeInfo[] = null;
        getLayerConfigFunc && (layerConfig = getLayerConfigFunc.call(target, tileMapName));
        if(layerConfig) return;
        let width = layer.getLayerSize().width;
        let height = layer.getLayerSize().height;
        let gids = utils.deepCopy(layer.getTiles());
        let startGID_x = -1;
        let startGID_y = -1;
        let blockCount = 0;
        let curGid = 0;
        let curRelativeGID = -1;
        for(let rowIdx = 0; rowIdx < height;rowIdx++){
            curGid = 0;
            blockCount = 0;
            for(let colIdx = 0; colIdx < width; colIdx++){
                let gid = gids[rowIdx * width + colIdx];
                if(gid != 0){
                    if(curGid == 0){
                        curGid = gid;
                        curRelativeGID = getGidFunc.call(target, layer, curGid).gid;
                        startGID_x = colIdx;
                        startGID_y = rowIdx;
                        blockCount += 1;
                        if(curRelativeGID == TileSetBasicGIDS.XiaPo){
                            //下坡块，向右下方查找块关联的块
                            let nextX = colIdx + 1;
                            let nextY = rowIdx + 1;
                            let nextGid: number = gids[nextY * width + nextX];
                            while(nextX < width && nextY < height && nextGid == curGid){
                                blockCount += 1;
                                gids[nextY * width + nextX] = 0;
                                nextX += 1;
                                nextY += 1;
                                nextGid = gids[nextY * width + nextX];
                            }
                            handler && handler.call(target, tileMapName, tileMap, layer, curGid, blockCount, cc.v2(startGID_x, startGID_y));
                            curGid = 0;
                            blockCount = 0;
                        }else if(curRelativeGID == TileSetBasicGIDS.ShangPo){
                            //上坡块，向左下方查找关联的块
                            let nextX = colIdx - 1;
                            let nextY = rowIdx + 1;
                            let nextGid: number = gids[nextY * width + nextX];
                            while(nextX >= 0 && nextY < height && nextGid == curGid){
                                blockCount += 1;
                                gids[nextY * width + nextX] = 0;
                                nextX -= 1;
                                nextY += 1;
                                nextGid = gids[nextY * width + nextX];
                            }
                            handler && handler.call(target, tileMapName, tileMap, layer, curGid, blockCount, cc.v2(startGID_x, startGID_y));
                            curGid = 0;
                            blockCount = 0;
                        }
                    }else if(curGid != gid){
                        handler && handler.call(target, tileMapName, tileMap, layer, curGid, blockCount, cc.v2(startGID_x, startGID_y));
                        curGid = 0;
                        blockCount = 0;
                        curGid = gid;
                        blockCount += 1;
                        curRelativeGID = getGidFunc.call(target, layer, curGid).gid;
                        startGID_x = colIdx;
                        startGID_y = rowIdx;
                        if(curRelativeGID == TileSetBasicGIDS.XiaPo){
                            //下坡块，向右下方查找块关联的块
                            let nextX = colIdx + 1;
                            let nextY = rowIdx + 1;
                            let nextGid = gids[nextY * width + nextX];
                            while(nextX < width && nextY < height && nextGid == curGid){
                                blockCount += 1;
                                gids[nextY * width + nextX] = 0;
                                nextX += 1;
                                nextY += 1;
                                nextGid = gids[nextY * width + nextX];
                            }
                            handler && handler.call(target, tileMapName, tileMap, layer, curGid, blockCount, cc.v2(startGID_x, startGID_y));
                            curGid = 0;
                            blockCount = 0;
                        }else if(curRelativeGID == TileSetBasicGIDS.ShangPo){
                            //上坡块，向左下方查找关联的块
                            let nextX = colIdx - 1;
                            let nextY = rowIdx + 1;
                            let nextGid = gids[nextY * width + nextX];
                            while(nextX >= 0 && nextY < height && nextGid == curGid){
                                blockCount += 1;
                                gids[nextY * width + nextX] = 0;
                                nextX -= 1;
                                nextY += 1;
                                nextGid = gids[nextY * width + nextX];
                            }
                            handler && handler.call(target, tileMapName, tileMap, layer, curGid, blockCount, cc.v2(startGID_x, startGID_y));
                            curGid = 0;
                            blockCount = 0;
                        }
                    }else{
                       blockCount += 1;
                    }
                }else{
                    if(blockCount > 0 && curGid > 0){
                        handler && handler.call(target, tileMapName, tileMap, layer, curGid, blockCount, cc.v2(startGID_x, startGID_y));
                    }
                    curGid = 0;
                    blockCount = 0;
                }
                gids[rowIdx * width + colIdx] = 0;
            }
            if(blockCount > 0 && curGid > 0){
                handler && handler.call(target, tileMapName, tileMap, layer, curGid, blockCount, cc.v2(startGID_x, startGID_y));
            }
        }
    }

    /**
     * 获取Tmx中一个层的配置,PS: 会破坏TMX中的元数据,将特定层的所有GID都设置为0，因此主要用于TMX中起到标记作用的层，需要渲染的层不能调用
     * @param tileMapName
     * @param tileMap
     * @param layerName
     * @param target
     * @param getLayerConfigFunc
     * @returns
     */
    static getTileLayerCfg(tileMapName: string, tileMap: cc.TiledMap, layerName: string, target: Object, getLayerConfigFunc: Function){
        let layerConfig: TiledLayerInfo = null;
        if(!tileMap || !tileMap.isValid || !layerName || layerName.length == 0) return layerConfig;
        let layer = tileMap.getLayer(layerName);
        let layerSize: cc.Size = layer.getLayerSize();
        getLayerConfigFunc && (layerConfig = getLayerConfigFunc.call(target, tileMapName, layerName));
        if(layerConfig) return layerConfig;

        let gids: TiledInfo[] = [];
        let statisInfo: Map<number, number> = null;
        let width = layerSize.width;
        let height = layerSize.height;
        for(let rowIdx = 0; rowIdx < height; rowIdx++){
            for(let colIdx = 0; colIdx < width; colIdx++){
                let gid = layer.getTileGIDAt(colIdx, rowIdx);
                if(gid != 0){
                    gids.push({gid: gid, x:rowIdx, y:colIdx});
                    statisInfo = statisInfo || new Map<number, number>();
                    let lastCount = statisInfo.has(gid) ? statisInfo.get(gid) : 0;
                    statisInfo.set(gid, lastCount + 1);
                }
            }
        }
        if(gids.length >0) {
            layerConfig = {gids: gids};
            statisInfo && (layerConfig.statisInfo = statisInfo);
            terrConfigManager.addConfig(tileMapName, layerName, layerConfig);
        }
        return layerConfig;
    }

    /**
     * 初始化TMX中需要替换的层
     * @param tileMapName
     * @param tileMap
     * @param layerName
     * @param target
     * @param handler
     * @param getLayerConfigFunc
     * @param isStatistic   是否统计实例化的item的数量，在游戏未开始阶段时进行统计，方便后续进行item的预加载
     * @returns
     */
    static initTileLayer(tileMapName: string, tileMap: cc.TiledMap, layerName: string, target: Object, handler: InitTerrLayerHandler, getLayerConfigFunc: Function){
        if(!tileMap || !tileMap.isValid || !layerName || layerName.length == 0) return;
        let layer = tileMap.getLayer(layerName);
        let layerConfig: TiledLayerInfo = null;
        getLayerConfigFunc && (layerConfig = getLayerConfigFunc.call(target, tileMapName, layerName));
        if(!layerConfig){
            layerConfig = TileMapHelper.getTileLayerCfg(tileMapName, tileMap, layerName, target, getLayerConfigFunc);
        }

        //如果图层没有可替换的配置或者不进行替换操作，直接返回
        if(!layerConfig || layerConfig.gids.length == 0 || !handler) return;

        let gids = layerConfig.gids;
        for(let i = 0, len = gids.length; i < len; i++){
            let tiledInfo: TiledInfo = gids[i];
            if(tiledInfo.gid != 0){
                handler && target && (handler.call(target, null, layer, tiledInfo.gid, tiledInfo.y, tiledInfo.x));
            }
        }
    }

    /**
     * 查找指定图层的指定碎片
     * @param tileMap
     * @param layerName
     * @param target
     * @param handler
     * @param rowMajorOrder   行优先遍历
     */
    static findTiledTile(tileMapName: string, tileMap: cc.TiledMap, layerName: string, target: Object,
            handler: (layer: cc.TiledLayer, gid: number, colIdx: number, rowIdx: number) => boolean, rowMajorOrder: boolean = false){
        if(!tileMap || !tileMap.isValid || !tileMapName || tileMapName.length == 0 || !layerName || layerName.length == 0 || !handler || !target) return;
        let layer = tileMap.getLayer(layerName);
        let layerSize: cc.Size = layer.getLayerSize();

        let width = layerSize.width;
        let height = layerSize.height;
        let isCoutinue = true;
        if(rowMajorOrder){
            for(let rowIdx = 0; rowIdx < height; rowIdx++){
                if(!isCoutinue) break;
                for(let colIdx = 0; colIdx < width; colIdx++){
                    let gid = layer.getTileGIDAt(colIdx, rowIdx);
                    if(!handler.call(target, layer, gid, colIdx, rowIdx)) {
                            isCoutinue = false;
                            break;
                    }
                }
            }
            return;
        }

        for(let colIdx = 0; colIdx < width; colIdx++){
            if(!isCoutinue) break;
            for(let rowIdx = height - 1; rowIdx >= 0; rowIdx--){
                let gid = layer.getTileGIDAt(colIdx, rowIdx);
                if(!handler.call(target, layer, gid, colIdx, rowIdx)) {
                        isCoutinue = false;
                        break;
                }
            }
        }
    }
}
