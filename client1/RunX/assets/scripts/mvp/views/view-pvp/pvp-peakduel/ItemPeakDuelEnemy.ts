import { RES_ICON_PRE_URL, SCENE_NAME } from "../../../../app/AppConst";
import { PVP_MODE } from "../../../../app/AppEnums";
import { PvpConfig } from "../../../../app/AppType";
import { utils } from "../../../../app/AppUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import { eventCenter } from "../../../../common/event/EventCenter";
import { peakDuelEvent } from "../../../../common/event/EventData";
import guiManager from "../../../../common/GUIManager";
import { SpriteLoader } from "../../../../common/ui-helper/SpriteLoader";
import { data } from "../../../../network/lib/protocol";
import { pvpData } from "../../../models/PvpData";

const {ccclass, property} = cc._decorator;
@ccclass
export default class ItemPeakDuelEnemy extends cc.Component {

   @property(cc.Label) nameLb: cc.Label = null;
   @property(cc.Label) scoreLb: cc.Label = null;
   @property(cc.Label) power: cc.Label = null;
   @property(cc.Sprite) headFrameSp: cc.Sprite = null;
   @property(cc.Sprite) headSp: cc.Sprite = null;
   @property(cc.Label) lvLB: cc.Label = null;

   private _spLoader: SpriteLoader = new SpriteLoader();
   private _enemyList: { [k: string]: data.IBagUnit } = {}; 
   private _info: data.IPVPPeakDuelIntegral = null;
   private _index: number = 0;
   

   onInit(): void {
      this._registerEvent();
   }

   /**item释放清理*/
   deInit() {
      this._spLoader.release();
      eventCenter.unregisterAll(this);
   }

   private _registerEvent() {

   }
   
   /**重置item信息*/
   resetEnemyItem(enemyInfo: data.IPVPPeakDuelIntegral,index:number) {
      if (!enemyInfo) return;
      this._info = enemyInfo;
      this._index = index;
      this._enemyList = enemyInfo.PVPPeakDuelDefensiveHeroList[index]?.HeroUnitMap;
      let power = 0;
      enemyInfo.PVPPeakDuelDefensiveHeroList.forEach(item => {
         power += utils.longToNumber(item.Power);
      }); 
      this.power.string = `${power}`;
      this.nameLb.string = enemyInfo.User.Name;
      this.scoreLb.string = `${enemyInfo.Integral.toString()}`;
      this.lvLB.string = pvpData.getUserLv(enemyInfo.User.Exp) + "";

      if (enemyInfo.User) {
         let headUrl = `${RES_ICON_PRE_URL.HEAD_IMG}/` + configUtils.getHeadConfig(enemyInfo.User.HeadID).HeadFrameImage;
         this._spLoader.changeSprite(this.headSp, headUrl);

         let frameUrl = `${RES_ICON_PRE_URL.HEAD_FRAME}/` + configUtils.getHeadConfig(enemyInfo.User.HeadFrameID).HeadFrameImage;
         this._spLoader.changeSprite(this.headFrameSp, frameUrl);
      } 
   }

   startChallege() {
      let count = pvpData.getPeakDuekAttakTimes();
      if (count <= 0) {
         guiManager.showTips("进攻次数不足!");
         return;
      }

      let herolist:{[k: string]: number} = {};
      for (let k in this._enemyList) {
         let heroBag: data.IBagUnit = this._enemyList[k];
         herolist[k] = heroBag.ID;
      }
      let pvpConfig: PvpConfig = {
         pvpMode: PVP_MODE.PEAK_DUEL,
         step: 0,
         idx: this._index,
      }
      pvpData.pvpConfig = pvpConfig;

      pvpData.updatePeakDuelEnemisInfo(this._info);
      
      eventCenter.fire(peakDuelEvent.ENTER_BATTLE_NTY)

      guiManager.loadScene(SCENE_NAME.BATTLE);
  }
}