import { utils } from "../../app/AppUtils";
import { configManager } from "../../common/ConfigManager";
import { eventCenter } from "../../common/event/EventCenter";
import { loginEvent, netEvent } from "../../common/event/EventData";
import { logger } from "../../common/log/Logger";
import HttpRequest from "../../network/HttpRequest";
import { operationSvr } from "../../network/OperationSvr";
import { svrConfig } from "../../network/SvrConfig";
import { HeroBasicInfo } from "../models/HeroData";
import { modelManager } from "../models/ModeManager";
import { optManager } from "./OptManager";

export class LoginOpt {
    init() {
        this.addEvent();
        this.revNoticeData();
        // 发送收取请求
        operationSvr.queryGamesvrs();
    }

    addEvent() {
        eventCenter.register(netEvent.FETCH_SERVER_RES, this, this.revLoginDataSuc);
        eventCenter.register(netEvent.NET_LOGIN_SUCC, this, this.loginSuc);
    }
    /**
     * 接收公告配置
     */
    revNoticeData() {
        new HttpRequest().request(svrConfig.noticeRomate, {}, null, false).then((res) => {
            // logger.log('revNoticeData:', res);
            modelManager.loginData.noticeData = JSON.parse(res);
        }).catch(err => {
            logger.error('revNoticeData', err);
        });
    }
    /**
     * 用户登录
     */
    useLogin() {
        let userAccount: string = modelManager.userData.getUserAccount();
        operationSvr.login(userAccount, modelManager.loginData.curSelectChannelInfo.URL);

        // 同步配置的配置表数据
        let module = configManager.getAnyConfig('ConfigConfigModule');
        modelManager.loginData.moduleConfigs = module;
    }
    /**
     * 收取服务器login信息成功
     */
    revLoginDataSuc() {
        // test 暂存用户信息
        modelManager.loginData.init();
    }
    /**
     * 用户登录成功
     */
    loginSuc() {
        logger.log('loginOpt登录成功');
        eventCenter.fire(loginEvent.LOGIN_SUCCESS);
        optManager.initChapter();
        // 登录成功
    }
    /**
     * 点击了不同的区服大分类 需要刷新区服列表显示
     * @param index 
     * @returns 
     */
    changeBigChannel(index: number) {
        if (modelManager.loginData.bigChannelIndex != index) {
            modelManager.loginData.bigChannelIndex = index;
            // todo 更新channelview 发送事件
            eventCenter.fire(loginEvent.CHANGE_BIGCHANNEL);
            return true;
        } else {
            return false;
        }
    }
    /**
     * 点击了公告,点击了不同的公告大分类,才需要刷新公告显示
     * @param index 
     * @returns 
     */
    changeNotice(index: number) {
        if (index != modelManager.loginData.curSelectedNotice) {
            modelManager.loginData.curSelectedNotice = index;
            // todo 更新notice 发送事件
            eventCenter.fire(loginEvent.CHANGE_NOTICE);
            return true;
        } else {
            return false;
        }
    }
    /**
     * 是否自动弹出公告
     * @returns 
     */
    checkIsAutoShowNotice() {
        return modelManager.loginData.noticeData.ServerNotices && modelManager.loginData.noticeData.ServerNotices.systemState == 1;
    }
    /**
     * 获得英雄对应的整卡转成碎片的数量
     * @param roleId 
     * @returns 
     */
    getRoleToChipCount(roleId: number) {
        let roleConfig: HeroBasicInfo = optManager.bagDataOpt.getHeroBaseConfigById(roleId);
        let roleToChipList = utils.parseStingList(modelManager.loginData.moduleConfigs.HeroGetPiece);
        for (let i = 0; i < roleToChipList.length; ++i) {
            // 如果品质相同了 得到碎片数
            if (Number(roleToChipList[i][0]) == roleConfig.HeroBasicQuality) {
                return Number(roleToChipList[i][1]);
            }
        }
        return null;
    }
}