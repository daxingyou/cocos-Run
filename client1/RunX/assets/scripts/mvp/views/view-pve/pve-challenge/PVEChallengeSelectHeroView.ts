import { CustomDialogId } from "../../../../app/AppConst";
import { configUtils } from "../../../../app/ConfigUtils";
import List from "../../../../common/components/List";
import ListItem from "../../../../common/components/ListItem";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../../common/event/EventCenter";
import { respectEvent } from "../../../../common/event/EventData";
import guiManager from "../../../../common/GUIManager";
import { cfg } from "../../../../config/config";
import { data } from "../../../../network/lib/protocol";
import { bagData } from "../../../models/BagData";
import { pveDataOpt } from "../../../operations/PveDataOpt";
import HeroUnit from "../../../template/HeroUnit";
import HeroListItemSmall from "../../view-hero/HeroListItemSmall";
import MessageBoxView from "../../view-other/MessageBoxView";

const {ccclass, property} = cc._decorator;

@ccclass
export default class PVEChallengeSelectHeroView extends ViewBaseComponent {

    @property(List) heroList: List = null;
    @property(cc.Node) selectedHeroes: cc.Node = null;
    @property(cc.Label) descContent: cc.Label = null;

    heroIDs: number[] = null;
    selectedHeroIDs: number[] = null;

    onInit(): void {
        this.registerEvent();
        this.prepareData();
        this.initView();
    }

    onRelease(): void {
        this.heroList._deInit();
        eventCenter.unregisterAll(this);  
        
        this.selectedHeroes.children.forEach((item) => {
            item.getComponent(HeroListItemSmall).unuse();
        });
    }

    registerEvent() {
        eventCenter.register(respectEvent.START_SUCCESS, this, this.onStartSuccess);
    }

    prepareData() {
        // 获得已有英雄ID,过滤掉PVEChallengeHeroQualityNeed品质以下的英雄,再按战力-品质降序排序
        this.heroIDs = bagData.heroList.map((val) => { return val.ID });

        let needQuality: number = configUtils.getModuleConfigs().PVEChallengeHeroQualityNeed;
        this.heroIDs = this.heroIDs.filter((heroID) => {
            
            let heroUnit: HeroUnit = bagData.getHeroById(heroID);
            return heroUnit.heroCfg.HeroBasicQuality >= needQuality;
        });

        this.heroIDs.sort((a: number, b: number) => {
            let aUnit: HeroUnit = bagData.getHeroById(a);
            let bUnit: HeroUnit = bagData.getHeroById(b);
            let aPower = aUnit.getCapability();
            let bPower = bUnit.getCapability();
            if(aPower == bPower) {
                return bUnit.heroCfg.HeroBasicQuality - aUnit.heroCfg.HeroBasicQuality;
            } else {
                return bPower - aPower;
            }
        });

        this.selectedHeroIDs = [];
    }

    initView() {
        let dialogConfig: cfg.Dialog = configUtils.getDialogCfgByDialogId(99000067);
        if (dialogConfig && dialogConfig.DialogText) {
            this.descContent.string = dialogConfig.DialogText;
        }

        // 隐藏展示已选择英雄
        this.selectedHeroes.children.forEach((child) => {
            child.opacity = 0;
        });

        // 显示应用列表
        this.heroList.numItems = this.heroIDs.length;
    }

    // 发起挑战
    onBtnStartChallenge() {
        // 至少选择1个，小于5个时弹警告提示
        if (this.selectedHeroIDs.length === 0) {
            guiManager.showDialogTips(1000141);
        } else if (this.selectedHeroIDs.length < 5) {
            let cfg = configUtils.getDialogCfgByDialogId(2000021);
            let selectedHeroIDs = this.selectedHeroIDs;
            let self = this;
            guiManager.showMessageBoxByCfg(this.node, cfg, (msgbox: MessageBoxView) => {
                msgbox.closeView();
            }, (msgbox: MessageBoxView) => {
                self.startChallenge();                

                msgbox.closeView();
            });
        } else {
            this.startChallenge();
        }
    }

    startChallenge() {
        pveDataOpt.reqTrialRespectStart(this.selectedHeroIDs);
    }

    // ListItem渲染
    onHeroListRender(itemNode: cc.Node, idx: number) {
        let heroListItemSmall: HeroListItemSmall = itemNode.getComponent(HeroListItemSmall);
        itemNode.getComponent(ListItem).selectedFlag = heroListItemSmall.selectBlack;
        heroListItemSmall.setData(this.heroIDs[idx]);
    }

    // ListItem选择
    onHeroListSelect(itemNode: cc.Node, idx: number, lastID: any, selected: boolean) {
        let heroID: number = this.heroIDs[idx];
        let findIdx: number = this.selectedHeroIDs.indexOf(heroID);

        if (selected && findIdx === -1) {
            this.selectedHeroIDs.push(heroID);
        }
        if (!selected && findIdx >= 0) {
            this.selectedHeroIDs.splice(findIdx, 1);
        }

        this.updateSelectedHeroes();
    }

    // 刷新展示已选择英雄
    updateSelectedHeroes() {
        let children: cc.Node[] = this.selectedHeroes.children;
        for (let idx = 0; idx < children.length; ++idx) {
            if (this.selectedHeroIDs[idx]) {
                children[idx].getComponent(HeroListItemSmall).setData(this.selectedHeroIDs[idx]);
                children[idx].opacity = 255;
            } else {
                children[idx].opacity = 0;
            }
        }
    }

    // 关闭按钮
    onBtnClose() {
        this.closeView();
    }

    // 成功开始
    onStartSuccess() {
        this.onBtnClose();
    }
}
