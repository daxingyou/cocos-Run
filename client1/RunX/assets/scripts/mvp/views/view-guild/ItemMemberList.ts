import { RES_ICON_PRE_URL } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { data } from "../../../network/lib/protocol";
import { guildData } from "../../models/GuildData";
import { serverTime } from "../../models/ServerTime";

const positionNames = ['会长', '副会长', '普通成员'];

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemMemberList extends cc.Component {
    @property(cc.Sprite) headSp: cc.Sprite = null;
    @property(cc.Sprite) headFrame: cc.Sprite = null;
    @property(cc.Label) lvLB: cc.Label = null;
    @property(cc.Label) nameLB: cc.Label = null;
    @property(cc.Label) combatLB: cc.Label = null;
    @property(cc.Label) positionLB: cc.Label = null;
    @property(cc.Label) onlineStateLB: cc.Label = null;
    @property(cc.Label) taskCount: cc.Label = null;

    private _info: data.IFactionMember = null;
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    onInit() {

    }

    unuse () {
        this.deInit();
    }

    deInit() {
        this._spriteLoader.release();
    }

    setData(info: data.IFactionMember) {
        this._info = info;
        this._refreshView();
    }

    private _refreshView() {
        this.lvLB.string = this._getUserLv(this._info.Exp) + '';
        // TODO 需要接入参与任务数量 暂时不用了
        // this.taskCount.string = `参与任务：${0}`;
        this.nameLB.string = this._info.Name;
        this.combatLB.string = `战力：${this._info.Power}`;
        let memberPosition = guildData.getMemberTypeByUid(this._info.UserID);
        this.positionLB.string = positionNames[memberPosition - 1];
        let color = cc.Color.WHITE;
        if(this._info.IsOnline) {
            color = cc.color().fromHEX("#375811");
            this.onlineStateLB.string = '在线';
        } else {
            color =  cc.color().fromHEX("#434343");
            this.onlineStateLB.string = this._getLevelTime(this._info.LastOnlineTime);
        }
        this.onlineStateLB.node.color = color;
        // 更换英雄头像
        let headUrl = `${RES_ICON_PRE_URL.HEAD_IMG}/` + configUtils.getHeadConfig(this._info.HeadID).HeadFrameImage;
        let frameUrl = `${RES_ICON_PRE_URL.HEAD_FRAME}/` + configUtils.getHeadConfig(this._info.HeadFrameID).HeadFrameImage;
        this._spriteLoader.changeSpriteP(this.headSp, headUrl);
        this._spriteLoader.changeSpriteP(this.headFrame, frameUrl);
    }

    private _getUserLv(exp: number): number {
        let expConfigs = configUtils.getLevelExpConfigsByType(3);
        if (exp) {
            let expCount: number = 0;
            for (const k in expConfigs) {
                expCount += expConfigs[k].LevelExpNeedNum;
                if (exp < expCount) {
                    return Number(k);
                }
            }
            return utils.getUserMaxLv();
        } else {
           return 1;
        }
    }

    private _getLevelTime(loginOutTime: number): string {
        let levelTime = serverTime.currServerTime() - Number(loginOutTime);
        let min: number = levelTime / 60;
        if(min < 60) {
            if(min <= 1) {
                return '1分钟前';
            } else {
                return `${Math.floor(min)}分钟前`;
            }
        }
        let hour: number = levelTime / 60 / 60;
        if(hour < 24) {
            if(hour <= 1) {
                return '1小时前';
            } else {
                return `${Math.floor(hour)}小时前`;
            }
        }
        let day: number = levelTime / 60 / 60 / 24;
        if(day >= 7) {
            return '7天前';
        } else {
            return `${Math.floor(day)}天前`;
        }
    }
}
