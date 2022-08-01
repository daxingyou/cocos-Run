import { utils } from "../../../../app/AppUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import { cfg } from "../../../../config/config";
import AttackAction from "./actions/AttackAction";
import CleanAction from "./actions/CleanAction";
import FlyAction from "./actions/FlyAction";
import JumpDownAction from "./actions/JumpDownAction";
import JumpUpAction from "./actions/JumpUpAction";
import MoveXAction from "./actions/MoveXAction";
import ResetAction from "./actions/ResetAction";
import WaitAction from "./actions/WaitAction";
import CleanPreCondition from "./conditions/CleanPreCondition";
import DieCondition from "./conditions/DieCondition";
import HPPreCondition, { BTThresholdType } from "./conditions/HPPreCondition";
import ResetPreCondition from "./conditions/ResetPreCondition";
import Parallel from "./Parallel";

/*
 * @Description:怪物的行为树
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-07-07 17:22:18
 * @LastEditors: lixu
 * @LastEditTime: 2021-07-08 16:21:00
 */
export default class MonsterBT{
    private _tree: b3.BehaviorTree = null;
    private _monsterId: number = NaN;
    private _conditionStages: Map<string, MonsterStageInfo[]> = null;
    private _destroyTime: number = NaN;
    private _isActive: boolean = false;

    constructor(monsterId: number, actionId: number){
        this._monsterId = monsterId
        this._tree = new b3.BehaviorTree();
        this._getActionCfg(actionId);
        this._buildTree();
    }

    get active(): boolean{
        return this._isActive;
    }

    set active(isActive: boolean){
        this._isActive = isActive;
    }

    release(){
        this._tree = null;
        if(this._conditionStages){
            this._conditionStages.forEach((ele, key)=>{
                ele && (ele.length = 0);
            });
            this._conditionStages.clear();
            this._conditionStages = null;
        }
    }

    //初始化怪物的行为，触发条件编号（TriggerConditions）越高的阶段，执行优先级越高；同一个触发条件下,阶段编号（StageSerialNumber）越低的阶段，优先级越高
    private _getActionCfg(actionId: number){
        if(isNaN(this._monsterId)) {
            cc.warn('怪物行为树构建异常：无效的monsterId');
            return;
        }

        let actionCfg = configUtils.getRunXMonsterActionCfg(actionId);
        (actionCfg as Array<cfg.RunXMonsterAction>).sort((a, b) => {
            let aCondition = typeof(a.TriggerConditions) == 'undefined' ? 0 : a.TriggerConditions;
            let bCondition = typeof(b.TriggerConditions) == 'undefined' ? 0 : b.TriggerConditions;
            let aConditionType = typeof(a.TriggerConditionsType) == 'undefined' ? 0 : a.TriggerConditionsType;
            let bConditionType = typeof(b.TriggerConditionsType) == 'undefined' ? 0 : b.TriggerConditionsType;
            if(aCondition != bCondition){
                return bCondition - aCondition;
            }else if(aConditionType != bConditionType){
                return aConditionType - bConditionType;
            }else{
                return a.StageSerialNumber - b.StageSerialNumber;
            }
        });

        for(let i = 0, len = actionCfg.length; i < len; i++){
            let stageConfig = actionCfg[i];
            if(typeof stageConfig.DestructionTimeAxis != 'undefined' && stageConfig.DestructionTimeAxis > 0){
                this._destroyTime = stageConfig.DestructionTimeAxis / 1000;
            }

            let condition = typeof(stageConfig.TriggerConditions) == 'undefined' ? 0 : stageConfig.TriggerConditions;
            let conditionType = typeof(stageConfig.TriggerConditionsType) == 'undefined' ? 0 : stageConfig.TriggerConditionsType;
            let key: string = `${condition}_${conditionType}`;
            this._conditionStages = this._conditionStages || new Map<string, MonsterStageInfo[]>();
            if(!this._conditionStages.has(key)){
                this._conditionStages.set(key, []);
            }
            let stages =  this._conditionStages.get(key);
            stages.push(new MonsterStageInfo(stageConfig));
        }
    }

