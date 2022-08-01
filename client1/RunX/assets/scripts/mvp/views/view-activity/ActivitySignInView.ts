/*
 * @Author: xuyang
 * @Description: 活动-签到页面
 */
import { configManager } from "../../../common/ConfigManager";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { cfg } from "../../../config/config";
import { data, gamesvr } from "../../../network/lib/protocol";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { CustomDialogId, CustomItemId, VIEW_NAME } from "../../../app/AppConst";
import { bagData } from "../../models/BagData";
import RichTextEx from "../../../common/components/rich-text/RichTextEx";
import { activityData } from "../../models/ActivityData";
import { activityOpt } from "../../operations/ActivityOpt";
import { activityEvent } from "../../../common/event/EventData";
import { serverTime } from "../../models/ServerTime";
import { utils } from "../../../app/AppUtils";
import { QUALITY_TYPE } from "../../../app/AppEnums";
import guiManager from "../../../common/GUIManager";
import { redDotMgr, RED_DOT_MODULE } from "../../../common/RedDotManager";
import {scheduleManager} from "../../../common/ScheduleManager";
import { CACHE_MODE, resourceManager } from "../../../common/ResourceManager";
import ItemSignInPrize from "./ItemSignInPrize";
import moduleUIManager from "../../../common/ModuleUIManager";
const { ccclass, property } = cc._decorator;

let SpecialHeroEffPath = [
    'spine/ui/qianDao/effect_qiandao1',
    'spine/ui/qianDao/effect_qiandao2',
]

const MAX_COUNT = 6;
const TAG_SIGN = 'ActivitySignInView'

@ccclass
export default class ActivitySignInView extends ViewBaseComponent {
    
    @property([cc.Node]) cards: cc.Node[] = [];
    @property([cc.Node]) cardLbs: cc.Node[] = [];
    @property(cc.Node) heroToken: cc.Node = null;
    @property(cc.Node) prizeNode: cc.Node = null;
    @property(cc.Node) prizeItem: cc.Node = null;
    @property(cc.Node) tipsNode: cc.Node = null;
    @property(RichTextEx) tipsCtx: RichTextEx = null;
    @property(cc.Label) lbBtn: cc.Label = null;
    @property(cc.Node) remainNode: cc.Node = null;
    @property(cc.Label) lbRemain: cc.Label = null;
    @property(cc.Node) takeButton: cc.Node = null;
    @property(cc.Node) tokenIcon: cc.Node = null;

    @property(cc.Label) title: cc.Label = null;
    @property(cc.Label) heroTitle: cc.Label = null;
    @property(cc.Label) cardCnt: cc.Label = null;
    @property(cc.Sprite) cardIcon: cc.Sprite = null;
    @property(cc.Sprite) heroDraw: cc.Sprite = null;
    @property(cc.Node) heroBg: cc.Node = null;
    @property(sp.Skeleton) specialHeroEff: sp.Skeleton = null;

    @property(cc.Button) refreshBtn: cc.Button = null;

    private _moduleId: number = 0;
    private _rootView: ViewBaseComponent = null;
    private _heroCfg: cfg.HeroBasic = null;
    private _sID: number = 0;
    private _sprLoader: SpriteLoader = new SpriteLoader();
    private _itemSignPrize: ItemSignInPrize[] = [];
    private _skeleDatas: {[key: string] : sp.SkeletonData} = {};

    onInit(moduleId: number, root: ViewBaseComponent) {
        this._moduleId = moduleId;
        this._rootView = root
        this._prepareData();
        this._refreshView();
        this._showRefreshButton();
        this._initPrizes();
        this._initFlopCards();

        eventCenter.register(activityEvent.RECV_SIGNIN_FLOP_RES, this, this._recvFlopCardRes);
        eventCenter.register(activityEvent.RECV_SIGNIN_GET_HERO, this, this._recvGetHeroRes);
        eventCenter.register(activityEvent.RECV_SIGNIN_HERO_CHANGE, this, this._recvHeroChange);
    }

