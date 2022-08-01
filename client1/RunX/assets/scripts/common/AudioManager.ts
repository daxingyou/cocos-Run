import { resourceManager } from "./ResourceManager";
import { logger } from "./log/Logger";
import { localStorageMgr, SAVE_TAG } from "./LocalStorageManager";

enum BGM_TYPE {
    NONE = 0,
    NORMAL,
    BATTLE,
    PARKOUR
}
enum SFX_TYPE {
    BUTTON_CLICK,       //按钮点击
    BUTTON_CLOSE,       //页面关闭
    ERROR,              //出现错误
    EQUIO_BROKE,        //装备突破
    EQUIP_ENHANCE,      //装备强化
    EQUIP_ON,           //装备穿戴
    EQUIP_OFF,          //装备卸除
    CARD_DRAW,          //抽卡
    CARD_GET_R,         //获得R卡(含以下
    CARD_GET_SR,        //获得SR卡
    CARD_GET_SSR,       //获得SSR卡
    GAME_WIN,           //游戏胜利
    GAME_LOSE,          //游戏失败
    ROLE_ATTACK_M,      //角色攻击(男
    ROLE_ATTACK_FEM,    //角色攻击(女
    ROLE_ATTACKED_M,    //角色被攻击
    ROLE_ATTACKED_FEM,  //角色被攻击
    ROLE_DEAD_M,        //角色死亡
    ROLE_DEAD_FEM,      //角色死亡
    ROLE_UPGRADE,       //角色升级
    USE_MONEY,           //使用货币
    MONSTER_APPEAR_WARN       //怪物出现警告
}
/**
 * @desc 背景音状态
 */
enum MUSIC_STATE {
    OFF = 0,
    ON,
}
/**
 * @desc 游戏音效
 */
enum AUDIO_STATE {
    OFF = 0,
    ON,
}

enum CACHE_MODE {
    NONE,
    NORMAL
}

interface AudioOption<Type> {
    type: Type,
    url: string,
    loop: boolean,
    volume?: number,
    preload?: boolean,
    cache? : CACHE_MODE
}

type BGMOption = AudioOption<BGM_TYPE>;
type SFXOption = AudioOption<SFX_TYPE>;

const ConfigBGM = new Map<BGM_TYPE, BGMOption>();
const ConfigSFX = new Map<SFX_TYPE, SFXOption>();

const BGMConfig: BGMOption[] = [
    { type: BGM_TYPE.NORMAL, url: 'sfx/bgm/main_scene', loop: true },
    { type: BGM_TYPE.PARKOUR, url: 'sfx/bgm/parkour', loop: true },
    { type: BGM_TYPE.BATTLE, url: 'sfx/bgm/battle', loop: true },
];

const EffectConfig: SFXOption[] = [
    { type: SFX_TYPE.BUTTON_CLICK, url: 'sfx/sound/button_click', loop: false , cache: CACHE_MODE.NORMAL},
    { type: SFX_TYPE.BUTTON_CLOSE, url: 'sfx/sound/button_close', loop: false, cache: CACHE_MODE.NORMAL},
    { type: SFX_TYPE.ERROR, url: 'sfx/sound/error', loop: false },
    { type: SFX_TYPE.EQUIO_BROKE, url: 'sfx/sound/bag_broke', loop: false },
    { type: SFX_TYPE.EQUIP_ENHANCE, url: 'sfx/sound/bag_enhanced', loop: false },
    { type: SFX_TYPE.EQUIP_ON, url: 'sfx/sound/bag_take_equip', loop: false },
    { type: SFX_TYPE.EQUIP_OFF, url: 'sfx/sound/bag_off_equip', loop: false },
    { type: SFX_TYPE.CARD_DRAW, url: 'sfx/sound/card_draw', loop: false },
    { type: SFX_TYPE.CARD_GET_R, url: 'sfx/sound/card_get_r', loop: false },
    { type: SFX_TYPE.CARD_GET_SR, url: 'sfx/sound/card_get_sr', loop: false },
    { type: SFX_TYPE.CARD_GET_SSR, url: 'sfx/sound/card_get_ssr', loop: false },
    { type: SFX_TYPE.GAME_WIN, url: 'sfx/sound/game_success', loop: false },
    { type: SFX_TYPE.GAME_LOSE, url: 'sfx/sound/game_fail', loop: false },
    { type: SFX_TYPE.ROLE_ATTACK_M, url: 'sfx/sound/role_attack_male', loop: false },
    { type: SFX_TYPE.ROLE_ATTACK_FEM, url: 'sfx/sound/role_attack_female', loop: false },
    { type: SFX_TYPE.ROLE_ATTACKED_M, url: 'sfx/sound/role_attacked_male', loop: false },
    { type: SFX_TYPE.ROLE_ATTACKED_FEM, url: 'sfx/sound/role_attacked_female', loop: false },
    { type: SFX_TYPE.ROLE_DEAD_M, url: 'sfx/sound/role_dead_male', loop: false },
    { type: SFX_TYPE.ROLE_DEAD_FEM, url: 'sfx/sound/role_dead_female', loop: false },
    { type: SFX_TYPE.USE_MONEY, url: 'sfx/sound/use_money', loop: false },
    { type: SFX_TYPE.ROLE_UPGRADE, url: 'sfx/sound/role_upgrade', loop: false },
    { type: SFX_TYPE.MONSTER_APPEAR_WARN, url: 'sfx/sound/get_warning', loop: true},
];

