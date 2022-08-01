/*
 * @Description:
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2022-06-07 19:54:06
 * @LastEditors: lixu
 * @LastEditTime: 2022-06-15 20:28:03
 */
import { CONSECRATE_STATUE_NAME } from "../../../../app/AppEnums";
import { BagItemInfo, ItemInfo } from "../../../../app/AppType";
import { utils } from "../../../../app/AppUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import { resPathUtils } from "../../../../app/ResPathUrlUtils";
import { configManager } from "../../../../common/ConfigManager";
import guiManager from "../../../../common/GUIManager";
import { ItemBagPool } from "../../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../../config/config";
import { data } from "../../../../network/lib/protocol";
import { consecrateData } from "../../../models/ConsecrateData";
import { serverTime } from "../../../models/ServerTime";
import { consecrateOpt } from "../../../operations/ConsecrateOpt";
import ItemBag from "../../view-item/ItemBag";
import { GONG_FENG_SPEED_TYPE } from "../GongFengSpeedView";
import ItemGongFengBox, { TributeBoxState } from "./ItemGongFengBox";

const {ccclass, property} = cc._decorator;

interface ConsecreateStatueLVData {
    lv: number,
    expCnt: number,
    tributeBoxCnt?: number,
    speedCnt?: number,
    tributeBoxUnlockLv?: number[]
}

enum GongFengViewUIEvent {
    OPEN_LV_REWARD_VIEW = 1,
    OPEN_BAG_VIEW,
    OPEN_SPEED_VIEW,
    OPEN_SINGLE_SPEED_VIEW
}

interface GongFengMainOpts {
    clickFn?: Function,
    getTributeBoxFn: Function,
    releaseTributeBoxFn: Function,
}

const MAX_COUNT_OF_TRIBUTE_BOX = 6;

//雕像x轴偏移
const ICON_OFFSET: any = {
    '1' : cc.v2(-30, -15),
    '2' : cc.v2(-40, -15),
    '3':  cc.v2(30, -15),
}

@ccclass
export default class ItemGongFengMain extends cc.Component {
    @property(cc.Sprite) bg: cc.Sprite = null;
    @property(cc.Label) nameLb: cc.Label = null;
    @property(cc.ProgressBar) xinYangProgress: cc.ProgressBar = null;
    @property(cc.Label) xinYangLb: cc.Label = null;
    @property(cc.Button) btnAddSpeed: cc.Button = null;
    @property(cc.Node) rightPanel: cc.Node = null;
    @property(cc.Label) rightToplvLb: cc.Label = null;
    @property(cc.Label) rightBottomlvLb: cc.Label = null;
    @property(cc.Node) rightItemRoot: cc.Node = null;
    @property(cc.Node) bottomPanel: cc.Node = null;

    private _statueID: number = -1;
    private _statueInfo: data.IUniversalConsecrateStatue = null;
    private _maxBeFall: number = 0;
    private _lvData: ConsecreateStatueLVData =  {lv: 1, expCnt: 0};
    private _lvRewards: Map<number, BagItemInfo[]> = null;
    private _lvRewarditem: ItemBag = null;
    private _opt: GongFengMainOpts = null
    private _tributeBoxs: ItemGongFengBox[] = null;
    private _visibleLv: number = -1;
    private _spLoader: SpriteLoader = null;
    private _oriIconPosY: number = undefined;

    get visibleLv() {
        if(this._visibleLv == -1) {
            this._visibleLv = this._getVisibleLv();
        }
        return this._visibleLv;
    }

    init(id: number, opt: GongFengMainOpts) {
        this._statueID = id;
        this._opt = opt;
        this._spLoader = this._spLoader || new SpriteLoader();
        if(typeof this._oriIconPosY == 'undefined') {
            this._oriIconPosY = this.bg.node.y;
        }
        this._maxBeFall = configManager.getConfigByKey('consecrateCome', this._statueID).ConsecrateComeFaith;
        this._initLvRewardCfg();
        this._statueInfo = consecrateData.getStatueInfo(this._statueID);
        this._updateConsecreateStatueLv(true);
        this._visibleLv = this._getVisibleLv();
        this._initUI();
    }

