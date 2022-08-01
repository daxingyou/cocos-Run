import { RES_ICON_PRE_URL } from "../../../app/AppConst";
import { configUtils } from "../../../app/ConfigUtils";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { pvpData } from "../../models/PvpData";
import { data } from "../../../network/lib/protocol";
import { configManager } from "../../../common/ConfigManager";
import { userData } from "../../models/UserData";
import { utils } from "../../../app/AppUtils";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PVPImmortalsRankItem extends cc.Component {
    @property(cc.Label) userName: cc.Label = null;
    @property(cc.Label) lv: cc.Label = null;
    @property(cc.Label) power: cc.Label = null;
    @property(cc.Sprite) head: cc.Sprite = null;
    @property(cc.Sprite) headFrame: cc.Sprite = null;
    @property(cc.Node) rankNode: cc.Node = null;
    @property(cc.Label) winCnt: cc.Label = null;
    @property(cc.Label) gardeTxt: cc.Label = null;
    @property(cc.Sprite) gardeIcon: cc.Sprite = null;

    private _rank: number = 0;
    private _fairyRank: data.IPVPFairyIntegral = null;
    private _sprLoader: SpriteLoader = new SpriteLoader();

    init(fight: data.IPVPFairyIntegral, self?: boolean) {
        let uId = self ? userData.uId : fight.User.UserID;
        this._fairyRank = fight;
        this._rank = pvpData.getUserFairyRank(uId);
        if (!self) this.showItem();
        if (self) this.showSelfItem();
    }

    reuse() {

    }

    unuse() {
        this._sprLoader.release();
    }

    showItem() {
        let userInfo = this._fairyRank.User;
        let headUrl = configUtils.getHeadConfig(userInfo.HeadID).HeadFrameImage;
        let frameUrl = configUtils.getHeadConfig(userInfo.HeadFrameID).HeadFrameImage;
        let rank1 = this.rankNode.getChildByName("rank_1");
        let rank2 = this.rankNode.getChildByName("rank_2");
        let rank3 = this.rankNode.getChildByName("rank_3");
        let rankTxt = this.rankNode.getChildByName("rank_text");
        let cfg = this.getSelfCfg();

        this.userName.string = userInfo.Name;
        this.lv.string = `${this.calUserLv(userInfo.Exp)}`
        this.power.string = `${utils.longToNumber(this._fairyRank.Power)}`;
        this.winCnt.string = `${this._fairyRank.WinTimes}`;
        this._sprLoader.changeSprite(this.head, `${RES_ICON_PRE_URL.HEAD_IMG}/${headUrl}`);
        this._sprLoader.changeSprite(this.headFrame, `${RES_ICON_PRE_URL.HEAD_FRAME}/${frameUrl}`);

        // 排名
        rank1.active = this._rank==1;
        rank2.active = this._rank==2;
        rank3.active = this._rank==3;
        rankTxt.active = !this._rank || this._rank>3;
        rankTxt.getComponent(cc.Label).string = `${this._rank || "未上榜"}`;
        // 段位积分
        this.gardeTxt.string = `${cfg.PVPImmortalsRankName}\n积分：${this._fairyRank.Integral}`
        this._sprLoader.changeSprite(this.gardeIcon, `textures/pvp-image/${cfg.PVPImmortalsRankIcon}`)
    }

    showSelfItem() {
        let fairyData = pvpData.fairyData;
        let headUrl = configUtils.getHeadConfig(userData.headId).HeadFrameImage;
        let frameUrl = configUtils.getHeadConfig(userData.frameId).HeadFrameImage; 
        let rank1 = this.rankNode.getChildByName("rank_1");
        let rank2 = this.rankNode.getChildByName("rank_2");
        let rank3 = this.rankNode.getChildByName("rank_3");
        let rankTxt = this.rankNode.getChildByName("rank_text");
        let cfg = this.getSelfCfg();

        this.userName.string = userData.accountData.Name;
        this.lv.string = `${userData.lv}`
        this.power.string = `${userData.capability}`;
        this.winCnt.string = `${fairyData.WinTimes}`;
        this._sprLoader.changeSprite(this.head, `${RES_ICON_PRE_URL.HEAD_IMG}/${headUrl}`);
        this._sprLoader.changeSprite(this.headFrame, `${RES_ICON_PRE_URL.HEAD_FRAME}/${frameUrl}`);
        // 排名
        rank1.active = this._rank == 1;
        rank2.active = this._rank == 2;
        rank3.active = this._rank == 3;
        rankTxt.active = !this._rank || this._rank > 3;
        rankTxt.getComponent(cc.Label).string = `${this._rank || "未上榜"}`;
        // 段位积分
        this.gardeTxt.string = `${cfg.PVPImmortalsRankName}\n积分：${fairyData.Integral}`
        this._sprLoader.changeSprite(this.gardeIcon, `textures/pvp-image/${cfg.PVPImmortalsRankIcon}`)
    }

    calUserLv(exp: number): number {
        let expConfigs = configUtils.getLevelExpConfigsByType(3);
        let level: number = 1;
        if (exp) {
            let expCount: number = 0;
            let key: number = 0;
            for (const k in expConfigs) {
                expCount += expConfigs[k].LevelExpNeedNum;
                if (exp < expCount) {
                    level = Number(k);
                    break;
                }
                level = Number(k);
            }
        }
        return level;
    }

    getSelfCfg() {
        let cfgs: cfg.PVPImmortals[] = configManager.getConfigList("pvpImmortals");
        let integral = pvpData.fairyData.Integral;
        let rank = this._rank;
        let minRank = this.calMinRank();
        let immortalCfg: cfg.PVPImmortals;
        if (rank && rank <= minRank) {
            for (let _k in cfgs) {
                let cfg = cfgs[_k];
                let lower = parseInt(cfg.PVPImmortalsRankSection.split(";")[0]);
                let upper = parseInt(cfg.PVPImmortalsRankSection.split(";")[1]);
                if (cfg.PVPImmortalsRankType == 2
                    && rank >= lower && rank <= upper) {
                    immortalCfg = cfg;
                    break;
                }
            }
        } else {
            for (let _k in cfgs) {
                let cfg = cfgs[_k];
                let lower = parseInt(cfg.PVPImmortalsRankSection.split(";")[0]);
                let upper = parseInt(cfg.PVPImmortalsRankSection.split(";")[1]);
                if (cfg.PVPImmortalsRankType == 1
                    && integral >= lower && integral <= upper) {
                    immortalCfg = cfg;
                    break;
                }
            }
        }
        return immortalCfg;
    }

    calMinRank() {
        let cfgs: cfg.PVPImmortals[] = configManager.getConfigList("pvpImmortals");
        let minRank = 0;
        for (let _k in cfgs) {
            let cfg = cfgs[_k];
            if (cfg.PVPImmortalsRankType == 2) {
                let lower = parseInt(cfg.PVPImmortalsRankSection.split(";")[0]);
                let upper = parseInt(cfg.PVPImmortalsRankSection.split(";")[1]);
                minRank = Math.max(minRank, lower, upper);
            }
        }
        return minRank;
    }
}