    onRelease() {
        this._sprLoader.release();
        this._itemSignPrize.forEach( _item => {
            if (_item && cc.isValid(_item)) {
                _item.deInit();
                _item.node.removeFromParent();
            }
        })
        this._itemSignPrize = []
        this._sID && scheduleManager.unschedule(this._sID);
        eventCenter.unregisterAll(this);
        this._skeleDatas = {};
        this.specialHeroEff.clearTracks();
        this.specialHeroEff.skeletonData = null;
        SpecialHeroEffPath.forEach(ele => {
            resourceManager.release(ele, CACHE_MODE.NONE, TAG_SIGN);
        })
    }


    private _prepareData(){
        let signInData = activityData.signInData;
        let signInCfg: cfg.ActivitySignIn = configManager.getConfigByKey("activitySignIn", signInData.SignInID)
        this._heroCfg = configManager.getConfigByKey("heroBasic", signInCfg.SignInRewardShow);
    }

    private _refreshView(){
        // 配置文本填入
        let titleDiaCfg: cfg.Dialog = configManager.getConfigByKey("dialogue", CustomDialogId.ACTIVITY_SIGNIN_TITLE);
        let showHeroDiaCfg: cfg.Dialog = configManager.getConfigByKey("dialogue", CustomDialogId.ACTIVITY_SIGNIN_HERO_TIPS);
        let tipsDiaCfg: cfg.Dialog = configManager.getConfigByKey("dialogue", CustomDialogId.ACTIVITY_SIGNIN_REFRESH_TIPS);
        let signInData = activityData.signInData;
        let canReceiveHero = serverTime.currServerTime() >= this._calTimeLeast();
        let flopCardCnt = this._calFlopCardCnt();
      
        titleDiaCfg && (this.title.string = titleDiaCfg.DialogText);
        showHeroDiaCfg && (this.heroTitle.string = showHeroDiaCfg.DialogText);
        tipsDiaCfg && (this.tipsCtx.string = tipsDiaCfg.DialogText);

        this.tokenIcon.active = signInData.IsReceive;
        this.heroBg.active = signInData.IsReceive;
        this.takeButton.active = flopCardCnt == MAX_COUNT && !signInData.IsReceive;
        this.lbBtn.string = canReceiveHero ? "点击领取" : "下次签到可领取";

        this.takeButton.getComponent(cc.Button).interactable = canReceiveHero && !signInData.IsReceive;
        this.heroDraw.node.color = signInData.IsReceive ? cc.Color.WHITE : cc.Color.BLACK;
        // this._sprLoader.deleteSprite(this.heroDraw);
        this._sprLoader.changeSprite(this.heroDraw, resPathUtils.getModelPhotoPath(this._heroCfg.HeroBasicModel));
        this.remainNode.active = signInData.IsReceive;
        this.lbRemain.string = utils.getTimeInterval(this._getNextDayStamp() - serverTime.currServerTime()) + "后重置";
        this._sID && scheduleManager.unschedule(this._sID);
        let remainTime = this._getNextDayStamp() - serverTime.currServerTime();
        if (remainTime > 0) {
            this.lbRemain.string = utils.getTimeInterval(remainTime) + "后重置";
            this._sID = scheduleManager.schedule(() => {
                let remainTime = this._getNextDayStamp() - serverTime.currServerTime();
                let canReceiveHero = serverTime.currServerTime() >= this._calTimeLeast();
                if (remainTime > 0) {
                    this.lbRemain.string = utils.getTimeInterval(remainTime) + "后重置";
                }
                else {
                    this._sID && scheduleManager.unschedule(this._sID); 
                    this.remainNode.active = false;
                }
            }, 1)
        }
    }

    private _drawGraphics(isFromStart: boolean = false){
        let quality = this._heroCfg.HeroBasicQuality;
        if(quality < QUALITY_TYPE.SR) {
            this._stopEff();
            return;
        }

        let path: string = null;
        switch(quality){
            case QUALITY_TYPE.SR:
                path = SpecialHeroEffPath[1];
                break;
            case QUALITY_TYPE.SSR:
                path = SpecialHeroEffPath[0];
                break;
        }

        if(!path) return;
        if(this._skeleDatas[path]){
            this._playEff(this._skeleDatas[path], isFromStart);
            return;
        }

        resourceManager.load(path, sp.SkeletonData, CACHE_MODE.NONE, TAG_SIGN)
        .then(data => {
            this._skeleDatas[path] = data.res;
            this._playEff(this._skeleDatas[path], isFromStart);
        });
    }

