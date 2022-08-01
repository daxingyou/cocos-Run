/*
 * @Description:
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-10-25 14:04:00
 * @LastEditors: lixu
 * @LastEditTime: 2021-11-03 17:45:28
 */
import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { battleEvent, commonEvent, lvMapViewEvent } from "../../../common/event/EventData";
import { ItemResultData } from "../../../app/BattleType";
import { gamesvr } from "../../../network/lib/protocol";
import { battleUIData } from "../../models/BattleUIData";
import { battleStatisticor } from "../view-battle/BattleStatisticor";

const {ccclass, property} = cc._decorator;

const HPNodeName = "hp";
const PowerNodeName = 'power';
const BuffListNodeName = 'buff';
const HaloListNodeName = 'halo';
const Msg_SpaceY : number = 10;


@ccclass
class BattleDebugView extends ViewBaseComponent {
    @property(cc.ScrollView) containor: cc.ScrollView = null;
    @property(cc.Node) dataItemTemplate: cc.Node = null;

    private _perRoleViewHeight: number = 0;
    private _selfTeamBg: cc.Node = null;
    private _enemyTeamBg: cc.Node = null;
    private _msgStartY: number = 0; //战斗日志消息开始位置

    onLoad(){
        this._selfTeamBg = cc.find('leftBG', this.node);
        this._selfTeamBg.getComponent(cc.Widget).updateAlignment();
        this._selfTeamBg.x = -(cc.winSize.width >> 1) - this._selfTeamBg.width;
        this._enemyTeamBg = cc.find('rightBG', this.node);
        this._enemyTeamBg.getComponent(cc.Widget).updateAlignment();
        this._enemyTeamBg.x = (cc.winSize.width >> 1) + (this._enemyTeamBg.width);
        this.containor.node.y = (cc.winSize.height >> 1) + (this.containor.node.height >> 1);
    }

    onInit(){
        this._perRoleViewHeight = cc.winSize.height / 5;
        this.clear();
        this._initEvents();
    }

    clear(){
        this.containor.content.destroyAllChildren();
        this._selfTeamBg.destroyAllChildren();
        this._enemyTeamBg.destroyAllChildren();
        this.containor.content.height = 0;
        this._msgStartY = 0;
    }

    deInit(){
        eventCenter.unregisterAll(this);
    }

    onRelease(){
        this.deInit();
    }

    private _createDataItem(){
        let node = cc.instantiate(this.dataItemTemplate);
        node.active = true;
        return node;
    }

    private _processBTStartMsg(event: number, msg: gamesvr.IBattleStartResult, msgSeq: number ){
        this.node.active = true;
        this._initRoleInfos();
        this._updateRoleInfos();
        cc.tween(this._selfTeamBg).to(0.5, {x: -(cc.winSize.width >> 1)}).start();
        cc.tween(this._enemyTeamBg).to(0.5, {x: (cc.winSize.width >> 1) - (this._enemyTeamBg.width)}).start();
        cc.tween(this.containor.node).to(0.5, {y: (cc.winSize.height >> 1) - (this.containor.node.height >> 1)}).start();
    }

    private _initRoleInfos(){
        let roleInfoKeys = [HPNodeName, PowerNodeName, BuffListNodeName, HaloListNodeName];
        let selfTeam = battleUIData.getSelfTeam();
        let createRoleInfos = (nodeName: string, posi: cc.Vec2, parentNode: cc.Node) => {
            let node = new cc.Node();
            node.setPosition(posi);
            node.name = nodeName;
            node.parent = parentNode;
            roleInfoKeys.forEach(key => {
                let itemNode = this._createDataItem();
                itemNode.x = 0;
                itemNode.y = -itemNode.height * node.childrenCount - (itemNode.height >> 1);
                itemNode.parent = node;
                itemNode.name = key;
            });
        }
        selfTeam.roles.forEach((ele, idx) => {
            createRoleInfos(`self_${ele.pos}`, cc.v2(0, (this._selfTeamBg.height >> 1) - this._perRoleViewHeight * ele.pos), this._selfTeamBg);
        });

        let enemyTeam = battleUIData.getOppositeTeam();
        enemyTeam.roles.forEach((ele, idx) => {
            createRoleInfos(`enemy_${ele.pos}`, cc.v2(0, (this._enemyTeamBg.height >> 1) - this._perRoleViewHeight * ele.pos), this._enemyTeamBg);
        });
    }

