import { CustomDialogId, RES_ICON_PRE_URL, VIEW_NAME } from "../../../app/AppConst";
import { ItemInfo } from "../../../app/AppType";
import { utils } from "../../../app/AppUtils";
import { cfg } from "../../../config/config";
import { bagData } from "../../models/BagData";
import { userData } from "../../models/UserData";
import { pveData } from "../../models/PveData";
import { configUtils } from "../../../app/ConfigUtils";
import { uiHelper } from "../../../common/ui-helper/UIHelper";
import { configManager } from "../../../common/ConfigManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import ItemBag from "../view-item/ItemBag";
import guiManager from "../../../common/GUIManager";
import moduleUIManager from "../../../common/ModuleUIManager";
import GetAllRewardBtn from "../view-common/GetAllRewardBtn";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PVELessonListItem extends cc.Component {
    @property(cc.Label) lessonName: cc.Label = null;
    @property(cc.Node) lockNode: cc.Node = null;
    @property(cc.Label) txtCond: cc.Label = null;
    @property(cc.Node) prizeNode: cc.Node = null;
    @property(cc.Node) doubleNode:cc.Node = null;

    @property(cc.Label) enterNum: cc.Label = null;
    @property(cc.Label) enterDesc: cc.Label = null;
    @property(cc.Sprite) enterSpr: cc.Sprite = null;
    @property(cc.Node) btnMopUp: cc.Node = null;
    @property(cc.Node) btnChallenge: cc.Node = null;

    private _ticket: ItemInfo = null;
    private _enterPve: Function = null;
    private _loadFunc: Function = null;
    private _cfg: cfg.PVEDailyLesson = null;
    private _riseCfg: cfg.PVERiseRoad = null;
    private _lessonId: number = 0;
    private _sprLoader: SpriteLoader = new SpriteLoader();
    private _itemBag: ItemBag[] = [];
    private _isSupportModUp: boolean = false;
    private _challengeBtnPos: cc.Vec2 = null;
    private _modUpBtnPos: cc.Vec2 = null;
    private _btnSize: cc.Size = null;
    private _isOpened: boolean = false;

    init(cfg: any, riseRoad?: boolean, loadFunc?:Function, enterFunc?: Function, isSupportModUp: boolean = false) {
        if (!riseRoad)  this._cfg = cfg;
        else this._riseCfg = cfg;
        this._enterPve = enterFunc;
        this._loadFunc = loadFunc;
        this._isSupportModUp = isSupportModUp;
        this._challengeBtnPos = this._challengeBtnPos || this.btnChallenge.getPosition();
        this._modUpBtnPos = this._modUpBtnPos || this.btnMopUp.getPosition();
        this._btnSize = this._btnSize || this.btnChallenge.getContentSize();
        this.showView();
        if(this._isSupportModUp) {
            let lessonID = this._cfg ? this._cfg.PVEDailyLessonId : this._riseCfg.PVERiseRoadId;
            let isPass = (pveData.riseRoadRecords[lessonID] && pveData.riseRoadRecords[lessonID].Past)
                || (pveData.dailyRecords[lessonID] && pveData.dailyRecords[lessonID].Past)
            let isNormal = this._isOpened && isPass;
            this.btnMopUp.getComponent(GetAllRewardBtn).gray = !isNormal;
        }
    }

    unuse() {
        this._clearItems();
        this._sprLoader.release();
    }

    private _clearItems () {
        this._itemBag.forEach(_i => {
            ItemBagPool.put(_i)
        })
        this._itemBag = [];
    }

    reuse() {
    }

    showView() {
        this.clear();
        this._setupBtnsLayout();
        if (this._cfg) this.showDailyItem();
        if (this._riseCfg) this.showRiseItem();
    }

    showDailyItem() {
        let cfg: cfg.PVEList = configManager.getConfigByKey("pveList", this._cfg.PVEDailyLessonBelong);
        let numShow = cfg.PVEListNumShow.split(";");
        let type = parseInt(numShow[0]);
        if (type == 1) {
            let parseInfo = utils.parseStingList(this._cfg.PVEDailyLessonCost)[0];
            let itemID = parseInt(parseInfo[0]);
            let needCnt = parseInt(parseInfo[1]);
            let url = `${RES_ICON_PRE_URL.BAG_ITEM}/${configUtils.getItemConfig(itemID).ItemIcon}`;

            this.enterNum.string = `${needCnt}`;
            this._sprLoader.changeSprite(this.enterSpr, url);
            this._ticket = { itemId: itemID, num: needCnt };

        } else if (type == 2) {
            let parseInfo = utils.parseStingList(this._cfg.PVEDailyLessonCost)[0];
            let itemID = parseInt(parseInfo[0]);
            let needCnt = parseInt(parseInfo[1]);
            let url = `${RES_ICON_PRE_URL.BAG_ITEM}/${configUtils.getItemConfig(itemID).ItemIcon}`;

            this.enterNum.string = `x${needCnt}`;
            this._sprLoader.changeSprite(this.enterSpr, url);
            this._ticket = { itemId: itemID, num: needCnt };
        }
        this.lessonName.string = this._cfg.PVEDailyLessonName;
        //奖励道具展示
        this._clearItems();
        if (this._cfg.PVEDailyLessonRewardShow) {
            let parseArr = utils.parseStingList(this._cfg.PVEDailyLessonRewardShow);
            parseArr.forEach((ele, index) => {
                if (ele && ele.length) {
                    let item = ItemBagPool.get();
                    item.init({
                        id: parseInt(ele[0]),
                        clickHandler: () => { 
                            moduleUIManager.showItemDetailInfo(parseInt(ele[0]), parseInt(ele[1]), uiHelper.getRootViewComp(this.node).node);
                        }
                    })
                    // 新创建节点，加入回收池
                    this._itemBag.push(item);
                    item.node.parent = this.prizeNode;
                }
            })
        }
        //满足开启条件
        this.checkModuleOpened();
        this._lessonId = this._cfg.PVEDailyLessonId;
    }

    showRiseItem() {
        let cfg: cfg.PVEList = configManager.getConfigByKey("pveList", 17005);
        let numShow = cfg.PVEListNumShow.split(";");
        let type = parseInt(numShow[0]);
        if (type == 1) {
            let parseInfo = utils.parseStingList(this._riseCfg.PVERiseRoadCost)[0];
            let itemID = parseInt(parseInfo[0]);
            let needCnt = parseInt(parseInfo[1]);
            let url = `${RES_ICON_PRE_URL.BAG_ITEM}/${configUtils.getItemConfig(itemID).ItemIcon}`;

            this.enterNum.string = `x${needCnt}`;
            this._sprLoader.changeSprite(this.enterSpr, url);
            this._ticket = { itemId: itemID, num: needCnt };

        }
        this.lessonName.string = this._riseCfg.PVERiseRoadLessonName;
        //奖励道具展示
        this._clearItems();
        if (this._riseCfg.PVERiseRoadRewardShow) {
            let parseArr = utils.parseStingList(this._riseCfg.PVERiseRoadRewardShow);
            parseArr.forEach((ele, index) => {
                if (ele && ele.length) {
                    let item = ItemBagPool.get();
                    item.init({
                        id: parseInt(ele[0]),
                        clickHandler:()=>{
                            moduleUIManager.showItemDetailInfo(parseInt(ele[0]), parseInt(ele[1]), uiHelper.getRootViewComp(this.node).node);
                        }
                    })
                    // 新创建节点，加入回收池
                    this._itemBag.push(item);
                    item.node.parent = this.prizeNode;
                }
            })
        }
        //满足开启条件
        this.checkModuleOpened();
        this._lessonId = this._riseCfg.PVERiseRoadId;
    }

    checkModuleOpened() {
        let openCondition = this._cfg ? this._cfg.PVEDailyLessonOpenCondition : this._riseCfg.PVERiseRoadOpenCondition;
        if (!openCondition) return;
        let conditionArr = utils.parseStingList(openCondition);

        let isNPass = conditionArr.some(condition => {
            if(!condition) return true;
            let condiType = condition[0], condiValue = Number(condition[1]);

            //等级限制
            if(condiType == 1){
                let isPass = condiValue && condiValue > userData.lv;
                this._isOpened = !isPass;
                if(isPass) {
                    this.txtCond.string = `${condiValue}级开启`;
                    return true;
                }
            }

            //其他限制
            if(condiType == 2) {
                let isPass = condiValue && (!pveData.riseRoadRecords[condiValue] || !pveData.riseRoadRecords[condiValue].Past)
                    && (!pveData.dailyRecords[condiValue] || !pveData.dailyRecords[condiValue].Past);
                this._isOpened = !isPass;
                if(isPass) {
                    this.txtCond.string = `完成前置关卡开启`;
                    return true;
                }
            }
            return false;
        });

        this.txtCond.node.active = isNPass;
        this.lockNode.active = isNPass;
    }
    /**
     * 清理缓存状态
     */
    clear() {
        this._isOpened = false;
        this.lockNode.active = false;
        this.txtCond.node.active = false;
        this._clearItems();
    }

    private _setupBtnsLayout() {
        if(this._isSupportModUp){
            this.btnChallenge.setPosition(this._challengeBtnPos);
            this.btnMopUp.setPosition(this._modUpBtnPos);
            this.btnMopUp.active = true;
            this.btnChallenge.setContentSize(this._btnSize);

        } else {
            this.btnChallenge.x = (this._challengeBtnPos.x + this._modUpBtnPos.x) >> 1;
            let spComp = this.btnChallenge.getComponent(cc.Sprite);
            this.btnChallenge.setContentSize(spComp.spriteFrame.getTexture().width, spComp.spriteFrame.getTexture().height);
            this.btnMopUp.active = false;
        }
    }

    onClickThis() {
        //门票数量校验
        if (this._ticket) {
        let haveCount = bagData.getItemCountByID(this._ticket.itemId);
            if (haveCount < this._ticket.num) {
                let dialogCfg = configUtils.getDialogCfgByDialogId(CustomDialogId.PVE_TICKET_NO_ENOUGH);
                let nameStr = configUtils.getItemConfig(this._ticket.itemId).ItemName;
                let text = utils.convertFormatString(dialogCfg.DialogText, [{ itemname: nameStr }]);
                guiManager.showTips(text);
                return;
            }
        }
        this._enterPve && this._enterPve(this._lessonId);
    }

    onClickMopUp() {
        if(!this._isSupportModUp || !this._isOpened) return;

        let lessonID = this._cfg ? this._cfg.PVEDailyLessonId : this._riseCfg.PVERiseRoadId;
        if((!pveData.riseRoadRecords[lessonID] || !pveData.riseRoadRecords[lessonID].Past)
                    && (!pveData.dailyRecords[lessonID] || !pveData.dailyRecords[lessonID].Past)) {
            guiManager.showTips("请先通关一次");
            return;
        }
        this._loadFunc && this._loadFunc('PVELessonMopUpView', this._cfg || this._riseCfg,  this._riseCfg != null);
    }

    onClickItem(itemID:number){
        
    }
}
