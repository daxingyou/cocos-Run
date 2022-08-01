/*
 * @Author: xuyang
 * @Date: 2021-06-19 15:02:26
 * @Description: 商店主界面
 */
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { cfg } from "../../../config/config";
import { bagData } from "../../models/BagData";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { configUtils } from "../../../app/ConfigUtils";
import { eventCenter } from "../../../common/event/EventCenter";
import { taskEvent } from "../../../common/event/EventData";
import { gamesvr } from "../../../network/lib/protocol";
import { VIEW_NAME } from "../../../app/AppConst";
import { taskData } from "../../models/TaskData";
import { redDotMgr, RED_DOT_MODULE } from "../../../common/RedDotManager";
import ItemTask from "../view-task/ItemTask";
import guiManager from "../../../common/GUIManager";
import ItemHeroShow from "../view-item/ItemHeroShow";
import HeroUnit from "../../template/HeroUnit";
import HeroSkillView from "../view-hero/HeroSkillView";
import { ALLTYPE_TYPE } from "../../../app/AppEnums";
import GetAllRewardBtn from "../view-common/GetAllRewardBtn";
import { taskDataOpt } from "../../operations/TaskDataOpt";
import HeroFriendView from "../view-hero/HeroFriendView";
import ItemPropAccess from "../view-bag/ItemPropAccess";
const { ccclass, property } = cc._decorator;

enum PAGE_TYPE {
    PROP, //属性页
    LUCKY //仙缘
}

@ccclass
export default class HandBookHeroView extends ViewBaseComponent {
    @property(ItemHeroShow) heroShow: ItemHeroShow = null;
    @property(cc.Label) nameLb: cc.Label = null;
    @property(cc.Sprite) qualityIconSp: cc.Sprite = null;
    @property(cc.Sprite) trigramsSp: cc.Sprite = null;
    @property(cc.Sprite) equipTypeSp: cc.Sprite = null;
    @property(cc.Sprite) abilityTypeSp: cc.Sprite = null;
    @property(HeroSkillView) heroSkillView: HeroSkillView = null;
    @property(cc.Node) starsNode: cc.Node = null;
    @property(cc.Node) accessNode: cc.Node = null;
    @property(cc.Node) taskNode: cc.Node = null;
    @property(cc.Prefab) itemProcess: cc.Prefab = null; 
    @property(cc.Prefab) itemTask: cc.Prefab = null; 
    @property(cc.Node)  getAllBtn: cc.Node = null;
    @property(cc.Node)  friendView: cc.Node = null;
    @property(cc.Node)  propView: cc.Node = null;

    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _moduleId: number = 0;
    private _heroId: number = 0; 
    private _heroCfg: cfg.HandBook = null; 
    private _taskList: number[] = null;
    private _friendViewInited: boolean = false;
    private _propViewInited: boolean = false;
    private _heroList: number[] = null;
    private _heroIdxInList: number = -1;

    private _currPage: PAGE_TYPE = PAGE_TYPE.PROP;
    private _itemTaskPool: cc.NodePool = null;


    onInit(moduleId: number, heroId: number, heroList: number[]) {
        this._moduleId = moduleId;
        this._heroId = heroId;
        this._heroList = heroList;
        this._heroCfg = configUtils.getHandBookCfgByHeroID(heroId);
        this._itemTaskPool = this._itemTaskPool || new cc.NodePool(ItemTask);
        this._refreshHeroView();
        this._switchView();
        this._addEvent();
    }

    deInit() {
        this._spriteLoader.release();
        this.friendView.getComponent(HeroFriendView).deInit();
        this.clearTaskItems();
        this.clearAccessItems();
    }

    clearTaskItems(){
        let usedTaslItems: cc.Node[] = [...this.taskNode.children];
        usedTaslItems.forEach(ele => {
            if(!cc.isValid(ele)) return;
            this._itemTaskPool.put(ele);
        });
        this._itemTaskPool.clear();
    }

    clearAccessItems() {
        for (let k = 0; k < this.accessNode.childrenCount; k++) {
            let child = this.accessNode.children[k];
            let comp = child.getComponent(ItemPropAccess);
            if (comp) {
                comp.deInit();
            }
            child.removeFromParent();
            child.destroy();
        }
    }

    onClickSwitch(target:cc.Event, offset: string) {
        let heroList = this._getHeroList();
        if(this._heroIdxInList == -1) {
            this._heroIdxInList = heroList.findIndex(heroID =>{
                return heroID == this._heroId;
            })
        }
        let heroIdx  = this._heroIdxInList;
        heroIdx += parseInt(offset);
        if(heroIdx < 0) heroIdx += heroList.length;
        this._heroIdxInList = heroIdx = heroIdx % heroList.length
        this._heroCfg = configUtils.getHandBookCfgByHeroID(heroList[this._heroIdxInList]);
        this.changeHero(this._heroCfg.HandBookHeroID);
    }

