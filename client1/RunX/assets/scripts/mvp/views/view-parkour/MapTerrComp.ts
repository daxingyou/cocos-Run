/*
 * @Description: 单个地形块
 * @Autor: lixu
 * @Date: 2021-05-07 20:09:12
 * @LastEditors: lixu
 * @LastEditTime: 2021-12-07 12:13:24
 */
import TileMapHelper from './TileMapHelper';
import {GROUPS_OF_NODE, TERR_LAYER, TERR_TYPE, TileSetBasicGIDS, TileSetItemPNGName, TileSetTerrPNGName} from './ParkourConst';
import { terrCollisionNodePool, terrConfigManager, TiledInfo, TiledLayerInfo, TiledShadeInfo } from './MapTerrManager';
import { parkourItemPoolMananger } from './ItemPoolManager';
import { configUtils } from '../../../app/ConfigUtils';
import { getParkourItemCfgByPath } from './ParkourItemConfig';
const {ccclass, property} = cc._decorator;

type InitTerrLayerHandler = (tiledTile: cc.TiledTile, layer: cc.TiledLayer, gid: number, colIdx: number, rowIdx: number) => void;
const PER_FRAME_INIT_ITEM_COUNT = 5;

@ccclass
export default class MapTerrComp extends cc.Component {
    @property(cc.TiledMap) tiledMap: cc.TiledMap = null;

    private _terrFile: string = null;
    private _isAsyncInit:boolean = false; //是否正在分帧初始化

    private _currInitKeyIdx: number = -1;
    private _currInitIdx: number = -1;
    private _initLayerConfig: Map<string, TiledLayerInfo> = null;
    private _initTerrCollisonCfg: TiledShadeInfo[] = null;
    private _itemCount: number = 0;
    private _layerNameArr: string[] = null;

    get terrFile(): string{
        return this._terrFile;
    }

    /**
     * @description: 设置地形中需要替换的图层数据
     * @param {Map} config
     * @param {*} TiledLayerInfo
     * @return {*}
     * @author: lixu
     */
    setLayerConfig(terrPath: string){
        this._initTerrCollisonCfg = terrConfigManager.getTiledShadeCfg(terrPath);
        this._layerNameArr = this._layerNameArr || [];
        this._layerNameArr.push(TERR_LAYER.SHADE);
        if(this._initTerrCollisonCfg){
            this._itemCount += this._initTerrCollisonCfg.length;
        }
        this._initLayerConfig = terrConfigManager.getConfigByMapKey(terrPath);
        if(this._initLayerConfig){
            this._initLayerConfig.forEach((elem, key) => {
                this._itemCount += elem.gids.length;
                this._layerNameArr.push(key);

                //统计最大替换物体的个数
                let statisInfo = elem.statisInfo;
                if(!statisInfo || statisInfo.size == 0) return;
                let layer = this.tiledMap.getLayer(key);
                statisInfo.forEach((count, gid) =>{
                   this._calculateItemCount(layer, gid, count);
                });
            });
        }

        //统计碰撞器的最大个数
        if(!this._initTerrCollisonCfg || this._initTerrCollisonCfg.length === 0) return;
        terrCollisionNodePool.capacity =  Math.max(this._initTerrCollisonCfg.length * 3, terrCollisionNodePool.capacity);
    }

    //统计替换物体的最大数量
    private _calculateItemCount(layer: cc.TiledLayer, gid: number, count: number){
            if(!layer || gid == 0) return;
            let relativeGIDInfo = this._getItemRelativeGID(layer, gid);
            let name = relativeGIDInfo.texName;
            let itemPath: string = null;
            let config: any = null;
            if(name === TileSetItemPNGName){
                config = configUtils.getRunXItemCfg(name, relativeGIDInfo.gid);
                itemPath = (config && config.ArtID) || itemPath;
            }
            if(name === TileSetTerrPNGName){
                config = configUtils.getTrapConfig(name, relativeGIDInfo.gid);
                itemPath = (config && config.ArtID) || itemPath;
            }
            if(!itemPath || itemPath.length == 0) return;
            let itemCfg = getParkourItemCfgByPath(itemPath);
            if(!itemCfg) return;
            let lastCount = itemCfg.maxCacheCount || 0;
            itemCfg.maxCacheCount = Math.max(count, lastCount);
            parkourItemPoolMananger.updateItemPoolCapacity(itemPath, itemCfg.maxCacheCount * 3);
    }

