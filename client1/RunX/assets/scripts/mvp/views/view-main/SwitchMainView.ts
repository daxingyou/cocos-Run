import { HEAD_ICON } from "../../../app/AppEnums";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager, ConfigManager } from "../../../common/ConfigManager";
import { localStorageMgr, SAVE_TAG } from "../../../common/LocalStorageManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { bagData } from "../../models/BagData";
import { userData } from "../../models/UserData";

const {ccclass, property} = cc._decorator;

enum VIEW_TYPE {
    HERO = 1,
    BG
}

interface ChangeInfo {
    Image: string, 
    Index: number
}

interface UNLOCK_INFO  {
    IsUnlock: boolean,
    Type: number,
    Value: number
}

@ccclass
export default class SwitchMainView extends ViewBaseComponent {
    @property(cc.Node)              content: cc.Node = null;
    @property(cc.Node)              contentBg: cc.Node = null;
    @property([cc.SpriteFrame])     bgsSFList: cc.SpriteFrame[] = [];
    @property(cc.Node)              templatesParent: cc.Node = null;
    @property(cc.ScrollView)        ctxScroll: cc.ScrollView = null;

    @property(cc.Node)              templateBg: cc.Node = null;
    @property(cc.Node)              templateHero: cc.Node = null;
    
    private _heroList: cfg.ChangeBg[] = [];
    private _changeBgCfgs: cfg.ChangeBg[] = [];
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _switchFunc: Function = null;
    private _closeFunc: Function = null;
    private _curToggleIndex: number = 1;
    onInit(switchFunc: Function, closeFunc: Function) {
        this._switchFunc = switchFunc;
        this._closeFunc = closeFunc;
        this._refreshHeroListView();
        this._refreshBgListView();
        this.contentBg.active = false;
        this.content.active = true;
    }

    onRelease() {
        this._spriteLoader.release();        
        this.content.removeAllChildren(true);
        this.contentBg.removeAllChildren(true);
    }

    private _refreshHeroListView() {
        if(this._heroList.length == 0) {
            this._heroList = this._getHeroList();
        }
        let changeHeroHead = (cfg: cfg.ChangeBg, sprite: cc.Sprite) => {
            let heroId = utils.parseStingList(cfg.ChangeBgOpenCondition)[1];
            let url = resPathUtils.getItemIconPath(heroId, HEAD_ICON.SQUARE);
            if(url) {
                this._spriteLoader.changeSpriteP(sprite, url).catch(() => {
                    if(sprite.spriteFrame) {
                        this._spriteLoader.deleteSprite(sprite);
                    }
                });
            } 
        }

        for(let i = 0; i < this._heroList.length; ++i) {
            let cfg = this._heroList[i];
            let headNode = cc.instantiate(this.templateHero);
            this.content.addChild(headNode);
            headNode.active = true;
            let headSpNd = headNode.getChildByName("HEAD");

            if (headSpNd) {
                let sfHead = headNode.getComponent(cc.Sprite);
                if (sfHead) changeHeroHead(this._heroList[i], sfHead);
            }

            let btnComp = headNode.getComponent(cc.Button);
            let clickInfo: ChangeInfo = {
                Image: cfg.ChangeBgImage,
                Index: i,
            }
            if (btnComp) btnComp.clickEvents[0].customEventData = JSON.stringify(clickInfo)
            

            // headNode.targetOff(this);
            // headNode.on(cc.Node.EventType.TOUCH_END, () => {
            //     this.onClickItem(1, cfg.ChangeBgImage, i);
            // }, this);
        }
        this._refreshCurSelected();
    }

    onClickChangeBg (event: cc.Event, customEventData: string) {
        if (!customEventData) {
            return;
        }

        let info: ChangeInfo = JSON.parse(customEventData)
        this.onClickItem(2, info.Image, info.Index)
    }

    onClickChangeHero (event: cc.Event, customEventData: string) {
        if (!customEventData) {
            return;
        }

        let info: ChangeInfo = JSON.parse(customEventData)
        this.onClickItem(1, info.Image, info.Index)
    }

    private _refreshBgListView() {
        if(this._changeBgCfgs.length <= 0) {
            this._changeBgCfgs = this._getBgList();
        }
        let sprite: cc.Sprite = null;
        let changeBg = (bgName: string, sprite: cc.Sprite) => {
            let sf = this.bgsSFList.find(_sf => {
                return _sf.name == bgName;
            });
            if(sf) {
                if(sprite.spriteFrame) {
                    this._spriteLoader.deleteSprite(sprite);
                }
                sprite.spriteFrame = sf;
            } else {
                if(sprite.spriteFrame) {
                    this._spriteLoader.deleteSprite(sprite);
                }
            }
        }

        for(let i = 0; i < this._changeBgCfgs.length; ++i) {
                let bgInfo = this._changeBgCfgs[i];
                let item = cc.instantiate(this.templateBg);
                this.contentBg.addChild(item);
                item.active = true;
                sprite = item.children[0].getComponent(cc.Sprite);
                changeBg(bgInfo.ChangeBgImage, sprite);
                let unLockInfo = this._checkUnlock(bgInfo.ChangeBgOpenCondition);
                item.color = unLockInfo.IsUnlock ? cc.Color.WHITE: cc.Color.GRAY;
                let btnComp = item.getComponent(cc.Button);
                let clickInfo: ChangeInfo = {
                    Image: bgInfo.ChangeBgImage,
                    Index: i,
                }
                if (btnComp) btnComp.clickEvents[0].customEventData = JSON.stringify(clickInfo)
        }
        this._refreshCurSelected();
    }

