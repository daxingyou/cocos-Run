import { eventCenter } from "../../../common/event/EventCenter";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { data, gamesvr } from "../../../network/lib/protocol";
import ItemBag from "../view-item/ItemBag";
import guiManager from "../../../common/GUIManager";
import { SCENE_NAME } from "../../../app/AppConst";
import { audioManager, SFX_TYPE } from "../../../common/AudioManager";
import { configUtils } from "../../../app/ConfigUtils";
import moduleUIManager from "../../../common/ModuleUIManager";
import { utils } from "../../../app/AppUtils";
import { cfg } from "../../../config/config";
import { configManager } from "../../../common/ConfigManager";
import { userData } from "../../models/UserData";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { battleUIData } from "../../models/BattleUIData";

const { ccclass, property } = cc._decorator;

@ccclass
export default class extends ViewBaseComponent {
    @property(cc.Node) itemRoot: cc.Node = null;
    @property(cc.Node) itemRoot2: cc.Node = null;
    @property(cc.Label) lbExp: cc.Label = null;
    @property(cc.Label) rankChange: cc.Label = null;
    @property(cc.Node) winBg: cc.Node = null;
    @property(cc.Node) loseBg: cc.Node = null;
    @property([cc.Node]) guideBtns: cc.Node[] = [];
    @property(cc.Node) btnNext: cc.Node = null;
    @property(cc.Node) winRoleNode: cc.Node = null;
    @property(cc.Node) loseRoleNode: cc.Node = null;
    @property(cc.Node) ndReport: cc.Node = null;

    private _itemBags: ItemBag[] = [];
    private _itemRootOriPos: cc.Vec2 = null;
    private _itemRoot2OriPos: cc.Vec2 = null;
    private _prizeTitleOriPos: cc.Vec2 = null;
    private _prize2TitleOriPos: cc.Vec2 = null;

    onInit(info: gamesvr.PvpSpiritEnterRes) {
        this.scheduleOnce(() => {
            (info.Past ? this.winRoleNode : this.loseRoleNode).active = true;
            audioManager.playSfx(SFX_TYPE.GAME_WIN);
        }, 0.3);
        this.btnNext.active = false;
        this.winBg.active = info.Past;
        this.loseBg.active = !info.Past;
        this._adapterRolePos(info.Past ? this.winRoleNode : this.loseRoleNode);
        info.Past ? this._setViewChildrenVisible(this.winBg, false) : this._setViewChildrenVisible(this.loseBg, false);
        this._init();
        this._clearItems();

        if(info.Past){
            this._playWinBgEff(() => {
                if (info && (info.Prizes1 || info.Prizes2)){
                    this._adaptePrizeLayout(info);
                    this._genPrizes(this._deal(info.Prizes1), this.itemRoot);
                    this._genPrizes(this._deal(info.Prizes2), this.itemRoot2);
                    this.rankChange.string = `${utils.getNumChangeRes(info.ChangeRank, '不变')}`;
                }
            })
        }else {
            this.showGuideButtons();
            this._playLoseBgEff(null);
        }
        this.ndReport.active = battleUIData.isBattle;
    }

    private _adapterRolePos(roleNode: cc.Node) {
        let roleParent = roleNode.parent;
        let widgetComp = roleParent.getComponent(cc.Widget);
        if(cc.isValid(widgetComp)) widgetComp.updateAlignment();
        let rect = roleParent.getBoundingBox();
        roleNode.x = rect.xMin;
        roleNode.y = rect.yMin;
    }

    private _init(){
        this._itemRootOriPos = this._itemRootOriPos || this.itemRoot.getPosition();
        this._itemRoot2OriPos = this._itemRoot2OriPos || this.itemRoot2.getPosition();

        if(!this._prizeTitleOriPos){
            let titleNode = cc.find('rootNode/bg_win/contentNode/title1', this.node);
            this._prizeTitleOriPos = titleNode.getPosition();
        }

        if(!this._prize2TitleOriPos){
            let titleNode = cc.find('rootNode/bg_win/contentNode/title2', this.node);
            this._prize2TitleOriPos = titleNode.getPosition();
        }
    }

    private _setViewChildrenVisible(node: cc.Node, visible: boolean) {
        if(!cc.isValid(node)) return;
        node.children.forEach(ele => {
              if(ele == this.winRoleNode || ele == this.loseRoleNode) return;
              ele.active = visible;
        });
    }

    private _playWinBgEff(cb: Function){
        let winBgEff = cc.find('effect_win', this.winBg);
        winBgEff.active = true;
        let spComp: sp.Skeleton = winBgEff.getComponent(sp.Skeleton);
        spComp.clearTracks();
        spComp.setAnimation(0, 'win', false);
        this.scheduleOnce(() => {
            this._setViewChildrenVisible(this.winBg, true);
            this.btnNext.active = true;
            cb && cb();
        }, 0.7)
    }

    private _playLoseBgEff(cb: Function){
        let loseBgEff = cc.find('effect_lose', this.loseBg);
        loseBgEff.active = true;
        let spComp: sp.Skeleton = loseBgEff.getComponent(sp.Skeleton);
        spComp.clearTracks();
        spComp.setAnimation(0, 'lose2', false);
        this.scheduleOnce(() => {
            this._setViewChildrenVisible(this.loseBg, true);
            this.btnNext.active = true;
            cb && cb();
        }, 1.2);
    }

