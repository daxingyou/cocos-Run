import { GuildDailyNews } from "../../../app/AppType";
import { configUtils } from "../../../app/ConfigUtils";
import List from "../../../common/components/List";
import RichTextEx from "../../../common/components/rich-text/RichTextEx";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { guildEvent } from "../../../common/event/EventData";
import { data } from "../../../network/lib/protocol";
import { guildData } from "../../models/GuildData";

const News_Template_List = [
    '玩家【%d】创建了公会【%d】',
    '会长【%d】将【%d】任命为副会长',
    '会长【%d】将【%d】调整为普通成员',
    '欢迎【%d】加入公会',
    '很遗憾,【%d】离开了公会',
    '会长【%d】将公会名称变更为【%d】',
    '【%d】将玩家【%d】踢出了公会,理由为:',
];

const Kick_Out_Reason_List = [
    '长时间未上线；',
    '不参与公会任务；',
    '调整成员结构；'
];

const {ccclass, property} = cc._decorator;

@ccclass
export default class GuildDailyNewsView extends ViewBaseComponent {
    @property(List) newsList: List = null;

    private _infos: GuildDailyNews[] = [];
    onInit() {
        eventCenter.register(guildEvent.UPDATE_DAILY_NEWS, this, this._refreshView);
        this._infos = guildData.dailyNewsInfo;
        this._refreshView();
    }

    onRelease() {
        eventCenter.unregisterAll(this);
        this.newsList._deInit();
    }

    private _refreshView() {
        this.newsList.numItems = this._infos.length;
    }

    onListItemRenderEvent(item: cc.Node, index: number) {
        let data = this._infos[index];
        let label = item.getComponent(cc.Label);
        if(data.ItemType == 1) {
            // 普通消息
            label.fontSize = 20;
            label.lineHeight = 26;
            let str = this._getNewsString(data);
            let string = this._getHourTime(data.Time);
            string += ` ${str}`;
            label.string = ` ${string}`;
        } else {

            label.fontSize = 26;
            label.lineHeight = 32;
            label.string = `${this._getDayTime(data.Time)}`;

        }
        let line = Math.ceil(label.string.length / 25);
    }
    /**
     * 模拟C printf
     * @param news
     * @returns
     */
    private _getNewsString(news: GuildDailyNews) {
        let count: number = 0;
        let str = News_Template_List[news.NewsType];
        let findIndex = str.indexOf('【%d');
        while(findIndex > -1) {
            let preStr = str.slice(0, findIndex + 1);
            let endStr = str.slice(findIndex + 3, str.length);
            let addStr = news.Reasons[count];
            str = preStr.concat(addStr, endStr);
            count++;
            findIndex = str.indexOf('【%d');
        }
        count = 0;
        if(data.FACTION_NEWS_FEED_TYPE.KICK_OUT_MEMBER == news.NewsType) {
            let reasons = news.Reasons.slice(2);
            for(let i = 0; i < reasons.length; ++i) {
                let string = this._getKickOutReason(Number(reasons[i]));
                str = str.concat(string, ';');
            }
        }
        return ` ${str}`
    }

    private _getDayTime(time: number): string {
        let date = new Date(time * 1000);
        return date.getFullYear().toString() + '年' + (date.getMonth() + 1).toString() + '月' + date.getDate().toString() + '日';
    }

    private _getHourTime(time: number): string {
        let date = new Date(time * 1000);
        let h = date.getHours();
        let hStr : string = h < 10 ?  `0${h}` : `${h}`;
        let m = date.getMinutes();
        let mStr : string = m < 10 ?  `0${m}` : `${m}`;
        return `${hStr}:${mStr}`;
    }

    private _getKickOutReason(dialogId: number): string {
        let cfg = configUtils.getDialogCfgByDialogId(Number(dialogId));
        if(cfg) {
            return cfg.DialogText;
        }
        return '';
    }
}