    deInit() {
        this._spLoader && this._spLoader.release();
        this._lvRewards && this._lvRewards.clear();
        this._lvRewarditem && ItemBagPool.put(this._lvRewarditem);
        this._lvRewarditem = null;
        this._clearTributeBoxs();
        this._opt = null;
        this._statueInfo = null;
        this._lvData = null;
    }

    private _clearTributeBoxs() {
        if(this._tributeBoxs && this._tributeBoxs.length > 0) {
            this._tributeBoxs.forEach(ele => {
                this._opt.releaseTributeBoxFn(ele);
            })
            this._tributeBoxs.length = 0;
        }
    }

    onClikcSpeedBtn() {
        let tributeCnt = 0;
        if(this._tributeBoxs && this._tributeBoxs.length > 0) {
            this._tributeBoxs.forEach(ele => {
                if(ele.state == TributeBoxState.Running || ele.state == TributeBoxState.Waitting) {
                  tributeCnt += 1;
                }
            })
        }
        if(tributeCnt == 0) {
            guiManager.showTips('当前雕像暂无可加速的贡品');
            return;
        }
        let runningTribute = (this._tributeBoxs && this._tributeBoxs.length > 0 && this._tributeBoxs[0].state == TributeBoxState.Running)
            ? consecrateData.getStatueInfo(this._statueID).UniversalConsecrateTributeList[0] : null;
        this._opt && this._opt.clickFn && this._opt.clickFn(GongFengViewUIEvent.OPEN_SPEED_VIEW, this._statueID
            , this._statueInfo, GONG_FENG_SPEED_TYPE.ALL, this._lvData, runningTribute);
    }

    private _initUI() {
        if(!this._statueInfo) return;
        this.bg.node.setPosition(cc.v2(0, this._oriIconPosY).add(ICON_OFFSET[this._statueID+'']));
        this._spLoader.changeSprite(this.bg, resPathUtils.getGongFengStatueIconPath(this._statueID));
        this.nameLb.string = `${CONSECRATE_STATUE_NAME[this._statueID+'']}雕像`;
        let curBeFallV = (this._statueInfo.StatueBefall || 0) - (this._maxBeFall * (this._statueInfo.ReceiveBefallRewardCount || 0));
        this.xinYangLb.string = `信仰值：${curBeFallV}`;
        this.xinYangProgress.progress = curBeFallV / this._maxBeFall;

        let nextLvExp = configUtils.getConsecrateCfgByIDAndLv(this._statueID, this._lvData.lv + 1);
        if(nextLvExp) {
            this.rightToplvLb.string = `LV:${this._lvData.lv}(${Math.floor((this._statueInfo.StatueExp - this._lvData.expCnt) * 100 /nextLvExp.ConsecrateLevelExp)}%)`;
        } else {
            this.rightToplvLb.string = '满级';
        }

        let visibleLv = this.visibleLv;
        let isShowRedot: boolean = false;
        if(visibleLv <= this._lvData.lv) {
            isShowRedot = !(this._statueInfo.ReceiveLevelRewardMap[visibleLv+'']);
            this.rightBottomlvLb.string = this._statueInfo.ReceiveLevelRewardMap[visibleLv+''] ? '所有奖励已领取' : '可领取';
        } else {
            this.rightBottomlvLb.string = `LV${visibleLv}可领取`;
        }
        this._initLvRewardItem(visibleLv);
        this._lvRewarditem.itemRedDot.showRedDot(isShowRedot);
        this._initTributeBoxs();
        this._updateSpeedBtnState();
    }

    private _updateSpeedBtnState() {
        let tributeCnt = 0;
        if(this._tributeBoxs && this._tributeBoxs.length > 0) {
            this._tributeBoxs.forEach(ele => {
                if(ele.state == TributeBoxState.Running || ele.state == TributeBoxState.Waitting) {
                  tributeCnt += 1;
                }
            })
        }
        let material = cc.assetManager.builtins.getBuiltin('material', tributeCnt <= 0 ? 'builtin-2d-gray-sprite' : 'builtin-2d-sprite');
        this.btnAddSpeed.getComponent(cc.Sprite).setMaterial(0, material as cc.Material);
    }

    private _initLvRewardItem(lv: number) {
        let itemInfo: BagItemInfo  = null;
        itemInfo = this._lvRewards.get(lv)[0];
        this._updateLvRewardItem(itemInfo);
    }

