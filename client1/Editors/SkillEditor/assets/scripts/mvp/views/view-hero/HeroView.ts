import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import guiManager from "../../../common/GUIManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { data } from "../../../network/lib/protocol";
import { modelManager } from "../../models/ModeManager";
import { optManager } from "../../operations/OptManager";
import HeroListItem from "./HeroListItem";
import { Hero_Ability_Max, VIEW_NAME } from "../../../app/AppConst"
import EquipItem from "../view-other/EquipItem";
import { eventCenter } from "../../../common/event/EventCenter";
import { heroViewEvent } from "../../../common/event/EventData";
import { EquipInfo, HeroBasicInfo, HeroFriendInfo, HeroProperty } from "../../models/HeroData";
import { utils } from "../../../app/AppUtils";

const { ccclass, property } = cc._decorator;

@ccclass
export default class HeroView extends ViewBaseComponent {
    @property({ type: cc.Node }) heroInfoNode: cc.Node = null;
    @property({ type: cc.Node }) equipInfoNode: cc.Node = null;
    @property({ type: cc.Node }) heroFriendInfoNode: cc.Node = null;
    // 英雄属性相关的
    @property({ type: cc.Prefab, tooltip: '英雄展示item预制体' }) heroListItemPfb: cc.Prefab = null;
    @property({ type: cc.Node, tooltip: '英雄展示节点的item的父节点' }) heroListParent: cc.Node = null;
    @property({ type: cc.Label, tooltip: '名字' }) heroNameLb: cc.Label = null;
    @property({ type: cc.Node, tooltip: '星级' }) starsParent: cc.Node = null;
    @property({ type: cc.Sprite, tooltip: '卦象' }) heroTrigramsSp: cc.Sprite = null;
    @property({ type: cc.Sprite, tooltip: '装备类型' }) heroEquipTypeSp: cc.Sprite = null;
    @property({ type: cc.Sprite, tooltip: '定位' }) heroAbilitySp: cc.Sprite = null;
    @property({ type: cc.Sprite, tooltip: '品质' }) heroQualitySp: cc.Sprite = null;
    @property({ type: cc.Label, tooltip: '战斗力' }) heroCapabilityLb: cc.Label = null;
    @property({ type: cc.Label, tooltip: '等级' }) heroLvLb: cc.Label = null;
    @property({ type: [cc.Node], tooltip: '基础属性' }) heroBasicPropertyList: cc.Node[] = [];
    @property({ type: cc.Node, tooltip: '必杀技' }) holySkillParent: cc.Node = null;
    @property({ type: cc.Node, tooltip: '被动技' }) passiveSkillParent: cc.Node = null;
    @property({ type: cc.Sprite, tooltip: '进阶碎片头像' }) advanceHeadSp: cc.Sprite = null;
    @property({ type: cc.Label, tooltip: '进阶碎片数量' }) advanceNumLb: cc.Label = null;
    @property({ type: cc.Node, tooltip: '定位图父节点' }) abilityGraphicsParent: cc.Node = null;
    @property({ type: cc.Graphics, tooltip: '定位图父节点' }) abilityGraphics: cc.Graphics = null;
    // 英雄装备相关的
    @property(cc.Sprite) smallHeroSp: cc.Sprite = null;
    @property([cc.Node]) equipsList: cc.Node[] = [];
    @property(cc.Prefab) equipItemPfb: cc.Prefab = null;

    private _spriteLoader: SpriteLoader = null;
    private _heroViewShowInfo: data.IBagUnit = null;
    private _basicConfig: HeroBasicInfo = null;
    private _heroPropertyConfig: HeroProperty = null;
    private _isFirst: boolean = false;
    onInit() {
        if (!this._spriteLoader) {
            this._spriteLoader = new SpriteLoader();
        }
        this._isFirst = true;
        this.doInit();
        this.updateData();

        this.refreshView();
    }

    doInit() {
        eventCenter.register(heroViewEvent.HERO_EVENT_TYPE, this, this.updateData);
    }

    deInit() {

    }

    updateData(heroInfo?: data.IBagUnit, curIndex?: number) {
        this._heroViewShowInfo = modelManager.bagData.getHeroViewInfoByIndex(this._curClickItemIndex);
        // 英雄基本信息
        this._basicConfig = optManager.bagDataOpt.getHeroBaseConfigById(this._heroViewShowInfo.ID);
        // 如果有仙缘属性
        if (this._basicConfig.HeroBasicFriend) {
            // 英雄仙缘信息
            let friendConfig: HeroFriendInfo = optManager.bagDataOpt.getHeroFriendConfig(Number(this._basicConfig.HeroBasicFriend));
        }
        // 英雄属性信息
        this._heroPropertyConfig = optManager.bagDataOpt.getHeroPropertyConfig(this._heroViewShowInfo.ID);
    }

