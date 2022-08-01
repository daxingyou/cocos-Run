import { RES_ICON_PRE_URL } from "../../../app/AppConst";
import { configUtils } from "../../../app/ConfigUtils";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { data } from "../../../network/lib/protocol";
import { utils } from "../../../app/AppUtils";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import ItemBag from "../view-item/ItemBag";
import guiManager from "../../../common/GUIManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PVPDeifyRecordItem extends cc.Component {
    @property(cc.Label) enemyName: cc.Label = null;
    @property(cc.Label) lv: cc.Label = null;
    @property(cc.Label) rankChange: cc.Label = null;
    @property(cc.Label) power: cc.Label = null;
    @property(cc.Label) time: cc.Label = null;
    @property(cc.Sprite) head: cc.Sprite = null;
    @property(cc.Sprite) headFrame: cc.Sprite = null;
    @property(cc.Node) heroMap: cc.Node = null;
    @property(cc.Node) winMark: cc.Node = null;
    @property(cc.Node) loseMark: cc.Node = null;
    @property(cc.Node) ndRecord: cc.Node = null;

    private _itemBags: ItemBag[] = [];
    private _fightRecord: data.IPVPSpiritFight = null;
    private _sprLoader: SpriteLoader = new SpriteLoader();
    private _clickRecord: Function = null;

    init(fight: data.IPVPSpiritFight, recallHandler: Function) {
        this._fightRecord = fight;
        this._clickRecord = recallHandler;
        this.showItem();
        this.ndRecord.active = !!fight.FightUID
    }

    deInit(){
        this._clearItems();
        this._sprLoader.release();
    }

    private _clearItems() {
        this._itemBags.forEach(_i => {
            ItemBagPool.put(_i)
        })
        this._itemBags = [];
    }

    unuse() {
        this.deInit();
    }

    reuse() {
    }

    showItem() {
        let enemyInfo = this._fightRecord.FightUserUnit;
        this.enemyName.string = enemyInfo.Name;
        this.power.string = `战斗力：${utils.longToNumber(enemyInfo.Power)}`;
        this.lv.string = `${this.calUserLv(enemyInfo.Exp)}`
        //英雄展示
        this._clearItems();
        if (enemyInfo.HeroUnitMap) {
            for (const k in enemyInfo.HeroUnitMap){
                let ele = enemyInfo.HeroUnitMap[k];
                if (ele) {
                    let item = ItemBagPool.get();
                    // 这里展示的数据不够详细
                    item.init({
                        id: ele.ID,
                        star: ele.HeroUnit && ele.HeroUnit.Star,
                        clickHandler: () => { }
                    })
                    this._itemBags.push(item);
                    item.node.parent = this.heroMap;
                }
            }
        }
        // 胜负和战绩相关
        let wColor = this._fightRecord.IsWin || !this._fightRecord.ChangeRank ? cc.color(233,125,35) : cc.color(255,0,0); 
        let winSymble = this._fightRecord.IsWin || !this._fightRecord.ChangeRank  ? "+" :  "";
        this.rankChange.node.color = wColor;
        this.rankChange.string = `排名：${winSymble}${this._fightRecord.ChangeRank || 0}`;
        this.winMark.active = this._fightRecord.IsWin;
        this.loseMark.active = !this._fightRecord.IsWin;
        this.time.string = utils.getFormatTime(utils.longToNumber(this._fightRecord.FightTime));
        
        let headUrl = configUtils.getHeadConfig(enemyInfo.HeadID).HeadFrameImage;
        let frameUrl = configUtils.getHeadConfig(enemyInfo.HeadFrameID).HeadFrameImage;
        this._sprLoader.changeSprite(this.head, `${RES_ICON_PRE_URL.HEAD_IMG}/${headUrl}`);
        this._sprLoader.changeSprite(this.headFrame, `${RES_ICON_PRE_URL.HEAD_FRAME}/${frameUrl}`);
    }

    onClickReply() {
        // 检查门票数量
       guiManager.showLockTips();
    }

    onClickRecord () {
        this._clickRecord && this._clickRecord(this._fightRecord);
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
