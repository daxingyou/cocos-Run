/*
 * @Description:功能引导
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-09-18 12:09:05
 * @LastEditors: lixu
 * @LastEditTime: 2021-09-24 16:28:15
 */
import { gamesvr } from "../../network/lib/protocol";
import { operationSvr } from "../../network/OperationSvr";
import { functionGuideData } from "../models/GuideData";
import { BaseOpt } from "./BaseOpt";

class GuideOpt extends BaseOpt {
    init() {
        this._registerEvents();
    }

    reqRecordFinishGuide(guideID: number){
        let req: gamesvr.FinishGuideReq = gamesvr.FinishGuideReq.create({
          GuideId: guideID
      })
      operationSvr.send(req);
    }

    
    private _registerEvents(){
        this.addEventListener(gamesvr.CMD.FINISH_GUIDE_RES, this._onRespFinishGuide);
    }

    private _onRespFinishGuide(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FinishGuideRes}){
        let finishGuideID = recvMsg.Msg.GuideId;
        functionGuideData.addFinishGuide(finishGuideID);
    }
}

let guideOpt = new GuideOpt();
export {
  guideOpt
}
