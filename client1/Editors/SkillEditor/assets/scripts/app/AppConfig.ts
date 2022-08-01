/*
 * @Author: fly
 * @Date: 2021-03-16 11:13:51
 * @LastEditTime: 2021-03-16 13:41:58
 * @Description: 项目配置相关
 */

let appConfig = {

    // version
    _version: "0",
    _versionUpdated: false,
    getVersion(): string {
        try {
            //@ts-ignore
            if (cc.sys.isNative && !this._versionUpdated) {
                this._versionUpdated = true;
                //@ts-ignore
                let fileStr = jsb.fileUtils.getStringFromFile("manifest.json");
                let obj = JSON.parse(fileStr);
                if (obj && obj.version) this._version = obj.version;
            }
        } catch (error) {
        }
        return this._version
    },

    // 检查热更新
    checkUpgrade: "http://47.101.158.114/check_upgrade.php",

    // webServer

    // debug
    debug: {
        showFps: false,
    }
}

export let appCfg = appConfig;
