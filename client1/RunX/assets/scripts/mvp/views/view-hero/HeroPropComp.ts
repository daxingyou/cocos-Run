import { eventCenter } from "../../../common/event/EventCenter";
import { RED_DOT_MODULE } from "../../../common/RedDotManager";
import ItemRedDot from "../view-item/ItemRedDot";
import HeroEquipsView from "./HeroEquipsView";
import HeroFriendView from "./HeroFriendView";
import HeroGiftView from "./HeroGiftView";
import HeroPropertyView from "./HeroPropertyView";
import HeroView from "./HeroView";

const { ccclass, property } = cc._decorator;

const enum HERO_VIEW_TYPE {
    PROPERTY,
    EQUIP,
    GIFT,
    FRIENDS
}

@ccclass
export default class HeroPropComp extends cc.Component {
    @property(cc.Node)  heroBasicNode: cc.Node = null;
    @property(cc.Node)  heroBasicViewParent: cc.Node = null;

    @property(ItemRedDot) equipToggleRedDot: ItemRedDot = null;
    @property(ItemRedDot) giftToggleRedDot: ItemRedDot = null;

    @property(HeroPropertyView) propComp: HeroPropertyView = null;
    @property(HeroEquipsView)   equipComp: HeroEquipsView = null;
    @property(HeroFriendView)   friendComp: HeroFriendView = null;
    @property(HeroGiftView)     giftComp: HeroGiftView = null;

    private _root: HeroView = null;
    private _currTogIdx: number = 0;
    onInit (root: HeroView) {
        this._root = root;
        this.heroBasicNode.active = false
        this._currTogIdx = 0;
        eventCenter.unregisterAll(this);
        this._initEvents();
        this.propComp.node.active = true;
        this.equipComp.node.active = true;
        this.friendComp.node.active = true;
        this.giftComp.node.active = true;
    }

    private _initEvents(){

    }

    deInit () {
        eventCenter.unregisterAll(this);
        this.propComp.onRelease();
        this.equipComp.onRelease();
        this.friendComp.onRelease();
        this.giftComp.onRelease();
    }

    updateRole (currHero: number) {
        if(currHero) {
            this._refreshToggleRedDot();
            if(this.propComp.node.active) {
                this._showDlgByType(HERO_VIEW_TYPE.PROPERTY, currHero);
            } else if(this.equipComp.node.active) {
                this._showDlgByType(HERO_VIEW_TYPE.EQUIP, currHero);
            } else if(this.giftComp.node.active) {
                this._showDlgByType(HERO_VIEW_TYPE.GIFT, currHero);
            } else if(this.friendComp.node.active) {
                this._showDlgByType(HERO_VIEW_TYPE.FRIENDS, currHero);
            } else {
                this._showDlgByType(HERO_VIEW_TYPE.PROPERTY, currHero);
            }
        }
    }

     /**
     * 点击 界面toggle
     * @param event
     * @param customEventData
     */
    onClickSwitchDlg(toggle: cc.Toggle, customEventData: number) {
        this._root.heroList.onClickHidePop();
        if(this._currTogIdx != customEventData) {
            this._currTogIdx = customEventData;
            this._showDlgByType(customEventData, this._root.heroList.currHero);
        }
    }

    private _refreshToggleRedDot() {
        this.equipToggleRedDot.setData(RED_DOT_MODULE.HERO_EQUIP_TOGGLE, {
            isClickCurToggle: this._currTogIdx == HERO_VIEW_TYPE.EQUIP,
            args: [this._root.heroList.currHero]
        });
        this.giftToggleRedDot.setData(RED_DOT_MODULE.HERO_GIFT_TOGGLE, {
            isClickCurToggle: this._currTogIdx == HERO_VIEW_TYPE.GIFT,
            args: [this._root.heroList.currHero]
        });
    }


    /**
     * 展示界面类型 todo 后面还会家类型
     * @param type 0 英雄界面 1 装备界面 2 天赋界面 3 仙缘界面
     */
    private _showDlgByType(type: number, currHero: number) {
        if(!this.heroBasicNode.active) return;
        this._showRoleView(type == HERO_VIEW_TYPE.PROPERTY, currHero);
        this._showEquipView(type == HERO_VIEW_TYPE.EQUIP, currHero);
        this._showGiftView(type == HERO_VIEW_TYPE.GIFT, currHero);
        this._showFriendView(type == HERO_VIEW_TYPE.FRIENDS, currHero);
    }

    /**
     * 改变英雄属性界面的状态
     * @param isShow 
     */
    private _showRoleView(isShow: boolean, currHero: number) {
        this.propComp.node.active = isShow;
        if(isShow) {
            this.propComp.onInit(currHero, this._loadSubView.bind(this));
        }
    }
    /**
     * 改变武器界面的状态
     * @param isShow 
     */
    private _showEquipView(isShow: boolean, currHero: number) {
        this.equipComp.node.active = isShow;
        if(isShow) {
            this.equipComp.onInit(currHero, this._loadSubView.bind(this));
        }
    }

    private _showGiftView(isShow: boolean, currHero: number) {
        this.giftComp.node.active = isShow;
        if(isShow) {
            this.giftComp.onInit(currHero, this._loadSubView.bind(this));
        }
    }

    private _showFriendView(isShow: boolean, currHero: number) {
        this.friendComp.node.active = isShow;
        if(isShow) {
            this.friendComp.onInit(currHero, this._loadSubView.bind(this));
        }
    }

    private _loadSubView (name: string, viewType: number, ...args: any[]) {
        this._root.loadHeroSubView(name, viewType, ...args)
    }

} 