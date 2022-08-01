import { PVP_MULT_BALLTE_MAX, RES_ICON_PRE_URL, SCENE_NAME } from "../../../../app/AppConst";
import { Vec2 } from "../../../../app/AppType";
import { configUtils } from "../../../../app/ConfigUtils";
import DragableItem from "../../../../common/components/DragableItem";
import List from "../../../../common/components/List";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../../common/event/EventCenter";
import { peakDuelEvent } from "../../../../common/event/EventData";
import guiManager from "../../../../common/GUIManager";
import { localStorageMgr, SAVE_TAG } from "../../../../common/LocalStorageManager";
import { logger } from "../../../../common/log/Logger";
import { SpriteLoader } from "../../../../common/ui-helper/SpriteLoader";
import { data } from "../../../../network/lib/protocol";
import { guildData } from "../../../models/GuildData";
import { pvpData } from "../../../models/PvpData";
import { userData } from "../../../models/UserData";
import { pvpDataOpt } from "../../../operations/PvpDataOpt";
import ItemPeakDuelTeam from "./ItemPeakDuelTeam";
import ItemResultReport from "./ItemResultReport";

/**调整队伍界面的类型*/
export enum ADJUST_TEAM_TYPE{
/**防守*/ DEFENSIVE = 1,
/**进攻*/ ATTACK,
/**战斗结算*/ COMBAT_SETTLEMENT
}

const {ccclass, property} = cc._decorator;
@ccclass
export default class PVPPeakDuelChangeTeamView extends ViewBaseComponent {
    @property(cc.Label) selfName: cc.Label = null;
    @property(cc.Label) familName: cc.Label = null;
    @property(cc.Sprite) headSpr: cc.Sprite = null;
    @property(cc.Sprite) headBg: cc.Sprite = null;
    @property(List) tempList: List = null;

    @property(cc.Node) enemyNode: cc.Node = null;
    @property(cc.Label) enemyName: cc.Label = null;
    @property(cc.Label) enemyFamilyName: cc.Label = null;
    @property(cc.Sprite) enemyHeadSpr: cc.Sprite = null;
    @property(cc.Sprite) enemyHeadBg: cc.Sprite = null;
    @property(List) enemyList: List = null;
    @property(cc.Label) tips: cc.Label = null;

    @property(cc.Label) showCountLb: cc.Label = null;
    @property(cc.Sprite) battleCountSp: cc.Sprite = null;
    @property(cc.Node) wenhao:cc.Node = null
    @property(ItemResultReport) reportList: ItemResultReport[] = [];

    private _items: ItemPeakDuelTeam[] = [];
    private _itemsEnemy: ItemPeakDuelTeam[] = [];
    private _heroIDMap: Map<number, number[]> = new Map();
    private _enemyHeroList: number[] = [];
    
    private _isDefensive: boolean = true;
    private _type: ADJUST_TEAM_TYPE = ADJUST_TEAM_TYPE.DEFENSIVE;

    private _spLoader: SpriteLoader = new SpriteLoader();


    onInit(heroMap: Map<number, number[]>, type: ADJUST_TEAM_TYPE = ADJUST_TEAM_TYPE.DEFENSIVE): void {
        if (heroMap) {
            this._heroIDMap.clear();
            this._heroIDMap = heroMap;
            if (heroMap.size < 3) {
                logger.error("PVPPeakDuelChangeTeamView ", "  mult heroTeamData lost!");
            }
        }
        else {
            heroMap = new Map();
            for (let i = 0; i < PVP_MULT_BALLTE_MAX; i++) {
                let tagStr = SAVE_TAG.PVP_MULT_BATTLE_LAST_TEAM + i;
                let localAccountData = localStorageMgr.getAccountStorage(tagStr);
                heroMap.set(i, localAccountData);
            }
            this._heroIDMap = heroMap;
        }
    
        this._isDefensive = (type == ADJUST_TEAM_TYPE.DEFENSIVE);
        this._type = type;
        this.tips.node.active = (type != ADJUST_TEAM_TYPE.COMBAT_SETTLEMENT);
        this._initSelfComp();
        //战斗和结算需要展示玩家列表
        switch (type) {
            case ADJUST_TEAM_TYPE.ATTACK:
            case ADJUST_TEAM_TYPE.COMBAT_SETTLEMENT:
                this._initEnemyComp();
                break;
        }

        this._initReportList();
        this._updateBattleResult();
    }

