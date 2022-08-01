import { RES_ICON_PRE_URL } from "../../../../app/AppConst";
import { configUtils } from "../../../../app/ConfigUtils";
import { eventCenter } from "../../../../common/event/EventCenter";
import { SpriteLoader } from "../../../../common/ui-helper/SpriteLoader";
import { data } from "../../../../network/lib/protocol";
import { guildData } from "../../../models/GuildData";
import { pvpData } from "../../../models/PvpData";
import { userData } from "../../../models/UserData";

const {ccclass, property} = cc._decorator;
@ccclass
export default class ItemPeakDuelRank extends cc.Component {
   @property(cc.SpriteFrame) rankTag: cc.SpriteFrame[] = [];
   @property(cc.Label) heroName: cc.Label = null;
   @property(cc.Label) familyName: cc.Label = null;
   @property(cc.Label) integral: cc.Label = null;
   @property(cc.Label) rankIndex: cc.Label = null;
   @property(cc.Sprite) rankIndexBg: cc.Sprite = null;
   @property(cc.Sprite) headSp: cc.Sprite = null;
   @property(cc.Sprite) headBg: cc.Sprite = null;
   @property(cc.Label) userLvLb: cc.Label = null;

   private _spLoader: SpriteLoader = new SpriteLoader();

   onInit(info: data.IPVPPeakDuelIntegral,index:number): void {
      this._registerEvent();
      this._initLabel(info);
      this._renderSp(info?.User,index);
   }

   /**item释放清理*/
   deInit() {
      this._spLoader.release();
      eventCenter.unregisterAll(this);
   }

   private _registerEvent() {

   }


   private _initLabel(data: data.IPVPPeakDuelIntegral) {
      let name = data ? data.User.Name : userData.accountData.Name;
      let intergel = data ? data.Integral : pvpData.peakDuelData.Integral;
      this.heroName.string = name;
      this.familyName.string = guildData.guildInfo?.Account?.Name || "无公会";
      this.integral.string = `${intergel}`;
   }

   /**图片渲染*/
   private _renderSp(rankUser: data.IRankUser, index: number) {
      //排行
      if (index<0 || (index != 0 && !index)) {
         this.rankIndexBg.node.active = false;
         this.rankIndex.string = "暂无";
      } else {
         let num = index + 1;
         this.rankIndexBg.node.active = (num <= 3);
         this.rankIndex.node.active = (num > 3);
         if (num <= 3) {
            this.rankIndexBg.spriteFrame = this.rankTag[index];
         } else {
            this.rankIndex.string = num + '';
         }   
      }
      if (!rankUser) {
         this.userLvLb.string = pvpData.getUserLv(userData.accountData.Exp) + "";
      } else {
         this.userLvLb.string = pvpData.getUserLv(rankUser?.Exp) + "";   
      }
      
      //头像
      let headId = rankUser ? rankUser.HeadID : userData.accountData.HeadID;
      let headFrameID = rankUser ? rankUser.HeadFrameID : userData.accountData.HeadFrameID;
      
      let headUrl = `${RES_ICON_PRE_URL.HEAD_IMG}/` + configUtils.getHeadConfig(headId).HeadFrameImage;
      this._spLoader.changeSprite(this.headSp, headUrl);

      let frameUrl = `${RES_ICON_PRE_URL.HEAD_FRAME}/` + configUtils.getHeadConfig(headFrameID).HeadFrameImage;
      this._spLoader.changeSprite(this.headBg, frameUrl);
      
   }


}