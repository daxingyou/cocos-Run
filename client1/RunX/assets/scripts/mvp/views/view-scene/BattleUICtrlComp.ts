import { PVP_MODE, PVE_MODE } from "../../../app/AppEnums";
import { utils } from "../../../app/AppUtils";
import { ROLE_TYPE } from "../../../app/BattleConst";
import { battleUtils } from "../../../app/BattleUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { configManager } from "../../../common/ConfigManager";
import guiManager from "../../../common/GUIManager";
import { cfg } from "../../../config/config";
import { bagData } from "../../models/BagData";
import { pveData } from "../../models/PveData";
import { pveFakeData } from "../../models/PveFakeData";
import { pvpData } from "../../models/PvpData";
import { battleUIOpt } from "../../operations/BattleUIOpt";
import HeroUnit from "../../template/HeroUnit";

const PREPARE_VIEW_INTERVAL = 300;
const { ccclass, property } = cc._decorator;

@ccclass
export default class BattleUICtrlComp extends cc.Component {
    @property(cc.Node) ndLeft: cc.Node = null;
    @property(cc.Node) ndRight: cc.Node = null;
    @property(cc.Node) ndTop: cc.Node = null;
    @property(cc.Node) ndDown: cc.Node = null;
    @property(cc.Node) tipsBg: cc.Node = null;
    @property(cc.Label) tips: cc.Label = null;
    @property(cc.Label) levelNum: cc.Label[] = [];
    @property(cc.Label) title: cc.Label = null;
    @property(cc.Node) ndPreset: cc.Node = null;
    @property(cc.Node) ndPresetBG: cc.Node = null;
    @property(cc.Node) ndPresetButton: cc.Node = null;
    @property(cc.Node) ndDebug: cc.Node = null;

    private _powerSelf = 0;
    private _powerEmeny = 0;

    onInit () {
        this._resetBattleStatistic();
    }

    deInit () {
        cc.Tween.stopAllByTarget(this.tips);
        this.node.stopAllActions();
    }

    show () {
        let winSize = cc.winSize;
        this.ndTop.stopAllActions();
        this.ndTop.runAction(cc.moveTo(0.3, cc.v2(this.ndTop.x, winSize.height / 2)))

        this.ndDown.stopAllActions();
        this.ndDown.runAction(cc.moveTo(0.3, cc.v2(this.ndDown.x, -winSize.height / 2)))

        // TODO 不隐藏左边仙缘技能展示
        this.ndLeft.stopAllActions();
        this.ndLeft.runAction(cc.moveTo(0.3, cc.v2(-winSize.width / 2, this.ndLeft.y)))

        this.ndRight.stopAllActions();
        this.ndRight.runAction(cc.moveTo(0.3, cc.v2(winSize.width / 2, this.ndRight.y)))


        this.ndDebug.active = false

        //#ZQBDEBUG
        this.ndDebug.active = true
        //ZQBDEBUG#

        this.ndPresetButton.active = true;

        if (pveData.pveConfig){
            if (pveData.pveConfig.pveMode == PVE_MODE.MAGIC_DOOR){
                this.ndPresetButton.active = false;
            }

            if (pveData.pveConfig.pveMode == PVE_MODE.ADVENTURE_LESSON){
                this.title.string = "冒险";
                return;
            }

            if (pveData.pveConfig.pveListId){
                let pveListCfg: cfg.PVEList = configManager.getConfigByKey("pveList", pveData.pveConfig.pveListId );
                if (pveListCfg) {
                    this.title.string = pveListCfg.PVEListName;
                    return;
                }
            }
            this.title.string = "";
        }
        else if (pvpData.pvpConfig) {
            if (pvpData.pvpConfig.pvpMode == PVP_MODE.DEIFY_COMBAT){
                this.title.string = "鹤鸣武会";
            } else if (pvpData.pvpConfig.pvpMode == PVP_MODE.IMMORTALS_RANK){
                this.title.string = "齐云问道";
            }
            this.title.string = "";
        }
    }

    hide () {
        cc.Tween.stopAllByTarget(this.tips.node);
        this.tipsBg.active = false;

        this.ndTop.stopAllActions();
        this.ndTop.runAction(cc.moveTo(0.3, cc.v2(this.ndTop.x, this.ndTop.y + PREPARE_VIEW_INTERVAL)))

        this.ndDown.stopAllActions();
        this.ndDown.runAction(cc.moveTo(0.3, cc.v2(this.ndDown.x, this.ndDown.y - PREPARE_VIEW_INTERVAL)))

        // TODO 不隐藏左边仙缘技能展示
        this.ndLeft.stopAllActions();
        this.ndLeft.runAction(cc.moveTo(0.3, cc.v2(this.ndLeft.x - PREPARE_VIEW_INTERVAL, this.ndLeft.y)))

        this.ndRight.stopAllActions();
        this.ndRight.runAction(cc.moveTo(0.3, cc.v2(this.ndRight.x + PREPARE_VIEW_INTERVAL, this.ndRight.y)))
    }