    initShadeLayer(tileMapName: string){
        TileMapHelper.initTileShadeLayer(tileMapName, this.tiledMap, this, this._saveShadeLayerCfg, this._getShadeLayerCfgCache, this._getItemRelativeGID);
    }

    /**
     * @description: 地形组件初始化
     * @param {string} tileMapName  地形文件名
     * @param {boolean} dealLayer   是否处理图层，主要是替换掉临时元素
     * @param {boolean} isSplitFrame 是否进行渲染，一般在update中更新地形时候，要进行分帧，避免卡顿
     * @return {*}
     * @author: lixu
     */
    onInit(tileMapName: string, dealLayer: boolean = true, isSplitFrame: boolean = false){
        //正在分帧加载,不进行处理
        if(this._isAsyncInit){
            return;
        }
        this._terrFile = tileMapName;
        let layers = this.tiledMap.getLayers();
        if(!layers || layers.length <= 0) return;

        if(isSplitFrame) {
            if(this._itemCount <= 0 || this._layerNameArr.length <= 0) return;
            this._isAsyncInit = true;
            this.schedule(this._loadElementOfLayers, 0, Math.floor(this._itemCount / PER_FRAME_INIT_ITEM_COUNT) + 1, 0);
            return;
        }
       
        layers.forEach((ele: cc.TiledLayer) => {
            //将所有的地图元素用跑酷场景内的相机渲染，因此需要将分组改成该相机的渲染层
            ele.node.groupIndex = GROUPS_OF_NODE.PARKOUR_DEFAULT;
            let layerName = ele.getLayerName();
            switch(layerName){
                case TERR_LAYER.SHADE:
                    if(dealLayer){
                        ele.node.active = false;
                        this._initShadeLayers(tileMapName, ele);
                    }
                    break;
                case TERR_LAYER.LOOT:
                    ele.node.active = false;
                    if(dealLayer){
                        TileMapHelper.initTileLayer(tileMapName, this.tiledMap, layerName, this, this._initLootLayer, this._getLayerConfigCache);
                    }else{
                        TileMapHelper.initTileLayer(tileMapName, this.tiledMap, layerName, this, null, this._getLayerConfigCache);
                    }
                    break;
                case TERR_LAYER.STONES:
                    ele.node.active = false;
                    if(dealLayer){
                        TileMapHelper.initTileLayer(tileMapName, this.tiledMap, layerName, this, this._initStoneLayer, this._getLayerConfigCache);
                    }else{
                        TileMapHelper.initTileLayer(tileMapName, this.tiledMap, layerName, this, null, this._getLayerConfigCache);
                    }
                    break;
            }
        });
    }

