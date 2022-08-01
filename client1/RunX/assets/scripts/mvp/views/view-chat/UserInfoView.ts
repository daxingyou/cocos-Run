/*
 * @Author: xuyang
 * @Date: 2021-05-25 13:54:48
 * @Description: 用户详情界面
 */
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { CustomDialogId, RES_ICON_PRE_URL } from "../../../app/AppConst";
import { configUtils } from "../../../app/ConfigUtils";
import { eventCenter } from "../../../common/event/EventCenter";
import { chatEvent, useInfoEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { data, gamesvr } from "../../../network/lib/protocol";
import { chatData } from "../../models/ChatData";
import { chatOpt } from "../../operations/ChatOpt";
import ReportUserView from "./ReportUserView";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { userOpt } from "../../operations/UserOpt";
import { configManager } from "../../../common/ConfigManager";
import { cfg } from "../../../config/config";
import { utils } from "../../../app/AppUtils";

const { ccclass, property } = cc._decorator;
@ccclass
export default class UserInfoView extends ViewBaseComponent {

    @property(cc.Sprite) headFrameSp: cc.Sprite = null;
    @property(cc.Sprite) headSp: cc.Sprite = null;
    @property(cc.Label) lv: cc.Label = null;
    @property(cc.Label) userName: cc.Label = null;
    @property(cc.Label) guideName: cc.Label = null;
    @property(cc.Label) fightPower: cc.Label = null;
    @property(cc.Label) maoXianLb: cc.Label = null;
    @property(cc.Label) heMingWuHuiLb: cc.Label = null;
    @property(cc.Label) taiXuHuanJingLb: cc.Label = null;
    @property(cc.Label) qiYunWenDaoLb: cc.Label = null;
    @property(cc.Node) addBlack: cc.Node = null;
    @property(cc.Node) rmvBlack: cc.Node = null;

    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _uInfo: data.IUniversalViewOtherData = null;
    private _power: number = 0;
    private _reportView: ReportUserView = null;

    onInit(uInfo:  data.IUniversalViewOtherData) {
        if (uInfo) {
            this._uInfo = uInfo;
            this._registerEvents();
            this._initUI();
        }
        userOpt.reqUniversalViewuserInfo(uInfo.UserID);
    }

    onRelease() {
        eventCenter.unregisterAll(this);
        this._spriteLoader.release();
    }

    private _registerEvents() {
        eventCenter.register(chatEvent.ADD_BLOCK, this, this._onbAddBlockCb);
        eventCenter.register(chatEvent.RMV_BLOCK, this, this._onRemoveBlockCb);
        eventCenter.register(useInfoEvent.REPORT_USER, this, this._onReportCb);
        eventCenter.register(useInfoEvent.UNIVERSAL_VIEW_USER_INFO, this, this._onRecvUserInfo)
    }

    private _initUI() {
        this.userName.string = `${this._uInfo.Name || ''}`;
        this.fightPower.string = `战斗力:${this._uInfo.Power || 0}`;
        this.guideName.string = (this._uInfo.FactionName && this._uInfo.FactionName.length > 0) ? (this._uInfo.FactionName) : '暂无公会';
        this.lv.string = `${bagDataUtils.getUserLVByExp(this._uInfo.Exp)}`;

        this.taiXuHuanJingLb.string = '';
        this.qiYunWenDaoLb.string = '';

        let lessonID = this._uInfo.AdventureLessonId || 0;
        if(lessonID) {
            let lessonCfg = configUtils.getLessonConfig(lessonID);
            let chapterCfg = configUtils.getChapterConfig(lessonCfg.LessonChapter);
            this.maoXianLb.string = `冒险进度：${chapterCfg.ChapterName} ${lessonCfg.LessonName}`;
        } else {
            this.maoXianLb.string = `冒险进度：暂未开启`;
        }

        let sortID = this._uInfo.PvpSpiritRank || 0;
        this.heMingWuHuiLb.string = `鹤鸣舞会排名: ${sortID == 0 ? '未上榜' : sortID}`;

        let dreamLandLessonID = this._uInfo.DreamLessonId || 0;
        if(dreamLandLessonID) {
            let dreamLandLessonCfg = configUtils.getDreamLandLessonConfig(dreamLandLessonID);
            let dreamLandChapterCfg = configUtils.getDreamLandChapterConfig(dreamLandLessonCfg.PVEDreamlandLessonChapter);
            this.taiXuHuanJingLb.string = `太虚幻境：第${dreamLandChapterCfg.PVEDreamlandChapterName.match(/\d+/)[0]}层 ${dreamLandLessonCfg.PVEDreamlandLessonName}`;
        } else {
            this.taiXuHuanJingLb.string = `太虚幻境：暂未开启`;
        }

        let FairyIntegralSortID = this._uInfo.PvpFairyIntegral || 0;
        this.qiYunWenDaoLb.string = `齐云问道段位: ${this._getFairyCfg(FairyIntegralSortID).PVPImmortalsRankName}`;

        if(this._uInfo.HeadID) {
            let headUrl = `${RES_ICON_PRE_URL.HEAD_IMG}/` + configUtils.getHeadConfig(this._uInfo.HeadID).HeadFrameImage;
            this._spriteLoader.changeSprite(this.headSp, headUrl);
        }

        if(this._uInfo.HeadFrameID) {
            let frameUrl = `${RES_ICON_PRE_URL.HEAD_FRAME}/` + configUtils.getHeadConfig(this._uInfo.HeadFrameID).HeadFrameImage;
            this._spriteLoader.changeSprite(this.headFrameSp, frameUrl);
        }

        //加入、解除黑名单
        this.addBlack.active = !chatData.checkInBlack(this._uInfo.UserID);
        this.rmvBlack.active = chatData.checkInBlack(this._uInfo.UserID);
    }

    onClickAddBlack() {
        chatOpt.sendBlockReq(this._uInfo);
    }

    onClickRmvBlack() {
        chatOpt.sendRmvBlockReq(this._uInfo.UserID);
    }

    //举报
    onClickReport() {
        guiManager.loadView('ReportUserView', this.node, {uID: this._uInfo.UserID, userName: this._uInfo.Name}).then(ele => {
            this._reportView = ele as ReportUserView;
            this._reportView.closeCb = () => {
              this._reportView = null;
            }
        });
    }

    private _onbAddBlockCb() {
        this.addBlack.active = false;
        this.rmvBlack.active = true;
        guiManager.showDialogTips(CustomDialogId.CHAT_ADD_BLOCK);
    }

    private _onRemoveBlockCb() {
        this.addBlack.active = true;
        this.rmvBlack.active = false;
        guiManager.showDialogTips(CustomDialogId.CHAT_REMOVE_BLOCK);
    }

    private _onReportCb() {
        if(this._reportView && cc.isValid(this._reportView.node)) {
            this._reportView.closeView();
        }
        guiManager.showMessageBoxByCfg(this.node, configUtils.getDialogCfgByDialogId(2000020));
    }

    private _onRecvUserInfo(event: number, data: gamesvr.IUniversalViewUserInformRes) {
        this._uInfo = this._uInfo || {};
        if(data.UniversalViewOtherUnit.UserID != this._uInfo.UserID) return;
        this._uInfo = data.UniversalViewOtherUnit;
        this._initUI();
    }

    private _getFairyCfg(sortID: number) {
      let cfgs: cfg.PVPImmortals[] = configManager.getConfigList("pvpImmortals");
      let max = 0;
      let cfg: cfg.PVPImmortals = null;
      let maxCfg: cfg.PVPImmortals = null;
      cfgs.some(ele => {
          if(ele.PVPImmortalsRankType == 1) {
              let sortScope = utils.parseStringTo1Arr(ele.PVPImmortalsRankSection, ';');
              let low = parseInt(sortScope[0]), high = parseInt(sortScope[1]);
              if(max > high) {
                  max = high;
                  maxCfg = ele;
              }

              if(sortID >= low && sortID <= high) {
                  cfg = ele;
                  return true;
              }

              if(sortID > max) {
                cfg = maxCfg;
                return true;
              }
              return false;
          }
          return false;
      });
      cfg = cfg || cfgs[0];
      return cfg;
    }
}
