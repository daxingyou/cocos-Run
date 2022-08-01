
import { configManager } from "../../../common/ConfigManager";
import { cfg } from "../../../config/config";
import { RoleInfo, EffectConst, RoleSkillInfo } from "./SkillUtils";

declare var require: any;
let skillConfig = require('./SkillDisplayConfig');

class SkillDisplayManager {
    private _allSkill : any = {};           // 所有技能列表
    private _buffEffectSkill: any = {};     // buff里面EffectTemplateID的技能列表
    private _effectLoop: any = {};          // 循环效果的id
    private _buffTemplateSkill: any = {};   // buff添加时的
    private _buffHitEffectSkill: any = {};      // 伤害效果的id
    private _skillInfo : any = {};          // 编辑器导出的所有技能的所有信息
    private _frontEffect: any = {};         // 特效前摇
    private _behindEffect: any = {};        // 特效后摇
    private _roleInfo: Map<string, RoleInfo> = new Map<string, RoleInfo>();

    constructor () {
    }

    async init () {
        const deSearilize = function (obj: any) {
            for (let k in obj) {
                if (obj.hasOwnProperty(k) && obj[k]) {
                    let t = obj[k];
                    if (typeof t == 'object') {
                        // 这里直接解构成为 cc.Vec2就行
                        if (t.hasOwnProperty('x') && t.hasOwnProperty('y')) {
                            obj[k] = cc.v3(t.x, t.y);
                        } else {
                            deSearilize(t);
                        }
                    }
                }
            }
        }

        if (skillConfig) {
            this._skillInfo = skillConfig.skillInfo;
            if (skillConfig.roleInfo) {
                for (let k in skillConfig.roleInfo) {
                    if (skillConfig.roleInfo.hasOwnProperty(k) && skillConfig.roleInfo[k]) {
                        this._roleInfo.set(k, skillConfig.roleInfo[k]);
                    }
                }
            }
            deSearilize(this._skillInfo);
        }

        this._parseTemplateId('skill');
        // this._parseTemplateId('buff');
        // this._parseTemplateId('halo');

        // buff effect
        this._parseBuffTemplateId('buff');
        this._parseBuffEffectTemplateId('buff');
        this._parseLoopEffectTemplateId('buff');
        this._parseLoopEffectTemplateId('halo');
        this._parseBuffHitEffectId('buff');
    }

    /**
     * @desc 根据ID查询动效模板。
     *
     * @param {number} effectId 技能EffectId
     * @param {string} [roleName] 角色信息。不同多个角色，对于动效动作有自己的事件偏移信息，比如吕布跟董卓不一样等
     * @returns {RoleSkillInfo}
     * @memberof SkillDisplayManager
     */
    getSkill (effectId: number, roleName?: string) : RoleSkillInfo {
        if (this._allSkill[effectId]) {
            const info: RoleSkillInfo = this._skillInfo[this._allSkill[effectId]];
            if (info) {
                return EffectConst.convertSkillWithRoleInfo(info, this.getRoleInfo(roleName));
            }
        } else {
            const info: RoleSkillInfo = this._skillInfo[effectId];
            if (info) {
                return EffectConst.convertSkillWithRoleInfo(info, this.getRoleInfo(roleName));
            }
        }
        return null;
    }

    getBuffTemplateSkill(itemId: number, roleName?: string) {
        if (this._buffTemplateSkill[itemId]) {
            const info: RoleSkillInfo = this._skillInfo[this._buffTemplateSkill[itemId]];
            if (info) {
                return EffectConst.convertSkillWithRoleInfo(info, this.getRoleInfo(roleName));
            }
        } else {
            const info: RoleSkillInfo = this._skillInfo[itemId];
            if(info) {
                return EffectConst.convertSkillWithRoleInfo(info, this.getRoleInfo(roleName));
            }
        }
        return null;
    }

    getBuffEffectSkill (itemId: number, roleName?: string): RoleSkillInfo {
        if (this._buffEffectSkill[itemId]) {
            const info: RoleSkillInfo = this._skillInfo[this._buffEffectSkill[itemId]];
            if (info) {
                return EffectConst.convertSkillWithRoleInfo(info, this.getRoleInfo(roleName));
            }
        } else {
            const info: RoleSkillInfo = this._skillInfo[itemId];
            if(info) {
                return EffectConst.convertSkillWithRoleInfo(info, this.getRoleInfo(roleName));
            }
        }
        return null;
    }

