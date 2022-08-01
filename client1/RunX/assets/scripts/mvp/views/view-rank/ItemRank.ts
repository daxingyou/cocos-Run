import { RES_ICON_PRE_URL } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { configManager } from "../../../common/ConfigManager";
import { ItemHeroHeadSquarePool } from "../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { data } from "../../../network/lib/protocol";
import ItemHeadSquare from "../view-item/ItemHeadSquare";
import { RANK_TYPE } from "./RankView";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemRank extends cc.Component {
    @property(cc.Label)             rankIndexLb: cc.Label = null;
    @property(cc.Sprite)            rankIndexSp: cc.Sprite = null;
    @property([cc.SpriteFrame])     rankIndexImgs: cc.SpriteFrame[] = [];
    @property(cc.Sprite)            headBgSp: cc.Sprite = null;
    @property(cc.Sprite)            headSp: cc.Sprite = null;
    @property(cc.Label)             useLvLb: cc.Label = null;
    @property(cc.Label)             useNameLb: cc.Label = null;
    @property(cc.Label)             powerLb: cc.Label = null;
    @property(cc.Node)              allHeroCountIcon: cc.Node = null;
    @property(cc.Label)             allHeroCountLb: cc.Label = null;
    @property(cc.Node)              fiveHerosParent: cc.Node = null;
    @property(cc.Node)              oneHeroParent: cc.Node = null;
    @property(cc.Label) progressDesc: cc.Label = null;
    @property(cc.Node) powerTag: cc.Node = null;
    @property(cc.SpriteFrame) itemBgSps: cc.SpriteFrame[] =[];

    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _rankData: any = null;
    private _isMySelf: boolean = false;
    private _onClick: Function = null;

    onInit(rankData: any, rankType: RANK_TYPE, index: number, isMyself: boolean = false, onClick: Function) {
        this._onClick = onClick;
        this._isMySelf = isMyself;
        this._rankData = rankData;
        this.refreshView(rankType, index, isMyself);
    }

    onClickItem () {
        this._onClick && this._onClick(this._isMySelf, this._rankData)
    }

    deInit() {
        this._spriteLoader && this._spriteLoader.release();
        let fiveChildren = [...this.fiveHerosParent.children];
        fiveChildren.forEach(_c => {
            let cmp = _c.getComponent(ItemHeadSquare);
            ItemHeroHeadSquarePool.put(cmp);
        });

        let oneChildren = [...this.oneHeroParent.children];
        oneChildren.forEach(_c => {
            let cmp = _c.getComponent(ItemHeadSquare);
            ItemHeroHeadSquarePool.put(cmp);
        });
    }

    reuse() {

    }

    unuse() {
        this.deInit();
    }

    refreshView(rankType: RANK_TYPE, index: number, isMyself: boolean) {
        // common显示
        // this.node.color = isMyself ? new cc.Color().fromHEX('#FFFF33') : new cc.Color().fromHEX('#FFFFFF');
        let itemBg = this.node.getComponent(cc.Sprite)
        if (itemBg) {
            itemBg.spriteFrame = isMyself ? this.itemBgSps[1] : this.itemBgSps[0];
        }
        this.rankIndexLb.node.opacity = (index >= 0 && index > 2) || index < 0 ? 255 : 0;
        // this.rankIndexSp.node.opacity = index >= 0 && index <= 2 ? 255 : 0;

        this.rankIndexLb.fontSize = index > 9 ? 18 : 24;
        this.rankIndexLb.lineHeight = index > 9 ? 18 : 24;

        let rankMc = Math.min(index, 3);
        this.rankIndexSp.spriteFrame = this.rankIndexImgs[rankMc]
        if(index > 2) {
            this.rankIndexLb.string = `${index + 1}`;
        } else if(index >= 0) {
            // this.rankIndexSp.spriteFrame = this.rankIndexImgs[index];
        } else {
            this.rankIndexLb.string = `未上榜`;
            this.rankIndexSp.spriteFrame = this.rankIndexImgs[3];
            this.rankIndexLb.fontSize = 16;
            this.rankIndexLb.lineHeight = 16;
        }


        
        this.useNameLb.string = `${this._rankData.User.Name}`;
        this.useLvLb.string = `${this.getUserLv(this._rankData.User.Exp)}`;
        this.powerLb.string = `${this._rankData.Power || ''}`;
        let headUrl = `${RES_ICON_PRE_URL.HEAD_IMG}/` + configUtils.getHeadConfig(this._rankData.User.HeadID).HeadFrameImage;
        let frameUrl = `${RES_ICON_PRE_URL.HEAD_FRAME}/` + configUtils.getHeadConfig(this._rankData.User.HeadFrameID).HeadFrameImage;
        this._spriteLoader.changeSpriteP(this.headBgSp, frameUrl).catch(() => { this.headBgSp.spriteFrame = null; });
        this._spriteLoader.changeSpriteP(this.headSp, headUrl).catch(() => { this.headSp.spriteFrame = null; });

        // 单独模块显示
        this.fiveHerosParent.active = RANK_TYPE.FIVE == rankType;
        this.allHeroCountLb.node.active = RANK_TYPE.ALL == rankType;
        this.allHeroCountIcon.active = RANK_TYPE.ALL == rankType;
        this.oneHeroParent.active = RANK_TYPE.ONE == rankType;

        let isShowPower = (RANK_TYPE.MAO_XIAN == rankType || RANK_TYPE.TAI_XU_HUAI_JING == rankType || RANK_TYPE.PURGATORY == rankType);
        this.progressDesc.node.parent.active = isShowPower;
        this.powerTag.active = this.powerLb.node.active = !isShowPower;

        switch(rankType) {
            case RANK_TYPE.FIVE:
                this.refreshFive();
                break;
            case RANK_TYPE.ALL:
                this.refreshAll();
                break;
            case RANK_TYPE.ONE:
                this.refreshOne();
                break;
            case RANK_TYPE.MAO_XIAN:
                this.refreshMaoXian();
                break;
            case RANK_TYPE.TAI_XU_HUAI_JING:
                this.refreshTaiXuHuanJing();
                break;
            case RANK_TYPE.PURGATORY:
                this.refreshPurgatory();
                break;
            default:
                break;
        }
        this.refreshPower();
    }

    refreshPower() {
        this.powerLb.string = `${this._rankData.Power}`;
    }

    refreshFive() {
        let rankData: data.IPowerFiveHero = this._rankData as data.IPowerFiveHero;
        let count: number = rankData.HeroIDList.length;
        if(this.fiveHerosParent.childrenCount > count) {
            count = this.fiveHerosParent.childrenCount;
        }
        for(let i = 0; i < count; ++i) {
            let heroItem: cc.Node = this.fiveHerosParent.children[i];
            let heroId: number = rankData.HeroIDList[i];
            let itemHeadSquare = null;
            if(i < rankData.HeroIDList.length) {
                if(!cc.isValid(heroItem)) {
                    itemHeadSquare = ItemHeroHeadSquarePool.get();
                    heroItem = itemHeadSquare.node;
                    this.fiveHerosParent.addChild(heroItem);
                } else {
                    itemHeadSquare = heroItem.getComponent(ItemHeadSquare);
                }
                heroItem.scale = 1.2;
                if(itemHeadSquare) {
                    itemHeadSquare.init(heroId);
                }
                heroItem.active = true;
            } else {
                if(cc.isValid(heroItem)) {
                    heroItem.active = false;
                }
            }
        }
    }

    refreshAll() {
        this.allHeroCountLb.string = `${this._rankData.Count}`;
    }

    refreshOne() {
        let heroItem: cc.Node = this.oneHeroParent.children[0];
        let itemHeadSquare = null;
        if(!cc.isValid(heroItem)) {
            itemHeadSquare = ItemHeroHeadSquarePool.get();
            heroItem = itemHeadSquare.node;
            heroItem.scale = 0.7;
            this.oneHeroParent.addChild(heroItem);
        } else {
            itemHeadSquare = heroItem.getComponent(ItemHeadSquare);
        }
        if(itemHeadSquare) {
            itemHeadSquare.init(this._rankData.HeroID);
            itemHeadSquare.node.setPosition(cc.v2(0,0))
        }
    }

    // 冒险
    refreshMaoXian() {
        let rankData: data.IPVEAdventureScale = this._rankData as data.IPVEAdventureScale;
        let lessonID = rankData ? rankData.LessonId : 0;
        if(!lessonID) {
            this.progressDesc.string = '暂未开启';
            return;
        }
        let lessonCfg: cfg.AdventureLesson = configUtils.getLessonConfig(lessonID);
        let chapterCfg: cfg.AdventureChapter = configUtils.getChapterConfig(lessonCfg.LessonChapter);
        let progressDesc = `${chapterCfg.ChapterName} ${lessonCfg.LessonName}`;
        this.progressDesc.string = progressDesc;
    }

    // 太虚幻境
    refreshTaiXuHuanJing() {
        let rankData: data.IPVEDreamScale = this._rankData as data.IPVEDreamScale;
        let configs = configManager.getConfigs("dreamlandLesson");
        let lessonID = rankData ? rankData.LessonId: 0;
        if(!lessonID) {
            this.progressDesc.string = '暂未开启';
            return;
        }
        let lessonCfg: cfg.PVEDreamlandLesson = configs[`${lessonID}`];
        let chapterCfgs = configManager.getConfigs('dreamlandChapter');
        let chapterCfg: cfg.PVEDreamlandChapter = chapterCfgs[`${lessonCfg.PVEDreamlandLessonChapter}`];
        let progressDesc = `${chapterCfg.PVEDreamlandChapterName} ${lessonCfg.PVEDreamlandLessonName}`;
        this.progressDesc.string = progressDesc;
    }

    // 无间炼狱
    refreshPurgatory() {
        let rankData: data.ITrialPurgatoryScale = this._rankData as data.ITrialPurgatoryScale;
        let configs: {[key: number]: cfg.PVEInfernalBasic} = configManager.getConfigs("pveInfernalBasic");
        let progress: number = rankData ? rankData.Progress : 0;
        if(!progress) {
            this.progressDesc.string = "暂未开启";
            return;
        }
        let config: cfg.PVEInfernalBasic = configs[progress];
        this.progressDesc.string = config.PVEInfernalBasicLevelName;
    }

    //计算最新的等级，等级经验，当前等级经验上限，即取即用
    getUserLv(exp: number) {
        let expConfigs = configUtils.getLevelExpConfigsByType(3);
        if (exp > 1) {
            let expCount: number = 0;
            for (const k in expConfigs) {
                expCount += Number(expConfigs[k].LevelExpNeedNum);
                if (exp < expCount) {
                    return Number(expConfigs[k].LevelExpLevel);
                }
            }
            return utils.getUserMaxLv();
        } else {
            return 1;
        }
    }
}
