/*
 * @Description:
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-10-22 11:02:08
 * @LastEditors: lixu
 * @LastEditTime: 2021-10-29 16:59:13
 */
import { SCENE_NAME } from "../../../app/AppConst";
import { HEAD_ICON } from "../../../app/AppEnums";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { battleStatisticEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import moduleUIManager from "../../../common/ModuleUIManager";
import { BTStatisticItem } from "../../template/BTStatistic";
import { battleStatisticor, RoleStatistic } from "../view-battle/BattleStatisticor";
import BattleScene from "../view-scene/BattleScene";
import {BattleStatisticDataItem, BattleStatisticDataInfo } from "./BattleStatisticDataItem";
import { BattleStatisticDataType, BattleStatisticDetailDataItem } from "./BattleStatisticDetailDataItem";
import { BattleStatisticHead } from "./BattleStatisticHead";

const {ccclass, property} = cc._decorator;

enum BattleArrayMode {
    Default = 0,
    SelfRandom,
    EnemyRandom,
    AllRandom
}

enum BattleMoreSettingPanelState {
    Closed = 0,
    Opening,
    Opened,
    Closing
}

enum StatisticViewType{
    Basic = 0,
    Detail,
}

const PanelMoveSpeed = 2000;
const baseDataItemSpace = 10;
const BaseDataViewPadding = 20;
const SwitchViewTimeSpace = 1.5;
const HeadNodeName = 'HeadNode';
const BasicDataNodeName = 'BasicDataNode';
const DatailDataNodeName = 'DetailDateNode';
const BattleMoreCount = 10000;

@ccclass
export default class BattleStatisticView extends ViewBaseComponent {
  @property(cc.Node) headNodeTemplate: cc.Node = null;
  @property(cc.Node) baseDataNodeTemplate: cc.Node = null;
  @property(cc.Node) battleDetailDataTemplate: cc.Node = null;
  @property(cc.Node) battleMoreSettingPanel: cc.Node = null;

  @property(cc.Node) topNode: cc.Node = null;
  @property(cc.ScrollView) containor: cc.ScrollView = null;
  @property(cc.ScrollView) detailContainor: cc.ScrollView = null;
  @property(cc.Label) roundCountLb: cc.Label = null;
  @property(cc.EditBox) roundCountEditer: cc.EditBox = null;

  private _battleRunningTip: cc.Label = null;
  private _customRoundCount: number = BattleMoreCount;

  private _currBattleArrayMode: BattleArrayMode = BattleArrayMode.Default;
  private _settingPanelNormalPosx: number = 0;
  private _currBattleMoreSettingPanelState: BattleMoreSettingPanelState = BattleMoreSettingPanelState.Closed;

  private _currViewType: StatisticViewType = StatisticViewType.Basic;
  private _isSwitchView: boolean = true;

  private _selfData:Map<number, RoleStatistic> = null;
  private _enemyData:Map<number, RoleStatistic> = null;

  onInit(selfSts: Map<number, RoleStatistic>, enemySts:Map<number, RoleStatistic>, roundCount: number, roundResult: number[]){
      battleStatisticor.setBattleStatisticView(this);
      this.customRoundCount = BattleMoreCount;
      this._settingPanelNormalPosx = (cc.winSize.width >> 1) + (this.battleMoreSettingPanel.width >> 1);
      let toggleContainor = cc.find('battleArrayModes', this.battleMoreSettingPanel).getComponent(cc.ToggleContainer);
      toggleContainor.toggleItems[this._currBattleArrayMode].isChecked = true;
      this.battleMoreSettingPanel.x = this._settingPanelNormalPosx;
      this._selfData = selfSts;
      this._enemyData = enemySts;
      this.containor.content.getComponent(cc.Widget).updateAlignment();
      this.detailContainor.content.getComponent(cc.Widget).updateAlignment();
      this.updateBattleRoundCount(roundCount);
      roundResult = roundResult || [0, 0];
      this.updateBattleResult(roundResult[0], roundResult[1]);
      this._switchView();
  }

  set customRoundCount(roundCount: number){
      if(roundCount <= 0 || roundCount > BattleMoreCount){
          this._customRoundCount = BattleMoreCount;
      }else{
          this._customRoundCount = roundCount;
      }
      this.roundCountLb.string = `战${this._customRoundCount}次`;
  }

  onRoundCountChange(){
      let str = this.roundCountEditer.string;
      let count = parseInt(str);
      if(count) {
        this.customRoundCount = count;
      }
  }

  setDataSource(selfSts: Map<number, RoleStatistic>, enemySts:Map<number, RoleStatistic>, roundCount: number, roundResult: number[]){
      this.clear();
      this._hideBattleRuningTip();
      this._selfData = selfSts;
      this._enemyData = enemySts;
      roundResult = roundResult || [0, 0];
      this.updateBattleRoundCount(roundCount);
      this.updateBattleResult(roundResult[0], roundResult[1]);
      this._switchView();
  }

  clear(){
      this.containor.content.children.forEach(ele => {
          if(ele.name == HeadNodeName){
              ele.getComponent(BattleStatisticHead).onRelease();
          }

          if(BasicDataNodeName == ele.name){
              ele.children.forEach(ele1 => {
                  ele1.getComponent(BattleStatisticDataItem).onRelease();
              })
          }
      });
      this.containor.content.removeAllChildren();

      this.detailContainor.content.children.forEach(ele => {
          if(ele.name == HeadNodeName){
              ele.getComponent(BattleStatisticHead).onRelease();
          }

          if(DatailDataNodeName == ele.name){
            ele.getComponent(BattleStatisticDetailDataItem).onRelease();
          }
      });

      this.detailContainor.content.removeAllChildren();
  }

  deInit(){
      this.clear();
      this._selfData = null;
      this._enemyData = null;
  }

  onRelease(){
      this.deInit();
      battleStatisticor.setBattleStatisticView(null);
  }

  //导出Excel
  onClickExportExcel(){
      if(battleStatisticor.isBattleMore) return;
      this._closeBattleMoreSettingPanel();
  }

  //关闭
  onClose(){
      if(battleStatisticor.isBattleMore) return;
      battleStatisticor.clear();
      this.closeView();
      guiManager.loadScene(SCENE_NAME.MAIN).then(()=>{
          moduleUIManager.showModuleView();
      });
  }

  //概况和详情切换
  onClickSwitchView(){
      this._closeBattleMoreSettingPanel();
      if(this._isSwitchView){
          guiManager.showTips('操作慢点啊, 跟不上你的节奏！！！');
          return;
      }
      this._isSwitchView = true;
      this._currViewType = (this._currViewType + 1) % 2;
      this._switchView();
  }

  private _switchView(){
      cc.find('viewSwitchBtn/New Label', this.node).getComponent(cc.Label).string = this._currViewType == StatisticViewType.Basic ? '详情' : '概况';
      this.containor.node.active = this._currViewType == StatisticViewType.Basic;
      this.detailContainor.node.active = !(this._currViewType == StatisticViewType.Basic);
      if(this._currViewType == StatisticViewType.Basic){
            this.updateMainView(this._selfData, this._enemyData);
      }else{
          this.updateDetailView(this._selfData, this._enemyData);
      }
      this.scheduleOnce(() => {
        this._isSwitchView = false;
    }, SwitchViewTimeSpace);
  }

  //战1000次
  onClickBattleMore(){
      if(!(guiManager.getCurrScene() instanceof BattleScene)) return;
      if(battleStatisticor.isBattleMore) return;
      this._closeBattleMoreSettingPanel();
      battleStatisticor.clear();
      battleStatisticor.setMaxRoundCount(this._customRoundCount);
      battleStatisticor.battleMore = true;
      this._showBattleRuningTip();
      this.startBattle();
  }

  startBattle(){
      const MaxCount = 5;
      let i = 0;
      let battleScene: BattleScene = guiManager.getCurrScene() as BattleScene;
      let currSele = battleScene.prepareView.currSele;
      for(; i < MaxCount; i++){
          currSele[i] = currSele[i] || 0;
      }
      if(this._currBattleArrayMode == BattleArrayMode.SelfRandom){
            i = MaxCount - 1;
            let targetItem : number;
            for(; i > 0; i--){
                let idx = Math.floor(Math.random() * i);
                targetItem = currSele[idx];
                currSele[idx] = currSele[i];
                currSele[i] = targetItem;
            }
      }
      eventCenter.fire(battleStatisticEvent.START_BATTLE_NO_VIEW)
  }

  //阵容展位设置
  onClickBattleMoreSetting(){
    if(this._currBattleMoreSettingPanelState == BattleMoreSettingPanelState.Opened || this._currBattleMoreSettingPanelState == BattleMoreSettingPanelState.Opening){
      this._closeBattleMoreSettingPanel();
    }else{
        this._openBattleMoreSettingPanel();
    }
  }

  onToggleBattleArray(toggleItem: cc.Toggle){
      if(battleStatisticor.isBattleMore) return;
      let toggleContainor = cc.find('battleArrayModes', this.battleMoreSettingPanel).getComponent(cc.ToggleContainer);
      this._currBattleArrayMode = toggleContainor.toggleItems.indexOf(toggleItem);
      this.updateBattleMode();
  }

  updateBattleMode(){
      let modeDesc = '默认战位';
      if(this._currBattleArrayMode == BattleArrayMode.SelfRandom){
        modeDesc = '己方随机阵容';
      }else if(this._currBattleArrayMode == BattleArrayMode.EnemyRandom){
        modeDesc = '敌方随机整容';
      }else if(this._currBattleArrayMode == BattleArrayMode.AllRandom){
        modeDesc = '双方随机阵容';
      }
      cc.find('battleMode', this.topNode).getComponent(cc.Label).string = `战斗模式：${modeDesc}`;
  }

  updateBattleRoundCount(count: number){
      cc.find('roundCount', this.topNode).getComponent(cc.Label).string = `战斗次数：${count || 0}`;
  }

  updateBattleResult(selfWinCount: number, enemyWinCount: number){
      cc.find('resultRatio', this.topNode).getComponent(cc.Label).string = `己方胜利/敌方胜利：${selfWinCount}/${enemyWinCount}`;
  }

  private _closeBattleMoreSettingPanel(){
    if(this._currBattleMoreSettingPanelState == BattleMoreSettingPanelState.Closing || this._currBattleMoreSettingPanelState == BattleMoreSettingPanelState.Closed) return;
      cc.Tween.stopAllByTarget(this.battleMoreSettingPanel);
      let time = (this._settingPanelNormalPosx - this.battleMoreSettingPanel.x) / PanelMoveSpeed;
      this._currBattleMoreSettingPanelState = BattleMoreSettingPanelState.Closing;
      cc.tween(this.battleMoreSettingPanel).to(time, {x: this._settingPanelNormalPosx}).call(() => {
          this._currBattleMoreSettingPanelState = BattleMoreSettingPanelState.Closed;
      }, this).start();
  }

  private _openBattleMoreSettingPanel(){
    if(this._currBattleMoreSettingPanelState == BattleMoreSettingPanelState.Opening || this._currBattleMoreSettingPanelState == BattleMoreSettingPanelState.Opened) return;
    cc.Tween.stopAllByTarget(this.battleMoreSettingPanel);
    let targetPosx = (cc.winSize.width >> 1) - (this.battleMoreSettingPanel.width >> 1);
    let time = (this.battleMoreSettingPanel.x -targetPosx) / PanelMoveSpeed;
    this._currBattleMoreSettingPanelState = BattleMoreSettingPanelState.Opening;
    cc.tween(this.battleMoreSettingPanel).to(time, {x: targetPosx}).call(()=> {
        this._currBattleMoreSettingPanelState = BattleMoreSettingPanelState.Opened;
    }, this).start();
  }

  updateDetailView(selfData: Map<number, RoleStatistic>, enemyData: Map<number, RoleStatistic>){
      this._closeBattleMoreSettingPanel();
      if(this.detailContainor.content.childrenCount != 0) return;
      if(!selfData && !enemyData) return;

      let selfArr = Array.from(selfData);
      let enemyArr = Array.from(enemyData);
      let maxCount = Math.max(selfArr.length, enemyArr.length, 0);

      let roundCount: number = 0;
      let idx = 0;
      let currPosY = 0;
      let nextPosY = 0;
      for(; idx < maxCount; idx++){
          if(idx < selfArr.length){
              let data = selfArr[idx][1];
              let roleID = data.roleID;
              roundCount = roundCount || data.surplusHp.length;
              let headItem = this._createHeadItem(roleID, data.surplusHp);
              headItem.node.x = -((this.detailContainor.content.width >> 1) - (headItem.node.width >> 1) - 20);
              headItem.node.y = (currPosY - BaseDataViewPadding - (headItem.node.height >> 1));
              this.detailContainor.content.addChild(headItem.node);
              nextPosY = Math.min(nextPosY, headItem.node.y - (headItem.node.height >> 1));

              let comp = this._createDetailDataItem(data.hurtSts, roleID, BattleStatisticDataType.Hurt, false, roundCount);
              let nextStart = headItem.node.y + (headItem.node.height >> 1) - 5;
              if(cc.isValid(comp)){
                  comp.node.x = headItem.node.x + (headItem.node.width >> 1) + 20;
                  comp.node.y = nextStart - (comp.node.height >> 1);
                  nextStart = comp.node.y - (comp.node.height >> 1);
                  this.detailContainor.content.addChild(comp.node);
                  nextPosY = Math.min(nextPosY, nextStart);
              }

              let comp1 = this._createDetailDataItem(data.addedBloodSts, roleID, BattleStatisticDataType.AddBlood, false, roundCount);
              if(cc.isValid(comp1)){
                  comp1.node.x = headItem.node.x + (headItem.node.width >> 1) + 20;
                  comp1.node.y = nextStart - (comp1.node.height >> 1) - 5;
                  nextStart = comp1.node.y - (comp1.node.height >> 1);
                  this.detailContainor.content.addChild(comp1.node);
                  nextPosY = Math.min(nextPosY, nextStart);
              }
          }

          if(idx < enemyArr.length){
              let data = enemyArr[idx][1];
              let roleID = data.roleID;
              let headItem = this._createHeadItem(roleID, data.surplusHp);
              headItem.node.x = ((this.detailContainor.content.width >> 1) - (headItem.node.width >> 1) - 20);
              headItem.node.y = (currPosY - BaseDataViewPadding - (headItem.node.height >> 1));
              this.detailContainor.content.addChild(headItem.node);
              nextPosY = Math.min(nextPosY, headItem.node.y - (headItem.node.height >> 1));

              let comp = this._createDetailDataItem(data.hurtSts, roleID, BattleStatisticDataType.Hurt, true, roundCount);
              let nextStart = headItem.node.y + (headItem.node.height >> 1) - 5;
              if(cc.isValid(comp)){
                  comp.node.x = headItem.node.x - (headItem.node.width >> 1) - 20;
                  comp.node.y = nextStart - (comp.node.height >> 1);
                  nextStart = comp.node.y - (comp.node.height >> 1);
                  this.detailContainor.content.addChild(comp.node);
                  nextPosY = Math.min(nextPosY, nextStart);
              }

              let comp1 = this._createDetailDataItem(data.addBloodSts, roleID, BattleStatisticDataType.AddBlood, true, roundCount);
              if(cc.isValid(comp1)){
                  comp1.node.x = headItem.node.x - (headItem.node.width >> 1) - 20;
                  comp1.node.y = nextStart - (comp1.node.height >> 1) - 5;
                  nextStart = comp1.node.y - (comp1.node.height >> 1);
                  this.detailContainor.content.addChild(comp1.node);
                  nextPosY = Math.min(nextPosY, nextStart);
              }
          }
          currPosY = nextPosY;
      }
      this.detailContainor.content.height = Math.abs(currPosY) + BaseDataViewPadding;
  }

  updateMainView(selfData: Map<number, RoleStatistic>, enemyData: Map<number, RoleStatistic>){
      this._closeBattleMoreSettingPanel();
      if(!selfData && !enemyData) return;
      if(this.containor.content.childrenCount != 0) return;
      let maxHurtValue = 0, maxAttacked = 0, maxAddBlood = 0, maxAddedBlood = 0, maxKill = 0;
      let selfHeadMap = new Map<number, BattleStatisticHead>();
      let enemyHeadMap = new Map<number, BattleStatisticHead>();
      let selfIdx = -1, enemyIdx = -1;

      let roundCount: number = null;;
      let maxItemCount = Math.max(selfData.size, enemyData.size, 0);
      this.containor.content.height = maxItemCount * this.headNodeTemplate.height + (maxItemCount - 1) * baseDataItemSpace + BaseDataViewPadding * 2;
      selfData && selfData.forEach((value, key) => {
                      selfIdx += 1;
                      roundCount = roundCount || value.surplusHp.length;
                      maxHurtValue = Math.max(value.hurtSts ? Math.abs(value.hurtSts.count) : 0, maxHurtValue);
                      maxAttacked = Math.max(value.attackedSts ? Math.abs(value.attackedSts.count) : 0, maxAttacked);
                      maxAddBlood = Math.max(value.addBloodSts ? Math.abs(value.addBloodSts.count) : 0, maxAddBlood);
                      maxAddedBlood = Math.max(value.addedBloodSts ? Math.abs(value.addedBloodSts.count) : 0, maxAddedBlood);
                      maxKill = Math.max(value.killSts ? Math.abs(value.killSts.count) : 0, maxKill);
                      let headItem = this._createHeadItem(key, value.surplusHp);
                      headItem.node.x = -((this.containor.content.width >> 1) - (headItem.node.width >> 1) - 20);
                      headItem.node.y = - ((headItem.node.height >> 1) * ((selfIdx << 1) + 1) + baseDataItemSpace * selfIdx + BaseDataViewPadding);
                      this.containor.content.addChild(headItem.node);
                      selfHeadMap.set(key, headItem);
                  }, this);

      enemyData && enemyData.forEach((value, key) => {
                      enemyIdx += 1;
                      maxHurtValue = Math.max(value.hurtSts ? Math.abs(value.hurtSts.count) : 0, maxHurtValue);
                      maxAttacked = Math.max(value.attackedSts ? Math.abs(value.attackedSts.count) : 0, maxAttacked);
                      maxAddBlood = Math.max(value.addBloodSts ? Math.abs(value.addBloodSts.count) : 0, maxAddBlood);
                      maxAddedBlood = Math.max(value.addedBloodSts ? Math.abs(value.addedBloodSts.count) : 0, maxAddedBlood);
                      maxKill = Math.max(value.killSts ? Math.abs(value.killSts.count) : 0, maxKill);
                      let headItem = this._createHeadItem(key, value.surplusHp);
                      headItem.node.x = ((this.containor.content.width >> 1) - (headItem.node.width >> 1) - 20);
                      headItem.node.y = - ((headItem.node.height >> 1) * ((enemyIdx << 1) + 1) + + baseDataItemSpace * enemyIdx + BaseDataViewPadding);
                      this.containor.content.addChild(headItem.node);
                      enemyHeadMap.set(key, headItem);
                  }, this);

      let maxDatas = {
          maxHurtValue: maxHurtValue / roundCount,
          maxAttacked: maxAttacked / roundCount,
          maxAddBlood: maxAddBlood / roundCount,
          maxAddedBlood: maxAddedBlood / roundCount,
          maxKill: maxKill / roundCount,
      }

      selfIdx = -1;
      enemyIdx = -1;
      selfData && selfData.forEach((value, key) => {
                      selfIdx += 1;
                      let node = this._createBaseDataItem(value, false, maxDatas);
                      node.x = selfHeadMap.get(key).node.x + (selfHeadMap.get(key).node.width >> 1) + 20;
                      node.y = selfHeadMap.get(key).node.y + (selfHeadMap.get(key).node.height >> 1) - 5;
                      this.containor.content.addChild(node);
                  }, this);

      enemyData && enemyData.forEach((value, key) => {
                      enemyIdx += 1;
                      let node = this._createBaseDataItem(value, true, maxDatas);
                      node.x = enemyHeadMap.get(key).node.x - (enemyHeadMap.get(key).node.width >> 1) - 20;
                      node.y = enemyHeadMap.get(key).node.y + (enemyHeadMap.get(key).node.height >> 1) - 5;
                      this.containor.content.addChild(node);
                  }, this);
  }

  private _createHeadItem(roleID: number, spurplusHps: number[], isEnemy: boolean = false){
      let node = cc.instantiate(this.headNodeTemplate);
      let headComp = node.getComponent(BattleStatisticHead);
      let roleInfo: any = configUtils.getHeroBasicConfig(roleID);
      if(!roleInfo)  roleInfo = configUtils.getMonsterConfig(roleID);

      let totalFinalHP: number = 0;
      let liveRoundCount: number = 0;
      let deadRondCount: number = 0;
      spurplusHps && spurplusHps.forEach(ele => {
          if(ele > 0){
              totalFinalHP += ele;
              liveRoundCount ++;
          }else{
              deadRondCount ++;
          }
      });
      let hpDesc: string = null;
      if(spurplusHps.length == 1){
          hpDesc = totalFinalHP > 0 ? totalFinalHP.toString() : '死亡';
      }else{
          hpDesc = '';
          if(totalFinalHP > 0){
            hpDesc += (`存活:${Math.floor((totalFinalHP / liveRoundCount))}(${liveRoundCount}局)`);
          }

          if(deadRondCount > 0) {
            if(hpDesc.length > 0) hpDesc += '\n';
            hpDesc += (`死亡(${deadRondCount}局)`);
          }
      }
      headComp.showRoleInfo({headUrl: resPathUtils.getHeroCircleHeadIcon(roleInfo.HeroBasicModel || roleInfo.ModelId, HEAD_ICON.SQUARE), name: roleInfo.HeroBasicName || roleInfo.Name, hpDesc: hpDesc});
      node.name = HeadNodeName;
      return headComp;
  }

  private _createBaseDataItem(value: RoleStatistic, isEnemy: boolean, maxDatas: any){
      let node = new cc.Node(BasicDataNodeName);
      let roundCount = value.surplusHp.length;
      let hurtValue = (value.hurtSts ? value.hurtSts.count : 0) / roundCount;
      let attackedValue = (value.attackedSts ? value.attackedSts.count : 0) / roundCount;
      let addBloodValue = (value.addBloodSts ? value.addBloodSts.count : 0) / roundCount;
      let addedBloodValue = (value.addedBloodSts ? value.addedBloodSts.count : 0) / roundCount;
      let killValue = (value.killSts ? value.killSts.count : 0) / roundCount;
      this._createBaseDataSubItem(node, {dataName: '输出', dataValue: hurtValue, dataMaxValue: maxDatas.maxHurtValue}, isEnemy);
      this._createBaseDataSubItem(node, {dataName: '承伤', dataValue: attackedValue, dataMaxValue: maxDatas.maxAttacked}, isEnemy);
      this._createBaseDataSubItem(node, {dataName: '治疗', dataValue: addBloodValue, dataMaxValue: maxDatas.maxAddBlood}, isEnemy);
      this._createBaseDataSubItem(node, {dataName: '受疗', dataValue: addedBloodValue, dataMaxValue: maxDatas.maxAddedBlood}, isEnemy);
      this._createBaseDataSubItem(node, {dataName: '击杀', dataValue: killValue, dataMaxValue: maxDatas.maxKill}, isEnemy);
      return node;
  }

  private _createBaseDataSubItem(parentNode: cc.Node, value: BattleStatisticDataInfo, isEnemy: boolean){
      let node = cc.instantiate(this.baseDataNodeTemplate);
      let dataComp = node.getComponent(BattleStatisticDataItem);
      dataComp.show(value, isEnemy);
      let idx = parentNode.childrenCount;
      node.y = -node.height * idx - (node.height >> 1);
      parentNode.addChild(node);
      return dataComp;
  }

  private _createDetailDataItem(data: BTStatisticItem, roleID: number, statisticType: BattleStatisticDataType, isEnemy: boolean, roundCount: number){
      let node = cc.instantiate(this.battleDetailDataTemplate);
      let comp = node.getComponent(BattleStatisticDetailDataItem);
      comp.showDetail(data, roleID, statisticType, isEnemy, roundCount);
      node.name = DatailDataNodeName;
      return comp;
  }

  private _showBattleRuningTip(){
      if(!cc.isValid(this._battleRunningTip)){
          let node = new cc.Node();
          node.x = 0;
          node.y = (cc.winSize.height >> 1) - 200;
          node.parent = this.node;
          this._battleRunningTip = node.addComponent(cc.Label);
          this._battleRunningTip.string = '正在打扫战场，喝杯茶休息下o(*￣▽￣*)ブ';
      }

      cc.Tween.stopAllByTarget(this._battleRunningTip.node);
      this._battleRunningTip.node.scale = 1;
      this._battleRunningTip.node.active = true;
      let action = cc.tween().to(0.5, {scale: 1.1}).to(0.5, {scale: 1});
      cc.tween(this._battleRunningTip.node).repeatForever(action).start();
  }

  private _hideBattleRuningTip(){
      if(cc.isValid(this._battleRunningTip)){
          cc.Tween.stopAllByTarget(this._battleRunningTip.node);
          this._battleRunningTip.node.active = false;
      }
  }
}