    private _loadElementOfLayers(){
        if(!this._isAsyncInit) return;
        if(this._currInitKeyIdx < 0){
            this._currInitKeyIdx = 0;
            this._currInitIdx = 0;
        }

        //先构建地形碰撞器
        let count = -1;
        if(this._currInitKeyIdx == 0){
            if(!this._initTerrCollisonCfg || this._initTerrCollisonCfg.length == 0){
                this._currInitKeyIdx += 1;
            }else{
                count += 1;
                for(let len = this._initTerrCollisonCfg.length; count < PER_FRAME_INIT_ITEM_COUNT; count++, this._currInitIdx++){
                    //当前分组遍历完成
                    if(this._currInitIdx >= len){
                        //所有分组已经遍历完成
                        if(this._currInitKeyIdx == this._layerNameArr.length -1){
                            this._isAsyncInit = false;
                            count -= 1;
                            break;
                        }

                        //切换下一个分组
                        if(this._currInitKeyIdx < this._layerNameArr.length -1){
                            this._currInitKeyIdx += 1;
                            this._currInitIdx = 0;
                            count -= 1;
                            break;
                        }
                    }
                    let terrShadeInfo = this._initTerrCollisonCfg[this._currInitIdx];
                    let layerName = this._layerNameArr[this._currInitKeyIdx];
                    let layer = this.tiledMap.getLayer(layerName);
                    layer.node.active = false;
                    if(layerName == TERR_LAYER.SHADE){
                        this._initShadeLayer(layer, terrShadeInfo);
                    }
                }
            }
        }

        if(!this._isAsyncInit) {
            this._currInitIdx = -1;
            this._currInitKeyIdx = -1;
            return;
        }

        //当前帧已经创建了最大的数量
        if(count >= PER_FRAME_INIT_ITEM_COUNT){
            return;
        }

        if(this._currInitKeyIdx >= this._layerNameArr.length){
            this._isAsyncInit = false;
            this._currInitIdx = -1;
            this._currInitKeyIdx = -1;
            return;
        }

        //在构建其他层
        if(this._currInitKeyIdx > 0){
            let gids: TiledInfo[] = this._initLayerConfig.get(this._layerNameArr[this._currInitKeyIdx]).gids;
            count += 1;
            for(let len = gids.length; count < PER_FRAME_INIT_ITEM_COUNT; count++, this._currInitIdx++){
                //当前分组遍历完成
                if(this._currInitIdx >= len){
                    //所有分组已经遍历完成
                    if(this._currInitKeyIdx == this._layerNameArr.length -1){
                        this._isAsyncInit = false;
                        this._currInitIdx = -1;
                        this._currInitKeyIdx = -1;
                        break;
                    }

                    //切换下一个分组
                    if(this._currInitKeyIdx < this._layerNameArr.length -1){
                        this._currInitKeyIdx += 1;
                        gids = this._initLayerConfig.get(this._layerNameArr[this._currInitKeyIdx]).gids;
                        len = gids.length;
                        this._currInitIdx = -1;
                        count -= 1;
                        continue;
                    }
                }
                let info: TiledInfo = gids[this._currInitIdx];
                switch(this._layerNameArr[this._currInitKeyIdx]){
                    case TERR_LAYER.LOOT:
                        let layer = this.tiledMap.getLayer(TERR_LAYER.LOOT);
                        layer.node.active = false;
                        this._initLootLayer(null, layer, info.gid, info.y, info.x);
                        break;
                    case TERR_LAYER.STONES:
                        let layer1 = this.tiledMap.getLayer(TERR_LAYER.STONES);
                        layer1.node.active = false;
                        this._initStoneLayer(null, layer1, info.gid, info.y, info.x);
                        break;
                };
            }
        }
    }

    deInit(){
        this.unschedule(this._loadElementOfLayers);
        this._isAsyncInit = false;
        this._currInitKeyIdx = -1;
        this._currInitIdx = -1;
        this._recycleReMainNodes();
    }

    onRelease(){
        this._initLayerConfig = null;
        this._initTerrCollisonCfg = null;
        this._layerNameArr && (this._layerNameArr.length = 0);
        this._layerNameArr = null;
        this._itemCount = 0;
    }

    private _recycleReMainNodes(){
        let layers = this.tiledMap.getLayers();
        //有手动增加的其他节点，进行回收
        if(this.tiledMap.node.childrenCount > layers.length){
            let layerNodes: Array<cc.Node> = [];
            layers.forEach((elem) => {
                layerNodes.push(elem.node);
            });
            let childArr: Array<cc.Node> = [];
            this.tiledMap.node.children.forEach((elem)=>{
                if(layerNodes.indexOf(elem) == -1){
                    childArr.push(elem);
                }
            });
            childArr.forEach((elem)=>{
                this._recycleNode(elem);
            })
        }
    }

    private _getLayerConfigCache(mapName: string, layerName: string): TiledLayerInfo{
        let data = terrConfigManager.getConfig(mapName,layerName);
        return data;
    }

    private _getShadeLayerCfgCache(mapName: string): TiledShadeInfo[]{
        let data = terrConfigManager.getTiledShadeCfg(mapName);
        return data;
    }

    //获取层中某个gid的相对gid
    private _getItemRelativeGID(layer: cc.TiledLayer, gid: number): any{
        //@ts-ignore
        let tileSets:cc.TMXTilesetInfo[] = layer.getTileSets();
        let startGID = 0;
        let idx = -1;
        for(let i = 0, len = tileSets.length; i < len; i++){
            let ele = tileSets[i];
            let firstGID = ele.firstGid;
            if(gid < firstGID) break;
            startGID = firstGID;
            idx = i;
        }
        return { texName: tileSets[idx].name, gid: gid - startGID};
    }

