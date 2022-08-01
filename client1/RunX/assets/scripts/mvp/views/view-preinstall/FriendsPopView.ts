import { VIEW_NAME } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { battleUtils } from "../../../app/BattleUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import guiManager from "../../../common/GUIManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import HeroHeadItem from "./HeroHeadItem";

const {ccclass, property} = cc._decorator;

@ccclass
export default class FriendsPopView extends ViewBaseComponent {
    @property(cc.Node)          friendInfos: cc.Node = null;
    @property(cc.Prefab)        itemHeroHeadPfb: cc.Prefab = null;

    private _itemHeads: HeroHeadItem[] = [];
    private _friends: { [k: number]: number[] } = {};
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    onInit(friendIDs: number[]) {
        let friends: { [k: number]: number[] } = {}
        friendIDs.forEach( _f => {
            let skills = battleUtils.getFriendSkillByID(_f);
            if (skills.length > 0)
                friends[_f] = skills
        })
        this._friends = friends;
        this.refreshView();
    }

    onRelease() {
        if(this._spriteLoader) {
            this._spriteLoader.release();
        }

        this._itemHeads.forEach( _h => {
            _h.deInit();
            _h.node.removeFromParent()
        })
        this._itemHeads = []
    }

    refreshView() {
        this.friendInfos.children.forEach(item => {
            item.active = false;
        });
        // 刷新一个Item
        let refreshFriendItem = (friendId: number, friendItem: cc.Node) => {
            let skillIconNode = friendItem.getChildByName('icon').getChildByName('skillIcon');
            let friendsHeadNode: cc.Node = friendItem.getChildByName('friendsHead');
            let skillNameNode: cc.Node = friendItem.getChildByName('skillName');
            let skillIntroduceNode: cc.Node = friendItem.getChildByName('skillIntroduceLb');
            
            let friendCfg: cfg.HeroFriend = configUtils.getHeroFriendConfig(friendId);
            skillNameNode.getComponent(cc.Label).string = friendCfg.HeroFriendName;
            skillIntroduceNode.getComponent(cc.Label).string = friendCfg.HeroFriendIntroduce || '暂无详细介绍';
            let skillIconPath: string = resPathUtils.getSkillIconUrl(friendCfg.HeroFriendIcon);
            this._spriteLoader.changeSprite(skillIconNode.getComponent(cc.Sprite), skillIconPath);
            // 生成羁绊所需要的英雄
            let needHeros = utils.parseStingList(friendCfg.HeroFriendNeedHero);
            friendsHeadNode.removeAllChildren();
            for(let i = 0; i < needHeros.length; ++i) {
                if(needHeros[i] > 0) {
                    let heroItem: cc.Node = cc.instantiate(this.itemHeroHeadPfb);
                    let item = heroItem.getComponent(HeroHeadItem)
                    this._itemHeads.push(item);
                    friendsHeadNode.addChild(heroItem);
                    item.setData(needHeros[i], false, false, (heroID: number)=> {
                        guiManager.loadView(VIEW_NAME.TIPS_HERO, this.node.parent, heroID);
                    });
                }
            }
            friendItem.active = true;
        };
        let friendItemCount: number = 0;
        let tempateItem: cc.Node = this.friendInfos.children[0];
        for(const k in this._friends) {
            let friendId: number = Number(k);
            let friendItem: cc.Node = this.friendInfos.children[friendItemCount];
            if(!friendItem) {
                friendItem = cc.instantiate(tempateItem);
                this.friendInfos.addChild(friendItem);
            }
            refreshFriendItem(friendId, friendItem);
            ++friendItemCount;
        }
    }
}
