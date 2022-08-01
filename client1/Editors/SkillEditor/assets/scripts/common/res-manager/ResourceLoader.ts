import { logger } from "../log/Logger";
import RefCount from "./RefCount";

class Resource extends RefCount<any> {
    constructor (res: any) {
        super(res);
    }
}

class ResourceLoader {
    private _cache = new Map<string, Resource>();
    private _assetCache: typeof cc.Asset[] = [];
    private _debug: boolean = false;
    private _sysCache = new Map<string, any>();
    private _resToRelease: cc.Asset[] = [];

    private _loadingRes = new Set<string>();
    private _seqId = 0;
    constructor () {
    }

    captureSystem () {
        this._sysCache = this._captureCache();
        this._cache.clear();
    }

    private _newSeq (): number {
        return ++this._seqId;
    }

    loadResource(url: string, type: typeof cc.Asset): Promise<any> {
        // logger.info('ResourceLoader', `load resource url = ${url}`);
        const seq = this._newSeq();
        this._loadingRes.add(`${url}_${seq}`);
        return new Promise((resolve, reject) => {
            cc.resources.load(url, type, (err, res) => {
                if (err) {
                    this._loadingRes.delete(`${url}_${seq}`);
                    this._checkReleaseQueue();
                    reject(err);
                } else {
                    let asset = <cc.Asset>res;
                    //@ts-ignore
                    this._assetCache[asset._uuid] = asset;
                    this._retainResRecurisv(asset);
                    resolve(res);
                    this._loadingRes.delete(`${url}_${seq}`);
                    this._checkReleaseQueue();
                }
            });
        });
    }

    // 加载跟释放的队列，不能同时进行，不然会存在资源先呗加载起来，然后又被释放了的尴尬境地
    // 释放的时候，一定要保证加载队列中是没有正在加载的资源的
    private _checkReleaseQueue () {
        if (this._loadingRes.size === 0) {
            const releaseQueue = [...this._resToRelease];
            this._resToRelease = [];
            releaseQueue.forEach( v => {
                this._realRelease(v);
            })
        }
    }

    releaseResource (res: cc.Asset) {
        this._resToRelease.push(res);
        this._checkReleaseQueue();
    }

    private _realRelease (res: cc.Asset) {
        if (!res) {
            return;
        }

        //@ts-ignore
        if (!this._assetCache[res._uuid]) {
            logger.warn('ResourceLoader', `Can not find res cache`);
            return;
        }
        // logger.info('ResourceLoader', `release resource key = ${res.name}`);

        const arrRelease: any[] = [];
        //@ts-ignore
        const deps = cc.assetManager.dependUtil.getDepsRecursively(res._uuid).concat([res._uuid]);
        deps.forEach((key, index) => {
            if (!this._cache.has(key)) {
                // logger.log(`Can not find in cache for key = ${key}`);
            } else {
                if (this._cache.get(key).release() <= 0) {
                    let asset = cc.assetManager.assets.get(key);
                    if (asset) arrRelease.push(asset);
                    // delete this._cache[key];
                    this._cache.delete(key);
                }
            }
        });
        // arrRelease.forEach(v => {
        //     logger.log(`realRelease res = `, v);
        // });
        arrRelease.forEach(asset => {
            cc.assetManager.releaseAsset(asset);
        })
    }

    set debug (v: boolean) {
        this._debug = v;
    }

    get debug (): boolean {
        return this._debug;
    }

    private _retainResRecurisv (res: cc.Asset) {
        //@ts-ignore
        const deps = cc.assetManager.dependUtil.getDepsRecursively(res._uuid).concat([res._uuid]);
        deps.forEach((key, index) => {
            this._appendResource(key);
        });
    }

    private _appendResource(res: string | Object) {
        let key: string = null;
        if (typeof res !== 'string') {
            //@ts-ignore
            key = res.id || res.url;;
        } else {
            key = res;
        }
        if (!key) {
            // logger.log(`Can not cache resource for no id`);
            return;
        }

        if (this._sysCache.has(key)) {
            // logger.log(`key = ${key} in sys cache. will not cache!`);
            return;
        }

        if (this._cache.has(key)) {
            this._cache.get(key).retain();
        } else {
            this._cache.set(key, new Resource(res));
        }
        // logger.log(`retainResource. key = ${key}. ref = ${this._cache.get(key).ref}`);
    }

    private _captureCache (): Map<string, any> {
        let ret = new Map();
        cc.assetManager.assets.forEach((val, key) => {
            ret.set(key, val);
        });
        return ret;
    }
}

const resourceLoader = new ResourceLoader();

export default resourceLoader;