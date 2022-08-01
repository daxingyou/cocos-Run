import { RES_ICON_PRE_URL, VIEW_NAME } from "../../../../app/AppConst";
import { configUtils } from "../../../../app/ConfigUtils";
import { eventCenter } from "../../../../common/event/EventCenter";
import { islandEvent } from "../../../../common/event/EventData";
import guiManager from "../../../../common/GUIManager";
import { logger } from "../../../../common/log/Logger";
import { SpriteLoader } from "../../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../../config/config";
import { data, gamesvr } from "../../../../network/lib/protocol";
import { islandData, POINT, PointType } from "../../../models/IslandData";
import { pveTrialData } from "../../../models/PveTrialData";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ItemIslandMapTile extends cc.Component {

   @property(cc.Sprite) eventSp: cc.Sprite = null;
   @property(cc.Sprite) bg: cc.Sprite = null;

   private _polygoncolider: cc.PolygonCollider = null;
   private _state: data.TrialPointInfo.PointStatus = null;

   private _spriteLoader: SpriteLoader = new SpriteLoader();
   private _tileInfo: data.ITrialPointInfo = null;
   private _tilePoint: POINT = null;
   private _moveDelat: number = 0;

   onInit(point:POINT,tileInfo:data.ITrialPointInfo): void {

      this._tileInfo = tileInfo;
      this._tilePoint = point;

      this._polygoncolider = this.node.getComponent(cc.PolygonCollider);
      this._initEventSp(tileInfo);

      this.node.on(cc.Node.EventType.TOUCH_MOVE, this._itemTouchListen.bind(this), this.node);
      this.node.on(cc.Node.EventType.TOUCH_END, this._itemTouchListen.bind(this), this.node);
   }

   /**item释放清理*/
   deInit() {
      this._polygoncolider = null;
      eventCenter.unregisterAll(this); 
      this._spriteLoader.release();
      this._reset();
      this.node.off(cc.Node.EventType.TOUCH_MOVE, this._itemTouchListen.bind(this), this.node);
      this.node.off(cc.Node.EventType.TOUCH_END, this._itemTouchListen.bind(this), this.node);
   }

   private _reset() {
      this.node.color = cc.Color.WHITE;
      this.node.opacity = 255;
      this._moveDelat = 0;
   }

   private _tileStatusReset() {
      this.node.active = true;
      this.bg.node.color = cc.Color.WHITE;
      this.node.opacity = 255;
   }

   private _itemTouchListen(e: cc.Event.EventTouch) {
      if (e.type == cc.Node.EventType.TOUCH_MOVE) {
         this._moveDelat += e.getDelta().mag();
      } else if (e.type == cc.Node.EventType.TOUCH_END) {
         if (this._moveDelat < 20) {
            this.btnClick(e);
         }

         this._moveDelat = 0;
      }
   }

   setState(state: number,isBoss:boolean = false) {
      this._tileStatusReset();
      this._state = state;
      if (!cc.isValid(this.node) || !this.node.active) return;
      switch (state) {
         case data.TrialPointInfo.PointStatus.PSInvalid: {
            this.bg.node.color = cc.Color.GREEN;
            // this.eventSp.node.active = false;
            break;
         }
         case data.TrialPointInfo.PointStatus.PSMask: {
            // this.bg.node.color = cc.Color.GRAY;
            this.node.opacity = 180;
            break;
         }
         case data.TrialPointInfo.PointStatus.PSPreView:
         case data.TrialPointInfo.PointStatus.PSUnMask: {
            this.bg.node.color = cc.Color.WHITE;
            break;   
         }
         default:
            this.node.color = cc.Color.GRAY;
            // this.node.opacity = 80;
            break;
      }
      if (isBoss) {
         this._tileInfo.Type = PointType.PTTransGate;
         this._initEventSp(this._tileInfo);
      }
   }

   /**
 * 检查按钮点击是否在多边形内
 * @param btn 按钮
 * @param e   点击事件
 */
   btnClick(e: cc.Event.EventTouch) {
      let points = this._polygoncolider.points;
      let local = this.node.convertToNodeSpaceAR(e.getLocation());
      let bHit = cc.Intersection.pointInPolygon(local, points);
      if (!bHit) {
         guiManager.showTips(`未选中`);
      } else {
         switch (this._state) {
            case data.TrialPointInfo.PointStatus.PSInvalid: {
               guiManager.showTips(`节点已完成!`);
               break;
            }
            case data.TrialPointInfo.PointStatus.PSMask: {
               guiManager.showTips(`节点不可点击!`);
               break;
            }
            case data.TrialPointInfo.PointStatus.PSUnMask:
            case data.TrialPointInfo.PointStatus.PSPreView: {
               if (this._checkIsVaildTile()) {
                  this._openPropView();
               }
               break;
            }
         }
      }
      return bHit;
   }

   private _checkIsVaildTile(): boolean {
      
      return true;
   }

   private _openPropView() {
      let parent = this.node.parent.parent.parent.parent;
      let eventType = this._tileInfo.Type;
      switch (eventType) {
         case PointType.PTBoss:
         case PointType.PTElite:
         case PointType.PTMonster:
            let groupId = this._tileInfo.Monster?.GroupID, dropId = this._tileInfo.Monster?.DropID;
            islandData.chosePoint(this._tileInfo.PointUID);
            guiManager.loadView(VIEW_NAME.PVE_FAIRYISLAND_ENEMY_VIEW, parent, eventType,groupId,dropId);
            break;
         case PointType.PTHPAltar:
         case PointType.PTTransGate:
         case PointType.PTLiveAltar:
            guiManager.loadView(VIEW_NAME.PVE_FAIRYISLAND_EFFECT_POPVIEW, parent, this._tileInfo);
            break;
      }
   }

   private _initEventSp(pointInfo: data.ITrialPointInfo) {
      if (!pointInfo) return;
      let eventType = pointInfo.Type, url = ``;
      this.eventSp.node.active = true;
      switch (eventType)
      {
         case PointType.PTBoss:
         case PointType.PTElite:
         case PointType.PTMonster:
            {
               if (!pointInfo.Monster) break;
               let mstGroup: cfg.MonsterGroup = configUtils.getMonsterGroupConfig(pointInfo.Monster.GroupID);
               if (!mstGroup) break;
               let monsterId = mstGroup.MonsterId1 || mstGroup.MonsterId2 ||
                               mstGroup.MonsterId3 || mstGroup.MonsterId4 || mstGroup.MonsterId5;

               let cfg = configUtils.getMonsterConfig(monsterId);
               let modelCfg: cfg.Model = configUtils.getModelConfig(cfg.ModelId);
               url = `${RES_ICON_PRE_URL.HEAD_IMG}/${modelCfg.ModelHeadIconSquare}`;
               this.eventSp.node.setScale(0.5);
               break;
            }
         case PointType.PTHPAltar:
            {
               //泉水图片
               url = `${RES_ICON_PRE_URL.HERO_TYPE}${`type_10004`}`;
               break;  
            }
         case PointType.PTLiveAltar:
            {
               //祭坛图片
               url = `${RES_ICON_PRE_URL.HERO_TYPE}${`type_10005`}`;
               break;    
            }
         case PointType.PTTransGate:
            {
               //传送门图片
               url = `${RES_ICON_PRE_URL.HERO_TYPE}${`type_10003`}`;
               break;    
            }
      
      }
      this._spriteLoader.changeSprite(this.eventSp, url);
   }

}      
