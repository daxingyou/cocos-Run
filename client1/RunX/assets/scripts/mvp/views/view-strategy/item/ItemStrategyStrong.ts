

import { CustomDialogId } from "../../../../app/AppConst";
import { utils } from "../../../../app/AppUtils";
import guiManager from "../../../../common/GUIManager";
import moduleUIManager from "../../../../common/ModuleUIManager";
import { ItemStrategyDescPool } from "../../../../common/res-manager/NodePool";
import { cfg } from "../../../../config/config";
import { StrategyStrongData } from "../StrategyStrongView";
import ItemStrategyDesc from "./ItemStrategyDesc";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemStrategyStrong extends cc.Component {
    @property(cc.Label) title: cc.Label = null;
    @property(cc.ProgressBar) progressBar: cc.ProgressBar = null;
    @property(cc.Label) progressLb: cc.Label = null;
    @property(cc.Label) progressDesc: cc.Label = null;
    @property(cc.Button) btnGo: cc.Button = null;
    @property(cc.Node) descContainor: cc.Node = null;

    private _descItems: ItemStrategyDesc[] = [];
    private _cfg:cfg.StrategyStrong = null;
    private _pregressInfo: StrategyStrongData = null;

    init(cfg: cfg.StrategyStrong, pregressInfo: StrategyStrongData) {
        this._cfg = cfg;
        this._pregressInfo = pregressInfo;
        this._initUI();
    }

    deInit() {
        if(this._descItems && this._descItems.length > 0) {
            this._descItems.forEach(ele => {
                ItemStrategyDescPool.put(ele);
            });
            this._descItems.length = 0;
        }
    }

    private _initUI() {
        this.title.string = this._cfg.StrategyStrongTitle || '';
        this.progressDesc.string = this._cfg.StrategyStrongBarName || '';
        this.progressBar.progress = (this._pregressInfo && this._pregressInfo.maxV) ? (this._pregressInfo.curV / this._pregressInfo.maxV) : 0;
        this.progressLb.string = this._pregressInfo ? `${this._pregressInfo.curV}/${this._pregressInfo.maxV}` : '0/0';

        let descArr = this._getStrongDescs();
        if(!descArr || descArr.length == 0) return;

        let curPosy = 0, spaceY = 5;
        descArr.forEach((ele, idx) => {
            let comp = ItemStrategyDescPool.get();
            this._descItems.push(comp);
            comp.init(ele);
            let nodeHeight = comp.itemHeight;
            if(idx != 0) {
              curPosy -= spaceY;
            }
            comp.node.parent = this.descContainor;
            comp.node.setPosition(0, curPosy);
            curPosy -= nodeHeight;
        })
    }

    private _getStrongDescs() {
        let strs: string[] = null;
        if(!this._cfg.StrategyStrongIntroduce || this._cfg.StrategyStrongIntroduce.length == 0) return strs;
        let introduce = this._cfg.StrategyStrongIntroduce;
        let results = introduce.match(/\S+$/gm);
        return results;
    }

    onClickGo() {
        let jumpCfg = this._cfg.StrategyStrongJump;
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
