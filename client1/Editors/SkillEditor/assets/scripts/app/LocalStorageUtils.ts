/**
 * 本地存储的简单封装
 */
export default class LocalStorageUtils {
    private static _ins: LocalStorageUtils = null;

    private constructor() {

    }

    static getInstance() {
        if (!LocalStorageUtils._ins)
            LocalStorageUtils._ins = new LocalStorageUtils();
        return LocalStorageUtils._ins;
    }

    getBoolean(key: string, defaultValue: boolean = true): boolean {
        let result = this._getItem(key);
        if (this._isUndefined(result))
            return defaultValue
        return Boolean(result);
    }

    setBoolean(key: string, value: boolean) {
        if (!key || key.length === 0) return;
        cc.sys.localStorage.setItem(key, String(value));
    }

    getNumber(key: string, defaultValue: number = NaN): number {
        let result = this._getItem(key);
        if (this._isUndefined(result)) {
            return defaultValue;
        }
        return Number(result);
    }

    setNumber(key: string, value: number) {
        if (!key || key.length === 0) return;
        value = value || 0;
        this._setItem(key, String(value));
    }

    getString(key: string, defaultValue: string = "") {
        let result = this._getItem(key);
        if (this._isUndefined(result)) {
            return defaultValue;
        }
        return result;
    }

    setString(key: string, value: string) {
        if (!key || key.length === 0) return;
        value = value || "";
        this._setItem(key, value);
    }

    contains(key: string) {
        return this._isUndefined(this._getItem(key));
    }

    _isUndefined(value: any): boolean {
        return typeof value === 'undefined' || value == null;
    }

    private _getItem(key: string) {
        return cc.sys.localStorage.getItem(key);
    }

    private _setItem(key: string, value: string) {
        cc.sys.localStorage.setItem(key, value);
    }
}