
import { eventCenter } from "../../../../common/event/EventCenter";
import { guildWarEvent } from "../../../../common/event/EventData";
import guiManager from "../../../../common/GUIManager";
import { BUILD_CFG, BUILD_OWNER } from "./GuildWarCommon";

const {ccclass, property} = cc._decorator;
@ccclass
export default class ItemWarHole extends cc.Component {
    @property(cc.Label) idxLb: cc.Label = null;
    @property(cc.Sprite) fireTag: cc.Sprite = null;

    private _isEnemy: BUILD_OWNER = BUILD_OWNER.ENEMY;
    private _idx: number = 0;
    private _isLock: boolean = true;

    onInit(idx: number, isEnemy: boolean = false): void {
        this._isEnemy = isEnemy ? BUILD_OWNER.ENEMY : BUILD_OWNER.SELF;
        this._idx = idx;
        this.idxLb.string = idx.toString();

        //地方堡垒需要注册集火事件
        if (isEnemy) {
            this._registerEvent();    
        }
    }

    private _registerEvent() {
        eventCenter.register(guildWarEvent.FIRE_TARGET_CHOSE_RES,this,this._fireShow)
    }

    /**item释放清理*/
    deInit() {
        eventCenter.unregisterAll(this);
    }

    private _fireShow(cmd: any, idx: number) {
        if (!this.fireTag) return;
        this.fireTag.node.active = (this._idx == idx);
    }

    itemClick() {
        let param: BUILD_CFG = {
            Idx: this._idx,
            OwnTag: this._isEnemy,
            FireTag: this.fireTag.node.active
        };
        guiManager.loadView('GuildWarBuildView', guiManager.sceneNode,param); 
    }
}