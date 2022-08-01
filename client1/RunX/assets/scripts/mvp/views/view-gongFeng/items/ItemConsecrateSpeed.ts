
import { CustomItemId } from "../../../../app/AppConst";
import { utils } from "../../../../app/AppUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import { scheduleManager } from "../../../../common/ScheduleManager";
import { cfg } from "../../../../config/config";
import { data } from "../../../../network/lib/protocol";
import { bagData } from "../../../models/BagData";
import { serverTime } from "../../../models/ServerTime";
import { GONG_FENG_SPEED_TYPE } from "../GongFengSpeedView";
import { ConsecreateStatueLVData } from "./ItemGongFengMain";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemConsecrateSpeed extends cc.Component {

  @property(cc.Label) nameLb: cc.Label = null;
  @property(cc.Label) timeLb: cc.Label = null;
  @property(cc.Node) btnSpeed: cc.Node = null;

  private _speedType: GONG_FENG_SPEED_TYPE = GONG_FENG_SPEED_TYPE.NONE;
  private _statueInfo: data.IUniversalConsecrateStatue = null;
  private _tributeInfo: data.IUniversalConsecrateTribute = null;  //单个贡品加速时使用
  private _leftTime: number = 0;
  private _refTime: number = 0;
  private _schedulerID: number = 0;
  private _clickSpeedFn: Function = null;
  private _lvData: ConsecreateStatueLVData = null;

  init(speedType: GONG_FENG_SPEED_TYPE, statueInfo: data.IUniversalConsecrateStatue, lvData: ConsecreateStatueLVData, clickSpeedFn: Function, tributeInfo?: data.IUniversalConsecrateTribute) {
      this._statueInfo = statueInfo;
      this._speedType = speedType;
      this._lvData = lvData;
      this._tributeInfo = tributeInfo;
      this._clickSpeedFn = clickSpeedFn;
      this._refTime = serverTime.currServerTime();
      this._initCfg();
      this._initUI();
  }

  deInit() {
      this._schedulerID && scheduleManager.unschedule(this._schedulerID);
      this._schedulerID = 0;
      this._leftTime = 0;
      this._refTime = 0;
      this._speedType = GONG_FENG_SPEED_TYPE.NONE;
      this._lvData = null;
      this._statueInfo = null;
      this._tributeInfo = null;
      this._clickSpeedFn = null;
  }

  onClickSpeed() {
      let leftTime  = 0;
      if(this._speedType == GONG_FENG_SPEED_TYPE.ALL) {
          let tributes = this._statueInfo.UniversalConsecrateTributeList || [];
          tributes.forEach(ele => {
              leftTime += this._getTributeLeftTime(ele);
          });
      } else {
          leftTime = this._getTributeLeftTime(this._tributeInfo)
      }
      this._clickSpeedFn && this._clickSpeedFn(this._speedType, leftTime);
  }

  private _initCfg() {
      if(this._speedType == GONG_FENG_SPEED_TYPE.ALL) {
          let tributes = this._statueInfo.UniversalConsecrateTributeList || [];
          if(tributes && tributes.length > 0) {
              let leftTime = 0;
              tributes.forEach(ele => {
                  leftTime += this._getTributeLeftTime(ele);
              });
              this._leftTime = leftTime;
          }
      } else {
          this._leftTime = this._getTributeLeftTime(this._tributeInfo);
      }
  }

  private _getTributeLeftTime(item: data.IUniversalConsecrateTribute): number {
      if(!item) return 0;
      let goodsCfg: cfg.ConsecrateGoods = configUtils.getConsecrateGoodsCfg(item.ItemID);
      let startTime = utils.longToNumber(item.StartTime);
      let endTime =  startTime + Math.ceil((goodsCfg.ConsecrateGoodsDuration || 0) * ((10000- this._lvData.speedCnt)/ 10000));
      return Math.min(endTime - serverTime.currServerTime(), goodsCfg.ConsecrateGoodsDuration);
  }

  private _initUI() {
      let tributeCnt = 1;
      if(this._speedType == GONG_FENG_SPEED_TYPE.ALL) {
          this.nameLb.string = '全部贡品';
          let tributes = this._statueInfo.UniversalConsecrateTributeList || [];
          tributeCnt = tributes.length;
          if(!tributes || tributes.length == 0) {
              this.timeLb.string = '暂无可加速的贡品';
          }
      } else if(this._tributeInfo){
          let itemCfg = configUtils.getItemConfig(this._tributeInfo.ItemID);
          this.nameLb.string = itemCfg.ItemName || '';
      }

      if(this._leftTime >= 0) {
          this._updateTimeLb(this._leftTime);
          this._schedulerID = scheduleManager.schedule(this._timeCountDown.bind(this), 1);
      } else {
          this._clickSpeedFn && this._clickSpeedFn(this._speedType, this._leftTime, true);
      }

      this._updateBtnState(this._leftTime);
  }

  private _updateTimeLb(leftTime: number) {
      let leftTimeData = utils.getLeftTime(leftTime);
      if(leftTimeData ) {
          if(leftTimeData[0] != 0) {
              this.timeLb.string = `总计：${leftTimeData[0]}天${leftTimeData[1]}时${leftTimeData[2]}分`;
          } else if(leftTimeData[1] != 0) {
              this.timeLb.string = `总计：${leftTimeData[1]}时${leftTimeData[2]}分`;
          } else if(leftTimeData[2] != 0) {
              this.timeLb.string = `总计：${leftTimeData[2]}分`;
          } else {
              this.timeLb.string = '时间不足1分钟';
          }
      }
  }

  private _updateBtnState(leftTime: number) {
      let needCnt = this._getNeedCoinCnt(leftTime);
      let hasCnt = bagData.getItemCountByID(CustomItemId.GONG_FENG_SPEED_UP_COIN);
      let materialName = needCnt > hasCnt ? 'builtin-2d-gray-sprite' : 'builtin-2d-sprite';
      let color = needCnt > hasCnt ? cc.Color.RED : cc.color().fromHEX('#51D011');
      let material = cc.assetManager.builtins.getBuiltin('material',materialName);
      this.btnSpeed.getComponent(cc.Sprite).setMaterial(0, material as cc.Material);
      this.timeLb.node.color = color;
  }

  private _timeCountDown() {
      let leftTime = this._leftTime - (serverTime.currServerTime() - this._refTime);
      if(leftTime < 0) {
          this._schedulerID && scheduleManager.unschedule(this._schedulerID);
          this._schedulerID = 0;
          this._clickSpeedFn && this._clickSpeedFn(this._speedType, leftTime, true);
          return;
      }
      this._updateTimeLb(leftTime);
      this._updateBtnState(leftTime);
  }

  private _getNeedCoinCnt(leftTime: number) :number {
      let needSpeedCoinCnt = 0;
      if(leftTime > 0) {
          let notEnoughMin = leftTime % 60;
          leftTime = leftTime - notEnoughMin;
          needSpeedCoinCnt = leftTime / 60;
      }
      return needSpeedCoinCnt;
  }
}
