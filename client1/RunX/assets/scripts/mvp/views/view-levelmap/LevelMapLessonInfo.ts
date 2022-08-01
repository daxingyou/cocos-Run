import { LESSON_TYPE } from "../../../app/AppEnums";
import { configUtils } from "../../../app/ConfigUtils";
import guiManager from "../../../common/GUIManager";
import { localStorageMgr } from "../../../common/LocalStorageManager";
import moduleUIManager from "../../../common/ModuleUIManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import ItemBag from "../view-item/ItemBag";
import ItemLevelMapEnemy from "./ItemLevelMapEnemy";

const INIT_TEAM_LOCAL_KEY: string = `RunX_Use_Init_Team`;

const {ccclass, property} = cc._decorator;

@ccclass
export default class LevelMapLessonInfo extends cc.Component {
    @property(cc.ToggleContainer) enemyTeamsToggles: cc.ToggleContainer = null;
    @property(cc.Node) enemyTeamsParent: cc.Node = null;
    @property(cc.Node) rewardsParent: cc.Node = null;
    @property(cc.Sprite) parkourBg: cc.Sprite = null;
    @property(cc.Toggle) useInitTeam: cc.Toggle = null;
    @property(cc.Node) battleNodes: cc.Node = null;
    @property(cc.Node) parkourNodes: cc.Node = null;
    @property(cc.Node) battleLabels: cc.Node = null;
    @property(cc.Node) ndSubBattle: cc.Node = null;
    @property(cc.Node) parkourLabels: cc.Node = null;
    @property(cc.Label) title: cc.Label = null;
    @property(cc.Prefab) tamplateEmeny: cc.Prefab = null;

    private _lessonId: number = 0;
    private _loadView: Function = null;
    private _enemyPool: ItemLevelMapEnemy[] = [];
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _subChapter: number = 0;

    init(lessonId: number, loadView: Function) {
        this._lessonId = lessonId;
        this._loadView = loadView;
        this._subChapter = 0;

        this._refreshView();
    }

    deInit() {
        this.node.stopAllActions();
        this._releaseRewards();
        this._releaseEnemyTeam();
    }

    get lessonType(): LESSON_TYPE {
        const lessonCfg = this._getLessonCfg();
        if(lessonCfg) {
            return lessonCfg.LessonType;
        }
        return LESSON_TYPE.Battle;
    }

    get isUseInitTeam(): boolean {
        return this.useInitTeam.isChecked;
    }

    private _refreshView() {
        // TODO 现在没有怪物多组 
        this.enemyTeamsToggles.node.active = false;
        this.useInitTeam.isChecked = this._getUseInitTeamState();

        const lessonCfg = this._getLessonCfg();
        if(lessonCfg) {
            this.battleNodes.active = LESSON_TYPE.Battle == lessonCfg.LessonType;
            this.parkourNodes.active = LESSON_TYPE.Parkour == lessonCfg.LessonType;

            this.battleLabels.active = LESSON_TYPE.Battle == lessonCfg.LessonType;
            this.parkourLabels.active = LESSON_TYPE.Parkour == lessonCfg.LessonType;
            
            this.title.string = `${lessonCfg.LessonName}`;

            if(LESSON_TYPE.Battle == lessonCfg.LessonType) {
                this.enemyTeamsToggles.node.children.forEach( (_ndChild, _idx) => {
                    let comp = _ndChild.getComponent(cc.Toggle)
                    if (comp) {
                        if (_idx == this._subChapter) {
                            comp.check()
                        } else {
                            comp.uncheck()
                        }
                    }
                })
                this._refreshBattleView(lessonCfg);
            } else {
                this._refreshParkourView(lessonCfg);
            }

           this._releaseRewards();
            // 刷新奖励
            const rewardsStr = lessonCfg.LessonRewardShow;
            const strList = rewardsStr.split("|").map(_str => { return _str.split(';') });
            this.rewardsParent.opacity = 0;
            for(let i = 0; i < strList.length; ++i) {
                let itemId: number = Number(strList[i][0]);
                let count: number = Number(strList[i][1]);
                const itemBag = ItemBagPool.get();
                this.rewardsParent.addChild(itemBag.node);
                itemBag.node.scale = 0.7;
                itemBag.init({
                    id: itemId,
                    count: count,
                    clickHandler: () => {
                        moduleUIManager.showItemDetailInfo(itemId, count, guiManager.sceneNode);
                    }
                })
            }
            cc.tween(this.rewardsParent).to(0.2, {opacity: 255}).start();
        }
    }

