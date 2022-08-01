import BaseModel from "./BaseModel";


/************* 频道相关的 ******************** */
/**
 * 频道信息
 */
interface ChannelInfo {
    id: number,
    url?: string,
    name: string,
    state?: number,
}

/**
 * 频道信息
 */
interface ChannelInfos {
    LastChannelId: number,
    ChannelInfos: ChannelInfo[],
    hasRoleList: RoleInfo[]
}

/**
 * 角色信息
 */
interface RoleInfo {
    ChannelId: number,
    Level: number,
}

/**
 * 公告内容
 */
interface NoticeContent {
    title: string,
    content: string
}
/**
 * 公告信息
 */
interface NoticeInfo {
    name: string,
    picture: string,
    noticeList: NoticeContent,
}
/**
 * 公告信息集合
 */
interface NoticeInfos {
    systemState: number,
    notices: NoticeInfo[]
}

class LoginData extends BaseModel {
    private _noticeDatas: any = null;                                   // 公告全部信息

    /**
     * ServerNotices 公告字段
     */
    get noticeDatas() {
        return this._noticeDatas;
    }

    init() {
    }

    deInit() {
    }

    updateNotice(noticeDatas: any) {
        this._noticeDatas = noticeDatas;
    }
}

let loginData = new LoginData();
export { 
    loginData,

    ChannelInfo,
    ChannelInfos,
    RoleInfo,
    NoticeContent,
    NoticeInfo,
    NoticeInfos,
}