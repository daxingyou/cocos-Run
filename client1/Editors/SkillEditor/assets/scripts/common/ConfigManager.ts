/*
 * @Author:
 * @Date: 2021-03-16 13:57:19
 * @LastEditTime: 2021-03-16 14:20:40
 * @Description: 配置管理类
 */

import { utils } from "../app/AppUtils";

function toMap(arr: any[], keyname: string) {
    let result = {}
    for (let i = 0; i < arr.length; ++i) {
        // @ts-ignore
        result[arr[i][keyname]] = arr[i];
    }
    return result;
}

let CONFIGS = [
    {
        name: "skill", path: "ConfigSkill",
        custom: function (arr: any[]) { return toMap(arr, "SkillId"); }
    },
    {
        name: "monster", path: "ConfigMonster",
        custom: function (arr: any[]) { return toMap(arr, "MonsterId"); }
    },
    {
        name: "hero", path: "ConfigHeroProperty",
        custom: function (arr: any[]) { return toMap(arr, "HeroId"); }
    },
    {
        name: "heroAttribute", path: "ConfigHeroSpecialAttribute",
        custom: function (arr: any[]) { return toMap(arr, "HeroId"); }
    },
    {
        name: "effect", path: "ConfigSkilleffect",
        custom: function (arr: any[]) { return toMap(arr, "SkillEffectId"); }
    },
    {
        name: "buff", path: "ConfigSkillbuff",
        custom: function (arr: any[]) { return toMap(arr, "BuffId"); }
    },
    {
        name: "hall", path: "ConfigFunctionConfig",
        custom: function (arr: any[]) { return toMap(arr, "FunctionId"); }
    },
    {
        name: "chapter", path: "ConfigAdventureChapter",
        custom: function (arr: any[]) { return toMap(arr, "ChapterId"); }
    },
    {
        name: "lesson", path: "ConfigAdventureLesson",
        // custom: function (arr: any[]) { return toMap(arr, "LessonId"); }
    },
    {
        name: "item", path: "ConfigItem",
        custom: function (arr: any[]) { return toMap(arr, "ItemId"); }
    },
    {
        name: 'heroBasic', path: "ConfigHeroBasic",
        custom: function (arr: any[]) { return toMap(arr, 'HeroBasicId'); }
    },
    {
        name: 'monsterGroup', path: "ConfigMonstergroup",
        custom: function (arr: any[]) { return toMap(arr, 'MonsterGroupId'); }
    },
    {
        name: 'heroFriend', path: "ConfigHeroFriend",
        custom: function (arr: any[]) { return toMap(arr, 'HeroFriendId'); }
    },
    {
        name: 'heroGift', path: "ConfigHeroGift",
        custom: function (arr: any[]) { return toMap(arr, 'HeroGiftId'); }
    },
    {
        name: 'levelExp', path: "ConfigLevelExp",
        custom: function (arr: any[]) { return toMap(arr, 'LevelExpId'); }
    },
    {
        name: 'levelStar', path: "ConfigLevelStar",
        custom: function (arr: any[]) { return toMap(arr, 'LevelStarId'); }
    },
    {
        name: 'equip', path: "ConfigEquip",
        custom: function (arr: any[]) { return toMap(arr, 'EquipId'); }
    },
    {
        name: 'equipCastSoul', path: "ConfigEquipCastSoul",
        custom: function (arr: any[]) { return toMap(arr, 'EquipCastSoulId'); }
    },
    {
        name: 'halo', path: "ConfigSkillHalo",
        custom: function (arr: any[]) { return toMap(arr, 'SkillHaloId'); }
    },
    {
        name: 'heroProperty', path: "ConfigHeroProperty",
        custom: function (arr: any[]) { return toMap(arr, 'HeroId'); }
    },
    {
        name: 'headFrame', path: "ConfigHeadFrame",
        custom: function (arr: any[]) { return toMap(arr, 'HeadFrameId'); }
    },
    {
        name: 'equipGreen', path: "ConfigEquipGreen",
        custom: function (arr: any[]) { return toMap(arr, 'Id'); }
    },
    {
        name: 'equipYellow', path: "ConfigEquipYellow",
        custom: function (arr: any[]) { return toMap(arr, 'Id'); }
    },
    {
        name: 'model', path: "ConfigModel",
        custom: function (arr: any[]) { return toMap(arr, 'ModelId'); }
    }
];

