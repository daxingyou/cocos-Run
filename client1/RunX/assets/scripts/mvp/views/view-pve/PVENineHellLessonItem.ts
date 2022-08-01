import { CustomDialogId, CustomItemId, RES_ICON_PRE_URL, SCENE_NAME } from "../../../app/AppConst";
import { ItemInfo, PveConfig } from "../../../app/AppType";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { configManager } from "../../../common/ConfigManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { bagData } from "../../models/BagData";
import { userData } from "../../models/UserData";
import { pveData } from "../../models/PveData";
import { PVE_MODE } from "../../../app/AppEnums";
import { pveTrialData } from "../../models/PveTrialData";
import { uiHelper } from "../../../common/ui-helper/UIHelper";
import ItemBag from "../view-item/ItemBag";
import guiManager from "../../../common/GUIManager";
import moduleUIManager from "../../../common/ModuleUIManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PVENineHellLessonItem extends cc.Component {

    @property(cc.Label) lessonName: cc.Label = null;
    @property(cc.Node) lockNode: cc.Node = null;
    @property(cc.Label) txtCond1: cc.Label = null;
    @property(cc.Label) txtCond2: cc.Label = null;
    @property(cc.Node) prizeNode: cc.Node = null;

    @property(cc.Label) enterNum: cc.Label = null;
    @property(cc.Label) enterDesc: cc.Label = null;
    @property(cc.Sprite) enterSpr: cc.Sprite = null;
    @property(cc.Node) passTxt:cc.Node = null;

    private _lessonId: number = 0;
    private _ticket: ItemInfo = null;
    private _cfg: cfg.PVECopy = null;
    private _itemBags: ItemBag[] = [];
    private _magicCfg: cfg.PVEDaoistMagicLesson = null;
    private _sprLoader: SpriteLoader = new SpriteLoader();

    init(cfg: any, magicDoor?: boolean) {
        magicDoor ? ( this._magicCfg = cfg) : (this._cfg = cfg);
        this.showView();
    }

    deInit(){
        this._clearItems();
        this._sprLoader.release();
    }

    reuse() {

    }

    unuse() {
        this.deInit();
    }

    private _clearItems() {
        this._itemBags.forEach(_i => {
            _i.node.removeFromParent();
            _i.deInit();
            ItemBagPool.put(_i)
        })
        this._itemBags = [];
    }

    showView() {
        this.clear();
        if (this._cfg) this.showNineHellItem();
        if (this._magicCfg) this.showMagicDoorItem();
    }

    showNineHellItem() {
        let cfg: cfg.PVEList = configManager.getConfigByKey("pveList", this._cfg.PVECopyOpenCondition);
        let itemID = CustomItemId.PHYSICAL;
        let needCnt = this._cfg.PVECopyCost;
        let url = `${RES_ICON_PRE_URL.BAG_ITEM}/${configUtils.getItemConfig(itemID).ItemIcon}`;
        let lessonPassed = pveTrialData.hellData.PassLessonMap[this._cfg.PVECopyId];

        this.enterNum.node.active = !!needCnt;
        this.enterSpr.node.active = !!needCnt;
        this.enterNum.string = `x${needCnt}`;
        this._sprLoader.changeSprite(this.enterSpr, url);
        this._ticket = { itemId: itemID, num: needCnt };
        this.enterDesc.node.parent.active = !lessonPassed;
        this.passTxt.active = lessonPassed;
        this.lessonName.string = this._cfg.PVECopyName;
        //奖励道具展示
        if (this._cfg.PVECopyRewardShow) {
            let parseArr = utils.parseStingList(this._cfg.PVECopyRewardShow);
            this._clearItems();
            parseArr.forEach((ele, index) => {
                if (ele && ele.length) {
                    let item = ItemBagPool.get();
                    item.init({
                        id: parseInt(ele[0]),
                        count: parseInt(ele[1]),
                        prizeItem: true,
                        clickHandler: () => { 
                            moduleUIManager.showItemDetailInfo(parseInt(ele[0]), parseInt(ele[1]), uiHelper.getRootViewComp(this.node).node); 
                        }
                    })
                    // 新创建节点，加入回收池
                    this._itemBags.push(item);
                    item.node.parent = this.prizeNode;
                }
            })
        }
        //满足开启条件
        this.checkModuleOpened();
        this._lessonId = this._cfg.PVECopyId;
    }

    showMagicDoorItem() {
        let itemID = CustomItemId.PHYSICAL;
        let needCnt = this._magicCfg.PVECopyCost;
        let url = `${RES_ICON_PRE_URL.BAG_ITEM}/${configUtils.getItemConfig(itemID).ItemIcon}`;
        //临时配置
        let lessonPassed = pveTrialData.miracalData.PassLessonMap[this._magicCfg.PVECopyId];
        this.enterNum.node.active = !!needCnt;
        this.enterSpr.node.active = !!needCnt;
        this.enterNum.string = `x${needCnt}`;
        this._sprLoader.changeSprite(this.enterSpr, url);
        this._ticket = { itemId: itemID, num: needCnt };
        this.enterDesc.node.parent.active = !lessonPassed;
        this.passTxt.active = lessonPassed;
        this.lessonName.string = this._magicCfg.PVECopyName;
        //奖励道具展示
        if (this._magicCfg.PVECopyRewardShow) {
            let parseArr = utils.parseStingList(this._magicCfg.PVECopyRewardShow);
            parseArr.forEach((ele, index) => {
                if (ele && ele.length) {
                    let itemNode = this.prizeNode.children[index] || ItemBagPool.get().node;
                    let item = itemNode.getComponent(ItemBag);
                    item.init({
                        id: parseInt(ele[0]),
                        count: parseInt(ele[1]),
                        prizeItem: true,
                        clickHandler: () => { 
                            moduleUIManager.showItemDetailInfo(parseInt(ele[0]), parseInt(ele[1]), uiHelper.getRootViewComp(this.node).node);
                        }

                    })
                    // 新创建节点，加入回收池
                    if (!itemNode.parent) {
                        this._itemBags.push(item);
                        itemNode.parent = this.prizeNode;
                    }
                }
            })
        }
        //满足开启条件
        this._lessonId = this._magicCfg.PVECopyId;
    }


    checkModuleOpened() {
        if(this._cfg && !this._cfg.PVECopyOpenCondition) return;
        let openCondition = this._cfg.PVECopyOpenCondition;
        let conditionArr = utils.parseStingList(openCondition);
        let canEnter = true;
        conditionArr.forEach(condition => {
            if (condition && condition[0] == 1) 
            {
                let lv = Number(condition[1]);
                if (lv && lv > userData.lv) {
                    this.txtCond1.string = `${lv}级开启`;
                    this.txtCond1.node.active = true;
                    //隐藏挑战次数
                    canEnter = false;
                }
            }
            if (condition && condition[0] == 2) 
            {
                let fID = Number(condition[1]);
                if (fID) {
                    let hellPassed = pveTrialData.hellData && pveTrialData.hellData.PassLessonMap[fID];
                    this.txtCond2.string = `完成前置关卡开启`;
                    this.txtCond2.node.active = !(hellPassed);
                    this.lockNode.active = !(hellPassed);
                    canEnter = canEnter && hellPassed;
                }
            }
        })
        this.lockNode.active = !canEnter;
    }
    /**
     * 清理缓存状态
     */
    clear() {
        this.lockNode.active = false;
        this.txtCond1.node.active = false;
        this.txtCond2.node.active = false;
    }
   
    onClickThis() {
        //门票数量校验
        if (this._ticket) {
            let haveCount = bagData.getItemCountByID(this._ticket.itemId);
            if (haveCount < this._ticket.num) {
                let dialogCfg = configUtils.getDialogCfgByDialogId(CustomDialogId.PVE_DOUBLE_ITEM_NO_ENOUGH);
                let nameStr = configUtils.getItemConfig(this._ticket.itemId).ItemName;
                let text = utils.convertFormatString(dialogCfg.DialogText, [{ itemname: nameStr }]);
                guiManager.showTips(text);
                return;
            }
        }
        if (this._cfg){
            let pveConfig: PveConfig = {
                lessonId: this._lessonId,
                userLv: userData.lv,
                useDefaultSquad: false,
                pveMode: PVE_MODE.NINE_HELL,
                pveListId: 17014
            }
            pveData.pveConfig = pveConfig;
            guiManager.loadScene(SCENE_NAME.BATTLE);
        }
        if (this._magicCfg){
            let pveConfig: PveConfig = {
                lessonId: this._lessonId,
                userLv: userData.lv,
                useDefaultSquad: false,
                pveMode: PVE_MODE.MAGIC_DOOR,
                magicCfg: this._magicCfg,
                pveListId: 17011

            }
            pveData.pveConfig = pveConfig;
            guiManager.loadScene(SCENE_NAME.BATTLE);
        }
    }
}