    private _refreshBattleView (lessonCfg: cfg.AdventureLesson) {
        const enemyGroupStr = lessonCfg.LessonMonsterGroupId;
        let ememies = enemyGroupStr.split(";").map(_v => { return parseInt(_v)});
        this.ndSubBattle.active = ememies.length > 1;

        let enemyGroup = ememies[this._subChapter];
        if (!enemyGroup) return;

        const enemyGroupCfg = configUtils.getMonsterGroupConfig(enemyGroup);
        let enemyList: number[] = [];
        if(enemyGroupCfg) {
            const pushEnemyFunc = (monsterId: number) => {
                if(monsterId) {
                   enemyList.push(monsterId)
                }
            }
            pushEnemyFunc(enemyGroupCfg.MonsterId1);
            pushEnemyFunc(enemyGroupCfg.MonsterId2);
            pushEnemyFunc(enemyGroupCfg.MonsterId3);
            pushEnemyFunc(enemyGroupCfg.MonsterId4);
            pushEnemyFunc(enemyGroupCfg.MonsterId5);
            if(enemyGroupCfg.BossCorona) {
                let index: number = Number(enemyGroupCfg.BossCorona);
                if(index > 0) {
                    [enemyList[0], enemyList[index]] = [enemyList[index], enemyList[0]];
                }
            }
        }
        this._showEnemy(enemyList);
    }

    onClickSub (click: any, customEventData: string) {
        let clickIdx = parseInt(customEventData);
        if (clickIdx == this._subChapter) return;
        this._subChapter = clickIdx;
        const lessonCfg = this._getLessonCfg();
        this._refreshBattleView(lessonCfg);
    }

    private _showEnemy (enemyList: number[]) {
        this.enemyTeamsParent.opacity = 0;
        this._releaseEnemyTeam();
        for(let i = 0; i < enemyList.length; ++i) {
            if (!enemyList[i]) continue;
            const item = this._getEnemyItem();
            this.enemyTeamsParent.addChild(item);
            item.getComponent(ItemLevelMapEnemy).init(enemyList[i], i == 0);
        }
        cc.tween(this.enemyTeamsParent).to(0.2, {opacity: 255}).start();
    }

    private _refreshParkourView(lessonCfg: cfg.AdventureLesson) {
        const url = lessonCfg.LessonRunShow;
        this._spriteLoader.changeSpriteP(this.parkourBg, url);
    }

    onClickUseInitTeamToggle() {
        this._updateUseInitTeamState();
    }

    private _getEnemyItem() {
        let itemNd = cc.instantiate(this.tamplateEmeny);
        let item = itemNd.getComponent(ItemLevelMapEnemy);
        this._enemyPool.push(item);
        return itemNd;
    }

    private _releaseRewards() {
        let children = [...this.rewardsParent.children];
            children.forEach(_c => {
                _c.scale = 1;
                ItemBagPool.put(_c.getComponent(ItemBag));
            }
        );
    }

    private _releaseEnemyTeam() {
        this._enemyPool.forEach(_i => {
            _i.deInit();
            _i.node.removeFromParent()
        })
        this._enemyPool = []
    }

    private _getLessonCfg(): cfg.AdventureLesson {
        const lessonCfg = configUtils.getLessonConfig(this._lessonId);
        return lessonCfg;
    }

    private _getUseInitTeamState(): boolean {
        return localStorageMgr.getAccountStorage(`${INIT_TEAM_LOCAL_KEY}${this.lessonType}`) || false;
    }

    private _updateUseInitTeamState() {
        localStorageMgr.setAccountStorage(`${INIT_TEAM_LOCAL_KEY}${this.lessonType}`, this.useInitTeam.isChecked);
    }

}