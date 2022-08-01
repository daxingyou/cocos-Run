/*
 * @Author: xuyang
 * @Date: 2021-06-05 14:22:17
 * @Description: 基础货币组件Item
 */
import { bagData } from "../models/BagData";
import { configManager } from "../../common/ConfigManager";
import { CustomItemId, RES_ICON_PRE_URL } from "../../app/AppConst";
import { configUtils } from "../../app/ConfigUtils";
import { SpriteLoader } from "../../common/ui-helper/SpriteLoader";
import { cfg } from "../../config/config";
import { utils } from "../../app/AppUtils";
import { uiHelper } from "../../common/ui-helper/UIHelper";
import guiManager from "../../common/GUIManager";
import moduleUIManager from "../../common/ModuleUIManager";
import { userData } from "../models/UserData";
import { commonData} from "../models/CommonData";

const { ccclass, property } = cc._decorator;
@ccclass
export default class CoinItem extends cc.Component {

    @property(cc.Sprite) icon: cc.Sprite = null;
    @property(cc.Label) count: cc.Label = null;
    @property(cc.Node) addBtn: cc.Node = null;
   
    private _cfg: cfg.MoneyShow = null;
    private _itemId: number = 0;
    private _sprLoader: SpriteLoader = new SpriteLoader();
    
    get itemId(){
        return this._itemId;
    }

    init(id?: number){
        if(!commonData.everyDayGiveItemCfg){
            let everydayGiveCfg:string = configUtils.getBasicConfig().DayGiveItem;
            let cfg: Map<number, number> = new Map<number, number>();
            utils.parseStingList(everydayGiveCfg, (itemInfo: string[]) => {
                if(!itemInfo || itemInfo.length == 0) return;
                cfg.set(parseInt(itemInfo[0]), parseInt(itemInfo[1]));
            });
            commonData.everyDayGiveItemCfg = cfg;
        }
        
        if(id){
            let moneyCfg: cfg.MoneyShow =  configManager.getConfigByKey("moneyShow", id);
            if (moneyCfg && moneyCfg.MoneyShowItemId){
                this._itemId = moneyCfg.MoneyShowItemId;
                this._changeCount();
                this._changeSpr();
            }
            this._cfg = moneyCfg;
            this.addBtn.active = !!(moneyCfg && moneyCfg.MoneyShowUse);
        }else if (this._itemId){
            this._changeCount();
            this._changeSpr();
        }
    }

    private _changeCount(id?: number){
        let cfgBasic = configUtils.getBasicConfig();
        let physicalLimit = configManager.getConfigs("basic") ?
            configManager.getConfigs("basic")[0].PhysicalRecoveryLimit : 0;
        let cnt = bagData.getItemCountByID(this._itemId);
        let cntStr = cnt < 1000000 ? `${cnt}` : `${Math.floor(cnt / 10000)}万`;
        if (this._itemId == CustomItemId.PHYSICAL){
            // 体力值有限额
            let physicalMax = physicalLimit + (cfgBasic.LevelUpMax || 0) * (userData.lv);
            cntStr = physicalLimit ?
                `${bagData.physical}/${physicalMax}` : `${bagData.physical}`
        } else if(this._itemId == CustomItemId.GONG_FENG_SPEED_UP_COIN) {
            //供奉加速时间
            let timeArr = utils.getLeftTime(cnt * 60);
            cntStr = '';
            if(timeArr[0] != 0) {
                cntStr = `${cntStr}${timeArr[0]}天`;
            }
            if(timeArr[1] != 0) {
                cntStr = `${cntStr}${timeArr[1]}小时`;
            }
            if (timeArr[2] != 0) {
                cntStr = `${cntStr}${timeArr[2]}分`;
            }

        }else if(commonData.everyDayGiveItemCfg.has(this._itemId)){
            //每日补齐道具
            cntStr = `${cntStr}/${commonData.everyDayGiveItemCfg.get(this._itemId)}`
        }
        this.count.string = cntStr;
    }

    private _changeSpr(id?: number){
        let itemCfg = configUtils.getItemConfig(this._itemId);
        if (itemCfg && itemCfg.ItemIcon){
            let iconPath = `${RES_ICON_PRE_URL.BAG_ITEM}/${itemCfg.ItemIcon}`;
            this._sprLoader.changeSprite(this.icon,iconPath);
        }
    }

    public onClickAdd(){
        if (this._cfg && this._cfg.MoneyShowUseResult){
            let parseList = utils.parseStingList(this._cfg.MoneyShowUseResult);
            parseList = this._cfg.MoneyShowUseResult.search(";") == -1 ? parseList : parseList[0];
            let moduleId = parseList && parseList[0] || 0;
            let partId = parseList && parseList[1] || 0;
            let subId = parseList && parseList[2] || 0;
            moduleUIManager.jumpToModule(parseInt(moduleId), parseInt(partId), parseInt(subId), this._itemId);
            return;
        }
        guiManager.showLockTips();
    }

    onClickDetailBtn() {
        if(this._cfg && this._cfg.MoneyShowItemId) {
            moduleUIManager.showItemDetailInfo(this._cfg.MoneyShowItemId, 0, uiHelper.getRootViewComp(this.node).node);
        }
    }

    deInit (){
        this._sprLoader.release();
    }

}
