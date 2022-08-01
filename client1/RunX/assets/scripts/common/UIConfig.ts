
import { SCENE_NAME, ResConfig } from "../app/AppConst";
/**
 * 注意事项！
 * 1. 缓存模式
 *  - NONE
 *    - 不缓存，关闭时候销毁节点和相关引用资源
 *  - PREFAB
 *    - 相关引用资源一旦加载勇不释放
 *    - 界面关闭时会销毁节点，但是引用资源还是缓存起来
 *  - NODE
 *    - 相关引用资源一旦加载勇不释放
 *    - 界面关闭时不会销毁节点
 *    - 单例模式，同时存在的时候会关闭之前同为NODE缓存的界面
 *    - 不能用 loadsubview去加载
 * 2. UI_TYPE
 *    - 如果这个界面的UI_TYPE = FULL_SCREEN_VIEW 则【一定不可以】使用moduleView之后loadSubView/guimanager.loadView去加载
 *        - 否则这个界面挂在节点上面，但是这个父节点由于是moduleView读出来的，弹出新界面的时候会回收
 */
enum UI_CACHE {
    NONE = 1,
    PREFAB,
    NODE,
}

enum UI_LOADING {
    NONE = 0,
    WAITING,
    LOADING,
    GAME_LOADING,
}

enum UI_TYPE{
    NONE,
    SCENE,
    VIEW,
    FULL_SCREEN_VIEW,
    NODE,
    EFFECT,
    GAME_FINAL,
}
/**
 * @desc 带有CacheMode为Prefab标记的，一辈子都不会被释放掉
 *
 * @interface UIInfo
 */
interface UIInfo {
    id: string;
    path: string;
    cacheMode?: UI_CACHE;
    component?: string;
    preload?: boolean;
    loading?: UI_LOADING;
    type?: UI_TYPE
}

class UIConfig {
    private _uiInfo = new Map<string, UIInfo>();

    /**
     * @desc 根据传入的ID，查询指定的UI配置。如果传入的是prefab路径，则自动采用默认的数值，添加一个配置
     *
     * @param {string} id
     * @returns {UIInfo}
     * @memberof UIConfig
     */
    getConfig(id: string): UIInfo {
        if (this._uiInfo.has(id)) {
            return this._uiInfo.get(id);
        } else {
            this.add({ id: id, path: id });
            return this.getConfig(id);
        }
    }

    add(info: UIInfo): UIConfig {
        if (info && info.cacheMode == null) {
            info.cacheMode = UI_CACHE.NONE;
        }
        this._uiInfo.set(info.id, info);
        return this;
    }

    getAllUI(): UIInfo[] {
        const ret: UIInfo[] = [];
        this._uiInfo.forEach(v => {
            ret.push(v);
        })
        return ret;
    }
}
let uiConfig = new UIConfig();

