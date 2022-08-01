import { HEAD_ICON } from "../../../app/AppEnums";
import { utils } from "../../../app/AppUtils";
import { ROLE_TYPE } from "../../../app/BattleConst";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import List from "../../../common/components/List";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { battleEvent, timeLimitEvent } from "../../../common/event/EventData";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { UIRoleData } from "../../../app/BattleType";
import { gamesvr } from "../../../network/lib/protocol";
import BattleScene from "../view-scene/BattleScene";
import { battleUIOpt } from "../../operations/BattleUIOpt";

const enum WATCH_TYPE {
    SKILL,
    BUFF
}

interface BUFF_INFO {
    heroId: number,
    buffs: gamesvr.IBuff[]
}

const Item_Buff_Height = 96;
const Template_Buff_Item_Height = 76;

const {ccclass, property} = cc._decorator;

@ccclass
export default class BattleWatchBuffView extends ViewBaseComponent {
    @property([cc.Node]) emptyTips: cc.Node[] = [];
    @property([cc.Node]) emptyLabelTip: cc.Node[] = [];
    @property([List]) lists: List[] = [];

    private _game: BattleScene = null;
    private _roleType: ROLE_TYPE = ROLE_TYPE.HERO;
    private _roles: UIRoleData[] = [];
    private _friends: number[] = [];
    private _pragmatics: number[] = [];
    private _buffs: BUFF_INFO[] = [];
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    onInit(roleType: ROLE_TYPE, gameCtr: BattleScene) {
        this._roleType = roleType;
        this._game = gameCtr;
        eventCenter.register(battleEvent.CLOSE_BATTLE_POP, this, this.closeView);
        this._dueData();
        this._refreshView();
    }

    onRelease() {
        battleUIOpt.continue()
        this._spriteLoader.release();
        eventCenter.unregisterAll(this);
    }

    private _dueData() {
        if(ROLE_TYPE.HERO == this._roleType) {
            this._roles = this._game.heroCtrl.getAllRoles().filter(_h => { return _h.hp > 0; });
        } else {
            this._roles = this._game.monsterCtrl.getAllRoles().filter(_m => { return _m.hp > 0; });
        }
        this._friends = this._getFriendSkills();
        // 当前版本只显示仙缘
        this._pragmatics = [];// this._getPragmaticSkills();
        this._buffs = [];//this._getBuffs();
    }

    private _refreshView() {
        this.emptyLabelTip[WATCH_TYPE.SKILL].active = this._friends.length + this._pragmatics.length <= 0;
        this.emptyTips[WATCH_TYPE.SKILL].active = this._friends.length + this._pragmatics.length <= 0;
        this.emptyLabelTip[WATCH_TYPE.BUFF].active = this._buffs.length <= 0;
        this.emptyTips[WATCH_TYPE.BUFF].active = this._buffs.length <= 0;

        let frinedList = this.lists[WATCH_TYPE.SKILL];
        frinedList.numItems = this._friends.length + this._pragmatics.length;


        let buffList = this.lists[WATCH_TYPE.BUFF];
        buffList.numItems = this._buffs.length;
    }

    onFriendItemRender(item: cc.Node, index: number) {
        let isFriend: boolean = index < this._friends.length;
        if(isFriend) {
            let frinedId = this._friends[index];
            let friendCfg = configUtils.getHeroFriendConfig(frinedId);
            if(friendCfg) {
                let newNode = item.children[0];
                let title = newNode.children[0];
                let friendIcon = newNode.getChildByName('friendIcon');
                let introduce = item.children[1];
                title.getComponent(cc.Label).string = `${friendCfg.HeroFriendName}`;
                introduce.getComponent(cc.Label).string = `${friendCfg.HeroFriendIntroduce}`;
                let friendIconUrl = resPathUtils.getSkillIconUrl(friendCfg.HeroFriendIcon);
                this._spriteLoader.changeSprite(friendIcon.getComponent(cc.Sprite), friendIconUrl);
            }
        } else {
            // TODO 刷新修炼技能展示
        }
    }

    onPragmaticItemRender(item: cc.Node, index: number) {
        
    }

