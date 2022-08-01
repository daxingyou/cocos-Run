import FileHttpRequest from "./FileHttpRequest";
import { logger } from "../../common/log/Logger";
import MulitDownloader from "./MulitDownloader";
import UpgradeComponent from "../UpgradeComponent";
import { appCfg } from "../../app/AppConfig";
import bundleManager, { BUNDLE_CFG } from "../../common/BundleManager";
import { localStorageMgr } from "../../common/LocalStorageManager";

const CHECK_UPGRADE_TIMEOUT = 3000;
const UPGRADE_RES_INFO = 60000;
const UPGRADE_DIR = "upgrade/";
const UPGRADE_TMP_DIR = "upgrade_tmp/";
const UPGRADE_FLAG_IN_LOCAL = "UPGRADE_IS_RUNNING";

const RETRY_CHECK_UPGRADE = 1;

const checkManifestValid = (obj: any) => {
    if (obj.version && obj.files) return true;
    return false;
}

const getManifest = () => {
    try {
        let fileStr = jsb.fileUtils.getStringFromFile("manifest.json");
        let obj = JSON.parse(fileStr);
        logger.log('Upgrade', `res-version = ${obj.version}`);
        if (checkManifestValid(obj)) {
            return obj;
        }
        return { version: '0', files: {}};
    } catch (error) {
        return { version: '0', files: {}};
    }
}

interface CheckInfo {
    device: string,
    package_tag: string,
    package_version: string,
    res_version: string
}

interface UpgradeInfo {
    upgrade: string,
    url: string,
    experience: boolean
}

export default class Upgrade {
    private _httpReq: FileHttpRequest = null;
    private _mulitDownloader: MulitDownloader = null;

    private _delegate: UpgradeComponent = null;
    private _checkUrl: string[] = [];
    private _device: string = null;
    private _packageVer: string = null;
    private _resVersion: string = null;
    private _checkInfo: CheckInfo = null;

    // server return
    private _needReportLog: boolean = true;
    private _recommandServer: string = null;
    private _optional: boolean = false;
    private _upgradeInfo: UpgradeInfo = null;

    private _checkUpgradeRetry: number = 0;
    private _manifestRetry: number = 0;
    private _remoteManifest: any = null;
    private _resUpgradeFiles: any = null;
    private _cdnRoot: string = null;

    constructor () {
        this._httpReq = new FileHttpRequest();
        this._mulitDownloader = new MulitDownloader();
    }

    get needReportLog () {
        return this._needReportLog;
    }

    get recommandServer () {
        return this._recommandServer;
    }

    get detailVersion () {
        return `${this._packageVer}-${this._resVersion}`;
    }

    init (checkUrl: string[], device: string, packageVer: string, isWifi: boolean, delegate: any) {
        this._delegate = delegate;
        this._checkUrl = checkUrl;
        this._mulitDownloader.init(isWifi);

        this._resVersion = getManifest().version;
        this._packageVer = packageVer || "1.0.0";
        this._device = device || "none";

        let packageTag = "";
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            packageTag = "android";
        } else if (cc.sys.os == cc.sys.OS_IOS) {
            packageTag = "ios";
        }

