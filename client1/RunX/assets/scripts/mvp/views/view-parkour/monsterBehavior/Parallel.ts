/*
 * @Description:行为树中Composite类型的并发节点，其子节点可以并发执行, 并且所有节点只执行一次，不管成功与否,当所有子节点都执行成功时，该节点就执行成功，否则为执行中或者失败
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-07-08 14:43:20
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-09 19:54:32
 */
export default class Parallel extends b3.Composite{
    public static TAG: string = 'Parallel';

    private _surplusCount: number = 0;
    private _succCount: number = 0;

    constructor(children: any[] = []){
      super({name: Parallel.TAG, children: children});
    }

    open(tick: b3.Tick){
        //@ts-ignore
        let childrenStatus: number[] = tick.blackboard.get('childrenStatus', tick.tree.id, this.id) || [];
        childrenStatus.length = 0;
        //@ts-ignore
        tick.blackboard.set('childrenStatus', childrenStatus, tick.tree.id, this.id);
    }

    tick(tick: b3.Tick): number{
        //@ts-ignore
        let childrenStatus: number[] = tick.blackboard.get('childrenStatus', tick.tree.id, this.id);
        //@ts-ignore
        this._surplusCount = this.children.length;
        this._succCount = 0;
        //@ts-ignore
        for(let i = 0, len = this.children.length; i < len; i++){
            if(childrenStatus.length <= i || childrenStatus[i] == b3.RUNNING){
                if(i >= childrenStatus.length){
                    childrenStatus.push(NaN);
                }
                //@ts-ignore
                let status = this.children[i]._execute(tick);
                childrenStatus[i] = status;
                if(status != b3.RUNNING){
                  this._surplusCount --;
                  this._succCount += ((childrenStatus[i] == b3.SUCCESS) ? 1 : 0);
                }
            }else{
                this._surplusCount --;
                this._succCount += ((childrenStatus[i] == b3.SUCCESS) ? 1 : 0);
            }
        }

        if(this._surplusCount == 0){
            //@ts-ignore
            return (this._succCount == this.children.length) ? b3.SUCCESS : b3.FAILURE;
        }
        return b3.RUNNING;
    }

    //强制设置某个子节点的运行结果，使之后的每次tick不再调用该节点的tick
    //PS: 该方法只能在子节点的tick方法中调用
    //PS: 目前主要用于子节点并发过程中，同一类型的子节点每次tick最多只能有一个处于激活状态的场景，如移动，飞行等需要持续一段时间的action
    setChildResult(status: number, child: b3.BaseNode, tick: b3.Tick){
        if(status != b3.SUCCESS || status != b3.FAILURE) return;
        if(!child) return;
        //@ts-ignore
        if(!tick.blackboard.get('isOpen', false, tick.tree.id, this.id)) return;
        //@ts-ignore
        let idx = this.children.indexOf(child);
        if(idx == -1) return;
        //@ts-ignore
        let childrenStatus: number[] = tick.blackboard.get('childrenStatus', tick.tree.id, this.id);
        if(childrenStatus[idx] != b3.RUNNING) return;
        childrenStatus[idx] = status;
        this._surplusCount --;
        this._succCount += ((status == b3.SUCCESS) ? 1 : 0);
    }
}
