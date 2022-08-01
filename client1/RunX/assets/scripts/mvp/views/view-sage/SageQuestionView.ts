import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { cfg } from "../../../config/config";
import { configManager } from "../../../common/ConfigManager";
import guiManager from "../../../common/GUIManager";
import { logger } from "../../../common/log/Logger";
import { preloadItemBagPool } from "../../../common/res-manager/Preloaders";
import ItemSageQuestion from "./ItemSageQuestion";

const { ccclass, property } = cc._decorator;

@ccclass
export default class     extends ViewBaseComponent {
    @property(cc.Label) title: cc.Label = null;
    @property(cc.Prefab)  ndSage: cc.Prefab = null;
    @property(cc.Node) ndRoot: cc.Node = null;


    private _QAIndex: number = 0;
    private _configs: cfg.SageQA[] = [];
    private _configAns: string[] = [];
    private _configAnsDesc: string[] = [];
    private _answerMap: { [k: string]: number } = {};

    protected onInit(): void {
        this.stepWork.concact(preloadItemBagPool())
        .addTask(()=>{
            this._refreshWithQA();
        });
    }

    private _refreshWithQA(){
        let configs = configManager.getConfigList("sageQA");
        let config: cfg.SageQA = configs[this._QAIndex];
        this._configs = configs;
        this.ndRoot.removeAllChildren();
        if (config) {
            this._configAns = config.SageAnswer ? config.SageAnswer.split(';') : [];
            this._configAnsDesc = config.SageAnswerIntroduce ? config.SageAnswerIntroduce.split(';') : [];

            this.title.string = config.SageQuestion;
            for (let i = 0; i < this._configAns.length; i++) {
                let ndIns = cc.instantiate(this.ndSage);
                let comp = ndIns.getComponent(ItemSageQuestion);
                comp && comp.onInit(this._configAnsDesc[i], this._configAns[i], i, this._selectAnswer.bind(this));
                this.ndRoot.addChild(ndIns)
            }
        } else {
            // 提交选择结果
            this.submitRes();
        }
    }

    private _selectAnswer (answrIdx: number) {
        let config = this._configs[this._QAIndex];
        if (config){
            this._answerMap[config.ID] = answrIdx;
            this._QAIndex += 1;
            this._refreshWithQA();
        }
    }

    submitRes() {
        if (this._answerMap && this._QAIndex == this._configs.length){
            guiManager.loadView("SageNameView", null, this._answerMap).then(() => {
                this.closeView();
            })
        } else {
            logger.error("wrong answer number!");
        }      
    }
}