    onRefresh (heroIDs: number[], monsterIDs: number[]) {
        this.refreshMonstersTeamPower(monsterIDs);
        this.refreshHerosTeamPower(heroIDs);
        this._resetTips();
        this.ndPresetBG.active = this.ndPreset.active = false;
    }

    onClickPreset () {
        let visible = !this.ndPreset.active;
        visible ? this._openPresetView() : this._closePresetView();
    }

    private _openPresetView() {
        this.ndPreset.x = cc.winSize.width / 2 + this.ndPreset.width;
        this.ndPreset.active = true;
        cc.tween(this.ndPreset).to(0.15, {x: cc.winSize.width / 2}, {easing: 'circIn'}).call(() =>{
            this.ndPresetBG.active = true;
        }).start();
    }

    private _closePresetView() {
        cc.Tween.stopAllByTarget(this.ndPreset);
        cc.tween(this.ndPreset).to(0.15, {x: cc.winSize.width / 2 + this.ndPreset.width}, {easing: 'circOut'}).call(() => {
            this.ndPreset.active = false;
            this.ndPresetBG.active = false;
        }).start();
    }

    //设置提示
    private _resetTips () {
        this.tipsBg.active = false;
        if (pveData.pveConfig) {
            let mode = pveData.pveConfig.pveMode;
            //九幽森罗
            if(mode == PVE_MODE.NINE_HELL){
                let text = configUtils.getDialogCfgByDialogId(99000055).DialogText;
                this.tips.string = text;
                this.tips.node.opacity = 255;
                this.tipsBg.active = true;
                cc.tween(this.tips.node).repeatForever(cc.tween().to(1, {opacity: 25}, {easing: 'fade'}).to(1, {opacity: 255}, {easing: 'fade'})).start()
                return;
            }
        }
    }

    refreshMonstersTeamPower(monsterIDs: number[]) {
        let enemyPowers: number = 0
        let pvp = !!pvpData.pvpConfig;
        if (pvp) {
            let pvpCfg = pvpData.pvpConfig
            this.ndRight.active = true;

            if (pvpCfg.pvpMode == PVP_MODE.DEIFY_COMBAT) {
               if (pvpCfg.replay) {
                    for(let i = 0; i < monsterIDs.length; ++i) {
                        let heroId: number = monsterIDs[i];
                        if (!heroId) continue;
                        let heroUnit: HeroUnit = new HeroUnit(heroId)
                        if (heroUnit && heroUnit.isHeroBasic) {
                            enemyPowers += heroUnit.getCapability();
                        }
                    }
                } else if (pvpData.spiritData) {
                    let spriteData = pvpData.getSpiritEnemyUnit()
                    enemyPowers = spriteData? spriteData.Power : 0
                }
            }

            if (pvpCfg.pvpMode == PVP_MODE.IMMORTALS_RANK && pvpData.fairyData) {
                let fairyData = pvpData.getFairyEnemyUnit()
                enemyPowers = fairyData? utils.longToNumber(fairyData.Power) : 0;
            }

            if (pvpCfg.pvpMode == PVP_MODE.PEAK_DUEL && pvpData.peakDuelData) {
                enemyPowers = pvpData.peakDuelEnemiesInfo.PVPPeakDuelDefensiveHeroList[pvpData.pvpConfig.step].Power;
            }
        } else {
            let sumPower: number = 0;
            let mode = pveData.pveConfig && pveData.pveConfig.pveMode;
            monsterIDs.forEach(_monsterId => {
                if(_monsterId == 0) return;
                let power: number = 0;

                //奇门遁甲敌方阵容是英雄ID,需要转换成对应的英雄
                if (mode == PVE_MODE.MAGIC_DOOR) {
                  let enemyUnit = pveFakeData.getFakeHeroById(_monsterId)
                  enemyUnit && (power = enemyUnit.getCapability());
                }else{
                  power = battleUtils.getMonsterPower(_monsterId)
                }
                sumPower += power;
            });
            enemyPowers = sumPower
        }
        this._powerEmeny = enemyPowers;
        this.levelNum[ROLE_TYPE.MONSTER - 1].string = `${enemyPowers}`;
        this._asyncPower();
    }

    refreshHerosTeamPower(heroIDs: number[]) {
        let teamPowers: number = 0;
        const heroList: number[] = utils.deepCopyArray(heroIDs);
        if (heroList.length >= 1) {
            for(let i = 0; i < heroList.length; ++i) {
                let heroId: number = heroList[i];
                let heroUnit: HeroUnit = pveData.magicDoor ? pveFakeData.getFakeHeroById(heroId) : bagData.getHeroById(heroId);
                if (heroUnit && heroUnit.isHeroBasic) {
                    teamPowers += heroUnit.getCapability();
                }
            }
        }
        this._powerSelf = teamPowers;
        this.levelNum[ROLE_TYPE.HERO - 1].string = `${teamPowers}`;
        this._asyncPower();
    }

    // 记录一份数据纯粹是为了避免重复计算
    private _asyncPower () {
        battleUIOpt.setTeamPowers([this._powerSelf, this._powerEmeny])
    }

    private _resetBattleStatistic(){
        let btn = cc.find('DOWN/battleStatistic', this.node);
        cc.isValid(btn) && (btn.active = guiManager.isDebug);
    }
}