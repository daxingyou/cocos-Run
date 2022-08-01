import { ResultType } from "../../app/AppEnums";
import { AsyncBattleBaseNotify, BattleEndNotify, BattleStartNotify, ChangeIdleStateNotify, csCmd, EffectResultNotify, RoundStartNotify, UpdateTimerNotify } from "../../game/CS";
import { eventCenter } from "../../common/event/EventCenter";
import { battleEvent } from "../../common/event/EventData";
import { logger } from "../../common/log/Logger";
import { gameControl } from "../../game/GameControl";
import { modelManager } from "../models/ModeManager";
import UITeam from "../template/UITeam";
import { ResultData, SkillLightResult, TeamData } from "../../game/CSInterface";
import { Effect, ItemResultData } from "../../game/BattleType";

interface BattleMsgInfo {
    cmd: string|number,
    data: any
}

export default class BattleUIOpt {
    private _msgQuene: BattleMsgInfo[] = [];
    private _currMsg: BattleMsgInfo = null;
    private _msgSeq: number = 0;

    init () {
    }

    deInit () {
        
    }

    registerBattle () {
        gameControl.enterBattleInit();
        modelManager.battleUIData.battleBegin();

        eventCenter.register(csCmd.ASYNC_BATTLE_BASE_NOTIFY, this, this._recvGameMsg);
        eventCenter.register(csCmd.BATTLE_START_NOTIFY, this, this._recvGameMsg);
        eventCenter.register(csCmd.UPDTAE_TIMER_NOTIFY, this, this._recvGameMsg);
        eventCenter.register(csCmd.ROUND_START_NOTIFY, this, this._recvGameMsg);
        eventCenter.register(csCmd.BATTLE_END_NOTIFY, this, this._recvGameMsg);
        eventCenter.register(csCmd.EFFECT_RESULT_NOTIFY, this, this._recvGameMsg);
    }

    unRegisterBattle () {
        this._msgQuene = [];
        this._currMsg = null;
        this._msgSeq = 0;
        eventCenter.unregisterAll(this);
    }

    sendGame (cmd: string, args?: any) {
        gameControl.processBattleMsg(cmd, args);
    }

    getMsgList () {
        return this._msgQuene;
    }

    getCurrSeq () {
        return this._msgSeq
    }

    private _recvGameMsg (cmd: string, args?: any) {
        switch(cmd) {
            // 马上处理不用等的
            case csCmd.UPDTAE_TIMER_NOTIFY:             { this._receieveUpdateTimer(args); break; }
            default: {
                this._msgQuene.push({cmd: cmd, data: {...args}});
                this._processNextMsg();
            }
        }
    }

    private _processNextMsg() {
        if (this._currMsg != null) return;
        if (this._msgQuene.length <= 0) return;

        this._currMsg = this._msgQuene.shift();
        this._processRecvMsg(this._currMsg);
    }

    private _processRecvMsg(msg: BattleMsgInfo) {
        this._msgSeq++;
        let cmd = msg.cmd;
        let args = msg.data;
        logger.log('BattleUIOpt', `------发出了事件---------, msg = ${msg.cmd}, msgSeq = ${this._msgSeq}, msg = `, msg.data);
        switch (cmd) {
            case csCmd.ASYNC_BATTLE_BASE_NOTIFY:        { this._asyncBattleBaseData(args); break; }
            case csCmd.BATTLE_START_NOTIFY:             { this._receieveBattleStartNotify(args); break; }
           
            case csCmd.ROUND_START_NOTIFY:              { this._receieveRoundStart(args); break; }
            case csCmd.CHANGE_IDLE_STATE_NOTIFY:        { this._receieveChangeIdle(args); break; }
            case csCmd.BATTLE_END_NOTIFY:               { this._receieveBattleEnd(args); break; }
            case csCmd.EFFECT_RESULT_NOTIFY:            { this._processEffectNotify(args); break; }
            default: {break;}
        }
    }

    finishCurrMsg (msgSeq: number) {
        if (msgSeq == null || msgSeq < this._msgSeq) return;

        logger.log('BattleOpt', `------回收了事件---------, msgSeq =  ${this._msgSeq}`);

        // 这里来清掉死亡角色的数据
        // this._processDieRoleData(this._currMsg);

        this._currMsg = null;
        this._processNextMsg();
    }

    // private _recvGameMsg (cmd: string, resultData: any) {
    //     if (cmd == csCmd.USE_CARD_RES) {
    //         this._processUseCardRes(resultData.Msg, resultData.Result, resultData.Desc);
    //     } else if (cmd == csCmd.USE_KIT_RES) {
    //         this._processUseKitRes(resultData.Msg, resultData.Result);
    //     }