    private _adaptePrizeLayout(info: gamesvr.PvpSpiritEnterRes){
        let rewardCnt = (info.Prizes1 && info.Prizes1.length > 0) ? 1 : 0;
        rewardCnt += ((info.Prizes2 && info.Prizes2.length > 0) ? -1 : 0);

        let titleNode = cc.find('rootNode/bg_win/contentNode/title1', this.node);
        let titleNode1 = cc.find('rootNode/bg_win/contentNode/title2', this.node);
        if(rewardCnt == 0){
            this.itemRoot.setPosition(this._itemRootOriPos);
            this.itemRoot.active = true;
            this.itemRoot2.setPosition(this._itemRoot2OriPos);
            this.itemRoot2.active = true;
            titleNode.setPosition(this._prizeTitleOriPos);
            titleNode.active = true;
            titleNode1.setPosition(this._prize2TitleOriPos);
            titleNode1.active = true;
            return;
        }

        if(rewardCnt > 0){
            titleNode.active = true;
            this.itemRoot.active = true;
            titleNode1.active = false;
            this.itemRoot2.active = false;
            let bgNode = cc.find('rootNode/bg_win/bg', this.node);
            let pos = bgNode.parent.convertToWorldSpaceAR(bgNode.getPosition());
            pos =  this.itemRoot.parent.convertToNodeSpaceAR(pos);
            this.itemRoot.y = pos.y;
            titleNode.y = pos.y;
            return;
        }

        if(rewardCnt < 0){
            titleNode1.active = true;
            this.itemRoot2.active = true;
            titleNode.active = false;
            this.itemRoot.active = false;
            let bgNode = cc.find('rootNode/bg_win/bg', this.node);
            let pos = bgNode.parent.convertToWorldSpaceAR(bgNode.getPosition());
            pos =  this.itemRoot.parent.convertToNodeSpaceAR(pos);
            this.itemRoot2.y = pos.y;
            titleNode1.y = pos.y;
        }
    }

    onRelease() {
        this._itemRootOriPos = null;
        this._itemRoot2OriPos = null;
        this._prizeTitleOriPos = null;
        this._prize2TitleOriPos = null;
        this._clearItems();
        this.releaseSubView();
        eventCenter.unregisterAll(this);
        this.unscheduleAllCallbacks();
    }

    private _clearItems() {
        this._itemBags.forEach(_i => {
            ItemBagPool.put(_i)
        })
        this._itemBags.length = 0;
    }

    onClickClose() {
        this.closeView();
    }

    onClickContinue() {
        guiManager.loadScene(SCENE_NAME.MAIN).then(()=>{
            moduleUIManager.showModuleView();
        })
    }

    onClickLeave() {
        guiManager.loadScene(SCENE_NAME.MAIN).then(()=>{
            moduleUIManager.showModuleView();
        });
    }

    onClickReport () {
        this.loadSubView("BattleReportView", battleUIData.rawRes)
    }

    private _genPrizes(prizes: data.IItemInfo[], rootNode: cc.Node){
        if(!prizes || prizes.length == 0) return;
        prizes.forEach(_p => {
            let item = ItemBagPool.get();
            let count = utils.longToNumber(_p.Count);
            item.init({
                id: _p.ID,
                count: count ,
                // clickHandler: ()=>{
                //     moduleUIManager.showItemDetailInfo(_p.ID, count, this.node);
                // }
            });
            rootNode.addChild(item.node);
            this._itemBags.push(item);
        });
    }

    onClickGuideBtn(event: cc.Event.EventTouch){
        let target = event.currentTarget;
        if(!cc.isValid(target)) return;

        let data: cfg.FailGuide = target._bindData;
        if(!data) return;

        let linkRes = data.FailGuideLink.split(";").map(str => { return parseInt(str) });
        (linkRes[0]) && this.closeView();
        guiManager.loadScene(SCENE_NAME.MAIN).then(() => {
            moduleUIManager.jumpToModule(linkRes[0], linkRes[1], linkRes[2]);
        });
    }

    /**
   * @description 展示引导按钮，最多三个
   */
    showGuideButtons() {
        let guideCfgs: cfg.FailGuide[] = configManager.getConfigList("failGuide");
        guideCfgs = guideCfgs.filter(cfg => {
            return !(cfg.FailGuideOpenLeveL && cfg.FailGuideOpenLeveL > userData.lv) && cfg.FailGuideLink != "35000";
        });
        guideCfgs.forEach((cfg, index) => {
            if (this.guideBtns[index]) {
                this.guideBtns[index].active = true;
                //@ts-ignore
                this.guideBtns[index]._bindData = cfg;
                this.guideBtns[index].getComponentInChildren(cc.Label).string = cfg.FailGuideName;
            }
        })
    }

    private _deal(data: data.IItemInfo[]) {
        let idMap = new Map<number, data.IItemInfo>();
        let itemList: data.IItemInfo[] = [];
        data.forEach(ele => {
            let item = utils.deepCopy(ele);
            if (!idMap.has(item.ID)) {
                idMap.set(item.ID, item);
            } else {
                let val = idMap.get(item.ID);
                val.Count = utils.longToNumber(val.Count) + utils.longToNumber(item.Count);
                idMap.set(item.ID, val);
            }
        })
        idMap.forEach((ele) => {
            let config1 = configUtils.getEquipConfig(ele.ID);
            if (config1) {
                let copy: any = utils.deepCopy(ele);
                let cnt: number = utils.longToNumber(ele.Count);
                copy.Count = 1;
                //@ts-ignore
                itemList = itemList.concat(new Array<data.ItemInfo>(cnt).fill(copy));
                return;
            }
            itemList.push(ele);
        })
        return itemList;
    }
}
