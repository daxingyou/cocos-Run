import { SCENE_NAME, VIEW_NAME } from "../../../../app/AppConst";
import { PVE_MODE, QUALITY_TYPE } from "../../../../app/AppEnums";
import { PveConfig } from "../../../../app/AppType";
import { utils } from "../../../../app/AppUtils";
import { ROLE_TYPE } from "../../../../app/BattleConst";
import { configUtils } from "../../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { configManager } from "../../../../common/ConfigManager";
import { eventCenter } from "../../../../common/event/EventCenter";
import { yyBookEvent } from "../../../../common/event/EventData";
import guiManager from "../../../../common/GUIManager";
import moduleUIManager from "../../../../common/ModuleUIManager";
import { ItemBagPool } from "../../../../common/res-manager/NodePool";
import { PreloadItemPveRolePool } from "../../../../common/res-manager/Preloaders";
import { cfg } from "../../../../config/config";
import { gamesvr } from "../../../../network/lib/protocol";
import { bagData } from "../../../models/BagData";
import { pveData } from "../../../models/PveData";
import { pveTrialData } from "../../../models/PveTrialData";
import { userData } from "../../../models/UserData";
import { pveDataOpt } from "../../../operations/PveDataOpt";
import UIRole from "../../../template/UIRole";
import ItemBag from "../../view-item/ItemBag";
import ItemRole from "../../view-item/ItemRole";
import YYBookBtnTrigrams from "./YYBookBtnTrigrams";
import YYBookLigature from "./YYBookLigature";
import YYBookTrigrams from "./YYBookTrigrams";

const PURPLE = cc.color(128, 0, 255);

const {ccclass, property} = cc._decorator;

@ccclass
export default class PVEYYBookView extends ViewBaseComponent {
    @property([cc.SpriteFrame]) portalSpriteFrames: cc.SpriteFrame[] = [];
    @property([cc.SpriteFrame]) ligatureSpriteFrames: cc.SpriteFrame[] = []; 

    @property(cc.Prefab) yyBookBtnTrigramsPrefab: cc.Prefab = null; // 卦象按钮 Prefab
    @property(cc.Prefab) yyBookTrigramsPrefab: cc.Prefab = null;    // 卦象Item Prfab
    @property(cc.Prefab) yyBookLigaturePrefab: cc.Prefab = null;    // 连线

    @property(cc.Node) ligatureParent: cc.Node = null;          // 连线父节点
    @property([cc.Node]) btnTrigramsPosArr: cc.Node[] = [];     // 卦象按钮Pos
    @property([cc.Node]) trigramsPosArr: cc.Node[] = [];        // 卦象Pos
    @property(cc.Sprite) portal: cc.Sprite = null;              // 卦盘
    @property(cc.Label) rewardIncrease: cc.Label = null;        // 奖励增幅
    @property(cc.Node) layoutRewards: cc.Node = null;           // 奖励layout
    @property(cc.Label) remainTimes: cc.Label = null;           // 剩余次数
    @property(cc.Node) btnActive: cc.Node = null;               // 激活按钮
    @property(cc.Node) btnEnterPve: cc.Node = null;             // 挑战按钮
    @property(cc.Node) btnCancle: cc.Node = null;               // 取消按钮

    private _TRIGRAMS_COUNT = 4;                                // 界面卦象个数

    private _trigrams: number[] = [];                           // 卦象(根据sever返回)
    private _trigramsHeroIDs: number[] = [];                    // 卦象上的英雄，下标为卦象对应1-8数字，值为英雄ID
    private _isActive: boolean = false;                         // 卦盘的状态
    private _yyBookCfg: cfg.PVEOpenDoor = null;                 // 试炼配置
    
    private _trigramsButtons: YYBookBtnTrigrams[] = [];         // 卦象对应的按钮
    private _trigramsItems: YYBookTrigrams[] = [];              // 卦象对应的卦象Item
    private _trigramsLigature: YYBookLigature[] = [];           // 卦象连线
    private _itemBags: ItemBag[] = [];                          // 背包Item


    private _functionID: number;

