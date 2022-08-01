import { TaskState } from "../../app/AppEnums";
import { logger } from "../../common/log/Logger";

export default class MainTaskData{
    /**任务状态 key-任务id,value-状态*/
    private _mainTaskState: Map<number, TaskState> = new Map();
    /**当前的奖励单元*/
    private _mainRewardId: number = 1;

    get mainTaskState(): Map<number, TaskState> { return this._mainTaskState; }
    get mainRewardId(): number { return this._mainRewardId; }

    init() {
        
    }

    deInit() {
        this._mainTaskState.clear();
        this._mainRewardId = 1;
    }

    next() {
        let state = this.getMainTaskState(this._mainRewardId);
        //校验是否是当前是否已是已领取状态
        if (state == TaskState.Received) {
            this._mainRewardId++;
        } else {
            logger.error(`MainTaskData`, `now state is not Received!`);
        }
    }

    setMainTaskState(id: number, state: TaskState) {
        if (!state) state = TaskState.Undo;
        this._mainTaskState.set(id, state);
    }

    getMainTaskState(id: number): TaskState{
        return this._mainTaskState.get(id);
    }

    setRewardId(rewardID:number) {
        this._mainRewardId = rewardID;
    }
}

let mainTaskData = new MainTaskData();
export {
    mainTaskData,
}