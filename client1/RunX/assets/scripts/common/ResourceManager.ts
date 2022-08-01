import { logger } from "./log/Logger";
import RefCount from "./res-manager/RefCount";
import resourceLoader from "./res-manager/ResourceLoader";

// 3分钟；按照时间释放淘汰的，3分钟内没人使用的，就会被淘汰`
const RES_HOLD_TIME = 180000;

/**
 * @desc 缓存模式
 * NONE: 不缓存，根据计数器，自动释放，计数器为0就会自动释放资源
 * RELEASE_TIME: 缓存持有一段时间，过了一段时间没人用，还是会自动释放
 * RELEASE_NO: 一旦加载，永不释放
 * @enum {number}
 */
enum CACHE_MODE {
    NONE = 1,
    RELEASE_TIME,
    RELEASE_NO,
}

/**
 * @desc 等待队列；防止在异步加载队列中的资源，被释放掉
 *
 * @interface PendingInfo
 */
interface PendingInfo {
    resolve: Function;
    reject: Function;
    userTag?: string;
}

/**
 * @desc 资源状态描述
 *
 * @enum {number}
 */
enum RES_STATE {
    INVALID = 0,
    LOADING,
    READY,
}

/**
 * @desc 资源缓存表
 *
 * @interface CacheData
 */
interface CacheData {
    name: string;
    cacheMode: CACHE_MODE;
    res?: any;
    loadTime?: number;
    idleTime?: number;
    pendingQueue?: PendingInfo[];
    state?: RES_STATE;
}

const isTagValid = function(tag: string) {
    return tag && tag.length > 0;
}

class CacheInfo extends RefCount<any>{
    private _data: CacheData = null;
    private _blockedKeys = new Set<string>();
    private _retaindKeys = new Set<string>();
    constructor (data: CacheData) {
        super(null);
        // 基类会默认有一个引用计数，但是这里的引用计数还是全部放在业务层会比较好，这里就给他release掉好了，把引用计数复位
        super.release();
        this._data = data;
        if (!this._data.res && this._data.state === undefined) {
            this._data.state = RES_STATE.INVALID;
        }
    }

    get data (): CacheData {
        return this._data;
    }

    get state (): RES_STATE {
        return this._data.state;
    }

    set state (v: RES_STATE) {
        this._data.state = v;
    }

    get cacheMode (): CACHE_MODE {
        return this._data.cacheMode;
    }

    get loadTime (): number {
        return this._data.loadTime || Date.now();
    }

    set res (v: any) {
        this._data.res = v;
        if (this._data.cacheMode === CACHE_MODE.RELEASE_TIME) {
            this._data.loadTime = Date.now();
        }
        this.state = RES_STATE.READY;
    }

    get res (): any{
        return this._data.res;
    }

    isValid (): boolean {
        return this.state === RES_STATE.READY;
    }

    appendOneUser (info: PendingInfo) {
        if (this.state === RES_STATE.LOADING) {
            this._data.pendingQueue = this._data.pendingQueue || [];
            this._data.pendingQueue.push(info);
        } else {
            const err = `Resource Append User State ERROR. res = ${this._data.name}. State = ${this.state}`;
            logger.error('ResourceManager', err);
            if (this.state === RES_STATE.READY) {
                this.retain();
                info.resolve({...this.data});
            } else {
                info.reject(err);
            }
        }
    }

    rejectAll (err: any) {
        const usersQueue = this.data.pendingQueue;
        if (usersQueue && usersQueue.length > 0) {
            do {
                const user = usersQueue.shift();
                if (isTagValid(user.userTag)) {
                    // 如果是block的，就不用reject啦
                    if (!this._blockedKeys.has(user.userTag)) {
                        user.reject(err);
                    }
                } else {
                    user.reject(err);
                }
            } while(usersQueue.length > 0);
        }
    }

    resolveAll () {
        const usersQueue = this.data.pendingQueue;
        if (usersQueue && usersQueue.length > 0) {
            do {
                const blockedKeys = new Set<string>();
                this._blockedKeys.forEach(v => {
                    blockedKeys.add(v);
                });
                this._blockedKeys.clear();
                
                const user = usersQueue.shift();
                if (isTagValid(user.userTag)) {
                    // 要把block的给过滤掉
                    if (blockedKeys.has(user.userTag)) {
                        logger.log(`ResourceManager`, `res ${this.data.name} was blocked tag = ${user.userTag}`);
                    } else {
                        // 同一个Tag，不要retain多次
                        if (!this._retaindKeys.has(user.userTag)) {
                            this.retain();
                        }
                        this._retaindKeys.add(user.userTag);
                        user.resolve({...this.data});
                    }
                } else {
                    this.retain();
                    user.resolve({...this.data});
                }
            } while(usersQueue.length > 0);
        }
    }

