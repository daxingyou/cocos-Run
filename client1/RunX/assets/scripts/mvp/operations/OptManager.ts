/*
 * @Author: fly
 * @Date: 2021-03-16 19:05:56
 * @LastEditTime: 2021-09-18 12:12:22
 * @Description: file content
 */

import { activityOpt } from "./ActivityOpt";
import { antiAddictionOpt } from "./AntiAddictionOpt";
import { bagDataOpt } from "./BagDataOpt";
import { battleTestOpt } from "./BattleTestOpt";
import { battleUIOpt } from "./BattleUIOpt";
import { chatOpt } from "./ChatOpt";
import { consecrateOpt } from "./ConsecrateOpt";
import { divineOpt } from "./DivineOpt";
import { gmOpt } from "./GMOpt";
import { guideOpt } from "./GuideOpt";
import { guildOpt } from "./GuildOpt";
import { limitDataOpt } from "./LimitDataOpt";
import { mailOpt } from "./MailOpt";
import { mainTaskOpt } from "./MainTaskOpt";
import { onlineOpt } from "./OnlineOpt";
import { pragmaticDataOpt } from "./PragmaticDataOpt";
import { pveDataOpt } from "./PveDataOpt";
import { pvpDataOpt } from "./PvpDataOpt";
import { rankDataOpt } from "./RankDataOpt";
import { shopOpt } from "./ShopOpt";
import { strategyOpt } from "./StrategyOpt";
import { taskDataOpt } from "./TaskDataOpt";
import { trackDataOpt } from "./TrackDataOpt";
import { userOpt } from "./UserOpt";

export default class OptManager {
    /**
      * 初始化各个opt模块
     */
    init() {
        bagDataOpt.init();
        battleUIOpt.init();
        chatOpt.init();
        mailOpt.init();
        pveDataOpt.init();
        userOpt.init();
        trackDataOpt.init();
        shopOpt.init();
        rankDataOpt.init();
        limitDataOpt.init();
        antiAddictionOpt.init();
        pragmaticDataOpt.init();
        pvpDataOpt.init();
        taskDataOpt.init();
        activityOpt.init();
        guideOpt.init();
        guildOpt.init();
        divineOpt.init();
        battleTestOpt.init();
        strategyOpt.init();
        onlineOpt.init();
        mainTaskOpt.init();
	    consecrateOpt.init();
        gmOpt.init();
    }

    /**
     * 有初始化就得有反初始化
     */
    deInit() {
        bagDataOpt.deInit();
        battleUIOpt.deInit();
        chatOpt.deInit();
        mailOpt.deInit();
        pveDataOpt.deInit();
        userOpt.deInit();
        trackDataOpt.deInit();
        shopOpt.deInit();
        rankDataOpt.deInit();
        limitDataOpt.deInit();
        antiAddictionOpt.deInit();
        pragmaticDataOpt.deInit();
        pvpDataOpt.deInit();
        taskDataOpt.deInit();
        activityOpt.deInit();
        guideOpt.deInit();
        guildOpt.deInit();
        divineOpt.deInit();
        battleTestOpt.deInit();
        strategyOpt.deInit();
        onlineOpt.deInit();
        mainTaskOpt.deInit();
	    consecrateOpt.deInit();
        gmOpt.deInit();
    }
}

let optManager = new OptManager();
export { optManager }
