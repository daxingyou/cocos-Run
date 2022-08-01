import { configUtils } from "../../app/ConfigUtils";
import { logger } from "../../common/log/Logger";
import { data, gamesvr } from "../../network/lib/protocol";
import BaseModel from "./BaseModel";

export interface Divine_Task_Data {
    id: number,
    startTime?: number,
    needHeroInfo: {
        quality: number[],
        star: number[],
        trigram: number[],
        equipType: number[],
        ability: number[]
    },
    dispatch?: number[],
    isRewarded?: boolean
}

class DivineData extends BaseModel {
    private _divineTasks: {[k: string]: data.IDivineExpeditionTask} = {};
    private _divineInfo: data.IDivineExpeditionData = null;
    init() {
    }

    deInit() {
        this._divineTasks = {}
        this._divineInfo = null;
    }

    get tasksList() {
        return this._divineTasks;
    }

    get divineLv() {
        return this._divineInfo.Level;
    }

    get divineInfo() {
        return this._divineInfo;
    }

    updateDivineInfo(divineInfo: data.IDivineData) {
        this._divineInfo = divineInfo.DivineExpeditionData;
        this._divineTasks = this._divineInfo.DivineExpeditionTaskMap;
    }

    updateTasksList(msg: {[k: string]: data.IDivineExpeditionTask}) {
        this._addTasks(msg);
    }

    receiveReward(receiveRewardRes: gamesvr.DivineExpeditionReceiveRewardRes) {
        let seqList = receiveRewardRes.ReceiveSeqList;
        this._clearTasks(seqList);
        this._divineInfo.Level = receiveRewardRes.Level;
        this._divineInfo.LevelFinishTaskCount = receiveRewardRes.LevelFinishTaskCount;
    }

    addTasks(msg: gamesvr.DivineExpeditionResetTaskRes) {
        let clearList = msg.ClearSeqList
        this._clearTasks(clearList);
        let tasks = msg.DivineExpeditionTaskMap;
        this._addTasks(tasks);
    }

    cancelTasks(taskId: number) {
        if(this._divineTasks[taskId]) {
            this._divineTasks[taskId].ExecuteTime = 0;
            this._divineTasks[taskId].IsExecute = false;
            this._divineTasks[taskId].HeroIDList = [];
        }
    }

    getTaskById(id: number) {
        return this._divineTasks[id];
    }

    getCompletedTaskCount() {
        return this._divineInfo.LevelFinishTaskCount || 0;
    }

    private _addCompleteTaskCount(ids: number[]) {
        for(let i = 0; i < ids.length; ++i) {
            if(this._checkAddCompleteCountSatisfy(ids[i])) {
                this._divineInfo.LevelFinishTaskCount++;
            }
        }
    }

    private _addTasks(map: {[k: string]: data.IDivineExpeditionTask}) {
        for(const k in map) {
            if(this._divineTasks[k]) {
                logger.warn('addTasks 有id相同的 请确认是否是正确操作 msg: ', map, 'k: ', k);
            }
            this._divineTasks[k] = map[k];
        }
    }

    private _clearTasks(clearList: number[]) {
        for(let i = 0; i < clearList.length; ++i) {
            let task = this._divineTasks[clearList[i]];
            if(task) {
                delete this._divineTasks[clearList[i]];
            }
        }
    }

    private _checkAddCompleteCountSatisfy(seq: number) {
        let task = this._divineTasks[seq];
        if(task) {
            let level = this.divineLv;
            let levelCfg = configUtils.getDispatchLevelConfig(level);
            if(levelCfg) {
                let needStr = levelCfg.LevelUpNeed;
                let needList = needStr.split(';');
                let taskCfg = configUtils.getDispatchTaskConfig(task.TaskID);
                if(taskCfg.DispatchQuality >= Number(needList[0] && taskCfg.DispatchStar >= Number(needList[1]))) {
                    return true;
                }
            }
        }
        return false;
    }
}

let divineData = new DivineData();
export {
    divineData,
}
