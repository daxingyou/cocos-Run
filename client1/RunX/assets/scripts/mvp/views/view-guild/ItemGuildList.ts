import { configUtils } from "../../../app/ConfigUtils";
import { configManager } from "../../../common/ConfigManager";
import { cfg } from "../../../config/config";
import { gamesvr } from "../../../network/lib/protocol";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemGuildList extends cc.Component {
    @property(cc.Label) lvLb: cc.Label = null;
    @property(cc.Label) nameLb: cc.Label = null;
    @property(cc.Label) countLb: cc.Label = null;
    @property(cc.Node) autoApprove: cc.Node = null;
    @property(cc.Node) ndSelect: cc.Node = null;

    private _guildInfo: gamesvr.FactionSearchInfo = null;
    onInit(guildInfo: gamesvr.FactionSearchInfo) {
        this._guildInfo = guildInfo;
        this._refreshView();
    }

    unuse() {
    }

    private _refreshView() {
        let guildLv: number = this._getGuildLv(Number(this._guildInfo.Exp));
        this.ndSelect.active = false;
        this.lvLb.string = `${guildLv}级`;
        this.nameLb.string = `${this._guildInfo.Name}`;
        this.countLb.string = `${this._guildInfo.MemberCount}/${this._getGuildMemberMax(guildLv)}`;
        this.autoApprove.active = this._guildInfo.IsAutoAccept;
    }


    private _getGuildLv(exp: number) {
        let lv: number = 1;
        let guildLevels: {[k: string]: cfg.GuildLevel} = configManager.getConfigs('guildLevel');
        if(guildLevels) {
            let needExp = 0;
            for(const k in guildLevels) {
                if(guildLevels[k].GuildLevelExp) {
                    needExp += guildLevels[k].GuildLevelExp;
                    if(exp >= needExp) {
                        lv = guildLevels[k].GuildLevelID + 1;
                    }
                }
            }
        }
        return lv;
    }

    private _getGuildMemberMax(lv: number) {
        let cfg = configUtils.getGuildLevelCfg(lv);
        return cfg.GuildLevelPeopleNum;
    }

    setSelect(select: boolean) {
        this.ndSelect.active = select;
    }
}
