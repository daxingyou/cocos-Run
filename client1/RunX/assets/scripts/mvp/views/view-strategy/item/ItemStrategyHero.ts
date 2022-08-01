

import { CustomDialogId } from "../../../../app/AppConst";
import { utils } from "../../../../app/AppUtils";
import guiManager from "../../../../common/GUIManager";
import moduleUIManager from "../../../../common/ModuleUIManager";
import { ItemStrategyDescPool } from "../../../../common/res-manager/NodePool";
import { cfg } from "../../../../config/config";
import ItemStrategyDesc from "./ItemStrategyDesc";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemStrategyHero extends cc.Component {
    @property(cc.Label) title: cc.Label = null;
    @property(cc.ProgressBar) progressBar: cc.ProgressBar = null;
    @property(cc.Label) progressLb: cc.Label = null;
    @property(cc.Label) progressDesc: cc.Label = null;
    @property(cc.Button) btnGo: cc.Button = null;
    @property(cc.Node) descContainor: cc.Node = null;

    private _descItems: ItemStrategyDesc[] = [];
    private _cfg:cfg.StrategyHero = null;
    private _getHeroPropFn: Function = null;

    init(cfg: cfg.StrategyHero, getHeroPropFn: Function) {
        this._cfg = cfg;
        this._getHeroPropFn = getHeroPropFn;
        this._initUI();
    }

    deInit() {
        this._getHeroPropFn = null;
        if(this._descItems && this._descItems.length > 0) {
            this._descItems.forEach(ele => {
                ItemStrategyDescPool.put(ele);
            });
            this._descItems.length = 0;
        }
    }

    private _initUI() {
        this.title.string = this._cfg.StrategyHeroTitle || '';
        this.progressDesc.string = this._cfg.StrategyHeroBarName || '';
        this._setProgress();

        let descArr = this._getDescs();
        if(!descArr || descArr.length == 0) return;

        let curPosy = 0, spaceY = 5;
        descArr.forEach((ele, idx) => {
            let comp = ItemStrategyDescPool.get();
            this._descItems.push(comp);
            comp.init(ele, 600);
            let nodeHeight = comp.itemHeight;
            if(idx != 0) {
              curPosy -= spaceY;
            }
            comp.node.setPosition(0, curPosy);
            comp.node.parent = this.descContainor;
            curPosy -= nodeHeight;
        })
    }

    refreshView() {
        this._setProgress();
    }

    private _setProgress() {
        let data = this._getHeroPropFn(this._cfg.StrategyHeroId);
        if(data && typeof data.maxV != 'undefined') {
            this.progressBar.progress = data.curV/data.maxV;
            this.progressLb.string = `${data.curV}/${data.maxV}`;
        } else {
            this.progressBar.progress = 0;
            this.progressLb.string = '0/0';
        }
    }

    private _getDescs() {
        let strs: string[] = null;
        if(!this._cfg.StrategyHeroIntroduce || this._cfg.StrategyHeroIntroduce.length == 0) return strs;
        let introduce = this._cfg.StrategyHeroIntroduce;
        let results = introduce.match(/\S+$/gm);
        return results;
    }

    onClickGo() {
        let jumpCfg = this._cfg.StrategyHeroJump;
         if(!jumpCfg || jumpCfg.length == 0){
             guiManager.showDialogTips(CustomDialogId.TASK_NO_DESTINATION);
             return;
         }

         let jumpData = utils.parseStringTo1Arr(jumpCfg, ';');
         let mID: number = jumpData[0] ? parseInt(jumpData[0]) : 0;
         let pID: number = jumpData[1] ? parseInt(jumpData[1]) : 0;
         moduleUIManager.jumpToModule(mID, pID);
    }
 }
