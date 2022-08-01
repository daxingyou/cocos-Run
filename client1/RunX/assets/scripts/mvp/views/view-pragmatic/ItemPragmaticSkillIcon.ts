import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { audioManager, SFX_TYPE } from "../../../common/AudioManager";
import { configManager } from "../../../common/ConfigManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { pragmaticData } from "../../models/PragmaticData";
import { userData } from "../../models/UserData";
import ItemPragmaticSkillLine from "./ItemPragmaticSkillLine";

const {ccclass, property} = cc._decorator;

export enum SKILL_STATE {
    LOCK,
    CAN_ADD,
    USER_LV_NOTENOUTH,
    SKILL_LV_MAX
}

interface Skill_State {
    stateType: SKILL_STATE,
    canAddLevel: number
}

@ccclass
export default class ItemPragmaticSkillIcon extends cc.Component {
    @property(cc.Sprite)            skillIcon: cc.Sprite = null;
    @property(cc.Label)             lvLB: cc.Label = null;
    @property(cc.Node)              selectedNode: cc.Node = null;
    @property(cc.Node)              isLimit: cc.Node = null;
    @property(cc.Node)              wailNode: cc.Node = null;
    @property(cc.Node)              linesParent: cc.Node = null;
    @property(cc.Prefab)            itemLinePfb: cc.Prefab = null;

    private _info: cfg.LeadSkillList = null;
    private _row: number = 0;
    private _getMapItemCallBack: Function = null;
    private _clickHandle: Function = null;
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    onInit(info: cfg.LeadSkillList, row: number, getMapItemCallBack: Function, clickHandle: Function) {
        this._info = info;
        this._row = row;
        this._getMapItemCallBack = getMapItemCallBack;
        this._clickHandle = clickHandle;
        this.switchActivity(true);
        this._initView();
        this.refreshView();
        this.refreshSelect(0);
    }

    deInit() {
        this._spriteLoader.release();
        let children = [...this.linesParent.children];
        children.forEach(_line => {
            _line.removeFromParent();
            _line.destroy();
        });
    }

    get leadSkillList() {
        return this._info;
    }
    
    get row() {
        return this._row;
    }

    get lineStartPos() {
        return cc.v2(this.node.x, this.node.y - this.node.height / 2);
    }

    get lineEndPos() {
        return cc.v2(this.node.x, this.node.y + this.node.height / 2);
    }

    get skillLevel() {
        return pragmaticData.skills[this._info.LeadSkillListGroupId] || 0;
    }

    get skillState() {
        let skillState = this._getSkillState();
        return skillState;
    }

    private _initView () {
        let leadSkillLevels = this._getLeadSkillLevels();
        // 检查前置技能，创建一次线
        if(leadSkillLevels.length > 0 && leadSkillLevels[0].LeadSkillLevelNeed) {
            let needSkillList = utils.parseStingList(leadSkillLevels[0].LeadSkillLevelNeed);
            for(const k in needSkillList) {
                let needSkill = needSkillList[k];
                this._checkHasNeedSkills(parseInt(needSkill[0]), parseInt(needSkill[1]));
            }
        }
    }

    refreshView() {
        let leadSkillLevels = this._getLeadSkillLevels();
        // 说明需要前置
        if(leadSkillLevels.length > 0 && leadSkillLevels[0].LeadSkillLevelNeed) {
            let needSkillList = utils.parseStingList(leadSkillLevels[0].LeadSkillLevelNeed);
            for(const k in needSkillList) {
                let needSkill = needSkillList[k];
                this._refreshLines(parseInt(needSkill[0]), parseInt(needSkill[1]));
            }
        }
        this.refreshLevelLB();
        this.refreshCanAddLevel();
        this._refreshIcon();
    }
    /**
     * 是否需要前置 需要则创建线
     * @param leadSkillListGroupId 
     * @param leadSkillLevel 
     */
    private _checkHasNeedSkills(leadSkillListGroupId: number, leadSkillLevel: number) {
        let preItemCmp = this._getMapItem(leadSkillListGroupId);
        if(preItemCmp) {
            let startPos = preItemCmp.lineStartPos;
            let endPos = this.lineEndPos;
            let toGroupID: number = this._info.LeadSkillListGroupId;
            preItemCmp._createLines(startPos, endPos, this._checkSkillUnlockedByGroupId(leadSkillListGroupId, leadSkillLevel), toGroupID);
        }
    }

