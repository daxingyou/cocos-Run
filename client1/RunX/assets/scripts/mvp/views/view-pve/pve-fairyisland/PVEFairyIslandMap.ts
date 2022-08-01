import { eventCenter } from "../../../../common/event/EventCenter";
import { islandEvent } from "../../../../common/event/EventData";
import { logger } from "../../../../common/log/Logger";
import { ItemIslandMapTilePool } from "../../../../common/res-manager/NodePool";
import { data, gamesvr } from "../../../../network/lib/protocol";
import { islandData, POINT } from "../../../models/IslandData";
import { pveTrialData } from "../../../models/PveTrialData";
import ItemIslandMapTile from "./ItemIslandMapTile";

//做一个排列渐隐效果，格子越靠近地图边缘透明度越低。

/**视图内显示容量最大行*/
const MAXLINEINVIEW = 8;
/**一行最多3个元素 */
const MAX_NUM_IN_LINE = 3;

const { ccclass, property } = cc._decorator;
@ccclass
export default class PVEFairyIslandMap extends cc.Component {
   @property(cc.Node) mapBg: cc.Node = null;

   /**key-valve 行-格子数组*/
   private _tileMap: Map<number, ItemIslandMapTile[]> = new Map();
   private _tileSize: cc.Size = null;

   private _maxLine: number = 0;
   private _zindex: number = 100;

   onInit(): void {
      this._registerEvent();
      this._initMapTile();
   }

   /**页面释放清理*/
   deInit() {
      eventCenter.unregisterAll(this);
      this._clear();
   }

   /**页面来回跳转刷新*/
   onRefresh(): void {

   }

   private _registerEvent() {
      eventCenter.register(islandEvent.RECEIVE_BATTLE_RES, this, this._reflashMapItem);
      eventCenter.register(islandEvent.RECEIVE_ADD_HP_RES, this, this._reflashMapItem);
      eventCenter.register(islandEvent.RECEIVE_POTAL_RES, this, this._reflashMapItem);
      // eventCenter.register(islandEvent.RECEIVE_TRANS_GATE_RES, this, this._initMapTile);
   }

   private _clear() {
      if (this._tileMap) {
         this._tileMap.forEach((items) => {
            items.forEach(tileMap => {
               ItemIslandMapTilePool.put(tileMap);
            })
         })
         this._tileMap.clear();   
      }
      
   }

   /**地图初始化 */
   private _initMapTile() {
      this._zindex = 100;
      //初始化地图信息
      if (pveTrialData.islandData) {
         pveTrialData.islandData.Points = pveTrialData.islandData.Points.sort((pointA:data.ITrialPointInfo, pointB:data.ITrialPointInfo) => {
            let infoA: POINT = islandData.rechangeMapTileByUid(pointA.PointUID);
            let infoB: POINT = islandData.rechangeMapTileByUid(pointB.PointUID);
            this._maxLine = Math.max(this._maxLine, infoA.line);
            this._maxLine = Math.max(this._maxLine, infoB.line);
            if (!infoA || !infoB) return -1;
            let lineA = infoA.line, lineB = infoB.line;
            if (lineA == lineB) {
               return infoA.col - infoB.col;
            } else {
               return lineA - lineB;   
            }
         })
         for (let item of pveTrialData.islandData.Points) {
            islandData.setPointMap(item);
            if (item.Status == data.TrialPointInfo.PointStatus.PSInvalid) {
               islandData.setCurPointIndex(item.PointUID);
            } 
         }
         pveTrialData.islandData.Points.forEach((point: data.ITrialPointInfo) => {
            let info:POINT = islandData.rechangeMapTileByUid(point.PointUID);
            if (info) {
               this._addMapTile(info.line, info.col, point);
            }
         })
      }
   }

   /**
    * 
    * @param line 第几行，斜着算
    * @param index 一行中的第几个 - 预留接受服务器传送的事件信息
    */
   private _addMapTile(line:number,index:number,tileInfo?:data.ITrialPointInfo) {
      let itemIslandMapTile = ItemIslandMapTilePool.get();
      itemIslandMapTile.node.parent = this.mapBg;
      itemIslandMapTile.onInit({ line: line, col: index } as POINT, tileInfo);
      this._reflashMapTile(line,index,tileInfo,itemIslandMapTile);
      itemIslandMapTile.node.zIndex = --this._zindex;

      if (!this._tileSize) this._tileSize = itemIslandMapTile.node.getContentSize();

      //设置大小位置
      let pos = this._getPosByLine(line);
      itemIslandMapTile.node.setPosition(pos);

      //填充map
      let tiles = this._tileMap.get(line) || [];
      tiles.push(itemIslandMapTile);

      this._tileMap.set(line, tiles);

      //当最后一个摆上的时候，给背景填充大小
      if (line == this._maxLine) {
         let firstOneTile = this._tileMap.get(1)[0];
         let endOneTile = this._tileMap.get(this._maxLine)[0];

         let width = endOneTile.node.x - firstOneTile.node.position.x   + this._tileSize.width;
         let height = endOneTile.node.y - firstOneTile.node.position.y + this._tileSize.height;
         
         this.mapBg.setContentSize(width + 300, height + 300);
         this.mapBg.setPosition(0, 0);

         // 到中心行数需要的行数 -- 画图可得
         let curline = islandData.curPointIndex?.line || 0
         let offset = curline - MAXLINEINVIEW / 2;
         this.mapJumpOffsetLine(offset);
      }
   }
 
