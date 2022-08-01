import { FRIEND_SKILL_ST } from "../../../app/BattleConst";
import { battleUtils } from "../../../app/BattleUtils";
import { configManager } from "../../../common/ConfigManager";
import { gamesvr } from "../../../network/lib/protocol";
import ItemFriendSkill from "./ItemFriendSkill";

const { ccclass, property } = cc._decorator;

@ccclass
export default class FriendSkillComp extends cc.Component {

    @property(cc.Node) addRoot: cc.Node = null;
    @property(cc.Prefab) item: cc.Prefab = null;

    private _items: Map<number, ItemFriendSkill> = new Map();
    private _invalidItems: ItemFriendSkill[] = [];
    private _currLight: number[] = []

    onInit () {

    }

    /**
     * @param select 已选英雄
     * @param candidate 候选英雄
     */
    show (select: number[], candicate: number[], needEffect: boolean = false) {
        let activeSkill = battleUtils.getFriendSkills(select)
        let activeSkillHalf = battleUtils.getFriendSkillsCanAdd(select, candicate)
        this._updateList(activeSkill, activeSkillHalf, needEffect)
    }

    updateTeamBuff (msg: gamesvr.ITeamBuffResult) {
        let cfgs = configManager.getConfigByKV("heroFriend", "HeroFriendSkillBuff", msg.BuffID);
        if (cfgs && cfgs.length > 0 && cfgs[0].HeroFriendId) {
            
            
            let firendID = cfgs[0].HeroFriendId;
            if(!this._items.has(firendID)) return;
            let item: ItemFriendSkill = this._items.get(firendID);
            if(!cc.isValid(item) || !item.node.active || item.friendID != firendID) return;
            item.updateBuff(msg);
        }
    }

    deInit () {
        this._items.forEach(ele => {
            if (cc.isValid(ele)) {
                ele.deInit();
                ele.node.removeFromParent();
                this._invalidItems.push(ele);
            }
        });
        this._items.clear();
        this._invalidItems.forEach(ele => {
            ele.destroy();
        });
        this._invalidItems.length = 0;
    }

    private _updateList (actived: number[], canActive: number[], needEffect: boolean = false) {
        let invalidFriends: number[] = [];
        //删除没用的技能
        this._items.forEach((value, key) => {
            if(actived.indexOf(key) == -1 && canActive.indexOf(key) == -1){
              invalidFriends.push(key);
            }
        });

        invalidFriends.forEach(ele => {
            let item = this._items.get(ele);
            item.deInit()
            item.node.removeFromParent();
            this._invalidItems.push(item);
            this._items.delete(ele);
        });

        actived.forEach( _skillId => {
            if(this._items.has(_skillId)){
                let item = this._items.get(_skillId);
                item.curState == FRIEND_SKILL_ST.HALF_ACTIVE && item.showInPrepare(_skillId, FRIEND_SKILL_ST.ACTIVE, needEffect);
            }else{
                let item = this._getItem();
                this._items.set(_skillId, item);
                item.showInPrepare(_skillId, FRIEND_SKILL_ST.ACTIVE, needEffect)
            }
        })

        canActive.forEach( _skillId => {
            if(this._items.has(_skillId)){
                let item = this._items.get(_skillId);
                item.curState == FRIEND_SKILL_ST.ACTIVE && item.showInPrepare(_skillId, FRIEND_SKILL_ST.HALF_ACTIVE, needEffect);
            }else{
                let item = this._getItem();
                this._items.set(_skillId, item);
                item.showInPrepare(_skillId, FRIEND_SKILL_ST.HALF_ACTIVE, needEffect)
            }
        })
        this._currLight = actived
    }

    private _getItem ():ItemFriendSkill {
        let item:ItemFriendSkill = null;
        if(this._invalidItems.length == 0){
            let node = cc.instantiate(this.item);
            item = node.getComponent(ItemFriendSkill);
        } else {
            item = this._invalidItems.pop();
        }
        this.addRoot.addChild(item.node);
        item.node.active = true;
        return item;
    }

    canShowSkill () {
        return this._currLight.length > 0
    }

    get friendIDs () {
        return this._currLight;
    }

}
