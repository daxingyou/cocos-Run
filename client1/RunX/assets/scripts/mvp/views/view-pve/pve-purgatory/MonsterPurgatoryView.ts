import { SCENE_NAME } from "../../../../app/AppConst";
import { HEAD_ICON, PVE_MODE } from "../../../../app/AppEnums";
import { PveConfig } from "../../../../app/AppType";
import { utils } from "../../../../app/AppUtils";
import { resPathUtils } from "../../../../app/ResPathUrlUtils";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { configManager } from "../../../../common/ConfigManager";
import guiManager from "../../../../common/GUIManager";
import moduleUIManager from "../../../../common/ModuleUIManager";
import { ItemBagPool, ItemHeadMonsterPool, ItemHeroHeadSquarePool } from "../../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../../config/config";
import { data } from "../../../../network/lib/protocol";
import { pveData } from "../../../models/PveData";
import { pveTrialData } from "../../../models/PveTrialData";
import { userData } from "../../../models/UserData";
import ItemBag from "../../view-item/ItemBag";
import ItemHeadMonster from "../../view-item/ItemHeadMonster";
import ItemHeadSquare from "../../view-item/ItemHeadSquare";

const {ccclass, property} = cc._decorator;

@ccclass
export default class MonsterPurgatoryView extends ViewBaseComponent {

    @property(cc.Node) layoutMonster: cc.Node = null;
    @property(cc.Node) layoutReward: cc.Node = null;

    itemBags: ItemBag[] = new Array();
    spriteLoader: SpriteLoader = new SpriteLoader();

    pointInfo: data.ITrialPointInfo;
    private _battleBg: string;
    private _itemHeadMonsters: ItemHeadMonster[] = [];

    onInit(pointInfo: data.ITrialPointInfo, battleBg: string) {
        this.pointInfo = pointInfo;
        this._battleBg = battleBg;

        let self = this;

        // 展示怪物
        let itemHeadMonster: ItemHeadMonster = null;
        pointInfo.Monster.Roles.forEach((role) => {
            itemHeadMonster = ItemHeadMonsterPool.get();
            this._itemHeadMonsters.push(itemHeadMonster);
            itemHeadMonster.init(role.ID);
            self.layoutMonster.addChild(itemHeadMonster.node);
        });

        // 展示奖励
        let parseResult: any[] = null;
        if (pointInfo.Type === data.TrialPointInfo.PointType.PTBoss) {
            // 展示BOSS奖励
            let basicConfig: cfg.PVEInfernalBasic = configManager.getConfigByKey("pveInfernalBasic", pveTrialData.getPurgatoryCurStorey());
            if (basicConfig != null) {
                parseResult = utils.parseStingList(basicConfig.PVEInfernalBasicRewardShow);
                
            }
        } else if (pointInfo.Type === data.TrialPointInfo.PointType.PTMonster) {
            // 展示小怪奖励
            let monsterConfig: cfg.PVEInfernalMonster = configManager.getConfigByKey("pveInfernalMonster", pointInfo.PointID);
            if (monsterConfig != null) {
                parseResult = utils.parseStingList(monsterConfig.PVEInfernalMonsterRewardShow);
            }
        }

        if (parseResult != null) {
            let itemBag: ItemBag = null;
            for (let i = 0; i < parseResult.length; ++i) {
                itemBag = ItemBagPool.get();
                itemBag.init({
                    id: parseInt(parseResult[i][0]),
                    count: parseInt(parseResult[i][1]),
                    clickHandler: () => { moduleUIManager.showItemDetailInfo(parseInt(parseResult[i][0]), parseInt(parseResult[i][1]), self.node); }
                });
                self.layoutReward.addChild(itemBag.node);
                self.itemBags.push(itemBag);
            }
        }
    }

    onRelease() {
        this.itemBags.forEach((item) => {
            ItemBagPool.put(item);
        });
        this.itemBags.splice(0, this.itemBags.length);

        this._itemHeadMonsters.forEach((item) => {
            ItemHeadMonsterPool.put(item);
        });
        this._itemHeadMonsters.splice(0, this._itemHeadMonsters.length);

        this.spriteLoader.release();
    }

    onBtnClose() {
        this.closeView();
    }

    onBtnYes() {
        let monsterIDs: number[] = [];
        this.pointInfo.Monster.Roles.forEach((role, idx) => {
            monsterIDs[this.pointInfo.Monster.RolePos[idx]] = role.ID;
        });

        let pveConfig: PveConfig = {
            lessonId: null,
            userLv: userData.lv,
            pveMode: PVE_MODE.PURGATORY,
            monsterIds: monsterIDs,
            pveListId: 17017,
            pointUID: this.pointInfo.PointUID,
            battleBg: this._battleBg
        }

        pveData.pveConfig = pveConfig;
        guiManager.loadScene(SCENE_NAME.BATTLE);

        this.onBtnClose();
    }
}