    private _buildTree(){
        if(!this._tree) return;
        let root: any = new b3.Priority();
        //@ts-ignore
        this._tree.root = root;

        //死亡节点
        let dieCondition = new DieCondition(this._destroyTime);
        root.children.push(dieCondition);

        //行为阶段的子树
        let stageSelector: any = new b3.Priority();
        let stagesLimitNode: any = new b3.Limiter({maxLoop: 1, child: stageSelector});
        root.children.push(stagesLimitNode);

        if(this._conditionStages && this._conditionStages.size > 0){
            this._conditionStages.forEach((ele, key) => {
                let conditions = key.split('_');
                let condition = parseInt(conditions[0]);
                let conditionsType = parseInt(conditions[1]);
                let precondition = this._getActsPreCondition(condition, conditionsType);
                let menSeq: b3.MemSequence = new b3.MemSequence();
                if(precondition){
                    let sequenceNode: any = new b3.Sequence();
                    sequenceNode.children.push(precondition);
                    stageSelector.children.push(sequenceNode);
                    sequenceNode.children.push(menSeq);
                }else{
                    stageSelector.children.push(menSeq);
                }
                this._generateStagesNode(menSeq, ele);
            });
        }
    }

    //获取具有触发条件的阶段的前置触发节点
    private _getActsPreCondition(condition: number, conditionParam: number){
        //血量条件
        if(condition == 1){
           return new HPPreCondition(conditionParam / 10000, BTThresholdType.Ratio);
        }
        return null;
    }

    //为一组具有相同触发条件和触发参数的阶段序列生成对应的行为子树
    private _generateStagesNode(root: b3.MemSequence, stages: MonsterStageInfo[]){
        if(!root || !stages || stages.length <= 0) return;
        stages.forEach((ele) =>{
            //@ts-ignore
            root.children.push(this._getActionSubTree(ele));
        });
    }

    private _getActionSubTree(ele: MonsterStageInfo): b3.MemSequence{
        let subRoot: any = new b3.MemSequence();

        let cleanSelector: any = new b3.Priority();
        subRoot.children.push(cleanSelector);
        let cleanPreCondition = new CleanPreCondition(ele);
        let cleanInverter = new b3.Inverter({child: cleanPreCondition});
        cleanSelector.children.push(cleanInverter);
        let cleanAction = new CleanAction();
        cleanSelector.children.push(cleanAction);

        let resetSelector: any = new b3.Priority();
        subRoot.children.push(resetSelector);
        let resetPreCondition = new ResetPreCondition(ele);
        let resetInverter = new b3.Inverter({child: resetPreCondition});
        resetSelector.children.push(resetInverter);
        let resetConfig: string = ele.config.IsHoming;
        if(resetConfig && resetConfig.length > 0){
            let resetActionCfg: MonsterActionInfo = null;
            utils.parseStingList(resetConfig, (config) =>{
                let [targetX, targetY, speed] = [...config];
                resetActionCfg = {
                    targetX: parseInt(targetX),
                    targetY: parseInt(targetY),
                    speed: parseInt(speed)
                }
            });
            let resetAction = new ResetAction(resetActionCfg);
            resetSelector.children.push(resetAction);
        }

        let loopTimes = ele.config.LoopTimes || 1;
        let parallel: any = new Parallel();
        let actionsSeq: b3.Repeater = new b3.Repeater({maxLoop: loopTimes, child: parallel});
        subRoot.children.push(actionsSeq);

        for(let j = 0, len = ele.actions.length; j < len; j++){
            let action  = ele.actions[j];
            let actionNode: any = null;
            if(action.opType == MonsterOpType.JumpUp){
                actionNode = new JumpUpAction(action);
            }

            if(action.opType == MonsterOpType.JumpDown){
                actionNode = new JumpDownAction(action);
            }

            if(action.opType == MonsterOpType.Attack){
                actionNode = new AttackAction(action);
            }

            if(action.opType == MonsterOpType.Fly){
                actionNode = new FlyAction(action, null, parallel);
            }

            if(action.opType == MonsterOpType.MoveX){
                actionNode = new MoveXAction(action, parallel);
            }

            if(action.opType == MonsterOpType.Wait){
                actionNode = new WaitAction(action);
            }
            parallel.children.push(actionNode);
        }
        return subRoot;
    }

    tick(target:any, blackBoard: b3.Blackboard): number{
        if(!this._isActive) return b3.FAILURE;
        if(!this._tree) return b3.FAILURE;
        return  this._tree.tick(target, blackBoard);
    }
}

