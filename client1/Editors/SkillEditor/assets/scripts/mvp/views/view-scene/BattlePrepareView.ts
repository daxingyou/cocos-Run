import { ROLE_TYPE } from "../../../app/AppEnums";
import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { battleEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { csCmd, ReqBattleReady } from "../../../game/CS";
import { optManager } from "../../operations/OptManager";
import UIRole from "../../template/UIRole";
import ItemHeadSelect from "../view-item/ItemHeadSelect";
import BattleScene from "./BattleScene";

const {ccclass, property} = cc._decorator;

// 临时数据
const TEST_HERO = [114111, 124111, 134111, 154111, 154211];
const TEST_MONSTER = [800001, 800002, 800003, 800004, 800005];

@ccclass
export default class BattlePrepareView extends ViewBaseComponent {

    @property(cc.Node)          ndHeadRoot: cc.Node = null;
    @property(cc.Label)         levelNum: cc.Label[] = [];
    @property(cc.Prefab)        headSelect: cc.Prefab = null;
    @property(cc.Node)          ndTitle: cc.Node = null;

    // UI
    @property(cc.Node)          ndLeft: cc.Node = null;
    @property(cc.Node)          ndRight: cc.Node = null;
    @property(cc.Node)          ndTop: cc.Node = null;
    @property(cc.Node)          ndDown: cc.Node = null;

    private _headPool: cc.NodePool = new cc.NodePool();
    private _currSelect: number[] = [];
    private _currEnemy: number[] = [];
    private _candidate: number[] = [];
    private _currHeadItem: ItemHeadSelect[] = [];
    private _game: BattleScene = null;

    onInit (root: BattleScene) {
        eventCenter.register(battleEvent.BATTLE_START, this, this._whenBattleStart);

        this._game = root;
        this._currSelect = [].concat(TEST_HERO);
        this._currEnemy = [].concat(TEST_MONSTER);
        this._candidate = [];

        this._showHeroList(TEST_HERO);
        this._showEnemyList(TEST_MONSTER);
        this._showHeroCanSelect([]);
        this._showSkill();
        this._showTopInfo();

        this._showView();
    }

    // showView () {
    //     this._showView(); 
    // }

    deInit () {
        this._currHeadItem.forEach( _item => {
            if (_item && cc.isValid(_item)) {
                _item.deInit();
                _item.node.removeFromParent();
            }

        })
        this._currHeadItem = [];
    }

    onDestroy () {
        this.deInit();
        this.node.stopAllActions();
        eventCenter.unregisterAll(this);
    }

    getHeadItem (): cc.Node {
        if (this._headPool.size() > 0) {
            return this._headPool.get();
        } else {
            let item = cc.instantiate(this.headSelect);
            return item;
        }
    }

    onClickBeginGame () {
        let currSelect = this._currSelect.filter( _v => { return _v});
        if (currSelect.length == 0) {
            guiManager.showTips("至少选择一个武将上战场");
            return;
        }
        this._game.prepareGameBegin();
        let req: ReqBattleReady = {
            heroList: this._currSelect,
            enemyList: this._currEnemy
        }
        optManager.battleUIOpt.sendGame(csCmd.REQ_BATTLE_READY, req);
    }

    onClickPreSet () {
        guiManager.showTips("暂未开放")
    }

    onClickExit () {
        guiManager.loadScene('MainScene');
    }

     // 点击头像更换场上英雄
     private _clickCandidate (heroId: number) {
        let empty = this._game.heroCtrl.getFirstEmptyPos()
        if (empty < 0) {
            guiManager.showTips("阵容已满，无法更换");
            return;
        }

        let check = this._candidate.indexOf(heroId);
        if (check!= -1) {
            this._candidate.splice(check, 1);
            this._addHero(heroId, empty);
        }
        this._showHeroCanSelect(this._candidate);
    }

    // 点击场上英雄撤下来
    private _unSelectHero (heroId: number) {
        let currIdx = this._currSelect.indexOf(heroId);
        if (currIdx >= 0) {
            this._currSelect[currIdx] = 0;
            this._game.uiController.setPlus(currIdx, true);
            this._candidate.push(heroId);
            this._removeHero(heroId, currIdx);
            this._showHeroCanSelect(this._candidate);
        }
     
    }

    private _showHeroList (heroes: number[]) {
        heroes.forEach( (_id, _idx)=> {
            if (_id) {
                this._addHero(_id, _idx );
            }
        })
        this.levelNum[ROLE_TYPE.HERO - 1].string = "未开放";
    }

    private _showEnemyList (enemies: number[]) {
        enemies.forEach( (_id, _idx)=> {
            let cfg = configUtils.getMonsterConfig(_id);
            this._game.monsterCtrl.addRoleNode(
                new UIRole({
                    ID: cfg.MonsterId,
                    UID: 0,
                    HP: 0, MaxHP: 0, 
                    Buffs: [], 
                    Type: ROLE_TYPE.MONSTER,
                    Pos: _idx,
                    Power: 0
                })
            ), null
        })
        this.levelNum[ROLE_TYPE.MONSTER - 1].string = "未开放";
    }

    private _showHeroCanSelect (hero: number[]) {
        let self = this;
        hero.forEach( (_h,_idx) => {
            let currItem = self._currHeadItem[_idx];
            if (currItem && cc.isValid(currItem)) {
                // currItem.init(_h, self._clickCandidate.bind(self));
            } else {
                currItem = this.getHeadItem().getComponent(ItemHeadSelect);
                this.ndHeadRoot.addChild(currItem.node);
                self._currHeadItem[_idx] = currItem;
            }
            currItem.init(_h, self._clickCandidate.bind(self));
        })

        for (let i = hero.length; i < this._currHeadItem.length; i++) {
            let currItem = this._currHeadItem[i];
            if (currItem && cc.isValid(currItem)) {
                currItem.node.active = false
            }
        }
    }

    private _removeHero (id: number, pos: number) {
        this._game.heroCtrl.removeRole(id, pos);
    }

    private _addHero (id: number, pos: number) {
        let cfg = configUtils.getHeroConfig(id);
        this._game.heroCtrl.addRoleNode(new UIRole({
            ID: cfg.HeroId,
            UID: 0,
            HP: 0, MaxHP: 0, 
            Buffs: [], 
            Type: ROLE_TYPE.HERO,
            Pos: pos,
            Power: 0
        }), (heroId: number) => {
            this._unSelectHero(heroId);
        })
        this._game.uiController.setPlus(pos, false);
        this._currSelect[pos] = id;
    }

    private _showSkill () {
        // TODO
    }

    private _showTopInfo () {
        // TODO
        this.ndTitle.active = true;
    }

    private _whenBattleStart () {
        // this.node.active = false;
        this._hideView();
    }

    private _hideView () {
        this.ndTop.stopAllActions();
        this.ndTop.runAction(cc.moveTo(0.3, cc.v2(this.ndTop.x, this.ndTop.y + 200)))

        this.ndDown.stopAllActions();
        this.ndDown.runAction(cc.moveTo(0.3, cc.v2(this.ndDown.x, this.ndDown.y - 200)))

        this.ndLeft.stopAllActions();
        this.ndLeft.runAction(cc.moveTo(0.3, cc.v2(this.ndLeft.x - 200, this.ndLeft.y)))

        this.ndRight.stopAllActions();
        this.ndRight.runAction(cc.moveTo(0.3, cc.v2(this.ndRight.x + 200, this.ndRight.y)))
    }

    private _showView () {
        let winSize = cc.winSize;
        this.ndTop.stopAllActions();
        this.ndTop.runAction(cc.moveTo(0.3, cc.v2(this.ndTop.x, winSize.height/2)))

        this.ndDown.stopAllActions();
        this.ndDown.runAction(cc.moveTo(0.3, cc.v2(this.ndDown.x, -winSize.height/2)))

        this.ndLeft.stopAllActions();
        this.ndLeft.runAction(cc.moveTo(0.3, cc.v2(-winSize.width/2, this.ndLeft.y)))

        this.ndRight.stopAllActions();
        this.ndRight.runAction(cc.moveTo(0.3, cc.v2(winSize.width/2, this.ndRight.y)))
    }
}