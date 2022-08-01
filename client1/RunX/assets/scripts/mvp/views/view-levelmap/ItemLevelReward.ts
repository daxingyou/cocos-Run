import { utils } from "../../../app/AppUtils";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { cfg } from "../../../config/config";
import { pveData } from "../../models/PveData";
import { pveDataOpt } from "../../operations/PveDataOpt";
import ItemBag from "../view-item/ItemBag";
import ItemRedDot from "../view-item/ItemRedDot";
import { configCache } from "../../../common/ConfigCache";
import { ADVENTURE_LV_REWARD_STATE, getLevelState } from "./LevelMapStageReward";
import { RED_DOT_MODULE } from "../../../common/RedDotManager";

const {ccclass, property} = cc._decorator;

export enum REWARD_TYPE {
    LEVEL = 1,
    CHAPTER
}

@ccclass
export default class ItemLevelReward extends cc.Component {
    @property(cc.Label)         nameLB: cc.Label = null;
    @property(cc.Label)         unlockTipsLB: cc.Label = null;
    @property(cc.Node)          unlockTipsBG: cc.Node = null;
    @property(cc.Node)          rewardBtn: cc.Node = null;
    @property(cc.Label)         level: cc.Label = null;
    @property(cc.Node)          emptyNode: cc.Node = null;
    @property(ItemRedDot)       itemRedDot: ItemRedDot = null;
    @property(cc.Node)          itemConatinor: cc.Node = null;

    private _type: REWARD_TYPE = null;
    private _lessonCfg: cfg.AdventureLesson = null;
    private _chapterCfg: cfg.AdventureChapter = null;
    private _loadSubViewFn: Function = null;
    private _itemBag: ItemBag = null;

    get lessonId() {
        if(REWARD_TYPE.LEVEL == this._type) {
            return this._lessonCfg.LessonId;
        }
        return 0;
    }

    onInit(lessonCfg: any, type: REWARD_TYPE, loadSubView?: Function) {
        this._type = type;

        if(type == REWARD_TYPE.CHAPTER) {
            this._chapterCfg = lessonCfg as cfg.AdventureChapter;
        } else if(type == REWARD_TYPE.LEVEL) {
            this._lessonCfg = lessonCfg as cfg.AdventureLesson;
        }
        this._loadSubViewFn = loadSubView;
        this._refreshView();
    }

    onRelease() {
        ItemBagPool.put(this._itemBag);
        this._itemBag = null;
    }

    deInit() {
        this.onRelease();
    }

    private _refreshView() {
        cc.isValid(this.nameLB) && (this.nameLB.string = REWARD_TYPE.CHAPTER == this._type ? '章节奖励' : '关卡奖励');
        cc.isValid(this.level) && (this.level.string = REWARD_TYPE.CHAPTER == this._type ? `第${this._chapterCfg.ChapterId % 1000}章` : `${this._lessonCfg.LessonName}`);

        let itemID: number, itemCnt: number;
        if(REWARD_TYPE.LEVEL == this._type) {
            if(this._lessonCfg) {
                cc.isValid(this.emptyNode) && (this.emptyNode.active = false);
                let rewards = configCache.getAdventureLvRewardByLessonID(this._lessonCfg.LessonId);
                rewards && rewards.length > 0 && (itemID = rewards[0].itemId, itemCnt = rewards[0].num);
            } else {
                cc.isValid(this.emptyNode) && (this.emptyNode.active = true);
            }
        } else {
            // 章节奖励，暂时没有使用
            cc.isValid(this.emptyNode) && (this.emptyNode.active = false);
            utils.parseStingList(this._chapterCfg.ChapterRewardShow, (strArr: string[]) => {
              if(!strArr || strArr.length == 0) return;
              if(typeof itemID == 'undefined') {
                  itemID = parseInt(strArr[0]);
                  itemCnt = parseInt(strArr[1]);
              }
            });
        }

        if(itemID) {
            let itemInfo = {
                id: itemID,
                count: itemCnt,
                clickHandler: () => {
                    this._loadSubViewFn && this._loadSubViewFn('LevelMapRewardView');
                }
            };

            if(!this._itemBag) {
              let itemBag = ItemBagPool.get().node;
              this.itemConatinor.addChild(itemBag);
              itemBag.setScale(0.8);
              this._itemBag = itemBag.getComponent(ItemBag);
            }
            this._itemBag.init(itemInfo);
        }

        this.refreshState();
    }

    refreshState() {
        if(REWARD_TYPE.LEVEL == this._type) {
            if(this._lessonCfg) {
                let state = getLevelState(this._lessonCfg.LessonId);
                if(ADVENTURE_LV_REWARD_STATE.PAST == state) {
                    this.unlockTipsLB.string = '可领取';
                } else if(ADVENTURE_LV_REWARD_STATE.NOT_PAST == state) {
                    let needPassCount: number = this._lessonCfg.LessonId - pveData.getCurrLessonId() + 1;
                    this.unlockTipsLB.string = `再通${needPassCount}关可领取奖励`;
                }
            } else {
                this.unlockTipsLB.string = '通关奖励';
            }
        } else {
            this.unlockTipsLB.string = '通关本章节领取';
        }
        this._refreshRedDot();
    }

    private _refreshRedDot() {
        let isExistReward = cc.isValid(this._itemBag);
        this.itemRedDot.node.active = isExistReward;
        if(!isExistReward) return;

        if(REWARD_TYPE.CHAPTER == this._type) {
            this.itemRedDot.setData(RED_DOT_MODULE.LEVEL_MAP_CHAPTER_REWARD, {
              args: [this._chapterCfg.ChapterId]
            });
            return;
        }

        if(REWARD_TYPE.LEVEL == this._type){
            this.itemRedDot.setData(RED_DOT_MODULE.LEVEL_MAP_LESSON_REWARD, {
                args: [this._lessonCfg.LessonId]
            });
            return;
        }
    }

    onClickReward() {
        if(REWARD_TYPE.CHAPTER == this._type) {
            pveDataOpt.reqChapterStageRewards(this._chapterCfg.ChapterId);
        } else {
            pveDataOpt.reqLessonStageRewards(this._lessonCfg.LessonId);
        }
    }

    onClickEmptyItem() {
        this._loadSubViewFn && this._loadSubViewFn('LevelMapRewardView');
    }
}
