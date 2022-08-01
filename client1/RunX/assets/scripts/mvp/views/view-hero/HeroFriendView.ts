import { CustomDialogId, VIEW_NAME } from "../../../app/AppConst";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { configManager } from "../../../common/ConfigManager";
import guiManager from "../../../common/GUIManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { bagData } from "../../models/BagData";
import { pveFakeData } from "../../models/PveFakeData";
import HeroUnit from "../../template/HeroUnit";
import ItemBag from "../view-item/ItemBag";
import TipsHero from "../view-tips/TipsHero";

const {ccclass, property} = cc._decorator;

@ccclass
export default class HeroFriendView extends cc.Component {
    @property(cc.Node)          emptyNode: cc.Node = null;
    @property(cc.Node)          bgNode: cc.Node = null;
    @property(cc.Prefab)        infoTamplate: cc.Prefab = null;
    @property(cc.Node)          infoRoot: cc.Node = null;

    private _heroUnit: HeroUnit = null;
    private _tipsHeroView: TipsHero = null;
    private _friendsList: number[] = [];
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _itemBags: ItemBag[] = [];
    /**是否展示仙缘头像*/
    private _friendOpen: boolean = true;

    onInit(heroId: number, rootNode: cc.Node) {
        let isFake = pveFakeData.fakeHero.hasOwnProperty(heroId);
        this._heroUnit = isFake ? pveFakeData.getFakeHeroById(heroId): new HeroUnit(heroId);
        this._friendsList = this._getFriendsList();
        this.refreshView();
    }

    deInit () {
        this._spriteLoader.release();
        if(cc.isValid(this._tipsHeroView)) {
            this._tipsHeroView.closeView();
            this._tipsHeroView = null;
        }
        this._clearItems();
    }

    onRelease () {
        this.deInit();
    }

    private _clearItems() {
        this._itemBags.forEach(_i => {
            ItemBagPool.put(_i)
        })
        this._itemBags = [];
    }

    refreshView() {
      let commonInfoNode = cc.find('commonInfo', this.node.parent);
      this._clearItems();
      this.infoRoot.removeAllChildren();

        if(this._friendsList.length == 0){
            this.emptyNode.active = true;
            cc.isValid(commonInfoNode) && (commonInfoNode.active = false);
            cc.isValid(this.bgNode) && (this.bgNode.active = false);
            return;
        }
        this.emptyNode.active = false;
        cc.isValid(this.bgNode) && (this.bgNode.active = true);
        cc.isValid(commonInfoNode) && (commonInfoNode.active = true);

        this._friendsList.forEach( fID => {
            let ndTamp = cc.instantiate(this.infoTamplate);
            this.infoRoot.addChild(ndTamp)
            this.showFriend(ndTamp, fID)
        })
    }

    showFriend (item: cc.Node, friendId: number) {
        let friendCfg = configUtils.getHeroFriendConfig(friendId);
        if(!friendCfg) {
            item.removeFromParent();
            return;
        }
        let friendTypeIcon = item.getChildByName('friendTypeIcon'),
            friendsHeads = item.getChildByName('friendHeads'),
            friendTitle = item.getChildByName('friendTitleLb'),
            friendIntroduce = item.getChildByName('friendIntroduceLb');

        //TODO 更换英雄仙缘的类型ICON
        // this._spriteLoader.changeSprite(friendTypeIcon.getComponent(cc.Sprite), url)

        friendTitle.getComponent(cc.Label).string = friendCfg.HeroFriendName;
        friendIntroduce.getComponent(cc.Label).string = friendCfg.HeroFriendIntroduce || '暂无介绍';

        let needHeros = friendCfg.HeroFriendNeedHero.split('|');

        for(let i = 0; i < needHeros.length; ++i) {
            let heroId = Number(needHeros[i]);
            let headItem = friendsHeads.children[i];
            if (!headItem) {
                let headItemComp = ItemBagPool.get();
                headItem = headItemComp.node;
                friendsHeads.addChild(headItem);
                this._itemBags.push(headItemComp);
            }

            let heroUnit = bagData.getHeroById(heroId)
            let isHeroBasic = !!heroUnit;
            let bagCmp = headItem.getComponent(ItemBag);
            let star = isHeroBasic ? heroUnit.star : bagDataUtils.getHeroInitStar(heroId);
            bagCmp.init( {
                id: heroId,
                star:star,
                clickHandler: () => {
                    if (!this._friendOpen &&  heroId != this._heroUnit.basicId) {
                        guiManager.showDialogTips(CustomDialogId.HERO_FRIEND_UNOPEN);
                    }else if(heroId > 0) {
                        this._onClickHeadItem(heroId);
                    }
                }
            })
            if(heroId == 0) {
                bagCmp.showEmptyHero();
                return;
            }

            //英雄不存在背包中
            bagCmp.showBlack(!isHeroBasic);
            if (heroId != this._heroUnit.basicId && !this._friendOpen) {
                //仙缘不被允许显示
                bagCmp.showBlack(!this._friendOpen, 255);    
            }
            
        }
    }

    private _onClickHeadItem (heroId: number) {
        let self = this;
        if(heroId != self._heroUnit.basicId) {
            // todo: 指向已有英雄？假英雄？空英雄？
            let tipsHero = guiManager.checkViewOpenInScene(VIEW_NAME.TIPS_HERO, guiManager.sceneNode);
            if(cc.isValid(tipsHero)) {
                tipsHero.getComponent(TipsHero).onInit(heroId);
            } else {
                guiManager.loadView(VIEW_NAME.TIPS_HERO, guiManager.sceneNode, heroId).then((viewBase) => {
                    self._tipsHeroView = viewBase as TipsHero;
                });
            }
        } else {
            guiManager.showDialogTips(CustomDialogId.HERO_FRIEND_SAME);
        }
    }

    private _getFriendsList(): number[] {
        //修改逻辑-由字段friendOpen控制仙缘是否开启
        if (this._heroUnit && this._heroUnit.heroCfg) {
            let friendId = this._heroUnit.heroCfg.HeroFriendID;    
            let friendCfg:cfg.HeroFriend = configManager.getConfigByKey(`heroFriend`, friendId);
            this._friendOpen = !!(friendCfg?.HeroFriendOpen);
        }

        let friendsList: number[] = [];
        let configs: {[k: number]: cfg.HeroFriend} = configManager.getConfigs('heroFriend');
        for(const k in configs) {
            let cfg = configs[k];
            if(cfg.HeroFriendNeedHero) {
                let needHeros = cfg.HeroFriendNeedHero.split('|');
                if(needHeros.indexOf(this._heroUnit.basicId + '') != -1 && needHeros.indexOf('0') == -1) {
                    friendsList.push(cfg.HeroFriendId);
                }
            }
        }
        return friendsList;
    }
}