(function () {
    BGMConfig.forEach((ele) => {
        ConfigBGM.set(ele.type, ele);
    });

    EffectConfig.forEach((ele) => {
        ConfigSFX.set(ele.type, ele);
    })
})();

class AudioManager {
    private _currBGM: BGM_TYPE = BGM_TYPE.NONE;
    private _musicState: MUSIC_STATE = MUSIC_STATE.OFF;
    private _audioState: number = AUDIO_STATE.OFF;
    private _musicVolume: number = 1;
    private _audioVolume: number = 1;
    private _isPlaying: boolean = false;
    private _musicID: number = -1

    private _playingSfxMap: Map<string, number[]> = null;

    getBGMOption(type: BGM_TYPE) {
        return ConfigBGM.get(type);
    }

    getEffectOption(type: SFX_TYPE) {
        return ConfigSFX.get(type);
    }

    isPlaying(): boolean {
        return this._isPlaying;
    }

    constructor() {

    }

    init() {
        this._initMusicState();
        this._initAudioState();
    }

    private _initMusicState() {
        let state = localStorageMgr.getLocalStorage(SAVE_TAG.MUSIC_STATE);
        if (state == MUSIC_STATE.OFF) {
            localStorageMgr.setLocalStorage(SAVE_TAG.MUSIC_STATE, MUSIC_STATE.OFF);
            this._musicState = MUSIC_STATE.OFF;
        } else {
            localStorageMgr.setLocalStorage(SAVE_TAG.MUSIC_STATE, MUSIC_STATE.ON);
            this._musicState = MUSIC_STATE.ON;
        }
        //背景音量初始化
        let volume = localStorageMgr.getLocalStorage(SAVE_TAG.MUSIC_VOLUME)|| 1;
        localStorageMgr.setLocalStorage(SAVE_TAG.MUSIC_VOLUME, volume);
        this._musicVolume = volume;
    }

    private _initAudioState() {
        let state = localStorageMgr.getLocalStorage(SAVE_TAG.AUDIO_STATE);
        if (state == AUDIO_STATE.OFF) {
            localStorageMgr.setLocalStorage(SAVE_TAG.AUDIO_STATE, AUDIO_STATE.OFF);
            this._audioState = AUDIO_STATE.OFF;
        } else {
            localStorageMgr.setLocalStorage(SAVE_TAG.AUDIO_STATE, AUDIO_STATE.ON);
            this._audioState = AUDIO_STATE.ON;
        }
        //音效音量初始化
        let volume = localStorageMgr.getLocalStorage(SAVE_TAG.AUDIO_VOLUME)|| 1;
        localStorageMgr.setLocalStorage(SAVE_TAG.AUDIO_VOLUME, volume);
        this._audioVolume = volume;
    }

    set musicState(v: MUSIC_STATE) {
        if (this._musicState != v) {
            this._musicState = v;
            if (v == MUSIC_STATE.OFF) {
                this.stopMusic();
                localStorageMgr.setLocalStorage(SAVE_TAG.MUSIC_STATE, MUSIC_STATE.OFF);
            } else {
                this.playMusic(this._currBGM || BGM_TYPE.NORMAL, true);
                localStorageMgr.setLocalStorage(SAVE_TAG.MUSIC_STATE, MUSIC_STATE.ON);
            }
        }
        this._musicState = v;
    }

