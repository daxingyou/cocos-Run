import { resourceManager, CACHE_MODE } from "../ResourceManager";

/**
 * File: SpriteLoader.ts
 * Description: 
 *  每个类独立new一个实例出来使用
 *  在需要使用的时候，直接 changeSprite 即可
 *  
 *  不要每次使用都release，最后统一release即可（在onRelease中或者onDestroy中再来执行 release 即可）
 * 
 */


interface LoadSpriteInfo {
    url: string;
    spTarget: cc.Sprite;
}

class SpriteLoader {
    public static UNIQ_SEQ = 1;

    private _loadQueue = new Map<string, LoadSpriteInfo>();
    private _loaded = new Map<cc.Sprite, LoadSpriteInfo>();

    constructor () {
    }

    /**
     * @desc 释放已加载的资源；不要每次使用之前都release了，直接在页面释放的时候，统一release即可
     *   release之后，之前排队中的，会暂停加载回调，已经加载成功的，会释放
     *
     * @memberof SpriteLoader
     */
    release () {
        // 释放已经加载过的
        this._loaded.forEach(info => {
            info.spTarget.spriteFrame = null;
            resourceManager.release(info.url);
        });
        this._loaded.clear();

        // 停止正在加载的
        this._loadQueue.forEach((info, tag) => {
            resourceManager.stop(info.url, tag);
        });
        this._loadQueue.clear();
    }

    /**
     * @desc 更换ICON的promise版本
     *
     * @param {cc.Sprite} sp
     * @param {string} url
     * @returns {Promise<boolean>}
     * @memberof SpriteLoader
     */
    changeSpriteP (sp: cc.Sprite, url: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.changeSprite(sp, url, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }
            })
        });
    }

    /**
     * @desc 更换Sprite中的SpriteFrame，异步更换；目标url是resource目录下的相对资源路径
     *
     * @param {cc.Sprite} sp 需要更换的Sprite
     * @param {string} url 新的Sprite的资源路径
     * @param {() => void} [callback] 完成的回调
     * @returns
     * @memberof AsyncSpriteLoadHelper
     */
    changeSprite (sp: cc.Sprite, url: string, callback?: (err?: any) => void) {
        if (!sp) {
            callback && callback('Can not change sprite for NULL!!!');
            return;
        }
        
        if (this._loaded.has(sp)) {
            const info = this._loaded.get(sp);
            if (info.url == url) {
                callback && callback();
                return;
            }
        }

        const tag = this._newUniqStr(sp, url);
        this._loadQueue.set(tag, {
            url: url,
            spTarget: sp,
        });

        resourceManager.load(url, cc.SpriteFrame, CACHE_MODE.NONE, tag)
        .then(info => {
            if (this._loadQueue.has(tag)) {
                this._loadQueue.delete(tag);
            }

            if (this._loaded.has(sp)) {
                const info = this._loaded.get(sp);
                resourceManager.release(info.url);
                sp.spriteFrame = null;
            }
            sp.spriteFrame = info.res;

            this._loaded.set(sp, {
                url: url,
                spTarget: sp,
            });

            callback && callback();
        })
        .catch(err => {
            this._loadQueue.delete(tag);
            callback && callback(err);
        });
    }

    private _newUniqStr (sp: cc.Sprite, key: string): string {
        return `${sp.uuid}_${key}_${SpriteLoader.UNIQ_SEQ++}`;
    }
}

export {
    SpriteLoader,
}