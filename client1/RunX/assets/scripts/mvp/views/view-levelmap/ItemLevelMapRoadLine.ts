import { configUtils } from "../../../app/ConfigUtils";
import { cfg } from "../../../config/config";
import { pveData } from "../../models/PveData";
import { LESSON_STATE } from "./LevelMapView";

const LINE_LOCK_HEIGHT: number = 5;
const LINE_UNLOCK_HEIGHT: number = 10;

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemLevelMapRoadLine extends cc.Component {

    private _lessonCfg: cfg.AdventureLesson = null;
    init(lessonCfg: cfg.AdventureLesson) {
        this._lessonCfg = lessonCfg;
        this._refreshView();
        this.refreshLineState();
    }

    deInit() {

    }

    get limitPos() {
        const preLessonCfg = this._getPreLessonCfg();
        const prePos = this._getPosByLessonCfg(preLessonCfg);
        const curPos = this._getPosByLessonCfg(this._lessonCfg);
        const radian = Math.atan2(curPos.y - prePos.y, curPos.x - prePos.x);
        const halfWidth = Math.abs(this.node.width * Math.cos(radian));
        return cc.v2(this.node.x - halfWidth, this.node.x + halfWidth);
    }

    private _refreshView() {
        const preLessonCfg = this._getPreLessonCfg();
        const pos = this._getPosByLessonCfg(preLessonCfg);
        this.node.setPosition(pos);
        this.node.angle = this._calculateAngle(preLessonCfg);
        this.node.width = this._calculateLength(preLessonCfg);
    }

    refreshLineState() {
        const state = this._getState();
        let color = LESSON_STATE.LOCK == state ? cc.Color.GRAY : cc.Color.YELLOW;
        let height = LESSON_STATE.LOCK == state ? LINE_LOCK_HEIGHT : LINE_UNLOCK_HEIGHT;
        this.node.height = height;
        this.node.color = color;
    }

    private _calculateLength(preLessonCfg: cfg.AdventureLesson): number {
        const prePos = this._getPosByLessonCfg(preLessonCfg);
        const curPos = this._getPosByLessonCfg(this._lessonCfg);
        return curPos.sub(prePos).len();
    }

    private _calculateAngle(preLessonCfg: cfg.AdventureLesson): number {
        const prePos = this._getPosByLessonCfg(preLessonCfg);
        const curPos = this._getPosByLessonCfg(this._lessonCfg);
        const radian = Math.atan2(curPos.y - prePos.y, curPos.x - prePos.x);
        return radian * (180 / Math.PI);
    }

    private _getPreLessonCfg(): cfg.AdventureLesson {
        const preLessonId = this._lessonCfg.LessonOrder;
        const preLessonCfg = configUtils.getLessonConfig(preLessonId);
        return preLessonCfg;
    }

    private _getPosByLessonCfg(lessonCfg: cfg.AdventureLesson): cc.Vec2 {
        let posStr = lessonCfg.LessonNodeCoordinate;
        const posList = posStr.split(';');
        const pos = cc.v2(Number(posList[0]), Number(posList[1]));
        return pos;
    }

    private _getState(): LESSON_STATE {
        const lessonIsPass = this._checkLessonIsPass(this._lessonCfg.LessonOrder);
        const curChapter = pveData.getCurrChapterId();
        if(this._lessonCfg.LessonChapter > curChapter) {
            return LESSON_STATE.LOCK;
        } else {
            return lessonIsPass ? LESSON_STATE.UNLOCK : LESSON_STATE.LOCK;
        }
    }

    private _checkLessonIsPass(lessonId: number): boolean {
        return pveData.records[lessonId] && pveData.records[lessonId].Past;
    }
}
