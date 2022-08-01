/**
 * 张海洋
 * 2021.4.26
 * 关卡 opt manager 逻辑控制
 */
import { configUtils } from "../../app/ConfigUtils";
import { eventCenter } from "../../common/event/EventCenter";
import guiManager from "../../common/GUIManager";
import { modelManager } from "../models/ModeManager";
import { ITEM_TYPE } from "../../app/AppEnums";
import { lvMapViewEvent } from "../../common/event/EventData";
import { GoodInfo, ItemInfo, LessonInfo } from "../models/LevelMapData";

export default class LevelMapOpt {

    init() {
        modelManager.levelMapData.init();
    }

    clickOperationLesson(lessonInfo: LessonInfo) {
        modelManager.levelMapData.curLessonInfo = lessonInfo;
        this.fireRefreshRewardView();
    }
    // 接收界面交互消息
    fireRefreshRewardView() {
        eventCenter.fire(lvMapViewEvent.REFRESH_LVMAP_VIEW);
    }
    /**
     * 判断是否满足进入关卡条件
     * @returns 
     */
    checkMeetEnterCondition() {
        let enterConditionInfos: ItemInfo[] = modelManager.levelMapData.getCurLessonEnterCondition();
        let isMeet: boolean = true;
        // 体力
        for (let i = 0; i < enterConditionInfos.length; ++i) {
            let enterConditionInfo: ItemInfo = enterConditionInfos[i];
            if (isMeet && enterConditionInfo) {
                // 当前是体力
                // test 
                enterConditionInfo.itemId = 10010003;
                if (this.getItemTypeByItemId(enterConditionInfo.itemId) == ITEM_TYPE.PHYSICAL) {
                    if (modelManager.userData.userInfo.physical >= enterConditionInfo.num) {
                        // todo 扣除体力
                    } else {
                        // todo 展示补充体力界面
                        guiManager.showTips('体力不足');
                        isMeet = false;
                    }
                }
            }
        }
        // Other
        // if (isMeet && Item_Type.Physical == this.getItemTypeByItemId(lessonInfo.LessonEnterCondition[0].itemId)) {
        //     if (modelManager.userData.userInfo.physical >= lessonInfo.LessonEnterCondition[0].num) {

        //     } else {
        //         isMeet = false;
        //     }
        // }
        return isMeet;
    }
    /**
     * 获得物品类型 通过 物品id
     * @param ItemId 
     * @returns 
     */
    getItemTypeByItemId(ItemId: number): ITEM_TYPE {
        // todo 还有很多种类
        let itemConfig: GoodInfo = configUtils.getGoodCofnig(ItemId);
        if (itemConfig.ItemId == 10010001) {
            return ITEM_TYPE.COIN;
        } else if (itemConfig.ItemId == 10010002) {
            return ITEM_TYPE.DIAMOND;
        } else if (itemConfig.ItemId == 10010003) {
            return ITEM_TYPE.PHYSICAL;
        } else if (itemConfig.ItemId == 10010004) {
            return ITEM_TYPE.HONOUR;
        } else if (itemConfig.ItemId == 10010005) {
            return ITEM_TYPE.REPUTATION;
        }
        return ITEM_TYPE.DIAMOND;
    }
}