    /**页面释放清理*/
    onRelease() {
        this._spLoader.release();
        this.enemyList.numItems = 0;
        this.tempList.numItems = 0;
        this._items.forEach(item => {
            item.deInit();
        })
        this._itemsEnemy.forEach(item => {
            item.deInit();
        })
        eventCenter.unregisterAll(this);
    }

    onTeamRender(item: cc.Node, index: number) {
        let itemComp = item.getComponent(ItemPeakDuelTeam);
        itemComp.onInit(index,this._heroIDMap.get(index));
        this._items.push(itemComp);

        //结算界面不允许相关队列
        if (this._type == ADJUST_TEAM_TYPE.COMBAT_SETTLEMENT)
            return;
        
        let dragItem = item.getComponent(DragableItem);
        if (dragItem) {    
            dragItem.init(
                this.tempList.getComponent(cc.ScrollView),
                this.node,
                true,
                180,
                this._onItemClick.bind(this),
                this._onDragFuc.bind(this),
                null,
                null,
                index
            )
        }
    }

    onEnemyTeamRender(item: cc.Node, index: number) {
        let itemComp = item.getComponent(ItemPeakDuelTeam);
        
        this._enemyHeroList = pvpData.getPeakDuelEnemyGroup(index);

        itemComp.onInit(index, this._enemyHeroList,true);
        this._itemsEnemy.push(itemComp);
    }

    private _onItemClick(comp: DragableItem) {
        //点击时先全部重置状态
        this._items.forEach(item => { item.setChoosed(); });
        let team = comp.node.getComponent(ItemPeakDuelTeam);
        team && team.setChoosed(true);

    }

    private _updateBattleResult() {
        if (this._type != ADJUST_TEAM_TYPE.COMBAT_SETTLEMENT) {
            this.battleCountSp.node.active = true;
            this.showCountLb.node.active = false;
            return
        }
        this.battleCountSp.node.active = false;

        let result = pvpData.pvpPeakDuekFinishData?.EnterBattleResultList,win = 0;
        if (result) {
            result.forEach(battleResult => {
                if (battleResult?.BattleEndRes?.Win) win++;
            })
            this.showCountLb.string = `${win}/${result.length - win}`;
        }
    }

    private _onDragFuc(comp: DragableItem, copyItem: cc.Node, idx: number) {        
        for (let index = 0; index < this._items.length; index++) {
            let item = this._items[index];
            if (index != idx) {
                let itemWorldPos = this.node.getParent().convertToWorldSpaceAR(item.node.position);
                let rectA = new cc.Rect(itemWorldPos.x - item.node.width / 2, itemWorldPos.y + item.node.height,
                                        item.node.width / 2, item.node.height / 2);
                let rectCopy = new cc.Rect(copyItem.x + this.node.width / 2, copyItem.y + this.node.height / 2,
                                        copyItem.width / 2, copyItem.height / 2);
                //相交之后再判定中心点距离
                if (cc.Intersection.rectRect(rectCopy, rectA)) {
                    this._items[idx].deInit();
                    this._items[index].deInit();

                    let changePower = this._heroIDMap.get(index).concat();
                    let heros: number[] = this._heroIDMap.get(idx).concat();
                    this._heroIDMap.set(index, heros);
                    this._heroIDMap.set(idx, changePower);

                    //简易模式，相交就替换数据
                    this._items[idx].onInit(idx,this._heroIDMap.get(idx));
                    this._items[index].onInit(index, this._heroIDMap.get(index));
                    
                    //替换选中状态
                    let idxState = this._items[idx].isChoosed();
                    this._items[idx].setChoosed(this._items[index].isChoosed());
                    this._items[index].setChoosed(idxState);
                }
            }
        }
        
    }

