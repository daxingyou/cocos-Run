import { utils } from "../../../../app/AppUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import { configManager } from "../../../../common/ConfigManager";
import { ItemBagPool } from "../../../../common/res-manager/NodePool";
import { cfg } from "../../../../config/config";
import { pveTrialData } from "../../../models/PveTrialData";
import { pveDataOpt } from "../../../operations/PveDataOpt";
import ItemBag from "../../view-item/ItemBag";
import ItemMonster from "./ItemMonster";
import guiManager from "../../../../common/GUIManager";
import PVEChallengeView from "./PVEChallengeView";
import MessageBoxView from "../../view-other/MessageBoxView";
import { SCENE_NAME, VIEW_NAME } from "../../../../app/AppConst";
import moduleUIManager from "../../../../common/ModuleUIManager";
import { SpriteLoader } from "../../../../common/ui-helper/SpriteLoader";
import { resPathUtils } from "../../../../app/ResPathUrlUtils";
import HeroUnit from "../../../template/HeroUnit";
import { HEAD_ICON, PVE_MODE } from "../../../../app/AppEnums";
import { PveConfig } from "../../../../app/AppType";
import { pveData } from "../../../models/PveData";
import { userData } from "../../../models/UserData";

const {ccclass, property} = cc._decorator;

@ccclass
export default class PVEchallengeStartNode extends cc.Component {

    @property(cc.Prefab) monsterPrefab: cc.Prefab = null;

    @property(cc.Sprite) headBg: cc.Sprite = null;
    @property(cc.Sprite) headImg: cc.Sprite = null;

    @property(cc.Label) labelProgress: cc.Label = null;
    @property(cc.Node) awardLayout: cc.Node = null;
    @property(cc.Label) labelDialog: cc.Label = null;
    @property(cc.Node) layoutMonster: cc.Node = null;

    root: PVEChallengeView = null;
    private _loadSubView: Function = null;

    items: ItemBag[] = [];
    itemMonsters: ItemMonster[] = [];

    maxChallengeLevel: number;  // 最大关卡数
    monsterConfig: cfg.PVEChallengeMonster; // 怪物配置

    spriteLoader: SpriteLoader = new SpriteLoader();

    onInit(root: PVEChallengeView, loadSubView: Function, maxChallengeLevel: number, monsterConfig: cfg.PVEChallengeMonster) {
        this.root = root;
        this._loadSubView = loadSubView;

        this.prepareData(maxChallengeLevel, monsterConfig);
        this.initView();
    }

    deInit() {
        this.itemMonsters.forEach((itemMonster) => {
            itemMonster.deInit();
        });

        this.clearItems();

        this.spriteLoader.release();
    }

    onRefresh(maxChallengeLevel: number, monsterConfig: cfg.PVEChallengeMonster) {
        this.prepareData(maxChallengeLevel, monsterConfig);
        this.refreshView();
    }

    prepareData(maxChallengeLevel: number, monsterConfig: cfg.PVEChallengeMonster) {
        this.maxChallengeLevel = maxChallengeLevel;
        this.monsterConfig = monsterConfig;
    }

    initView() {
        // 更换右上角按钮的头像和头像框
        let heroes = pveTrialData.respectData.Heroes;
        heroes.sort((a, b) => {
            // 战力由高到低
            let heroUnitA = new HeroUnit(a.ID);
            let heroUnitB = new HeroUnit(b.ID);
            return heroUnitB.getCapability() - heroUnitA.getCapability();
        });
        let heroID: number = heroes[0].ID;
        let heroConfig: cfg.HeroBasic = configUtils.getHeroBasicConfig(heroID);
        let headBgUrl: string = resPathUtils.getHeroCircleHeadFrame(heroConfig.HeroBasicQuality);
        let headImgUrl: string = resPathUtils.getItemIconPath(heroID, HEAD_ICON.CIRCLE);
        this.spriteLoader.changeSprite(this.headBg, headBgUrl);
        this.spriteLoader.changeSprite(this.headImg, headImgUrl);

        this.refreshView();
    }

    refreshView() {
        let respectData = pveTrialData.respectData;

        // 进度
        this.labelProgress.string = `${respectData.Progress+1} / ${this.maxChallengeLevel}`;

        // 奖励
        this.clearItems();
        let parseResult = utils.parseStingList(this.monsterConfig.PVEChallengeMonsterRewardShow);
        let item: ItemBag = null;
        for (let i = 0; i < parseResult.length; ++i) {
            item = ItemBagPool.get();
            this.items.push(item);

            item.init({
                id: parseResult[i][0],
                count: parseResult[i][1],
                clickHandler: () => {
                    moduleUIManager.showItemDetailInfo(Number(parseResult[i][0]), Number(parseResult[i][1]), this.root.node);
                }
            });

            this.awardLayout.addChild(item.node);
        }

        // dialog
        let dialogConfig: cfg.Dialog = configManager.getConfigByKey("dialogue", 99000068);
        if (dialogConfig && dialogConfig.DialogText) {
            this.labelDialog.string = dialogConfig.DialogText;
        }

        // 怪物
        let monsters = respectData.Monsters;
        if (this.itemMonsters.length === 0) {
            let monsterNode = null;
            for (let i = 0; i < monsters.length; ++i) {
                monsterNode = cc.instantiate(this.monsterPrefab);
                this.layoutMonster.addChild(monsterNode);

                this.itemMonsters.push(monsterNode.getComponent(ItemMonster));
            }
        }
        
        for (let i = 0; i < monsters.length; ++i) {
            this.itemMonsters[i].onInit(monsters[i], () => {
                let pveConfig: PveConfig = {
                    lessonId: null,
                    userLv: userData.lv,
                    pveMode: PVE_MODE.RESPECT,
                    monsterIds: [0, 0, monsters[i].ID, 0, 0],
                    pveListId: 17016,
                    battleBg: this.monsterConfig.PVEChallengeMonsterFightScene
                }

                pveData.pveConfig = pveConfig;
                guiManager.loadScene(SCENE_NAME.BATTLE);
            });
        }
    }

    onClickBtnChangeEnemy() {
        let configModule = configUtils.getModuleConfigs();
        let parseResult = utils.parseStingList(configModule.PVEChallengeChangeMonster);
        let itemConfig: cfg.Item = configManager.getConfigByKey("item", parseResult[0][0]);

        let config = configUtils.getDialogCfgByDialogId(2000022);
        config.DialogText = utils.convertFormatString(config.DialogText, [{itemnum: parseResult[0][1]}, {itemname: itemConfig.ItemName}])
        guiManager.showMessageBoxByCfg(this.root.node, config, (msgBox: MessageBoxView) => {
            msgBox.closeView();
        }, (msgBox: MessageBoxView) => {
            pveDataOpt.reqTrialRespectChangeEnemy();
            msgBox.closeView();
        });
    }

    onClickBtnShowMyHeroes() {
        this._loadSubView(VIEW_NAME.PVE_CHALLENGE_MY_HEROES_VIEW);
    }

    clearItems() {
        this.items.forEach((item) => {
            ItemBagPool.put(item);
        });
        this.items = [];
    }
}
