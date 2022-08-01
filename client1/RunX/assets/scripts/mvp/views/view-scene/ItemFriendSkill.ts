import { FRIEND_SKILL_ST } from "../../../app/BattleConst";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { gamesvr } from "../../../network/lib/protocol";

const enum BUFF_TYPE {
    ONCE,               // 一次类型
    PRECENT,            // 进度类型
    PERSIST             // 持续类型
}

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemFriendSkill extends cc.Component {
    @property(sp.Skeleton) activeEff: sp.Skeleton = null;
    @property(cc.Sprite) filled: cc.Sprite = null;
    @property(cc.Sprite) icon: cc.Sprite = null;
    @property(cc.Node) countNode: cc.Node = null;
    @property(cc.Label) countLabel: cc.Label = null;

    private _buffInfo: gamesvr.ITeamBuff = null;
    private _buffType: BUFF_TYPE = BUFF_TYPE.ONCE;

    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _friendID: number = -1;
    private _currState: number = 0;

    updateBuff (buffInfo: gamesvr.ITeamBuff) {
        this._buffInfo = buffInfo;
        // TODO  怎么判断是否是持续类型 有待商榷
        if(!!this._buffInfo.MaxPower) {
            this._buffType = BUFF_TYPE.PRECENT;
        }
        this._refreshView();
    }

    get curState(){
        return this._currState;
    }

    // 备战的静态显示
    showInPrepare (friendId: number, statu: FRIEND_SKILL_ST, needEff: boolean = false) {
        this.countNode.active = false;
        let cfg: cfg.HeroFriend = configUtils.getHeroFriendConfig(friendId);
        let skillIconPath: string = resPathUtils.getSkillIconUrl(cfg.HeroFriendIcon);

        if(!needEff) {
            this._removeEffect();
        }

        if(friendId != this._friendID){
            this._spriteLoader.changeSprite(this.icon, skillIconPath, (err) => {
              //防止图标未配置时，显示其他技能的图标
                err && (this.icon.spriteFrame = null);
            });
        }

        if (statu == FRIEND_SKILL_ST.ACTIVE) {
            this.node.opacity = 255;
            needEff && this._playToActiveEff();
            this._currState = statu;
        }

        if (statu == FRIEND_SKILL_ST.HALF_ACTIVE){
            needEff && this._playToUnActiveEff();
            this.node.opacity = 120;
            this._currState = statu;
        }
        this._friendID = friendId;
    }

    get friendID () {
        return this._friendID
    }

    deInit () {
        this.activeEff.clearTracks();
        this.activeEff.node.active = false;
        this._currState = 0;
        this._friendID = 0;
        this._spriteLoader.release()
    }

    get buffInfo() {
        return this._buffInfo;
    }

    private _playToActiveEff(){
        this.activeEff.node.active = true;
        this.activeEff.setEndListener(null);
        this.activeEff.clearTracks();
        this.activeEff.setAnimation(0, '1', false);
        this.activeEff.addAnimation(0, '2', true);
    }

    private _playToUnActiveEff(){
        this.activeEff.clearTracks();
        this.activeEff.setEndListener(() => {
            this.activeEff.node.active = false;
        });
        this.activeEff.setAnimation(0, '3', false);
    }

    private _refreshView() {
        this._currState = 0;
        this._removeEffect();
        if(BUFF_TYPE.PRECENT == this._buffType) {
            let cnt = this._buffInfo.Power ? this._buffInfo.Power : 0
            this.countLabel.string = cnt + '';
            this.countNode.active = cnt > 0;
            if(this._buffInfo.Power >= this._buffInfo.MaxPower) {
                this._showActivityAni();
            }
        }
    }

    private _showActivityAni() {
        // this.node.getComponent(cc.Animation).play();
    }

    private _removeEffect(){
        this.activeEff.clearTracks();
        this.activeEff.node.active = false;
    }
}
