/**
 * 张海洋
 * 2021.4.26
 * 关卡 data manager 地图数据管理
 */
import { LESSON_TYPE } from "../../app/AppEnums";
import { configUtils } from "../../app/ConfigUtils";
import { configManager } from "../../common/ConfigManager";
import { logger } from "../../common/log/Logger";
import { modelManager } from "./ModeManager";

/**
 * 关卡 章节数据结构
 */
interface ChapterInfo {
    ChapterId: number,              // 章节ID
    ChapterBehind?: number,         // 后续章节
    ChapterFront?: number,          // 前置章节
    ChapterName: string,            // 章节名称
    ChapterLesson: string,          // 章节资源
}

/**
 * 关卡信息数据结构
 */
interface LessonInfo {
    LessonId: number,                           // 关卡ID
    LessonChapter: number,                      // 关卡章节
    LessonOrder: number,                        // 关卡顺序
    LessonType: LESSON_TYPE,                    // 关卡类型
    LessonFile: string,                         // 关卡文件
    LessonRewardShow?: string,         // 关卡奖励列表
    LessonRewardDrop?: number[],                // 关卡掉落列表
    LessonMonsterGroupId?: string,            // 关卡怪物列表
    LessonCost?: ItemInfo[],            // 关卡消耗
    LessonEnterCondition?: string,  // 关卡进入条件
    LessonRunShow?: string                   // 跑酷地图的背景图
    LessonName?: string                         // 关卡名
}
/**
 * 编辑器传来的有关地图的数据结构
 */
interface LessonViewInfo {
    name: string,
    nodeList: LessonItemViewInfo[],
    routeList: LessonItemRoadViewInfo[],
}

interface LessonItemViewInfo {
    hero: string,
    index: number,
    name: string,
    posx: number,
    posy: number,
    reverse: boolean,
    type: number
}

interface LessonItemRoadViewInfo {
    index: number,
    name: string,
    posx: number,
    posy: number,
    reverse: boolean,
}
/**
 * 敌方信息数据结构
 */
interface EnemyInfo {
    MonsterId: number,
    Name: string,
    Level: number,
    Quality: number,
    Type: number,
    MeleeOrLong: number,
    Hp: number,
    Attack: number,
    Defend: number,
    Critical: number,
    CriticalHarm: number,
    Speed: number,
    HarmImmunity: number,
    Parry: number,
    ParryValue: number,
    Hit: number,
    Miss: number,
    Blood: number,
    BloodValue: number,
    NoCritical: number,
    Counterattack: number,
    CounterattackValue: number,
    Sputtering: number,
    SputteringValue: number,
    DebuffImmunity: number,
}

/**
 * 物品信息
 */
interface GoodInfo {
    ItemId: number,
    ItemName: string,
    ItemQuality: number,
    ItemGetAccess: number[],
    ItemIntroduce: string,
    ItemSuperposition: number,
    ItemIcon?: string,
}

/**
 * 用户关卡信息
 */
class UserChapterInfo {
    public Chapter: number = 1;
    public Lesson: number = 1;
    constructor() {
        this.Chapter = 1;
        this.Lesson = 1;
    }
}
/**
 * 物品信息数据结构
 */
class ItemInfo {
    public itemId: number = 0;
    public num: number = 0;
    constructor(itemId?: number, num?: number) {
        this.itemId = itemId;
        this.num = num;
    }
}

export {
    ChapterInfo,
    LessonInfo,
    LessonViewInfo,
    LessonItemViewInfo,
    LessonItemRoadViewInfo,
    EnemyInfo,
    GoodInfo,
    UserChapterInfo,
    ItemInfo
}

export default class LevelMapData {
    private _chapterInfos: ChapterInfo[] = [];              // 所有章节数据
    private _lessonInfos: LessonInfo[] = [];                // 当前章节的关卡数据 配置表的
    private _curLessInfo: LessonInfo = null;                // 当前展示的关卡数据
    private _isSetTeam: boolean = false;                    // 是否配置过阵容

    private _lessonViewInfos: LessonViewInfo = null;                    // 地图编辑器传来的数据

    /**
     * 设置当前展示的关卡表
     */
    set curLessonInfo(lessonInfo: LessonInfo) {
        if (!this._curLessInfo || lessonInfo.LessonId != this._curLessInfo.LessonId) {
            this._curLessInfo = lessonInfo;
        }
    }
    /**
     * 获得当前关卡信息
     */
    get curLessonInfo() {
        return this._curLessInfo;
    }

    get lessonViewInfos() {
        return this._lessonViewInfos;
    }

