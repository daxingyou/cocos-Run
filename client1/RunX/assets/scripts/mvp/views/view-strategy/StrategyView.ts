/*
 * @Description:  攻略
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2022-05-25 17:27:28
 * @LastEditors: lixu
 * @LastEditTime: 2022-05-31 10:04:28
 */
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import guiManager from "../../../common/GUIManager";
import { preloadItemStrategyDescPool } from "../../../common/res-manager/Preloaders";
import { cfg } from "../../../config/config";
import StrategyEquipView from "./StrategyEquipView";
import StrategyFAQView from "./StrategyFAQView";
import StrategyGetItemView from "./StrategyGetItemView";
import StrategyHeroView from "./StrategyHeroView";
import StrategyRecommandTeamView from "./StrategyRecommandTeamView";
import StrategyStrongView from "./StrategyStrongView";

const {ccclass, property} = cc._decorator;

enum STRATEGY_VIEW_TYPE {
    NONE = 0,
    GO_STRONG,
    DEVELOP_HERO,
    EQUIP_STRONG,
    GET_ITEM,
    TEAM_RECOMMEND,
    NOEMAL_FAQ
}

@ccclass
export default class StrategyView extends ViewBaseComponent {
    @property(cc.ToggleContainer) togContainor: cc.ToggleContainer = null;
    @property(cc.Node) subViewRoot: cc.Node = null;

    private _curViewType: number = STRATEGY_VIEW_TYPE.NONE;
    private _curToggle: cc.Toggle = null;

    private _strongView: StrategyStrongView = null;
    private _heroView: StrategyHeroView = null;
    private _equipView: StrategyEquipView = null;
    private _getItemView: StrategyGetItemView = null;
    private _recommandTeamView: StrategyRecommandTeamView = null;
    private _FAQView: StrategyFAQView = null;
    private _currView: cc.Component = null;

    private _FAQCfgs: cfg.StrategyFAQ[] = null;
    private _equipStrongCfgs: cfg.StrategyEquip[] = null;
    private _getItemCfgs: cfg.StrategyMoney[] = null;
    private _heroStrongCfgs: cfg.StrategyHero[] = null;
    private _teamCfgs: cfg.StrategyTeam[] = null;

    preInit(...rest: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            preloadItemStrategyDescPool().start(() => {
                resolve(true);
            })
        });
    }

    protected onInit(...args: any[]): void {
        this.togContainor.toggleItems.some(ele => {
            if(ele.isChecked){
                ele.interactable = !ele.isChecked;
                this._curToggle = ele;
                this._curViewType = this._getViewType(ele.node.name);
                return true;
            }
            return false;
        });
        this._switchView();
    }

    protected onRelease(): void {
        this._strongView && this._strongView.closeView();
        this._heroView && this._heroView.closeView();
        this._equipView && this._equipView.closeView();
        this._getItemView && this._getItemView.closeView();
        this._recommandTeamView && this._recommandTeamView.closeView();
        this._FAQView && this._FAQView.closeView();
    }

    onToggleClicked(toggle: cc.Toggle) {
        if(this._curToggle == toggle) return;
        let lastToggle = this._curToggle;
        this._curToggle = toggle;
        lastToggle && cc.isValid(lastToggle.node) && (lastToggle.interactable = true);
        this._curToggle.interactable = false;
        this._curViewType = this._getViewType(toggle.node.name);
        this._switchView();
    }

    private _switchView() {
        let lastView = this._currView;
        lastView && (lastView.node.active = false);
        switch(this._curViewType) {
          case STRATEGY_VIEW_TYPE.GO_STRONG:
              if(this._strongView) {
                  this._currView = this._strongView;
                  this._currView.node.active = true;
              } else {
                  guiManager.loadView('StrategyStrongView', this.subViewRoot).then((view) => {
                      this._currView = this._strongView = view as StrategyStrongView;
                  });
              }
              break;
          case STRATEGY_VIEW_TYPE.DEVELOP_HERO:
              if(this._heroView) {
                  this._currView = this._heroView;
                  this._currView.node.active = true;
              } else {
                  guiManager.loadView('StrategyHeroView', this.subViewRoot).then((view) => {
                      this._currView = this._heroView = view as StrategyHeroView;
                  });
              }
              break;
          case STRATEGY_VIEW_TYPE.EQUIP_STRONG:
              if(this._equipView) {
                  this._currView = this._equipView;
                  this._currView.node.active = true;
              } else {
                  guiManager.loadView('StrategyEquipView', this.subViewRoot).then((view) => {
                      this._currView = this._equipView = view as StrategyEquipView;
                  });
              }
              break;
          case STRATEGY_VIEW_TYPE.GET_ITEM:
              if(this._getItemView) {
                  this._currView = this._getItemView;
                  this._currView.node.active = true;
              } else {
                  guiManager.loadView('StrategyGetItemView', this.subViewRoot).then((view) => {
                      this._currView = this._getItemView = view as StrategyGetItemView;
                  });
              }
              break;
          case STRATEGY_VIEW_TYPE.NOEMAL_FAQ:
              if(this._FAQView) {
                  this._currView = this._FAQView;
                  this._currView.node.active = true;
              } else {
                  guiManager.loadView('StrategyFAQView', this.subViewRoot).then((view) => {
                      this._currView = this._FAQView = view as StrategyFAQView;
                  });
              }
              break;
          case STRATEGY_VIEW_TYPE.TEAM_RECOMMEND:
              if(this._recommandTeamView) {
                  this._currView = this._recommandTeamView;
                  this._currView.node.active = true;
              } else {
                  guiManager.loadView('StrategyRecommandTeamView', this.subViewRoot).then((view) => {
                      this._currView = this._recommandTeamView = view as StrategyRecommandTeamView;
                  });
              }
              break;
          default:
              break;
        }
    }

    private _getViewType(nodeName: string) {
        if(nodeName == 'toggle1') {
            return STRATEGY_VIEW_TYPE.GO_STRONG;
        }

        if(nodeName == 'toggle2') {
            return STRATEGY_VIEW_TYPE.DEVELOP_HERO;
        }

        if(nodeName == 'toggle3') {
            return STRATEGY_VIEW_TYPE.EQUIP_STRONG;
        }

        if(nodeName == 'toggle4') {
            return STRATEGY_VIEW_TYPE.GET_ITEM;
        }

        if(nodeName == 'toggle5') {
            return STRATEGY_VIEW_TYPE.TEAM_RECOMMEND;
        }

        if(nodeName == 'toggle6') {
            return STRATEGY_VIEW_TYPE.NOEMAL_FAQ;
        }

        return STRATEGY_VIEW_TYPE.NONE;
    }
}