    resolveOne (info: PendingInfo) {
        if (!this.isValid()) {
            // 讲道理不应该进来的
            logger.error(`Can not resolve One res while data is invalid. res = ${this.data.name}.`);
            info.reject('Can not resolve One res while data is invalid');
            return;
        }

        if (isTagValid(info.userTag) ) {
            if (this._blockedKeys.has(info.userTag)) {
                // 不调用回调
            } else {
                if (!this._retaindKeys.has(info.userTag)) {
                    this._retaindKeys.add(info.userTag);
                    this.retain();
                }
                info.resolve({...this.data});
            }
        } else {
            this.retain();
            info.resolve({...this.data});
        }
    }

    release (userTag?: string) {
        // Tag标记的，只要release的，就删除掉
        if (isTagValid(userTag)) {
            if (this._retaindKeys.has(userTag)) {
                this._retaindKeys.delete(userTag);
            } else {
                // 如果说，传入的标记，不合法，就不再理会；有可能是同一个标记，传入了多次，考虑到同一个标记load进来只retain一次，那么也只能release一次
                return this.ref;
            }
        }

        const ref = super.release();
        if (ref <= 0) {
            if (this.cacheMode === CACHE_MODE.NONE) {
                resourceLoader.releaseResource(this.res);
                this.state = RES_STATE.INVALID;
            } else if (this.cacheMode === CACHE_MODE.RELEASE_TIME) {
                this._data.idleTime = Date.now();
                this.checkReleaseTime();
            }
        }
        return ref;
    }

    checkReleaseTime () {
        const idleTime = this._data.idleTime || Date.now();
        let delt = Date.now() - idleTime;
        if (delt >= RES_HOLD_TIME) {
            resourceLoader.releaseResource(this.res);
            this.state = RES_STATE.INVALID;
        }
    }

    toString (): string {
        return `ResName = ${this._data.name}. ref = ${this.ref}. state = ${this.state}`;
    }

    addBlockKey (userTag: string) {
        this._blockedKeys.add(userTag);
    }
}

class ResourceCache {
    private _key: string = null;
    private _type: typeof cc.Asset = null;
    private _cache = new Map<CACHE_MODE, CacheInfo>();
    constructor (key: string, type: typeof cc.Asset) {
        this._key = key;
        this._type = type;
    }

    checkCacheValid (cacheMode = CACHE_MODE.NONE): boolean {
        return this._cache.has(cacheMode) && this._cache.get(cacheMode).isValid();
    }

    load (cacheMode = CACHE_MODE.NONE, userTag: string = ''): Promise<CacheData> {
        return new Promise((resolve, reject) => {
            if (this._cache.has(cacheMode)) {
                const cacheInfo = this._cache.get(cacheMode);
                // 检查下资源的有效性
                if (cacheInfo.isValid()) {
                    cacheInfo.resolveOne({
                        resolve: resolve,
                        reject: reject,
                        userTag: userTag,
                    });
                } else if (cacheInfo.state === RES_STATE.LOADING) {
                    cacheInfo.appendOneUser({
                        resolve: resolve,
                        reject: reject,
                        userTag: userTag,
                    });
                } else {
                    const info = `Resource State ERROR. has cache but res = ${this._key}. state = ${cacheInfo.state}.`;
                    logger.error('ResourceManager', info);
                    reject(info);
                }
            } else {
                // 先填充一个空的State，并设置状态
                const cacheInfo = new CacheInfo({
                    name: this._key,
                    cacheMode: cacheMode,
                    state: RES_STATE.LOADING,
                });
                this._cache.set(cacheMode, cacheInfo);

                cacheInfo.appendOneUser({
                    resolve: resolve,
                    reject: reject,
                    userTag: userTag,
                });

                const loadRes = resourceLoader.loadResource(this._key, this._type);
                loadRes.then(ret => {
                    // 不管如何，先把资源给赋值上去
                    const info = this._cache.get(cacheMode);
                    info.res = ret;

                    // 检查等待队列
                    info.resolveAll();

                    // 看看是否这个res还是有效的；如果这个时候被用户stop了，并且也没有停止队列，那么引用就会变成0，如果是0就要释放
                    if (info.ref <= 0) {
                        info.release();
                        this._cache.delete(cacheMode);
                    }
                }).catch(err => {
                    const info = this._cache.get(cacheMode);
                    info.rejectAll(err);
                    this._cache.delete(cacheMode);
                })
            }
        });
    }