    private _playEff(skeletonData: sp.SkeletonData, isFromStart: boolean){
        if(!cc.isValid(skeletonData)) return;
        this.specialHeroEff.clearTracks();
        this.specialHeroEff.skeletonData = skeletonData;
        if(isFromStart){
            this.specialHeroEff.setAnimation(0, '1', false);
            this.specialHeroEff.addAnimation(0, '2', true);
        }else{
            this.specialHeroEff.addAnimation(0, '2', true);
        }
    }

    private _stopEff(){
        if(!cc.isValid(this.specialHeroEff.skeletonData)) return;
        this.specialHeroEff.clearTracks();
        this.specialHeroEff.skeletonData = null;
    }

    private _initPrizes(){
        let prizeCfgs: cfg.ActivitySignIn[] = configManager.getConfigList("activitySignIn")
            .filter(cfg => { return cfg.SignInType == 1; });
        let signInData =  activityData.signInData;
        prizeCfgs.forEach((cfg, index) => {
            let item = this._itemSignPrize[index];
            if (!item) {
                let itemNd = cc.instantiate(this.prizeItem);
                item = itemNd.getComponent(ItemSignInPrize);
                this._itemSignPrize[index] = item
                item.node.parent = this.prizeNode;
                itemNd.active = true;
            }
            let parseRes = cfg.SignInRewardShow.split(";").map((res)=>{return parseInt(res)});
            item.onInit(parseRes[0], parseRes[1], (itemID: number, count: number)=> {
                moduleUIManager.showItemDetailInfo(itemID, count, this._rootView.node);
            });
            item.takon = signInData.ReceiveRewardMap[cfg.SignInID];
        });

        this.heroToken.active = signInData.IsReceive;
    }

    private _initFlopCards(isFromStart: boolean = false) {
        let signInData = activityData.signInData;
        let flopCardCnt = this._calFlopCardCnt();
        let itemCnt = bagData.getItemCountByID(CustomItemId.SIGNIN_TICKET);
        this.cards.forEach((card, index)=>{
            card.active = !(signInData.FlopCardMap && signInData.FlopCardMap[index+1]);
            this.cardLbs[index].active = !(signInData.FlopCardMap && signInData.FlopCardMap[index + 1]) && !!itemCnt;
        })
        // TODO 这里可能会加特效 现在就程序临时自己做的效果
        let cardLbs = this.cardLbs.filter((cardLb)=>{ return cardLb.active});
        if (cardLbs && cardLbs.length > 0) {
            for(let i = 0; i < cardLbs.length; ++i) {
                const cardLb = cardLbs[i];
                cardLb.opacity = 255;
                cardLb.stopAllActions();
                if (itemCnt && flopCardCnt < MAX_COUNT) {
                    this.scheduleOnce(() => {
                        cc.tween(cardLb)
                        .to(1.5, { opacity: 0 }, { easing: "sineOut" })
                        .to(1.5, { opacity: 255 }, { easing: "sineIn" })
                        .union()
                        .repeatForever()
                        .start();
                    }, i * 0.3);
                }    
            }
        }
        flopCardCnt && !signInData.IsReceive && this._drawGraphics(isFromStart);
    }

    private _showRefreshButton(){
        let itemPath = resPathUtils.getItemIconPath(CustomItemId.SIGNIN_REFRESH_CARD);
        let itemCnt = bagData.getItemCountByID(CustomItemId.SIGNIN_REFRESH_CARD);
        let signInData = activityData.signInData;
        this.cardCnt.string = `x${itemCnt || 0}`;
        this.cardCnt.node.color = !!itemCnt ? cc.Color.WHITE : cc.Color.RED;
        this.refreshBtn.interactable = !!this._calFlopCardCnt() && !signInData.IsReceive;
        this.tipsNode.active = this._calFlopCardCnt() > 4 && this._heroCfg && this._heroCfg.HeroBasicQuality && this._heroCfg.HeroBasicQuality < QUALITY_TYPE.SSR; 
        this._sprLoader.changeSprite(this.cardIcon, itemPath);
    }

