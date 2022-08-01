import Upgrade from "./detail/Upgrade";
import { logger } from "../common/log/Logger";
import { svrConfig } from "../network/SvrConfig";
import packageUtils from "../app/PackageUtils";
import { appCfg } from "../app/AppConfig";
import { ViewBaseComponent } from "../common/components/ViewBaseComponent";
import { configUtils } from "../app/ConfigUtils";
import { CustomDialogId } from "../app/AppConst";
import { audioManager } from "../common/AudioManager";

const { ccclass, property } = cc._decorator;

const restartGame = () => {
    // 原生直接重启可能会残留音乐缓存
    audioManager.stopMusic();
    setTimeout(() => {
        logger.log(`UpgradeComponent`, `重启了游戏`);
        cc.game.restart();
    }, 500);
}

@ccclass
export default class UpgradeComponent extends ViewBaseComponent {
    @property(cc.Node) nodeMessage: cc.Node = null;
    @property(cc.Label) lbHint: cc.Label = null;
    @property(cc.Label) lbVersion: cc.Label = null;
    @property(cc.Label) lbContent: cc.Label = null;
    @property(cc.Label) lbMsgHint: cc.Label = null;

    @property(cc.ProgressBar) progress: cc.ProgressBar = null;
    @property(cc.Label) lbProgress: cc.Label = null;
    @property(cc.Node) nodeBtnOk: cc.Node = null;
    @property(cc.Node) nodeBtnCancel: cc.Node = null;
    @property(cc.Node) progressActionNode: cc.Node = null;
    // @property(cc.Label) lbDesProgress: cc.Label = null;

    upgrade: Upgrade = null;

    private _succCallback: Function = null;
    private _okCallback: Function = null;
    private _cancelCallback: Function = null;

    /**记录进度条上一次的进度*/
    private _recordLastRate: number = 0;
    onInit() {
        this.nodeMessage.active = false;
        this.progress.node.active = false;
        this.lbHint.string = "";
        this.lbMsgHint.string = "";

        if (this.progress) {
            let widget = this.progress.node.getComponent(cc.Widget);
            if (widget) widget.updateAlignment();

            // this.progress.totalLength = this.progress.node.width;
            this.progress.barSprite.node.x = -0.5 * this.progress.totalLength;
            this.progress.progress = 0;
            if (this.progressActionNode) {
                this.progressActionNode.x = -this.progress.totalLength / 2;
                // this.progressActionNode.y = this.progress.node.y + 20;
            }
            this.progressActionNode && (this.progressActionNode.active = false);
        }
    }
    onLoad() {
      
    }

    /**开始热更资源*/
    startUpgrade(succCallback: Function) {
        logger.log(`开始热更资源`)
        this._succCallback = succCallback;
        this.upgrade = new Upgrade();
        this.upgrade.init([appCfg.checkUpgrade], packageUtils.getDeviceID(), packageUtils.getPackageVersion(), packageUtils.isUseWifi(), this);
        this.lbHint.string = "检查资源中。";
        this.upgrade.start();
    }

    /**配置检查更新*/
    startConfigUpgrade(succCallback: Function) {
        logger.log(`开始配置检查，this.uuid:${this.uuid}`);
        this._recordLastRate = 0;
        this._succCallback = succCallback;
        if (!this.upgrade) {
            this.upgrade = new Upgrade();
            this.upgrade.init([appCfg.checkUpgrade], packageUtils.getDeviceID(), packageUtils.getPackageVersion(), packageUtils.isUseWifi(), this);
            this.lbHint.string = "检查配置中";
        }
        this.upgrade.getRemoteBundleList();
    }

    /**
     * 获取到更新信息
     */
    whenGotUpgradeInfo() {
        appCfg.needReport = this.upgrade.needReportLog;
    }

    /**
     * 不需要更新
     */
    upgradeNoUpgrade(isAudit: boolean) {
        svrConfig.isAudit = isAudit;
        if (isAudit) {
            svrConfig.recommandSvr = this.upgrade.recommandServer;
        }

        this.lbHint.string = "";
        if (this._succCallback) {
            this._succCallback();
        }
    }

    /**
     * 体验版本无需热更
     */
    upgradeNoUpgradeExper(experValid: boolean) {
        if (!experValid) {
            this._showMessageBox("当前版本已无法体验，请更新最新体验版本", () => { cc.game.end(); }, "确定");
            return
        }
        

        this.lbHint.string = "";
        if (this._succCallback) {
            this._succCallback();
        }
    }

    /**
     * 检查更新失败
     */
    upgradeCheckUpgradeFailed(reason: string) {
        this.lbHint.string = "";
        let info = "您的网络有问题！请检查您当前的网络. 如果还有问题请联系客服. 详细错误:" + reason;
        this._letUserDecide(info, () => { this.upgrade.start(); });
    }

    /**
     * 重新检查更新成功
     */
    upgradeCheckUpgradeRetrySucc(times: number) {
        logger.log('Upgrade', `upgradeCheckUpgradeRetrySucc. times = ${times}`);
    }

    /**
     * 整包更新
     */
    upgradePackageUpgrade(url: string) {
        this.lbHint.string = "";
        this._showMessageBox("您的版本过旧，请前往应用商店更新", () => { cc.sys.openURL(url); }, "确定");
    }

    /**
     * 热更获取manifest
     */
    upgradeNeedRemoteManifest() {
        this.upgrade.getRemoteManifest();
    }