    private _refreshCurSelected() {
        let changeBgInfo = localStorageMgr.getAccountStorage(SAVE_TAG.CHANGE_BG);
        if(this._curToggleIndex == 1) {
            let modelId: number = 0;
            if(changeBgInfo && changeBgInfo.modelId != 0) {
                modelId = changeBgInfo.modelId;
            } else {
                let basicConfig: cfg.ConfigBasic = configUtils.getBasicConfig();
                let mainDefaultHero = basicConfig.MainDefaultHero || 2018;
                modelId = Number(configUtils.getChangeBgConfig(mainDefaultHero).ChangeBgImage);
            }
            if(modelId) {
                let curIndex = this._heroList.findIndex(_h => {
                    let heroId = _h.ChangeBgOpenCondition.split('|')[1];
                    let heroConfig = configUtils.getHeroBasicConfig(Number(heroId));
                    return heroConfig && heroConfig.HeroBasicModel == modelId;
                });
                this._refreshHeroSelected(curIndex);
            }
        } else {
            let changeBgCfg: cfg.ChangeBg = null;
            if(changeBgInfo && changeBgInfo.bgName != '') {
                changeBgCfg = configManager.getConfigByKV('changeBg', 'ChangeBgImage', changeBgInfo.bgName)[0];
            }
            if(!changeBgInfo || changeBgInfo.bgName == '' || !changeBgCfg) {
                let basicConfig: cfg.ConfigBasic = configUtils.getBasicConfig();
                let mainDefaultBg = basicConfig.MainDefaultBg || 1001;
                changeBgCfg = configUtils.getChangeBgConfig(mainDefaultBg);
            }
            let bgIndex: number = changeBgCfg.ChangeBgNum;
            this._refreshBgSelected(bgIndex - 1);
        }

    }

    onClickToggle(toggle: cc.Toggle, customEventData: string) {
        if(customEventData != this._curToggleIndex.toString()) {
            this._curToggleIndex = parseInt(customEventData);
            if(this._curToggleIndex == 1) {
                this.content.active = true;
                this.contentBg.active = false;
                this.ctxScroll.content = this.content;
            } else {
                this.content.active = false;
                this.contentBg.active = true;
                this.ctxScroll.content = this.contentBg;
            }
        }
    }

    onClickItem(type: number, value: string, index: number) {
        if(this._switchFunc) {
            this._switchFunc(type, value);
        }

        if (type == 2) {
            this._refreshBgSelected(index);
        } else {
            this._refreshHeroSelected(index);
        }
    }

    private _refreshHeroSelected(index: number) {
        this.content.children.forEach((_c, _index) => {
            _c.children[1].active = _index == index;
        });
    }

    private _refreshBgSelected(index: number) {
        this.contentBg.children.forEach((_c, _index) => {
            _c.children[1].active = _index == index;
        });
    }

    closeView() {
        if(this._closeFunc) {
            this._closeFunc();
        }
        super.closeView();
    }

    private _getHeroList() {
        let changeHeroCfgs: {[k: number]: cfg.ChangeBg} = configManager.getConfigByKV('changeBg', 'ChangeBgType', 2);
        let heroList: cfg.ChangeBg[] = [];
        for(const k in changeHeroCfgs) {
            let condition = changeHeroCfgs[k].ChangeBgOpenCondition;
            let unLockInfo = this._checkUnlock(condition);
            if(unLockInfo.IsUnlock || changeHeroCfgs[k].ChangeBgLockType == 2) {
                heroList.push(changeHeroCfgs[k]);
            }
        }
        return heroList;
    }

    private _getBgList(): cfg.ChangeBg[] {
        let changeHeroCfgs: {[k: number]: cfg.ChangeBg} = configManager.getConfigByKV('changeBg', 'ChangeBgType', 1);
        let bgList = [];
        for(const k in changeHeroCfgs) {
            bgList.push(changeHeroCfgs[k]);
        }
        return bgList;
    }

    private _checkUnlock(openCondition: string): UNLOCK_INFO {
        let unLockInfo: UNLOCK_INFO = {
            IsUnlock: true,
            Type: 0,
            Value: 0
        };
        if(openCondition) {
            let conditionList = utils.parseStingList(openCondition);
            let type: number = Number(conditionList[0]);
            let id: number = Number(conditionList[1]);
            unLockInfo.Type = type;
            unLockInfo.Value = id;
            // 英雄
            if(type == 3) {
                if(!bagData.getHeroById(id)) {
                    unLockInfo.IsUnlock = false;
                }
            } else if(type == 1) {
                // 等级
                if(userData.lv < id) {
                    unLockInfo.IsUnlock = false;
                }
            }
        }
        return unLockInfo;
    }
}