    private _recvGetHeroRes() {
        cc.tween(this.heroDraw.node).to(0.5, { color: cc.Color.WHITE }, { easing: "sinein" }).call(() => {
            this._prepareData();
            this._refreshView();
            this._showRefreshButton();
        }).start();
    }

    private _recvHeroChange() {
        //刷新提示
        guiManager.showDialogTips(1000135);
        this._stopEff();
        this._prepareData();
        this._refreshView();
        this._initPrizes();
        this._initFlopCards();
        this._showRefreshButton();
    }

    private _recvFlopCardRes(cmd: any, data: data.IItemInfo[], idx: number){
        let runFadeAction = function (node: cc.Node) {
            let action = cc.sequence([cc.fadeOut(0.5), cc.callFunc(() => { node.active = false }), null]);
            node.stopAllActions();
            node.runAction(action);
        };
        if (idx && this.cardLbs[idx-1]) {
            runFadeAction(this.cardLbs[idx-1]);
            runFadeAction(this.cards[idx-1]);
        }
        if (data && data.length){
            guiManager.loadView(VIEW_NAME.GET_ITEM_VIEW, this._rootView.node, data);
        }
        this._initPrizes();
        this._initFlopCards(true);
        this._showRefreshButton();
        this._refreshView();
        redDotMgr.fire(RED_DOT_MODULE.ACTIVITY_SIGN_TOGGLE);
        redDotMgr.fire(RED_DOT_MODULE.MAIN_ACTIVITY);
    }

    private _calFlopCardCnt(){
        let signInData = activityData.signInData;
        let cnt = 0; 
        for (let k in signInData.FlopCardMap){
            cnt += (signInData.FlopCardMap[k] ? 1 : 0);
        }
        return cnt;
    }

    private _calTimeLeast(){
        let signInData = activityData.signInData;
        let latestTime = 0;
        for (let k in signInData.FlopCardMap) {
            let time = signInData.FlopCardMap[k];
            latestTime = Math.max(latestTime, time);
        }
        return this._getNextDayStamp(latestTime);
    }

    private _getNextDayStamp(time?: number){
        let date = new Date((time || serverTime.currServerTime()) * 1000);
        let year = date.getFullYear(),
            month = date.getMonth() + 1,
            day = date.getDate() + 1;
        return Number(new Date(`${year}-${month}-${day} 00:00:00`)) / 1000;
    }

    onClickCard(event: cc.Event, customEventData: string){
        let itemCnt = bagData.getItemCountByID(CustomItemId.SIGNIN_TICKET);
        let idx = Number(customEventData);
        if (itemCnt)
            activityOpt.flopCardReq(idx);
    }

    onClickTakeHero(event: cc.Event, customEventData: string) {
       activityOpt.takeHeroReq();
    }

    onClickRefresh(event: cc.Event, customEventData: string) {
        let itemCnt = bagData.getItemCountByID(CustomItemId.SIGNIN_REFRESH_CARD);
        let refreshFunc = ()=>{
            if (itemCnt)
                activityOpt.refreshHeroReq();
            else
                guiManager.showDialogTips(CustomDialogId.ACTIVITY_ITEM_NO_ENOUGH);
        }
        if (this._heroCfg && this._heroCfg.HeroBasicQuality && this._heroCfg.HeroBasicQuality >= QUALITY_TYPE.SSR){
            guiManager.showMessageBox(this.node, {
                content:"当前抽取结果为传说品质的英雄，是否放弃并继续刷新？",
                leftStr: "取消",
                leftCallback: (messageBox: ViewBaseComponent)=> { messageBox.closeView() }, 
                rightStr: "确定", 
                rightCallback: refreshFunc,
            });
        } else {
            refreshFunc();
        }
    }
}