    onChangeDefensiveTeam() {
        if (this._type == ADJUST_TEAM_TYPE.COMBAT_SETTLEMENT) {
            this.closeView();
            return;
        }

        //如果不是防守-就把英雄列表推送出去
        if (!this._isDefensive) {
            eventCenter.fire(peakDuelEvent.HERO_MULT_CHANGE_NTY, this._heroIDMap);
            super.closeView();
            return
        }

        let result: data.IPvpPeakDuelDefensiveLineupHero[] = [];
        for (let k = 0; k < this._heroIDMap.size; k++){
            let heros = this._heroIDMap.get(k).concat();
            let defensLis: data.IPvpPeakDuelDefensiveLineupHero = {};
            if (!heros) defensLis["DefensiveHeroList"] = [0, 0, 0, 0, 0];
            defensLis["DefensiveHeroList"] = heros;
            result.push(defensLis)
            let isAllow = this._checkArrayIsAllZero(heros);
            if (!isAllow) {
                guiManager.showTips("每个队伍至少上一人");
                return;
            }
        }
        pvpDataOpt.reqPeakDuelTradeDefensiveLineup(result);
        super.closeView();
    }

    private _checkArrayIsAllZero(nums: number[]): boolean {
        let result = false
        nums.forEach(num => {
            if (num > 0) result = true;
        })
        return result;
    }

    private _initSelfComp() {
        this.enemyNode.active = false;
        this.familName.string = guildData?.guildInfo?.Account?.Name || "暂无公会";
        this.selfName.string = userData.accountData?.Name;
        let headUrl = `${RES_ICON_PRE_URL.HEAD_IMG}/` + configUtils.getHeadConfig(userData.accountData.HeadID).HeadFrameImage;
        this._spLoader.changeSprite(this.headBg, headUrl);

        let frameUrl = `${RES_ICON_PRE_URL.HEAD_FRAME}/` + configUtils.getHeadConfig(userData.accountData.HeadFrameID).HeadFrameImage;
        this._spLoader.changeSprite(this.headSpr, frameUrl);
        
        this.tempList.numItems = this._heroIDMap.size;
    }

    /**敌方ui显示*/
    private _initEnemyComp() {
        if (pvpData.peakDuelEnemiesInfo?.User) {
            this.wenhao.active = false;
            this.enemyNode.active = true;

            this.enemyName.string = pvpData.peakDuelEnemiesInfo.User.Name;

            let headUrl = `${RES_ICON_PRE_URL.HEAD_IMG}/` + configUtils.getHeadConfig(pvpData.peakDuelEnemiesInfo.User.HeadID).HeadFrameImage;
            this._spLoader.changeSprite(this.enemyHeadBg, headUrl);
   
            let frameUrl = `${RES_ICON_PRE_URL.HEAD_FRAME}/` + configUtils.getHeadConfig(pvpData.peakDuelEnemiesInfo.User.HeadFrameID).HeadFrameImage;
            this._spLoader.changeSprite(this.enemyHeadSpr, frameUrl);
            this.enemyFamilyName.node.active = false;
            this.enemyList.numItems = 3;
        } 
    }

    /**战报查询按钮初始化*/
    private _initReportList() {
        this.reportList.forEach((itemRepot,idx) => {
            itemRepot.onInit(idx, this._type);
        })
    }

    closeView() {
        if (this._type == ADJUST_TEAM_TYPE.COMBAT_SETTLEMENT) {
            let msg = pvpData.pvpPeakDuekFinishData
            guiManager.loadModuleView("PVPPeakDuelOverView", msg, ()=> {
                guiManager.loadScene(SCENE_NAME.MAIN);
            })    
        }
        super.closeView();
    }
}