class MonsterStageInfo{
    private _config: cfg.RunXMonsterAction = null;
    private _actions?: MonsterActionInfo[] = null;

    constructor(config?: cfg.RunXMonsterAction){
        this._config = config;
        this._parseActions();
    }

    get config(): cfg.RunXMonsterAction{
        return  this._config;
    }

    get actions(): MonsterActionInfo[]{
        return this._actions;
    }

    private _parseActions(){
        if(!this._config) return;

        this._actions = this._actions || [];
        //跳跃动作解析
        if(this._config.OperationTimeAxis && this._config.OperationTimeAxis.length > 0){
            utils.parseStingList(this._config.OperationTimeAxis, (actionInfo) => {
                let time = parseInt(actionInfo[0]) / 1000;
                let opType = parseInt(actionInfo[1]) == 1 ? MonsterOpType.JumpUp : MonsterOpType.JumpDown;
                let action:MonsterActionInfo  = {
                    time: time,
                    opType: opType,
                };
                this._actions.push(action);
            });
        }

        //水平位移动作解析
        if(this._config.HorizontalMoveTimeAxis && this._config.HorizontalMoveTimeAxis.length > 0){
            utils.parseStingList(this._config.HorizontalMoveTimeAxis, (actionInfo) => {
                let time = parseInt(actionInfo[0]) / 1000;
                let opType = MonsterOpType.MoveX;
                let useTime = parseInt(actionInfo[1]) / 1000;
                let targetX = parseInt(actionInfo[2]);
                let action:MonsterActionInfo  = {
                    time: time,
                    opType: opType,
                    useTime: useTime,
                    targetX: targetX,
                };
                this._actions.push(action);
            });
        }

        //飞行动作解析
        if(this._config.FlyTimeAxis && this._config.FlyTimeAxis.length > 0){
            utils.parseStingList(this._config.FlyTimeAxis, (actionInfo) => {
                let time = parseInt(actionInfo[0]) / 1000;
                let opType = MonsterOpType.Fly;
                let targetX = parseInt(actionInfo[1]);
                let targetY = parseInt(actionInfo[2]);
                let speed = parseInt(actionInfo[3]);
                let action:MonsterActionInfo  = {
                    time: time,
                    opType: opType,
                    targetX: targetX,
                    targetY: targetY,
                    speed: speed,
                };
                this._actions.push(action);
            });
        }

        //攻击动作解析
        if(this._config.AttackTimeAxis && this._config.AttackTimeAxis.length > 0){
            utils.parseStingList(this._config.AttackTimeAxis, (actionInfo) => {
                let time = parseInt(actionInfo[0]) / 1000;
                let opType = MonsterOpType.Attack;
                let bulletId = parseInt(actionInfo[1]);
                let action:MonsterActionInfo  = {
                    time: time,
                    opType: opType,
                    bulletID: bulletId
                };
                this._actions.push(action);
            });
        }

        //等待动作解析
        if(this._config.StandingTime && this._config.StandingTime.length > 0){
            utils.parseStingList(this._config.StandingTime, (actionInfo) => {
                let time = parseInt(actionInfo[0]) / 1000;
                let useTime = parseInt(actionInfo[1]) / 1000;
                let opType = MonsterOpType.Wait;
                let action:MonsterActionInfo  = {
                    time: time,
                    opType: opType,
                    useTime:useTime
                };
                this._actions.push(action);
            });
        }

        //入场剧情动作解析，预留，后续可能要补充
    }
}

interface MonsterActionInfo{
    //开始时间点
    time?: number,
    //动作类型
    opType?: MonsterOpType,
    //目标位置x坐标
    targetX?: number,
    //目标位置y坐标
    targetY?: number,
    //消耗的时间
    useTime?: number,
    //移动速度
    speed?: number,
    //发射子弹时子弹组ID
    bulletID?: number,
}

enum MonsterOpType{
    JumpUp = 1,
    JumpDown,
    MoveX,
    Fly,
    Attack,
    Wait
}

enum MonsterStageCleanTag{
    None = 0,
    Clean
}

export{
    MonsterStageInfo,
    MonsterStageCleanTag,
    MonsterActionInfo
}