    onListRender(item: cc.Node, idx: number) {
     
    }

    changeHero(hero: number){
        if(!hero || this._heroId == hero) return;
        this._friendViewInited = false;
        this._propViewInited = false;
        this._heroId = hero;
        this._refreshHeroView();
        if( PAGE_TYPE.PROP == this._currPage){
            this._refreshPropView();
            return;
        }

         if(PAGE_TYPE.LUCKY == this._currPage){
            this._refreshFriendView();
         }
    }

    private _addEvent(){
        eventCenter.register(taskEvent.RECEIVE_REWARD, this, this._recvTaskReceiveReward);
    }

    private _switchView(){
        //属性
        if(PAGE_TYPE.PROP == this._currPage){
            this.friendView.active = false;
            this.propView.active = true;
            if(this._propViewInited) return;
            this._refreshPropView();
            return;
        }

        //仙缘
        if(PAGE_TYPE.LUCKY == this._currPage){
            this.friendView.active = true;
            this.propView.active = false;
            if(this._friendViewInited) return;
            this._refreshFriendView();
        }
    }

    private _refreshFriendView(){
        this._friendViewInited = true;
        this.friendView.getComponent(HeroFriendView).onInit(this._heroId, null);
    }

    private _refreshPropView(){
        this._propViewInited = true;
        // 技能详情
        this.heroSkillView.onlyShow = true;
        this.heroSkillView.onInit(this._heroId, this._loadSubView);
        this.scheduleOnce(()=>{
            // 获取途径
            this._refreshAccessInfo();
            // 英雄任务
            this._refreshTaskView();
        }, 0)
    }

    private _refreshHeroView(){
        let heroUnit = bagData.getHeroById(this._heroId) || new HeroUnit(this._heroId);
        this.heroShow.onInit(heroUnit.heroCfg.HeroBasicModel);
        this.nameLb.string = `${heroUnit.heroCfg.HeroBasicName}`;
        this._spriteLoader.changeSprite(this.qualityIconSp, resPathUtils.getHeroPropertyQualityIcon(heroUnit.heroCfg.HeroBasicQuality));
        // 更换卦象icon
        let trigramsAllTypeConfig = configUtils.getAllTypeConfig(ALLTYPE_TYPE.HERO_TRIGRAMS, heroUnit.heroCfg.HeroBasicTrigrams);
        this._spriteLoader.changeSprite(this.trigramsSp, resPathUtils.getHeroAllTypeIconUrl(trigramsAllTypeConfig.HeroTypeIcon));

        // 更换装备类型icon
        let heroEquipTypeAllTypeConfig = configUtils.getAllTypeConfig(ALLTYPE_TYPE.HERO_EQUIP_TYPE, heroUnit.heroCfg.HeroBasicEquipType);
        this._spriteLoader.changeSprite(this.equipTypeSp, resPathUtils.getHeroAllTypeIconUrl(heroEquipTypeAllTypeConfig.HeroTypeIcon));

        // 英雄定位
        let heroAbilityAllTypeConfig = configUtils.getAllTypeConfig(ALLTYPE_TYPE.HERO_ABILITY, heroUnit.heroCfg.HeroBasicAbility);
        this._spriteLoader.changeSprite(this.abilityTypeSp, resPathUtils.getHeroAllTypeIconUrl(heroAbilityAllTypeConfig.HeroTypeIcon2));

        // 星级
        for (let i = 0; i < this.starsNode.childrenCount; ++i) {
            this.starsNode.children[i].active = i < heroUnit.star;
        }
    }

    private _updateTaskData(){
        let taskList = (this._heroCfg.HandBookHeroTask || "").split(";")
        .map((_tId=>{return Number(_tId)}))
        .sort((_a, _b) => {
            let aCompleted: boolean = taskData.getTaskIsCompleted(_a);
            let aReceivedReward: boolean = taskData.getTaskIsReceiveReward(_a);
            let bCompleted: boolean = taskData.getTaskIsCompleted(_b);
            let bReceivedReward: boolean = taskData.getTaskIsReceiveReward(_b);
            let a = aReceivedReward ? 3 : (aCompleted ? 1 : 2);
            let b = bReceivedReward ? 3 : (bCompleted ? 1 : 2);
            if (a == b) {
                return _a - _b;
            } else {
                return a - b;
            }
        });
        this._taskList = taskList;
    }

