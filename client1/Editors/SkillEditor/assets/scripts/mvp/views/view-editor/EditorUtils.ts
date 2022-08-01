import { configManager } from "../../../common/ConfigManager";
import { DefaultRole } from "./models/EditorConst";
import { EffectConst, SHAKE_REDUCT_TYPE } from "./view-actor/CardSkill";

enum BindType {
    SKILL               = 'skill',
    BUFF                = 'buff',
}

class EditorUtils {
    public static KEY_TEMP_DATA     = 'SKILL_TEMP_DATA';
    public static KEY_TEMP_CARD     = 'SKILL_TEMP_CARD';
    public static KEY_TEMP_SHAKE    = 'SKILL_TEMP_SHAKE';
    public static KEY_SKILL_LIST    = 'SKILL_LIST';
    public static KEY_CARD_SKILL    = 'SKILL_CARD';

    public static EVENT_PLAY_CLICKED    = 'play-button';
    public static EVENT_TIMELINE_CHANGED    = 'timeline-changed';
    public static EVENT_TIMELINE_PLAY       = 'timeline-play';
    public static EVENT_TIMELINE_PAUSE      = 'timeline-pause';


    public static EDIT_EDIT     = 'edit';
    public static EDIT_COPY     = 'copy';
    public static EDIT_DELETE   = 'delete';

    public static CARD_SELECT   = 'select-card';

    public static BINDING       = 'binding';
    public static BIND          = 'bind';

    public static CARD_CLICK_SELECT = 'card-select';
    public static CARD_CLICK_REMOVE = 'card-remove';

    public static GfxSkeleton = [
        'state-gfx',
        'fx_sj_1',
        'fx_sj_2',
        'fx_buff',
        'fx_fire',
        'buff_ef',
        'fx_wanquangedang',
        'fx_zhongdu',
        'fx_luolei',
        'fx_lianji',
    ];

    public static RoleSkeleton: Map<string, string> = new Map<string, string>();

    public static GfxCocosAnimation: string[] = [];
    public static GfxCocosPrefab: string[] = [];

    public static SfxSkill: string[] = [];

    public static getItemType(data: any) : string {        
        if (data.SkillId) {
            return BindType.SKILL;
        } else if (data.BuffID) {
            return BindType.BUFF;
        }
        return '';
    }
    
    public static getItemID(data: any) : number {
        return data.CardID || data.KitID || data.BuffID;
    }

    public static showTips (node: cc.Node, info: string) {
    }

    public static deepCopy<Type> (obj: Type): Type {
        const str = JSON.stringify(obj);
        return EditorUtils.deSearilizeFromString(str);
    }

    // 对部分对象进行解构
    public static deSearilizeFromString (str: string) {
        const deSearilize = function (obj: any) {
            for (let k in obj) {
                if (obj.hasOwnProperty(k) && obj[k]) {
                    let t = obj[k];                    
                    if (typeof t == 'object') {
                        if (k === 'gfxInfo' && t.hasOwnProperty('skeleton') && t.hasOwnProperty('type')) {
                            if (t.skeleton.length > 3 && t.type.length > 3) {
                                t.skeleton = EffectConst.toGfxPath(t.skeleton, t.type);
                            }
                        }
                        // 这里直接解构成为 cc.Vec3就行
                        if (t.hasOwnProperty('x') && t.hasOwnProperty('y')) {
                            obj[k] = cc.v3(t.x, t.y);
                        } else {
                            deSearilize(t);
                        }
                    }
    
                    if (k == 'actor') {
                        if (obj[k] == 'actor-monster') {
                            obj[k] = 'actor-target';
                        } else if (obj[k] == 'actor-hero') {
                            obj[k] = 'actor-source';
                        }
                    } else if (k == 'joint') {
                        if (obj[k] == 'joint-hero') {
                            obj[k] = 'joint-source';
                        } else if (obj[k] == 'joint-monster') {
                            obj[k] = 'joint-target';
                        }
                    }
                }
            }
        }

        let objRet: any = {};
        if (str && str.length > 0) {
            let prefix = 'module.exports = ';
            str = str.replace(prefix,"");
            objRet = JSON.parse(str);
            deSearilize(objRet);

            // 如果没有角色信息 就给一个默认的角色信息 容错老数据
            if(objRet.stateCurrSkill && objRet.stateCurrSkill.skillInfo && !objRet.stateCurrSkill.skillInfo.hasOwnProperty('roleInfo')) {
                objRet.stateCurrSkill.skillInfo.roleInfo = {
                    name: DefaultRole,
                    timeOffset: 0
                };
            }
            if(objRet.stateSkillList && objRet.stateSkillList.arrSkillInfo &&  objRet.stateSkillList.arrSkillInfo.length > 0) {
                for(let i = 0; i < objRet.stateSkillList.arrSkillInfo.length; ++i) {
                    let curSkillInfo = objRet.stateSkillList.arrSkillInfo[i];
                    if(!curSkillInfo.hasOwnProperty('roleInfo')) {
                        curSkillInfo.roleInfo = {
                            name: DefaultRole,
                            timeOffset: 0
                        }
                    }
                }
            }
        }
        return objRet;
    }

    public static loadFromStorage(key: string) {
        let str = cc.sys.localStorage.getItem(key);
        return EditorUtils.deSearilizeFromString(str);
    }

    public static getRoleScale (name: string) {
        let spName = "";
        this.RoleSkeleton.forEach( (v, k)=> {
            if (v == name) {
                spName = k;
            }
        })
        let cfg = configManager.getConfigByKV("model", "ModelAttack", spName)[0];
        if (cfg) {
            return cfg.ModelAttackSize/10000;
        }
        return 0.5;
    }

    public static getShakeReductType(reductType: number){
        let desc: string = null;
        Object.keys(SHAKE_REDUCT_TYPE).some(ele => {
            if(SHAKE_REDUCT_TYPE[ele] === reductType){
                desc = ele;
                return true;
            }
            return false;
        });
        return desc;
    }
};

export {
     EditorUtils as default,
     BindType
}