    //初始化供奉栏
    private _initTributeBoxs(){
        this._clearTributeBoxs();
        if(!this._lvData.tributeBoxCnt || this._lvData.tributeBoxCnt == 0) return;
        this._tributeBoxs = this._tributeBoxs || [];

        //已经解锁的
        for(let i = 0, len = this._lvData.tributeBoxCnt; i < len; i++) {
            let tributeBox: ItemGongFengBox = this._opt.getTributeBoxFn();
            this._initTributeBox(i, tributeBox);
            this.bottomPanel.addChild(tributeBox.node);
            this._tributeBoxs.push(tributeBox);
        }

        //下一个待解锁的
        if(this._tributeBoxs.length < MAX_COUNT_OF_TRIBUTE_BOX) {
            let tributeBox: ItemGongFengBox = this._opt.getTributeBoxFn();
            this._initTributeBox(this._tributeBoxs.length, tributeBox, true);
            this.bottomPanel.addChild(tributeBox.node);
            this._tributeBoxs.push(tributeBox);
        }
    }

    private _updateLvRewardItem(itemInfo: BagItemInfo) {
        if(!itemInfo) {
            this._lvRewarditem && (this._lvRewarditem.node.active = false);
            return;
        }

        if(!this._lvRewarditem) {
            this._lvRewarditem = ItemBagPool.get();
            this._lvRewarditem.node.scale = 0.7;
            this.rightItemRoot.addChild(this._lvRewarditem.node);
        } else {
            this._lvRewarditem.node.active = true;
        }
        itemInfo.clickHandler = this._onClickLvRewardItem.bind(this);
        this._lvRewarditem.init(itemInfo);
    }

    private _updateConsecreateStatueLv(isUpdateTributeBoxUnlockLv: boolean = false) {
        let data:ConsecreateStatueLVData = this._lvData;
        let consecrateCfgs: cfg.Consecrate[] = configManager.getConfigByKey('consecrate', this._statueID);
        let expCnt: number = 0;
        let exp = this._statueInfo.StatueExp || 0;
        consecrateCfgs.forEach(ele => {
            expCnt += (ele.ConsecrateLevelExp || 0);
            if(exp >= expCnt) {
                data.lv = Math.max(ele.ConsecrateLevel, data.lv);
                data.expCnt = expCnt;
                data.speedCnt = (data.speedCnt || 0) + (ele.ConsecrateAccelerate || 0);
                data.tributeBoxCnt = (data.tributeBoxCnt || 0) + (ele.ConsecrateOpenField || 0);
            }

            if(!isUpdateTributeBoxUnlockLv) return;
            data.tributeBoxUnlockLv = data.tributeBoxUnlockLv || [];
            if( ele.ConsecrateOpenField) {
                for(let i = 0; i < ele.ConsecrateOpenField; i++) {
                  data.tributeBoxUnlockLv.push(ele.ConsecrateLevel);
                }
            }
        });
    }

    private _initLvRewardCfg() {
        let consecrateCfgs: cfg.Consecrate[] = configManager.getConfigByKey('consecrate', this._statueID);
        consecrateCfgs.forEach(ele => {
          if(ele.ConsecrateRewardExhibition && ele.ConsecrateRewardExhibition.length > 0) {
              this._lvRewards = this._lvRewards || new Map();
              utils.parseStingList(ele.ConsecrateRewardExhibition, (strArr: string[]) => {
                  if(!strArr || strArr.length == 0) return;
                  let itemID = parseInt(strArr[0]), cnt = parseInt(strArr[1]);
                  if(!this._lvRewards.has(ele.ConsecrateLevel)) {
                      this._lvRewards.set(ele.ConsecrateLevel, []);
                  }
                  this._lvRewards.get(ele.ConsecrateLevel).push({id: itemID, count: cnt});
              });
          }
      });
    }

    private _onClickLvRewardItem() {
        this._opt && this._opt.clickFn && this._opt.clickFn(GongFengViewUIEvent.OPEN_LV_REWARD_VIEW, this._statueID, this._lvData, this._lvRewards, this._visibleLv);
    }

