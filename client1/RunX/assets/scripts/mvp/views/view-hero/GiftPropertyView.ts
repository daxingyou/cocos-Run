import { CustomDialogId, VIEW_NAME } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { bagDataEvent, commonEvent, heroViewEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { cfg } from "../../../config/config";
import { data, gamesvr } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { userData } from "../../models/UserData";
import { bagDataOpt } from "../../operations/BagDataOpt";
import ItemBag from "../view-item/ItemBag";
import ItemGiftIcon from "./ItemGiftIcon";
import ItemSkill from "./ItemSkill";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GiftPropertyView extends ViewBaseComponent {
    @property(cc.Node)              icons: cc.Node = null;
    @property(cc.Label)             introduceLb: cc.Label = null;
    @property(cc.Prefab)            skillPfb: cc.Prefab = null;
    @property(cc.Prefab)            giftPfb: cc.Prefab = null;
    @property(cc.Node)              lockNode: cc.Node = null;
    @property(cc.Node)              unlockNode: cc.Node = null;
    @property(cc.Node)              costParent: cc.Node = null;
    @property(cc.Label)             btnTipsLb: cc.Label = null;
    @property(cc.Node)              tipsNode: cc.Node = null;

    private _giftId: number = 0;
    private _heroId: number = 0;
    private _selectSkillId: number = 0;
    private _loadView: Function = null;
    private _itemBags: ItemBag[] = [];
    private _itemGiftIcons: ItemGiftIcon[] = [];
    private _itemSkills: ItemSkill[] = [];

    onInit(giftId: number, heroId: number, loadView?: Function) {
        this._giftId = giftId;
        this._heroId = heroId;
        this._loadView = loadView;

        this.refreshView();
        this.refreshCostView();
        this.updateSelectSkillId();

        eventCenter.register(heroViewEvent.GAIN_GIFT, this, this._recvGainGift);
        eventCenter.register(heroViewEvent.SELECT_GIFT_SKILL, this, this._recvSelectGiftSkill);
        eventCenter.register(bagDataEvent.ITEM_CHANGE, this, this.refreshCostView);
        eventCenter.register(commonEvent.JUMP_MODULE, this, this.closeView)
    }
    
    deInit(){
        this._clearItems();
    }
    
    private _clearItems() {
        this._itemBags.forEach(_i => {
            ItemBagPool.put(_i)
        })
        this._itemBags = [];
    }

    private _clearGiftIcons(){
        this._itemGiftIcons.forEach( _i => {
            _i.deInit();
        })
        
        this._itemSkills.forEach( _i => {
            _i.deInit();
        })
        this._itemGiftIcons = []
        this._itemSkills = [];
        this.icons.removeAllChildren();
    }

    onRelease() {
        eventCenter.unregisterAll(this);
        if(this.icons.childrenCount > 1) {
            this.icons.children.forEach(item => {
                item.getComponent(ItemSkill).deInit();
            });
        } else if(this.icons.childrenCount == 1) {
            this.icons.children.forEach(item => {
                item.getComponent(ItemGiftIcon).deInit();
            });
        }
        
        this._clearGiftIcons();
        this.deInit();
    }

    refreshView() {
        let giftCfg: cfg.HeroGift = configUtils.getHeroGiftConfig(this._giftId);
        this.tipsNode.active = giftCfg.HeroGiftType == 2;
        this._clearGiftIcons();
        
        if(giftCfg.HeroGiftType == 1) {
            // 天赋icon
            let giftIcon: cc.Node = cc.instantiate(this.giftPfb);
            this.icons.addChild(giftIcon);
            let giftIconComp = giftIcon.getComponent(ItemGiftIcon);
            giftIconComp.onInit(giftCfg.HeroGiftId, null, false);
            this._itemGiftIcons.push(giftIconComp);
            giftIconComp.redotComp.clear();

            let isSmallIcon = !giftCfg.HeroGiftIconSize || giftCfg.HeroGiftIconSize <= 0;
            giftIcon.scale = isSmallIcon ? 2 : 1;
            // 天赋属性介绍
            let HeroGiftAttributeList = utils.parseStingList(giftCfg.HeroGiftAttribute);
            let introduceString: string = null;
            for(let i = 0; i < HeroGiftAttributeList.length; ++i) {
                let attributeCfg: cfg.Attribute = configUtils.getAttributeConfig(HeroGiftAttributeList[i][0]);
                introduceString ? (introduceString += '\n') : (introduceString = '');
                let propValue: number = parseFloat(HeroGiftAttributeList[i][1]);
                //百分比类型除100
                attributeCfg.AttributeValueType === 2 && (propValue /= 100);
                let propStr : string = `${propValue}${attributeCfg.AttributeValueType === 2 ? '%' : ''}`;
                introduceString += `${attributeCfg.Name} +${propStr}`;
            }
            this.introduceLb.string = introduceString;
        } else {
            // 技能icon
            let skillList = utils.parseStingList(giftCfg.HeroGiftSkill);
            let skillIcons = utils.parseStingList(giftCfg.HeroGiftIcon);
            for(let i = 0; i < skillList.length; ++i) {
                let skillIcon: cc.Node = cc.instantiate(this.skillPfb);
                this.icons.addChild(skillIcon);
                let skillIconComp = skillIcon.getComponent(ItemSkill);
                skillIconComp.onInit(skillList[i], skillIcons[i], (skillId: number) => {
                    this.refreshSelect(skillId);
                }, true);
                this._itemSkills.push(skillIconComp);
            }
        }
    }

    refreshSkillIntroduce() {
        let skillCfg: cfg.Skill = configUtils.getSkillConfig(this._selectSkillId);
        if(skillCfg) {
            this.introduceLb.string = `${skillCfg && skillCfg.Illustrate ? skillCfg.Illustrate : '暂未配置'}`;
            return;
        }
        let changeCfg: cfg.SkillChange = configUtils.getSkillChangeConfig(this._selectSkillId);
        if(changeCfg) {
            this.introduceLb.string = `${changeCfg && changeCfg.Desc ? changeCfg.Desc : '暂未配置'}`;
            return;
        }
    }

    refreshCostView() {
        let giftState: number = this._checkGiftState();
        this.lockNode.active = giftState < 2;
        this.unlockNode.active = giftState >= 2;
        if(giftState < 2) {
            let giftCfg: cfg.HeroGift = configUtils.getHeroGiftConfig(this._giftId);
            let costList = utils.parseStingList(giftCfg.HeroGiftCost);
            this._clearItems();
            for (let i = 0; i < costList.length; ++i) {
                let itemId: number = Number(costList[i][0]), itemCount: number = Number(costList[i][1]);
                let costItem: cc.Node = this.costParent.children[i];
                if(!costItem) {
                    let costItemComp = ItemBagPool.get();
                    costItem = costItemComp.node;
                    this.costParent.addChild(costItem);
                    this._itemBags.push(costItemComp);
                }
                let bagItem = bagData.getItemByID(itemId);
                let haveCount: number = bagItem ? utils.longToNumber(bagData.getItemByID(itemId).Array[0].Count) : 0;
                let hexColor: string = haveCount >= itemCount ? '<color=#00ff00>' : '<color=#ff0000>';
                costItem.getComponent(ItemBag).init({
                    id: itemId,
                    richTxt: `${hexColor}${haveCount}</c>/${itemCount}`,
                    clickHandler: () => {
                        let newitem: data.IBagUnit = { ID: itemId, Count: 0, Seq: 0 };
                        let findItem = bagData.getItemByID(itemId);
                        let item: data.IBagUnit = findItem ? findItem.Array[0] : newitem;
                        this._loadView && this._loadView(VIEW_NAME.TIPS_ITEM, 1, item);
                    }
                });
            }
        }
        this.refreshActivateBtn();
    }

    refreshActivateBtn() {
        let giftCfg: cfg.HeroGift = configUtils.getHeroGiftConfig(this._giftId);
        let giftState: number = this._checkGiftState();
        if (giftState == -1) {
            // 等级不足
            this.btnTipsLb.string = `${giftCfg.HeroGiftNeedLevel}级可激活`;
        } else if (giftState == -2) {
            // 前置未解锁
            this.btnTipsLb.string = `未激活前置天赋`;
        } else if (giftState > 2) {
            // this.icons.active = false;
            if(giftState == this._selectSkillId) {
                this.btnTipsLb.string = `已使用`;
            } else {
                this.btnTipsLb.string = `使用`;
            }
        } else {
            if(giftState == 2) {
                this.btnTipsLb.string = `已激活`;
            } else {
                this.btnTipsLb.string = `激活`;
            }
        }
    }

    updateSelectSkillId() {
        let giftCfg: cfg.HeroGift = configUtils.getHeroGiftConfig(this._giftId);
        if(giftCfg.HeroGiftType == 2) {
            let heroUnit = bagData.getHeroById(this._heroId);
            if(heroUnit && heroUnit.isHeroBasic) {
                if (heroUnit.gift[this._giftId] && heroUnit.gift[this._giftId].SkillID) {
                    this.refreshSelect(heroUnit.gift[this._giftId].SkillID);
                } else {
                    let skillList = utils.parseStingList(giftCfg.HeroGiftSkill);
                    this.refreshSelect(skillList[0]);
                }
            }
        }
    }

    refreshSelect(skillId: number) {
        if(this._selectSkillId != skillId) {
            this._selectSkillId = skillId;
            this.refreshSkillIntroduce();
            this.refreshActivateBtn();
            for(let i = 0; i < this.icons.childrenCount; ++i) {
                let skillIcon: cc.Node = this.icons.children[i];
                skillIcon.getComponent(ItemSkill).refreshSelect(this._selectSkillId);
            }
        }
    }

    onClickAcvivate() {
        let giftState: number = this._checkGiftState();
        if(giftState >= 1) {
            // 满足解锁条件
            if(giftState >= 2) {
                // 已经解锁
                if (this._selectSkillId > 2 && this._selectSkillId != giftState) {
                    this._sendSelectGiftSkill();
                } else {
                    guiManager.showDialogTips(CustomDialogId.HERO_GIFT_ACTIVED);
                }
            } else {
                this._sendGainGift();
            }
        } else {
            if(giftState == -1) {
                guiManager.showDialogTips(CustomDialogId.HERO_GRADE_NO_MATCH);
            } else if(giftState == -2) {
                guiManager.showDialogTips(CustomDialogId.HERO_GIFT_CONDITION);
            }
        }
    }

    private _sendGainGift() {
        bagDataOpt.sendGainGift(this._heroId, this._giftId, this._selectSkillId);
    }

    private _sendSelectGiftSkill() {
        bagDataOpt.sendSelectGiftSkill(this._heroId, this._giftId, this._selectSkillId);
    }

    private _recvGainGift(eventId: number, msg: gamesvr.GainGiftRes) {
        userData.updateCapability();
        this._itemGiftIcons && this._itemGiftIcons.forEach(ele => {
            ele.updateGiftIcon();
        })
        this.refreshCostView();
    }

    private _recvSelectGiftSkill(eventId: number, msg: gamesvr.SelectGiftSkillRes) {
        guiManager.showDialogTips(CustomDialogId.HERO_GIFT_SKILL_CHANGED);
        this.refreshCostView();
    }

    /**
     *
     * @returns -1等级不满足 -2前置未解锁 1解锁未激活 >=2激活并解锁
     */
    private _checkGiftState() {
        let giftCfg: cfg.HeroGift = configUtils.getHeroGiftConfig(this._giftId);
        let heroUnit = bagData.getHeroById(this._heroId);
        if (heroUnit && heroUnit.isHeroBasic) {
            if(giftCfg.HeroGiftType == 1) {
                if(giftCfg.HeroGiftOrder) {
                    if (heroUnit.lv >= giftCfg.HeroGiftNeedLevel) {
                        if (heroUnit.gift[this._giftId]) {
                            return 2;
                        } else {
                            if(heroUnit.gift[giftCfg.HeroGiftOrder]) {
                                return 1;
                            } else {
                                return -2;
                            }
                        }
                    } else {
                        return -1;
                    }
                } else {
                    if(heroUnit.lv >= giftCfg.HeroGiftNeedLevel) {
                        if(heroUnit.gift[this._giftId]) {
                            return 2;
                        } else {
                            return 1;
                        }
                    } else {
                        return -1;
                    }
                }
            } else {
                if (giftCfg.HeroGiftOrder) {
                    if (heroUnit.lv >= giftCfg.HeroGiftNeedLevel) {
                        if (heroUnit.gift[this._giftId]) {
                            return heroUnit.gift[this._giftId].SkillID;
                        } else {
                            if (heroUnit.gift[giftCfg.HeroGiftOrder]) {
                                return 1;
                            } else {
                                return -2;
                            }
                        }
                    } else {
                        return -1;
                    }
                } else {
                    if (heroUnit.lv >= giftCfg.HeroGiftNeedLevel) {
                        if (heroUnit.gift[this._giftId]) {
                            return heroUnit.gift[this._giftId].SkillID;
                        } else {
                            return 1;
                        }
                    } else {
                        return -1;
                    }
                }
            }
        }
        return -1;
    }
}
