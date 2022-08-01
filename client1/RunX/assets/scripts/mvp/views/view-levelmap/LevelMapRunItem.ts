/**
 * 张海洋
 * 2021.4.26
 * 关卡 跑酷地图 item
 */

import { CHAPTER_STATE } from "../../../app/AppEnums";
import { LessonItemViewInfo } from "../../../app/AppType";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { pveData } from "../../models/PveData";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LevelMapRunItem extends cc.Component {
    @property(cc.Node) isPass: cc.Node = null;

    private _spriteLoader: SpriteLoader = null;
    private _lessonViewInfo: LessonItemViewInfo = null;
    private _clickHandler: Function = null
    private _lessCfg: cfg.AdventureLesson = null;
    

    setData(lessonInfo: LessonItemViewInfo, clickHandler: Function) {
        this._clickHandler = clickHandler;
        this._lessonViewInfo = lessonInfo;
        let lessonCfgs: cfg.AdventureLesson[] = configManager.getConfigByKV("lesson", "LessonChapter", pveData.getCurrChapterId()) ;    
        this._lessCfg = lessonCfgs[this._lessonViewInfo.index];
        this.initRunItemView();
    }

    onLoad() {
        this._spriteLoader = new SpriteLoader();
    }

    initRunItemView() {
        // 当前关卡
        this.isPass.active = false;
        let chapterState: CHAPTER_STATE = null;
        if (!this._spriteLoader)
            this._spriteLoader = new SpriteLoader();
        if (this._lessonViewInfo.index + 1 == pveData.getCurrLessonId() % 1000) {
            chapterState = CHAPTER_STATE.Current;
        } else {
            // 已通关
            if (this._lessonViewInfo.index + 1 < pveData.getCurrLessonId() % 1000) {
                chapterState = CHAPTER_STATE.Passed;
                this.isPass.active = true;
            }
            // 未解锁 
            else {
                chapterState = CHAPTER_STATE.Lock;
            }
        }
        let url: string = `textures/lesson-run/lesson_icon_run${chapterState}`;
        this._spriteLoader.changeSpriteP(this.node.getComponent(cc.Sprite), url);
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