    private _updateRoleInfos(){
        let selfTeam = battleUIData.getSelfTeam();
        selfTeam.roles.forEach(ele => {
            let hpNode = cc.find(`self_${ele.pos}/${HPNodeName}`, this._selfTeamBg);
            hpNode.getComponent(cc.Label).string = `血量（最大）：${ele.hp}（${ele.maxHp}）`;

            let powerNode = cc.find(`self_${ele.pos}/${PowerNodeName}`, this._selfTeamBg);
            powerNode.getComponent(cc.Label).string = `体力（最大）：${ele.power}（${ele.maxPower}）`;

            let buffNode = cc.find(`self_${ele.pos}/${BuffListNodeName}`, this._selfTeamBg);
            buffNode.getComponent(cc.Label).string = this._getBuffDesc(ele.buffList);

            let haloNode = cc.find(`self_${ele.pos}/${HaloListNodeName}`, this._selfTeamBg);
            haloNode.getComponent(cc.Label).string = this._getHaloDesc(ele.haloList);
        });

        let enemyTeam = battleUIData.getOppositeTeam();
        enemyTeam.roles.forEach(ele => {
            let hpNode = cc.find(`enemy_${ele.pos}/${HPNodeName}`, this._enemyTeamBg);
            hpNode.getComponent(cc.Label).horizontalAlign = cc.Label.HorizontalAlign.RIGHT;
            hpNode.getComponent(cc.Label).string = `血量（最大）：${ele.hp}（${ele.maxHp}）`;

            let powerNode = cc.find(`enemy_${ele.pos}/${PowerNodeName}`, this._enemyTeamBg);
            powerNode.getComponent(cc.Label).string = `体力（最大）：${ele.power}（${ele.maxPower}）`;

            let buffNode = cc.find(`enemy_${ele.pos}/${BuffListNodeName}`, this._enemyTeamBg);
            buffNode.getComponent(cc.Label).string = this._getBuffDesc(ele.buffList);

            let haloNode = cc.find(`enemy_${ele.pos}/${HaloListNodeName}`, this._enemyTeamBg);
            haloNode.getComponent(cc.Label).string = this._getHaloDesc(ele.haloList);
        });
    }

    private _createRoundMsg(msg: string){
          let item  = this._createDataItem();
          item.getComponent(cc.Label).string = msg;
          //@ts-ignore
          item.getComponent(cc.Label)._forceUpdateRenderData();
          item.x = -(this.containor.content.width >> 1) + 5;
          this._msgStartY = item.y = this._msgStartY - (item.height >> 1);
          item.parent = this.containor.content;
          this._msgStartY =  this._msgStartY - (item.height >> 1);
          this.containor.content.height = Math.max(this.containor.node.height, Math.abs(this._msgStartY - Msg_SpaceY));
          this.containor.scrollToBottom();
    }