uiConfig

    // Scene
    .add({ id: 'LoginScene', path: 'prefab/scene/LoginScene', component: 'LoginScene', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.SCENE})
    .add({ id: 'MainScene', path: 'prefab/scene/MainScene', component: 'MainScene', cacheMode: UI_CACHE.NODE, loading: UI_LOADING.LOADING, type: UI_TYPE.SCENE})
    .add({ id: 'BattleScene', path: 'prefab/scene/BattleScene', component: 'BattleScene', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.GAME_LOADING, type: UI_TYPE.SCENE})
    .add({ id: 'GameTipsScene', path: 'prefab/scene/GameTipsScene', component: 'GameTipsScene', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE, type: UI_TYPE.SCENE})
    .add({ id: SCENE_NAME.RUN_COOL, path: ResConfig.runCoolScenePath, component: 'ParkourScene', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.GAME_LOADING, type: UI_TYPE.SCENE})  //跑酷场景

    // Views
    .add({ id: 'LevelMapView', path: 'prefab/views/view-levelmap/LevelMapView', component: 'LevelMapView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.WAITING, type: UI_TYPE.FULL_SCREEN_VIEW })
    .add({ id: 'LevelMapChapterList', path: 'prefab/views/view-levelmap/LevelMapChapterList', component: 'LevelMapChapterList', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE })
    .add({ id: 'LevelMapRewardView', path: 'prefab/views/view-levelmap/LevelMapRewardView', component: 'LevelMapRewardView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.WAITING})
    .add({ id: 'LoginView', path: 'prefab/views/view-login/LoginView', component: 'LoginView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'ChannelView', path: 'prefab/views/view-login/ChannelView', component: 'ChannelView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'UpgradeView', path: 'prefab/views/view-login/UpgradeView', component: 'UpgradeComponent', cacheMode: UI_CACHE.NONE })
    .add({ id: 'NoticeView', path: 'prefab/views/view-login/NoticeView', component: 'NoticeView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'BattlePrepareView', path: 'prefab/views/view-battle/BattlePrepareView', component: 'BattlePrepareView', cacheMode: UI_CACHE.NONE, type: UI_TYPE.NONE })
    .add({ id: 'MessageBoxView', path: 'prefab/views/MessageBoxView', component: 'MessageBoxView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'InfoView', path: 'prefab/views/view-info/InfoView', component: 'InfoView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'HeadView', path: 'prefab/views/view-info/HeadView', component: 'HeadView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'EditNameView', path: 'prefab/views/view-info/EditNameView', component: 'EditNameView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'ExchangeView', path: 'prefab/views/view-info/ExchangeView', component: 'ExchangeView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'HeroView', path: 'prefab/views/view-hero/HeroView', component: 'HeroView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.LOADING, type: UI_TYPE.FULL_SCREEN_VIEW })
    .add({ id: 'HeroMorePropertyView', path: 'prefab/views/view-hero/HeroMorePropertyView', component: 'HeroMorePropertyView', cacheMode: UI_CACHE.NONE, type: UI_TYPE.NONE })
    .add({ id: 'EquipPropertyView', path: 'prefab/views/view-hero/EquipPropertyView', component: 'EquipPropertyView', cacheMode: UI_CACHE.NONE, type: UI_TYPE.NONE })
    .add({ id: 'EquipsListView', path: 'prefab/views/view-hero/EquipsListView', component: 'EquipsListView', cacheMode: UI_CACHE.NONE})
    .add({ id: 'BagView', path: 'prefab/views/view-bag/BagView', component: 'BagView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.LOADING, type: UI_TYPE.FULL_SCREEN_VIEW })
    .add({ id: 'EquipEnhanceView', path: 'prefab/views/view-bag/EquipEnhanceView', component: 'EquipEnhanceView', cacheMode: UI_CACHE.NONE, type: UI_TYPE.FULL_SCREEN_VIEW })
    .add({ id: 'EquipRevertView', path: 'prefab/views/view-bag/EquipRevertView', component: 'EquipRevertView', cacheMode: UI_CACHE.NONE, type: UI_TYPE.FULL_SCREEN_VIEW })
    .add({ id: 'PreinstallView', path: 'prefab/views/view-preinstall/PreinstallView', component: 'PreinstallView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.WAITING })
    .add({ id: 'EquipInfoView', path: 'prefab/views/view-bag/EquipInfoView', component: 'EquipInfoView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'EquipBreakMatView', path: 'prefab/views/view-bag/EquipBreakMatView', component: 'EquipBreakMatView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'HeroPropertyView', path: 'prefab/views/view-hero/HeroPropertyView', component: 'HeroPropertyView', cacheMode: UI_CACHE.NONE, type: UI_TYPE.NONE })
    .add({ id: 'ParkourPrepareView', path: 'prefab/views/view-parkour/ParkourPrepareView', component: 'ParkourPrepareView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'BagItemUseView', path: 'prefab/views/view-bag/BagItemUseView', component: 'BagItemUseView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'MailView', path: 'prefab/views/view-mail/MailView', component: 'MailView', cacheMode: UI_CACHE.NONE, type: UI_TYPE.FULL_SCREEN_VIEW })
    .add({ id: 'GameWinView', path: 'prefab/views/view-summary/GameWinView', component: 'GameWinView', cacheMode: UI_CACHE.NONE, type: UI_TYPE.GAME_FINAL})
    .add({ id: 'GamePvpWinView', path: 'prefab/views/view-summary/GamePvpWinView', component: 'GamePvpWinView', cacheMode: UI_CACHE.NONE, type: UI_TYPE.GAME_FINAL})
    .add({ id: 'GamePvpFairyWinView', path: 'prefab/views/view-summary/GamePvpFairyWinView', component: 'GamePvpFairyWinView', cacheMode: UI_CACHE.NONE, type: UI_TYPE.GAME_FINAL})
    .add({ id: 'GameLoseView', path: 'prefab/views/view-summary/GameLoseView', component: 'GameLoseView', cacheMode: UI_CACHE.NONE, type: UI_TYPE.GAME_FINAL})
    .add({ id: 'GetItemView', path: 'prefab/views/view-other/GetItemView', component: 'GetItemView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'GetHpView', path: 'prefab/views/view-other/GetHpView', component: 'GetHpView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'ChatView', path: 'prefab/views/view-chat/ChatView', component: 'ChatView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'UserInfoView', path: 'prefab/views/view-chat/UserInfoView', component: 'UserInfoView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'ChatSettingView', path: 'prefab/views/view-chat/ChatSettingView', component: 'ChatSettingView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'BlackListView', path: 'prefab/views/view-chat/BlackListView', component: 'BlacklistView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'SummonView', path: 'prefab/views/view-summon/SummonView', component: 'SummonView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.LOADING, preload: true, type: UI_TYPE.FULL_SCREEN_VIEW })
    .add({ id: 'ParkourMenuView', path: 'prefab/views/view-parkour/MenuParkour', component: 'MenuParkour', cacheMode: UI_CACHE.NONE })
    .add({ id: 'ReliveParkourView', path: 'prefab/views/view-parkour/ReliveParkour', component: 'ReliveParkour', cacheMode: UI_CACHE.NONE })
    .add({ id: 'SummonSimulateSaveView', path: 'prefab/views/view-summon/SummonSimulateSaveView', component: 'SummonSimulateSaveView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.LOADING})
    .add({ id: 'SummonSimulateResView', path: 'prefab/views/view-summon/SummonSimulateResView', component: 'SummonSimulateResView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'SummonIntroduceView', path: 'prefab/views/view-summon/SummonIntroduceView', component: 'SummonIntroduceView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'SummonCardPoolView', path: 'prefab/views/view-summon/SummonCardPoolView', component: 'SummonCardPoolView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.WAITING })
    .add({ id: 'GiftChooseView', path: 'prefab/views/view-bag/GiftChooseView', component: 'GiftChooseView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'DreamlandView', path: 'prefab/views/view-dreamland/DreamlandView', component: 'DreamlandView', cacheMode: UI_CACHE.NONE, type: UI_TYPE.FULL_SCREEN_VIEW })
    .add({ id: 'DreamlandChapterPrizeView', path: 'prefab/views/view-dreamland/DreamlandChapterPrizeView', component: 'DreamlandChapterPrizeView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'DreamlandRewardView', path: 'prefab/views/view-dreamland/DreamLandRewardView', component: 'DreamLandRewardView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'LevelUpView', path: 'prefab/views/view-other/LevelUpView', component: 'LevelUpView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'GiftPropertyView', path: 'prefab/views/view-hero/GiftPropertyView', component: 'GiftPropertyView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE })
    .add({ id: 'ShopView', path: 'prefab/views/view-shop/ShopView', component: 'ShopView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.FULL_SCREEN_VIEW })
    .add({ id: 'ShopCommodityView', path: 'prefab/views/view-shop/ShopCommodityView', component: 'ShopCommodityView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE })
    .add({ id: 'ShopGiftView', path: 'prefab/views/view-shop/ShopGiftView', component: 'ShopGiftView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE })
    .add({ id: 'TipsHero', path: 'prefab/views/view-tips/TipsHero', component: 'TipsHero', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE })
    .add({ id: 'TipsEquip', path: 'prefab/views/view-bag/BagEquipPropView', component: 'BagItemPropView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE })
    .add({ id: 'TipsItem', path: 'prefab/views/view-bag/BagItemPropView', component: 'BagItemPropView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE })
    .add({ id: 'TipsSkill', path: 'prefab/views/view-tips/TipsSkill', component: 'TipsSkill', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE })
    .add({ id: 'TipsMonster', path: 'prefab/views/view-tips/TipsMonster', component: 'TipsMonster', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE })
    .add({ id: 'RankView', path: 'prefab/views/view-rank/RankView', component: 'RankView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.WAITING, type: UI_TYPE.FULL_SCREEN_VIEW})
    .add({ id: 'FriendsPopView', path: 'prefab/views/view-preinstall/FriendsPopView', component: 'FriendsPopView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE })
    .add({ id: 'PVEHomeView', path: 'prefab/views/view-pve/PVEHomeView', component: 'PVEHomeView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.WAITING, type: UI_TYPE.FULL_SCREEN_VIEW })
    .add({ id: 'PVEDailyLessonView', path: 'prefab/views/view-pve/PVEDailyLessonView', component: 'PVEDailyLessonView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.LOADING, type: UI_TYPE.FULL_SCREEN_VIEW})
    .add({ id: 'PVERiseRoadView', path: 'prefab/views/view-pve/PVERiseRoadView', component: 'PVERiseRoadView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.LOADING, type: UI_TYPE.FULL_SCREEN_VIEW  })
    .add({ id: 'RandomFightView', path: 'prefab/views/view-timelimit/RandomFightView', component: 'RandomFightView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE })
    .add({ id: 'RandomShopView', path: 'prefab/views/view-timelimit/RandomShopView', component: 'RandomShopView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE })
    .add({ id: 'ItemHeroShow', path: 'prefab/item/ItemHeroShow', component: 'ItemHeroShow', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type:  UI_TYPE.NONE})
    .add({ id: 'PVECloudDreamView', path: 'prefab/views/view-pve/PVECloudDreamView', component: 'PVECloudDreamView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.FULL_SCREEN_VIEW })
    .add({ id: 'PVENineHellView', path: 'prefab/views/view-pve/PVENineHellView', component: 'PVENineHellView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.FULL_SCREEN_VIEW })
    .add({ id: 'PVECloudDreamRewardView', path: 'prefab/views/view-pve/PVECloudDreamRewardView', component: 'PVECloudDreamRewardView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE })
    .add({ id: 'PVEMagicDoorView', path: 'prefab/views/view-pve/PVEMagicDoorView', component: 'PVEMagicDoorView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.LOADING, type: UI_TYPE.FULL_SCREEN_VIEW })
    .add({ id: 'PVEMagicDoorRewardView', path: 'prefab/views/view-pve/PVEMagicDoorRewardView', component: 'PVEMagicDoorRewardView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE })
    .add({ id: 'AntiAddictionView', path: 'prefab/views/view-antiAddiction/AntiAddictionView', component: 'AntiAddictionView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE })
    .add({ id: 'EligibleView', path: 'prefab/views/view-antiAddiction/EligibleView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE })
    .add({ id: 'PrivaceView', path: 'prefab/views/view-antiAddiction/PrivaceView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE })
    .add({ id: 'PrivaceUrlView', path: 'prefab/views/view-antiAddiction/PrivaceUrlView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE })
    .add({ id: 'PragmaticView', path: 'prefab/views/view-pragmatic/PragmaticView', component: 'PragmaticView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.WAITING, type: UI_TYPE.FULL_SCREEN_VIEW })
    .add({ id: 'TreasureView', path: 'prefab/views/view-treasure/TreasureView', component: 'TreasureView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE })
    .add({ id: 'PVPHomeView', path: 'prefab/views/view-pvp/PVPHomeView', component: 'PVPHomeView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.WAITING, type: UI_TYPE.FULL_SCREEN_VIEW })
    .add({ id: 'PVPDeifyView', path: 'prefab/views/view-pvp/PVPDeifyView', component: 'PVPDeifyView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.FULL_SCREEN_VIEW })
    .add({ id: 'PVPDeifyRankRewardView', path: 'prefab/views/view-pvp/PVPDeifyRankRewardView', component: 'PVPDeifyRewardView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE })
    .add({ id: 'PVPDeifyCombatLogView', path: 'prefab/views/view-pvp/PVPDeifyCombatLogView', component: 'PVPDeifyRecordView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE })
    .add({ id: 'SwitchMainView', path: 'prefab/views/view-main/SwitchMainView', component: 'SwitchMainView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE })
    .add({ id: 'PVPImmortalsView', path: 'prefab/views/view-pvp/PVPImmortalsView', component: 'PVPImmortalsView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.FULL_SCREEN_VIEW })
    .add({ id: 'PVPImmortalsRewardView', path: 'prefab/views/view-pvp/PVPImmortalsRewardView', component: 'PVPImmortalsRewardView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE })
    .add({ id: 'PVPImmortalsRankView', path: 'prefab/views/view-pvp/PVPImmortalsRankView', component: 'PVPImmortalsRankView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE })
    .add({ id: 'HandBookView', path: 'prefab/views/view-handbook/HandBookView', component: 'HandBookView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.LOADING, type: UI_TYPE.FULL_SCREEN_VIEW })
    .add({ id: 'HandBookHeroView', path: 'prefab/views/view-handbook/HandBookHeroView', component: 'HandBookHeroView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.WAITING, type: UI_TYPE.FULL_SCREEN_VIEW })
    .add({ id: 'TaskView', path: 'prefab/views/view-task/TaskView', component: 'TaskView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.WAITING, type: UI_TYPE.FULL_SCREEN_VIEW })
    .add({ id: 'BattleSettingView', path: 'prefab/views/view-battle/BattleSettingView', component: 'BattleSettingView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE })
    .add({ id: 'HeroIntroduceView', path: 'prefab/views/view-hero/HeroIntroduceView', component: 'HeroIntroduceView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE })
    .add({ id: 'ActivityHomeView', path: 'prefab/views/view-activity/ActivityHomeView', component: 'ActivityHomeView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.LOADING, type: UI_TYPE.FULL_SCREEN_VIEW })
    .add({ id: 'ActivitySignInView', path: 'prefab/views/view-activity/ActivitySignInView', component: 'ActivitySignInView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE  })
    .add({ id: 'ActivityGetHpView', path: 'prefab/views/view-activity/ActivityGetHpView', component: 'ActivityGetHpView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE  })
    .add({ id: 'ActivityLevelRewardView', path: 'prefab/views/view-activity/ActivityLevelRewardView', component: 'ActivityLevelRewardView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE  })
    .add({ id: 'ActivityLoginRewardView', path: 'prefab/views/view-activity/ActivityLoginRewardView', component: 'ActivityLoginRewardView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE  })
    .add({ id: 'ActivityBattlePassUpgradeView', path: 'prefab/views/view-activity/ActivityBattlePassUpgradeView', component: 'ActivityBattlePassUpgradeView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE  })
    .add({ id: 'ActivityBattlePassTipsView', path: 'prefab/views/view-activity/ActivityBattlePassTipsView', component: 'ActivityBattlePassTipsView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE  })
    .add({ id: 'ActivityBattlePassView', path: 'prefab/views/view-activity/ActivityBattlePassView', component: 'ActivityBattlePassView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE  })
    .add({ id: 'ActivityLotteryView', path: 'prefab/views/view-activity/ActivityLotteryView', component: 'ActivityLotteryView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE  })
    .add({ id: 'ActivityRechargeRebateView', path: 'prefab/views/view-activity/ActivityRechargeRebateView', component: 'ActivityRechargeRebateView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE  })
    .add({ id: 'ActivityDayRechargeView', path: 'prefab/views/view-activity/ActivityDayRechargeView', component: 'ActivityDayRechargeView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE  })
    .add({ id: 'ActivityCumulativeRechargeView', path: 'prefab/views/view-activity/ActivityCumulativeRechargeView', component: 'ActivityCumulativeRechargeView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE  })
    .add({ id: 'ActivityDoubleWeekView', path: 'prefab/views/view-activity/ActivityDoubleWeekView', component: 'ActivityDoubleWeekView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.WAITING})
    .add({ id: 'ActivityMonthlyCardView', path: 'prefab/views/view-activity/ActivityMonthlyCardView', component: 'ActivityMonthlyCardView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE, type: UI_TYPE.NONE })
    .add({ id: 'ActivityHeroDevelopView', path: 'prefab/views/view-activity/ActivityHeroDevelopView', component: 'ActivityHeroDevelopView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE, type: UI_TYPE.NONE })
    .add({ id: 'ActivityEternalRechargeView', path: 'prefab/views/view-activity/ActivityEternalRechargeView', component: 'ActivityEternalRechargeView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE, type: UI_TYPE.NONE })
    .add({ id: 'ActivityFeastGiftView', path: 'prefab/views/view-activity/ActivityFeastGiftView', component: 'ActivityFeastGiftView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE, type: UI_TYPE.NONE })
    .add({ id: 'ActivityPreview', path: 'prefab/views/view-activity/ActivityPreview', component: 'ActivityPreview', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE, type: UI_TYPE.NONE })
    .add({ id: 'FunctionGuideView', path: 'prefab/views/view-guide/FunctionGuideView', component: 'FunctionGuideView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE })
    .add({ id: 'GuildView', path: 'prefab/views/view-guild/GuildView', component: 'GuildView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE, type: UI_TYPE.FULL_SCREEN_VIEW })
    .add({ id: 'GuildMainView', path: 'prefab/views/view-guild/GuildMainView', component: 'GuildMainView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE })
    .add({ id: 'GuildListView', path: 'prefab/views/view-guild/GuildListView', component: 'GuildListView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE })
    .add({ id: 'GuildCreateView', path: 'prefab/views/view-guild/GuildCreateView', component: 'GuildCreateView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE })
    .add({ id: 'GuildEditNoticeView', path: 'prefab/views/view-guild/GuildEditNoticeView', component: 'GuildEditNoticeView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE })
    .add({ id: 'GuildLevelDetailView', path: 'prefab/views/view-guild/GuildLevelDetailView', component: 'GuildLevelDetailView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE })
    .add({ id: 'GuildBossDetailView', path: 'prefab/views/view-guild/GuildBossDetailView', component: 'GuildBossDetailView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE })
    .add({ id: 'GuildChangeNameView', path: 'prefab/views/view-guild/GuildChangeNameView', component: 'GuildChangeNameView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE })
    .add({ id: 'GuildMemberListView', path: 'prefab/views/view-guild/GuildMemberListView', component: 'GuildMemberListView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE })
    .add({ id: 'GuildDailyNewsView', path: 'prefab/views/view-guild/GuildDailyNewsView', component: 'GuildDailyNewsView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE })
    .add({ id: 'GuildApplyListView', path: 'prefab/views/view-guild/GuildApplyListView', component: 'GuildApplyListView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE })
    .add({ id: 'GuildKickOutView', path: 'prefab/views/view-guild/GuildKickOutView', component: 'GuildKickOutView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE })
    .add({ id: 'GuildBossView', path: 'prefab/views/view-guild/GuildBossView', component: 'GuildBossView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE, type: UI_TYPE.NONE })
    .add({ id: 'GuildBossFightTeamView', path: 'prefab/views/view-guild/GuildBossFightTeamView', component: 'GuildBossFightTeamView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE })
    .add({ id: 'GuildBossTeamListView', path: 'prefab/views/view-guild/GuildBossTeamListView', component: 'GuildBossTeamListView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE })
    .add({ id: 'GuildDonateView', path: 'prefab/views/view-guild/GuildDonateView', component: 'GuildDonateView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE })
    .add({ id: 'GuildTaskView', path: 'prefab/views/view-guild/GuildTaskView', component: 'GuildTaskView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE })
    .add({ id: 'SmeltView', path: 'prefab/views/view-smelt/SmeltView', component: 'SmeltView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})
    .add({ id: 'GetSSRPVView', path:'prefab/views/view-other/GetSSRPVView', component: 'GetSSRPVView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE})
    .add({ id: 'GetSSRView', path:'prefab/views/view-other/GetSSRView', component: 'GetSSRView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE})
    .add({ id: 'BattleWatchBuffView', path:'prefab/views/view-battle/BattleWatchBuffView', component: 'BattleWatchBuffView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE})
    .add({ id: 'SevenDayView', path: 'prefab/views/view-sevenday/SevenDayView', component: 'SevenDayView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.WAITING, type: UI_TYPE.FULL_SCREEN_VIEW})
    .add({ id: 'DivineSystemView', path: 'prefab/views/view-divine/DivineSystemView', component: 'DivineSystemView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE, type: UI_TYPE.FULL_SCREEN_VIEW })
    .add({ id: 'DivineDispatchView', path: 'prefab/views/view-divine/DivineDispatchView', component: 'DivineDispatchView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE})
    .add({ id: 'DivineOnceDispatchView', path: 'prefab/views/view-divine/DivineOnceDispatchView', component: 'DivineOnceDispatchView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE})
    .add({ id: 'FirstChargeView', path: 'prefab/views/view-firstcharge/FirstChargeView', component: 'FirstChargeView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE})
    .add({ id: 'SageNameView', path: 'prefab/views/view-sage/SageNameView', component: 'SageNameView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE})
    .add({ id: 'SageQuestionView', path: 'prefab/views/view-sage/SageQuestionView', component: 'SageQuestionView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.NONE})
    .add({ id: 'LimitedTimeGiftView', path: 'prefab/views/view-limitTimeGifts/LimitedTimeGiftView', component: 'LimitedTimeGiftView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE })
    .add({ id: 'HeroStarRaiseView', path: 'prefab/views/view-hero/HeroStarRaiseView', component: 'HeroStarRaiseView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE })
    .add({ id: 'CompoundView', path: 'prefab/views/view-treasure/CompoundView', component: 'CompoundView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.WAITING, type: UI_TYPE.FULL_SCREEN_VIEW })
    .add({ id: 'TreasureActiveView', path: 'prefab/views/view-treasure/TreasureActiveView', component: 'TreasureActiveView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE })
    .add({ id: 'HangUpRewardView', path: 'prefab/views/view-levelmap/HangUpRewardView', component: 'HangUpRewardView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.WAITING })
    .add({ id: 'PVELessonMopUpView', path: 'prefab/views/view-pve/PveLessonMopUpView', component: 'PveLessonMopUpView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE})
    .add({ id: 'WuDaoView', path: 'prefab/views/view-pragmatic/WuDaoView', component: 'WuDaoView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})
    .add({ id: 'TipsWuDaoSkill', path: 'prefab/views/view-pragmatic/TipsWuDaoSkill', component: 'TipsWuDaoSkill', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})
    .add({ id: 'ReportUserView', path: 'prefab/views/view-chat/ReportUserView', component: 'ReportUserView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE})
    .add({ id: 'RankRewardView', path: 'prefab/views/view-rank/RankRewardView', component: 'RankRewardView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE})
    .add({ id: 'BattleReportView', path: 'prefab/views/view-battle/BattleReportView', component: 'BattleReportView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.WAITING})
    .add({ id: 'StrategyView', path: 'prefab/views/view-strategy/StrategyView', component: 'StrategyView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.WAITING, type: UI_TYPE.FULL_SCREEN_VIEW})
    .add({ id: 'StrategyStrongView', path: 'prefab/views/view-strategy/StrategyStrongView', component: 'StrategyStrongView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})
    .add({ id: 'StrategyHeroView', path: 'prefab/views/view-strategy/StrategyHeroView', component: 'StrategyHeroView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})
    .add({ id: 'StrategyEquipView', path: 'prefab/views/view-strategy/StrategyEquipView', component: 'StrategyEquipView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})
    .add({ id: 'StrategyGetItemView', path: 'prefab/views/view-strategy/StrategyGetItemView', component: 'StrategyGetItemView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})
    .add({ id: 'StrategyRecommandTeamView', path: 'prefab/views/view-strategy/StrategyRecommandTeamView', component: 'StrategyRecommandTeamView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})
    .add({ id: 'StrategyFAQView', path: 'prefab/views/view-strategy/StrategyFAQView', component: 'StrategyFAQView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE })
    .add({ id: 'OnlineRewardView', path: 'prefab/views/view-online/OnlineRewardView', component: 'OnlineRewardView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})
    .add({ id: 'EquipOnceEnhanceConfirmView', path: 'prefab/views/view-hero/EquipOnceEnhanceConfirmView', component: 'EquipOnceEnhanceConfirmView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})
    .add({ id: 'SpiritBeastListView', path: 'prefab/views/view-hero/SpiritBeastListView', component: 'SpiritBeastListView', cacheMode: UI_CACHE.NONE})
    .add({ id: 'BeastRiseStarView', path: 'prefab/views/view-hero/BeastRiseStarView', component: 'BeastRiseStarView', cacheMode: UI_CACHE.NONE})
    .add({ id: 'GongFengView', path: 'prefab/views/view-gongFeng/GongFengView', component: 'GongFengView', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.WAITING, type: UI_TYPE.FULL_SCREEN_VIEW})
    .add({ id: 'MainTaskView', path: 'prefab/views/view-maintask/MainTaskView', component: 'MainTaskView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.VIEW})
    .add({ id: 'GongFengLvRewardView', path: 'prefab/views/view-gongFeng/GongFengLvRewardView', component: 'GongFengLvRewardView', cacheMode: UI_CACHE.NONE, type: UI_TYPE.NONE})
    .add({ id: 'GongFengBagView', path: 'prefab/views/view-gongFeng/GongFengBagView', component: 'GongFengBagView', cacheMode: UI_CACHE.NONE, type: UI_TYPE.NONE})
    .add({ id: 'GongFengSpeedView', path: 'prefab/views/view-gongFeng/GongFengSpeedView', component: 'GongFengSpeedView', cacheMode: UI_CACHE.NONE, type: UI_TYPE.NONE})
    .add({ id: 'GongFengSingleSpeedView', path: 'prefab/views/view-gongFeng/GongFengSingleSpeedView', component: 'GongFengSingleSpeedView', cacheMode: UI_CACHE.NONE, type: UI_TYPE.NONE})
    .add({ id: 'GongFengIntroduceView', path: 'prefab/views/view-gongFeng/GongFengIntroduceView', component: 'GongFengIntroduceView', cacheMode: UI_CACHE.NONE, type: UI_TYPE.NONE})
    .add({ id: 'GongFengBefallView', path: 'prefab/views/view-gongFeng/GongFengBefallView', component: 'GongFengBefallView', cacheMode: UI_CACHE.NONE, type: UI_TYPE.NONE})
    .add({ id: 'PVEChallengeView', path: 'prefab/views/view-pve/pve-challenge/PVEChallengeView', component: 'PVEChallengeView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.FULL_SCREEN_VIEW })
    .add({ id: 'PVEChallengeRuleView', path: 'prefab/views/view-pve/pve-challenge/PVEChallengeRuleView', component: 'PVEChallengeRuleView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})
    .add({ id: 'PVEChallengeSelectHeroView', path: 'prefab/views/view-pve/pve-challenge/PVEChallengeSelectHeroView', component: 'PVEChallengeSelectHeroView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})
    .add({ id: 'PVEChallengeMyHeroesView', path: 'prefab/views/view-pve/pve-challenge/PVEChallengeMyHeroesView', component: 'PVEChallengeMyHeroesView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})
    .add({ id: 'PVEFairyIslandView', path: 'prefab/views/view-pve/pve-fairyisland/PVEFairyIslandView', component: 'PVEFairyIslandView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.FULL_SCREEN_VIEW})
    .add({ id: 'PVEFairyIsLandRewardPreview', path: 'prefab/views/view-pve/pve-fairyisland/PVEFairyIsLandRewardPreview', component: 'PVEFairyIsLandRewardPreview', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})
    .add({ id: 'PVEFairyIslandEnemyView', path: 'prefab/views/view-pve/pve-fairyisland/PVEFairyIslandEnemyView', component: 'PVEFairyIslandEnemyView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE })
    .add({ id: 'PVEFairyIslandEffectPopView', path: 'prefab/views/view-pve/pve-fairyisland/PVEFairyIslandEffectPopView', component: 'PVEFairyIslandEffectPopView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE })
    .add({ id: 'PVEFairyIslandBuffView', path: 'prefab/views/view-pve/pve-fairyisland/PVEFairyIslandBuffView', component: 'PVEFairyIslandBuffView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE })
    .add({ id: 'PVEFairyIslandMyHeroView', path: 'prefab/views/view-pve/pve-fairyisland/PVEFairyIslandMyHeroView', component: 'PVEFairyIslandMyHeroView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE })
    .add({ id: 'PVEXinMoFaXiangView', path: 'prefab/views/view-pve/pve-xinMoFaXiang/PVEXinMoFaXiangView', component: 'PVEXinMoFaXiangView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.FULL_SCREEN_VIEW})
    .add({ id: 'PVEXinMoFaXiangRankView', path: 'prefab/views/view-pve/pve-xinMoFaXiang/PVEXinMoFaXiangRankView', component: 'PVEXinMoFaXiangRankView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})
    .add({ id: 'PVEXinMoFaXiangRewardView', path: 'prefab/views/view-pve/pve-xinMoFaXiang/PVEXinMoFaXiangRewardView', component: 'PVEXinMoFaXiangRewardView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})
    .add({ id: 'PVEXinMoFaXiangIntroView', path: 'prefab/views/view-pve/pve-xinMoFaXiang/PVEXinMoFaXiangIntroView', component: 'PVEXinMoFaXiangIntroView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})
	.add({ id: 'PVEPurgatoryView', path: 'prefab/views/view-pve/pve-purgatory/PVEPurgatoryView', component: 'PVEPurgatoryView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.FULL_SCREEN_VIEW})
    .add({ id: 'PVEPurgatoryRuleView', path: 'prefab/views/view-pve/pve-purgatory/PVEPurgatoryRuleView', component: 'PVEPurgatoryRuleView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})
    .add({ id: 'PVEPurtogaryBossRewardView', path: 'prefab/views/view-pve/pve-purgatory/PVEPurtogaryBossRewardView', component: 'PVEPurtogaryBossRewardView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})
    .add({ id: 'PVEPurgatoryReviveView', path: 'prefab/views/view-pve/pve-purgatory/PVEPurgatoryReviveView', component: 'PVEPurgatoryReviveView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})
    .add({ id: 'PVEPurgatoryMyHeroesView', path: 'prefab/views/view-pve/pve-purgatory/PVEPurgatoryMyHeroesView', component: 'PVEPurgatoryMyHeroesView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})
    .add({ id: 'PVEPurgatoryMyBuffView', path: 'prefab/views/view-pve/pve-purgatory/PVEPurgatoryMyBuffView', component: 'PVEPurgatoryMyBuffView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})
    .add({ id: 'BuffPurgatoryView', path: 'prefab/views/view-pve/pve-purgatory/BuffPurgatoryView', component: 'BuffPurgatoryView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})
    .add({ id: 'ShopPurgatoryView', path: 'prefab/views/view-pve/pve-purgatory/ShopPurgatoryView', component: 'ShopPurgatoryView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})
    .add({ id: 'SpringPurgatoryView', path: 'prefab/views/view-pve/pve-purgatory/SpringPurgatoryView', component: 'SpringPurgatoryView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})
    .add({ id: 'AltarPurgatoryView', path: 'prefab/views/view-pve/pve-purgatory/AltarPurgatoryView', component: 'AltarPurgatoryView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})
    .add({ id: 'MonsterPurgatoryView', path: 'prefab/views/view-pve/pve-purgatory/MonsterPurgatoryView', component: 'MonsterPurgatoryView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})
	.add({ id: 'PortalPurgatoryView', path: 'prefab/views/view-pve/pve-purgatory/PortalPurgatoryView', component: 'PortalPurgatoryView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})
    .add({ id: 'PVPPeakDuelView', path: 'prefab/views/view-pvp/pvp-peakduel/PVPPeakDuelView', component: 'PVPPeakDuelView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.FULL_SCREEN_VIEW })
    .add({ id: 'PVPPeakDuelRewardPreview', path: 'prefab/views/view-pvp/pvp-peakduel/PVPPeakDuelRewardPreview', component: 'PVPPeakDuelRewardPreview', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})
    .add({ id: 'PVPPeakDuelTaskView', path: 'prefab/views/view-pvp/pvp-peakduel/PVPPeakDuelTaskView', component: 'PVPPeakDuelTaskView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE })    
    .add({ id: 'PVPPeakDuelChoseEnemyView', path: 'prefab/views/view-pvp/pvp-peakduel/PVPPeakDuelChoseEnemyView', component: 'PVPPeakDuelChoseEnemyView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE })    
    .add({ id: 'PVPPeakDuelChangeTeamView', path: 'prefab/views/view-pvp/pvp-peakduel/PVPPeakDuelChangeTeamView', component: 'PVPPeakDuelChangeTeamView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})    
    .add({ id: 'PVPPeakDuelChangeTeamView', path: 'prefab/views/view-pvp/pvp-peakduel/PVPPeakDuelChangeTeamView', component: 'PVPPeakDuelChangeTeamView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE })    
    .add({ id: 'PVPPeakDuelOverView', path: 'prefab/views/view-pvp/pvp-peakduel/PVPPeakDuelOverView', component: 'PVPPeakDuelOverView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE })  
	.add({ id: 'PVPPeakDuelRecordView', path: 'prefab/views/view-pvp/pvp-peakduel/PVPPeakDuelRecordView', component: 'PVPPeakDuelRecordView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE })  
    .add({ id: 'PVEYYBookView', path: 'prefab/views/view-pve/pve-yybook/PVEYYBookView', component: 'PVEYYBookView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.FULL_SCREEN_VIEW })
    .add({ id: 'PVEYYBookSelectHeroView', path: 'prefab/views/view-pve/pve-yybook/PVEYYBookSelectHeroView', component: 'PVEYYBookSelectHeroView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})  
    .add({ id: 'ActivityLuxuryGiftView', path: 'prefab/views/view-activity/activity-luxury-gift/ActivityLuxuryGiftView', component: 'ActivityLuxuryGiftView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE})
    .add({ id: 'GuildWarView', path: 'prefab/views/view-guild/guild-war/GuildWarView', component: 'GuildWarView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.FULL_SCREEN_VIEW })
    .add({ id: 'GuildWarBattleView', path: 'prefab/views/view-guild/guild-war/GuildWarBattleView', component: 'GuildWarBattleView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.FULL_SCREEN_VIEW })
    .add({ id: 'GuildWarBuildView', path: 'prefab/views/view-guild/guild-war/GuildWarBuildView', component: 'GuildWarBuildView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.FULL_SCREEN_VIEW })
    .add({ id: 'GuildWarRewardPreview', path: 'prefab/views/view-guild/guild-war/GuildWarRewardPreview', component: 'GuildWarRewardPreview', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE })
    .add({ id: 'GuildWarMemberRankView', path: 'prefab/views/view-guild/guild-war/GuildWarMemberRankView', component: 'GuildWarMemberRankView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE })
    .add({ id: 'GuildWarBattleReportView', path: 'prefab/views/view-guild/guild-war/GuildWarBattleReportView', component: 'GuildWarBattleReportView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE })
    .add({ id: 'GuildWarCampOptView', path: 'prefab/views/view-guild/guild-war/GuildWarCampOptView', component: 'GuildWarCampOptView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE, type: UI_TYPE.NONE })
    
    // Tests && Temps
    .add({ id: 'GMView', path: 'prefab/views/view-other/GMView', component: 'GMView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'DebugSetting', path: 'prefab/views/view-parkour/Debug_Setting', component: 'DebugView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'BattleStatisticView', path: 'prefab/views/view-statistic/BattleStatisticView', component: 'BattleStatisticView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE})
    .add({ id: 'BattleDebugView', path: 'prefab/views/view-statistic/BattleDebugView', component: 'BattleDebugView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE})
    .add({ id: 'ConsoleView', path: 'prefab/views/view-other/ConsoleView', component: 'ConsoleView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE})
    .add({ id: 'SkillTestView', path: 'prefab/views/view-other/SkillTestView', component: 'SkillTestView', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE})

export {
    uiConfig,
    UI_CACHE,
    UI_TYPE,
    UIInfo,
    UI_LOADING,
}