    onRelease() {
        if (this._spriteLoader) {
            this._spriteLoader.release();
        }
    }
    private _curClickItemIndex: number = 0;

    refreshHeroList() {
        // 英雄头像展示列表
        if (this.heroListParent.childrenCount > 0) {
            this.heroListParent.removeAllChildren();
        }
        let heroViewShowInfos: data.IBagUnit[][] = modelManager.bagData.getHeroViewShowInfos();
        for (let i = 0; i < heroViewShowInfos.length; ++i) {
            let heroList: data.IBagUnit[] = heroViewShowInfos[i];
            if (heroList) {
                for (let j = 0; j < heroList.length; ++j) {
                    let item: cc.Node = cc.instantiate(this.heroListItemPfb);
                    this.heroListParent.addChild(item);
                    let heroListItemCmp = item.getComponent(HeroListItem);
                    heroListItemCmp.setData(heroList[j]);
                    item.on(cc.Node.EventType.TOUCH_END, () => {
                        this.onClickListItem(heroListItemCmp, j);
                    }, this);
                }
            }
        }
    }

    refreshView() {
        if (this._isFirst) {
            this._isFirst = false;
            this.refreshHeroList();
            this.showDlgByType(0);
        } else {
            // 直接更新界面
            if (this.heroInfoNode.active) {
                this.refreshHeroInfoView();
            } else if (this.equipInfoNode) {
                this.refreshEquipsView();
            }
        }
    }

    refreshHeroInfoView() {
        // 星星数的显示
        for (let i = 0; i < this.starsParent.childrenCount; ++i) {
            if (i < this._heroViewShowInfo.HeroUnit.Star) {
                this.starsParent.children[i].active = true;
            } else {
                this.starsParent.children[i].active = false;
            }
        }
        // 卦象初始化显示
        // todo 更换卦象icon
        // this._spriteLoader.changeSprite(this.heroTrigramsSp,);

        // 装备类型
        // todo 更换装备类型icon
        // this._spriteLoader.changeSprite(this.heroEquipTypeSp,);

        // 英雄定位
        // todo 更换英雄定位icon
        // this._spriteLoader.changeSprite(this.heroAbilitySp,);

        // 英雄品质icon
        // todo 更换英雄品质icon
        // this._spriteLoader.changeSprite(this.heroQualitySp,);

        // 英雄基础属性
        this.heroCapabilityLb.string = `${0}`;
        this.heroLvLb.string = `${modelManager.userData.userInfo.level}`;
        this.heroNameLb.string = `${this._basicConfig.HeroBasicName}`;

        // todo 根据五维图 绘制
        let abilityList = utils.parseStingList(this._basicConfig.HeroBasicCapabilityMap);
        let curPos: cc.Vec3;
        let startPos: cc.Vec3;
        for (let i = 0; i < this.abilityGraphicsParent.childrenCount; ++i) {
            let ability = abilityList[i];
            curPos = this.abilityGraphicsParent.children[i].position.mul(Number(ability) / Hero_Ability_Max);
            if (i > 0) {
                this.abilityGraphics.lineTo(curPos.x, curPos.y);
            } else {
                startPos = curPos;
                this.abilityGraphics.moveTo(curPos.x, curPos.y);
            }
        }
        this.abilityGraphics.lineTo(startPos.x, startPos.y);
        this.abilityGraphics.fillColor = cc.Color.BLACK;
        this.abilityGraphics.fill();

        // 四维属性
        let basicNum: number = 0;
        let addNum: number = 0;
        for (let i = 0; i < this.heroBasicPropertyList.length; ++i) {
            let heroBasicProperty: cc.Node = this.heroBasicPropertyList[i];
            // todo 更换四维属性品质
            let propQuality: cc.Node = heroBasicProperty.children[0];
            let propBasic: cc.Node = heroBasicProperty.children[2];
            let propAdd: cc.Node = heroBasicProperty.children[3];
            if (i == 0) {
                basicNum = Number(utils.parseStingList(this._heroPropertyConfig.Attack)[this._heroViewShowInfo.HeroUnit.Star - 1]);
                basicNum = Number(utils.parseStingList(this._heroPropertyConfig.AttackAdd)[this._heroViewShowInfo.HeroUnit.Star - 1]);
            } else if (i == 1) {
                basicNum = Number(utils.parseStingList(this._heroPropertyConfig.Defend)[this._heroViewShowInfo.HeroUnit.Star - 1]);
                basicNum = Number(utils.parseStingList(this._heroPropertyConfig.DefendAdd)[this._heroViewShowInfo.HeroUnit.Star - 1]);
            } else if (i == 2) {
                basicNum = Number(utils.parseStingList(this._heroPropertyConfig.Hp)[this._heroViewShowInfo.HeroUnit.Star - 1]);
                basicNum = Number(utils.parseStingList(this._heroPropertyConfig.HpAdd)[this._heroViewShowInfo.HeroUnit.Star - 1]);
            } else {
                basicNum = Number(utils.parseStingList(this._heroPropertyConfig.Speed)[this._heroViewShowInfo.HeroUnit.Star - 1]);
                basicNum = Number(utils.parseStingList(this._heroPropertyConfig.SpeedAdd)[this._heroViewShowInfo.HeroUnit.Star - 1]);
            }
            propBasic.getComponent(cc.Label).string = `${basicNum}`;
            propAdd.getComponent(cc.Label).string = `${addNum}`;
        }

        // 技能展示 todo
        // 必杀技
        if (this._basicConfig.HeroBasicSkill) {
            let basicSkillList = this._basicConfig.HeroBasicSkill.split('|');
            for (let i = 0; i < basicSkillList.length; ++i) {
                let basicSkill = basicSkillList[i];
                let skillConfig = configManager.getConfigByKey('skill', basicSkill);
            }
        }
        // 被动技
        if (this._basicConfig.HeroBasicPassive) {

        }
        // todo 展示模型

        // 展示英雄碎片
        let roleChipCount: number = modelManager.bagData.getHeroChipByHeroId(this._heroViewShowInfo.ID);
        let curNeedChipCount: number = modelManager.bagData.getHeroNeedChipCountByHeroInfo(this._heroViewShowInfo);
        this
    }