    private _updateTaskView() {
        if(!this.itemTask) return;

        let taskList = this._taskList;
        let taskCnt = taskList && taskList.length || 0;
        let childrenCount = this.taskNode.childrenCount;

        taskList.forEach((ele, idx) => {
            let itemNode = this.taskNode.children[idx] || this._getTaskItem();
            let taskCfg = configManager.getConfigByKey('task', ele || -1);
            if(!taskCfg) return;
            let taskCmp = itemNode.getComponent(ItemTask);
            taskCmp && taskCmp.onInit(taskCfg);
            !itemNode.parent && this.taskNode.addChild(itemNode);
        });

        if(childrenCount > taskCnt){
            let surplusItems = this.taskNode.children.slice(taskCnt);
            surplusItems.forEach(ele => {
                let taskCmp = ele.getComponent(ItemTask);
                taskCmp && this._itemTaskPool.put(ele);
            });
        }
    }

    private _refreshAccessInfo() {
        let accessList = (this._heroCfg.HandBookHeroGetAccess || "").split(";");
        this.accessNode.removeAllChildren();
        if (accessList.length > 0 && this.itemProcess) {
            accessList.forEach((access, index) => {
                let itemNode = this.accessNode.children[index] || cc.instantiate(this.itemProcess);
                let cfg = configUtils.getAccessConfig(Number(access) || -1);
                if (cfg) {
                    !itemNode.parent && (itemNode.parent = this.accessNode);
                    itemNode.getComponent("ItemPropAccess").parent = this;
                    itemNode.getComponent("ItemPropAccess").jumpPage = access;
                }
            })
        }
    }

    private _loadSubView(name: string, viewType: number, ...args: any) {
        if (viewType == 1) {
            guiManager.loadModuleView(name, ...args);
        } else {
            guiManager.loadView(name, this.node, ...args);
        }
    }

    private _recvTaskReceiveReward(eventId: number, msg: gamesvr.TaskTargetReceiveRewardRes){
        if (msg && msg.Prizes){
            this.loadSubView(VIEW_NAME.GET_ITEM_VIEW, msg.Prizes);
            this._refreshTaskView();
            redDotMgr.fire(RED_DOT_MODULE.MAIN_HERO_HANDBOOK);
        }
    }


    private _refreshTaskView(){
        this._updateTaskData();
        this._updateTaskView();
        this._updateGetAllRewardBtn();
    }

    onRelease(){
        eventCenter.unregisterAll(this);
        this._heroIdxInList = -1;
        this.deInit();
        this.releaseSubView();
        this.heroSkillView.onRelease();
        this.friendView.getComponent(HeroFriendView).deInit();
    }

    onSwitchView(toggle: cc.Toggle, data: string){
        let pageType = parseInt(data);
        if(this._currPage == pageType) return;
        this._currPage = pageType;
        this._switchView();
    }

     //一键领取
     onClickAutoTake(){
          let completedTasks = this._getReceivebleTasks()
          if(!completedTasks || completedTasks.length == 0){
              this.getAllBtn.getComponent(GetAllRewardBtn).showNotReward();
              return;
          }
          taskDataOpt.sendReceiveTaskReward(completedTasks);
      }

      //更新一键领取按钮状态
      private _updateGetAllRewardBtn(){
          let completedTasks = this._getReceivebleTasks()
          this.getAllBtn.getComponent(GetAllRewardBtn).gray = !(completedTasks && completedTasks.length > 0);
      }

      //获取可领取的任务列表
      private _getReceivebleTasks(): number[]{
          if(!this._taskList || this._taskList.length == 0) return null;
          let tasks: number[] = [];
          this._taskList.forEach(ele => {
              let aCompleted: boolean = taskData.getTaskIsCompleted(ele);
              let aReceivedReward: boolean = taskData.getTaskIsReceiveReward(ele);
              if(aCompleted && !aReceivedReward)
                tasks.push(ele);
          });
          return tasks;
      }

      private _getTaskItem(){
          if(this._itemTaskPool.size() > 0) return this._itemTaskPool.get();
          let node = cc.instantiate(this.itemTask);
          return node;
      }

    private _getHeroList() {
          if(this._heroList) return this._heroList;
          let allHeros = configManager.getConfigs("handBook");
          for(let key in allHeros) {
              if(allHeros.hasOwnProperty(key) && allHeros[key] && allHeros[key]['HandBookHeroID'] && allHeros[key]['HandBookOpen']) {
                  this._heroList = this._heroList || [];
                  this._heroList.push(parseInt(key));
              }
          }

          this._heroList.sort((_heroA, _heroB) => {
              let heroACfg: cfg.HandBook = configUtils.getHandBookCfgByHeroID(_heroA);
              let heroBCfg: cfg.HandBook = configUtils.getHandBookCfgByHeroID(_heroB);
              return (heroACfg.HandBookHeroOrder || 0) - (heroBCfg.HandBookHeroOrder || 0);
          });
          return this._heroList;
    }
}
