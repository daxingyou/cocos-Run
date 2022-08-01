import { TmpCache, ItemInfo } from "../../app/AppType";
import { utils } from "../../app/AppUtils";
import { configUtils } from "../../app/ConfigUtils";
import BaseModel from "./BaseModel";

class CommonData extends BaseModel {
    private _tmpCache: TmpCache = {};

    init () {}

    get tmpCache(){
        return this._tmpCache;
    }

    set blockSummonMsg(val: boolean){
        this._tmpCache.BLOCK_SUMMON_MSGBOX = val;
    }

    set spiritColdTime(val: number){
        this._tmpCache.EQUIP_SPIRIT_COLDTIME = val;
    }

    // 一键强化确认框
    set blockEquipOnceEnhanceConfirm(val: boolean) {
        this._tmpCache.BLOCK_EQUIP_ONCE_ENHANCE_CONFIRM = val;
    }

    // 无间炼狱-商店退出确认框
    set blockPurgatoryShopQuitConfirm(val: boolean) {
        this._tmpCache.BLOCK_PURGATORY_SHOP_QUIT_CONFIRM = val;
    }

    get blockPurgatoryShopQuitConfirm() {
        return this._tmpCache.BLOCK_PURGATORY_SHOP_QUIT_CONFIRM;
    }

    //每日补齐道具配置
    set everyDayGiveItemCfg(cfg: Map<number, number>){
        this._tmpCache.EverydayGiveItemCfg = cfg;
    }

    get everyDayGiveItemCfg(): Map<number, number>{
        return this._tmpCache.EverydayGiveItemCfg || null;
    }

    //灵兽星级与等级上限的配置
    get beastMaxLvCfg() {
        if(this._tmpCache.BeastMaxLvCfg) return this._tmpCache.BeastMaxLvCfg;
        let beastMaxLvCfg = configUtils.getModuleConfigs();
        if(beastMaxLvCfg && beastMaxLvCfg.BeastLevelMax) {
            let beastMaxLvMap = new Map<number, number>();
            utils.parseStingList(beastMaxLvCfg.BeastLevelMax, (strArr: string[]) => {
                beastMaxLvMap.set(parseInt(strArr[0]), parseInt(strArr[1]));
            });
            this._tmpCache.BeastMaxLvCfg = beastMaxLvMap;
        }
        return this._tmpCache.BeastMaxLvCfg;
    }

    deInit() {
        this._tmpCache = {};
    }
}

export let commonData = new CommonData();
