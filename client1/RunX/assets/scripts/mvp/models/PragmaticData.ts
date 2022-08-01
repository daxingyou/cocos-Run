import { CustomItemId } from "../../app/AppConst";
import { utils } from "../../app/AppUtils";
import { configCache } from "../../common/ConfigCache";
import { configManager } from "../../common/ConfigManager";
import { cfg } from "../../config/config";
import { data } from "../../network/lib/protocol";
import { bagData } from "./BagData";
import BaseModel from "./BaseModel";

class PragmaticData extends BaseModel {
    private _pragmaticSkills: {[k: number]: number} = {};
    private _pragmaticSkillPoint: number = 0;               // 可用点
    private _leadGraspData: data.ILeadGraspData = null;
    private _leadGraspProp : {[key: string] : Map<number, number>} = null; //悟道属性加成

    init() {
        this._pragmaticSkills = {};
        this._pragmaticSkillPoint = 0;
        this._leadGraspProp = {};
    }

    deInit() {
        this._pragmaticSkills = {};
        this._leadGraspData = null;
        this._pragmaticSkillPoint = 0;
        this._leadGraspProp = {};
    }

    get skills() {
        return this._pragmaticSkills;
    }

    get skillPoint() {
        return this._pragmaticSkillPoint;
    }

    initSkills(svrData: data.ILeadData) {
        this.changePragmaticSkills(svrData.LeadSkillData.LevelMap);
        this._leadGraspData = svrData.LeadGraspData;
        this._initLeadGraspProp();
        setTimeout(() => {
            this.updateBagSkillPoint();
        }, 60);
    }

    // 初始化悟道属性加成
    private _initLeadGraspProp() {
        if(!this._leadGraspData || !this._leadGraspData.LevelMap) return;
        let levelMap = this._leadGraspData.LevelMap;
        for(let k in levelMap) {
            if(!levelMap.hasOwnProperty(k)) continue;
            let leadGrasp = levelMap[k];
            if(!leadGrasp || !leadGrasp.Level) continue;
            let groupID = k;
            let level = leadGrasp.Level;
            let propMap: Map<number, number> = null;
            let wudaoCfgs = configCache.getWuDaoCfgsByTeamID(parseInt(groupID))
            for(let i = 0; i < level; ++i) {
                let cfg: cfg.LeadEnlightenment = configManager.getConfigByKey('LeadEnlightenment', wudaoCfgs.LeadEnlightenmentIDs[i]);;
                utils.parseStingList(cfg.LeadEnlightenmentLevelProperty, (arr: string[]) => {
                    if(!arr || arr.length == 0) return;
                    propMap = propMap || new Map();
                    let propID = parseInt(arr[0]), propValue = parseInt(arr[1]);
                    let oldPropV = propMap.get(propID) || 0;
                    propMap.set(propID, oldPropV + propValue);
                });
            }
            propMap && (this._leadGraspProp[groupID] = propMap);
        }
    }

    changePragmaticSkills(changeSkillList: {[k: number]: number}) {
        if(utils.getObjLength(changeSkillList) == 0) {
            this._pragmaticSkills = {};
        } else {
            for(const k in changeSkillList) {
                let skillLevel = changeSkillList[k];
                this._pragmaticSkills[k] = skillLevel;
            }
        }
        this.updateBagSkillPoint();
    }

    getWuDaoLv(groupID: string): data.ILeadGraspLevel {
        if(this._leadGraspData && this._leadGraspData.LevelMap && this._leadGraspData.LevelMap[groupID]) {
            return this._leadGraspData.LevelMap[groupID];
        }

        return null;
    }

    updateWuDaoLv(groupID: string, cnt: number, lv: number){
        this._leadGraspData = this._leadGraspData || {LevelMap: {}};
        let lvMap = this._leadGraspData.LevelMap;
        let lvData: data.ILeadGraspLevel = null;
        lvMap.hasOwnProperty(groupID) && (lvData = lvMap[groupID]);

        let lastLv = 0;
        if(lvData) {
            lastLv = lvData.Level || 0;
            lvData.Level = lv;
            lvData.Count = cnt;
            this._updateLeadGraspProp(groupID, lastLv, lv);
            return;
        }

        lvData = {Level: lv, Count: cnt};
        lvMap[groupID] = lvData;
        this._updateLeadGraspProp(groupID, lastLv, lv);
    }

    getWuDaoProps(groupID: string): Map<number, number> {
        if(!this._leadGraspProp || !this._leadGraspProp.hasOwnProperty(groupID)) return null;
        return this._leadGraspProp[groupID];
    }

    // 更新悟道等级属性加成
    private _updateLeadGraspProp(groupID: string, lastLv: number, curLv: number) {
        if(lastLv >= curLv) return;
        let wuDaoCfgs = configCache.getWuDaoCfgsByTeamID(parseInt(groupID));
        let propMap: Map<number, number> = this._leadGraspProp[groupID];
        for(let i = lastLv; i < curLv; ++i) {
            let cfg: cfg.LeadEnlightenment = configManager.getConfigByKey('LeadEnlightenment', wuDaoCfgs.LeadEnlightenmentIDs[i]);
            utils.parseStingList(cfg.LeadEnlightenmentLevelProperty, (arr: string[]) => {
              if(!arr || arr.length == 0) return;
              if(!propMap) {
                propMap = new Map();
                this._leadGraspProp[groupID] = propMap;
              }
              let propID = parseInt(arr[0]), propValue = parseInt(arr[1]);
              let oldPropV = propMap.get(propID) || 0;
              propMap.set(propID, oldPropV + propValue);
          });
        }
    }

    updateBagSkillPoint() {
        this._pragmaticSkillPoint = bagData.getItemCountByID(CustomItemId.PRAGMATIC_SKILL_POINT);
    }

    resetSkills() {
        this._pragmaticSkills = {};
        this.updateBagSkillPoint();
    }
}

let pragmaticData = new PragmaticData();
export {
    pragmaticData
}