    release (cacheMode = CACHE_MODE.NONE, userTag?: string) {
        const refRes = this._cache.get(cacheMode);
        if (refRes) {
            refRes.release(userTag);
            // logger.info('ResourceManager', `release resource ${this._key} cachMode = ${cacheMode}. now ref = ${ref}.`);
            if (!refRes.isValid()) {
                this._cache.delete(cacheMode);
            }
        }
    }

    /**
     * @desc 强制释放所有资源，不再care计数器
     * @todo
     * @memberof ResourceCache
     */
    releaseAll () {
    }

    checkReleaseTime () {
        this._cache.forEach((v, k) => {
            v.checkReleaseTime();
            if (!v.isValid()) {
                this._cache.delete(k);
            }
        })
    }

    /**
     * @desc 停止调用返回，根据指定的Tag标记来进行暂停！暂停的标记，统一通过reject进行回调，避免出现死等的情况
     *
     * @param {string} userTag 用户在load的时候传入的值，使用者要自己保证key的唯一性，resourceManager不保证key的唯一性
     * @memberof ResourceCache
     */
    stop (userTag: string, cacheMode: CACHE_MODE) {
        if (this._cache.has(cacheMode)) {
            this._cache.get(cacheMode).addBlockKey(userTag);
        }
    }
}

class ResourceManager {
    private _cache = new Map<string, ResourceCache>();

    constructor () {
    }

    /**
     * @desc 加载资源接口，加载跟释放，都要通过这里来进行
     *
     * @param {string} url
     * @param {typeof cc.Asset} type
     * @param {CACHE_MODE} [cacheMode] 缓存模式。不同的缓存模式，不会冲突，但是请务必确保自己调用的配对缓存模式是一致的
     * @param {string} userTag 调用唯一标记；同样tag的，不会持有多份引用，会认为是同一个，stop的时候，通过tag来进行标志停止，加载中的会停止回调免得异步回调脚本失效
     * @returns {Promise<CacheData>} 传入Prefab时，根据缓存模式，读取其中的prefab或者node，其他类型时，读取res
     * @memberof ResourceManager
     */
    load (url: string, type: typeof cc.Asset, cacheMode = CACHE_MODE.NONE, userTag: string = ''):  Promise<CacheData> {
        let cache = this._getCache(url);
        if (cache) {
            return cache.load(cacheMode, userTag);
        } else {
            let resCache = new ResourceCache(url, type);
            this._cache.set(url, resCache);
            return resCache.load(cacheMode, userTag);
        }
    }

    /**
     * @desc 所有通过ResourceManager.load加载上来的资源，都要通过release进行释放，如果不释放，就会被持有
     * @param url 
     * @param cacheMode 
     */
    release (url: string, cacheMode = CACHE_MODE.NONE, userTag?: string) {
        const cache = this._getCache(url);
        if (cache) {
            cache.release(cacheMode, userTag);
        }
    }

    stop (url: string, userTag: string = '', cacheMode = CACHE_MODE.NONE) {
        const cache = this._getCache(url);
        if (cache) {
            cache.stop(userTag, cacheMode);
        }
    }

    /**
     * @desc 强制释放指定路径的所有资源，尚未实现@！！！
     * @param url 
     */
    forceRelease (url: string) {
        const cache = this._getCache(url);
        if (cache) {
            cache.releaseAll();
        }
    }

    checkCacheValid (url: string, cacheMode = CACHE_MODE.NONE) {
        const resCache = this._getCache(url);
        return resCache ? resCache.checkCacheValid(cacheMode) : false;
    }

    update () {
        this._cache.forEach(v => {
            v.checkReleaseTime();
        })
    }

    private _getCache (url: string): ResourceCache {
        if (this._cache.has(url)) {
            return this._cache.get(url);
        }
        return null;
    }

    /// for test only
    private _lastCache = new Map<string, cc.Asset>();
    captureCache (){
        this._lastCache = this._getAssetCache();
    }

    private _getAssetCache (): Map<string, cc.Asset> {
        let ret = new Map<string, cc.Asset>();
        cc.assetManager.assets.forEach((val, key) => {
            ret.set(key, val);
        });
        return ret;
    }

    compareCache () {
        const diff = new Map<string, cc.Asset>();
        const nowCache = this._getAssetCache();
        nowCache.forEach( (v: cc.Asset, k: string) => {
            if (!this._lastCache.has(k)) {
                diff.set(k, nowCache.get(k));
            }
        });

        diff.forEach((v: cc.Asset, k: string) => {
            console.log(diff.get(k));
        });
    }
}

const resourceManager = new ResourceManager();

export {
    resourceManager,
    CacheData,
    CACHE_MODE,
}
