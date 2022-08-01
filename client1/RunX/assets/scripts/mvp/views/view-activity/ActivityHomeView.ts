/*
 * @Author: xuyang
 * @Description: 活动页面
 */
import { configManager } from "../../../common/ConfigManager";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { cfg } from "../../../config/config";
import { configUtils } from "../../../app/ConfigUtils";
import { activityUtils } from "../../../app/ActivityUtils";
import ItemActivityList from "./ItemActivityList";
import guiManager from "../../../common/GUIManager";
import engineHook from "../../../app/EngineHook";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ActivityHomeView extends ViewBaseComponent {
    @property(cc.Node) rootNode: cc.Node = null;
    @property(cc.Node) btnRoot: cc.Node = null;

    @property(cc.Prefab) btnTamplate: cc.Prefab = null;
    @property(cc.Prefab) coinNodePrefeb: cc.Prefab = null;
    @property(cc.Node) forbidInputNode: cc.Node = null;

    private _moduleId: number = 0;
    private _partId: number = 0;
    private _activityList: cfg.ActivityList[] = [];
    private _subAtyViews: Map<string, ViewBaseComponent> = null;
    private _itemBtns: ItemActivityList[] = [];
    private _preShowView: {view: ViewBaseComponent, tween: cc.Tween} = {view: null, tween: null};
    private _preHideView: {view: ViewBaseComponent, tween: cc.Tween} = {view: null, tween: null};


    onInit(moduleId: number, partId: number, subId: number) {
        this._moduleId = moduleId;
        this._partId = partId;
        this.registerEvent();

        this.stepWork
        .addTask(()=> {
            guiManager.addCoinNode(this.rootNode, this._moduleId, partId);
        })
        .addTask(()=> {
            this._prepareData();
        })
        .addTask(()=> {
            this._refreshView();
        })
    }

    onRelease() {
        this._itemBtns.forEach(_i => {
            _i.deInit();
            _i.node.removeFromParent();
        });

        this._itemBtns = []
        guiManager.removeCoinNode(this.rootNode);

        let childrens = this._subAtyViews;
        childrens.forEach(child => {
            //不要放到后面移除出节点树，有坑
            child.node.removeFromParent(true);
            child.closeView();
            child.destroy();
        });
        this._subAtyViews.clear();
        eventCenter.unregisterAll(this);
    }

    onRefresh() {
        // this.rootNode.children.forEach(child => {
        //     if (child.getComponent(ViewBaseComponent)) {
        //         child.getComponent(ViewBaseComponent).onRefresh();
        //     }
        // })
    }

    registerEvent() {
    }

    private _onSelectBtn (itemCfg: cfg.ActivityList, idx: number) {
        let cfg = this._activityList[idx];
        let functionCfg = configUtils.getFunctionConfig(cfg.ActiveListFunctionID);
        this._itemBtns.forEach(item=>{
            if (item) {
                item.select = cfg.ActiveListID == item.activityId;
            }
        });

        // 快进之前tween的结果，避免影响本次切换
        if (this._preShowView.tween != null) {
            this._preShowView.tween.stop();
            this._preShowView.view.node.opacity = 255;
            this._preShowView.view.node.active = true;

            this._preShowView.tween = null;
            this._preShowView.view = null;
        }
        if (this._preHideView.tween != null) {
            this._preHideView.tween.stop();
            this._preHideView.view.node.opacity = 255;
            this._preHideView.view.node.active = false;

            this._preHideView.tween = null;
            this._preHideView.view = null;
        }

        if(this._subAtyViews && this._subAtyViews.has(functionCfg.FunctionName)) {
            this._subAtyViews.forEach((value, key) => {
                let isShow = key == functionCfg.FunctionName;
                value.node.active = isShow;
                isShow && value.onRefresh();
            });
            return;
        }

        guiManager.loadView(functionCfg.FunctionName, this.rootNode, cfg.ActiveListID, this).then((view)=>{
            this._subAtyViews = this._subAtyViews || new Map();
            if(!this._subAtyViews.has(functionCfg.FunctionName)){
                this._subAtyViews.set(functionCfg.FunctionName, view);
            }

            this._subAtyViews.forEach((value, key) => {
                // 旧view渐隐，新view隐藏、渐现，进行一个过渡
                let frameTime: number = engineHook.frameInterval;
                let totalTime: number = 15 * frameTime;
                let delayTime: number = 6 * frameTime;
                if (key !== functionCfg.FunctionName && value.node.active === true) {
                    this._preHideView.view = value;
                    this._preHideView.tween = cc.tween(value.node).set({opacity: 255}).to(totalTime, {opacity: 0}).set({active: false, opacity: 255}).start();
                } else if (key === functionCfg.FunctionName) {
                    this._preShowView.view = value;
                    this._preShowView.tween = cc.tween(value.node).set({opacity: 0}).delay(delayTime).to(totalTime - delayTime, {opacity: 255}).start();
                }
            });
        });
    }

    private _prepareData(){
        let cfgs: cfg.ActivityList[] = configManager.getConfigList("activityList");
        this._activityList = cfgs.sort((a, b) => {
            return (a.ActiveListOrder || 0) || (b.ActiveListOrder || 0);
        });
        this._activityList = this._activityList.filter(cfg=>{
            let errInfo = activityUtils.checkMeetCond(cfg.ActiveListFunctionID);
            let moduleOpen = true;
            if (errInfo) {
                moduleOpen = false;
            }
            let meetTime = activityUtils.checkActivityOpen(cfg.ActiveListID);
            return moduleOpen && meetTime;
        });
    }

    private _refreshView(){
        let defaultSelectId = 0;
        if (this._partId) {
            defaultSelectId = this._activityList.findIndex(_cfg => {return _cfg.ActiveListID == this._partId});
        }

        this._activityList.forEach( (_activity, _idx) => {
            let itemNd = cc.instantiate(this.btnTamplate);
            this.btnRoot.addChild(itemNd);
            let item = itemNd.getComponent(ItemActivityList);
            this._itemBtns.push(item)
            item.init(_activity, _idx, (cfg: cfg.ActivityList, idx: number)=> {
                this._onSelectBtn(cfg, idx)
            })
            if (_idx == defaultSelectId) {
                item.select = true;
                this._onSelectBtn(_activity, _idx)
            } else {
                item.select = false;
            }
        });

    }
}