    set audioState(v: AUDIO_STATE) {
        if (this._audioState != v) {
            this._audioState = v;
            if (v == AUDIO_STATE.OFF) {
                localStorageMgr.setLocalStorage(SAVE_TAG.AUDIO_STATE, AUDIO_STATE.OFF);
            } else {
                localStorageMgr.setLocalStorage(SAVE_TAG.AUDIO_STATE, AUDIO_STATE.ON);
            }
        }
        this._audioState = v;
    }

    set musicVolume(vol: number) {
        if (vol < 0 || vol > 1) return;
        this._musicVolume = vol;
        localStorageMgr.setLocalStorage(SAVE_TAG.MUSIC_VOLUME, vol);
        cc.audioEngine.setMusicVolume(vol);
    }

    get audioStatus() {
        return {
            musicState: this._musicState,
            audioState: this._audioState,
            musicVolume: this._musicVolume,
            audioVolume: this._audioVolume
        }
    }

    set audioVolume(vol: number) {
        if (vol < 0 || vol > 1) return;
        this._audioVolume = vol;
        localStorageMgr.setLocalStorage(SAVE_TAG.AUDIO_VOLUME, vol);
    }

    private _realPlay(clip: cc.AudioClip, loop: boolean, volumn: number) {
        if (!clip) return;
        this.stopMusic();
        this._musicID = cc.audioEngine.playMusic(clip, loop)
        if (this._musicID != -1) {
            this._isPlaying = true;
            cc.audioEngine.setMusicVolume(volumn);
        };
    }

    playMusic(bgmType: BGM_TYPE, forcePlay: boolean = false) {
        if (this._currBGM == bgmType && this.isPlaying() || this._musicState == MUSIC_STATE.OFF) {
            return;
        }

        if (cc.sys.isBrowser) {
            //return;
        }

        this._currBGM = bgmType;
        const opt = ConfigBGM.get(bgmType);
        let clip = audioCache.getAudioClip(opt.url);
        let vol = this._musicState ? (opt.volume || this._musicVolume) : 0;
        if (clip) {
            this._realPlay(clip, opt.loop, vol);
        } else {
            resourceManager.load(opt.url, cc.AudioClip).then(info => {
                audioCache.putAudioClip(opt.url, info.res);
                this._realPlay(info.res, opt.loop, opt.volume || vol);
            }).catch(err => {
                logger.error(`AudioManager`, `Can not load sound for url = ${opt.url}. err = ${err}`);
            });
        }
    }

    stopMusic() {
        // cc.audioEngine.stopMusic();
        if (this._musicID != -1) {
            cc.audioEngine.stop(this._musicID)
        }
        cc.audioEngine.stopMusic();
        this._musicID = -1;
        this._isPlaying = false;
    }

    pauseMusic() {
        if(this.isPlaying() && cc.audioEngine.isMusicPlaying()){
            cc.audioEngine.pauseMusic();
        }
    }

    resumeMusic() {
        if(!this.isPlaying()) return;
        if(!cc.audioEngine.isMusicPlaying()){
            cc.audioEngine.resumeMusic();
        }
    }

    playSfx(type: SFX_TYPE) {
        const opt = ConfigSFX.get(type);
        if (opt) {
            if (this._audioState == AUDIO_STATE.OFF || this._audioVolume == 0) return;
            let clip: cc.AudioClip = audioCache.getAudioClip(opt.url);
            if (clip) {
                this._realPlayEffect(opt.url, clip, false, opt.volume || this._audioVolume, null, opt.cache);
            } else {
                resourceManager.load(opt.url, cc.AudioClip)
                    .then(info => {
                        let clip = info.res;
                        audioCache.putAudioClip(opt.url, clip);
                        this._realPlayEffect(opt.url, clip, false, opt.volume || this._audioVolume, null, opt.cache);
                    }).catch(err => {
                        logger.error(`AudioManager`, `Can not load sound for url = ${opt.url}. err = ${err}`);
                    });
            }
        }
    }

    play(url: string, loop = false, volume?: number, curTime?: number) {
        if (this._audioState == AUDIO_STATE.OFF || this._audioVolume == 0) return;
        let clip: cc.AudioClip = audioCache.getAudioClip(url);
        if (clip) {
            this._realPlayEffect(url, clip, loop, volume || this._audioVolume, curTime);
        } else {
            resourceManager.load(url, cc.AudioClip)
                .then(info => {
                    let clip = info.res;
                    audioCache.putAudioClip(url, clip);
                    this._realPlayEffect(url, clip, loop, volume || this._audioVolume, curTime);
                }).catch(err => {
                    logger.error(`AudioManager`, `Can not load sound for url = ${url}. err = ${err}`);
                });
        }
    }

