import { RES_ICON_PRE_URL } from "../../../../app/AppConst";
import { configUtils } from "../../../../app/ConfigUtils";
import { eventCenter } from "../../../../common/event/EventCenter";
import { guildWarEvent } from "../../../../common/event/EventData";
import guiManager from "../../../../common/GUIManager";
import { logger } from "../../../../common/log/Logger";
import { SpriteLoader } from "../../../../common/ui-helper/SpriteLoader";
import { data } from "../../../../network/lib/protocol";
import { pvpData } from "../../../models/PvpData";
import { userData } from "../../../models/UserData";
import { BUILD_OWNER, BUILD_STATE, CAMP_CFG } from "./GuildWarCommon";


const {ccclass, property} = cc._decorator;
@ccclass
export default class ItemGuildWarBuild extends cc.Component {
    @property(cc.Node) destroyNode: cc.Node = null;
    @property(cc.Node) defendNode: cc.Node = null;
    @property(cc.Node) emptyNode: cc.Node = null;

    @property(cc.Label) buildNameLb: cc.Label = null;
    /**耐久 */
    @property(cc.Label) durableLb: cc.Label = null;
    /**士气 */
    @property(cc.Label) moraleLb: cc.Label = null;

    @property(cc.Sprite) ownerBg: cc.Sprite = null;

    //驻守英雄相关
    @property(cc.Label) heroName: cc.Label = null;
    @property(cc.Label) heroPower: cc.Label = null;
    @property(cc.Label) heroLv: cc.Label = null;
    @property(cc.Sprite) heroHeadFrame: cc.Sprite = null;
    @property(cc.Sprite) heroHeadBg: cc.Sprite = null;

    //操作按钮，根据状态不同操作属性不同
    @property(cc.Button) optBtn: cc.Button = null;

    private _state: BUILD_STATE = BUILD_STATE.EMPTY;
    public get state() { return this._state; }

    private _spLoader: SpriteLoader = new SpriteLoader();
    private _campCfg: CAMP_CFG = null;

    /**按钮操作的绑定事件 */
    private _clickBindFuc: Function = null;

    /**
     * 
     * @param campCfg 营地数据
     * @param isForce 是否强制刷新，不强制刷新只获取一次数据
     * @returns 
     */
    onInit(campCfg: CAMP_CFG,isForce:boolean = false): void {
        if (this._campCfg && !isForce) return;

        this._campCfg = campCfg;
        //idx不合法，关闭操作按钮
        if (this._campCfg.Idx < 0) {
            this.setOptBtnState(false);
        }
        
        this._refreshLb();
        this._refreshState();
        this._initOptBtn();
    }

    deInit(): void{
        this._spLoader.release();
        this._campCfg = null;
    }

    private _refreshLb() {
        this.buildNameLb.string = `${this._campCfg.Idx}号营地`;
    }

    private _refreshState() {
        this._clearState();

        switch (this._campCfg.BuildState) {
            case BUILD_STATE.DESTROY: {
                this.durableLb.string = `0/90`;
                this.moraleLb.node.active = false;
                this.optBtn.node.active = false;
                this.ownerBg.node.active = false;
                break;
            }
            case BUILD_STATE.DEFEND: {
                this.defendNode.active = true;
                break;
            }
            case BUILD_STATE.EMPTY: {
                this.moraleLb.node.active = false;
                this.emptyNode.active = true;
                break;
            }
            default: {
                logger.log(`当前事件指派类型:${this._campCfg.BuildState}`);
            }
        }

        this.ownerBg.node.color = this._campCfg.OwnTag == BUILD_OWNER.ENEMY?cc.Color.RED:cc.Color.BLUE;
        
    }

    private _clearState() {
        this.emptyNode.active = false;
        this.defendNode.active = false;
    }

    private _initHeroInfo(rankUser: data.IRankUser) {
        if (!rankUser) {
            this.heroLv.string = pvpData.getUserLv(userData.accountData.Exp) + "";
         } else {
            this.heroLv.string = pvpData.getUserLv(rankUser?.Exp) + "";   
         }
         
         //头像
         let headId = rankUser ? rankUser.HeadID : userData.accountData.HeadID;
         let headFrameID = rankUser ? rankUser.HeadFrameID : userData.accountData.HeadFrameID;
         
         let headUrl = `${RES_ICON_PRE_URL.HEAD_IMG}/` + configUtils.getHeadConfig(headId).HeadFrameImage;
         this._spLoader.changeSprite(this.heroHeadFrame, headUrl);
   
         let frameUrl = `${RES_ICON_PRE_URL.HEAD_FRAME}/` + configUtils.getHeadConfig(headFrameID).HeadFrameImage;
         this._spLoader.changeSprite(this.heroHeadBg, frameUrl);
    }

    private _initOptBtn() {
        let lab = this.optBtn.getComponentInChildren(cc.Label);
        switch (this._campCfg.BuildState) {
            case BUILD_STATE.DEFEND: {
                this.defendNode.active = true;
                
                if (this._campCfg.OwnTag == BUILD_OWNER.ENEMY) {
                    lab.string = "进攻";
                    this._clickBindFuc = this._attackOptBind.bind(this);
                } else {
                    lab.string = "更换";
                    this._clickBindFuc = this._changeOptBind.bind(this);
                }
                break;
            }
            case BUILD_STATE.EMPTY: {
                if (this._campCfg.OwnTag == BUILD_OWNER.ENEMY) {
                    lab.string = "拆除";
                    this._clickBindFuc = this._tealDownOptBind.bind(this);
                } else {
                    lab.string = "委派";
                    this._clickBindFuc = this._delegateOptBind.bind(this);
                }
                this.emptyNode.active = true;
                break;
            }
        }


    }

    /**进攻 */
    private _attackOptBind() {
        eventCenter.fire(guildWarEvent.ATTACK_SUCC_RES);
    }
    
    /**更换*/
    private _changeOptBind() {
        eventCenter.fire(guildWarEvent.OPEN_CAMP_NTF,this._campCfg);
    }

    /**拆除 */
    private _tealDownOptBind() {
        eventCenter.fire(guildWarEvent.TEAR_DOWN_SUCC,this._campCfg.Idx);
    }

    /**委派 */
    private _delegateOptBind() {
        eventCenter.fire(guildWarEvent.OPEN_CAMP_NTF,this._campCfg);
    }

    setOptBtnState(show: boolean) {
        this.optBtn && (this.optBtn.node.active = show);
    }

    itemClick() {
        this._clickBindFuc && this._clickBindFuc();
    }
}