    private _updateRoundMsg(results: ItemResultData[]){
        if(!results || results.length == 0) return;
        this._msgStartY -= Msg_SpaceY;
        let reasonMap = new Map<number, number>();
        results.forEach((ele, idx) => {
            if(Array.isArray(ele.ItemResults) && ele.ItemResults.length > 0 && (ele.ItemResults[0].ResultType == gamesvr.ResultType.RTBuffLightResult
              || ele.ItemResults[0].ResultType == gamesvr.ResultType.RTHaloLightResult || ele.ItemResults[0].ResultType == gamesvr.ResultType.RTSkillLightResult)){
                  if(ele.ItemResults[0].ResultType == gamesvr.ResultType.RTSkillLightResult)
                      reasonMap.set(ele.ItemResults[0].SkillLightResult.SkillID, idx);

                  if(ele.ItemResults[0].ResultType == gamesvr.ResultType.RTBuffLightResult)
                      reasonMap.set(ele.ItemResults[0].BuffLightResult.BuffUID, idx);

                  if(ele.ItemResults[0].ResultType == gamesvr.ResultType.RTHaloLightResult)
                      reasonMap.set(ele.ItemResults[0].HaloLightResult.HaloUID, idx);
            }

            //释放技能
            if(ele.ItemResults[0].ResultType == gamesvr.ResultType.RTSkillLightResult){
                let roleInfo = battleUIData.getRoleByUid(ele.RoleUID);
                let isSelf = battleUIData.isRoleInSelfTeam(ele.RoleUID);
                let roleCfg: any = configUtils.getHeroBasicConfig(roleInfo.roleId);
                if(!roleCfg) roleCfg = configUtils.getMonsterConfig(roleInfo.roleId);
                let str = isSelf ? '【己方】': '【敌方】';
                str += (`【${roleCfg.HeroBasicName || roleCfg.Name}】`);
                let skillCfg = configUtils.getSkillConfig(ele.ItemResults[0].SkillLightResult.SkillID);
                str += (`释放技能【${skillCfg.Name}】`);
                this._createRoundMsg(str);
            }

            //buff生效
            if(ele.ItemResults[0].ResultType == gamesvr.ResultType.RTBuffLightResult){
                let roleInfo = battleUIData.getRoleByUid(ele.RoleUID);
                let isSelf = battleUIData.isRoleInSelfTeam(ele.RoleUID);
                let roleCfg: any = configUtils.getHeroBasicConfig(roleInfo.roleId);
                if(!roleCfg) roleCfg = configUtils.getMonsterConfig(roleInfo.roleId);
                let buffID = battleUIData.getRoleByBuffUid(ele.ItemResults[0].BuffLightResult.BuffUID).getBuff(ele.ItemResults[0].BuffLightResult.BuffUID).ID;
                let buffCfg = configUtils.getBuffConfig(buffID);
                let str = isSelf ? '【己方】': '【敌方】';
                str += (`【${roleCfg.HeroBasicName || roleCfg.Name}】`);
                str += (`Buff【${buffCfg.Name || buffID}】生效`);
                this._createRoundMsg(str);
            }

            //光环生效
            if(ele.ItemResults[0].ResultType == gamesvr.ResultType.RTHaloLightResult){
                let roleInfo = battleUIData.getRoleByUid(ele.RoleUID);
                let isSelf = battleUIData.isRoleInSelfTeam(ele.RoleUID);
                let roleCfg: any = configUtils.getHeroBasicConfig(roleInfo.roleId);
                if(!roleCfg) roleCfg = configUtils.getMonsterConfig(roleInfo.roleId);
                let haloID = battleUIData.getRoleByUid(ele.ItemResults[0].HaloLightResult.RoleUID).getHalo(ele.ItemResults[0].HaloLightResult.HaloUID).ID;
                let haloCfg = configUtils.getHaloConfig(haloID);
                let str = isSelf ? '【己方】': '【敌方】';
                str += (`【${roleCfg.HeroBasicName || roleCfg.Name}】`);
                str += (`光环【${haloCfg.Name || haloID}】生效`);
                this._createRoundMsg(str);
            }

            //血量变化
            if(ele.ItemResults[0].ResultType == gamesvr.ResultType.RTHPResult){
                ele.ItemResults.forEach(ele1 => {
                    let targetIsSelf = battleUIData.isRoleInSelfTeam(ele1.HPResult.RoleUID);
                    let targetRoleID = battleUIData.getRoleByUid(ele1.HPResult.RoleUID).roleId;
                    let roleCfg: any = configUtils.getHeroBasicConfig(targetRoleID);
                    if(!roleCfg) roleCfg = configUtils.getMonsterConfig(targetRoleID);
                    let str = targetIsSelf ? '【己方】': '【敌方】';
                    str += (`【${roleCfg.HeroBasicName || roleCfg.Name}】`);
                    str += `血量变化量: ${ele1.HPResult.Delta}, 当前血量：${ele1.HPResult.HP || 0}`;
                    this._createRoundMsg(str);
                });
            }

            //buff变化
            if(ele.ItemResults[0].ResultType == gamesvr.ResultType.RTBuffResult){
                ele.ItemResults.forEach(ele1 => {
                    let targetIsSelf = battleUIData.isRoleInSelfTeam(ele1.BuffResult.RoleUID);
                    let targetRoleID = battleUIData.getRoleByUid(ele1.BuffResult.RoleUID).roleId;
                    let roleCfg: any = configUtils.getHeroBasicConfig(targetRoleID);
                    if(!roleCfg) roleCfg = configUtils.getMonsterConfig(targetRoleID);
                    let buffCfg = configUtils.getBuffConfig(ele1.BuffResult.BuffID);
                    let str = targetIsSelf ? '【己方】': '【敌方】';
                    str += (`【${roleCfg.HeroBasicName || roleCfg.Name}】`);
                    str += `Buff【${buffCfg.Name}】变化量：${ele1.BuffResult.Delta}, 当前层数：${ele1.BuffResult.Count || 0}`;
                    this._createRoundMsg(str);
                });
            }

            //光环变化
            if(ele.ItemResults[0].ResultType == gamesvr.ResultType.RTHaloResult){
                ele.ItemResults.forEach(ele1 => {
                    let targetIsSelf = battleUIData.isRoleInSelfTeam(ele1.HaloResult.RoleUID);
                    let targetRoleID = battleUIData.getRoleByUid(ele1.BuffResult.RoleUID).roleId;
                    let roleCfg: any = configUtils.getHeroBasicConfig(targetRoleID);
                    if(!roleCfg) roleCfg = configUtils.getMonsterConfig(targetRoleID);
                    let haloCfg = configUtils.getHaloConfig(ele1.HaloResult.HaloID);
                    let str = targetIsSelf ? '【己方】': '【敌方】';
                    str += (`【${roleCfg.HeroBasicName || roleCfg.Name}】`);
                    str += `光环【${haloCfg.Name}】${ele1.HaloResult.isAdd ? '被添加' : '被移除'}`;
                    this._createRoundMsg(str);
                });
            }

            //能量变化
            if(ele.ItemResults[0].ResultType == gamesvr.ResultType.RTPowerResult){
                ele.ItemResults.forEach(ele1 => {
                  let targetIsSelf = battleUIData.isRoleInSelfTeam(ele1.PowerResult.RoleUID);
                  let targetRoleID = battleUIData.getRoleByUid(ele1.PowerResult.RoleUID).roleId;
                  let roleCfg: any = configUtils.getHeroBasicConfig(targetRoleID);
                  if(!roleCfg) roleCfg = configUtils.getMonsterConfig(targetRoleID);
                  let str = targetIsSelf ? '【己方】': '【敌方】';
                  str += (`【${roleCfg.HeroBasicName || roleCfg.Name}】`);
                  str += ` 能量变化量：${ele1.PowerResult.Delta}， 当前能量值：${ele1.PowerResult.Power || 0}`;
                  this._createRoundMsg(str);
                });
            }

            //死亡状态变化
            if(ele.ItemResults[0].ResultType == gamesvr.ResultType.RTRoleDeadResult){
                ele.ItemResults.forEach(ele1 => {
                  let targetIsSelf = battleUIData.isRoleInSelfTeam(ele1.RoleDeadResult.RoleUID);
                  let targetRoleID = battleUIData.getRoleByUid(ele1.RoleDeadResult.RoleUID).roleId;
                  let roleCfg: any = configUtils.getHeroBasicConfig(targetRoleID);
                  if(!roleCfg) roleCfg = configUtils.getMonsterConfig(targetRoleID);
                  let str = targetIsSelf ? '【己方】': '【敌方】';
                  str += (`【${roleCfg.HeroBasicName || roleCfg.Name}】`);
                  str += ` 阵亡， 当前状态：${ele1.RoleDeadResult.RoleState}`;
                  this._createRoundMsg(str);
                });
            }

            //团队buff变化
            if(ele.ItemResults[0].ResultType == gamesvr.ResultType.RTTeamBuffResult){

            }
        });
    }