        this._checkInfo = {
            device: this._device,
            package_tag: packageTag,
            package_version: this._packageVer,
            res_version: this._resVersion,
        }
    }

    clear () {
        this._checkUpgradeRetry = 0;
        this._manifestRetry = 0;
        this._remoteManifest = null;
        this._resUpgradeFiles = null;
        this._cdnRoot = null;
    }

    start () {
        this.clear();

        let url = this._checkUrl[0];
        this._httpReq.setCallback(this._whenUpgradeInfoGot.bind(this));
        this._httpReq.request(url, CHECK_UPGRADE_TIMEOUT, this._checkInfo);
    }

    private _whenUpgradeInfoGot (succ: boolean, response: string) {
        if (succ) {
            logger.log('Upgrade', `check upgrade succ: ${response}`);
            let obj;
            try {
                obj = JSON.parse(response);
            } catch (error) {
                logger.log('Upgrade', `check upgrade response is not a valid json: ${error}`);
            }

            if (obj && obj.upgrade) {
                if (this._checkUpgradeRetry > 0) {
                    this._delegate && this._delegate.upgradeCheckUpgradeRetrySucc(this._checkUpgradeRetry);
                }
                this._fetchLocalUpgradeInfo(obj);
                return;
            }
        } else {
            logger.log('Upgrade', `check upgrade failed: ${response}`);
        }

        let retryMax = Math.max(RETRY_CHECK_UPGRADE, this._checkUrl.length);
        if (this._checkUpgradeRetry == retryMax) {
            logger.log('Upgrade', `dont retry check upgrade.`);
            this._delegate && this._delegate.upgradeCheckUpgradeFailed(succ ? "invalid json" : response);
        } else {
            this._checkUpgradeRetry++;
            logger.log('Upgrade', `retry check upgrade. checkRetry = ${this._checkUpgradeRetry}`);

            let url = this._checkUrl[0];
            if (this._checkUrl.length > this._checkUpgradeRetry) {
                url = this._checkUrl[this._checkUpgradeRetry];
            }
            this._httpReq.setCallback(this._whenUpgradeInfoGot.bind(this));
            this._httpReq.request(url, CHECK_UPGRADE_TIMEOUT, this._checkInfo);
        }
    }

    private _fetchLocalUpgradeInfo (info: any) {
        this._processUpgradeInfo(info);

        this._delegate && this._delegate.whenGotUpgradeInfo();
        if (info.local_check_timeout > 0 && info.local_check) {
            // 测试服上下载更新文件
            logger.error("Upgrade", "no support for local_check.");
        } else {
            this._feedbackUpgrade();
        }
    }

    private _processUpgradeInfo (info: any) {
        if (info.white) this._needReportLog = true;
        if (info.server) this._recommandServer = info.server;
        if (info.optional) this._optional = true;

        this._upgradeInfo = {
            upgrade: info.upgrade,
            url: info.url,
            experience: info.experience ? true : false,
        }
    }

    private _feedbackUpgrade () {
        logger.log('Upgrade', "start upgrade", JSON.stringify(this._upgradeInfo));

        if (this._upgradeInfo.upgrade == 'none') {
            this._delegate && this._delegate.upgradeNoUpgrade(false);
        } else if (this._upgradeInfo.upgrade == 'audit') {
            if (this._delegate) this._delegate.upgradeNoUpgrade(true);
        } else if (this._upgradeInfo.upgrade == 'package') {
            if (this._delegate) this._delegate.upgradePackageUpgrade(this._upgradeInfo.url);
        } else if (this._upgradeInfo.upgrade == 'res') {
            if (this._delegate) this._delegate.upgradeNeedRemoteManifest()
        } else if (this._upgradeInfo.upgrade == 'experience') {
            if (this._delegate) this._delegate.upgradeNoUpgradeExper(this._upgradeInfo.experience)
        } else {
            if (this._delegate) this._delegate.upgradeNoUpgrade(false);
        }
    }

    getRemoteManifest () {
        this._httpReq.setCallback(this._whenRemoteManifestGot.bind(this));
        this._httpReq.request(this._upgradeInfo.url, UPGRADE_RES_INFO, {});
    }

    private _whenRemoteManifestGot(succ: boolean, response: string) {
        logger.log("Upgrade", "_whenRemoteManifestGot.");
        if (succ) {
            let obj;
            try {
                obj = JSON.parse(response);
            } catch (error) {
                obj = {};
            }

            let valid = checkManifestValid(obj);
            if (!valid) {
                logger.log('Upgrade', `remote manifest invalid. response = ${response}`);
                this._delegate && this._delegate.upgradeCheckUpgradeFailed("invalid remote manifest");
            } else {
                this._remoteManifest = obj;
                this._resUpgradeFiles = {};
                this._cdnRoot = obj.root;

                let localManifest = getManifest();
                for (const fileName in this._remoteManifest.files) {
                    let remoteInfo = this._remoteManifest.files[ fileName ];
                    let localInfo = localManifest.files[ fileName ];
                    if (!localInfo || localInfo.md5 != remoteInfo.md5) {
                        this._resUpgradeFiles[ fileName ] = remoteInfo;
                    }
                }
                this._delegate && this._delegate.upgradeResUpgrade(this._optional, this._resUpgradeFiles);
            }
        } else {
            this._manifestRetry++;
            if (this._manifestRetry < 3) {
                let url = this._upgradeInfo.url + "?v=" + this._manifestRetry;
                this._httpReq.setCallback(this._whenRemoteManifestGot.bind(this));
                this._httpReq.request(url, UPGRADE_RES_INFO, {});
            } else {
                this._delegate && this._delegate.upgradeCheckUpgradeFailed(`fetch manifest failed. ${response}`);
            }
        }
    }

    startResUpgrade () {
        this._mulitDownloader.clear();
        this._mulitDownloader.setCallback(this._whenDownloadProgress.bind(this),this._whenDownloadResult.bind(this));

        let downloadPath = jsb.fileUtils.getWritablePath() + UPGRADE_TMP_DIR;
        for (const fileName in this._resUpgradeFiles) {
            let info = this._resUpgradeFiles[ fileName ];
            this._mulitDownloader.addTask(this._cdnRoot + fileName, downloadPath + fileName, info.md5);
        }

        this._mulitDownloader.start();
    }

    retryDownloadRes () {
        this._mulitDownloader.start();
    }

    private _whenDownloadProgress (curr: number, total: number) {
        logger.log(`Upgrade`, `_whenDownloadProgress. curr = ${curr}, total = ${total}`);
        this._delegate && this._delegate.upgradeResUpgradeProgress(curr, total);
    }

    private _whenDownloadResult (succ: boolean, task: any, reason: string) {
        logger.log(`Upgrade`, `_whenDownloadResult. succ = ${succ}`);
        if (succ) {
            let writablePath = jsb.fileUtils.getWritablePath();
            let upgradeDirPath = writablePath + UPGRADE_DIR;
            let manifestDest = upgradeDirPath + "manifest.json";
            
            jsb.fileUtils.writeStringToFile("1", writablePath + UPGRADE_FLAG_IN_LOCAL);
            for (const fileName in this._resUpgradeFiles) {
                let index = fileName.lastIndexOf("/");
                let dirPath = fileName.substr(0, index);

                let ret = jsb.fileUtils.createDirectory(upgradeDirPath + dirPath);
                //@ts-ignore
                if (ret) jsb.fileUtils.renameFile(writablePath, UPGRADE_TMP_DIR + fileName, UPGRADE_DIR + fileName);
                if (!ret) {
                    logger.log('Upgrade', "sync file failed:", fileName);
                    jsb.fileUtils.removeDirectory(upgradeDirPath);
                    jsb.fileUtils.writeStringToFile("0", writablePath + UPGRADE_FLAG_IN_LOCAL);
                    if (this._delegate) {
                        this._delegate.upgradeResUpgradeFatel("sync temp failed:" + fileName);
                        return;
                    }
                }
            }

            let ret = jsb.fileUtils.createDirectory(upgradeDirPath) ? true : false;
            if (ret) ret = jsb.fileUtils.writeStringToFile(JSON.stringify(this._remoteManifest), manifestDest);
            if (!ret) {
                logger.log('Upgrade', "sync manifest failed");
                jsb.fileUtils.removeDirectory(upgradeDirPath);
                jsb.fileUtils.writeStringToFile("0", writablePath + UPGRADE_FLAG_IN_LOCAL);
                if (this._delegate) {
                    this._delegate.upgradeResUpgradeFatel("sync manifest failed");
                }
            } else {
                jsb.fileUtils.writeStringToFile("0", writablePath + UPGRADE_FLAG_IN_LOCAL);
                this._resVersion = this._remoteManifest.version;
                if (this._delegate) this._delegate.upgradeResUpgradeResult(true, null, null);
            }
        } else {
            if (this._delegate) this._delegate.upgradeResUpgradeResult(succ, task, reason);
        }
    }


    //▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼目前是放置于热更内做连续进度条展示，可单独移植▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
    private _whenRemoteBundleGot(succ: boolean, response: string) {
        if (succ) {
            let isNeedUpdate = (localCfg: BUNDLE_CFG, remoteCfg: BUNDLE_CFG): boolean => {
                if (!localCfg) return true;
                if (localCfg.VER != remoteCfg.VER) return true;
                if (localCfg.MD5 != remoteCfg.MD5) return true;
                return false;
            }
            logger.log(`_whenRemoteBundleGot Suc`);
            let resJson: BUNDLE_CFG[] = JSON.parse(response);
            let allLen = resJson.concat().length,isUpdated = 0;
            while (resJson && resJson.length > 0) {
                let obj = resJson.splice(resJson.length - 1, 1)[0];
                let localCfg = bundleManager.getBundleLocal(obj.NAME);
                let isUpdate = isNeedUpdate(localCfg, obj);
                logger.log(`localCfg:${JSON.stringify(localCfg)},remoteObj:${JSON.stringify(obj)},isUpdate:${isUpdate}`);
                // if(isUpdate && ++isUpdated)this.bundleListLoad(obj, allLen);
                //存疑，bundle加载过一次至缓存后是否还需要进行加载
                this.bundleListLoad(obj, allLen);
            }
            // if (isUpdated == 0) this._changeProgress(0, 0, true);
        } else {
            logger.log(`is not  _whenRemoteBundleGot`);
        }
    }

    private _changeProgress(finish: number, total: number, over: boolean = false) {
        this._delegate&&this._delegate.upgradeConfigBundleProgress(finish, total,over);
    }

    bundleListLoad(obj: BUNDLE_CFG, allNum: number) {
        if (!obj) return;
        if (!this._delegate) return;
        //显示配置相关
        this._delegate.updateProgressActive();
        let options: any = {};
        // this._changeProgress(0,0);
        options[`onFileProgress`] = (finish: number, total: number) => {
            if ((finish == total) && (bundleManager.bundleList.size != allNum)) finish = 0;
            this._changeProgress(finish, total);      
        };
        if (obj.MD5) {
            options[`version`] = obj.MD5;
        }
        let bundle = bundleManager.loadBundle(obj.NAME, options);
        bundle.then(bundle => {
            bundleManager.bundleSaveLocal(obj);
            logger.log(`load Suc bundleName:${bundle.name}`);
            if (bundleManager.bundleList.size >= allNum) {
                // this._delegate.upgradeConfigBundleProgress(1, 1, true);
                this._changeProgress(1, 1, true);
                // this._delegate.progressData(1, 1);
            }
        }).catch(err => {
            logger.log(`bundle load err reason:${err}`);
        })
    }

    /**请求远程bundleList列表
     * @description 目前是依赖于热更界面
    */
    getRemoteBundleList() {
        this.clear();
        this._httpReq.setCallback(this._whenRemoteBundleGot.bind(this));
        this._httpReq.request(appCfg.checkBundleList, CHECK_UPGRADE_TIMEOUT, {});
    }
}