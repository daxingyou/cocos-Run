import { logger } from "../common/log/Logger";
import { LoadCallback } from "../common/res-manager/ResourcePreloader";

interface MaterialInfo {
    key: string;
    name: string;
}

class MaterialHelper {
    private _customCache = new Map<string, cc.Material>();
    private _materialMap = new Map<string, MaterialInfo>();

    constructor () {
        this._addMaterial({key: 'BMFontEX', name: 'MaterialBMFontEX'});
    }

    /**
     * @desc 查询材质，根据名称查询；材质一般是在游戏启动的时候，优先加载的；
     *
     * @param {string} key
     * @param {cc.RenderComponent} renderComponent
     * @returns {cc.Material}
     * @memberof MaterialHelper
     */
    getMaterial (key: string, renderComponent: cc.RenderComponent): cc.Material {
        if (this._materialMap.has(key)) {
            const info = this._materialMap.get(key);
            const url = `material/${info.name}`;
            if (this._customCache.has(url)) {
                return cc.MaterialVariant.create(this._customCache.get(url), renderComponent);
            } else {
                logger.warn('Material', `Can not find material ${key} in cache. may preload failed ?`);
            }
        } else {
            logger.warn('Material', `Can not find material for key = ${key}`);
        }
        return null;
    }

    private _addMaterial(info: MaterialInfo) {
        this._materialMap.set(info.key, info);
        if (CC_EDITOR) {
            this.preloadItem(info.key, () => {});
        }
    }

    get allKeys (): string[] {
        const ret: string[] = [];
        this._materialMap.forEach((v, k) => {
            ret.push(k);
        });
        return ret;
    }

    get allNeedPreloadKeys (): string[] {
        const ret: string[] = [];
        this._materialMap.forEach((v, k) => {
            const url = `material/${v.name}`;
            if (!this._customCache.has(url)) {
                ret.push(k);
            }
        });
        return ret;
    }

    preloadItem (key: string, callback: LoadCallback) {
        const info = this._materialMap.get(key);
        if (!info) {
            callback(`Can not find material for key = ${key}`);
        } else {
            const url = `material/${info.name}`;
            if (this._customCache.has(url)) {
                callback();
            } else {
                try {
                    cc.resources.load(url, cc.Material, (err, asset) => {
                        if (err) {
                            callback(err);
                        } else {
                            this._customCache.set(url, <cc.Material>asset);
                            callback();
                        }
                    });
                } catch (error) {
                }
            }
        }
    }
}

let materialHelper = new MaterialHelper();

export default materialHelper;