    preInit(...rest: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            PreloadItemPveRolePool()
            .start(() => {
                resolve(true);
            });
        });
    }

    onInit(functionID: number) {
        this._functionID = functionID;

        this._prepareData();
        if (this._isDataValid()) {
            this.registerEventCenter();
            this._initView();
            this._refrshView();
        }
    }

    onRelease() {
        this._trigramsButtons.forEach((item) => { item && (item.deInit()); });
        this._trigramsItems.forEach((item) => { item && (item.deInit()); });
        this._trigramsLigature.forEach((item) => { item && (item.deInit()); });
        
        this._clearItemBags();
        eventCenter.unregisterAll(this);
        guiManager.removeCoinNode(this.node);

        for (let i = 0; i < this._trigramsHeroIDs.length; ++i) {
            pveTrialData.trigramsHeroIDs[i] = this._trigramsHeroIDs[i];
        }
        pveTrialData.isTrigramsActive = this._isActive;
    }

    onRefreshView() {
        this._prepareData();
        this._refrshView();
    }

    private registerEventCenter() {
        eventCenter.register(yyBookEvent.ACTIVE_TRIGRAMS, this, this.onActiveTrigrams);
        eventCenter.register(yyBookEvent.REFRESH_VIEW, this, this.onRefreshView);
    }

    private _prepareData() {
        // 初始化数据
        this._trigramsHeroIDs.splice(0, this._trigramsHeroIDs.length);
        this._isActive = false;

        // 更新数据
        let heroIDs = pveTrialData.yyBookData.ActivateHeroIDList;
        if (heroIDs && heroIDs.length === this._TRIGRAMS_COUNT) {
            let heroCfg: cfg.HeroBasic = null;
            heroIDs.forEach((heroID) => {
                heroCfg = configUtils.getHeroBasicConfig(heroID);
                this._trigramsHeroIDs[heroCfg.HeroBasicTrigrams] = heroID;
            });

            this._isActive = true;
        } else if (pveTrialData.trigramsHeroIDs.length > 0) {
            pveTrialData.trigramsHeroIDs.forEach((heroID, idx) => {
                this._trigramsHeroIDs[idx] = heroID;
            });
            this._isActive = pveTrialData.isTrigramsActive;
        }
        
        this._trigrams = pveTrialData.yyBookData.HexagramIDList;
        this._yyBookCfg = configManager.getConfigByKey("pveOpenDoor", pveTrialData.yyBookData.LightDarkID);
    }

    private _isDataValid(): boolean {
        let isValid: boolean = true;

        if (!this._trigrams || this._trigrams.length !== this._TRIGRAMS_COUNT) {
            isValid = false;
        } else if (!this._yyBookCfg) {
            isValid = false;
        }
        

        return isValid;
    }

    private _initView() {
        // 货币栏
        guiManager.addCoinNode(this.node, this._functionID);

        // 卦象按钮、卦象和连线
        let yyBookBtnTrigrams: cc.Node = null;
        let yyBookTrigrams: cc.Node = null;
        let yyBookLigature: cc.Node = null;
        for (let i = 0; i < this._TRIGRAMS_COUNT; ++i) {
            yyBookBtnTrigrams = cc.instantiate(this.yyBookBtnTrigramsPrefab);
            yyBookTrigrams = cc.instantiate(this.yyBookTrigramsPrefab);
            yyBookLigature = cc.instantiate(this.yyBookLigaturePrefab);

            this.btnTrigramsPosArr[i].addChild(yyBookBtnTrigrams);
            this.trigramsPosArr[i].addChild(yyBookTrigrams);
            this.ligatureParent.addChild(yyBookLigature);
        }
    }

    private _refrshView() {
        // 卦象Button和卦象Item
        this._trigramsButtons.forEach((item) => { item && item.deInit(); });
        this._trigramsItems.forEach((item) => { item && item.deInit(); });
        this._trigramsLigature.forEach((item) => { item && item.deInit(); });

        this._trigramsButtons.splice(0, this._trigramsButtons.length);
        this._trigramsItems.splice(0, this._trigramsItems.length);
        this._trigramsLigature.splice(0, this._trigramsLigature.length);

        let yyBookBtnTrigrams: YYBookBtnTrigrams = null;
        let yyBookTrigrams: YYBookTrigrams = null;
        let yyBookLigature: YYBookLigature = null;
        let heroID: number = null;
        let startPos: cc.Vec2 = cc.v2(0, 0);
        let endPos: cc.Vec2 = cc.v2(0, 0);
        for (let i = 0; i < this._TRIGRAMS_COUNT; ++i) {
            yyBookBtnTrigrams = this.btnTrigramsPosArr[i].getComponentInChildren(YYBookBtnTrigrams);
            yyBookTrigrams = this.trigramsPosArr[i].getComponentInChildren(YYBookTrigrams);
            yyBookLigature = this.ligatureParent.children[i].getComponent(YYBookLigature);

            yyBookBtnTrigrams.init(this, this._trigrams[i], i);
            yyBookTrigrams.init(this._trigrams[i]);

            startPos = utils.getPositionInNode(yyBookBtnTrigrams.trigramsImage.node, this.ligatureParent);
            endPos = utils.getPositionInNode(this.trigramsPosArr[i], this.ligatureParent);
            yyBookLigature.init(startPos, endPos);

            this._trigramsButtons[this._trigrams[i]] = yyBookBtnTrigrams;
            this._trigramsItems[this._trigrams[i]] = yyBookTrigrams;
            this._trigramsLigature[this._trigrams[i]] = yyBookLigature;

            heroID = this._trigramsHeroIDs[this._trigrams[i]];
            if (heroID != null) {
                this.selectHero(this._trigrams[i], heroID);
            }
        }

        // 卦盘
        this._setProtalVisible(this._isActive);

        this._updateReward();

        // 剩余次数
        let cost = this._yyBookCfg.PVEOpenDoorPlayCost;
        let costResult = utils.parseStringTo1Arr(cost, ";");
        let bagCount: number = bagData.getItemCountByID(Number(costResult[0]));
        let time = Math.floor(bagCount / Number(costResult[1]));
        this.remainTimes.string = String(time);
    }
    
    /**
     * 选择英雄
     * @param trigrams 卦象
     * @param heroID 英雄ID
     */
    selectHero(trigrams: number, heroID: number) {
        this._trigramsHeroIDs[trigrams] = heroID;

        let colorAndIncrease = this._getColorAndIncrease(heroID);

        this._trigramsButtons[trigrams].addHeroRole(heroID);
        this._trigramsItems[trigrams].confirmTrigrams(colorAndIncrease.increase, colorAndIncrease.color);
        
        let sp: cc.SpriteFrame = this.ligatureSpriteFrames[0];
        this._isColorEqual(colorAndIncrease.color, PURPLE) && (sp = this.ligatureSpriteFrames[1]);
        this._isColorEqual(colorAndIncrease.color, cc.Color.ORANGE) && (sp = this.ligatureSpriteFrames[2]);
        this._trigramsLigature[trigrams].show(sp);

        this._updateReward();
    }

    /**
     * 移除英雄
     * @param trigrams 卦象
     */
    removeHero(trigrams: number) {
        this._trigramsHeroIDs[trigrams] = null;

        this._trigramsItems[trigrams].cancleTrigrams();
        this._trigramsLigature[trigrams].hide();

        this._updateReward();
    }

    /** 弹出选英雄弹窗
     * @param trigrams 卦象
     */
    showSelectHeroView(trigrams: number) {
        this.loadSubView(VIEW_NAME.PVE_YYBOOK_SELECT_HERO_VIEW, this, trigrams);
    }

    /** 是否显示卦盘 */
    private _setProtalVisible(isVisible: boolean) {
        this._isActive = isVisible;

        if (isVisible) {
            let color = this._getTotalColorAndIncrease().color;
            if (this._isColorEqual(color, cc.Color.WHITE)) {
                this.portal.spriteFrame = this.portalSpriteFrames[0];
            } else if (this._isColorEqual(color, cc.Color.GREEN)) {
                this.portal.spriteFrame = this.portalSpriteFrames[1];
            } else if (this._isColorEqual(color, cc.Color.BLUE)) {
                this.portal.spriteFrame = this.portalSpriteFrames[2];
            } else if (this._isColorEqual(color, PURPLE)) {
                this.portal.spriteFrame = this.portalSpriteFrames[3];
            } else if (this._isColorEqual(color, cc.Color.ORANGE)) {
                this.portal.spriteFrame = this.portalSpriteFrames[4];
            } else if (this._isColorEqual(color, cc.Color.RED)) {
                this.portal.spriteFrame = this.portalSpriteFrames[5];
            }
        }

        this._trigramsItems.forEach((item) => {
            item.node.active = !isVisible;
        });

        this.portal.node.active = isVisible;
        this.btnActive.active = !isVisible;
        this.btnCancle.active = isVisible;
        this.btnEnterPve.active = isVisible;
    }


    /** 对应卦象上是否存在英雄 */
    isTrigramsHaveHero(trigrams: number): boolean {
        return this._trigramsHeroIDs[trigrams] != null;
    }

    /** 刷新整体奖励增幅Lable */
    private _updateReward() {
        let colorAndIncrease = this._getTotalColorAndIncrease();

        // 奖励
        this._clearItemBags();

        let parseResult = utils.parseStingList(this._yyBookCfg.PVEOpenDoorRewardShow);
        let posArr = this._getRewardPosArr(parseResult.length);
        let itemBag: ItemBag = null;
        for (let i = 0; i < parseResult.length; ++i) {
            itemBag = ItemBagPool.get();
            this._itemBags.push(itemBag);
            itemBag.init({
                id: Number(parseResult[i][0]), 
                count: Number(Math.floor(parseResult[i][1] * (1 + colorAndIncrease.increase / 100))),
                clickHandler: () => { moduleUIManager.showItemDetailInfo(parseInt(parseResult[i][0]), parseInt(parseResult[i][1]), this.node); }
            });
            itemBag.node.setPosition(posArr[i].x, posArr[i].y);
            this.layoutRewards.addChild(itemBag.node);
        }

        this.rewardIncrease.node.color = colorAndIncrease.color;
        this.rewardIncrease.string = colorAndIncrease.increase > 0 ? `奖励+${colorAndIncrease.increase}%` : "";
    }

    /** 是否处于激活状态 */
    isProtalActive() {
        return this._isActive;
    }

    onBtnClose() {
        this.closeView();
    }

    onBtnActive() {
        // 检查卦象是否都放好英雄
        let isTrigramsEmpty = this._trigrams.find((item) => {
            return this._trigramsHeroIDs[item] == null;
        });
        if (isTrigramsEmpty != null) {
            guiManager.showDialogTips(1000152);
            return;
        }

        let heroIDs: number[] = this._trigrams.map((item) => {
            return this._trigramsHeroIDs[item];
        })
        pveDataOpt.reqTrialLightDarkActivateHexagram(heroIDs);
    }

    onBtnCancle() {
        pveDataOpt.reqTrialLightDarkActivateHexagram([]);
    }

    onBtnEnterPve() {
        // 检查门票是否足够
        let cost = this._yyBookCfg.PVEOpenDoorPlayCost;
        let costResult = utils.parseStringTo1Arr(cost, ";");
        let bagCount: number = bagData.getItemCountByID(Number(costResult[0]));
        let time = Math.floor(bagCount / Number(costResult[1]));
        if (time > 0) {
            let bgs: string[] = utils.parseStringTo1Arr(this._yyBookCfg.PVEOpenDoorFightScene, ";");
            let pveCfg: PveConfig = {
                lessonId: null,
                pveMode: PVE_MODE.YYBOOK,
                userLv: userData.lv,
                pveListId: 17020,
                battleBg: bgs[pveTrialData.yyBookData.SceneIndex],
                step: 0,
                passStep: [],
                banHeroList: [],
                monsterGroupIDs: pveTrialData.yyBookData.MonsterLineupIDList.map((item) => { return item; })
            }
            pveData.pveConfig = pveCfg;
            guiManager.loadScene(SCENE_NAME.BATTLE);
        } else {
            guiManager.showDialogTips(1000151);
        }
    }


    private _getRewardPosArr(count: number) {
        let posArr: {x: number, y: number}[] = [];
        let spaceX: number = 10;

        let tempNode = ItemBagPool.get();
        let width = tempNode.node.width;
        ItemBagPool.put(tempNode);
        let startX = -(count - 1) / 2 * (width + spaceX);

        for (let i = 0; i < count; ++i) {
            posArr.push({
                x: startX + (width + spaceX) * i,
                y: 0
            });
        }

        return posArr;
    }

    private _getColorAndIncrease(heroID: number) {
        let heroConfig = configUtils.getHeroBasicConfig(heroID);
        let parseResult = utils.parseStingList(this._yyBookCfg.PVEOpenDoorRewardAdd);
        let increase = 0;
        let color = cc.Color.WHITE;
        let result = parseResult.find((item) => {
            return Number(item[0]) === heroConfig.HeroBasicQuality;
        });
        if (result) {
            increase = Number(result[1]) / 100;
            if (Number(result[0]) === QUALITY_TYPE.SR) {
                color = PURPLE;
            } else if (Number(result[0]) === QUALITY_TYPE.SSR) {
                color = cc.Color.ORANGE;
            }
        }

        return { increase: increase, color: color };
    }

    private _getTotalColorAndIncrease() {
        let self = this;

        let increase: number = 0;
        this._trigramsHeroIDs.forEach((item) => {
            if (item != null) {
                increase += self._getColorAndIncrease(item).increase;
            }
        });

        let color: cc.Color = cc.Color.WHITE;
        if (increase >= 200) {
            color = cc.Color.RED;
        } else if (increase >= 150) {
            color = cc.Color.ORANGE;
        } else if (increase >= 100) {
            color = PURPLE;
        } else if (increase >= 50) {
            color = cc.Color.BLUE;
        } else if (increase >= 25) {
            color = cc.Color.GREEN;
        }

        return { increase: increase, color: color };
    }

    onActiveTrigrams(event: number, isActive: boolean) {
        this._setProtalVisible(isActive);
    }

    private _clearItemBags() {
        this._itemBags.forEach((item) => { item && ItemBagPool.put(item); });
        this._itemBags.splice(0, this._itemBags.length);
    }

    private _isColorEqual(color1: cc.Color, color2: cc.Color) {
        let isEqual: boolean = color1.a === color2.a && color1.r === color2.r && color1.g === color2.g && color1.b === color2.b;
        return isEqual;
    }
}