    init() {
        // todo 读取用户数据
        this.initChapterConfig();
        this.initLessonConfig();
        this.initCurLessonInfo();
    }
    /**
     * 初始化章节config
     */
    initChapterConfig() {
        this._chapterInfos = configManager.getConfigs("chapter");
        // logger.log('LevelMapDataMgr initChapterConfig', this._chapterInfos);
    }
    /**
     * 初始化关卡config
     */
    initLessonConfig() {
        this._lessonInfos = configManager.getConfigs("lesson");
        let curChapterInfo: ChapterInfo = this.getCurChapterInfo();
        this._lessonViewInfos = configManager.getMapEditConfig(curChapterInfo.ChapterLesson);
        // logger.log('LevelMapDataMgr initLessonConfig', this._lessonInfos);
    }
    /**
     * 更新当前关卡信息
     * @returns 
     */
    initCurLessonInfo() {
        let lessonInfo: LessonInfo = this.getLessonInfoByChaperIdAndIndex(modelManager.userData.chapterId, modelManager.userData.lessonId);
        if (lessonInfo) {
            this.curLessonInfo = lessonInfo;
        } else {
            logger.error(`LevelMapDataManager initCurLessonInfo lessonInfo:${lessonInfo}`);
            return;
        }
    }
    /**
     * 获得当前大关卡的所有小关卡数据
     * @returns 
     */
    getCurLessonInfos() {
        let lessonInfos: LessonInfo[] = [];
        for (let i = 0; i < this._lessonInfos.length; ++i) {
            let lessonInfo = this._lessonInfos[i];
            if (lessonInfo.LessonChapter == modelManager.userData.chapterId) {
                lessonInfos.push(lessonInfo);
            }
        }
        return lessonInfos;
        // return this._lessonInfos;
    }
    /**
     * 获得当前章节的信息
     * @returns 
     */
    getCurChapterInfo() {
        return configUtils.getChapterConfig(modelManager.userData.chapterId);
    }
    /**
     * 通过章节ID 获得当前章节的所有关卡数据
     * @param chapterId 章节ID
     * @returns 
     */
    getLessonInfosByChapterId(chapterId: number) {
        let lessonInfos: LessonInfo[] = [];
        for (let i = 0; i < this._lessonInfos.length; ++i) {
            let lessonInfo = this._lessonInfos[i];
            if (lessonInfo.LessonChapter == chapterId) {
                lessonInfos.push(lessonInfo);
            }
        }
        return lessonInfos;
    }
    /**
     * 获得当前关卡的信息
     * @param chapterId 章节ID
     * @param index 关卡序号
     * @returns 
     */
    getLessonInfoByChaperIdAndIndex(chapterId: number, index: number): LessonInfo {
        let lessons = this.getLessonInfosByChapterId(chapterId);
        if (lessons.length > 0) {
            return lessons[index - 1];
        } else {
            logger.error('getLessonInfoByChaperIdAndIndex 获取lessons出错');
            return null;
        }
    }
    /**
     * 
     * @returns 获得当前关卡的怪物阵容
     */
    getCurLessonMonsterGroup() {
        let lessonInfo = this.curLessonInfo;
        if (lessonInfo.LessonType == LESSON_TYPE.Battle) {
            if (lessonInfo.LessonMonsterGroupId) {
                let groundList: any[] = [];
                let tempMonsterGroup = lessonInfo.LessonMonsterGroupId.split('|');
                for (let i = 0; i < tempMonsterGroup.length; ++i) {
                    let monsterGroupId: string = tempMonsterGroup[i];
                    let monsterGroupConfig = configManager.getConfigByKey("monsterGroup", monsterGroupId);
                    groundList.push(monsterGroupConfig);
                }
                return groundList;
            }
            return null;
        }
        return null;
    }
    /**
     * 获得关卡信息 通过 index;
     * @param index  从0开始的
     * @returns 
     */
    getLessonInfoByIndex(index: number) {
        let lessonId: number = modelManager.userData.chapterId * 1000 + index + 1;
        return this.getCurLessonInfos()[index];
    }

    getCurLessonRewardShow() {
        return this.getLessonInfoRewardShowByIndex(this.curLessonInfo.LessonOrder - 1);
    }

    getCurLessonEnterCondition() {
        return this.getLessonEnterConditionByIndex(this.curLessonInfo.LessonOrder - 1);
    }

    getLessonInfoRewardShowByIndex(index: number): ItemInfo[] {
        let lessoninfo = this.getLessonInfoByIndex(index);
        let rewardConfigInfos: string = lessoninfo.LessonRewardShow;
        let rewardInfos: ItemInfo[] = [];
        let tempRewardConfigs = rewardConfigInfos.split('|');
        for (let i = 0; i < tempRewardConfigs.length; ++i) {
            let itemInfos = tempRewardConfigs[i].split(';');
            let itemInfo: ItemInfo = new ItemInfo(Number(itemInfos[0]), Number(itemInfos[1]));
            rewardInfos.push(itemInfo);
        }
        return rewardInfos;
    }

    getLessonEnterConditionByIndex(index: number): ItemInfo[] {
        let lessoninfo = this.getLessonInfoByIndex(index);
        let enterConditionConfigInfos: string = lessoninfo.LessonEnterCondition;
        let enterConditionInfos: ItemInfo[] = [];
        let tempEnterConditionConfigs = enterConditionConfigInfos.split('|');
        for (let i = 0; i < tempEnterConditionConfigs.length; ++i) {
            let itemInfos = tempEnterConditionConfigs[i].split(';');
            let itemInfo: ItemInfo = new ItemInfo(Number(itemInfos[0]), Number(itemInfos[1]));
            enterConditionInfos.push(itemInfo);
        }
        return enterConditionInfos;
    }
}