    onBuffItemRender(item: cc.Node, index: number) {
        let buffInfo = this._buffs[index];
        let heroHead = item.getChildByName('herohead').getChildByName('headIcon');
        let modelCfg = this._getModelCfg(buffInfo.heroId);
        if(modelCfg) {
            let url = resPathUtils.getHeroCircleHeadIcon(modelCfg.ModelId, HEAD_ICON.CIRCLE);
            this._spriteLoader.changeSprite(heroHead.getComponent(cc.Sprite), url);
        }

        let buffsParent = item.getChildByName('buffs');
        let tempateBuffItem = buffsParent.getChildByName('templateBuff');
        let buffs = this._buffs[index].buffs;
        let count = buffs.length >= buffsParent.childrenCount - 1 ? buffs.length : buffsParent.childrenCount - 1;
        for(let i = 0; i < count; ++i) {
            let itemBuff = buffsParent.children[i + 1];
            let buff = buffInfo.buffs[i];
            if(i < buffs.length) {
                if(!itemBuff) {
                    itemBuff = cc.instantiate(tempateBuffItem);
                    buffsParent.addChild(itemBuff);
                }
                itemBuff.active = true;
                itemBuff.y = i * (-itemBuff.height - 2);

                let buffNode = itemBuff.getChildByName('icon');
                let introduce = itemBuff.getChildByName('introduce');
                let buffCount = buffNode.getChildByName('count');
                let buffIcon = buffNode.getChildByName('buffIcon');
                let buffCfg = configUtils.getBuffConfig(buffs[i].ID);
                buffCount.getComponent(cc.Label).string = `${!!buff.Count ? buff.Count : 0}`;
                introduce.getComponent(cc.Label).string = `${buffCfg.Illustrate}`;
                let url = resPathUtils.getSkillIconUrl(buffCfg.Icon);
                this._spriteLoader.changeSprite(buffIcon.getComponent(cc.Sprite), url);
            } else {
                cc.isValid(itemBuff) && (itemBuff.active = false);
            }
        }
        item.height = tempateBuffItem.height * count;
        let line = item.getChildByName('line');
        line.y =  -(Item_Buff_Height - Template_Buff_Item_Height + tempateBuffItem.height * count + 2);
    }

    private _getFriendSkills(): number[] {
        let friends: number[] = [];
        for(let i = 0; i < this._roles.length; ++i) {
            let heroId = this._roles[i].id;
            let herocfg = configUtils.getHeroBasicConfig(heroId);
            if(herocfg && herocfg.HeroFriendID) {
                if(this._checkFriendIsActivity(herocfg.HeroFriendID) && friends.indexOf(herocfg.HeroFriendID) == -1) {
                    friends.push(herocfg.HeroFriendID);
                }
            }
        }
        return friends;
    }

    private _getPragmaticSkills(): number[] {
        // TODO 获得修炼带来技能
        return [];
    }

    private _checkFriendIsActivity(friendId: number) {
        let friendCfg: cfg.HeroFriend = configUtils.getHeroFriendConfig(friendId);
        if (!friendCfg || !friendCfg.HeroFriendNeedHero) {
            return false;
        }
        let findCount: number = 0;
        let friends = utils.parseStingList(friendCfg.HeroFriendNeedHero);
        for(let i = 0; i < friends.length; ++i) {
            let heroId: number = Number(friends[i]);
            if (heroId > 0) {
                if(this._roles.findIndex(_r => { return _r.id == heroId; } ) > -1) {
                    ++findCount;
                }
            } else {
                return false;
            }
        }
        return findCount >= friends.length;
    }

    private _getBuffs(): BUFF_INFO[] {
        let buffs: BUFF_INFO[] = [];
        for(let i = 0; i < this._roles.length; ++i) {
            let buffList = this._roles[i].buffList;
            let tempBuffs: gamesvr.IBuff[] = [];
            for(let j = 0; j < buffList.length; ++j) {
                if(!!buffList[j].ID && !!buffList[j].Count) {
                    let buffCfg = configUtils.getBuffConfig(buffList[j].ID);
                    if(buffCfg && !!buffCfg.IfExhibition) {
                        tempBuffs.push(buffList[j]);
                    }
                }
            }
            if(tempBuffs.length > 0) {
                buffs.push({
                    heroId: this._roles[i].id,
                    buffs: tempBuffs
                });
            }
        }
        return buffs;
    }

    private _getModelCfg(id: number): cfg.Model {
        let modelId: number = 0;
        let heroCfg = configUtils.getHeroBasicConfig(id);
        if(heroCfg) {
            modelId = heroCfg.HeroBasicModel;
        } else {
            let monsterCfg = configUtils.getMonsterConfig(id);
            if(monsterCfg) {
                modelId = monsterCfg.ModelId;
            }
        }
        let modelCfg = configUtils.getModelConfig(modelId);
        return modelCfg;
    }
}
