/*
 * @Author: xuyang
 * @Date: 2021-07-05 19:17:31
 * @Description: PVE 试炼玩法主界面
 */
import { PVE_LIST_TITLE } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { NODE_LOCK_TYPE, NODE_OPEN_CONDI_TYPE } from "../../../common/components/LinearSortContainor";
import List from "../../../common/components/List";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configCache } from "../../../common/ConfigCache";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { bagDataEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { RED_DOT_MODULE } from "../../../common/RedDotManager";
import StepWork from "../../../common/step-work/StepWork";
import { cfg } from "../../../config/config";
import { taskData } from "../../models/TaskData";
import { userData } from "../../models/UserData";
import ItemRedDot from "../view-item/ItemRedDot";
import PVEListItem from "./PVEListItem";
const { ccclass, property } = cc._decorator;

const PER_FRAME_CREAT_CNT = 2;

@ccclass
export default class PVEHomeView extends ViewBaseComponent {
    @property(List) listView: List = null;
    @property(cc.ToggleContainer) togContainor: cc.ToggleContainer  = null;
    @property(cc.Node) linesContainor: cc.Node = null;
    @property(cc.Node) lineTemplate: cc.Node = null;
    @property(cc.Node) toggleTemplate: cc.Node = null;
    private _pveList: cfg.PVEList[] = [];       //PVE数据列表
    private _pveType: number = 0;
    private _curCheckTog: cc.Toggle = null; //当前选中的toggle

    private _itemList: cc.Node[] = null;
    private _itemRedDots: ItemRedDot[] = null;

    preInit(...rest: any[]): Promise<boolean> {
        guiManager.addCoinNode(this.node);
        return new Promise((resolve, reject) => {
            let pveCaches = configCache.getPVEListCfgs();
            let itemCnt = pveCaches ? pveCaches.size : 0;
            if(itemCnt == 0) {
                resolve(true);
                return;
            }

            let stepWork = new StepWork();
            let types = pveCaches.keys();
            let spaceY = 6;
            for(let i = 0; i < itemCnt; i += PER_FRAME_CREAT_CNT) {
                let cnt = Math.min(i + PER_FRAME_CREAT_CNT, itemCnt) - i;
                stepWork.addTask(() => {
                    for(let j = 0; j < cnt; j++) {
                        let pveType: number = types.next().value;
                        this._createPVEItem(pveType);
                    }
                })
            }
            stepWork.start(() => {
                resolve(true);
            });
        });
    }

    onInit() {
        this._pveType = 1;
        this.togContainor.toggleItems.forEach(ele => {
            if(parseInt(ele.node.name) == this._pveType){
                this._curCheckTog = ele;
                ele.isChecked = true;
                ele.interactable = false;
            } else {
                ele.interactable = true;
            }
        });
        this._prepareData();
        this.refreshListView();
        this._registerEvents();
    }

    private _registerEvents() {
        //有道具、材料发生改变，直接刷新界面
        eventCenter.register(bagDataEvent.ITEM_CHANGE, this, this._onItemChangeCb);
    }

    onRelease() {
        eventCenter.unregisterAll(this);
        if(this._itemRedDots) {
            this._itemRedDots.forEach(ele => {
                ele.deInit();
            });
            this._itemRedDots.length = 0;
        }

        this._itemList && (this._itemList.length = 0);
        guiManager.removeCoinNode(this.node);
        this.releaseSubView();
        this.listView._deInit();
    }

    onToggleChecked(toggle: cc.Toggle) {
        if(this._curCheckTog == toggle) return;

        let lastToggle = this._curCheckTog;
        this._curCheckTog = toggle;
        lastToggle && (lastToggle.interactable = true);
        this._curCheckTog.interactable = false;
        this._pveType = parseInt(toggle.node.name);

        this._prepareData();
        this.refreshListView(0.01);
    }

    onListRender(itemNode: cc.Node, idx: number) {
        let item = itemNode.getComponent(PVEListItem);
        item.init(this._pveList[idx]);
        itemNode.active = true;
    }

    private _createPVEItem(pveType: number) {
        let spaceY = 6;
        this._itemList = this._itemList || [];
        let itemNode = cc.instantiate(this.toggleTemplate);
        let itemH = itemNode.height;
        itemNode.parent = this.togContainor.node;
        itemNode.active = true;
        let labelComp = itemNode.getChildByName('label').getComponent(cc.Label);
        labelComp.string = (PVE_LIST_TITLE[`${pveType}`] as string);
        let itemRedDot = itemNode.getChildByName('ItemRedDot').getComponent(ItemRedDot);
        this._itemRedDots = this._itemRedDots || [];
        this._itemRedDots.push(itemRedDot);
        itemNode.name = `${pveType}`;
        let posY = 0;
        if(this._itemList.length == 0) {
            posY = -(itemH >> 1);
        } else {
            let lastToggle = this._itemList[this._itemList.length - 1];
            let lineNode = cc.instantiate(this.lineTemplate);
            lineNode.active = true;
            lineNode.parent = this.linesContainor;
            lineNode.setPosition(0, lastToggle.y - (itemH >> 1));
            posY = lastToggle.y - itemH - spaceY;
        }
        itemNode.setPosition(0, posY);
        this._itemList.push(itemNode);
    }

    private _prepareData() {
        this._pveList.length = 0;
        let pvelist = configCache.getPVEListCfgsByType(this._pveType);
        pvelist && pvelist.forEach(ele => {
            let pveCfg: cfg.PVEList = configManager.getConfigByKey('pveList', ele);
            this._pveList.push(pveCfg);
        });
    }

    refreshListView(aniDur?:number) {
        this.listView.numItems && this.listView.scrollTo(0, aniDur || 0);
        this.scheduleOnce(()=>{
            this.listView.numItems = this._pveList.length;
        })
        this._refreshRedDot();
    }

    private _refreshRedDot() {
        // this.limitItemRedDot.setData(RED_DOT_MODULE.PVE_EXTREME_TOGGLE, {
        //     isClickCurToggle: this._pveType == 2
        // });
    }

    private _isOpenState = function(functionID: number): boolean {
        let funcCfg: cfg.FunctionConfig = configUtils.getFunctionConfig(functionID);
        if(!funcCfg) return true;

        let openCondi = funcCfg.FunctionOpenCondition;
        if(!openCondi || openCondi.length == 0) return true;

        let condi: string[] = utils.parseStringTo1Arr(openCondi);

        if(!condi || condi.length == 0) return true;
        let type = parseInt(condi[0]), value = parseInt(condi[1]);
        let isOpen = false;
        if(type == NODE_OPEN_CONDI_TYPE.USER_LV) {
            isOpen = value <= userData.lv;
        } else if(type == NODE_OPEN_CONDI_TYPE.TASK) {
            isOpen = taskData.getTaskIsCompleted(value);
        }

        if(!isOpen && ((typeof funcCfg.FunctionLockType) || funcCfg.FunctionLockType != NODE_LOCK_TYPE.HIDE)) {
            isOpen = true;
        }
        return isOpen;
    }

    private _onItemChangeCb() {
        let lastData = [...this._pveList];
        this._prepareData();
        // 数据变化时更新视图
        if(lastData.length != this._pveList.length || this._pveList.some((ele, idx) => {
              return ele.PVEListFunctionId != lastData[idx].PVEListFunctionId;
        }))
        {
            this.refreshListView();
        }
    }
}