    refreshLevelLB() {
        this.lvLB.string = `LV${this.skillLevel}`;
    }

    refreshSelect(groupId: number) {
        this.selectedNode.opacity = groupId == this._info.LeadSkillListGroupId ? 255 : 0;
    }

    refreshCanAddLevel() {
        this.isLimit.opacity = 0;
        this.wailNode.opacity = 0;
        let skillState = this._getSkillState();
        switch(skillState.stateType) {
            case SKILL_STATE.LOCK: {
                this.isLimit.opacity = 255;
                // this.isLimit.color = cc.Color.BLACK;
                this.wailNode.opacity = 0;
                break;
            }
            case SKILL_STATE.SKILL_LV_MAX: {
                this.lvLB.string = `精通`;
                this.wailNode.opacity = 0;
                break;
            }
            case SKILL_STATE.USER_LV_NOTENOUTH: {
                // 满足过前置
                if(this.skillLevel > 0) {
                    this.isLimit.opacity = 0;
                    // this.isLimit.color = cc.Color.RED;
                    this.wailNode.opacity = 255;
                } else {
                    this.isLimit.opacity = 255;
                    // this.isLimit.color = cc.Color.BLACK;
                    this.wailNode.opacity = 0;
                }
                break;
            }
        }
    }

    private _refreshIcon() {
        // let firstLeadSKillLevel: cfg.LeadSkillLevel  = configUtils.getLeadSkillLevelConfigByLevel(this._info.LeadSkillListGroupId, 1);
        // let curLeadSkillLevel: cfg.LeadSkillLevel = this.skillLevel > 0 ? configUtils.getLeadSkillLevelConfigByLevel(this._info.LeadSkillListGroupId, this.skillLevel)
        //     : firstLeadSKillLevel;

        // if(!curLeadSkillLevel) return;
        // let skillId: number = curLeadSkillLevel.LeadSkillLevelSkillId || firstLeadSKillLevel.LeadSkillLevelSkillId;
        // let skillCfg: cfg.Skill = configUtils.getSkillConfig(skillId);
        if(this._info.LeadSkillListIcon) {
            this._spriteLoader.changeSpriteP(this.skillIcon, resPathUtils.getSkillIconUrl(this._info.LeadSkillListIcon)).catch(() => {
                this._spriteLoader.deleteSprite(this.skillIcon);
            });
        } else {
            this._spriteLoader.deleteSprite(this.skillIcon);
        }
    }

    switchActivity(isShow: boolean) {
        this.node.children[1].opacity = isShow ? 255 : 0;
    }

    // 该方法是在子技能中找到对应的父技能组件再调用，所以调用对象是父技能
    private _createLines(startPos: cc.Vec2, endPos: cc.Vec2, isUnlocked: boolean, toGroupID: number) {
        let itemLine: cc.Node = cc.instantiate(this.itemLinePfb);
        this.linesParent.addChild(itemLine);
        let cmp = itemLine.getComponent(ItemPragmaticSkillLine);
        cmp.onInit(startPos, endPos, isUnlocked);
        cmp.setTag(this._info.LeadSkillListGroupId, toGroupID);
    }

    private _refreshLines(needGroupID: number, needLv: number) {
        let self = this;

        // 父技能中可以点亮的线刷新
        let isUnlock = this._checkSkillUnlockedByGroupId(needGroupID, needLv)        

        let preItemCmp = this._getMapItem(needGroupID);
        let comp: ItemPragmaticSkillLine = null;
        preItemCmp.linesParent.children.forEach(_c => {
            comp = _c.getComponent(ItemPragmaticSkillLine);
            if (comp.isTagLine(needGroupID, self._info.LeadSkillListGroupId)) {
                comp.refreshLinesState(isUnlock);
            }
        });
    }

