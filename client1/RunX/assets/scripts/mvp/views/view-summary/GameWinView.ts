import { eventCenter } from "../../../common/event/EventCenter";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { data, gamesvr } from "../../../network/lib/protocol";
import { CustomItemId, SCENE_NAME, TREASURE_SYS_POWER_TYPE } from "../../../app/AppConst";
import { PVE_MODE } from "../../../app/AppEnums";
import { pveData } from "../../models/PveData";
import { audioManager, SFX_TYPE } from "../../../common/AudioManager";
import { configUtils } from "../../../app/ConfigUtils";
import { userData } from "../../models/UserData";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import ItemBag from "../view-item/ItemBag";
import guiManager from "../../../common/GUIManager";
import moduleUIManager from "../../../common/ModuleUIManager";
import { utils } from "../../../app/AppUtils";
import { taskData } from "../../models/TaskData";
import { battleUIData } from "../../models/BattleUIData";
import { CustomPveFinishResult } from "../../../app/AppType";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameWinView extends ViewBaseComponent {
    @property(cc.Node) itemRoot: cc.Node = null;
    @property(cc.Label) lbLevel: cc.Label = null;
    @property(cc.ProgressBar) expProgressBar: cc.ProgressBar = null;
    @property(sp.Skeleton) winSpine: sp.Skeleton = null;
    @property(cc.Node) nextBtn: cc.Node = null;
    @property(cc.Node) tipsLabel: cc.Node = null;
    @property(cc.Node) roleNode: cc.Node = null;
    @property(cc.Node) ndReport: cc.Node = null;

    private _itemBags: ItemBag[] = [];
    private _closeHandler: Function = null;

    onInit(info: gamesvr.FinishPveRes | gamesvr.TrialHellFinishPveRes | gamesvr.TrialMiracleDoorFinishPveRes | CustomPveFinishResult, closeHandler: Function) {
        this._closeHandler = closeHandler;
        this.scheduleOnce(() => {
            this.roleNode.active = true;
            audioManager.playSfx(SFX_TYPE.GAME_WIN);
        }, 0.3);
        this.lbLevel.node.parent.active = false;
        let roleParent = this.roleNode.parent;
        let widgetComp = roleParent.getComponent(cc.Widget);
        if(cc.isValid(widgetComp)) widgetComp.updateAlignment();
        let rect = roleParent.getBoundingBox();
        this.roleNode.x = rect.xMin;
        this.roleNode.y = rect.yMin;

        this.nextBtn.active = false;
        this._showWinEnterAnim(() => {
            this._refreshView(info)
        });
        this.ndReport.active = battleUIData.isBattle;
        cc.tween(this.tipsLabel)
            .to(3, { opacity: 64 }, { easing: "sineOut" })
            .to(3, { opacity: 255 }, { easing: "sineIn" })
            .union().repeatForever().start();
    }

    private _refreshView(info: gamesvr.FinishPveRes | gamesvr.TrialHellFinishPveRes | gamesvr.TrialMiracleDoorFinishPveRes | CustomPveFinishResult) {
        if (info && info.Prizes){
            this._dealData(info)
            this._showPrize(info.Prizes);
        }

        this._updateExp(info);
    }

    onRelease() {
        this._clearItems();
        this.winSpine.clearTracks();
        this.releaseSubView();
        eventCenter.unregisterAll(this);
        this.unscheduleAllCallbacks();
        cc.tween(this.tipsLabel).stop();
    }


    private _clearItems() {
        this._itemBags.forEach(_i => {
            _i.node.removeFromParent();
            _i.deInit();
            ItemBagPool.put(_i)
        })
        this._itemBags = [];
    }

    // onClickClose() {
    //     this.closeView();
    // }

    onClickContinue() {
        this._closeHandler && this._closeHandler();
        this.closeView();
    }

    onClickLeave() {
        guiManager.loadScene(SCENE_NAME.MAIN).then(()=>{
            moduleUIManager.showModuleView();
        });
    }

    onClickReport () {
        this.loadSubView("BattleReportView", battleUIData.rawRes)
    }

    private _showPrize(prize: data.IItemInfo[]) {
        this._sortPrizes(prize);
        this._clearItems();

        //将关卡奖励和额外奖励分开
        let treasurePrize = this._getTreasureExtraPrize();
        if(treasurePrize && treasurePrize.length > 0) {
            let idx = 0, len = treasurePrize.length;
            for(; idx < len; idx++){
                let extraPrize = treasurePrize[idx];
                let extraPrizeIdx = prize.findIndex(ele => {
                        return ele.ID == extraPrize.ID && utils.longToNumber(ele.Count) == utils.longToNumber(extraPrize.Count);
                    });
                if(extraPrizeIdx != -1){
                    prize.splice(extraPrizeIdx, 1);
                }else{
                    treasurePrize.splice(idx, 1);
                    idx -= 1;
                    len -= 1;
                }
            }
        }

        // 装备数量大于1时，分开展示
        let tempPrize: data.IItemInfo[] = [];
        prize.forEach((item) => {
            if (configUtils.getEquipConfig(item.ID) != null) {
                for (let i = 0; i < item.Count; ++i) {
                    tempPrize.push(data.ItemInfo.create({ID: item.ID, Count: 1}));
                } 
            } else {
                tempPrize.push(item);
            }
        });
        prize = tempPrize;

        prize.forEach(_p => {
            let count = utils.longToNumber(_p.Count);
            let item = ItemBagPool.get();
            item.init({
                id: _p.ID,
                count: count,
                // clickHandler: () => {
                //     moduleUIManager.showItemDetailInfo(_p.ID, count, this.node);
                // }
            });
            this.itemRoot.addChild(item.node);
            this._itemBags.push(item);
        });

        treasurePrize && treasurePrize.forEach(_p => {
            let item = ItemBagPool.get();
            let count = utils.longToNumber(_p.Count);
            item.init({
                id: _p.ID,
                count: count,
                extra: true,
                // clickHandler: () => {
                //     moduleUIManager.showItemDetailInfo(_p.ID, count, this.node);
                // }
            });
            this.itemRoot.addChild(item.node);
            this._itemBags.push(item);
        });
    }

    //获取宝物相关的额外奖励
    private _getTreasureExtraPrize(): data.IItemInfo[]{
        if(!pveData) return null;

        let extraPrize: data.IItemInfo[] = [];

        if(pveData.pveConfig.pveMode == PVE_MODE.DAILY_LESSON){
            //财神送宝
            if(pveData.pveConfig.pveListId == 17001){
                //10017 : 影响财神送包通关额外奖励的LeadTreasure表中的项
                let extra = taskData.getTreasureSysPowerParam(TREASURE_SYS_POWER_TYPE.SUAN_ZHU_YU_PAN);
                extra && extraPrize.push({ID: 10010001, Count: extra});

                //10023 : 影响财神送包通关额外奖励的LeadTreasure表中的项
                let extra1 = taskData.getTreasureSysPowerParam(TREASURE_SYS_POWER_TYPE.YAO_QIAN_SHU);
                extra1 && extraPrize.push({ID: 10022003, Count: 1});
            }

            //神兵利器
            if(pveData.pveConfig.pveListId == 17002){
                //10024 : 影响神兵利器通关额外奖励的LeadTreasure表中的项
                let extra = taskData.getTreasureSysPowerParam(TREASURE_SYS_POWER_TYPE.HUI_YAO_LING_FAN);
                extra && extraPrize.push({ID: 10022004, Count: 1});
            }

            //护甲防具
            if(pveData.pveConfig.pveListId == 17003){
                  //10025 : 影响护甲防具通关额外奖励的LeadTreasure表中的项
                  let extra = taskData.getTreasureSysPowerParam(TREASURE_SYS_POWER_TYPE.DING_JIE_MAO_DIAN);
                  extra && extraPrize.push({ID: 10022005, Count: 1});
            }

            //神兵利器
            if(pveData.pveConfig.pveListId == 17007){
                //10026 : 影响神兵利器通关额外奖励的LeadTreasure表中的项
                let extra = taskData.getTreasureSysPowerParam(TREASURE_SYS_POWER_TYPE.JI_XIE_RI_XIN);
                extra && extraPrize.push({ID: 10022006, Count: 1});
            }
        }

        if(pveData.pveConfig.pveMode == PVE_MODE.RISE_ROAD){
            //众仙传道
            if(pveData.pveConfig.pveListId == 17005){
                //10018 : 影响众仙传道通关额外奖励的LeadTreasure表中的项
                let extra = taskData.getTreasureSysPowerParam(TREASURE_SYS_POWER_TYPE.LING_LONG_XIN);
                extra && extraPrize.push({ID: 10019035, Count: extra});
            }
        }

        return extraPrize;
    }

    onPrizeClick(item: cc.Node, sid: number) {

    }

    private _showWinEnterAnim(endFunc: Function) {
        this.winSpine.clearTracks();
        this.winSpine.setAnimation(0, 'win', false);
        this.scheduleOnce(() => {
            endFunc && endFunc();
            this.nextBtn.active = true;
        }, 0.7);
    }

    private _dealData(info: gamesvr.FinishPveRes | gamesvr.TrialHellFinishPveRes | CustomPveFinishResult) {
        let exp = info.Exp;
        let prize = info.Prizes;
        if (exp) {
            let expItem = prize.filter(item => { return item.ID == CustomItemId.EXP })[0];
            if (expItem) {
                expItem.Count = exp
            } else {
                prize.unshift({ ID: CustomItemId.EXP, Count: exp });
            }
        }
    }

    private _updateExp (info: gamesvr.FinishPveRes | gamesvr.TrialHellFinishPveRes | gamesvr.TrialMiracleDoorFinishPveRes | CustomPveFinishResult) {
        if (!info) return;

        let parent = this.lbLevel.node.parent;
        parent.active = true;

        if(pveData && pveData.pveConfig && pveData.pveConfig.pveMode == PVE_MODE.XIN_MO_FA_XIANG) {
            this.lbLevel.string = `累计伤害：${(info as CustomPveFinishResult).Damage}`;
            this.expProgressBar.node.active = false;
            return;
        }

        this.expProgressBar.node.active = true;
        let currLevel = userData.lv;
        let currExp = userData.exp;
        let currMax = userData.maxExp;

        this.lbLevel.string = `角色等级:${currLevel}级`;
        this.expProgressBar.progress = currExp/currMax;
    }

    private _sortPrizes(prizes: data.IItemInfo[]) {
        if(prizes.length > 0) {
            let getOrderFunc = (id: number): number => {
                let cfg = configUtils.getItemConfig(id);
                if(cfg) {
                    return cfg.ProduceOrder ? cfg.ProduceOrder : 9999;
                }
                let eCfg = configUtils.getEquipConfig(id);
                if(eCfg) {
                    let configModule = configUtils.getConfigModule('ProduceOrderEquip');
                    return configModule ? configModule : 9999;
                }
                let hCfg = configUtils.getHeroBasicConfig(id);
                if(hCfg) {
                    let configModule = configUtils.getConfigModule('ProduceOrderHero');
                    return configModule ? configModule : 9999;
                }
                return 9999;
            }
            prizes.sort((_a, _b) => {
                let _aOrder = getOrderFunc(_a.ID);
                let _bOrder = getOrderFunc(_b.ID);
                return _aOrder - _bOrder;
            });
        }
    }
}