declare var require: any;

export class ConfigManager {
    private static _instance: ConfigManager = null;
    private _configs: object = null;
    private __DFKCache__: object = null;

    private constructor() {
        this._configs = {};
        this.__DFKCache__ = {};
    }

    static getInstance(): ConfigManager {
        if (!this._instance) {
            this._instance = new ConfigManager();
        }
        return this._instance;
    }

    init(): void;
    init(resource: any[]): void;
    init() {
        let resource = arguments[0];
        // if (!resource) {
        // 直接从ts文件里加载配置
        CONFIGS.forEach(info => {
            let cfgTs = utils.sRequire(info.path, `../config/`);
            //@ts-ignore
            this._configs[info.name] = info.custom ? info.custom(cfgTs) : cfgTs;
        }, this);

        // } else {
        //     // 从json文件里加载配置
        //     for (let i = 0; i < resource.length; i++) {
        //         let config = resource[i];
        //         this._configs[config.name] = config.json;
        //     }
        // }
    }

    getConfigs(configName: string): any {
        //@ts-ignore
        return this._configs[configName] || null;
    }
    getConfigByKey(configName: string, key: string | number): any {
        //@ts-ignore
        if (!!this._configs[configName]) {
            if (key != undefined && key != null) {
                //@ts-ignore
                return this._configs[configName][key];
            }
        }
        return null;
    }

    getConfigByKV(configName: string, mkey: string | number, mkv: string | number): any[] {
        let temp: any[] = null;
        let serchKey: string = `${configName}_${mkey}_${mkv}`;
        //@ts-ignore
        temp = this.__DFKCache__[serchKey];
        if (temp) {
            return temp;
        }

        temp = [];
        let config = this.getConfigs(configName);
        if (!config) return null;

        for (const k in config) {
            let item = config[k];
            if (item && typeof item == 'object') {
                let kv = item[`${mkey}`];
                if (kv == mkv) {
                    temp.push(item);
                }
            }
        }

        // @ts-ignore
        this.__DFKCache__[serchKey] = temp;
        return temp;
    }

    getConfigNameByTableName(tableName: string): string {
        let name: string = null;
        CONFIGS.some(info => {
            if (info.path == tableName) {
                name = info.name;
                return true;
            } else if (tableName == "Property") {
                name = "property";
                return true;
            } else {
                return false;
            }
        });
        return name;
    }

    getConfigByManyKV(configName: string, mkey1: string | number, mkv1: number,
        mkey2?: string, mkv2?: number,
        mkey3?: string, mkv3?: number,
        mkey4?: string, mkv4?: number,
        mkey5?: string, mkv5?: number): any[] {
        let temp = [];
        let config = this.getConfigs(configName);
        if (!config) return null;

        for (const k in config) {
            let item = config[k];
            if (item && typeof item == 'object') {
                // 这里注意，如果配置的值是0，则默认是无限制！
                // 比如职业配置了0，则说明职业1 2 3 4都符合
                let judge1 = (mkey1 != null) ? (item[`${mkey1}`] == 0 || item[`${mkey1}`] == mkv1) : true;
                let judge2 = (mkey2 != null) ? (item[`${mkey2}`] == 0 || item[`${mkey2}`] == mkv2) : true;
                let judge3 = (mkey3 != null) ? (item[`${mkey3}`] == 0 || item[`${mkey3}`] == mkv3) : true;
                let judge4 = (mkey4 != null) ? (item[`${mkey4}`] == 0 || item[`${mkey4}`] == mkv4) : true;
                let judge5 = (mkey5 != null) ? (item[`${mkey5}`] == 0 || item[`${mkey5}`] == mkv5) : true;

                if (judge1 && judge2 && judge3 && judge4 && judge5) {
                    temp.push(item);
                }
            }
        }

        return temp;
    }

    getMapEditConfig(configName: string) {
        let cfgTs = utils.sRequire(configName, `../config/mapEditConfig/`);
        if (cfgTs) {
            return cfgTs;
        }
        return null;
    }

    getAnyConfig(configName: string) {
        let cfgTs = utils.sRequire(configName, `../config/`);
        if (cfgTs) {
            return cfgTs;
        }
        return null;
    }
}

export let configManager = ConfigManager.getInstance();

