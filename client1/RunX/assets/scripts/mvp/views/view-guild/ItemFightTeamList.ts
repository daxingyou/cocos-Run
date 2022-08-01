import { RES_ICON_PRE_URL, VIEW_NAME } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { ItemHeroHeadSquarePool } from "../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { guildData } from "../../models/GuildData";
import ItemHeadSquare from "../view-item/ItemHeadSquare";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemFightTeamList extends cc.Component {
    @property(cc.Sprite) head: cc.Sprite = null;
    @property(cc.Sprite) headFrame: cc.Sprite = null;
    @property(cc.Label) nameLB: cc.Label = null;
    @property(cc.Label) lvLB: cc.Label = null;
    @property(cc.Label) inspireCountLB: cc.Label = null;
    @property(cc.Label) selfPowerLB: cc.Label = null;
    @property(cc.Node) selfPowerTips: cc.Node = null;
    @property(cc.Node) notJoinTips: cc.Node = null;
    @property(cc.Node) fightTeamContent: cc.Node = null;

    private _userId: string = '0';
    private _loadView: Function = null;
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    start() {

    }

    deInit() {
        this._spriteLoader.release();
        this._clearSquareHead();
    }

    unuse() {
        this.deInit();
    }

    reuse() {

    }

    setData(userId: string, loadView: Function) {
        this._userId = userId;
        this._loadView = loadView;
        this._refreshView();
    }

    private _refreshView() {
        const fightTeamInfo = guildData.bossInfo.FactionExpeditionHeroList[this._userId];
        this.selfPowerTips.active = !!fightTeamInfo;
        this.selfPowerLB.node.active = !!fightTeamInfo;
        this.fightTeamContent.active = !!fightTeamInfo;
        this.notJoinTips.active = !fightTeamInfo;
        if(fightTeamInfo) {
            this.selfPowerLB.string = `+${this._getSelfFightPower()}`;

            for(let i = 0; i < fightTeamInfo.HeroIDList.length; ++i) {
                let heroId = fightTeamInfo.HeroIDList[i];
                let squareHead = this.fightTeamContent.children[i];
                let squareHeadCmp = null;
                if(!squareHead) {
                    squareHeadCmp = ItemHeroHeadSquarePool.get();
                    squareHead = squareHeadCmp.node;
                    this.fightTeamContent.addChild(squareHead);
                    squareHead.scale = 0.7;
                } else  {
                    squareHeadCmp = squareHead.getComponent(ItemHeadSquare);
                }
                let clickHandle = () => {
                    this._loadView(VIEW_NAME.TIPS_HERO, heroId);
                };
                if(squareHeadCmp) {
                    squareHeadCmp.init(heroId, clickHandle, null);
                }
            }
        } else {
            this._clearSquareHead();
        }

        this.inspireCountLB.string = `鼓舞${fightTeamInfo && fightTeamInfo.UrgeCount ? Number(fightTeamInfo.UrgeCount) : 0}次`;

        const commonInfo = guildData.getMemberByUserId(this._userId);
        this.nameLB.string = `${commonInfo.Name}`
        this.lvLB.string = `${this._getUserLv(commonInfo.Exp ? Number(commonInfo.Exp) : 0)}`;
        // 更换英雄头像
        let headUrl = `${RES_ICON_PRE_URL.HEAD_IMG}/` + configUtils.getHeadConfig(commonInfo.HeadID).HeadFrameImage;
        let frameUrl = `${RES_ICON_PRE_URL.HEAD_FRAME}/` + configUtils.getHeadConfig(commonInfo.HeadFrameID).HeadFrameImage;
        this._spriteLoader.changeSpriteP(this.head, headUrl);
        this._spriteLoader.changeSpriteP(this.headFrame, frameUrl);
    }

    private _clearSquareHead() {
        let children = [...this.fightTeamContent.children]
        children.forEach(_c => {
            let cmp = _c.getComponent(ItemHeadSquare);
            ItemHeroHeadSquarePool.put(cmp);
        });
    }

    private _getSelfFightPower(): number {
        let selfFightInfo = guildData.bossInfo.FactionExpeditionHeroList[this._userId];
        let inspireAdd = configUtils.getConfigModule('GuildMonsterCostAddFight') / 10000;
        let inspireCount = guildData.getGuildInspireCount();
        let power = 0;
        if(selfFightInfo) {
            power = selfFightInfo && selfFightInfo.Power 
            ? Number(selfFightInfo.Power) : 0;
        }
        return Math.round(power * (1 + inspireCount * inspireAdd));
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

}