    //     this._msgQuene.push({cmd: cmd, data: {...resultData}});
    //     this._processNextMsg();
    // }

    private _asyncBattleBaseData (msg: AsyncBattleBaseNotify) {
        let teamData = msg.teamData;
        modelManager.battleUIData.battleBegin();
        teamData.forEach (_t => {
            this._addOneTeam(_t);
        })

        this.finishCurrMsg(this._msgSeq);
    }

    private _addOneTeam (v: TeamData) {
        let teams: UITeam[] = [];
        let team = new UITeam();
        team.updateTeamData(v);

        modelManager.battleUIData.addOneTeam(team); 
    }

    private _receieveBattleStartNotify (args?: BattleStartNotify) {
        eventCenter.fire(battleEvent.BATTLE_START, args);
        this.finishCurrMsg(this._msgSeq);
    }

    private _receieveUpdateTimer (args?: UpdateTimerNotify) {
        eventCenter.fire(battleEvent.VIEW_UPDTAE_TIMER, args);
    }

    private _receieveRoundStart (args?: RoundStartNotify) {
        eventCenter.fire(battleEvent.ROUND_START, args);
        this.finishCurrMsg(this._msgSeq);
    }

    private _receieveChangeIdle (args?: ChangeIdleStateNotify) {
        eventCenter.fire(battleEvent.CHANGE_IDLE, args);
        this.finishCurrMsg(this._msgSeq);
    }

    private _receieveBattleEnd (args?: BattleEndNotify) {
        eventCenter.fire(battleEvent.BATTLE_END, args);
        this.finishCurrMsg(this._msgSeq);
    }
    

    private _processEffectNotify (args?: EffectResultNotify) {
        if (args && args.Results && args.Results.length) {
            let effResultt: ResultData[] = args.Results || [];
            let results = this._receievEffectResult(effResultt);
            eventCenter.fire(battleEvent.EFFECT_EVENT, results, this._msgSeq)
        } else {
            this.finishCurrMsg(this._msgSeq);
        }
    }

    private _receievEffectResult (resultsRes: ResultData[] ) {
        let resultDatas: ResultData[] = resultsRes || [];

        if (resultDatas == null || resultDatas.length == 0) {
            return null;
        }

        let skillLight: SkillLightResult = null;

        let findResults = (results: ResultData[], curr: ResultData) => {
            let find = false;
            if (results && results[0] && results[0].FromUID 
                && results[0].FromUID == curr.FromUID && results[0].Seq == curr.Seq) {
                find = true;
            }
            return find;
        }

        // 先将resultData分类：同一帧播放的效果放在一个数组中
        // 如果碰到RTCardLightResult，表示这张卡效果结束
        // 二维数组：x表示多组效果；y表示同一组包含多个效果，这一组在同一帧播放
        let results: ResultData[][] = [];
        let tempResults: ResultData[][] = [];
        resultDatas.forEach(resultData => {
            let currItem = tempResults[tempResults.length - 1];
            // 当前卡牌的效果已经结束，清空temp，下一个效果在下一组中
            if (resultData.ResultType == ResultType.RTSkillLight) {
                skillLight = resultData.SkillLightResult;
                results = results.concat(tempResults);
                tempResults = [[resultData]];

            // 同一个effect的多个result，需要放在一个组内
            } else if (findResults(currItem, resultData)) {
                currItem.push(resultData);           
            } else {
                tempResults.push([resultData]);
            }

            if (resultData.AttackResult && skillLight && skillLight.SkillId == resultData.ItemId) {
                // 这里如果出现多个目标，就是远程
                if (!skillLight.UiTarget) {
                    skillLight.UiTarget = resultData.AttackResult.TargetUid;
                } else {
                    console.log("目标配置错了")
                }

            }
        });
        results = results.concat(tempResults);
        tempResults = [];

        // 将划分好的数组放到指定结构中
        let itemResults: ItemResultData[] = [];
        results.forEach(itemData => {
            if (itemData && itemData.length > 0) {
                let roleUID = itemData[0].FromUID;
                let itemUID = itemData[0].ItemId;
   
                let cardRole = modelManager.battleUIData.getRoleByUid(roleUID);
                if (cardRole) roleUID = cardRole.uid;
                
                itemResults.push({
                    RoleUID: roleUID,
                    ItemUID: itemUID, 
                    ItemResults: itemData
                });
            } else {
                logger.warn('BattleOpt', `itemData is invalid. itemData = ${itemData}`);
            }
        });

        // 同步数据
        resultDatas.forEach(resultData => {
            modelManager.battleUIData.updateResultData(resultData);
        });

        return itemResults;
    }
    
}
