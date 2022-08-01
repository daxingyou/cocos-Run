import { CustomDialogId, ModuleName, RES_ICON_PRE_URL } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { configManager } from "../../../common/ConfigManager";
import { preloadScriptIcons } from "../../../common/res-manager/Preloaders";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { bagData } from "../../models/BagData";
import { pveData } from "../../models/PveData";
import { pveTrialData } from "../../models/PveTrialData";
import { serverTime } from "../../models/ServerTime";
import { taskData } from "../../models/TaskData";
import { userData } from "../../models/UserData";
import RichTextEx from "../../../common/components/rich-text/RichTextEx"
import guiManager from "../../../common/GUIManager";;
import {scheduleManager} from "../../../common/ScheduleManager";
import StepWork from "../../../common/step-work/StepWork";
import { redDotMgr } from "../../../common/RedDotManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { commonEvent } from "../../../common/event/EventData";
import { gamesvr } from "../../../network/lib/protocol";
import { NODE_OPEN_CONDI_TYPE } from "../../../app/AppEnums";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PVEListItem extends cc.Component {

    @property(cc.Label) pveName: cc.Label = null;
    @property(RichTextEx) txtCond1: RichTextEx = null;
    @property(RichTextEx) txtCond2: RichTextEx = null;
    @property(cc.Node) lockNode: cc.Node = null;
    @property(cc.Sprite) bgSpr: cc.Sprite = null;

    @property(cc.Label) enterNum: cc.Label = null;
    @property(cc.Label) enterDesc: cc.Label = null;
    @property(cc.Sprite) enterSpr: cc.Sprite = null;
    @property(cc.Node) noTakeTipNode: cc.Node = null;
    @property(cc.Label) openTime: cc.Label = null;

    @property(cc.Label) progress: cc.Label = null;

    private _cfg: cfg.PVEList = null;
    private _scheduleId: number = 0;
    private _canEnter: boolean = true;
    private _enterStr: string = "";
    private _stepWork = new StepWork();
    private _sprLoader: SpriteLoader = new SpriteLoader();

    init(cfg: cfg.PVEList) {
        this._cfg = cfg;
        this.pveName.string = cfg.PVEListName;
        this._initView();
        this.showOpenType();
        this.checkModuleOpened(cfg.PVEListFunctionId);
        this._sprLoader.changeSprite(this.bgSpr, resPathUtils.getPveListBgRes(cfg.PVEListImage));
        this.scheduleOnce(this._setupRewardTIps, 0.05);

        eventCenter.register(commonEvent.USERDATA_REFRESH, this, this.onUserdataRefresh);
    }

    unuse() {
        this.unscheduleAllCallbacks();
        this._sprLoader.release();
        this._stopRewardNoTakeTip();
        if (this._scheduleId) {
            scheduleManager.unschedule(this._scheduleId);
        }

        eventCenter.unregisterAll(this);
    }

    reuse() {
    }

    private _initView() {
        // 展示进度
        this.showProgress();
    }

    private _setupRewardTIps(){
        this._stopRewardNoTakeTip();
        //太虚幻境
        if(this._cfg.PVEListFunctionId == 17012){
            let isRewardNoGet = redDotMgr.getDreamLandState();
            isRewardNoGet && this._showRewardNoTakeTip();
            return;
        }

        //奇门遁甲
        if(this._cfg.PVEListFunctionId == 17011){
            let magicDoor = redDotMgr.getMagicDoorState();
            magicDoor && this._showRewardNoTakeTip();
            return;
        }
    }

    updateRewardTip(){
        this._setupRewardTIps();
    }

    private _stopRewardNoTakeTip(){
        cc.Tween.stopAllByTarget(this.noTakeTipNode);
        this.noTakeTipNode.active = false;
    }

    private _showRewardNoTakeTip() {
        this.noTakeTipNode.scale = 0;
        this.noTakeTipNode.active = true;
        let onceTimeAction = cc.tween().to(0.2, {scale: 1}, {easing: 'elasticOut'}).delay(10).to(0.2, {scale: 0}, {easing: 'elasticIn'}).delay(5).union();
        let multiTimeAction = onceTimeAction.repeatForever();
        multiTimeAction.target(this.noTakeTipNode).start();
    }

    checkModuleOpened(funcID: number) {
        let cfg = configUtils.getFunctionConfig(funcID);

        // 没有限制条件
        if(!cfg.FunctionOpenCondition || cfg.FunctionOpenCondition.length == 0) {
            this._canEnter = true;
            this.lockNode.active = false;
            this.enterSpr.node.parent.active = true;
            return;
        }

        let conditionArr = cfg.FunctionOpenCondition.split('|');
        let condiType = parseInt(conditionArr[0]);

        let isLock = false;
        // 等级限制
        if(NODE_OPEN_CONDI_TYPE.USER_LV == condiType) {
            let lv = parseInt(conditionArr[1]);
            if (lv && lv > userData.lv) {
                isLock = true;
                let cfg = configUtils.getDialogCfgByDialogId(CustomDialogId.GRADE_NO_MATCH);
                this.txtCond1.node.active = true;
                this.txtCond1.string = `<color=#FF9336>${lv}</c>级开启`;
                this._enterStr = cfg.DialogText.replace(/\%levelnum/gi, lv.toString());
            }
        }

        // 任务开放条件限制
        if(NODE_OPEN_CONDI_TYPE.TASK == condiType) {
            let fID = parseInt(conditionArr[1]);
            let taskCfg = configUtils.getTaskByTaskId(fID);
            let completed = taskData.getTaskIsCompleted(fID);
            if (taskCfg && !completed) {
                isLock = true;
                let cfg = configUtils.getDialogCfgByDialogId(CustomDialogId.PVE_TASK_NO_MATCH);
                this.txtCond2.node.active = true;
                this.txtCond1.string = `完成任务<color=#FF9336>${taskCfg.TaskIntroduce}</c>开启`;
                this._enterStr = cfg.DialogText.replace(/\%s/gi, taskCfg.TaskIntroduce);
            }
        }

        this._canEnter = !isLock;
        this.lockNode.active = isLock;
        this.enterSpr.node.parent.active = !isLock;
    }
    /**
     * 开启条件展示
     */
    showOpenType() {
        this.openTime.node.active = false;

        let numShow = this._cfg.PVEListNumShow.split(";");
        let type = parseInt(numShow[0]);

        if (this._scheduleId)
            scheduleManager.unschedule(this._scheduleId);
        this.enterNum.node.color = cc.Color.BLACK.fromHEX('#F1D9D0');
        if (type == 1) {
            let num = bagData.getItemCountByID(parseInt((numShow[1])));
            let itemcfg = configUtils.getItemConfig(parseInt((numShow[1])));
            let url = `${RES_ICON_PRE_URL.BAG_ITEM}/${itemcfg.ItemIcon}`;
            this.enterNum.string = `${num}`;
            this.enterDesc.string = "挑战次数:";
            this._sprLoader.changeSprite(this.enterSpr, url)
            if (!num) {
                this.enterNum.node.color = cc.Color.RED;
                this._canEnter = false;
                this._enterStr = `挑战次数不足`;
            }
            this.enterSpr.node.active = true;
        } else if (type == 2) {
            let num = bagData.getItemCountByID(parseInt((numShow[1])));
            let itemcfg = configUtils.getItemConfig(parseInt((numShow[1])));
            let url = `${RES_ICON_PRE_URL.BAG_ITEM}/${itemcfg.ItemIcon}`;
            this.enterNum.string = num<=0 ? `0` : `${num}`;
            this.enterDesc.string = num <= 0 ? `高倍次数:` : "高倍次数:";
            this._sprLoader.changeSprite(this.enterSpr, url)
            this.enterSpr.node.active = true;
        } else if (type == 3) {
            let reloadTime = 0;
            this.enterNum.string = ``;
            this.enterDesc.string = "";
            // 目前只支持【九幽森罗、奇门遁甲、云端梦境】
            if (this._cfg.PVEListFunctionId == 17014) 
                reloadTime = pveTrialData.hellInfo ? utils.longToNumber(pveTrialData.hellInfo.NextTime) : 0;
            if (this._cfg.PVEListFunctionId == 17011)
                reloadTime = pveTrialData.miracalInfo ? utils.longToNumber(pveTrialData.miracalInfo.NextTime) : 0;
            if (this._cfg.PVEListFunctionId == 17015)
                reloadTime = pveTrialData.cloudInfo ? utils.longToNumber(pveTrialData.cloudInfo.NextTime) : 0;
            if (this._cfg.PVEListFunctionId == 17016 ||
                this._cfg.PVEListFunctionId == 17017) {
                // 根据ConfigBasic.ActivityResetCron每日刷新的都可添加在这
                reloadTime = serverTime.currServerTime() + utils.getRestTimeForActivityResetCron();
            }
            if (this._cfg.PVEListFunctionId == 17018) {
                reloadTime = pveTrialData.islandData.NextTime;
            }
            if (this._cfg.PVEListFunctionId == 17019) {
                reloadTime = serverTime.currServerTime() + utils.getRestTimeForActivityResetCron();
            }
            let remainTime = reloadTime - serverTime.currServerTime();
            if (remainTime > 0) {
                let timeStr = utils.getTimeInterval(remainTime);
                this.openTime.string = `重置时间：${timeStr}后`;
                this._scheduleId = scheduleManager.schedule(() => {
                    let remainTime = reloadTime - serverTime.currServerTime();
                    if (remainTime > 0) {
                        let timeStr = utils.getTimeInterval(remainTime);
                        this.openTime.string = `重置时间：${timeStr}后`;
                    } else {
                        this.openTime.string = "";
                        scheduleManager.unschedule(this._scheduleId);
                    }
                }, 1)
            } else {
                this.openTime.string = "";
            }
            this.enterSpr.node.active = false;
            this.openTime.node.active = true;
        } else if (type == 4) {
            let config = configManager.getConfigs("dreamlandLesson");
            let lessonID = pveData.getDreamCurLessonId();
            let chapID = config[lessonID].PVEDreamlandLessonChapter;
            let chapterCfg = configManager
                .getConfigByKey("dreamlandChapter", chapID);
            this.enterNum.string = ``;
            this.enterDesc.string = pveData.getDreamLessonName();
            this.enterSpr.node.active = false;
            //异步执行预加载
            let chapBgRes = `${RES_ICON_PRE_URL.DREAMLAND}/${chapterCfg.PVEDreamlandChapterImage}`;
            this._stepWork.concact(preloadScriptIcons([chapBgRes], "DREAMLAND_PRELOAD").stepWork).start(() => { });
        }
    }

    onClickThis() {
        let functionId = this._cfg.PVEListFunctionId;

        //@ts-ignore
        let viewName: string = ModuleName[`${functionId}`];
        if(!viewName) {
            let functionCfg = configUtils.getFunctionConfig(this._cfg.PVEListFunctionId);
            viewName = functionCfg.FunctionName;
        }

        if(!this._canEnter) {
            guiManager.showTips(this._enterStr);
            return;
        }

        if(!viewName || viewName.length == 0) {
            guiManager.showLockTips();
            return;
        }

        guiManager.loadModuleView(viewName,this._cfg.PVEListFunctionId, this);
    }

    private showProgress() {
        if (this._cfg.PVEListFunctionId === 17016) {
            let challengeBasicConfig = pveTrialData.getChallengeBasicConfig();
            let maxLevel = pveTrialData.getChallengeMaxLevel(challengeBasicConfig.PVEChallengeBasicMonster);
            let progress = pveTrialData.respectData.Progress + 1;
            progress = progress > maxLevel ? maxLevel : progress;
            this.progress.string = `${progress}/${maxLevel}`
            this.progress.node.active = true;
        } else if (this._cfg.PVEListFunctionId === 17017) {
            this.progress.string = `第${pveTrialData.getPurgatoryCurStorey()}层`;
            this.progress.node.active = true;
        } else if (this._cfg.PVEListFunctionId === 17018) {
            let isPass = pveTrialData.checkIsPassIslandAllLevel();
            this.progress.string = '已通关'
            this.progress.node.active = isPass;
        }
    }

    onUserdataRefresh(event: any, msg: gamesvr.UserdataRefreshNotify) {
        // 监听到数据系统刷新，刷新倒计时和显示 - 致师之礼、无间炼狱
        switch (this._cfg.PVEListFunctionId) {
            case 17016:
            case 17017:
            case 17018:
                this.showProgress();
                this.showOpenType();
                break;
        }
    }
}
