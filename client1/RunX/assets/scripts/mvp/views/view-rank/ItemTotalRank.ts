import { RES_ICON_PRE_URL } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { configManager } from "../../../common/ConfigManager";
import { logger } from "../../../common/log/Logger";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { data } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { battleUIData } from "../../models/BattleUIData";
import { RANK_TYPE } from "./RankView";

const {ccclass, property} = cc._decorator;

type RankTypeData = data.IPVEAdventureScale|data.IPVEDreamScale|data.IPowerFiveHero

@ccclass
export default class ItemTotalRank extends cc.Component {
    @property(cc.Node) rootNode: cc.Node = null;
    // @property(cc.Label) title: cc.Label = null;
    // @property(cc.Label) desc: cc.Label = null;
    @property(cc.Sprite) headSp: cc.Sprite = null;
    @property(cc.Sprite) headFrameSp: cc.Sprite = null;
    @property(cc.Label) userName: cc.Label = null;
    @property(cc.Node) reward: cc.Node = null;
    @property(cc.Sprite) nameBg: cc.Sprite = null;
    @property(cc.Sprite) itemBg: cc.Sprite = null;
    @property(cc.Sprite) itemTitle: cc.Sprite = null;
    @property(cc.Sprite) powerSp: cc.Sprite = null;
    @property(cc.Sprite) passSp: cc.Sprite = null;
    @property(cc.Node) levelBg: cc.Node = null;
    @property(cc.Label) level: cc.Label = null;

    @property(cc.SpriteFrame) bgSps: cc.SpriteFrame[] = [];
    @property(cc.SpriteFrame) titleFontSps: cc.SpriteFrame[] = [];
    @property(cc.SpriteFrame) heroNameSps: cc.SpriteFrame[] = [];
    @property(cc.SpriteFrame) boxSps: cc.SpriteFrame[] = [];
    @property(cc.SpriteFrame) progressSps: cc.SpriteFrame[] = [];
    @property(cc.Node) titlePos: cc.Node[] = [];

    private _rankCfg: cfg.RankName = null;
    private _rewardCfgs: cfg.RankReward[] = null;
    private _rankData: RankTypeData= null
    private _clickHandler: Function = null;
    private _clickRewardCb: Function = null;

    private _spLoader: SpriteLoader = null;


    get rankType() {
        return this._rankCfg ? this._rankCfg.RankNameRewardList : -1;
    }

    init(rankCfg: cfg.RankName, rewardCfgs: cfg.RankReward[], rankData: RankTypeData, clickHandler?: Function, clickRewardCb?: Function) {
        this._rankCfg = rankCfg;
        this._rewardCfgs = rewardCfgs;
        this._rankData = rankData;
        this._clickHandler = clickHandler;
        this._clickRewardCb = clickRewardCb;
        this._spLoader = this._spLoader || new SpriteLoader();
        this._initUI();
        
        this._renderSpByIndex();
    }

    deInit() {
        this._spLoader.release();
    }

    reuse(...rest: any[]) {

    }

    unuse() {
        this.deInit();
    }

    private _initUI() {
        let rankCfg = this._rankCfg;
        // this.title.string = rankCfg.RankNameTitle || ''
        let userInfo = this._getUserInfo();
        this.userName.string = userInfo ? userInfo.Name : '';
        if(userInfo) {
            let headUrl = `${RES_ICON_PRE_URL.HEAD_IMG}/` + configUtils.getHeadConfig(userInfo.HeadID).HeadFrameImage;
            this._spLoader.changeSprite(this.headSp, headUrl);

            let frameUrl = `${RES_ICON_PRE_URL.HEAD_FRAME}/` + configUtils.getHeadConfig(userInfo.HeadFrameID).HeadFrameImage;
            this._spLoader.changeSprite(this.headFrameSp, frameUrl);

            this.level.string = String(bagDataUtils.getUserLVByExp(userInfo.Exp));
        } 
    }

    onClick() {
        this._clickHandler && this._clickHandler(this._rankCfg.RankNameRewardList, this);
    }

    onClickReward() {
        this._clickRewardCb && this._clickRewardCb(this._rankCfg.RankNameRewardList, this);
    }