    private _realPlayEffect(url: string, clip: cc.AudioClip, loop: boolean, volumn: number, curTime?: number, cache?: CACHE_MODE) {
        let audioId = cc.audioEngine.play(clip, loop, volumn);
        curTime && curTime > 0 && curTime < clip.duration &&  cc.audioEngine.setCurrentTime(audioId, curTime);
        this._playingSfxMap = this._playingSfxMap || new Map<string, Array<number>>();
        if(!this._playingSfxMap.has(url)){
            this._playingSfxMap.set(url, []);
        }
        let sounds = this._playingSfxMap.get(url);
        sounds.push(audioId);
        cc.audioEngine.setFinishCallback(audioId, () => {
            let idx = sounds.indexOf(audioId);
            if(idx != -1){
                sounds.splice(idx, 1);
            }
            if (!cache){
                audioCache.clearByKey(url);
                resourceManager.release(url);
            }
        });
    }

    stopSfx(type: SFX_TYPE): boolean {
        const opt = ConfigSFX.get(type);
        if (opt) {
            let url: string = opt.url;
            if(!this._playingSfxMap || !this._playingSfxMap.has(url)) return false;
            let sounds = this._playingSfxMap.get(url);
            if(!sounds || sounds.length <= 0) return false;
            sounds.forEach(ele =>{
                cc.audioEngine.stop(ele);
            });
            sounds.length = 0;
            return true;
        }
        return false
    }

    stopSfxsByUrl(url: string) {
        if(!this._playingSfxMap || !this._playingSfxMap.has(url)) return;
        let ids = this._playingSfxMap.get(url);
        ids && ids.forEach(ele => {
            cc.audioEngine.stop(ele);
        });
        this._playingSfxMap.delete(url);
    }

    resumeSfxsByUrl(url: string) {
        if(!this._playingSfxMap || !this._playingSfxMap.has(url)) return;
        let ids = this._playingSfxMap.get(url);
        ids && ids.forEach(ele => {
            cc.audioEngine.resumeEffect(ele);
        });
    }

    pauseSfxsByUrl(url: string) {
        if(!this._playingSfxMap || !this._playingSfxMap.has(url)) return;
        let ids = this._playingSfxMap.get(url);
        ids && ids.forEach(ele => {
            cc.audioEngine.pauseEffect(ele);
        });
    }

    isPlayingSfx(url: string) {
        return !!(this._playingSfxMap && this._playingSfxMap.has(url) && this._playingSfxMap.get(url).length > 0);
    }

    stopAllEffects() {
        cc.audioEngine.stopAllEffects();
        this._playingSfxMap.clear();
    }

    pauseAllEffects() {
        cc.audioEngine.pauseAllEffects();
    }

    resumeAllEffects() {
        cc.audioEngine.resumeAllEffects();
    }
}

class AudioCache {
    private _cache: Map<string, cc.AudioClip> = null;
    getAudioClip(key: string): cc.AudioClip {
        if (!key || key.length === 0 || !this._cache || this._cache.size === 0) return null;
        return this._cache.get(key);
    }

    putAudioClip(key: string, clip: cc.AudioClip) {
        if (!key || key.length === 0 && !cc.isValid(clip)) return;
        if (!this._cache) this._cache = new Map<string, cc.AudioClip>();
        this._cache.set(key, clip);
    }

    clearByKey(key: string) {
        if (!this._cache || this._cache.size === 0 || !this._cache.has(key)) return;
        this._cache.delete(key);
    }

    clearAll() {
        if (!this._cache || this._cache.size === 0) {
            this._cache = null;
            return;
        }
        this._cache.clear();
        this._cache = null;
    }

    loadAudio(url: string, cb: Function) {
        if(!url || url.length == 0) {
            cb && cb(new Error('音频文件路径为空'), null, url);
            return;
        }
        if(this._cache && this._cache.has(url) && this._cache.get(url)) {
            cb && cb(null, this._cache.get(url));
        }
        resourceManager.load(url, cc.AudioClip).then(info => {
            audioCache.putAudioClip(url, info.res);
            cb && cb(null, info.res, url);
        }).catch(err => {
            cb && cb(new Error('音频资源加载失败'), null, url);
        });
    }
}

let audioCache = new AudioCache();

const audioManager = new AudioManager();
export {
    audioManager,
    audioCache,
    BGM_TYPE,
    SFX_TYPE,
    MUSIC_STATE,
    AUDIO_STATE
}
