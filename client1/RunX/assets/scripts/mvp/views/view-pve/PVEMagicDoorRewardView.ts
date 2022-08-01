/*
 * @Author: xuyang
 * @Date: 2021-07-05 19:17:31
 * @Description: PVE极限试炼-奇门遁甲-奖励页面
 */
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { cfg } from "../../../config/config";
import { utils } from "../../../app/AppUtils";
import { pveTrialData } from "../../models/PveTrialData";
import { magicDoorEvent } from "../../../common/event/EventData";
import { gamesvr } from "../../../network/lib/protocol";
import { VIEW_NAME } from "../../../app/AppConst";
import { pveDataOpt } from "../../operations/PveDataOpt";
import { redDotMgr, RED_DOT_MODULE } from "../../../common/RedDotManager";
import ItemBag from "../view-item/ItemBag";
import moduleUIManager from "../../../common/ModuleUIManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
const { ccclass, property } = cc._decorator;

@ccclass
export default class PVEMagicDoorRewardView extends ViewBaseComponent {
    @property(cc.Node) prizeNode: cc.Node = null;
    @property(cc.Node) takeBtn: cc.Node = null;
    @property(cc.Node) takeTxt: cc.Node = null;
    @property([cc.Node]) magicDoor: cc.Node[] = [];
    
    private _magicDoorCfg: cfg.PVEDaoistMagic = null;       //PVE关卡列表
    private _magicId: number = 0;                           //对应DaoistMagic表格ID    
    private _passStatus: boolean[] = [];
    private _itemBags: ItemBag[] = [];

    onInit(passStatus: boolean[]) {
        this._magicId = pveTrialData.miracalInfo.CurrentPeriod;
        this._passStatus = passStatus;
        this.refreshView();
        eventCenter.register(magicDoorEvent.TAKE_REWARD_RES, this, this.recvTakeRewardRes);
    }

    deInit() {
        this._clearItems();
    }

    onRelease() {
        this.deInit(); 
        eventCenter.unregisterAll(this);
    }

    private _clearItems() {
        this._itemBags.forEach(_i => {
            _i.node.removeFromParent();
            _i.deInit();
            ItemBagPool.put(_i)
        })
        this._itemBags = [];
    }

    refreshView() {
        this._magicDoorCfg = configManager.getConfigByKey("pveMagicDoor",this._magicId);
        if (this._magicDoorCfg && this._magicDoorCfg.PVEDaoistMagicReward) {
            let parseArr = utils.parseStingList(this._magicDoorCfg.PVEDaoistMagicReward);
            this._clearItems();
            parseArr.forEach((ele, index) => {
                if (ele && ele.length) {
                    let item = ItemBagPool.get();
                    item.init({
                        id: parseInt(ele[0]),
                        count: parseInt(ele[1]),
                        prizeItem: true,
                        clickHandler: () => { moduleUIManager.showItemDetailInfo(parseInt(ele[0]), parseInt(ele[1]), this.node); }
                    })
                    // 新创建节点，加入回收池
                    this._itemBags.push(item);
                    item.node.parent = this.prizeNode;
                }
            })
        }
        let passStatus = this._passStatus;
        this.magicDoor.forEach((door,index)=>{
            let unsel = door.getChildByName("normal");
            let sel = door.getChildByName("clearance");
            unsel.active = !passStatus[index];
            sel.active = !!passStatus[index];
        })
        this.takeBtn.active = passStatus.filter(status=>{return !!status}).length == passStatus.length && !pveTrialData.miracalData.IsReceiveReward;
        this.takeTxt.active = passStatus.filter(status=>{return !!status}).length == passStatus.length && pveTrialData.miracalData.IsReceiveReward;
    }

    onTakeRewardClick(){
        pveDataOpt.reqTakeMiracalReward();
    }

    recvTakeRewardRes(cmd: any, msg: gamesvr.TrialMiracleDoorReceiveRewardRes) {
        this.loadSubView(VIEW_NAME.GET_ITEM_VIEW, msg.Prizes);
        this.refreshView();
        redDotMgr.fire(RED_DOT_MODULE.PVE_MAGIC_DOOR_REWARD);
        redDotMgr.fire(RED_DOT_MODULE.PVE_EXTREME_TOGGLE);
        redDotMgr.fire(RED_DOT_MODULE.MAIN_PVE);
    }
}
