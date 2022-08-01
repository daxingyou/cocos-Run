import { utils } from "../../../../app/AppUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import List from "../../../../common/components/List";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { configManager } from "../../../../common/ConfigManager";
import { eventCenter } from "../../../../common/event/EventCenter";
import { guildWarEvent } from "../../../../common/event/EventData";
import guiManager from "../../../../common/GUIManager";
import { ItemBagPool } from "../../../../common/res-manager/NodePool";
import { cfg } from "../../../../config/config";
import { guildData } from "../../../models/GuildData";
import { userData } from "../../../models/UserData";
import ItemBag from "../../view-item/ItemBag";
import { BUILD_CFG, BUILD_OWNER, BUILD_STATE, CAMP_CFG } from "./GuildWarCommon";
import ItemGuildWarBuild from "./ItemGuildWarBuild";

const {ccclass, property} = cc._decorator;
@ccclass
export default class GuildWarBuildView extends ViewBaseComponent {
    @property(cc.Sprite) buildSp: cc.Sprite = null;
    @property(cc.Label) buildName: cc.Label = null;
    @property(cc.Label) tips: cc.Label = null;
    @property(cc.Label) attackCountLb: cc.Label = null;
    @property(cc.Label) defendTitle: cc.Label = null;
    @property(cc.Label) title: cc.Label = null;
    @property(cc.Layout) rewardLayout: cc.Layout = null;

    @property(cc.Node) fireNode: cc.Node = null;

    @property(List) defenceList: List = null

    //进攻节点
    @property(cc.Node) chapterNode: cc.Node = null;

    private _rewards: ItemBag[] = [];
    private _buildCfg: BUILD_CFG = null;

    onInit(param: BUILD_CFG): void {
        this._buildCfg = param;

        this._refreshLb();
        this._registerEvent();
        this._initReward();
        this._checkFireOptPermision();
    }

    /**页面释放清理*/
    onRelease() {
        eventCenter.unregisterAll(this);
        this._rewards.forEach(item => {
            ItemBagPool.put(item);
        })
        this.defenceList._deInit();
    }

    /**页面来回跳转刷新*/
    onRefresh(): void {

    }

    private _refreshLb() {
        this.title.string = this._buildCfg.OwnTag == BUILD_OWNER.ENEMY ? `敌方建筑` : `我方建筑`;
        if (this._buildCfg.OwnTag == BUILD_OWNER.SELF) {
            this.chapterNode.active = false;
        }

        let buildCfg: cfg.GuildBattleBuild = configManager.getConfigByKey("guildBattleBuild", this._buildCfg.Idx);
        if (!buildCfg) return;
        this.buildName.string = buildCfg.GuildBattleBuildName;
        this.defendTitle.string = `营地驻防 (${buildCfg.GuildBattleBuildCamp}/${buildCfg.GuildBattleBuildCamp})`;

        this.defenceList.numItems = buildCfg.GuildBattleBuildCamp;

        //集火显示
        let fireLb = this.fireNode.getComponentInChildren(cc.Label);
        if (!fireLb) return;
        fireLb.string = this._buildCfg.FireTag ? '取消集火' : '集火';
    }

    onDefendRender(defend: cc.Node, idx: number) {
        //先随机状态 展示
        // let random = Math.floor(Math.random() * 3), state = BUILD_STATE.DEFEND;
        // switch (random) {
        //     case 0: state = BUILD_STATE.DEFEND; break;
        //     case 1: state = BUILD_STATE.DESTROY; break;
        //     case 2: state = BUILD_STATE.EMPTY; break;
        // }
        let state = BUILD_STATE.EMPTY;
        let defendComp = defend.getComponent(ItemGuildWarBuild);
        if (!defendComp) return;
        let param: CAMP_CFG = {
            OwnTag: this._buildCfg.OwnTag,
            Idx: idx,
            BuildState:state,
        }
        defendComp.onInit(param);
    }

    private _initReward() {
        let str = configUtils.getModuleConfigs()?.GuildBattleRewardFightShow || "";
        let rewards = utils.parseStingList(str);
        rewards.forEach(gits => {
            let itemBag = ItemBagPool.get();
            itemBag.node.parent = this.rewardLayout.node;
            itemBag.init({
                id: Number(gits[0]),
                count: Number(gits[1]),
            })
            this._rewards.push(itemBag);
        })
    }

    private _registerEvent() {
        eventCenter.register(guildWarEvent.TEAR_DOWN_SUCC, this, this._tearDownRes);
        eventCenter.register(guildWarEvent.OPEN_CAMP_NTF, this, this._openCampOptView);
    }

    /**集火判定逻辑*/
    private _checkFireOptPermision() {
        //自己家的建筑不显示
        if (this._buildCfg.OwnTag == BUILD_OWNER.SELF) {
            this.fireNode.active = false
            return;
        }
        //权限不够不显示
        let guildID = guildData.getMemberTypeByUid(userData.uId);
        let guildRoleCfg: cfg.GuildRole = configManager.getConfigByKey("guildRole", guildID);
        if (!guildRoleCfg) {
            this.fireNode.active = false;
            return;
        }
        let permision = guildRoleCfg.GuildRoleBattleAttack;
            
        this.fireNode.active = (permision && permision == 1);
    }

    /**集火请求*/
    onFireEvent() {
        let fireIdx = this._buildCfg.Idx;
        //取消集火
        if (this._buildCfg.FireTag) {
            fireIdx = -1;
        }
        //先跳过请求阶段
        eventCenter.fire(guildWarEvent.FIRE_TARGET_CHOSE_RES, fireIdx);
        this.closeView();
    }

    private _tearDownRes(cmd:any,idx:number) {
        let item = this.defenceList.getItemByListId(idx);
        if (!item) return;
        let comp:ItemGuildWarBuild = item.getComponent(ItemGuildWarBuild);
    }

    /**打开换防页面
     * @param user 是否存在原本的防守人员
    */
    private _openCampOptView(cmd:any,user:CAMP_CFG) {
        // this.loadSubView("GuildWarCampOptView", user);
        guiManager.loadView("GuildWarCampOptView", guiManager.sceneNode, user);
    }
}