    private _getMapItem(leadSkillListGroupId: number): ItemPragmaticSkillIcon {
        if(this._getMapItemCallBack) {
            return this._getMapItemCallBack(leadSkillListGroupId);
        }
        return null;
    }

    private _getLeadSkillLevels(): cfg.LeadSkillLevel[] {
        let leadSkillLevels: cfg.LeadSkillLevel[] = [];
        let leadSkillLevelcfgs = configManager.getConfigs("leadSkillLevel");
        if(!leadSkillLevelcfgs) return leadSkillLevels;

        for(const k in leadSkillLevelcfgs) {
            let leadSkillLevel: cfg.LeadSkillLevel = leadSkillLevelcfgs[k];
            if(leadSkillLevel.LeadSkillLevelGroup == this._info.LeadSkillListGroupId) {
                leadSkillLevels.push(leadSkillLevel);
            }
        }
        return leadSkillLevels;
    }

    private _getSkillState(): Skill_State {
        let skillState: Skill_State = { stateType: SKILL_STATE.CAN_ADD, canAddLevel: 0};
        let skillLevel =  this.skillLevel;
        let nextSkillLevel: cfg.LeadSkillLevel = configUtils.getLeadSkillLevelConfigByLevel(this._info.LeadSkillListGroupId, skillLevel > 0 ? (skillLevel + 1) : 1);
        if(!nextSkillLevel) {
            skillState.stateType = SKILL_STATE.SKILL_LV_MAX;
            return skillState;
        }
        if(userData.lv < nextSkillLevel.LeadSkillStary) {
            skillState.stateType = SKILL_STATE.USER_LV_NOTENOUTH;
            return skillState;
        }
        let needSkills = nextSkillLevel.LeadSkillLevelNeed;
        if(!!needSkills) {
            let needSkillList = utils.parseStingList(needSkills);
            for(let i = 0; i < needSkillList.length; ++i) {
                let groupId: number = Number(needSkillList[i][0]);
                let level: number = Number(needSkillList[i][1]);
                if(!pragmaticData.skills[groupId] || pragmaticData.skills[groupId] < level) {
                    skillState.stateType = SKILL_STATE.LOCK;
                    return skillState;
                }
            } 
        }
        skillState.stateType = SKILL_STATE.CAN_ADD;
        skillState.canAddLevel = this._getAddLevel();
        return skillState;
    }

    private _checkSkillUnlockedByGroupId(groupId: number, unLockLv: number) {
        let curLevel: number = pragmaticData.skills[groupId] || 0;
        return curLevel >= unLockLv;
    }

    getSkillCfgByLevel(level: number) {
        let leadSkillLevels = this._getLeadSkillLevels();
        let leadSkillLevel: cfg.LeadSkillLevel = null;
        leadSkillLevels.forEach(_l => {
            if(!leadSkillLevel && _l.LeadSkillLevelSkillLevel == level) {
                leadSkillLevel = _l;
            }
        })
        return leadSkillLevel;
    }

    private _getAddLevel() {
        let addLevel: number = 0;
        let leadSkillLevels = this._getLeadSkillLevels();
        return leadSkillLevels.length;
        // for(let i = this.skillLevel; i < leadSkillLevels.length; ++i) {
        //     let leadSkillLevel = leadSkillLevels[i];
        //     if(leadSkillLevel && userData.lv >= Number(leadSkillLevel.LeadSkillStary)) {
        //         ++addLevel;
        //     }
        // }
        // return addLevel;
    }

    onClickItem() {
        if(this._clickHandle) {
            this._clickHandle(this);
            audioManager.playSfx(SFX_TYPE.BUTTON_CLICK);
        }
    }
}