   private _reflashMapTile(line:number,index:number,tileInfo:data.ITrialPointInfo,itemIslandMapTile:ItemIslandMapTile) {
      let tileCurPoint: POINT = islandData.curPointIndex;

      if (!tileCurPoint) {
         if (line == 1) itemIslandMapTile.setState(data.TrialPointInfo.PointStatus.PSUnMask);
         else itemIslandMapTile.setState(data.TrialPointInfo.PointStatus.PSMask);
         return;
      }
         

      if (line <= tileCurPoint.line)
      {
         //如果是boss关卡->传送门
         if (tileInfo.Type == data.TrialPointInfo.PointType.PTTransGate) {
            itemIslandMapTile.setState(tileInfo.Status,true);
         } else {
            if (tileInfo.Status != data.TrialPointInfo.PointStatus.PSInvalid)
               itemIslandMapTile.setState(-1);
            else
               itemIslandMapTile.setState(tileInfo.Status);   
         }
         
      }
      else if (line == tileCurPoint.line + 1)
      {
         /**先判定是不是最后一个boss*/
         let endPoint = islandData.getPointByUid(islandData.rechangeUidByMapTile(line, 2));
         if (!endPoint) {
            itemIslandMapTile.setState(data.TrialPointInfo.PointStatus.PSUnMask);
            return 
         }

         let uid = islandData.rechangeUidByMapTile(line, 3);
         let lastUid = islandData.rechangeUidByMapTile(line - 1, 3);
         let checkPoint = islandData.getPointByUid(uid),lastCheckPoint = islandData.getPointByUid(lastUid)
         // 本行是2个元素，前行是三个元素，判断标记加 1；
         if (!checkPoint && lastCheckPoint) index += 1;
         
         if (index - tileCurPoint.col < 0 || index - tileCurPoint.col > 1)
            itemIslandMapTile.setState(data.TrialPointInfo.PointStatus.PSMask);
         else
            itemIslandMapTile.setState(data.TrialPointInfo.PointStatus.PSUnMask);
      
      }
      else
      {
         itemIslandMapTile.setState(data.TrialPointInfo.PointStatus.PSMask);
      }
   }

   /**
    * 特殊规则：
    *           每次新一行的创建，前一行若是创建了最大格子数那么本行第一个格子不创建
    *          首个格子总是创建再上一行第一个创建元素的头部
    */
   private _getPosByLine(line: number): cc.Vec3{
      //得到上一行的格子数据
      let lastTiles = this._tileMap.get(line - 1);      
      let curLineTiles = this._tileMap.get(line);

      //创建第一个-奠定画布位置的基调
      if (!lastTiles && !curLineTiles) {
         return { x: this._tileSize.width / 2, y: this._tileSize.height / 2 + 100 } as cc.Vec3;
      } 

      //本行有数据,使用本行头部元素
      if (curLineTiles && curLineTiles.length) {
         let lastPos = curLineTiles[curLineTiles.length - 1].node.position;
         return lastPos.add(cc.v3(this._tileSize.width, -this._tileSize.height / 2));
      } else {
         //每次找寻一行中头部元素下标
         let firstNodeIndex = lastTiles.length == MAX_NUM_IN_LINE ? 1 : 0;
         //上一行的首个元素
         let firstItem: ItemIslandMapTile = lastTiles[firstNodeIndex];
         let lastPos = firstItem.node.position;

         if (line == this._maxLine)
            return lastPos.add(cc.v3(this._tileSize.width, this._tileSize.height / 2));
         else
            return lastPos.add(cc.v3(0, this._tileSize.height));
      }
   }

   /**map跳转偏差行数*/
   mapJumpOffsetLine(offset: number) {
      if (offset > 0) {
         let offset_x = 0, offset_y = 0;
         // 前三行首个元素x一样  y是递增1倍
         if (offset < 3) {
            offset_x = offset_y = 1;
         } else {
            //三行之后，每增加两行-宽度加 1 倍，高度加 1.5 倍
            offset_x = 1 + (offset - 3) / 2;
            offset_y = 3 + (offset - 3) * 1.5 / 2;
         }
         this.mapBg.x -= this._tileSize.width * offset_x;
         this.mapBg.y -= this._tileSize.height * offset_y;
      } else {
         
      }
   }

   private _reflashMapItem(cmd:any,result:gamesvr.ITrialIslandEnterPveRes | number) {
      if (!result) return;
      let pointUID = 0;
      if (typeof result == "number") {
         pointUID = result;
      } else {
         //输了不展示
         if (!result.EnterBattleResult.BattleEndRes.Win) return;
         pointUID = result.PointUID;
      }
      
      islandData.setCurPointIndex(pointUID);
      //获得当前点坐标
      let point = islandData.rechangeMapTileByUid(pointUID);
      if (!this._tileMap || this._tileMap.size <= 0) return

      this._tileMap.forEach((tiles, line) => {
         if (line >= point.line && line <= point.line + 1) {
            tiles.forEach((tile, index) => {
               let uid = islandData.rechangeUidByMapTile(line, index + 1);
               let tileInfo = islandData.getPointByUid(uid);
               this._reflashMapTile(line, index + 1, tileInfo, tile);
            })
         }
      })
   }

   /**另一种移动方式:计算目标块再 MapTileBg 的节点坐标===>转换成父节点 MapView 的坐标；targetPosInMapView
                    计算 targetPosInMapView 到 MapView 中心点的偏移值：offset_pos
                    最终添加偏移值 MapTileBg.pos.add(offset_pos)
   */
}