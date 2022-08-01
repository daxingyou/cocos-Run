import { RES_ICON_PRE_URL } from "../../../../app/AppConst";
import { configUtils } from "../../../../app/ConfigUtils";
import { eventCenter } from "../../../../common/event/EventCenter";
import { guildWarEvent } from "../../../../common/event/EventData";
import { SpriteLoader } from "../../../../common/ui-helper/SpriteLoader";
import { data } from "../../../../network/lib/protocol";
import { pvpData } from "../../../models/PvpData";
import { userData } from "../../../models/UserData";

const {ccclass, property} = cc._decorator;
@ccclass
export default class ItemGuildWarCampOpt extends cc.Component {
   @property(cc.Label) nameLb: cc.Label = null;
   @property(cc.Label) powerLb: cc.Label = null;
   @property(cc.Label) lvLb: cc.Label = null;
   @property(cc.Label) stateLb: cc.Label = null;

   @property(cc.Sprite) headSpr: cc.Sprite = null;
   @property(cc.Sprite) headBg: cc.Sprite = null;

   /**玩家信息*/
   private _meberInfo: data.IFactionMember = null;
   private _spLoader: SpriteLoader = new SpriteLoader();

   onInit(member: data.IFactionMember): void {
      this._meberInfo = member;
      this._registerEvent();
      this._initItem();
   }

   /**item释放清理*/
   deInit() {
      eventCenter.unregisterAll(this);
      this._spLoader.release();
   }

   private _registerEvent() {

   }
   
   private _initItem() {
      if (!this._meberInfo) return;
      this.name = this._meberInfo.Name;
      this.powerLb.string = this._meberInfo.Power.toString();
      this.stateLb.string = `暂时全部空闲`

      this.lvLb.string = pvpData.getUserLv(this._meberInfo.Exp) + "";   
   
      //头像
      let headId = this._meberInfo ? this._meberInfo.HeadID : userData.accountData.HeadID;
      let headFrameID = this._meberInfo ? this._meberInfo.HeadFrameID : userData.accountData.HeadFrameID;
      
      let headUrl = `${RES_ICON_PRE_URL.HEAD_IMG}/` + configUtils.getHeadConfig(headId).HeadFrameImage;
      this._spLoader.changeSprite(this.headSpr, headUrl);

      let frameUrl = `${RES_ICON_PRE_URL.HEAD_FRAME}/` + configUtils.getHeadConfig(headFrameID).HeadFrameImage;
      this._spLoader.changeSprite(this.headBg, frameUrl);
   }

   itemClick() {
      eventCenter.fire(guildWarEvent.CHOSE_GUILD_CAMP_OPT_RES, this._meberInfo);
   }
}