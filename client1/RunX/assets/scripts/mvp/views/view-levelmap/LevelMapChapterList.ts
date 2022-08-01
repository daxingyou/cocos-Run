import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import List from "../../../common/components/List";
import UIGridView, { GridData } from "../../../common/components/UIGridView";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { commonEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import moduleUIManager from "../../../common/ModuleUIManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { data } from "../../../network/lib/protocol";
import { pveData } from "../../models/PveData";
import { userData } from "../../models/UserData";
import ItemBag from "../view-item/ItemBag";
import ItemMapChapter from "./ItemMapChapter";
import { LESSON_ROAD_TYPE } from "./LevelMapView";

const {ccclass, property} = cc._decorator;

@ccclass
export default class LevelMapChapterList extends ViewBaseComponent {
    @property(List) chapterList: List = null;

    @property(UIGridView)   grid: UIGridView = null;

    private _chapters: number[] = [];
    private _selectHandle: Function = null;
    private _spriteLoader: SpriteLoader = new SpriteLoader();

    onInit(selectHandle: Function) {
        this._selectHandle = selectHandle;
        this._dueData();
        this._refreshList();
        this._refreshHangUp();

        eventCenter.register(commonEvent.JUMP_MODULE, this, this.closeView);
    }

    onRelease(): void {
        eventCenter.unregisterAll(this);
        this._spriteLoader.release();
        this.chapterList._deInit();
        this.grid.clear();
        this._chapters = [];
        this._selectHandle = null;
    }

    private _dueData() {
        this._chapters = this._getChapters();
    }

    private _refreshList() {
        this.chapterList.numItems = this._chapters.length;
    }

    private _refreshHangUp () {
        this.grid.clear();
        if (!userData.universalData.UniversalHangUpGainData) {
            return;
        }
        let prize: data.IItemInfo[] = [];
        let rewardsStr = "";
        let currChapter = userData.universalData.UniversalHangUpGainData.ChapterID || 0
        if (!currChapter) {
            rewardsStr = configUtils.getConfigModule("AccumulateRewardBasicRewardShow");
        } else {
            let cfg = configUtils.getChapterConfig(currChapter);
            if (cfg && cfg.ChapterAccumulateAllRewardShow) {
                rewardsStr = cfg.ChapterAccumulateAllRewardShow
            }
        }

        if (rewardsStr) {
            let list = utils.parseStringTo1Arr(rewardsStr, ";");
            for (let i = 0; i < list.length; i++) {
                let itemID = parseInt(list[i]);
                if (itemID) {
                    prize.push({ID: itemID, Count: itemID})
                }
            }
        }

        if (prize.length > 0) {
            let self = this;
            let gridDatas: GridData[]  = prize.map( (_v, _idx) => {
                return {
                    key: _idx.toString(),
                    data: _v,
                }
            })
            this.grid.init(gridDatas, {
                onInit: (itemCmp: ItemBag, data: GridData) => {
                    self._onItemUpdate(itemCmp, data.data);
                },
                getItem: (): ItemBag => {
                    let itemNode = ItemBagPool.get();
                    itemNode.node.scale = 0.7;
                    return itemNode;
                },
                releaseItem: (itemCmp: ItemBag) => {
                    itemCmp.node.scale = 1;
                    ItemBagPool.put(itemCmp)
                },
            });
        }
    }

    private _onItemUpdate (item: ItemBag, data: data.IItemInfo, isExtra: boolean = false) {
        let prizeItem = data;
        item.init({
            id: prizeItem.ID,
            clickHandler: () => { moduleUIManager.showItemDetailInfo(data.ID, 0, this.node); },
            count: 0,
            getItem: true,
            isNew:false,
            extra: isExtra
        })
    }


    onChapterItemRender(item: cc.Node, index: number) {
        let itemComp = item.getComponent(ItemMapChapter);
        let chapterId = this._chapters[index];
        let chapterCfg = configUtils.getChapterConfig(chapterId);
        itemComp.onInit(chapterCfg, this._getLessonProgress(LESSON_ROAD_TYPE.MAIN, chapterId), this._getLessonProgress(LESSON_ROAD_TYPE.ACCESS, chapterId));
    }

    onSelectItem(item: cc.Node, index: number) {
        // 屏蔽点击响应
        // const curChapterId = pveData.getCurrChapterId();
        // const chapterId = this._chapters[index];
        // if(this._selectHandle && chapterId <= curChapterId) {
        //     this._selectHandle(chapterId);
        //     this.closeView();
        // } else {
        //     guiManager.showTips('前置章节还未通关');
        // }
    }

    private _getChapters(): number[] {
        // 这是只显示可能通关的版本
        // const curChapter = pveData.getCurrChapterId();
        // let chapters: number[] = [];
        // chapters.push(curChapter);
        // let chapterId = curChapter;
        // let chapterCfg = configUtils.getChapterConfig(chapterId);
        // while(chapterCfg.ChapterFront) {
        //     chapters.push(chapterCfg.ChapterFront);
        //     chapterCfg = configUtils.getChapterConfig(chapterCfg.ChapterFront);
        // }
        // return chapters.reverse();
        const configs: cfg.AdventureChapter[] = configManager.getConfigList('chapter');
        configs.sort((_a, _b) => {
            return _a.ChapterId - _b.ChapterId;
        });
        return configs.map(_cfg => { return _cfg.ChapterId; });
    }

    private _getLessonProgress(type: LESSON_ROAD_TYPE, chapterId: number): { pass: number, all: number} {
        const lessonCfgs: cfg.AdventureLesson[] = configManager.getConfigByManyKV('lesson', 'LessonChapter', chapterId);
        const lessons = lessonCfgs.filter(_cfg => {
            return LESSON_ROAD_TYPE.ACCESS == type ? _cfg.LessonBranch == type : !_cfg.LessonBranch;
        });
        const passLessons = lessons.filter(_cfg => {
            return pveData.checkLessonIsPast(_cfg.LessonId);
        });
        return {
            pass: passLessons.length,
            all: lessons.length
        };
    }
    
}
