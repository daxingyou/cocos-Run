import { AntiAdditionCode } from "../../app/AppEnums";
import { configManager } from "../../common/ConfigManager";
import { eventCenter } from "../../common/event/EventCenter";
import { antiAddictionEvent } from "../../common/event/EventData";
import { logger } from "../../common/log/Logger";
import { cfg } from "../../config/config";
import { activityData } from "../models/ActivityData";
import { serverTime } from "../models/ServerTime";
import { userData } from "../models/UserData";
import { BaseOpt } from "./BaseOpt";

const FORBINDEN_TIME_HOUR = 20
class AntiAddictionOpt extends BaseOpt {

    init () {

    }

    deInit () {

    }
    
    additionForceExitGame () {
        eventCenter.fire(antiAddictionEvent.ANTI_ADDICTION_TIMEOUT)
    }

    antiAdditionEnterCode (): AntiAdditionCode {
        let age = userData.age;
        if (age >= 18) {
            return AntiAdditionCode.ADULT;
        } else {
            let curr = new Date(serverTime.currServerTime() * 1000)
            let week = curr.getDay();
            let isWeekend = (week == 0 || week == 6 || week == 5)? true:false;
            let hour = curr.getHours();
            if (!isWeekend) {
                return AntiAdditionCode.NON_ADULT_TIME_FORBIDDEN;
            }

            if (hour != FORBINDEN_TIME_HOUR) {
                return AntiAdditionCode.NON_ADULT_TIME_FORBIDDEN;
            }
        }
        return AntiAdditionCode.NON_ADULT_NORMAL;
    }

    antiAdditionBuyCode (pid: number): AntiAdditionCode {
        let price = 0;
        if (cc.sys.os == cc.sys.OS_IOS) {
            let cfg: cfg.ShopRechargeIOS = configManager.getConfigByKey("rechargeIOS", pid);
            if (cfg && cfg.ShopRechargeIOSCost)
                price = cfg.ShopRechargeIOSCost / 100;
        } else {
            let cfg: cfg.ShopRechargeAndroid = configManager.getConfigByKey("rechargeAndroid", pid);
            if (cfg && cfg.ShopRechargeAndroidCost)
                price = cfg.ShopRechargeAndroidCost / 100;
        }

        if (!price) {
            let cfg: cfg.ShopGift = configManager.getConfigByKey("gift", pid);
            if (cfg && cfg.ShopGiftCost)
                price = cfg.ShopGiftCost / 100;
        }

        if (!price) {
            logger.error('[antiAddictionOpt] cant find product config, id = ', pid)
            return AntiAdditionCode.ADULT
        }

        let age = userData.age;
        if (age >= 18) {
            return AntiAdditionCode.ADULT;
        } else {
            let total = 0;
            if (activityData.levelData != null && activityData.levelData.RechargeAmount) {
                total = activityData.levelData.RechargeAmount/100
            }
            let curr = price;
            total += price;

            if (age < 8) {
                return AntiAdditionCode.NON_ADULT_UNDER8;
            }

            if (age >= 8 && age < 16) {
                if (curr > 50) {
                    return AntiAdditionCode.NON_ADULT_8TO16;
                }

                if (total > 200) {
                    return AntiAdditionCode.NON_ADULT_8TO16_TOTAL;
                }
            }

            if (age >= 16) {
                if (curr > 100) {
                    return AntiAdditionCode.NON_ADULT_16TO18;
                }

                if (total > 400) {
                    return AntiAdditionCode.NON_ADULT_16TO18_TOTAL;
                }
            }
        }
        return AntiAdditionCode.NON_ADULT_NORMAL;
    }

}

let antiAddictionOpt = new AntiAddictionOpt();
export { 
    antiAddictionOpt,
    FORBINDEN_TIME_HOUR 
}