    private _processBTEndMsg(event: number, msg: gamesvr.IBattleEndResult, msgSeq: number){
        this._updateRoleInfos();
    }

    private _processBTEffectEvent(event:number, results: ItemResultData[], msgSeq: number){
        if(battleStatisticor.isBattleMore) return;
        if(!results || results.length == 0) return;
        this._updateRoleInfos();
        this._updateRoundMsg(results);
    }

    private _initEvents(){
        eventCenter.register(commonEvent.RESTART_CURR_GAME, this, this._onRestartGame)
        eventCenter.register(battleEvent.BATTLE_START, this, this._processBTStartMsg);
        eventCenter.register(battleEvent.EFFECT_EVENT, this, this._processBTEffectEvent);
        eventCenter.register(battleEvent.BATTLE_END, this, this._processBTEndMsg);
    }

    private _onRestartGame(){
        this.clear();

    }

    private _getBuffDesc(buffList: gamesvr.IBuff[]){
        let str = '';
        buffList && buffList.forEach(ele => {
                        if(str.length != 0) str += ','
                        if(ele.Count > 0){
                            let buffCfg = configUtils.getBuffConfig(ele.ID);
                            str += (buffCfg.Name || ele.ID);
                            str += `(${ele.Count})`;
                        }
                    });
        str = 'Buff:' + str;
        return str;
    }

    private _getHaloDesc(haloList: gamesvr.IHalo[]){
      let str = '';
      haloList && haloList.forEach(ele => {
                      if(str.length != 0) str += ','
                      if(ele.ID > 0){
                          let haloCfg = configUtils.getHaloConfig(ele.ID);
                          str += (haloCfg.Name || ele.ID);
                      }
                  });
      str = '光环:' + str;
      return str;
  }
}

export {
    BattleDebugView
}
