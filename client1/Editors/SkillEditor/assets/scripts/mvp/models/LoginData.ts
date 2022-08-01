import { Channel_Max_Num } from "../../app/AppConst";
import { ModuleInfo } from "../../app/AppType";
import { logger } from "../../common/log/Logger";
import { onlinesvr } from "../../network/lib/protocol";
import { svrConfig } from "../../network/SvrConfig";


/************* 频道相关的 ******************** */
/**
 * 频道信息
 */
interface Channel_Info {
    ChannelId: number,
    ChannelName: string,
    isNew: boolean,
    isHot: boolean,
    isFixed?: boolean
}
/**
 * 频道信息
 */
interface Channel_Infos {
    LastChannelId: number,
    ChannelInfos: Channel_Info[],
    hasRoleList: Role_Info[]
}
/**
 * 角色信息
 */
interface Role_Info {
    ChannelId: number,
    Level: number,
}
/**
 * 公告内容
 */
interface Notice_Content {
    title: string,
    content: string
}
/**
 * 公告信息
 */
interface Notice_Info {
    order: number,
    name: string,
    noticeList: Notice_Content[],
}
/**
 * 公告信息集合
 */
interface Notice_infos {
    systemState: number,
    notices: Notice_Info[]
}

export {
    Channel_Info,
    Channel_Infos,
    Role_Info,
    Notice_Content,
    Notice_Info,
    Notice_infos,
}

export default class LoginData {
    private _channelInfos: Channel_Infos = null;
    private _svrChannelInfos: onlinesvr.IGamesvrInfo[] = [];                // 返回的正式的服务器列表
    private _curSelectedChannelId: number = 0;                              // 当前选择的区服
    private _curSelectedBigChannelIndex: number = -1;                      // 当前展示的大区选项
    private _testChannelList: any[] = [];
    private _noticeData: any = null;                                       // 公告全部信息
    private _curSelectedNoticeId: number = 0;                               // 当前选择的大公告
    private _moduleInfos: ModuleInfo = null;
    /**
     * 初始化数据 区服列表信息 用户角色信息 公告
     */
    init() {
        // todo 获得服务器返回的数据
        this._svrChannelInfos = svrConfig.fetchGamesvrs;
        // logger.log(`loginDataManager init ${this._svrChannelInfos}`);

        // todo 测试数据
        this._testChannelList = [
            {
                ChannelId: 1,
                ChannelName: '举世无双1',
                isNew: false,
                isHot: true
            },
            {
                ChannelId: 2,
                ChannelName: '举世无双2',
                isNew: false,
                isHot: true
            },
            {
                ChannelId: 3,
                ChannelName: '举世无双3',
                isNew: false,
                isHot: false,
                isFixed: true
            },
            {
                ChannelId: 4,
                ChannelName: '举世无双4',
                isNew: false,
                isHot: false,
                isFixed: true,
            },
            {
                ChannelId: 5,
                ChannelName: '举世无双5',
                isNew: false,
                isHot: false
            },
            {
                ChannelId: 6,
                ChannelName: '举世无双6',
                isNew: false,
                isHot: true
            },
            {
                ChannelId: 7,
                ChannelName: '举世无双7',
                isNew: false,
                isHot: true
            },
            {
                ChannelId: 8,
                ChannelName: '举世无双8',
                isNew: false,
                isHot: false
            },
            {
                ChannelId: 9,
                ChannelName: '举世无双9',
                isNew: true,
                isHot: false
            },
            {
                ChannelId: 10,
                ChannelName: '举世无双10',
                isNew: true,
                isHot: false
            },
            {
                ChannelId: 11,
                ChannelName: '举世无双10',
                isNew: true,
                isHot: false
            },
            {
                ChannelId: 12,
                ChannelName: '举世无双10',
                isNew: true,
                isHot: false
            },
            {
                ChannelId: 13,
                ChannelName: '举世无双10',
                isNew: true,
                isHot: false
            },
            {
                ChannelId: 14,
                ChannelName: '举世无双10',
                isNew: true,
                isHot: false
            },
            {
                ChannelId: 15,
                ChannelName: '举世无双10',
                isNew: true,
                isHot: false
            },
            {
                ChannelId: 16,
                ChannelName: '举世无双10',
                isNew: true,
                isHot: false
            },
            {
                ChannelId: 17,
                ChannelName: '举世无双10',
                isNew: true,
                isHot: false
            },
            {
                ChannelId: 18,
                ChannelName: '举世无双10',
                isNew: true,
                isHot: false
            },
            {
                ChannelId: 19,
                ChannelName: '举世无双10',
                isNew: true,
                isHot: false
            },
            {
                ChannelId: 20,
                ChannelName: '举世无双10',
                isNew: true,
                isHot: false
            },

            {
                ChannelId: 21,
                ChannelName: '举世无双10',
                isNew: true,
                isHot: false
            },
            {
                ChannelId: 22,
                ChannelName: '举世无双10',
                isNew: true,
                isHot: false
            },
            {
                ChannelId: 23,
                ChannelName: '举世无双10',
                isNew: true,
                isHot: false
            },
        ];
        return;
    }
    /**
     * 处理下数据
     */
    dueData() {
        // 将服务器分组
        // if(this._channelInfos.ChannelInfos)
    }