    //缓存一个地形块中的简化版地形碰撞区域
    private _saveShadeLayerCfg(tileMapName: string, tileMap: cc.TiledMap, layer: cc.TiledLayer, gid: number, blockCount: number, pos: cc.Vec2){
        if(!tileMap || tileMap != this.tiledMap || !layer || layer.getLayerName() != TERR_LAYER.SHADE || gid <= 0 || blockCount <= 0) return;
        let layerInfo = this._getItemRelativeGID(layer, gid);
        let shadeInfo: TiledShadeInfo = {
            len: blockCount,
            type: layerInfo.gid == TileSetBasicGIDS.PingDi ? TERR_TYPE.FLAT : (layerInfo.gid == TileSetBasicGIDS.ShangPo ? TERR_TYPE.UPSLOPE : TERR_TYPE.DOWNGRADE),
            startTileInfo:{
                x: pos.x,
                y: pos.y,
                gid: gid,
            }
        };
        terrConfigManager.addTiledShadeCfg(tileMapName, shadeInfo);
    }

    //初始化地形碰撞层
    private _initShadeLayers(tileMapName: string, layer: cc.TiledLayer){
        let shadeInfos = this._getShadeLayerCfgCache(tileMapName);
        shadeInfos.forEach((ele, idx)=>{
            this._initShadeLayer(layer, ele);
        });
    }

    private _initShadeLayer(layer: cc.TiledLayer, shadeInfo: TiledShadeInfo){
        let tileSize = layer.getMapTileSize();
        let node = terrCollisionNodePool.get(shadeInfo);
        let collider: cc.PolygonCollider = node.getComponent(cc.PolygonCollider);
        let width = 0, height = 0;
        let offsetPosX, offsetPosY = 0;
        let halfWidth = 0, halfHeight = 0;
        let points: cc.Vec2[] = [];
        switch(shadeInfo.type){
            case TERR_TYPE.FLAT:
                width = tileSize.width * shadeInfo.len;
                height = tileSize.height;
                collider.tag = TERR_TYPE.FLAT;
                offsetPosX = offsetPosY = 0;
                halfWidth = width >> 1;
                halfHeight = height >> 1;
                points.push(cc.v2(-halfWidth, -halfHeight));
                points.push(cc.v2(-halfWidth,halfHeight));
                points.push(cc.v2(halfWidth,halfHeight));
                points.push(cc.v2(halfWidth,-halfHeight));
                break;
            case TERR_TYPE.DOWNGRADE:
                width = height = tileSize.width * shadeInfo.len;
                collider.tag = TERR_TYPE.DOWNGRADE;
                offsetPosX = 0;
                offsetPosY = -height + tileSize.height;
                halfWidth = width >> 1;
                halfHeight = height >> 1;
                points.push(cc.v2(-halfWidth, -halfHeight));
                points.push(cc.v2(-halfWidth,halfHeight));
                points.push(cc.v2(halfWidth,-halfHeight));
                break;
            case TERR_TYPE.UPSLOPE:
                width = height = tileSize.width * shadeInfo.len;
                collider.tag = TERR_TYPE.UPSLOPE;
                offsetPosX = -width + tileSize.width;
                offsetPosY = -height + tileSize.height;
                halfWidth = width >> 1;
                halfHeight = height >> 1;
                points.push(cc.v2(-halfWidth, -halfHeight));
                points.push(cc.v2(halfWidth,halfHeight));
                points.push(cc.v2(halfWidth,-halfHeight));
                break;
        }
        node.width = width;
        node.height = height;
        collider.offset.x = width >> 1;
        collider.offset.y = height >> 1;
        collider.points.length = 0;
        collider.points.push(...points);

        let pos = layer.getPositionAt(shadeInfo.startTileInfo.x, shadeInfo.startTileInfo.y);
        pos = layer.node.convertToWorldSpaceAR(pos);
        pos = this.tiledMap.node.convertToNodeSpaceAR(pos);
        node.setPosition(pos.add(cc.v2(offsetPosX, offsetPosY)));
        node.parent = this.tiledMap.node;
    }

    //初始化道具层
    private _initLootLayer(tiledTile: cc.TiledTile, layer: cc.TiledLayer, gid: number, colIdx: number, rowIdx: number){
        let pos = layer.getPositionAt(colIdx, rowIdx);
        pos = layer.node.convertToWorldSpaceAR(pos);
        pos = this.tiledMap.node.convertToNodeSpaceAR(pos);
        let node = this._replaceWithItem(layer, gid, pos);
        if(!node){
            cc.warn('地图解析异常========================', gid, layer.getLayerName(), this._terrFile, rowIdx, colIdx)
            return
        }
        node.setPosition(pos);
        node.parent = this.tiledMap.node;
    }

