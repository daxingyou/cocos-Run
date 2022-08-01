import { RES_ICON_PRE_URL } from "../../../../app/AppConst";
import { utils } from "../../../../app/AppUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import { SpriteLoader } from "../../../../common/ui-helper/SpriteLoader";
import { data } from "../../../../network/lib/protocol";

const {ccclass, property} = cc._decorator;
@ccclass
export default class ItemPeakDuelRecord extends cc.Component {
    @property(cc.Label) enemyName: cc.Label = null;
    @property(cc.Label) lv: cc.Label = null;
    @property(cc.Label) rankTempLb: cc.Label = null;
    @property(cc.Label) rankChangeLb: cc.Label = null;
    @property(cc.Label) power: cc.Label = null;
    @property(cc.Label) time: cc.Label = null;
    @property(cc.Sprite) head: cc.Sprite = null;
    @property(cc.Sprite) headFrame: cc.Sprite = null;
    @property(cc.Node) winMark: cc.Node = null;
    @property(cc.Node) loseMark: cc.Node = null;
    @property(cc.Node) ndRecord: cc.Node = null;

    private _sprLoader:SpriteLoader = new SpriteLoader();
    private _fightRecord: data.IPVPPeakDuelFight = null;
    private _clickRecordFunc: Function = null;
    onInit(info: data.IPVPPeakDuelFight,clickFunc:Function): void {
        this._fightRecord = info;
        this._clickRecordFunc = clickFunc;
        this.showItem();
    }

    deInit() {
    
    }

    showItem() {
        let enemyInfo = this._fightRecord.PVPPeakDuelIntegralUnit;
        this.enemyName.string = enemyInfo.User.Name;
        this.lv.string = `${this.calUserLv(enemyInfo.User.Exp)}`

        let power = 0;
        enemyInfo.PVPPeakDuelDefensiveHeroList.forEach(hero => {
            power += utils.longToNumber(hero.Power);
        })

        this.power.string = `战斗力：${power}`;
     
        // 胜负和战绩相关
        let wColor = this._fightRecord.IsWin ? cc.color(75,169,18) : cc.color(169,75,18); 
        
        this.rankChangeLb.node.color = wColor;
        this.rankChangeLb.string = `(+${this._fightRecord.IntegralChange || 0})`;
        this.rankTempLb.string = `${this._fightRecord.IntegralLast}`;
        this.winMark.active = this._fightRecord.IsWin;
        this.loseMark.active = !this._fightRecord.IsWin;
        this.time.string = utils.getFormatTime(utils.longToNumber(this._fightRecord.FightTime));
        
        let headUrl = configUtils.getHeadConfig(enemyInfo.User.HeadID).HeadFrameImage;
        let frameUrl = configUtils.getHeadConfig(enemyInfo.User.HeadFrameID).HeadFrameImage;
        this._sprLoader.changeSprite(this.head, `${RES_ICON_PRE_URL.HEAD_IMG}/${headUrl}`);
        this._sprLoader.changeSprite(this.headFrame, `${RES_ICON_PRE_URL.HEAD_FRAME}/${frameUrl}`);
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

    onClickRecordFunc() {
        this._clickRecordFunc && this._clickRecordFunc(this._fightRecord);
    }
}