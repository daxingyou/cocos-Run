import { activityUtils } from "../../../app/ActivityUtils";
import { ItemInfo } from "../../../app/AppType";
import UIGridView, { GridData } from "../../../common/components/UIGridView";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import moduleUIManager from "../../../common/ModuleUIManager";
import { cfg } from "../../../config/config";
import ItemActivityPreivew from "./ItemActivityPreview";

const { ccclass, property } = cc._decorator;
const CNT_OF_PER_FRAME_CREATE_INS = 3;
@ccclass
export default class ActivityPreview extends ViewBaseComponent {
    @property(UIGridView) atyList: UIGridView = null;
    @property(cc.Prefab) itemTemplate: cc.Prefab = null;

    private _activityId: number;
    private _parentComp: ViewBaseComponent = null;
    private _activityPreviewCfgs: cfg.ActivityNextShow[] = null;
    private _itemPool: cc.NodePool = new cc.NodePool();

    preInit() {
        this._activityPreviewCfgs = activityUtils.getActivityPreviewableCfg();
        //分帧构建节点
        return new Promise((resolve, reject) => {
            for(let i = 0, len = 10; i < len; i += CNT_OF_PER_FRAME_CREATE_INS) {
                let curLen = Math.min(CNT_OF_PER_FRAME_CREATE_INS, len - i);
                this.stepWork.addTask(() => {
                    for(let j = 0; j < curLen; j++) {
                        this._itemPool.put(cc.instantiate(this.itemTemplate));
                    }
                })
            }

            this.stepWork.start(() => {
                resolve(true);
            });
        });
    }

    onInit(mID: number, parentComp: ViewBaseComponent) {
        this._activityId = mID;
        this._parentComp = parentComp;
        this._initUI();
    }

    onRelease() {
        this.atyList.clear();
        this._itemPool && this._itemPool.clear();
        this._parentComp = null;
    }

    private _initUI() {
        this.atyList.clear();
        if(!this._activityPreviewCfgs || this._activityPreviewCfgs.length == 0) return;

        let gridData: GridData[] = this._activityPreviewCfgs.map(ele => {
            return {
                key: ele.ActivityNextShowId + '',
                data: ele,
            }
        });

        this.atyList.init(gridData, {
            onInit: (item: ItemActivityPreivew, data: GridData) => {
                let activityPreviewCfg: cfg.ActivityNextShow = data.data;
                item.init(activityPreviewCfg, (viewName: string, info: ItemInfo) => {
                    moduleUIManager.showItemDetailInfo(info.itemId, info.num, this._parentComp.node)
                });
            },
            getItem: ():ItemActivityPreivew => {
                let node = this._getItemNode();
                return node.getComponent(ItemActivityPreivew);
            },
            releaseItem: (item: ItemActivityPreivew) => {
                item.deInit();
                this._itemPool.put(item.node);
            }
        });
    }

    private _getItemNode(): cc.Node {
        if(this._itemPool.size() > 0) {
            return this._itemPool.get();
        }
        return cc.instantiate(this.itemTemplate);
    }

}
