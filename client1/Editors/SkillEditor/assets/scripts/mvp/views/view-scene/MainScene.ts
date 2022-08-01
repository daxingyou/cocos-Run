import guiManager from "../../../common/GUIManager";
import scheduleManager from "../../../common/ScheduleManager";
import List from "../../../common/components/List"

import { SCENE_NAME, VIEW_NAME } from "../../../app/AppConst";
import { ItemChatData } from "../../../app/AppType";
import { COIN_TYPE, MSG_TYPE } from "../../../app/AppEnums";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";

import { eventCenter } from "../../../common/event/EventCenter";
import { GLOBAL_EVENT_TYPE } from "../../../app/AppEnums";
import { modelManager } from "../../models/ModeManager";
import { audioManager, BGM_TYPE } from "../../../common/AudioManager";
import { resourceManager } from "../../../common/ResourceManager";
import { optManager } from "../../operations/OptManager";
import { useInfoEvent } from "../../../common/event/EventData";

const { ccclass, property } = cc._decorator;
interface CACHE_URL {
    headUrl: string,
    frameUrl: string
}

@ccclass
export default class MainScene extends ViewBaseComponent {
    @property(List) chatList: List = null;
    @property(List) pageList: List = null;
    @property([cc.Label]) savings: cc.Label[] = Array<cc.Label>();
    @property(cc.Node) headNode: cc.Node = null;
    @property(cc.Node) frameNode: cc.Node = null;

    @property({ type: cc.Label, tooltip: '用户体力展示' }) physicalLb: cc.Label = null;
    @property({ type: cc.Label, tooltip: '用户金币展示' }) coinLb: cc.Label = null;
    @property({ type: cc.Label, tooltip: '用户钻石展示' }) diamondLb: cc.Label = null;
    @property({ type: cc.Label, tooltip: '用户名展示' }) userNameLb: cc.Label = null;
    @property({ type: cc.Label, tooltip: '用户等级展示' }) userLvLb: cc.Label = null;

    private itemCount: number = 5;
    private Index: number = 0;
    private scheduleId: number[] = [];
    private msgList: Array<ItemChatData> = null;
    private _latestUrl: CACHE_URL = {
        headUrl: null,
        frameUrl: null,
    };

    onInit() {
        this.addEvent();
        this.refreshInfoView();
        this.refreshUserView();
        this.loadChatData();
        this.scheduleAd();
        this.playMainMusic();
    }

    /**
     * 注册监听事件
     */
    addEvent() {
        eventCenter.register(GLOBAL_EVENT_TYPE.UPDATE_COIN, this, this.refreshCoinView);
        eventCenter.register(GLOBAL_EVENT_TYPE.UPDATE_DIAMOND, this, this.refreshDiamondView);
        eventCenter.register(GLOBAL_EVENT_TYPE.UPDATE_PHYSICAL, this, this.refreshPhysicalView);
        eventCenter.register(useInfoEvent.USER_HEAD_CHANGE, this, this.refreshUserView);
        eventCenter.register(useInfoEvent.USER_NAME_CHANGE, this, this.refreshUserView);
    }

    refreshInfoView() {
        this.refreshCoinView();
        this.refreshDiamondView();
        this.refreshPhysicalView();
    }

    refreshCoinView() {
        this.coinLb.string = `${modelManager.userData.userInfo.coin}`;
    }

    refreshDiamondView() {
        this.diamondLb.string = `${modelManager.userData.userInfo.diamond}`;
    }

    refreshPhysicalView() {
        this.physicalLb.string = `${modelManager.userData.userInfo.physical}`;
    }

    refreshUserView() {
        let uInfo = modelManager.userData.userInfo;
        this.userNameLb.string = `${uInfo.name}`;
        this.userLvLb.string = `${uInfo.level}`;

        //头像与头像框部分,每次加载前需手动释放引用，但保留最后一次更新头像
        this._latestUrl.headUrl && resourceManager.release(this._latestUrl.headUrl);
        this._latestUrl.frameUrl && resourceManager.release(this._latestUrl.frameUrl);
        this._latestUrl.headUrl = optManager.usrOpt.headData.getConfigByHeadId(uInfo.headID).HeadFramImage;
        this._latestUrl.frameUrl = optManager.usrOpt.headData.getConfigByHeadId(uInfo.headFrameID).HeadFramImage;
        this.loadSprInNode(this._latestUrl.headUrl, this.headNode);
        this.loadSprInNode(this._latestUrl.frameUrl, this.frameNode);
    }

    refreshUserHead() {
        // todo 跟换头像
    }

    onClickGoBattle() {
        guiManager.loadScene(SCENE_NAME.BATTLE);
    }

    onClickGoRunCool() {
        guiManager.loadScene(SCENE_NAME.RUN_COOL);
    }

    onClickMap() {
        guiManager.loadView(VIEW_NAME.MAPVIEW, this.node);
    }

    loadSprInNode(url: string, pnode: cc.Node) {
        let imgUrl = url.search("textures/") == -1 ? `textures/${url}` : url;
        resourceManager.load(imgUrl, cc.SpriteFrame).then(data => {
            pnode.getComponent(cc.Sprite).spriteFrame = data.res; ``
        })
    }

