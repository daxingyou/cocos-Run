import { utils } from "../../../app/AppUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import moduleUIManager from "../../../common/ModuleUIManager";
import { redDotMgr, RED_DOT_MODULE } from "../../../common/RedDotManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import ItemBag from "../view-item/ItemBag";
import ItemRedDot from "../view-item/ItemRedDot";

const {ccclass, property} = cc._decorator;

type LessonPassInfo = { pass: number, all: number};

@ccclass
export default class ItemMapChapter extends cc.Component {
    @property(cc.Sprite) chapterBg: cc.Sprite = null;
    @property(cc.Label) titleLb: cc.Label = null;
    @property(cc.Label) mainRoadLessonTips: cc.Label = null;
    @property(cc.Label) accessRoadLessonTips: cc.Label = null;
    @property(ItemRedDot) redot: ItemRedDot = null;

    @property(ItemBag) hangupRewards: ItemBag[] = [];
    @property(cc.Sprite) ndHangupTag: cc.Sprite[] = [];
    @property(cc.SpriteFrame) ndHangupTags: cc.SpriteFrame[] = [];

    private _spLoader: SpriteLoader = null;

    onInit(chapterCfg: cfg.AdventureChapter, mainLesnCfgs: LessonPassInfo, accessLessCfgs: LessonPassInfo) {
       this._showBase(chapterCfg, mainLesnCfgs, accessLessCfgs);
       this._showHangup(chapterCfg);
    }

    deInit() {
        this.redot.deInit();
        this._spLoader && this._spLoader.release();
        this._spLoader = null;
        this.hangupRewards.forEach( _item => {
            _item.deInit();
        })
    }

    reuse() {

    }

    unuse() {
        this.deInit();
    }

    private _showBase (chapterCfg: cfg.AdventureChapter, mainLesnCfgs: LessonPassInfo, accessLessCfgs: LessonPassInfo) {
        let titleBgUrl = resPathUtils.getChapterTitleBgUrl(chapterCfg.ChapterLesson) || '';
        this._spLoader = this._spLoader || new SpriteLoader();
        this._spLoader.changeSprite(this.chapterBg, titleBgUrl);
        this.titleLb.string = chapterCfg.ChapterName || '';
        
        this.mainRoadLessonTips.node.active = mainLesnCfgs.all > 0;
        if(mainLesnCfgs.all > 0) {
            this.mainRoadLessonTips.string = `主线：${mainLesnCfgs.pass}/${mainLesnCfgs.all}`;
            this.mainRoadLessonTips.node.color = mainLesnCfgs.pass >= mainLesnCfgs.all ? cc.Color.GREEN : cc.Color.WHITE;
        }
        
        this.accessRoadLessonTips.node.active = accessLessCfgs.all > 0;
        if(accessLessCfgs.all > 0) {
            this.accessRoadLessonTips.string = `支线：${accessLessCfgs.pass}/${accessLessCfgs.all}`;
            this.accessRoadLessonTips.node.color = accessLessCfgs.pass >= accessLessCfgs.all ? cc.Color.GREEN : cc.Color.WHITE;
        }
        this.redot.showRedDot(redDotMgr.getLvMapRewardStateInChapter(chapterCfg.ChapterId));
    }

    private _showHangup (chapterCfg: cfg.AdventureChapter) {
        this.hangupRewards.forEach( _item => {
            _item.node.active = false;
        })

        let rewards = chapterCfg.ChapterAccumulateRewardShow;
        if (rewards) {
            let list = utils.parseStingList(rewards);
            for (let i = 0; i < list.length; i++) {
                let tag = parseInt(list[i][0]);
                let itemID = parseInt(list[i][1]);
                if (cc.isValid(this.hangupRewards[i])) {
                    let item = this.hangupRewards[i];
                    item.init({
                        id: itemID,
                        count: 0,
                        clickHandler: () => { moduleUIManager.showItemDetailInfo(itemID, 0, this.node); },
                        isNew: false,
                    })
                    item.node.active = true;
                }

                if (cc.isValid(this.ndHangupTag[i]) && this.ndHangupTags[tag - 1]) {
                    this.ndHangupTag[i].spriteFrame = this.ndHangupTags[tag - 1];
                }
            }
        }
    }   
}