    refreshEquipsView() {
        let dressEquips = this._heroViewShowInfo.HeroUnit.Equips;
        // 说明是空的
        if (Object.keys(dressEquips).length == 0) {
            for (let i = 0; i < this.equipsList.length; ++i) {
                if (this.equipsList[i].childrenCount > 1) {
                    this.equipsList[i].children[1].removeFromParent();
                }
            }
        } else {
            for (const k in dressEquips) {
                let equip = dressEquips[k];
                let basicEquipConfig: EquipInfo = modelManager.bagData.getEquipBasicConfig(equip);
                let parent: cc.Node = this.equipsList[basicEquipConfig.PositionType - 1];
                let equipItem: cc.Node;
                if (parent.childrenCount > 1) {
                    // 说明是有装备 只需要刷新
                    equipItem = parent.children[1];
                } else {
                    equipItem = cc.instantiate(this.equipItemPfb);
                    parent.addChild(equipItem);
                }
                equipItem.getComponent(EquipItem).setData(equip);
            }
        }
    }

    showDlgByType(type: number) {
        this.showRoleView(type == 0);
        this.showEquipView(type == 1);
    }

    showRoleView(isShow: boolean) {
        if (isShow) {
            !this.heroInfoNode.active && (this.refreshHeroInfoView(), this.heroInfoNode.active = true);
        } else {
            this.heroInfoNode.active && (this.heroInfoNode.active = false);
        }
    }

    showEquipView(isShow: boolean) {
        if (isShow) {
            !this.equipInfoNode.active && (this.refreshEquipsView(), this.equipInfoNode.active = true);
        } else {
            this.equipInfoNode.active && (this.equipInfoNode.active = false);
        }
    }

    onClickListItem(heroListItemCmp: HeroListItem, index: number) {
        if (this._curClickItemIndex != index) {
            this._curClickItemIndex = index;
            heroListItemCmp.onClickItem();
            // todo 刷新界面的显示
            // this.refreshHeroInfoView();
            this.updateData();
            this.refreshView();
        }
    }

    onClickSwitchDlg(event: any, customEventData: number) {
        if (customEventData == 0) {
            // 英雄属性界面
            this.showRoleView(true);
            this.showEquipView(false);
        } else if (customEventData == 1) {
            // 装备界面
            this.showRoleView(false);
            this.showEquipView(true);
        } else if (customEventData == 2) {
            // 天赋界面 
        } else if (customEventData == 3) {
            // 仙缘界面
        }
    }

    onClickMoreProperty() {
        guiManager.loadView(VIEW_NAME.HEROMOREPROPERTYVIEW, this.node, this._heroViewShowInfo, this._heroPropertyConfig);
    }
}