    private _onClickTributeBox(state: TributeBoxState, box: ItemGongFengBox) {
        switch(state) {
            //打开背包
            case TributeBoxState.Empty:
                this._opt && this._opt.clickFn && this._opt.clickFn(GongFengViewUIEvent.OPEN_BAG_VIEW, this._statueID, this._lvData);
                break;
            case TributeBoxState.Waitting:
                consecrateOpt.sendPutOffTributeReq(this._statueID, this._tributeBoxs.indexOf(box) + 1);
                break;
            case TributeBoxState.Running:
                let pos: cc.Vec3 = box.node.parent.convertToWorldSpaceAR(box.node.position);
                this._opt && this._opt.clickFn && this._opt.clickFn(GongFengViewUIEvent.OPEN_SINGLE_SPEED_VIEW, this._statueID
                    , this._statueInfo, this._lvData, box.tributeInfo, pos);
                break;
            case TributeBoxState.Finished:
                consecrateOpt.sendGetRewardOfTributeReq(this._statueID);
                break;
        }
    }

    private _getTributeBoxState(idx: number) {
        if(!this._statueInfo.UniversalConsecrateTributeList || this._statueInfo.UniversalConsecrateTributeList.length == 0
            || idx >= this._statueInfo.UniversalConsecrateTributeList.length) {
            return TributeBoxState.Empty;
        }

        let tribute = this._statueInfo.UniversalConsecrateTributeList[idx];
        let startTime = utils.longToNumber(tribute.StartTime);
        let currTime = serverTime.currServerTime();
        let goodCfg = configUtils.getConsecrateGoodsCfg(tribute.ItemID);
        // cc.warn('贡品状态, 雕像：%d，贡品位置：%d， 当前时间：%d，开始时间：%d，持续时间：%d', this._statueID, idx, currTime, startTime, goodCfg.ConsecrateGoodsDuration);
        // 允许存在1秒的误差
        if(!tribute.SpeedUpFlag &&  currTime < startTime - 1){
            return TributeBoxState.Waitting;
        }

        let costTime = goodCfg.ConsecrateGoodsDuration || 1;
        costTime =  Math.ceil(costTime *  (10000 - this._lvData.speedCnt) / 10000);
        let endTime = startTime + costTime;
        if(!tribute.SpeedUpFlag && currTime <= endTime) {
            return TributeBoxState.Running;
        }
        return TributeBoxState.Finished;
    }

    private _initTributeBox(idx: number, tributeBox: ItemGongFengBox, isLock: boolean = false): ItemGongFengBox{
        if(!tributeBox) return null;
        tributeBox.init(isLock ? TributeBoxState.Lock : this._getTributeBoxState(idx),
            this._lvData.tributeBoxUnlockLv[idx], this._getTributeBoxItemInfo(idx), this._onClickTributeBox.bind(this));
        let column = idx % 3, row = Math.floor(idx / 3);
        let posx =  (column - 1) * (tributeBox.node.width + 5 + row * 25);
        let posY = -(tributeBox.node.height) * row - (tributeBox.node.height >> 1);
        tributeBox.node.setPosition(posx, posY);
        return tributeBox;
    }

    private _getTributeBoxItemInfo(idx: number): data.IUniversalConsecrateTribute {
      if(!this._statueInfo.UniversalConsecrateTributeList || this._statueInfo.UniversalConsecrateTributeList.length == 0
          || idx >= this._statueInfo.UniversalConsecrateTributeList.length) {
          return null;
      }

      return this._statueInfo.UniversalConsecrateTributeList[idx];
    }

    private _getVisibleLv(): number {
        let targetLv = 1;
        let lvRewards = this._lvRewards;
        if(!lvRewards || lvRewards.size == 0) return targetLv;

        let isFind = false;
        lvRewards.forEach((ele, idx) => {
            if(this._statueInfo.ReceiveLevelRewardMap && this._statueInfo.ReceiveLevelRewardMap[idx+'']) {
                return;
            }

            if(!isFind) {
                isFind = true;
                targetLv = idx;
            }
        });
        return targetLv;
    }

    addTribute() {
        this._initUI();
    }

    refreshView() {
        this._statueInfo = consecrateData.getStatueInfo(this._statueID);
        this._lvData.expCnt = 0;
        this._lvData.lv = 1;
        this._lvData.speedCnt = 0;
        this._lvData.tributeBoxCnt = 0;
        this._updateConsecreateStatueLv();
        this._visibleLv = this._getVisibleLv();
        this._initUI();
    }
}

export {
  ConsecreateStatueLVData,
  GongFengViewUIEvent
}
