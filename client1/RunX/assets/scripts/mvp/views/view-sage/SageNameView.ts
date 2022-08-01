import { utils } from "../../../app/AppUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { hasDirtyWord } from "../../../common/DirtyWord";
import { cfg } from "../../../config/config";
import { userOpt } from "../../operations/UserOpt";
import { eventCenter } from "../../../common/event/EventCenter";
import { useInfoEvent } from "../../../common/event/EventData";
import { data } from "../../../network/lib/protocol";
import { SCENE_NAME, VIEW_NAME } from "../../../app/AppConst";
import { configManager } from "../../../common/ConfigManager";
import guiManager from "../../../common/GUIManager";
import GetItemView from "../view-other/GetItemView";

const cfgsType1: cfg.RandomName[] = [];
const cfgsType2: cfg.RandomName[] = [];
const cfgsType3: cfg.RandomName[] = [];
const { ccclass, property } = cc._decorator;

@ccclass
export default class SageNameView extends ViewBaseComponent {
    @property(cc.EditBox) input: cc.EditBox = null;

    private _answerMap: { [k: string]: number } = {};

    protected onInit(answerMap: { [k: string]: number }): void {
        eventCenter.register(useInfoEvent.SAGE_QA_RES, this, this._onRecvSageRes);

        this._answerMap = answerMap;
        this.prepareData();
    }

    onRelease() {
        this.releaseSubView();
        eventCenter.unregisterAll(this);    
    }

    prepareData() {
        let nameCfgs: cfg.RandomName[] = configManager.getConfigList("randomName");
        cfgsType1.splice(0);
        cfgsType2.splice(0);
        cfgsType3.splice(0);
        nameCfgs.forEach(cfg => {
            cfg.RandomNameType == 1 && cfgsType1.push(cfg);
            cfg.RandomNameType == 2 && cfgsType2.push(cfg);
            cfg.RandomNameType == 3 && cfgsType3.push(cfg);
        })
        this.input.string = this._genRandomName();
    }

    onClickGenRandom(){
        this.input.string = this._genRandomName();
    }

    onClickContinue(){
        let name = this.input.string;
        if (hasDirtyWord(name)) {
            guiManager.showTips("文本含有敏感词汇，改名失败。");
            return;
        }

        if (name)
            userOpt.sendUniversalChooseMap(name, this._answerMap);
        else 
            guiManager.showDialogTips(1000046);
    }

    private _genRandomName(): string {
        let name = "";
        cfgsType1.length && (name += utils.getRandomInArray(cfgsType1).RandomNameText);
        cfgsType2.length && (name += utils.getRandomInArray(cfgsType2).RandomNameText);
        cfgsType3.length && (name += utils.getRandomInArray(cfgsType3).RandomNameText);
        if (name == this.input.string) {
            return this._genRandomName();
        }
        return name;
    }

    private _onRecvSageRes(cmd: any, rewards: data.IItemInfo[]){
        let self = this;
        if (rewards && rewards.length){
            this.loadSubView(VIEW_NAME.GET_ITEM_VIEW, rewards).then((view: GetItemView)=>{
                view.closeFunc = ()=>{
                    self.closeView()
                    guiManager.loadScene(SCENE_NAME.MAIN).then(()=>{
                    });
                }
            })
        }
    }
}