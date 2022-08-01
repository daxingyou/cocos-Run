/*
 * @Author: xuyang
 * @Date: 2021-07-05 19:17:31
 * @Description: PVE-极限试炼-奇门遁甲主界面
 */
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent"
import { RED_DOT_MODULE, RED_DOT_TYPE } from "../../../common/RedDotManager";
import { configManager } from "../../../common/ConfigManager";
import { magicDoorEvent } from "../../../common/event/EventData";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { eventCenter } from "../../../common/event/EventCenter";
import { VIEW_NAME } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";;
import { cfg } from "../../../config/config";
import { pveFakeData } from "../../models/PveFakeData";
import { pveTrialData } from "../../models/PveTrialData";
import { serverTime } from "../../models/ServerTime";
import { pveDataOpt } from "../../operations/PveDataOpt";
import List from "../../../common/components/List";
import ItemRedDot from "../view-item/ItemRedDot";
import {scheduleManager} from "../../../common/ScheduleManager";
import HeroListItemSmall from "../view-hero/HeroListItemSmall";
import PVENineHellLessonItem from "./PVENineHellLessonItem";
import guiManager from "../../../common/GUIManager";
import { gamesvr } from "../../../network/lib/protocol";
const { ccclass, property } = cc._decorator;

@ccclass
export default class PVEMagicDoorView extends ViewBaseComponent {

    @property(List) listView: List = null;
    @property(List) heroList: List = null;
    @property(cc.Label) reloadTimeLb: cc.Label = null;           //重置时间
    @property([cc.Node]) magicDoor: cc.Node[] = [];
    @property(ItemRedDot) itemRedDot: ItemRedDot = null;
    @property(cc.Prefab) coinNodePrefeb: cc.Prefab = null;

    @property(cc.Node) passNode: cc.Node = null;

    private _pveID: number = 0;
    private _passStatus: boolean[] = [];
    private _scheduleId: number = 0;
    private _reloadTime: number = 0;
    private _sprLoader: SpriteLoader = new SpriteLoader();
    private _pveMagicDoorLesson: cfg.PVEDaoistMagicLesson[] = [];       //PVE数据列表

    onInit(pveID: number) {
        this._pveID = pveID;
        this.registerEvent();

        guiManager.addCoinNode(this.node, pveID);
        pveDataOpt.reqGetTrialMiracalInfo();
    }

    registerEvent() {
        eventCenter.register(magicDoorEvent.SYNC_MAGIC_INFO, this, this.prepareData);
        eventCenter.register(magicDoorEvent.FINISH_PVE_RES, this, this._reveFinishPveRes);
        eventCenter.register(magicDoorEvent.TAKE_REWARD_RES, this, this._recvTakeRewardRes);
    }

    onRelease() {
        this.itemRedDot.deInit();
        guiManager.removeCoinNode(this.node);
        eventCenter.unregisterAll(this);
        this._sprLoader.release();
        this.heroList._deInit();
        this.listView._deInit();
        scheduleManager.unschedule(this._scheduleId);
    }
    
    onListRender(itemNode: cc.Node, idx: number) {
        let item = itemNode.getComponent(PVENineHellLessonItem);
        let cfg = this._pveMagicDoorLesson[idx];
        item.init(cfg,true);
    }


    onHeroListRender(itemNode: cc.Node, idx: number){
        let heroListItemCmp: HeroListItemSmall = itemNode.getComponent(HeroListItemSmall);
        let heroInfo: cfg.PVEDaoistMagicHero = configManager.getConfigByKey("pveMagicHero", pveFakeData.getSeedFakeHeroList()[idx]);
        heroListItemCmp.setData(heroInfo.RetrievalID, true);
    }

    onHeroListSelect(itemNode: cc.Node, idx: number) {
        let heroInfo: cfg.PVEDaoistMagicHero = configManager.getConfigByKey("pveMagicHero", pveFakeData.getSeedFakeHeroList()[idx]);
        this.loadSubView(VIEW_NAME.TIPS_HERO, heroInfo.RetrievalID);
    }


    prepareData(pID?: number) {
        let configs = configManager.getConfigs("pveMagicLesson");
        this._pveMagicDoorLesson.splice(0);
        for (let k in configs) {
            let cfg: cfg.PVEDaoistMagicLesson = configs[k];
            if (cfg.PVECopyType == pveTrialData.miracalInfo.CurrentPeriod) {
                this._pveMagicDoorLesson.push(cfg);
            }
        }
        pveFakeData.constructFakeData();
        this._pveID = pID || this._pveID; 
        this._reloadTime = pveTrialData.miracalInfo.NextTime;
        this._pveMagicDoorLesson.sort((a,b)=>{
            return (a.PVECopyNum | 0) - (b.PVECopyNum | 0);
        })
        this.refreshView();
    }

    refreshView() {
        let timeStr = utils.getTimeInterval(this._reloadTime - serverTime.currServerTime());
        let passStatus = this._pveMagicDoorLesson.map((lesson)=>{
            return pveTrialData.miracalData.PassLessonMap[lesson.PVECopyId];
        });
        //启动倒计时刷新
        let remainTime = this._reloadTime - serverTime.currServerTime();
        if (remainTime > 0) {
            scheduleManager.unschedule(this._scheduleId);
            this._scheduleId = scheduleManager.schedule(() => {
                let remainTime = this._reloadTime - serverTime.currServerTime();
                if (remainTime > 0) {
                    let timeStr = utils.getTimeInterval(remainTime);
                    this.reloadTimeLb.string = `重置时间：${timeStr}后`;
                } else {
                    //主动请求获取同步信息
                    pveDataOpt.reqGetTrialMiracalInfo();
                    pveTrialData.clearTrailMiracleData();
                }
            }, 1)
        }
        this.reloadTimeLb.string = `重置时间：${timeStr}后`;
        //奇门遁甲圆盘状态
        this.magicDoor.forEach((door, index) => {
            let unsel = door.getChildByName("normal");
            let sel = door.getChildByName("clearance");
            unsel.active = !passStatus[index];
            sel.active = !!passStatus[index];
        })
        //列表数据刷新
        this.scheduleOnce(()=>{
            this.listView.numItems = this._pveMagicDoorLesson.length;
            this.heroList.numItems = pveFakeData.getSeedFakeHeroList().length;
        })
        this._passStatus = passStatus;
        this.passNode.active =  passStatus.filter(status => { return !!status }).length == passStatus.length;
        // TODO 需要修改特效类型
        this.itemRedDot.setData(RED_DOT_MODULE.PVE_MAGIC_DOOR_REWARD, {
            redDotType: RED_DOT_TYPE.NORMAL
        });
    }

    /**
   * @desc 奖励预览界面
   */
    onClickRewardShow() {
        this.loadSubView("PVEMagicDoorRewardView",this._passStatus);
    }

    private _reveFinishPveRes(){
        this.prepareData();
    }

    //奖励领取结果
    private _recvTakeRewardRes(cmd: any, msg: gamesvr.TrialMiracleDoorReceiveRewardRes){
    }
}
