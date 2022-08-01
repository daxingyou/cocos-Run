import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import List from "../../../common/components/List";
import RichTextEx from "../../../common/components/rich-text/RichTextEx";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { cfg } from "../../../config/config";
import { data } from "../../../network/lib/protocol";
import { guildData } from "../../models/GuildData";
import ItemFightTeamList from "./ItemFightTeamList";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GuildBossTeamListView extends ViewBaseComponent {
    @property(cc.Label) bossPowerLB: cc.Label = null;
    @property(cc.Label) ourPowerLB: cc.Label = null;
    @property(RichTextEx) joinCountRichText: RichTextEx = null;
    @property(List) fightTeamList: List = null;

    private _loadView: Function = null;
    private _members: data.IFactionMember[] = [];
    onInit(loadView: Function) {
        this._loadView = loadView;
        this._refreshList();
        this._refreshCommonView();
    }

    onRelease() {
        this.fightTeamList._deInit();
    }

    private _refreshCommonView() {
        const guildMemberCount = guildData.memberList.length;
        const joinMemberCount = utils.getObjLength(guildData.bossInfo.FactionExpeditionHeroList);
        this.joinCountRichText.string = `<color=#E97D23>${joinMemberCount}</color><color=#82663D>/${guildMemberCount}</color>`;
        this.ourPowerLB.string = `${this._getOurPower()}`;
        const order = (guildData.bossInfo.Order ? guildData.bossInfo.Order : 0) + 1;
        const lv = guildData.bossInfo.Level;
        const monsterCfg: cfg.GuildMonster = configManager.getOneConfigByManyKV('guildMonster', 'GuildMonsterLevel', lv, 'GuildMonsterOrder', order);
        if(monsterCfg) {
            this.bossPowerLB.string = `${monsterCfg.GuildMonsterNeedNum}`;
        }
    }

    private _refreshList() {
        this._members = this._getMemberList();
        this.fightTeamList.numItems = guildData.memberList.length;
    }

    onFightTeamItemRender(item: cc.Node, index: number) {
        let userId = this._members[index].UserID;
        let cmp = item.getComponent(ItemFightTeamList);
        cmp.setData(userId, this._loadView);
    }

    private _getOurPower(): number {
        let inspireAdd: number = configUtils.getConfigModule('GuildMonsterCostAddFight') / 10000;
        let fightGuildMembers = guildData.bossInfo.FactionExpeditionHeroList;
        let guildPower: number = 0;
        let inspireCount: number = 0;
        for(const k in fightGuildMembers) {
            // TODO 需要乘鼓舞的战力
            guildPower += fightGuildMembers[k].Power ? Number(fightGuildMembers[k].Power) : 0;
            inspireCount += fightGuildMembers[k].UrgeCount ? Number(fightGuildMembers[k].UrgeCount) : 0;
        }
        guildPower = Math.round(guildPower * (1 + inspireCount * inspireAdd));
        return guildPower;
    }

    private _getMemberList() {
        let guildMembers: data.IFactionMember[] = utils.deepCopyArray(guildData.memberList);
        guildMembers.sort((_a, _b) => {
            const _aExpeditonInfo = guildData.bossInfo.FactionExpeditionHeroList[Number(_a.UserID)];
            const _bExpeditonInfo = guildData.bossInfo.FactionExpeditionHeroList[Number(_b.UserID)];
            let aPower = _aExpeditonInfo && _aExpeditonInfo.Power ? Number(_aExpeditonInfo.Power) : 0;
            let bPower = _bExpeditonInfo && _bExpeditonInfo.Power ? Number(_bExpeditonInfo.Power) : 0;
            if(Number(aPower) == Number(bPower)) {
                let aInspireCount = _aExpeditonInfo && _aExpeditonInfo.UrgeCount ? Number(_aExpeditonInfo.UrgeCount) : 0;
                let bInspireCount = _bExpeditonInfo && _bExpeditonInfo.UrgeCount ? Number(_bExpeditonInfo.UrgeCount) : 0;
                if(aInspireCount == bInspireCount) {
                    return Number(_b.Exp) - Number(_a.Exp);
                } else {
                    return bInspireCount - aInspireCount;
                }
            } else {
                return bPower - aPower;
            }
        });
        return guildMembers;
    }

}
