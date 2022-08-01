import { VIEW_NAME } from "../../../app/AppConst";
import { configUtils } from "../../../app/ConfigUtils";
import DynamicScrollView from "../../../common/components/DynamicScrollView";
import { eventCenter } from "../../../common/event/EventCenter";
import { heroViewEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { cfg } from "../../../config/config";
import { gamesvr } from "../../../network/lib/protocol";
import HeroUnit from "../../template/HeroUnit";
import ItemHeroGift from "./ItemHeroGift";

const {ccclass, property} = cc._decorator;

@ccclass
export default class HeroGiftView extends cc.Component {
    @property(cc.Prefab)            itemHeroGiftPfb: cc.Prefab = null;
    @property(cc.Node)              itemGiftDescNode: cc.Node = null;
    @property(DynamicScrollView)    giftList: DynamicScrollView = null;

    private _heroId: number = 0;
    private _curSelectGiftId: number = 0;
    private _loadFunc: Function = null;
    private _giftType: number = -1;
    private _heroGifts: cfg.HeroGift[] = null;
    private _isInited: boolean = false;
    private _itemHeroGiftPool: cc.NodePool = new cc.NodePool();
    private _itemGiftDescPool: cc.NodePool = new cc.NodePool();

    onInit(heroId: number, loadSubView?: Function) {
        this._loadFunc = loadSubView;
        this._heroId = heroId;
        this._initData();
        this._initEvents();
        this._initView();
        this._isInited = true;
    }

    private _initEvents() {
        if(this._isInited) return;
        eventCenter.register(heroViewEvent.SELECT_GIFT_SKILL, this, this._recvSelectSkill);
        eventCenter.register(heroViewEvent.GAIN_GIFT, this, this._recvGainGift);
    }

    private _initData() {
        this._giftType = -1;
        let heroUnit: HeroUnit = new HeroUnit(this._heroId);
        if(heroUnit && heroUnit.isHeroBasic) {
            this._heroGifts = configUtils.getHeroGiftConfigsByHeroId(this._heroId);
        } else {
          this._heroGifts = configUtils.getHeroGiftConfigsByHeroId(heroUnit.basicId);
        }
        if(!this._heroGifts || this._heroGifts.length == 0){
            guiManager.showTips(`当前英雄没有天赋配置, heroID = ${this._heroId}`);
        }
        this._giftType = heroUnit.heroCfg.HeroBasicGift;
    }

    onRelease() {
        eventCenter.unregisterAll(this);
        this.giftList.clear();
        this._itemHeroGiftPool.clear();
        this._itemGiftDescPool.clear();
        this._isInited = false;
    }

    private _initView() {
        if(this._giftType == -1 || !this._heroGifts || this._heroGifts.length == 0) return;

        let gifts = this._heroGifts;
        this.giftList.clear();
        this.giftList.init(gifts.length, {
            initItem: (idx: number, node: cc.Node) => {
                let giftID = gifts[idx].HeroGiftId;
                let comp = node.getComponent(ItemHeroGift);
                comp.onInit(giftID, this.onClickGift.bind(this), this._getDescNode.bind(this), this._putDescNode.bind(this));
            },
            releaseItem: (node: cc.Node) => {
                let comp = node.getComponent(ItemHeroGift);
                comp.deInit();
                this._itemHeroGiftPool.put(node);
            },
            getItem: (idx: number):cc.Node => {
                return this._getHeroGiftNode();
            }
        });
    }

    onClickGift(giftId: number) {
        this._curSelectGiftId = giftId;
        this._loadFunc(VIEW_NAME.GIFT_PROPERTY_VIEW, 2, this._curSelectGiftId, this._heroId, this.loadView.bind(this));
    }

    loadView(viewName: string, ...args: any) {
        this._loadFunc && this._loadFunc(viewName, ...args);
    }

    private _recvSelectSkill(eventId: number, msg: gamesvr.SelectGiftSkillRes) {
        let items = this.giftList.getItems();
        if(!items || items.length == 0) return;
        items.some(ele => {
            let comp = ele.node.getComponent(ItemHeroGift);
            if(comp.giftID == msg.GiftID) {
                comp.updateState();
                return true;
            }
            return false;
        });
    }

    private _recvGainGift(event: number, msg: gamesvr.GainGiftRes) {
        if(!this.node.activeInHierarchy) return;
        let items = this.giftList.getItems();
        if(!items || items.length == 0) return;
        items.some(ele => {
            let comp = ele.node.getComponent(ItemHeroGift);
            if(comp.giftID == msg.GiftID) {
                comp.updateState();
                return true;
            }
            return false;
        });
    }

    private _getHeroGiftNode(): cc.Node {
        if(this._itemHeroGiftPool.size() > 0){
            return this._itemHeroGiftPool.get();
        }
        return cc.instantiate(this.itemHeroGiftPfb);
    }

    private _getDescNode(): cc.Node {
        if(this._itemGiftDescPool.size() > 0) {
            return this._itemGiftDescPool.get();
        }

        let node = cc.instantiate(this.itemGiftDescNode);
        node.active = true;
        return node;
    }

    private _putDescNode(node: cc.Node) {
        if(!cc.isValid(node)) return;
        this._itemGiftDescPool.put(node);
    }
}