    /**
     * 更新资源
     */
    upgradeResUpgrade(optional: boolean, files: any) {
        svrConfig.isAudit = false;

        let totalSize = 0;
        for (const file in files) {
            let size = files[file].size;

            // 目前采用的阿里云cdn开启了智能压缩，传输过程中将会使用gzip对js,json,plist,atlas,pkm等文件进行压缩
            // 因此，实际下载的文件大小会大大减少，但由于压缩比例随内容不同而不同，所以只针对部分特殊的文件估计一下压缩后的大小
            if (file.indexOf("index.js") != -1) {
                size *= 0.4 // 某次项目主代码文件压缩率达到1094920/6927200，几乎达到16%
            }

            totalSize += size
        }

        this.lbHint.string = "";

        // 比较manifest文件后，发现不需要下载东西，直接算成功
        if (totalSize == 0 && optional) {
            this._succCallback();
            return
        }

        let hints = `文件大小：${(totalSize / 1024 / 1024).toFixed(2)}M`;
        this._showMessageBox(
            "请更新游戏资源文件",
            () => {
                this.upgrade.startResUpgrade();
                this.progress.node.active = true;
                if (this.progressActionNode) this.progressActionNode.active = true;
            }, "好的",
            optional ? () => {
                if (this._succCallback) this._succCallback();
            } : null, "不了", hints
        );
    }

    updateProgressActive(show:boolean = true) {
        this.lbProgress.node.active = !show;
        this.progress.node.active = show;
        if(!this.progressActionNode.active)this.progressActionNode.active = show;
    }

    //配置更新完成进入游戏
    upgradeConfigBundleProgress(curr: number, total: number, over: boolean = false) {
        if (over) {
            logger.log(`配置更新结束:${over},当前下载文件数:${curr},总文件数:${total}`);
            this.progressActionNode.children[0].getComponent(sp.Skeleton).clearTracks();
            this.progressActionNode.children[1].getComponent(sp.Skeleton).clearTracks();
            this._succCallback();
        }

        // this.lbDesProgress.string = `配置更新`;
        let rate = Math.floor(curr * 100 / total);
        let percent = Math.min(Math.max(rate, 0), 100);
        //只有增长十个点以上才运行
        if (rate - this._recordLastRate < 1) return;
        logger.log(`已下载资源数:${curr},总资源数:${total},this:${this.uuid}`);
        this._recordLastRate = percent;
        this.updateProgress(percent);

        // setInterval(() => {
        //     let percent = Math.random() * 100;
        //     this.updateProgress(percent);
        // },2000)
    }

    upgradeResUpgradeProgress(curr: number, total: number) {
        let percent = Math.min(Math.max(curr * 100 / total, 0), 100);
        this.updateProgress(percent);
    }

    updateProgress(percent:number) {
        if (this.progress) this.progress.progress = percent / 100;
        if (this.lbProgress) this.lbProgress.string = percent.toFixed(2) + "%";
        logger.log(`🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺资源更新百分比:${percent},totalLength:${this.progress.totalLength},prgress:${this.progress.progress}`);
        if (this.progressActionNode) {
            let currPos = percent / 100 * this.progress.totalLength;
            this.progressActionNode.x = -this.progress.totalLength / 2 + currPos;
        }
    }

    upgradeResUpgradeFatel(reason: string) {
        this._letUserDecide("更新失败, 详细错误:" + reason, restartGame);
    }

    upgradeResUpgradeResult(succ: boolean, task: any, reason: string) {
        if (succ) {
            this.progressActionNode.children[0].getComponent(sp.Skeleton).clearTracks();
            this.progressActionNode.children[1].getComponent(sp.Skeleton).clearTracks();
            this._showMessageBox("更新完成，重新启动游戏。", restartGame, "确定")
        } else {
            let infoCfg = configUtils.getDialogCfgByDialogId(CustomDialogId.NET_DISCONNECT);
            let info = infoCfg ? infoCfg.DialogText : "下载文件失败！请检查网络后重试。 详细错误:";
            info = info + reason + "(" + task.destPath.substr(-20, 20) + ")";
            this._letUserDecide(info, () => {
                this.upgrade.retryDownloadRes();
                return true;
            });
        }
    }

    onClickOk() {
        if (this._okCallback) {
            this._okCallback();
            this.nodeMessage.active = false;
        }
    }

    onClickCancel() {
        if (this._cancelCallback) {
            this._cancelCallback();
            this.nodeMessage.active = false;
        }
    }

    private _letUserDecide(detail: string, callback: Function) {
        this._showMessageBox(detail, callback, "重试");
    }

    private _showMessageBox(content: string, confirmFunc?: Function,
        confirmText?: string, cancelFunc?: Function, cancelText?: string, hints?: string) {

        this.nodeMessage.active = true;
        this.nodeBtnOk.active = false;
        this.nodeBtnCancel.active = false;
        this.lbContent.string = content || "";

        if (confirmFunc) {
            this.nodeBtnOk.active = true;
            if (confirmText) {
                let nodeLabel = this.nodeBtnOk.getChildByName('label');
                nodeLabel.getComponent(cc.Label).string = confirmText;
                this._okCallback = confirmFunc;
            }
        }

        if (cancelFunc) {
            this.nodeBtnCancel.active = true;
            if (cancelText) {
                let nodeLabel = this.nodeBtnCancel.getChildByName('label');
                nodeLabel.getComponent(cc.Label).string = cancelText;
                this._cancelCallback = cancelFunc;
            }
        }

        this.lbMsgHint.string = hints || '';
    }
}