    /**
     * @desc 购买按钮事件注册
     */
    onClickCoinAdd(event: cc.Event, customEventData: string) {
        let node = event.target;
        switch (customEventData) {
            case COIN_TYPE.HP: { guiManager.showTips("购买体力"); break; }
            case COIN_TYPE.COIN: { guiManager.showTips("购买金币"); break; }
            case COIN_TYPE.DAIMOND: { guiManager.showTips("购买钻石"); break; }
            default: break;
        }
    }
    /**
     * @desc 模块入口事件注册
     */
    onClickModule(event: cc.Event, customEventData: string) {
        guiManager.showTips(`Module ${customEventData} Loaded`);
        //App.loadModule(customEventData);
        if (customEventData == 'Hero') {
            guiManager.loadView(VIEW_NAME.HEROVIEW, this.node);
        }
    }

    onClickUsrInfo() {
        guiManager.loadView("InfoView", this.node);
    }
    /**
     * @desc 广告banner自动刷新部分
     */
    scheduleAd() {
        this.pageList.numItems = this.itemCount;
        let sid = scheduleManager.schedule(() => {
            let idx = this.pageList.getCurIndex() || 0;
            this.Index = idx == this.itemCount ? idx : idx + 1;
            this.pageList.scrollTo(this.Index, 1, 0);
        }, 3)
        this.scheduleId.push(sid);
    }
    /**
    * @desc 广告List Item刷新/点击
    */
    onPageListRender(item: cc.Node, idx: number) {
        // let texturePath:string[] = configUtils.getHallConfig(15000).FunctionPaths;
        // let realPath = `resources/module/ad/${texturePath[idx]}.png`;
        // resourceManager.load(realPath,cc.SpriteFrame).then(data=>{
        //     item.getComponent(cc.Sprite).spriteFrame=data.res;
        // })
        let colorArray: Array<cc.Color> = [
            cc.color(0, 128, 128),
            cc.color(128, 0, 128),
            cc.color(128, 128, 0),
            cc.color(0, 0, 128),
            cc.color(0, 128, 0),
            cc.color(128, 0, 0)
        ]
        let spr: cc.Sprite = item.getComponentInChildren(cc.Sprite);
        spr.node.opacity = 255;
        spr.node.color = colorArray[idx];
    }
    onPageListSelected(item: any, selectedId: number, lastSelectedId: number, val: number) {
        //let redrictUrl:string[] = configUtils.getHallConfig(15000).FunctionUrls;
        let redrictUrl: string[] = [
            "http://localhost:7456/0",
            "http://localhost:7456/1",
            "http://localhost:7456/2",
            "http://localhost:7456/3",
            "http://localhost:7456/4",
        ];
        if (!item || redrictUrl.length <= selectedId) return;
        cc.log("Redrict to url", redrictUrl[selectedId]);
    }
    /**
    * @desc 聊天List Item刷新
    */
    onChatListRender(item: any, idx: number) {
        let bg: cc.Node = item.getChildByName('main_bg');
        let title: cc.Node = bg.getChildByName('title');
        let msgNode: cc.Node = item.getChildByName('msgLayout');

        let titleLabel: cc.Label = title.getComponent(cc.Label);
        let msgLayout: cc.Layout = msgNode.getComponent(cc.Layout);
        let msgLable: any = msgNode.getComponentInChildren(cc.Label);

        let minH: number = 35;
        let offsetY: number = 5;
        let h: number = 0;
        let data = this.msgList[idx];
        titleLabel.string = data.type;
        msgLable.string = data.msg;
        // tips: cc.Label刷新默认会在下一帧执行，因此需要强制更新
        msgLable._forceUpdateRenderData();
        msgLayout.updateLayout();
        h = msgLayout.node.height + offsetY;
        item.height = h < minH ? minH : h;
    }

    /**
     * @desc 加载聊天数据
     */
    private loadChatData() {
        this.msgList = [
            {
                msg: `函数会将前一个 action 作为作用对象。但是如果有参数提供了其他的 action 或者 tween，则 repeat/repeatForever 函数`,
                type: MSG_TYPE.WORLD
            },
            {
                msg: "函数会将前一个 action 作为作用对象",
                type: MSG_TYPE.COMMUNITY
            },
            {
                msg: "lllllllllllllllllllllllllllllll",
                type: MSG_TYPE.WORLD
            },
            {
                msg: "lllllllllllllllllllllllllllllll",
                type: MSG_TYPE.WORLD
            },
            {
                msg: "hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh",
                type: MSG_TYPE.COMMUNITY
            },
            {
                msg: "ooooooooooooooooooooooooooooooo",
                type: MSG_TYPE.WORLD
            },
        ];
        //后续要通过TCP刷新消息流
        let sid = scheduleManager.schedule(() => {
            this.msgList.unshift(this.msgList.pop());
            this.chatList.numItems = this.msgList.length;
        }, 1)
        this.scheduleId.push(sid);
    }

    playMainMusic() {
        audioManager.playMusic(BGM_TYPE.NORMAL);
    }

    unScheduleAll() {
        this.scheduleId.forEach(sid => {
            scheduleManager.unschedule(sid);
        })
    }

    removeEvent() {
        eventCenter.unregisterAll(this);
    }

    onRelease() {
        this.unScheduleAll();
        this.releaseSubView();
        this.removeEvent();
    }
}