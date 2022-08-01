
import { SCENE_NAME, ResConfig } from "../app/AppConst";

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
    .add({ id: 'LoginScene', path: 'prefab/scene/LoginScene', component: 'LoginScene', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.NONE })
    .add({ id: 'MainScene', path: 'prefab/scene/MainScene', component: 'MainScene', cacheMode: UI_CACHE.NODE, loading: UI_LOADING.LOADING })
    .add({ id: 'BattleScene', path: 'prefab/scene/BattleScene', component: 'BattleScene', cacheMode: UI_CACHE.PREFAB, loading: UI_LOADING.GAME_LOADING })
    .add({ id: SCENE_NAME.RUN_COOL, path: ResConfig.runCoolScenePath, component: 'ParkourScene', cacheMode: UI_CACHE.NONE, loading: UI_LOADING.LOADING })  //跑酷场景

    // Views
    .add({ id: 'LevelMapView', path: 'prefab/views/view-levelmap/LevelMapView', component: 'LevelMapView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'ChannelView', path: 'prefab/views/view-login/ChannelView', component: 'ChannelView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'BattlePrepareView', path: 'prefab/views/view-battle/BattlePrepareView', component: 'BattlePrepareView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'MessageBoxView', path: 'prefab/views/MessageBoxView', component: 'MessageBoxView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'NoticeView', path: 'prefab/views/view-login/NoticeView', component: 'NoticeView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'InfoView', path: 'prefab/views/view-info/InfoView', component: 'InfoView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'HeadView', path: 'prefab/views/view-info/HeadView', component: 'HeadView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'ExchangeView', path: 'prefab/views/view-info/ExchangeView', component: 'ExchangeView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'HeroView', path: 'prefab/views/view-hero/HeroView', component: 'HeroView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'HeroMorePropertyView', path: 'prefab/views/view-hero/HeroMorePropertyView', component: 'HeroMorePropertyView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'EquipPropertyView', path: 'prefab/views/view-hero/EquipPropertyView', component: 'EquipPropertyView', cacheMode: UI_CACHE.NONE })

    .add({ id: 'EditorSkillEventView', path: 'prefab/views/view-editor/EditorSkillEventView', component: 'EditorSkillEventView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'EditorSkillGroupView', path: 'prefab/views/view-editor/EditorSkillGroupView', component: 'EditorSkillGroupView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'EditorImportView', path: 'prefab/views/view-editor/EditorImportView', component: 'EditorImportView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'EditorSkillListView', path: 'prefab/views/view-editor/EditorSkillListView', component: 'EditorSkillListView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'EditorSkillRoleInfoView', path: 'prefab/views/view-editor/EditorSkillRoleInfoView', component: 'EditorSkillRoleInfoView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'EditorDescView', path: 'prefab/views/view-editor/EditorDescView', component: 'EditorDescView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'EditorShakeView', path: 'prefab/views/view-editor/EditorShakeView', component: 'EditorShakeView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'EditorWholeShadowView', path: 'prefab/views/view-editor/EditorWholeShadowView', component: 'EditorWholeShadowView', cacheMode: UI_CACHE.NONE })
    .add({ id: 'EditorUISfxView', path: 'prefab/views/view-editor/EditorUISfxView', component: 'EditorUISfxView', cacheMode: UI_CACHE.NONE })
export {
    uiConfig,
    UI_CACHE,
    UIInfo,
    UI_LOADING,
}