    /**
     * 最近登录服务器信息
     */
    get lastLoginInfo(): Channel_Info {
        // 无最近登录
        if (this._channelInfos.LastChannelId == 0) {
            return this._channelInfos.ChannelInfos[this._channelInfos.ChannelInfos.length - 1];
        } else {
            return this.getChannelInfoByChannelId(this._channelInfos.LastChannelId);
        }
    }
    /**
     * 获得已有角色信息
     */
    get hasRoleInfo(): Role_Info[] {
        return this._channelInfos.hasRoleList;
    }
    /**
     * 获得当前选择的频道信息
     */
    get selectedChannelId(): number {
        return this._curSelectedChannelId;
    }
    /**
     * 设置当前选择的频道id
     */
    set selectedChannelId(ChannelId: number) {
        this._curSelectedChannelId = ChannelId;
    }
    /**
     * 获的当前选择的频道信息
     */
    get selectedChannelInfo(): Channel_Info {
        return {
            ChannelId: 1,
            ChannelName: "天下无双",
            isNew: false,
            isHot: true,
            isFixed: false,
        }
        return this.getChannelInfoByChannelId(this._curSelectedChannelId);
    }
    /**
     * 获得当前选择的频道信息
     */
    get curSelectChannelInfo(): onlinesvr.IGamesvrInfo {
        if (this._svrChannelInfos.length > 0) {
            return this._svrChannelInfos[this._svrChannelInfos.length - 1];
        }
        return null;
    }
    /**
     * 获得大关卡的个数
     */
    get bigChannelCount() {
        // 测试数据
        return Math.ceil(this._testChannelList.length / Channel_Max_Num)
        if (this._svrChannelInfos.length > 0) {
            return Math.ceil(this._svrChannelInfos.length / Channel_Max_Num);
        } else {
            logger.error('暂无频道数据');
            return null;
        }
    }

    get bigChannelIndex() {
        return this._curSelectedBigChannelIndex;
    }

    set bigChannelIndex(index: number) {
        this._curSelectedBigChannelIndex = index;
    }

    get showChannelInfo(): any {

        if (this.bigChannelIndex == -1) {
            return this._testChannelList.slice(0, 5);
        } else {
            return this._testChannelList.slice(this.bigChannelIndex * Channel_Max_Num, this.bigChannelIndex * Channel_Max_Num + 20);
        }
        return;
        // if (this.bigChannelIndex == -1) {
        //     return this._svrChannelInfos.slice(0, 5);
        // } else {
        //     return this._svrChannelInfos.slice(this.bigChannelIndex * LoginConst.Channel_Max_Num, this.bigChannelIndex * LoginConst.Channel_Max_Num + 19);
        // }
    }

    set noticeData(noticeData: any) {
        this._noticeData = noticeData;
    }

    get noticeData() {
        return this._noticeData;
    }
    /**
     * 更新当前选中的大公告id 只有不同时才会更新
     */
    set curSelectedNotice(noticeId: number) {
        if (this._curSelectedNoticeId != noticeId) {
            this._curSelectedNoticeId = noticeId;
        }
    }
    /**
     * 当前选中的大公告id
     */
    get curSelectedNotice() {
        return this._curSelectedNoticeId;
    }
    /**
     * 当前展示的Notice_Content
     */
    get curShowNotice(): Notice_Content[] {
        if (this._noticeData.ServerNotices) {
            return this._noticeData.ServerNotices.notices[this.curSelectedNotice].noticeList;
        } else {
            return null;
        }
    }
    get moduleConfigs(): ModuleInfo {
        return this._moduleInfos
    }

    set moduleConfigs(moduleInfos: ModuleInfo) {
        this._moduleInfos = moduleInfos;
        // this.dueModuleCofnigs
    }
    /**
     * 获得频道信息 通过频道id
     * @param ChannelId 
     * @returns 
     */
    getChannelInfoByChannelId(ChannelId: number) {
        if (this._channelInfos && this._channelInfos.ChannelInfos && this._channelInfos.ChannelInfos.length > 0) {
            for (let i = 0; i < this._channelInfos.ChannelInfos.length; ++i) {
                if (this._channelInfos.ChannelInfos[i].ChannelId == ChannelId) {
                    return this._channelInfos.ChannelInfos[i];
                }
            }
            logger.log(`loginDataManager getChannelInfoByChannelId 未查询到对应的channelId${ChannelId}`);
            return null;
        } else {
            logger.error(`loginDataManager getChannelInfoByChannelId 没有数据`);
            return null;
        }
    }
}