    /**根据下标渲染精灵 */
    private _renderSpByIndex() {
        let index = this._rankCfg.RankNameRewardList - 1;
        //宝箱
        this.reward && (this.reward.getComponent(cc.Sprite).spriteFrame = this.boxSps[index]);
        //名称背景
        this.nameBg && (this.nameBg.spriteFrame = this.heroNameSps[index]);
        //整个背景
        this.itemBg && (this.itemBg.spriteFrame = this.bgSps[index]);
        //标题title
        this.itemTitle && (this.itemTitle.spriteFrame = this.titleFontSps[index]);

        this.powerSp.node.active = (index == 0);
        this.passSp.node.active = (index != 0);
        if (index > 0) {
            this.passSp.spriteFrame = this.progressSps[index];
        }

        if (index % 2 != 0) this.itemBg.node.y += 5;
        else this.itemBg.node.y -= 2;

        this.itemTitle.node.y = this.titlePos[index % 2].y;

        //战斗力或者通关关卡的显示
        let title = this._getDesc();
        let item: cc.Sprite = this.powerSp.node.active ? this.powerSp : this.passSp;
        let tilteLb: cc.Label = item.getComponentInChildren(cc.Label);
        if (tilteLb) tilteLb.string = title || `虚位以待`;

        let userInfo = this._getUserInfo();
        if(!userInfo) {
            //如果没有数据的情况下，头像和名称隐藏
            this.headSp.node.active = false;
            this.headFrameSp.node.active = false;
            this.nameBg.node.active = false;
            this.levelBg.active = false;
        }
    }

    private _getDesc() {
        if(!this._rankData) return '';
        let type = this._rankCfg.RankNameRewardList;
        if(type == RANK_TYPE.FIVE) {
            let rankData: data.IPowerFiveHero = this._rankData as data.IPowerFiveHero;
            return `${rankData ? (rankData.Power ? utils.longToNumber(rankData.Power) : 0) : 0}`;
        }

        if(type == RANK_TYPE.MAO_XIAN) {
            let rankData: data.IPVEAdventureScale = this._rankData as data.IPVEAdventureScale;
            let lessonID = rankData ? (rankData.LessonId ? rankData.LessonId : 1001001) : 1001001;
            let lessonCfg: cfg.AdventureLesson = configUtils.getLessonConfig(lessonID);
            let chapterCfg: cfg.AdventureChapter = configUtils.getChapterConfig(lessonCfg.LessonChapter);
            return `${chapterCfg.ChapterName.match(/\d+/)[0]} - ${lessonCfg.LessonName.match(/\d+/)[0]}`;
        }

        if(type == RANK_TYPE.TAI_XU_HUAI_JING) {
            let rankData: data.IPVEDreamScale = this._rankData as data.IPVEDreamScale;
            let configs = configManager.getConfigs("dreamlandLesson");
            let lessonID = rankData ? (rankData.LessonId || 2001001) : 2001001;
            let lessonCfg: cfg.PVEDreamlandLesson = configs[`${lessonID}`];
            let chapterCfgs = configManager.getConfigs('dreamlandChapter');
            let chapterCfg: cfg.PVEDreamlandChapter = chapterCfgs[`${lessonCfg.PVEDreamlandLessonChapter}`];
            return `${chapterCfg.PVEDreamlandChapterName.match(/\d+/)[0]} - ${lessonCfg.PVEDreamlandLessonName.match(/\d+/)[0]}`;
        }

        if(type == RANK_TYPE.PURGATORY) {
            let progress: number = (this._rankData as data.ITrialPurgatoryScale).Progress;
            return `${progress}层`;
        }

        return '';
    }

    private _getUserInfo() : data.IRankUser {
        let type = this._rankCfg.RankNameRewardList;
        if(!this._rankData) return null;

        if(type == RANK_TYPE.FIVE) {
            return (this._rankData as data.IPowerFiveHero).User;
        }

        if(type == RANK_TYPE.MAO_XIAN) {
            return (this._rankData as data.IPVEAdventureScale).User;
        }

        if(type == RANK_TYPE.TAI_XU_HUAI_JING) {
            return (this._rankData as data.IPVEDreamScale).User;
        }

        if(type == RANK_TYPE.PURGATORY) {
            return (this._rankData as data.ITrialPurgatoryScale).User;
        }
        return null;
    }
}
