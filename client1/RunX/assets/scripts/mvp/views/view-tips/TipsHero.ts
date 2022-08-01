import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { pveFakeData } from "../../models/PveFakeData";
import HeroCommonInfoView from "../view-hero/HeroCommonInfoView";
import HeroFriendView from "../view-hero/HeroFriendView";
import HeroPropertyView from "../view-hero/HeroPropertyView";

const {ccclass, property} = cc._decorator;

@ccclass
export default class TipsHero extends ViewBaseComponent {
    @property(HeroCommonInfoView)               commonInfo: HeroCommonInfoView = null;
    @property(HeroPropertyView)                 basicInfo: HeroPropertyView = null;
    @property(cc.Label)                         heroName: cc.Label = null;
    @property(cc.Node)                          friendInfo: cc.Node = null;
    @property([cc.Node])                        toggleItem: cc.Node[] = [];
    @property(cc.Node)                          toggleRoot: cc.Node = null;

    private _heroId: number = 0;
    private _curToggleIndex: number = 0;
    onInit(heroId: number) {
        this._heroId = heroId;
        this._curToggleIndex = 0;
        this.toggleItem[this._curToggleIndex].getComponent(cc.Toggle).isChecked = true;
        this._setHeroUI();
        this.commonInfo.onInit(this._heroId);
        this._switchShowView(this._curToggleIndex);
    }

    private _setHeroUI(){
        let fakeHero = pveFakeData.getFakeHeroById(this._heroId);
        let heroCfg = fakeHero ? configUtils.getHeroBasicConfig(pveFakeData.getRealHeroId(this._heroId)) : configUtils.getHeroBasicConfig(this._heroId);
        this.heroName.string = heroCfg.HeroBasicName;
    }

    onRelease() {
        eventCenter.unregisterAll(this);
        this.commonInfo.onRelease();
        this.basicInfo.onRelease();
        this.friendInfo.getComponent(HeroFriendView).onRelease();
        this.releaseSubView();
    }

    private _switchShowView(dlgType: number) {
        this.basicInfo.node.active = dlgType == 0;
        this.friendInfo.active = dlgType == 3;
        if(dlgType == 0) {
            this.basicInfo.onInit(this._heroId, null);
        } else if (dlgType == 3) {
            this.friendInfo.getComponent(HeroFriendView).onInit(this._heroId, this.node.parent);
        }
    }

    onClickToggle(toggle: cc.Toggle, customEventData: string) {
        if(this._curToggleIndex.toString() != customEventData) {
            this._curToggleIndex = parseInt(customEventData);
            this._switchShowView(this._curToggleIndex);
        }
    }
}
