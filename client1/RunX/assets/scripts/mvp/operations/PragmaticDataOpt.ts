import { configManager } from "../../common/ConfigManager";
import { eventCenter } from "../../common/event/EventCenter";
import { pragmaticEvent } from "../../common/event/EventData";
import { logger } from "../../common/log/Logger";
import { gamesvr } from "../../network/lib/protocol";
import { operationSvr } from "../../network/OperationSvr";
import { pragmaticData } from "../models/PragmaticData";
import { userData } from "../models/UserData";
import { BaseOpt } from "./BaseOpt";


class PragmaticDataOpt extends BaseOpt {
    init() {
        this.addEventListener(gamesvr.CMD.LEAD_SKILL_UPGRADE_RES, this._recvChangeLeadSkillSuc);
        this.addEventListener(gamesvr.CMD.LEAD_SKILL_RESET_RES, this._recvResetLeadSkillSuc);
        this.addEventListener(gamesvr.CMD.LEAD_GRASP_FEED_RES, this._recvRaiseLvOfWuDao);
    }

    deInit() {

    }

    private _recvChangeLeadSkillSuc(recvMsg: { Result: number, Desc: string, Msg: gamesvr.LeadSkillUpgradeRes }) {
        if(!this._checkResValid(recvMsg)) {
            logger.error('_recvChangeLeadSkillSuc msg error:', recvMsg);
            return;
        }
        let msg = recvMsg.Msg;
        let skill: {[k: number]: number} = {};
        skill[msg.GroupID] = msg.Level;
        pragmaticData.changePragmaticSkills(skill);
        userData.updateCapability();
        eventCenter.fire(pragmaticEvent.CHANGE_LEAD_SKILL_SUC);
    }

    reqChangeLeadSkill(groupId: number, level: number) {
        let req = new gamesvr.LeadSkillUpgradeReq( {
            GroupID: groupId,
            Level: level
        });
        operationSvr.send(req);
    }

    private _recvResetLeadSkillSuc(recvMsg: { Result: number, Desc: string, Msg: gamesvr.LeadSkillResetRes }) {
        if(!this._checkResValid(recvMsg)) {
            logger.error('_recvResetLeadSkillSuc msg error:', recvMsg);
            return;
        }
        pragmaticData.resetSkills();
        userData.updateCapability();
        eventCenter.fire(pragmaticEvent.RESET_LEAD_SKILLS_SUC);
    }

    reqResetLeadSkills() {
        let req = new gamesvr.LeadSkillResetReq();
        operationSvr.send(req);
    }

    reqRaiseLvOfWuDao(groupID: number, cnt: number) {
        let req = gamesvr.LeadGraspFeedReq.create({
            GroupID: groupID,
            FeedCount: cnt
        });
        operationSvr.send(req);
    }

    private _recvRaiseLvOfWuDao(recvMsg: { Result: number, Desc: string, Msg: gamesvr.LeadGraspFeedRes }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        pragmaticData.updateWuDaoLv(`${msg.GroupID}`, msg.CurCount || 0, msg.Level || 0);
        userData.updateCapability();
        eventCenter.fire(pragmaticEvent.UPDTAE_WU_DAO_LV, msg);
    }
}
let pragmaticDataOpt = new PragmaticDataOpt();
export {
    pragmaticDataOpt
}
