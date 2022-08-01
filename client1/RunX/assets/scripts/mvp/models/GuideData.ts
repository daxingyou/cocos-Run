import { configUtils } from "../../app/ConfigUtils";
import BaseModel from "./BaseModel";

export const enum GUIDE_STEP {
    BATTLE1,
    RUN1,
    BATTLE2,
    END,
}

export enum GUIDE_EVENT {
    TEST = 'Test',
    ENTER_NEXT = 'Enter_Next',
    BATTLE_ROUND_END = 'Battle_Round_End',

}

class FunctionGuideData extends BaseModel{
    private _finishSet: Set<number> = null;

    init () {
      this._finishSet = this._finishSet || new Set<number>();
    }

    deInit () {
        this._finishSet && this._finishSet.clear();
    }

    updateFinishedGuideData(data: (number[] | null)){
        if(!data || data.length == 0) return;
        data.forEach(ele =>{
            !this._finishSet.has(ele) && this._finishSet.add(ele);
        });
    }

    //引导组是否已经关闭(有结束标记的步已经上报server)
    isGuideFinished(condi: string): boolean{
        let cfg = configUtils.getFunctionGuideCfg(condi);
        if(!cfg) return true;
        return cfg.some(ele => {
                    return typeof ele.FunctionGuideRepeat != 'undefined' && ele.FunctionGuideRepeat == 1 && this._finishSet.has(ele.FunctionGuideID);
                }, this);
    }

    //引导组是否已经打开(任意一步已经上报server)
    isGuideStarted(condi: string): boolean{
        let cfg = configUtils.getFunctionGuideCfg(condi);
        if(!cfg) return false;
        return cfg.some(ele => {
                    return this._finishSet.has(ele.FunctionGuideID);
                }, this);
    }

    addFinishGuide(ID: number){
        if(isNaN(ID)) return;
        if(this._finishSet.has(ID)) return;
        this._finishSet.add(ID);
    }

    //获取引导组的开始索引
    getStartIdx(condi: string): number{
        if(this.isGuideFinished(condi)) return -1;
        let cfg = configUtils.getFunctionGuideCfg(condi);
        let startIdx = -1;
        if(!cfg || cfg.length == 0) return startIdx;
        if(this.isGuideStarted(condi)){
          let isFind = cfg.some((ele, idx) => {
              if(typeof ele.FunctionGuideRepeat != 'undefined' && ele.FunctionGuideRepeat == 0){
                startIdx = idx;
                return true;
              }
              return false;
          });
          !isFind && (startIdx = 0);
        }
        startIdx  = Math.max(0, startIdx);
        return startIdx;
    }

    //当前引导步骤是否已经完成
    isGuideStepFinish(guideStepID: number): boolean{
        return this._finishSet.has(guideStepID);
    }
}

let functionGuideData = new FunctionGuideData();
export { functionGuideData}
