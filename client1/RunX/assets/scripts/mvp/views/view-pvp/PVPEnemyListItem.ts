import { CustomDialogId, RES_ICON_PRE_URL, SCENE_NAME } from "../../../app/AppConst";
import { configUtils } from "../../../app/ConfigUtils";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { bagData } from "../../models/BagData";
import { pvpData } from "../../models/PvpData";
import { PvpConfig } from "../../../app/AppType";
import { PVP_MODE } from "../../../app/AppEnums";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import ItemBag from "../view-item/ItemBag";
import guiManager from "../../../common/GUIManager";
import { data } from "../../../network/lib/protocol";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PVPEnemyListItem extends cc.Component {
    @property(cc.Label) enemyName: cc.Label = null;
    @property(cc.Label) lv: cc.Label = null;
    @property(cc.Label) rank: cc.Label = null;
    @property(cc.Label) power: cc.Label = null;
    @property(cc.Sprite) head: cc.Sprite = null;
    @property(cc.Sprite) headFrame: cc.Sprite = null;
    @property(cc.Node) heroMap: cc.Node = null;

    private _cfg: cfg.PVPList = null;
    private _enemyId: number = 0;
    private _itemBags: ItemBag[] = [];
    private _sprLoader: SpriteLoader = new SpriteLoader();

    init(cfg: any, enemyId: number) {
        this._enemyId = enemyId;
        this._cfg = cfg;
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
            ItemBagPool.put(_i)
        })
        this._itemBags = [];
    }


    showView() {
        if (this._cfg) this.showEnemyItem();
    }

    showEnemyItem() {
        let enemyInfo = pvpData.spiritEnemyList[this._enemyId];
        this.enemyName.string = enemyInfo.RankUserUnit.Name;
        this.power.string = `战斗力：${enemyInfo.RankUserUnit.Power}`;
        this.rank.string = `排名：${enemyInfo.rank}`;
        this.lv.string = `${this.calUserLv(enemyInfo.RankUserUnit.Exp)}`
        //英雄展示
        this._clearItems();
        if (enemyInfo.RankUserUnit.HeroUnitMap) {
            for (const k in enemyInfo.RankUserUnit.HeroUnitMap){
                let ele = enemyInfo.RankUserUnit.HeroUnitMap[k];
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
        
        let headUrl = configUtils.getHeadConfig(enemyInfo.RankUserUnit.HeadID).HeadFrameImage;
        let frameUrl = configUtils.getHeadConfig(enemyInfo.RankUserUnit.HeadFrameID).HeadFrameImage;
        this._sprLoader.changeSprite(this.head, `${RES_ICON_PRE_URL.HEAD_IMG}/${headUrl}`);
        this._sprLoader.changeSprite(this.headFrame, `${RES_ICON_PRE_URL.HEAD_FRAME}/${frameUrl}`);
    }

    onClickChallenge() {
        // 检查门票数量
        let ticketId = this._cfg.PVPListNumShow;
        let cnt = bagData.getItemCountByID(ticketId);
        let userUnit = pvpData.spiritEnemyList[this._enemyId];
        if(cnt && cnt>0){
            const enemyList: {[k: string]: number} = {};
            if(userUnit) {
                for(const k in userUnit.RankUserUnit.HeroUnitMap) {
                    const heroUnit = userUnit.RankUserUnit.HeroUnitMap[k];
                    if(heroUnit) {
                        enemyList[k] = heroUnit.ID;
                    }
                }
            }
            let pvpConfig: PvpConfig = {
                pvpMode: PVP_MODE.DEIFY_COMBAT,
                enemySerial: this._enemyId,
                enemyUID: userUnit ? userUnit.RankUserUnit.UserID : "",
                enemyList: enemyList,
                enemyInfo: pvpData.spiritEnemyList[this._enemyId]?.RankUserUnit
            }
            pvpData.pvpConfig = pvpConfig;
            guiManager.loadScene(SCENE_NAME.BATTLE);
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
