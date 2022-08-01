import { CustomDialogId } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { pragmaticEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { logger } from "../../../common/log/Logger";
import { redDotMgr, RED_DOT_MODULE } from "../../../common/RedDotManager";
import { ItemPragmaticSkillIconPool } from "../../../common/res-manager/NodePool";
import { preloadItemPragmaticSkillIconPool } from "../../../common/res-manager/Preloaders";
import StepWork from "../../../common/step-work/StepWork";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { pragmaticData } from "../../models/PragmaticData";
import { pragmaticDataOpt } from "../../operations/PragmaticDataOpt";
import ItemPragmaticSkillIcon, { SKILL_STATE } from "./ItemPragmaticSkillIcon";
import {scheduleManager} from '../../../common/ScheduleManager';
import {serverTime} from '../../models/ServerTime'
import ItemRedDot from "../view-item/ItemRedDot";
import { userData } from "../../models/UserData";
import WuDaoView from "./WuDaoView";
import CoinNode from "../../template/CoinNode";
import { NumberValueType } from "../../../app/AppEnums";

const {ccclass, property} = cc._decorator;

@ccclass
export default class PragmaticView extends ViewBaseComponent {
    @property(cc.Label)                             userSpCountLB: cc.Label = null;
    @property(cc.Node)                              curPragmaticInfoNode: cc.Node = null;
    @property(cc.Sprite)                            iconSprite: cc.Sprite = null;
    @property(cc.Label)                             nameLB: cc.Label = null;
    @property(cc.Label)                             lvLB: cc.Label = null;
    @property(cc.Label)                             descLB: cc.Label = null;
    @property(cc.RichText)                          needSpLB: cc.RichText = null;
    @property(cc.Label)                             needLvLB: cc.Label = null;
    @property(cc.Node)                              addLevelInfoNode: cc.Node = null;
    @property(cc.Label)                             addLevelLB: cc.Label = null;
    @property(cc.Slider)                            addLevelSlider:cc.Slider = null;
    @property(cc.ScrollView)                        scrollView: cc.ScrollView = null;
    @property(cc.Vec2)                              spacing: cc.Vec2 = null;            // (9, 30)
    @property(cc.Node)                              levels: cc.Node = null;
    @property(cc.Node)                              resetBtn: cc.Node = null;
    @property(ItemRedDot)                           pragmaticRedDot: ItemRedDot = null;
    @property(cc.Node)                              saveBtn: cc.Node = null;

    @property(cc.Node)                              subViewParent: cc.Node = null;
    @property(cc.Node)                              PragmaticNode: cc.Node = null;
    @property(cc.Toggle)                            pragmaticToggle: cc.Toggle = null;
    @property(cc.Toggle)                            wuDaoToggle: cc.Toggle = null;

    private _pragmaticSkillComps: ItemPragmaticSkillIcon[] = [];             // 持有技能节点 方便查找跟释放
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _curSkillGroupId: number = 0;
    private _addLevelMax: number = 0;
    private _addLevel: number = 0;
    private _currSelItem: ItemPragmaticSkillIcon = null;
    private _costSpCount: number = 0;

    private static _isSkillClearable: boolean = true;
    private static _delteTimeOfClear: number = -1;
    private static _CDStartTime: number = -1;
    private static _scheduler: number = -1;
    private static _task: Function = null;

    private _moduleId: number = 0;
    private _curSeleToggle: cc.Toggle = null;
    private _wuDaoView: WuDaoView = null;
    private _coinNode: cc.Node = null;
    private _isPragmaticInited: boolean = false;

    preInit(): Promise<any> {
        this.curPragmaticInfoNode.active = false;
        return new Promise((resolve, reject) => {
            preloadItemPragmaticSkillIconPool().start(() => {
                resolve(true);
            })
        });
    }

    onInit(moduleId: number, pID: number) {
        this._moduleId = moduleId;
        this._currSelItem = null;
        if(typeof pID == 'undefined' || pID == 1) {
            this._curSeleToggle = this.pragmaticToggle;
        }else if(pID == 2) {
            this._curSeleToggle = this.wuDaoToggle;
        }
        this._curSeleToggle.isChecked = true;
        this.doInit();

        let self = this;
        this.addLevelSlider._updateHandlePosition = function () {
            if (!this.handle) { return; }
            let canAddMaxLv =  self._addLevelMax - self._currSelItem.skillLevel;
            let currAddLv = Math.ceil(canAddMaxLv * this.progress);

            let progress = currAddLv / canAddMaxLv;
            var handlelocalPos;
            if (this.direction === cc.Slider.Direction.Horizontal) {
                handlelocalPos = cc.v2(-this.node.width * this.node.anchorX + progress * this.node.width, 0);
            }
            else {
                handlelocalPos = cc.v2(0, -this.node.height * this.node.anchorY + progress * this.node.height);
            }
              var worldSpacePos = this.node.convertToWorldSpaceAR(handlelocalPos);
              this.handle.node.position = this.handle.node.parent.convertToNodeSpaceAR(worldSpacePos);
              cc.find('progressBG', self.addLevelSlider.node).width = self.addLevelSlider.node.width * progress;
        }.bind(this.addLevelSlider);
        this._switchView();
    }

    doInit() {
        this.scrollView.node.on('scrolling', this._onScrolling, this);
        this._coinNode = this._coinNode || guiManager.addCoinNode(this.node, this._moduleId + 1);

        if (PragmaticView._delteTimeOfClear == -1) {
            PragmaticView._delteTimeOfClear = parseFloat(configUtils.getConfigModule('LeadSkillResetCD')) || 0;
        }

        eventCenter.register(pragmaticEvent.CHANGE_LEAD_SKILL_SUC, this, this._recvChangeLeadSkillSuc);
        eventCenter.register(pragmaticEvent.RESET_LEAD_SKILLS_SUC, this, this._recvResetLeadSkillSuc);
    }

    private _refreshRedDot() {
        //this.pragmaticRedDot.setData(RED_DOT_MODULE.PRAGMATIC_TOGGLE);
    }

    onRelease() {
        PragmaticView._task = null;
        //this.pragmaticRedDot.deInit();
        this._currSelItem = null;
        eventCenter.unregisterAll(this);
        this.scrollView.node.targetOff(this);
        this._spriteLoader.release();
        this._releaseMap();
        this.releaseSubView();
        if(this._coinNode) {
            guiManager.removeCoinNode(this.node);
            this._coinNode = null;
        }
        this._isPragmaticInited = false;
        this._wuDaoView && cc.isValid(this._wuDaoView.node) && this._wuDaoView.closeView();
    }

    private _initPragmaticView() {
        if(this._isPragmaticInited) return;
        this._createPragmaticMap();
        this._refreshSkillInfoView();
        this._refreshTopInfoView();
        this._initClearBtn();
        this._isPragmaticInited = true;
        this._refreshRedDot();
    }

    private _createPragmaticMap() {
        let leadSkillList: {[k: string]: cfg.LeadSkillList} = configManager.getConfigs('leadSkillList');
        if(!leadSkillList) {
            logger.error(`PragmaticView createPragmaticMap leadSkillList error`);
            return;
        }
        let curLevel: number = 0;
        let mapRows: number = 0;
        let row: number = 0;
        let col: number = 0;
        this._releaseMap();
        let content: cc.Node = this.scrollView.content;
        for(const k in leadSkillList) {
            let leadSkill = leadSkillList[k];
            if(!leadSkill.LeadSkillListOpenLevel) continue;

            if(curLevel != leadSkill.LeadSkillListOpenLevel) {
                curLevel = leadSkill.LeadSkillListOpenLevel;
                ++mapRows;
            }

        }
        content.setContentSize(content.width, mapRows * (85 + this.spacing.y));
        curLevel = 0;
        for(const k in leadSkillList) {
            let leadSkill = leadSkillList[k];
            if(!leadSkill.LeadSkillListOpenLevel) continue;
            if(curLevel != leadSkill.LeadSkillListOpenLevel) {
                if(curLevel != 0) {
                    ++row;
                }
                curLevel = leadSkill.LeadSkillListOpenLevel;
            }
            col = leadSkill.LeadSkillListPosition - 1;
            const itemPragmaticCmp = ItemPragmaticSkillIconPool.get();
            content.addChild(itemPragmaticCmp.node);
            itemPragmaticCmp.node.active = true;
            itemPragmaticCmp.node.setPosition(col * (60 + this.spacing.x) + 30, -(row * (85 + this.spacing.y) + 60));
            itemPragmaticCmp.onInit(leadSkill, row, (leadSkillListGroupId: number) => {
                return this._getMapItemByLeadSkillList(leadSkillListGroupId);
            }, (comp: ItemPragmaticSkillIcon) => {
                this._currSelItem = comp;
                this._onClickItem(leadSkill);
            });
            this._pragmaticSkillComps.push(itemPragmaticCmp);

        }
        this._refreshLevels(leadSkillList);
    }

    refreshView() {
        this.scrollView.scrollToPercentVertical(0, 0);
        this.scheduleOnce(() => {
            this._refreshMapView();
        });
    }

    private _refreshMapView() {
        for(let i = 0; i < this._pragmaticSkillComps.length; ++i) {
            const itemPragmaticCmp = this._pragmaticSkillComps[i];
            itemPragmaticCmp.refreshView();
        }
        this._onScrolling(this.scrollView);
    }

    private _refreshSkillInfoView() {
        let isActive = this._curSkillGroupId > 0;
        this.curPragmaticInfoNode.active = isActive
        if(!isActive) {
            return;
        }
        let curPragmaticCmp = this._getMapItemByLeadSkillList(this._curSkillGroupId);
        let skillLevel: number = 0;
        if(curPragmaticCmp) {
            let state = curPragmaticCmp.skillState;
            this.addLevelInfoNode.active = state.canAddLevel > 0 ? true : false;
            if(state.canAddLevel > 0) {
                this.needLvLB.string = '';
                this._addLevel = 0;
                this._addLevelMax = state.canAddLevel;
                this.refreshAddLevelView();
                skillLevel = curPragmaticCmp.skillLevel;
            } else {
                this.needSpLB.node.opacity = 0;
                switch(state.stateType) {
                    case SKILL_STATE.SKILL_LV_MAX: {
                        this.needSpLB.node.opacity = 0;
                        this.needLvLB.string = `此技能已经满级`;
                        skillLevel = curPragmaticCmp.skillLevel;
                        break;
                    }
                    case SKILL_STATE.USER_LV_NOTENOUTH: {
                        let nextCfg = curPragmaticCmp.getSkillCfgByLevel(curPragmaticCmp.skillLevel + 1);
                        if(nextCfg) {
                            this.needLvLB.string = `玩家等级达到${nextCfg.LeadSkillStary}后可升级`;
                        }
                        skillLevel = curPragmaticCmp.skillLevel;
                        break;
                    }
                    case SKILL_STATE.LOCK: {
                        this.needLvLB.string = `前置技能未激活`;
                        skillLevel = curPragmaticCmp.skillLevel;
                        break;
                    }
                    default: {
                        this.needLvLB.string = '';
                        skillLevel = curPragmaticCmp.skillLevel;
                        break;
                    }
                }
            }
        }
        this.lvLB.string = skillLevel == 0 ? '未升级' : `${skillLevel}级`;
        this._updateSkillInfo(this._getCurSkillLevel());
    }

    private _updateSkillInfo(skillLv: number){
        let isGray = skillLv == 0;
        let skillLevelCfg: cfg.LeadSkillLevel = this._getLeadSkillLevelCfg(isGray ? skillLv + 1 : skillLv);
        if(!skillLevelCfg) return;
        let leadSkillCfgs: cfg.LeadSkillList[] = configManager.getConfigByKV('leadSkillList', 'LeadSkillListGroupId', skillLevelCfg.LeadSkillLevelGroup);
        let leadSkillCfg: cfg.LeadSkillList= null;
        leadSkillCfgs && leadSkillCfgs.length > 0 && (leadSkillCfg = leadSkillCfgs[0]);
        if(leadSkillCfg && leadSkillCfg.LeadSkillListIcon){
            this._spriteLoader.changeSpriteP(this.iconSprite, resPathUtils.getSkillIconUrl(leadSkillCfg.LeadSkillListIcon)).catch(() => {
                this._spriteLoader.deleteSprite(this.iconSprite);
            });
        }else{
            this._spriteLoader.deleteSprite(this.iconSprite);
        }

        //分两种 1 技能 2 属性
        if(skillLevelCfg.LeadSkillLevelSkillId) {
            // 技能
            let skillCfg: cfg.Skill = configUtils.getSkillConfig(skillLevelCfg.LeadSkillLevelSkillId);
            if(skillCfg) {
                this.nameLB.string = skillCfg.Name;
                this.descLB.string = skillCfg.Illustrate || '暂无介绍';
            } else {
                this.nameLB.string = '';
                this.descLB.string = '';
            }
            this.descLB.node.color = isGray ?  cc.Color.GRAY : cc.color().fromHEX('#6D4835')
            return;
        }

        //技能升级
        if(skillLevelCfg.LeadSkillLevelSkillChangeId) {
            let skillChCfg: cfg.SkillChange = configUtils.getSkillChangeConfig(skillLevelCfg.LeadSkillLevelSkillChangeId);
            if(skillChCfg) {
                this.nameLB.string = skillChCfg.Title;
                this.descLB.string = skillChCfg.Desc || '暂无介绍';
            } else {
                this.nameLB.string = '';
                this.descLB.string = '';
            }
            this.descLB.node.color = isGray ?  cc.Color.GRAY : cc.color().fromHEX('#6D4835')
            return;
        }

        //属性
        this.nameLB.string = '属性强化';
        let leadLevels = this._getLeadSkillLevels();
        let attrMap: Map<number, number> = new Map();
        let attrLv = skillLv || 0;
        attrLv == 0 && (attrLv += 1);
        if(leadLevels && leadLevels.length > 0){
            leadLevels.forEach(ele => {
                if(!ele.LeadSkillLevelAttributeValue) return;
                if(ele.LeadSkillLevelSkillLevel > attrLv) return;
                utils.parseStingList(ele.LeadSkillLevelAttributeValue, (strs: string[]) => {
                    let propType = parseInt(strs[0]), propValue = parseFloat(strs[1]);
                    if(!attrMap.has(propType)) attrMap.set(propType, 0);
                    let oldValue = attrMap.get(propType);
                    attrMap.set(propType, oldValue + propValue);
                });
            })
        }

        if(attrMap.size > 0){
            let descStr = leadLevels[0].LeadSkillLevelIntroduce || '';
            attrMap.forEach((value, key) => {
                let attributeCfg = configUtils.getAttributeConfig(key);
                let valueStr = attributeCfg.AttributeValueType == NumberValueType.REAL_VALUE ? `${value}` : `${value / 100}%`;
                descStr += `${attributeCfg.Name} + ${valueStr}\n`;
            });
            this.descLB.string = descStr;
        }

        this.descLB.node.color = isGray ?  cc.Color.GRAY : cc.color().fromHEX('#6D4835')
    }

    private _refreshLevels(leadSkillList: {[k: string]: cfg.LeadSkillList}) {
        this.levels.children.forEach(_c => {
            _c.active = false;
        });
        let index: number = 0;
        let level: number = -1;
        for(const k in leadSkillList) {
            let leadSkill = leadSkillList[k];
            if(level != leadSkill.LeadSkillListOpenLevel) {
                level = leadSkill.LeadSkillListOpenLevel;
                let levelItem = this.levels.children[index];
                if(levelItem) {
                    levelItem.active = true;
                    levelItem.setPosition(0, -(index * (85 + this.spacing.y) + 43));
                    levelItem.getComponent(cc.Label).string = `${level}级`;
                }
                ++index;
            }
        }
    }

    private _refreshTopInfoView() {
        this.userSpCountLB.string = `${pragmaticData.skillPoint}`;
    }

    refreshAddLevelView(isUpdateSlider: boolean = true) {
        this.needSpLB.node.opacity = 255;
        this.addLevelLB.string = `${this._currSelItem.skillLevel + this._addLevel}/${this._addLevelMax}`;
        this._costSpCount = this._calculateNeedSpCount();
        let colorString = this._costSpCount  > pragmaticData.skillPoint ? '#ff0000' : '#000000';
        this.needSpLB.string = `升级消耗修炼点：<color=${colorString}>${this._costSpCount}</color>`;
        let canAddLv = this._addLevelMax - this._currSelItem.skillLevel;
        isUpdateSlider && (this.addLevelSlider.progress = this._addLevel / canAddLv);
        this._updateSaveBtnState();
    }

    private _onScrolling(scrollview: cc.ScrollView) {
        let offsetY: number = scrollview.getScrollOffset().y;
        let viewEndY: number = offsetY + scrollview.node.height;
        for(let i = 0; i < this._pragmaticSkillComps.length; ++i) {
            let item: cc.Node = scrollview.content.children[i + 1];
            if(item && item.position.y - item.height / 2 >= -offsetY || item.position.y + item.height / 2 <= -viewEndY) {
                // if(item.active) {
                //     item.active = false;
                // }
                this._pragmaticSkillComps[i].switchActivity(false);
            } else {
                // if(!item.active) {
                //     item.active = true;
                // }
                this._pragmaticSkillComps[i].switchActivity(true);
            }
        }
    }

    private _recvChangeLeadSkillSuc() {
        guiManager.showDialogTips(1000138);
        this._clearAddLevelData();
        this._resetAddLevelSlider();
        this._refreshTopInfoView();
        this._refreshMapView();
        this._refreshSkillInfoView();
        // redDotMgr.fire(RED_DOT_MODULE.PRAGMATIC_TOGGLE);
        // redDotMgr.fire(RED_DOT_MODULE.MAIN_CHARACTER);
    }

    private _recvResetLeadSkillSuc() {
        this._clearAddLevelData();
        this._resetAddLevelSlider();
        this._refreshTopInfoView();
        this._refreshMapView();
        this._refreshSkillInfoView();
        // redDotMgr.fire(RED_DOT_MODULE.PRAGMATIC_TOGGLE);
        // redDotMgr.fire(RED_DOT_MODULE.MAIN_CHARACTER);
    }

    private _releaseMap() {
        this._pragmaticSkillComps.forEach(_cmp => {
            _cmp.node.removeFromParent();
            ItemPragmaticSkillIconPool.put(_cmp);
        });
        this._pragmaticSkillComps = [];
    }

    private _getMapItemByLeadSkillList(leadSkillListGroupId: number): ItemPragmaticSkillIcon {
        return this._pragmaticSkillComps.find(_c => {
            return _c.leadSkillList.LeadSkillListGroupId == leadSkillListGroupId;
        });
    }

    private _onClickItem(leadSkillList: cfg.LeadSkillList) {
        // TODO 需要取到当前的技能ID
        if(this._curSkillGroupId != leadSkillList.LeadSkillListGroupId) {
            this._curSkillGroupId = leadSkillList.LeadSkillListGroupId;
            this._pragmaticSkillComps.forEach(_c => {
                _c.refreshSelect(this._curSkillGroupId);
            });
            this._refreshSkillInfoView();
        }
    }

    onClickAddLevelBtn(event:cc.Event, customEventData: number) {
        let preLevel = this._addLevel;
        let canAddMaxLv =  this._addLevelMax - this._currSelItem.skillLevel;
        this._addLevel = this._addLevel + Number(customEventData) < 0 ? 0 : this._addLevel + Number(customEventData) > canAddMaxLv ? canAddMaxLv : this._addLevel + Number(customEventData);
        if(preLevel != this._addLevel) {
            this.refreshAddLevelView();
            let oriLv = pragmaticData.skills &&  pragmaticData.skills[this._curSkillGroupId] || 0;
            this._updateSkillInfo(oriLv + this._addLevel);
        }
    }

    onSliderMove() {
        let preLevel = this._addLevel;
        let canAddMaxLv =  this._addLevelMax - this._currSelItem.skillLevel;
        this._addLevel = Math.ceil(this.addLevelSlider.progress * canAddMaxLv);
        if(preLevel != this._addLevel) {
            this.refreshAddLevelView(false);
            let oriLv = pragmaticData.skills &&  pragmaticData.skills[this._curSkillGroupId] || 0;
            this._updateSkillInfo(oriLv + this._addLevel);
        }
    }

    onClickSave() {
        if(this._checkLvEnough() && this._checkSpEnough()) {
            let addLevel: number = this._addLevel + (pragmaticData.skills[this._curSkillGroupId] || 0);
            pragmaticDataOpt.reqChangeLeadSkill(this._curSkillGroupId, addLevel);
        }
    }

    onClickClearSkills() {
        if(!PragmaticView._isSkillClearable) {
            guiManager.showDialogTips(1000133);
            return;
        };

        if(!(utils.getObjLength(pragmaticData.skills) > 0)) {
            guiManager.showDialogTips(CustomDialogId.PRAGMATIC_NO_SKILL);
            return;
        }

        guiManager.showMessageBox(this.node, {
            content: '是否重置修炼点（请谨慎操作）',
            leftStr: '取消',
            leftCallback: null,
            rightStr: '确定',
            rightCallback: () => {
                PragmaticView._isSkillClearable = false;
                PragmaticView._CDStartTime = serverTime.currServerTime();
                this._initClearBtn();
                pragmaticDataOpt.reqResetLeadSkills();
            }
        });
    }

    private _initClearBtn(){
        let delayTime = PragmaticView._delteTimeOfClear - (serverTime.currServerTime() - PragmaticView._CDStartTime)
        this._updateResetBtn(delayTime);
        if(delayTime < 0) return;
        PragmaticView._task = this._updateResetBtn.bind(this);
        PragmaticView._scheduler = scheduleManager.schedule(() => {
            let delayTime = PragmaticView._delteTimeOfClear - (serverTime.currServerTime() - PragmaticView._CDStartTime);
            if(delayTime < 0){
                scheduleManager.unschedule(PragmaticView._scheduler);
                PragmaticView._isSkillClearable = true;
                PragmaticView._scheduler = -1;
             }
             PragmaticView._task && PragmaticView._task(delayTime);
        }, 1);
    }

    private _updateResetBtn(deltaTime: number){
        let labelComp = cc.find('tips', this.resetBtn).getComponent(cc.Label);
        if(deltaTime < 0){
            this._setClearBtnState(true);
            labelComp.string = `重置`;
        } else {
            this._setClearBtnState(false);
            labelComp.string = `重置${deltaTime}`;
        }
    }

    private _setClearBtnState(enable: boolean){
        let normalBgNode = cc.find('bg', this.resetBtn);
        let disableBgNode = cc.find('bgDisable', this.resetBtn);
        normalBgNode.active = enable;
        disableBgNode.active = !enable;
    }

    private _resetAddLevelSlider() {
        this.addLevelSlider.progress = 0;
    }

    private _clearAddLevelData() {
        this._addLevelMax = 0;
        this._addLevel = 0;
        this._costSpCount = 0;
    }

    private _resetData() {
        this._curSkillGroupId = 0;
        this._clearAddLevelData();
        this._resetAddLevelSlider();
    }

    private _updateSaveBtnState() {
        let material = cc.assetManager.builtins.getBuiltin('material', this._addLevel == 0 ? 'builtin-2d-gray-sprite' : 'builtin-2d-sprite');
        this.saveBtn.getComponent(cc.Sprite).setMaterial(0, material as cc.Material);
    }

    private _calculateNeedSpCount(): number {
        let needSpCount: number = 0;
        if(this._addLevel > 0) {
            let leadSkillLevels = this._getLeadSkillLevels();
            let curSkillLevel = pragmaticData.skills[this._curSkillGroupId] || 0;
            if(curSkillLevel >= leadSkillLevels.length) {
                return needSpCount;
            }
            for(let i = 0; i < this._addLevel; ++i) {
                let curLeadSkillLevel = leadSkillLevels[curSkillLevel + i];
                needSpCount += Number(curLeadSkillLevel.LeadSkillLevelCost);
            }
        }
        return needSpCount;
    }

    private _getLeadSkillLevels(): cfg.LeadSkillLevel[] {
        let leadSkillLevels: cfg.LeadSkillLevel[] = [];
        let leadSkillLevelCfgs = configManager.getConfigs("leadSkillLevel");
        if(!leadSkillLevelCfgs) return leadSkillLevels;

        for(const k in leadSkillLevelCfgs) {
            let leadSkillLevel: cfg.LeadSkillLevel = leadSkillLevelCfgs[k];
            if(leadSkillLevel.LeadSkillLevelGroup == this._curSkillGroupId) {
                leadSkillLevels.push(leadSkillLevel);
            }
        }
        return leadSkillLevels;
    }

    private _checkLvEnough(){
        let skillGroup : any[] = configManager.getConfigByKV('leadSkillList', 'LeadSkillListGroupId', this._curSkillGroupId);
        if(!skillGroup || skillGroup.length == 0) return false;

        let skillGroupCfg = skillGroup[0] as cfg.LeadSkillList;
        if(userData.lv < (skillGroupCfg.LeadSkillListOpenLevel || 1)){
            guiManager.showDialogTips(1000074);
            return false;
        }
        return true;
    }

    private _checkSpEnough() {
        if(this._costSpCount > 0) {
            if (this._costSpCount > pragmaticData.skillPoint) {
                guiManager.showDialogTips(CustomDialogId.PRAGMATIC_ITEM_NO_ENOUGH);
                return false;
            } else {
                return true;
            }
        }
        return false;
    }

    private _getLeadSkillLevelCfg(skillLevel: number): cfg.LeadSkillLevel {
        let leadSkillLevels = this._getLeadSkillLevels();
        let leadSkillLevel = leadSkillLevels.find(_l => {
            return _l.LeadSkillLevelSkillLevel == skillLevel;
        });
        return leadSkillLevel;
    }

    private _getCurSkillLevel() {
        if(typeof pragmaticData.skills[this._curSkillGroupId] != 'undefined')
            return pragmaticData.skills[this._curSkillGroupId];
        return this._addLevel;
    }

    onToggleChecked(toggle: cc.Toggle) {
        if(toggle == this._curSeleToggle) return;
        this._curSeleToggle = toggle;
        this._switchView();
    }

    private _switchView() {
        let subModuleId = this._curSeleToggle == this.pragmaticToggle ? 1 : 2;
        this._coinNode && this._coinNode.getComponent(CoinNode).resetCfgs(this._moduleId + subModuleId);

        if(this._curSeleToggle == this.pragmaticToggle){
            this._wuDaoView && cc.isValid(this._wuDaoView.node) && (this._wuDaoView.node.active = false);
            if(this._isPragmaticInited){
                this.PragmaticNode.active = true;
            } else {
                this._initPragmaticView();
            }

        }

        if(this._curSeleToggle == this.wuDaoToggle) {
            this.PragmaticNode.active = false;
            if(this._wuDaoView && cc.isValid(this._wuDaoView.node)){
                this._wuDaoView.node.active = true;
            } else {
                guiManager.loadView('WuDaoView', this.subViewParent, this).then((viewbaseCmp) => {this._wuDaoView = viewbaseCmp as WuDaoView});
            }
        }
    }
}
