/*
 * @Author: fly
 * @Date: 2021-03-16 11:13:51
 * @LastEditTime: 2021-03-16 13:41:58
 * @Description: 项目配置相关
 */

let appConfig = {
    // version
    _version: "0.0.1",
    _versionUpdated: false,
    getVersion(): string {
        try {
            if (cc.sys.isNative && !this._versionUpdated) {
                this._versionUpdated = true;
                let fileStr = jsb.fileUtils.getStringFromFile("manifest.json");
                let obj = JSON.parse(fileStr);
                if (obj && obj.version) this._version = obj.version;
            }
        } catch (error) {
        }
        return this._version
    },

    // 检查热更新
    checkUpgrade: "https://pk-login.zqgame.com/check_upgrade.php",
    // checkUpgrade: "http://192.168.55.16/upgrade/upgrade.json",
    // 检查bundle更新--（暂时使用本地地址，到时候替换生产）
    checkBundleList: "http://192.168.130.58/bundleList.json",
    // 远程配置地址
    remoteCfgUrl: "https://pk-login.zqgame.com/remoteCfg/remoteCfg.json",
    // 远程配置资源地址
    remoteResUrl: "https://pk-login.zqgame.com/remoteCfg/remoteRes/",
    // 上报地址
    reportUrl: "http://pk-login.zqgame.com:9880",
    needReport: false,

    // debug配置
    debug: {
        showFps: false,
        platform: "-1",
    },

    // 审核账号
    audit: {
        up18: ["jzgao181", "jzgao182", "jzgao183", "jzzhong181", "jzzhong182", "jzzhong183", "jzdi181", "jzdi182", "jzdi183", "jzbai181", "jzbai182", "jzbai183", "18gao", "18zhong", "18di1"],
        down8: ["jzgao81", "jzgao82", "jzzhong81", "jzzhong82", "jzdi81", "jzdi82", "8gao"],
        in9to15: ["jzgao91", "jzgao92", "jzzhong91", "jzzhong92", "jzdi91", "jzdi92", "9zhong"],
        in16to17: ["jzgao161", "jzgao162", "jzzhong161", "jzzhong162", "jzdi161", "jzdi162", "16di"]
    },

    globalClick: 0,
    //测试货币
    UseTestMoney: false
}


//#ZQBDEBUG
// appConfig.remoteCfgUrl = "http://192.168.55.19:8080/remoteCfg/remoteCfg.json"
//ZQBDEBUG#

export let appCfg = appConfig;
