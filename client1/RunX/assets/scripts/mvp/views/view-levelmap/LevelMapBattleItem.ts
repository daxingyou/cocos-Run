/**
 * 张海洋
 * 2021.4.26
 * 关卡 战斗地图 item
 */

import { LessonItemViewInfo } from "../../../app/AppType";
import { utils } from "../../../app/AppUtils";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { pveData } from "../../models/PveData";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LeveleMapBattleItem extends cc.Component {
    @property(cc.Node) isCheckNode: cc.Node = null;
    @property(cc.Node) isPassed: cc.Node = null;
    @property(cc.Label) lvLabel: cc.Label = null;
    @property(cc.Sprite) headSp: cc.Sprite = null;

    private _spriteLoader: SpriteLoader = null;
    private _lessonViewInfo: LessonItemViewInfo = null;
    private _clickHandler: Function = null;
    private _lessCfg: cfg.AdventureLesson = null;
    
    onLoad() {
        this._spriteLoader = new SpriteLoader();
    }

    setData(lessonInfo: LessonItemViewInfo, clickHandler: Function) {
        this._clickHandler = clickHandler;
        this._lessonViewInfo = lessonInfo;
        let lessonCfgs: cfg.AdventureLesson[] = configManager.getConfigByKV("lesson", "LessonChapter", pveData.getCurrChapterId()) ;    
        this._lessCfg = lessonCfgs[this._lessonViewInfo.index];

        this.refreshView();
    }


    refreshView() {
        this.checkIsCureent();
        // 刷新头像
        if (this._lessCfg.LessonPointHead && this._lessCfg.LessonPointHead != "" && this._spriteLoader) {
            this._spriteLoader.changeSprite(this.headSp, this._lessCfg.LessonPointHead);
        }

        if (this._lessCfg.LessonName) {
            this.lvLabel.string = `${this._lessCfg.LessonName}`;
        } else {
            this.lvLabel.string = `${utils.transformToChinese(this._lessonViewInfo.index + 1)}关`;
        }
    }

    checkIsCureent() {
        let currLessonId = pveData.getCurrLessonId()
        this.isCheckNode.active = (this._lessonViewInfo.index + 1) == pveData.getCurrLessonId()%1000;
        this.isPassed.active = (this._lessonViewInfo.index + 1) < currLessonId%1000;
    }

    onClickItem() {
        this._clickHandler && this._clickHandler(this._lessCfg)
    }

    removeEvent() {
        eventCenter.unregisterAll(this);
    }

    onDestroy() {
        this._spriteLoader.release();
        this.removeEvent();
    }
}
