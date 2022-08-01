import { CustomDialogId, RES_ICON_PRE_URL, SCENE_NAME } from "../../../app/AppConst";
import { configUtils } from "../../../app/ConfigUtils";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { pvpData } from "../../models/PvpData";
import { PvpConfig } from "../../../app/AppType";
import { PVP_MODE } from "../../../app/AppEnums";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import ItemBag from "../view-item/ItemBag";
import guiManager from "../../../common/GUIManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PVPFightListItem extends cc.Component {
    @property(cc.Label) enemyName: cc.Label = null;
    @property(cc.Label) lv: cc.Label = null;
    @property(cc.Label) rank: cc.Label = null;
    @property(cc.Label) power: cc.Label = null;
    @property(cc.Sprite) head: cc.Sprite = null;
    @property(cc.Sprite) headFrame: cc.Sprite = null;
    @property(cc.Node) heroMap: cc.Node = null;

    private _getBuff: Function = null;
    private _meetBuff: Function = null;
    private _itemBags: ItemBag[] = [];
    private _fightId: number = 0;
    private _sprLoader: SpriteLoader = new SpriteLoader();

    /**
     * @param enemyId 敌方Id
     * @param func 获取Buff
     * @param buffMeet buff货币足够
     */
    init(enemyId: number, func: Function, buffMeet:Function) {
        this._fightId = enemyId;
        this._getBuff = func;
        this._meetBuff = buffMeet;
        this.showView();
    }

    reuse() {

    }

    unuse() {
        this._clearItems();
        this._sprLoader.release();
    }

    private _clearItems() {
        this._itemBags.forEach(_i => {
            _i.node.removeFromParent();
            _i.deInit();
            ItemBagPool.put(_i)
        })
        this._itemBags = [];
    }

    onDestroy() {
    }


    showView() {
        this.showEnemyItem();
    }

    showEnemyItem() {
        let enemyInfo = pvpData.fairyData.FightUserList[this._fightId];
        this.enemyName.string = enemyInfo.Name;
        this.power.string = `战斗力：${enemyInfo.Power}`;
        this.lv.string = `${this.calUserLv(enemyInfo.Exp)}`
        //英雄展示
        this._clearItems();
        if (enemyInfo.HeroUnitMap) {
            for (const k in enemyInfo.HeroUnitMap){
                let ele = enemyInfo.HeroUnitMap[k];
                if (ele) {
                    let item = ItemBagPool.get();
                    item.init({
                        id: ele.ID,
                        star: ele.HeroUnit && ele.HeroUnit.Star,
                        clickHandler: () => { }
                    })
                    item.node.parent = this.heroMap;
                    this._itemBags.push(item);
                }
            }
        }
        
        let headUrl = configUtils.getHeadConfig(enemyInfo.HeadID).HeadFrameImage;
        let frameUrl = configUtils.getHeadConfig(enemyInfo.HeadFrameID).HeadFrameImage;
        this._sprLoader.changeSprite(this.head, `${RES_ICON_PRE_URL.HEAD_IMG}/${headUrl}`);
        this._sprLoader.changeSprite(this.headFrame, `${RES_ICON_PRE_URL.HEAD_FRAME}/${frameUrl}`);
    }

    onClickChallenge() {
        // 检查门票数量
        let cnt = pvpData.fairyData.ChallengeTimes;
        if (cnt && cnt > 0 && this._meetBuff()){
            let pvpConfig: PvpConfig = {
                pvpMode: PVP_MODE.IMMORTALS_RANK,
                fightId: this._fightId,
                buffs: this._getBuff(),
                enemyInfo: pvpData.fairyData.FightUserList[this._fightId]
            }
            pvpData.pvpConfig = pvpConfig;
            guiManager.loadScene(SCENE_NAME.BATTLE);
        } else if (!this._meetBuff()) {
            guiManager.showDialogTips(CustomDialogId.PVP_IMMORTAL_GOLD_NO_ENOUGH);
        } else {
            guiManager.showDialogTips(CustomDialogId.PVP_TICKET_NO_ENOUGH);
        }
    }

    calUserLv(exp: number): number {
        let expConfigs = configUtils.getLevelExpConfigsByType(3);
        let level: number = 1;
        if (exp) {
            let expCount: number = 0;
            let key: number = 0;
            for (const k in expConfigs) {
                expCount += expConfigs[k].LevelExpNeedNum;
                if (exp < expCount) {
                    level = Number(k);
                    break;
                }
                level = Number(k);
            }
        }
        return level;
    }
}
