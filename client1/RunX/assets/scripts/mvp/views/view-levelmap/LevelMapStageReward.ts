import { VIEW_NAME } from "../../../app/AppConst";
import { ItemInfo } from "../../../app/AppType";
import { configUtils } from "../../../app/ConfigUtils";
import { configCache } from "../../../common/ConfigCache";
import { eventCenter } from "../../../common/event/EventCenter";
import { lvMapViewEvent, shopEvent } from "../../../common/event/EventData";
import { redDotMgr, RED_DOT_MODULE } from "../../../common/RedDotManager";
import { cfg } from "../../../config/config";
import { data, gamesvr } from "../../../network/lib/protocol";
import { pveData } from "../../models/PveData";
import ItemLevelReward, { REWARD_TYPE } from "./ItemLevelReward";

const {ccclass, property} = cc._decorator;

enum ADVENTURE_LV_REWARD_STATE {
    REWARDED,
    NOT_PAST,
    PAST,
}

@ccclass
export default class LevelMapStageReward extends cc.Component {
    @property(ItemLevelReward) chapterReward: ItemLevelReward = null;
    @property(ItemLevelReward) lessonReward: ItemLevelReward = null;

    private _receiveHandle: Function = null;
    private _loadView: Function = null;
    init(receiveHandle: Function, loadView: Function) {
        this._receiveHandle = receiveHandle;
        this._loadView = loadView;
        this._registerEvents();
        this.refreshView();
    }

    deInit() {
        eventCenter.unregisterAll(this);
        this.chapterReward.deInit();
        this.lessonReward.deInit();
    }

    refreshView() {
        this._generaLevelRewards();
    }

    private _registerEvents() {
        eventCenter.register(lvMapViewEvent.LESSON_STAGE_REWARD_RES, this, this._recvLessonStageRewards);
        eventCenter.register(shopEvent.BUY_GIFT, this, this._recvLessonBuyGift);
        eventCenter.register(shopEvent.BUY_CURRENCY_GIFT, this, this._recvLessonBuyGift);
        eventCenter.register(lvMapViewEvent.CHAPTER_STAGE_REWARD_RES, this, this._recvChapterStageRewards);
    }

    private _generaLevelRewards() {
        let rewards = this._getHasRewardLessonCfgs();
        // 不要章节奖励了
        // if(rewards.chapter.length > 0) {
        //     this.chapterReward.onInit(rewards.chapter[0], REWARD_TYPE.CHAPTER, (prizes: data.IItemInfo[]) => {
        //         this._loadView(VIEW_NAME.GET_ITEM_VIEW, prizes);
        //         rewards.chapter.splice(0, 1);
        //         this.updateLevelRewards(REWARD_TYPE.CHAPTER, null, rewards.chapter);
        //     }, (viewName: string, ...args: any[]) => {
        //         this._loadView(viewName, args[0]);
        //     });
        // } else {
        //     this.chapterReward.onInit(null, REWARD_TYPE.CHAPTER);
        // }

        if(rewards.lesson) {
            this.lessonReward.onInit(rewards.lesson, REWARD_TYPE.LEVEL, (viewName: string, ...args: any[]) => {
                this._loadView(viewName, ...args);
            });
        } else {
            this.lessonReward.onInit(null, REWARD_TYPE.LEVEL, (viewName: string, ...args: any[]) => {
                this._loadView(viewName, ...args);
            });
        }
    }

    private _updateLevelRewards() {
        this._generaLevelRewards();
        this._receiveHandle && this._receiveHandle();
    }

    private _getHasRewardLessonCfgs() {
        let lessonReward: cfg.AdventureLesson = null;
        let adventureLvRewards = configCache.getAdventureLvRewards();
        if(adventureLvRewards && adventureLvRewards.size > 0) {
            let curState: ADVENTURE_LV_REWARD_STATE = ADVENTURE_LV_REWARD_STATE.REWARDED;
            for(let lessonID of adventureLvRewards.keys()) {
                let state = getLevelState(lessonID);
                if(curState < state) {
                    curState = state;
                    lessonReward = configUtils.getLessonConfig(lessonID);
                }
            }
        }

        let chapterReward: cfg.AdventureChapter[] = null;
        // let chapterCfgs: {[k: number]: cfg.AdventureChapter} = configManager.getConfigs('chapter');
        // for(const k in chapterCfgs) {
        //     if(chapterCfgs[k].ChapterRewardShow && !pveData.chapterStageRewards[chapterCfgs[k].ChapterId]) {
        //         chapterReward = chapterReward || []
        //         chapterReward.push(chapterCfgs[k]);
        //     }
        // }
        return {chapter: chapterReward, lesson: lessonReward};
    }

    private _recvLessonStageRewards(eventId: number, prizes: data.IItemInfo[]) {
        this._loadView(VIEW_NAME.GET_ITEM_VIEW, prizes);
        this._updateLevelRewards();
        redDotMgr.fire(RED_DOT_MODULE.LEVEL_MAP_CHAPTER_LIST);
        redDotMgr.fire(RED_DOT_MODULE.MAIN_LEVEL_MAP);
    }

    private _recvChapterStageRewards(eventId: number, prizes: data.IItemInfo[]) {
        this._recvLessonStageRewards(eventId, prizes);
    }

    // 购买章节礼包
    private _recvLessonBuyGift(event: number, info: gamesvr.IPayResultNotify|gamesvr.IBuyCurrencyGiftRes) {
        if(event == shopEvent.BUY_CURRENCY_GIFT) {
            let data = info as gamesvr.IBuyCurrencyGiftRes;
            this._loadView(VIEW_NAME.GET_ITEM_VIEW, data.Products || []);
        } else {
            let data = info as gamesvr.IPayResultNotify;
            this._loadView(VIEW_NAME.GET_ITEM_VIEW, data.PropertyList || [], data.ExtraPropertyList || []);
        }
    }
}

const getLevelState = function(lessonID: number):ADVENTURE_LV_REWARD_STATE {
    if(!pveData.checkLessonIsPast(lessonID))
      return ADVENTURE_LV_REWARD_STATE.NOT_PAST;

    if(!pveData.lessonStageRewards[lessonID]) {
      return ADVENTURE_LV_REWARD_STATE.PAST;
    }
    return ADVENTURE_LV_REWARD_STATE.REWARDED;
}

export {
    getLevelState,
    ADVENTURE_LV_REWARD_STATE
}
