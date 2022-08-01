import { utils } from "../../../../app/AppUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { configManager } from "../../../../common/ConfigManager";
import { eventCenter } from "../../../../common/event/EventCenter";
import { guildWarEvent } from "../../../../common/event/EventData";
import guiManager from "../../../../common/GUIManager";
import { ItemBagPool } from "../../../../common/res-manager/NodePool";
import { cfg } from "../../../../config/config";
import ItemBag from "../../view-item/ItemBag";
import ItemGuildInfo from "./ItemGuildInfo";
import ItemProcessComp from "./ItemProcessComp";


const {ccclass, property} = cc._decorator;
@ccclass
export default class GuildWarView extends ViewBaseComponent {

   @property(cc.Prefab) tempNode: cc.Prefab = null;
   @property(cc.Prefab) processComp: cc.Prefab = null;
   @property(cc.Node) selfNode: cc.Node = null;
   @property(cc.Node) enemyNode: cc.Node = null;
   @property(cc.Node) processCompNode: cc.Node = null;
   @property(cc.Layout) winRewardList: cc.Layout = null;
   @property(cc.Layout) failRewardList: cc.Layout = null;

   private _selfGuildItem: ItemGuildInfo = null;
   private _enemyGuildItem: ItemGuildInfo = null;
   private _itemProcessComp: ItemProcessComp = null;

   private _rewardItemBags: ItemBag[] = [];

   onInit(): void {
      this._prepareInit();
      this._rewardsInit();
      this._registerEvent();
   }

   /**页面释放清理*/
   onRelease() {
      eventCenter.unregisterAll(this);
      this._rewardItemBags.forEach(item => {
         ItemBagPool.put(item);
      })
   }

   private _registerEvent() {
      eventCenter.register(guildWarEvent.GUILD_WAR_OVER, this, this._refreshView);
   }

   private _prepareInit() {
      this._selfGuildItem = cc.instantiate(this.tempNode).getComponent(ItemGuildInfo);
      this._enemyGuildItem = cc.instantiate(this.tempNode).getComponent(ItemGuildInfo);
      this._itemProcessComp = cc.instantiate(this.processComp).getComponent(ItemProcessComp);

      if (this._selfGuildItem) {
         this._selfGuildItem.onInit(true);
         this._selfGuildItem.node.parent = this.selfNode
      }

      if (this._enemyGuildItem) {
         this._enemyGuildItem.onInit(false);
         this._enemyGuildItem.node.parent = this.enemyNode
      }
      
      if (this._itemProcessComp) {
         this._itemProcessComp.node.parent = this.processCompNode
      }
      
   }

   private _refreshView() {
      //重置刷新显示
      this._itemProcessComp && this._itemProcessComp.onRefreshShow();
      this._enemyGuildItem && this._enemyGuildItem.onInit(false);
   }

   private _rewardsInit() {
      let addRewardFunc = (cfgStr: string, parent: cc.Node) => {
         let result = utils.parseStingList(cfgStr)
         result.forEach(itemArr => {
            let item = ItemBagPool.get();
            item.node.parent = parent;
            this._rewardItemBags.push(item);
            item.init({
               id: Number(itemArr[0]),
               count: Number(itemArr[0])
            })
            item.node.scale = 0.6;
         })
      }
      
      let winCfg = configUtils.getConfigModule("GuildBattleRewardWinShow");
      let loseCfg = configUtils.getConfigModule("GuildBattleRewardLoseShow");
      addRewardFunc(winCfg,this.winRewardList.node);
      addRewardFunc(loseCfg, this.failRewardList.node);
   }

   onClickEnterWar() {
      guiManager.loadView('GuildWarBattleView', guiManager.sceneNode);
   }
}