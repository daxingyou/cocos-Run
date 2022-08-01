import { VIEW_NAME } from "../../../../app/AppConst";
import { PVP_MODE } from "../../../../app/AppEnums";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../../common/event/EventCenter";
import { HOLE_COUNT } from "./GuildWarCommon";
import GuildWarMap from "./GuildWarMap";

const {ccclass, property} = cc._decorator;
@ccclass
export default class GuildWarBattleView extends ViewBaseComponent {
    @property(cc.Label) selfGuildNameLb: cc.Label = null;
    @property(cc.Label) enemyGuildNameLb: cc.Label = null;
    @property(cc.Label) consecrteNumLb: cc.Label = null;
    @property(cc.Label) attackCountLb: cc.Label = null;
    @property(GuildWarMap) map: GuildWarMap = null;

    @property(cc.Prefab) holeTemp: cc.Prefab = null;
    @property(cc.Prefab) lineTemp: cc.Prefab = null;

    private _itemHolePool: cc.NodePool = new cc.NodePool();
    private _itemHoleLinePool: cc.NodePool = new cc.NodePool();
    get itemHolePool() { return this._itemHolePool; }
    get itemHoleLinePool() { return this._itemHoleLinePool; };

    preInit() {
        return new Promise((resolve, reject) => {
            this.stepWork.addTask(() => {
                for(let i = 0; i < HOLE_COUNT; i += 1) {
                    this._itemHolePool.put(cc.instantiate(this.holeTemp));
                }
            }).addTask(() => {
                for(let i = 0; i < HOLE_COUNT; i += 1) {
                    this._itemHoleLinePool.put(cc.instantiate(this.lineTemp));
                }
            })

            this.stepWork.start(() => {
                resolve(true);
            });
        });
    }

    onInit(): void {
        this._registerEvent();
        this.map.onInit(this);
    }

    private _registerEvent() {
    }

    /**页面释放清理*/
    onRelease() {
       eventCenter.unregisterAll(this);
    }

    /**页面来回跳转刷新*/
    onRefresh(): void {
        
    }

    onOpenDefenceTeam() {
        this.loadSubView(VIEW_NAME.PREINSTALL_VIEW, true,PVP_MODE.GUILD_WAR);
    }

    onOpenWarInfo() {
        this.loadSubView("GuildWarBattleReportView");
    }

    onOpenMerberRank() {
        this.loadSubView("GuildWarMemberRankView");
    }

    onOpenRewardPreview() {
        this.loadSubView("GuildWarRewardPreview");
    }

}