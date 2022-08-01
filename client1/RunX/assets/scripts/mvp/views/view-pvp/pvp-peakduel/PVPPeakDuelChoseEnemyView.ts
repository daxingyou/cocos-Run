import { utils } from "../../../../app/AppUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import List from "../../../../common/components/List";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { configManager } from "../../../../common/ConfigManager";
import { eventCenter } from "../../../../common/event/EventCenter";
import { peakDuelEvent } from "../../../../common/event/EventData";
import guiManager from "../../../../common/GUIManager";
import { logger } from "../../../../common/log/Logger";
import moduleUIManager from "../../../../common/ModuleUIManager";
import { cfg } from "../../../../config/config";
import { gamesvr } from "../../../../network/lib/protocol";
import { pvpData } from "../../../models/PvpData";
import { pvpDataOpt } from "../../../operations/PvpDataOpt";
import ItemPeakDuelEnemy from "./ItemPeakDuelEnemy";

const {ccclass, property} = cc._decorator;
@ccclass
export default class PVPPeakDuelChoseEnemyView extends ViewBaseComponent {
    @property(List) enemyList: List = null;
    @property(cc.Button) changeEnemyBtn: cc.Button = null;
    @property(cc.Label) attackTimes: cc.Label = null;

    private _showEnemeyList: ItemPeakDuelEnemy[] = [];
    private _canChange: boolean = true;

    onInit(): void {
        this._registerEvent();
        this.enemyList.numItems = 3;
        
        // this._refreshAttackTimes();
        this._checkEnemyViewCanReq();
    }

    protected onEnable(): void {
        //暂时解决
        this._refreshAttackTimes()
    }

    /**页面释放清理*/
    onRelease() {
        this.enemyList._deInit();
        this._showEnemeyList.length = 0;
        eventCenter.unregisterAll(this);
    }

    /**页面来回跳转刷新*/
    onRefresh(): void {
        this._refreshAttackTimes();
    }

    private _registerEvent() {
        eventCenter.register(peakDuelEvent.RECV_CHANGE_ENEMY_RES, this, this._resetEnemyList);
        eventCenter.register(peakDuelEvent.ENTER_BATTLE_NTY, this, this.closeView);
    }

    onEnemyItemRender(item: cc.Node, index: number) {
        let enemyComp = item.getComponent(ItemPeakDuelEnemy);
        enemyComp.onInit();
        enemyComp.resetEnemyItem(pvpData.peakDuelData.PVPPeakDuelIntegralList[index], index);  
        this._showEnemeyList.push(enemyComp);
    }

    onjumpShop() {
          //邀请函物品id
          let modelConfig: cfg.ConfigModule = configUtils.getModuleConfigs();
          let itemID = modelConfig?.PVPTopBattleUseItemId || 0;
  
          //moneyShow对应条目
          let moneyCfg: cfg.MoneyShow = null;
          let moenyshowCfg = configManager.getConfigs("moneyShow");
          for (let index in moenyshowCfg) {
              let cfg: cfg.MoneyShow = moenyshowCfg[index];
              if (cfg.MoneyShowItemId == itemID) {
                  moneyCfg = cfg;
                  break;
              }
          }
          
          //跳转商店
          if (moneyCfg && moneyCfg.MoneyShowUseResult){
              let parseList = utils.parseStingList(moneyCfg.MoneyShowUseResult);
              parseList = moneyCfg.MoneyShowUseResult.search(";") == -1 ? parseList : parseList[0];
              let moduleId = parseList && parseList[0] || 0;
              let partId = parseList && parseList[1] || 0;
              let subId = parseList && parseList[2] || 0;
              moduleUIManager.jumpToModule(parseInt(moduleId), parseInt(partId), parseInt(subId), itemID);
              return;
          }
    }

    private _resetEnemyList(cmd: any, msg: gamesvr.PvpPeakDuelTradeEnemyRes) {
        this._checkEnemyViewCanReq();
        this._showEnemeyList.forEach((ItemEnemy,index) => {
            ItemEnemy.resetEnemyItem(msg.EnemyInfoList[index],index);
        })
    }

    private _refreshAttackTimes() {
        //邀请函物品id
        let count = pvpData.getPeakDuekAttakTimes();
        this.attackTimes.string = count + "";
    }

    /** 检测是否可以更换对手*/
    private _checkEnemyViewCanReq() {
        if (!pvpData.peakDuelData?.LastTradeTime || pvpData.peakDuelData?.LastTradeTime==0) {
            this._setGrayState(true);
            this.sendChangeEnemyOpt();
            return;
        }

        let leftTime = this._getLeftTime();
        if (leftTime > 0) {
            this._setGrayState(false);
        } else {
            this._setGrayState(true);
            this._canChange = false;
            this.schedule(this._changeEnemyBtnState, 1);
        }
    }

    private _setGrayState(isGray: boolean) {
        this.changeEnemyBtn.interactable = !isGray;
        this.changeEnemyBtn.enableAutoGrayEffect = isGray;
    }

    private _getLeftTime(): number {
        let lastTime = utils.longToNumber(pvpData.peakDuelData.LastTradeTime);
        let time = new Date();
        let curTime = time.getTime() / 1000;
        let cd = Number(configUtils.getConfigModule("PVPTopBattleChangeCD"));
        return Math.floor(curTime - lastTime - cd);
    }

    /**换人按钮状态改变
     * 
    */
    private _changeEnemyBtnState() {
        let leftTime = this._getLeftTime();
        let label = this.changeEnemyBtn.getComponentInChildren(cc.Label);

        if (leftTime < 0) {
            this._setGrayState(true);
            if (label) label.string = `更换对手 ${Math.abs(leftTime).toString()}`;
        } else {
            if (label) label.string = "更换对手";
            this._setGrayState(false);
            this._canChange = true;
            this.unschedule(this._changeEnemyBtnState);
        }
        
    }

    sendChangeEnemyOpt() {
        if (!this._canChange) {
            guiManager.showTips("冷却cd中");
            return;
        }
        pvpDataOpt.reqPvpPeakDuelChangeEnemy();
    }
}