    //初始化陷阱层
    private _initStoneLayer(tiledTile: cc.TiledTile, layer: cc.TiledLayer, gid: number, colIdx: number, rowIdx: number){
        let pos = layer.getPositionAt(colIdx, rowIdx);
        pos = layer.node.convertToWorldSpaceAR(pos);
        pos = this.tiledMap.node.convertToNodeSpaceAR(pos);
        let node = this._replaceWithItem(layer, gid, pos);
        if(!node){
            cc.warn('地图解析异常========================', gid, layer.getLayerName(), this._terrFile, rowIdx, colIdx)
            return
        }
        node.setPosition(pos.add(cc.v2(node.width >> 1, node.height >> 1)));
        node.parent = this.tiledMap.node;
    }

    //物品替换
    private _replaceWithItem(layer: cc.TiledLayer, gid: number, pos: cc.Vec2): cc.Node{
        if(!layer) return null;
        let relativeGidInfo = this._getItemRelativeGID(layer, gid);
        let name = relativeGidInfo.texName;
        let itemPath: string = null;
        let config: any = null;
        if(name === TileSetItemPNGName){
            config = configUtils.getRunXItemCfg(name, relativeGidInfo.gid);
            itemPath = (config && config.ArtID) || itemPath;
        }

        if(name === TileSetTerrPNGName){
            config = configUtils.getTrapConfig(name, relativeGidInfo.gid);
            itemPath = (config && config.ArtID) || itemPath;
        }

        if(!itemPath || itemPath.length == 0) return null;

        let node: cc.Node = parkourItemPoolMananger.getItem(itemPath, config, pos);
        if(!node){
            cc.warn('MapTerrComp:', `nodePoolManager getItem exception: gid = ${gid }, itemID = ${config.TrapID || config.RunXItemId}`);
            return null;
        }
        let itemCfg = parkourItemPoolMananger.getItemCfg(itemPath);
        itemCfg && (node.name = itemCfg.comp);
        return node;
    }

    //回收节点
    private _recycleNode(node: cc.Node){
        if(!node || !cc.isValid(node)) return;
        let nodeName = node.name;
        let nodeComp: any = node.getComponent(nodeName);
        if(nodeComp && nodeComp.doRecycle){
            nodeComp.doRecycle();
        }else{
            cc.warn('MapTerrComp:', `can not recycle item: nodeName = ${nodeName}`);
        }
    }

    /**
     * 将一个tmx区域内的像素坐标转换为tmx中的网格坐标
     * @param point
     * @returns
     */
    getTilePositionWithPixel(point: cc.Vec2): cc.Vec2 {
        let shadeLayer = this.tiledMap.getLayer(TERR_LAYER.SHADE);
        let layerSize = shadeLayer.getLayerSize();
        let tileSize = shadeLayer.getMapTileSize();
        let localPos = this.node.convertToNodeSpaceAR(point);
        let x = Math.ceil(localPos.x / tileSize.width) - 1;
        let y = Math.ceil(localPos.y / tileSize.height) - 1;
        return cc.v2(x, layerSize.height - y - 1);
    }

    //获取tmx中shade层某个位置正下方最近的地形块的像素位置
    getNearestShadeLayerPos(pos: cc.Vec2): any {
        let shadeLayer = this.tiledMap.getLayer(TERR_LAYER.SHADE);
        let layerSize = shadeLayer.getLayerSize();
        let tileSize = shadeLayer.getMapTileSize();
        for(let i = pos.y; i < layerSize.height; i++){
            let gid = shadeLayer.getTileGIDAt(pos.x, i);
            if(gid != 0){
                let info = this._getItemRelativeGID(shadeLayer, gid);
                let relativeGid = info.gid;
                let result = {
                    tileSize: tileSize,
                    gid: relativeGid,
                    targetPos: shadeLayer.node.convertToWorldSpaceAR(shadeLayer.getPositionAt(pos.x, i))
                };
                return result;
            }
        }
        return null;
    }
}

export {
    InitTerrLayerHandler
}