    getLoopEffectSkill (buffId: number, roleName?: string): RoleSkillInfo {
        if (this._effectLoop[buffId]) {
            const info: RoleSkillInfo = this._skillInfo[this._effectLoop[buffId]];
            if (info) {
                return EffectConst.convertSkillWithRoleInfo(info, this.getRoleInfo(roleName));
            }
        } else {
            const info: RoleSkillInfo = this._skillInfo[buffId];
            if(info) {
                return EffectConst.convertSkillWithRoleInfo(info, this.getRoleInfo(roleName));
            }
        }
        return null;
    }

    getBuffHitEffectSkill(itemId: number, roleName?: string): RoleSkillInfo {
        if (this._buffHitEffectSkill[itemId]) {
            const info: RoleSkillInfo = this._skillInfo[this._buffHitEffectSkill[itemId]];
            if (info) {
                return EffectConst.convertSkillWithRoleInfo(info, this.getRoleInfo(roleName));
            }
        } else {
            const info: RoleSkillInfo = this._skillInfo[itemId];
            if(info) {
                return EffectConst.convertSkillWithRoleInfo(info, this.getRoleInfo(roleName));
            }
        }
        return null;
    }

    getRoleInfo (name: string): RoleInfo {
        if (this._roleInfo.has(name)) {
            return this._roleInfo.get(name);
        }
        return null;
    }

    getBehindEffect(itemId: number, roleName?: string) {
        if (this._behindEffect[itemId]) {
            const info: RoleSkillInfo = this._skillInfo[this._behindEffect[itemId]];
            if (info) {
                return EffectConst.convertSkillWithRoleInfo(info, this.getRoleInfo(roleName));
            }
        }
        return null;
    }

    getFrontEffect(itemId: number, roleName?: string) {
        if (this._frontEffect[itemId]) {
            const info: RoleSkillInfo = this._skillInfo[this._frontEffect[itemId]];
            if (info) {
                return EffectConst.convertSkillWithRoleInfo(info, this.getRoleInfo(roleName));
            }
        }
        return null;
    }

    private _parseTemplateId (cfgName: string) {
        let config = configManager.getConfigs(cfgName);
        for (let k in config) {
            if (config.hasOwnProperty(k)) {
                const cfg: cfg.Skill = config[k];
                if (cfg.TemplateID) {
                    if(cfg.TemplateID.indexOf(';') == -1) {
                        this._allSkill[parseInt(cfg.TemplateID)] = parseInt(cfg.TemplateID);
                    } else {
                        let templateList = cfg.TemplateID.split('|');
                        for(let i = 0; i < templateList.length; ++i) {
                            let temp = templateList[i].split(';');
                            let curTemplateId = Number(temp[1]);
                            this._allSkill[curTemplateId] = curTemplateId;
                        }
                    }
                }
                if(cfg.FrontTemplateID && cfg.FrontTemplateID > 0) {
                    this._frontEffect[k] = cfg.FrontTemplateID;
                }
                if(cfg.BehindTemplateID && cfg.BehindTemplateID > 0) {
                    this._behindEffect[k] = cfg.BehindTemplateID;
                }
            }
        }
    }

    private _parseBuffTemplateId (cfgName: string) {
        let config = configManager.getConfigs(cfgName);
        for (let k in config) {
            if (config.hasOwnProperty(k)) {
                const cfg: cfg.SkillBuff = config[k];
                if (cfg.TemplateID && cfg.TemplateID > 0) {
                    this._buffEffectSkill[k] = cfg.TemplateID;
                }
            }
        }
    }

    private _parseBuffEffectTemplateId (cfgName: string) {
        let config = configManager.getConfigs(cfgName);
        for (let k in config) {
            if (config.hasOwnProperty(k)) {
                const cfg = config[k];
                if (cfg.EffectTemplateID && cfg.EffectTemplateID > 0) {
                    this._buffEffectSkill[k] = parseInt(cfg.EffectTemplateID);
                }
            }
        }
    }

    private _parseLoopEffectTemplateId (cfgName: string) {
        let config = configManager.getConfigs(cfgName);
        for (let k in config) {
            if (config.hasOwnProperty(k)) {
                const cfg = config[k];
                if (cfg.LoopTemplateId && cfg.LoopTemplateId > 0) {
                    this._effectLoop[k] = parseInt(cfg.LoopTemplateId);
                }
            }
        }
    }

    private _parseBuffHitEffectId(cfgName: string) {
        let config = configManager.getConfigs(cfgName);
        for (let k in config) {
            if (config.hasOwnProperty(k)) {
                const cfg = config[k];
                if (cfg.HitEffectID && cfg.HitEffectID > 0) {
                    this._buffHitEffectSkill[k] = parseInt(cfg.HitEffectID);
                }
            }
        }
    }
}

let skillDisplayManager = new SkillDisplayManager();

export default skillDisplayManager;