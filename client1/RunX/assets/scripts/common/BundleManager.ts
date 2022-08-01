/**
 * @description  bundle管理
 */
export interface BUNDLE_CFG {
    NAME: string,
    VER: string,
    MD5?: string,
}

class BundleManager {
    /**测试时期手动维护一个远程Bundle列表*/
    private _remoteBundleList: string[] = [`Config`];
    /**本地维护一套bundle缓存,key:bundleName*/
    private _bundleList = new Map<string, BUNDLE_CFG>();
    /**获取可更新的bundleList*/
    public get bundleList(): Map<string, BUNDLE_CFG> {
        return this._bundleList;
    }
    /**
     * @description 加载bundle
     * @param options 指定参数-特定版本/下载回调等
     * @param bundleName bundle名
     * @returns 
     */
    loadBundle(bundleName: string, options: object = null): Promise<cc.AssetManager.Bundle> {
        return new Promise((resolve, reject) => {
            cc.assetManager.loadBundle(bundleName, options, (err: Error, bundle: cc.AssetManager.Bundle) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(bundle);
                }
            })
        })
    }

    /**
     * @description 储存bundle的本地信息,bundle名为key，value定义规则：`VER-MD5` 例如`3-xxxxxx`。版本为3，md5为xxxxx
     */
    bundleSaveLocal(cfg: BUNDLE_CFG) {
        if (!cfg) return;
        let value = cfg.MD5 ? `${cfg.VER}-${cfg.MD5}` : cfg.VER;
        localStorage.setItem(cfg.NAME, value);
        this._bundleList.set(cfg.NAME, cfg);
    }
    /**
     * @description 根据bundle名 获得本地的bundle信息
     */
    getBundleLocal(name: string): BUNDLE_CFG {
        if (!name) return null;
        let bundleValue: string = localStorage.getItem(name);
        if (!bundleValue || bundleValue.length == 0) return null;
        let values = bundleValue.split(`-`);
        let md5 = values.length > 1 ? values[1] : null;
        return {
            NAME: name, VER: values[0], MD5: md5
        } as BUNDLE_CFG;
    }
}

const bundleManager = new BundleManager();
export default bundleManager;

