import { utils } from "../../../../../app/AppUtils";
import { BulletDelayInfo } from "../../../view-item/ItemBullet";
import { bulletGroupCfgManager } from "../../BulletManager";
import ParkourMonster from "../../ParkourMonster";
import { MonsterActionInfo } from "../MonsterBT";

/*
 * @Description:  怪物攻击行为
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-07-08 16:09:24
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-18 15:33:20
 */
export default class AttackAction extends b3.Action {
  public static TAG: string = 'AttackAction';
  private _actionInfo: MonsterActionInfo = null;
  private _bulletSimpleData: BulletDelayInfo[] = null;
  constructor(actionInfo: MonsterActionInfo){
      super({name: AttackAction.TAG});
      this._actionInfo = actionInfo;
      this._init();
  }

  private _init(){
    if(!this._bulletSimpleData){
        let bulletCfg = bulletGroupCfgManager.getBulletGroupCfg(this._actionInfo.bulletID);
        if(bulletCfg){
            let bullets: any[] = bulletCfg.bullets;
            bullets.forEach((ele, idx) =>{
                this._bulletSimpleData = this._bulletSimpleData || [];
                this._bulletSimpleData.push({idx:idx, bulletID: ele.ID, delay: ele.delay, isLaunch: false});
            });
        }
    }else{
        this._bulletSimpleData.forEach(ele => {
            ele.isLaunch = false;
        })
    }
  }

  enter(tick: b3.Tick){

  }

  open(tick: b3.Tick){
      //@ts-ignore
      tick.blackboard.set('isTrig', false, tick.tree.id, this.id);
      //@ts-ignore
      tick.blackboard.set('costTime', 0, tick.tree.id, this.id);
      //@ts-ignore
      tick.blackboard.set('isFirst', true, tick.tree.id, this.id);
      this._init();
  }

  tick(tick: b3.Tick): number{
      //@ts-ignore
      let dt: number = tick.target.dt;
      //@ts-ignore
      let monsterNode: cc.Node = tick.target.target;
      //@ts-ignore
      let costTime = tick.blackboard.get('costTime', tick.tree.id, this.id);
      //@ts-ignore
      let isTrig = tick.blackboard.get('isTrig', tick.tree.id, this.id);
      //@ts-ignore
      let isFirst = tick.blackboard.get('isFirst', tick.tree.id, this.id);
      //@ts-ignore
      isFirst && tick.blackboard.set('isFirst', false, tick.tree.id, this.id);
       //到了触发时间
       if(costTime >= this._actionInfo.time){
          //还未被触发
          if(!isTrig){
              //@ts-ignore
              tick.blackboard.set('isTrig', true, tick.tree.id, this.id);
              !isFirst && (costTime += dt);
              //@ts-ignore
              tick.blackboard.set('costTime', costTime, tick.tree.id, this.id);
              if(this._checkShoot(costTime - this._actionInfo.time, monsterNode.getComponent(ParkourMonster))){
                  return b3.SUCCESS;
              }
              return b3.RUNNING;
          }else{
              !isFirst && (costTime += dt);
              //@ts-ignore
              tick.blackboard.set('costTime', costTime, tick.tree.id, this.id);
              if(this._checkShoot(costTime - this._actionInfo.time, monsterNode.getComponent(ParkourMonster))){
                  return b3.SUCCESS;
              }
              return b3.RUNNING;
          }
      }else{
          !isFirst && (costTime += dt);
          //@ts-ignore
          tick.blackboard.set('costTime', costTime, tick.tree.id, this.id);
          return b3.RUNNING;
      }
  }

  close(tick: b3.Tick){

  }

  exit(tick: b3.Tick){

  }

  private _checkShoot(costTime: number, comp: ParkourMonster): boolean{
      if(!this._bulletSimpleData || this._bulletSimpleData.length == 0 || this._bulletSimpleData[0].isLaunch == true) return true;
      for(let i = 0, len = this._bulletSimpleData.length; i < len; i++){
          let cfg = this._bulletSimpleData[i];
          if(!cfg.isLaunch && costTime >= cfg.delay){
              cfg.isLaunch = true;
              this._bulletSimpleData.splice(i, 1);
              this._bulletSimpleData.push(cfg);
              i -= 1;
              comp && comp.doShoot && comp.doShoot(cfg.idx, cfg.bulletID, this._actionInfo.bulletID);
              continue;
          }

          if(cfg.isLaunch){
              break;
          }
      }
      if(this._bulletSimpleData[0].isLaunch){
          return true;
      }
      return false;
  }
}
