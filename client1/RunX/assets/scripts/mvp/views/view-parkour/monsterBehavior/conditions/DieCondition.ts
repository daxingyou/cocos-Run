import ParkourMonster, { MonsterDeadType } from "../../ParkourMonster";
/*
 * @Description:怪物死亡条件
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-07-07 17:13:06
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-09 17:35:12
 */
export default class DieCondition extends b3.Condition{
    public static TAG: string = "DieCondition";

    //最大寿命时长
    private _lifeTime: number = NaN;
    constructor(lifeTime?: number){
        super({name: DieCondition.TAG});
        if(!isNaN(lifeTime) && lifeTime > 0){
            this._lifeTime = lifeTime;
        }
    }

    enter(tick: b3.Tick){

    }

    open(tick: b3.Tick){

    }

    tick(tick: b3.Tick){
        //@ts-ignore
        let target = tick.target || {};
        let monsterNode: cc.Node = target && target.target;
        if(!cc.isValid(monsterNode)){
            cc.warn('Monster DieCondition： 行为树中target 不存在！！！');
            return b3.FAILURE;
        }
        let monsterComp:ParkourMonster  = monsterNode.getComponent(ParkourMonster);
        if(!monsterComp){
            cc.warn('Monster DieCondition： 行为树中target 不存在！！！');
            return b3.FAILURE;
        }

        //检查血量为0
        let monsterInfo = monsterComp.getMonsterInfo();

        //中途掉落道具
        if(monsterInfo.middleDropItem){
            let ratio = monsterInfo.currHp / monsterInfo.maxHp;
            monsterInfo.middleDropItem.forEach((value, key) => {
                if(!value.isTrig && ratio <= value.condition){
                    value.isTrig = true;
                    monsterComp.gengerateReward(value.items);
                }
            });
        }

        if(monsterInfo.currHp <= 0){
            monsterInfo.deadType = MonsterDeadType.BeAttack;
            //@ts-ignore
            tick.blackboard.set('currTime', tick.tree.id, this.id, NaN);
            return b3.SUCCESS;
        }

        //寿命到达尽头
        //@ts-ignore
        let currTime = tick.blackboard.get('currTime', tick.tree.id, this.id) || NaN;
        if(!isNaN(this._lifeTime)){
            if(isNaN(currTime)){
                currTime = this._lifeTime;
            }else{
                currTime -= target.dt;
            }

            if(currTime <= 0){
                monsterInfo.deadType = MonsterDeadType.NoLife;
                //@ts-ignore
                tick.blackboard.set('currTime', tick.tree.id, this.id, NaN);
                return b3.SUCCESS;
            }
        }
        //@ts-ignore
        tick.blackboard.set('currTime', tick.tree.id, this.id, currTime);
        return b3.FAILURE;
    }

    close(tick: b3.Tick){

    }

    exit(tick: b3.Tick){

    }
}
