import { configManager } from "../../../../common/ConfigManager";
import { RoleSkillInfo, CONST_STATE, RoleInfo, EffectConst } from "./CardSkill";

declare var require: any;
let cardSkillConfig = require('./SkillDisplayConfig');

class CardSkillManager {
    private _cardSkill : any = {};
    private _skillInfo : any = {};
    private _roleInfo: Map<string, RoleInfo> = new Map<string, RoleInfo>();
    
    constructor () {
    }

    initialize () {
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

        if (cardSkillConfig) {
            this._skillInfo = cardSkillConfig.skillInfo;
            if (cardSkillConfig.roleInfo) {
                for (let k in cardSkillConfig.roleInfo) {
                    if (cardSkillConfig.roleInfo.hasOwnProperty(k) && cardSkillConfig.roleInfo[k]) {
                        this._roleInfo.set(k, cardSkillConfig.roleInfo[k]);
                    }
                }
            }
            deSearilize(this._skillInfo);
        }

        this._parseTemplateId('cards');
        this._parseTemplateId('kit');
        this._parseTemplateId('monsterCards');
        this._parseTemplateId('buff');

        this._cardSkill[CONST_STATE.BLOCK] = 201001;
    }

    /**
     * @desc 根据ID查询动效模板。
     *
     * @param {number} cardId 卡牌ID、或者锦囊ID、怪物卡牌ID等
     * @param {string} [roleName] 角色信息。不同多个角色，对于动效动作有自己的事件偏移信息，比如吕布跟董卓不一样等
     * @returns {RoleSkillInfo}
     * @memberof CardSkillManager
     */
    getCardSkill(cardId: number, roleName?: string) : RoleSkillInfo {
        if (this._cardSkill[cardId]) {
            const info: RoleSkillInfo = this._skillInfo[this._cardSkill[cardId]];
            if (info) {
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

    private _parseTemplateId (cfgName: string) {
        let config = configManager.getConfigs(cfgName);
        for (let k in config) {
            if (config.hasOwnProperty(k)) {
                const cfg = config[k];
                if (cfg.TemplateID && cfg.TemplateID.length > 0) {
                    this._cardSkill[k] = parseInt(cfg.TemplateID);
                }
            }
        }
    }
}

let cardSkillManager = new CardSkillManager();

export default cardSkillManager;