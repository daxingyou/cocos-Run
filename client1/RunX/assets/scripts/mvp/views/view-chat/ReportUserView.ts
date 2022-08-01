import { appCfg } from "../../../app/AppConfig";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { hasDirtyWord } from "../../../common/DirtyWord";
import { eventCenter } from "../../../common/event/EventCenter";
import { useInfoEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { cfg } from "../../../config/config";
import HttpRequest from "../../../network/HttpRequest";
import { userData } from "../../models/UserData";

const {ccclass, property} = cc._decorator;

const PER_FREAM_CREAT = 3;
@ccclass
export default class ReportUserView extends ViewBaseComponent {

    @property(cc.Label) userName: cc.Label = null;
    @property(cc.ToggleContainer) containor: cc.ToggleContainer = null;
    @property(cc.Toggle) toggleTemplate: cc.Toggle = null;
    @property(cc.EditBox) additionalMark: cc.EditBox = null;
    @property(cc.Node) btnSunmit: cc.Node = null;

    static reportUrl: string = null;
    static reportReq: HttpRequest = null;

    private _reasonCfgs: cfg.ReportReason[] = null;
    private _reasonItems: cc.Node[] = null;
    private _uID: string = null;

    private _closeCb: Function = null;

    set closeCb(func: Function) {
        this._closeCb = func;
    }

    preInit(...rest: any[]): Promise<any> {
        this._reasonCfgs = this._reasonCfgs || configManager.getConfigList('reportReason');
        if(!this._reasonCfgs || this._reasonCfgs.length == 0)   return Promise.resolve(true);
        this._reasonItems = this._reasonItems || [];
        if(this._reasonItems.length >= this._reasonCfgs.length) return Promise.resolve(true);

        for(let i = this._reasonItems.length, len = this._reasonCfgs.length; i < len; i+= PER_FREAM_CREAT) {
            let count = i + PER_FREAM_CREAT >  len ?  len - i : PER_FREAM_CREAT;
            this.stepWork.addTask(() => {
                for(let j = 0; j < count; j++) {
                    this._reasonItems.push(cc.instantiate(this.toggleTemplate.node));
                }
            })
        }
        return new Promise((resolve, reject) => {
            this.stepWork.start(() => {
                resolve(true);
            });
        });
    }

    protected onInit(transData: {[key: string]: any}): void {
        eventCenter.register(useInfoEvent.REPORT_USER, this, this._onReportCb)
        if(!this._reasonCfgs || this._reasonCfgs.length == 0) return;
        this.containor.node.removeAllChildren();
        this._uID = transData.uID || '';
        let halfW = this.containor.node.width >> 1;
        this._reasonCfgs.forEach((ele, idx) => {
            let node = this._reasonItems.pop();
            node.parent = this.containor.node;
            node.x = idx % 2 == 0 ? -halfW : 0;
            let row = Math.floor(idx >> 1);
            node.y = -row * (node.height + 10);
            node.data = ele.ReportReasonId;
            node.active = true;
            let lb = node.getChildByName('txt');
            lb.getComponent(cc.Label).string = ele.ReportReasonText;
        });

        this.userName.string = transData.userName || '';
    }

    protected onRelease(): void {
        eventCenter.unregisterAll(this);
        let msg = this.additionalMark.string;
        this.containor.node.destroyAllChildren();
        this._reasonItems.length = 0;
        this._closeCb = null;
    }

    onToggleChange(toggle: cc.Toggle) {

    }

    closeView(isUseCloseAction?: boolean): void {
        super.closeView(isUseCloseAction);
        this._closeCb && this._closeCb();
    }

    onClickSubmit() {
        let reasonID = -1;
        this.containor.toggleItems.some(ele => {
            if(ele.isChecked) {
                reasonID = ele.node.data;
                return true;
            }
            return false;
        });

        if(reasonID == -1) {
            guiManager.showDialogTips(1000139);
            return ;
        }

        let additionalMark = this.additionalMark.string;
        if(additionalMark && additionalMark.length > 0) {
            if (hasDirtyWord(additionalMark)) {
                guiManager.showTips("文本含有敏感词汇，发送失败。");
                return
            }
        }
        //举报
        this._reportToSvr(this._uID, reasonID, additionalMark);
    }

    //上报
    private _reportToSvr(uId: string, reasonID: number, feedback?: string) {
        ReportUserView.reportUrl = ReportUserView.reportUrl || `${appCfg.reportUrl}/clientfeed-report`;
        if(ReportUserView.reportReq) {
            guiManager.showTips('正在举报中，请稍后');
            return;
        }
        ReportUserView.reportReq = new HttpRequest();
        ReportUserView.reportReq.request(ReportUserView.reportUrl, {
            userId: userData.uId,
            timestamp: 0,
            informer: uId,
            informType: `${reasonID}`,
            feedback: feedback || ''
        }, null, true).then(res => {
            ReportUserView.reportReq = null;
            eventCenter.fire(useInfoEvent.REPORT_USER);
        }).catch((errDesc => {
            guiManager.showTips(errDesc);
            ReportUserView.reportReq = null;
        }));
    }

    private _onReportCb() {
        this.closeView();
    }
}

