/**
 * 数据上报
 */
const REPORT_USER_BEHAVIOR_TIMELEN = 60

class StatisticReport {
    private _reportKeyMap = new Map<string, boolean>()
    private _timeEventMap = new Map<string, number>()
    private _userBehaviorStartTime = 0;

    constructor() {
        this._userBehaviorStartTime = Date.now()
    }

    private get userID() {
        return "0"
    }

    private get platform() {
        return ""
    }

    private _setReportTag(key: string) {
        this._reportKeyMap.set(key, true)
    }

    private _hasReportTag(key: string) {
        return this._reportKeyMap.get(key)
    }

    private _clearReportTag(key: string) {
        this._reportKeyMap.delete(key)
    }

    private _willReportUserBehavior(): boolean {
        let delta = (Date.now() - this._userBehaviorStartTime) / 1000
        return delta < REPORT_USER_BEHAVIOR_TIMELEN
    }

    /**
     * @description http接口
     * @param sendStr 上报字符串
     */
    reportData(sendStr: string) {
    }

    /**
     * @description 上报接口，非玩家数据上报调用此接口
     * @param key ID
     * @param args 参数
     */
    reportEventWithKey(key: string, ...args: string[]) {
        let reqArgs = []
        /**通用参数 */
        reqArgs.push(key)
        reqArgs.push(this.userID)
        reqArgs.push(this.platform)
        
        /**自定义参数，不允许传入null值 */
        for (let i = 0; i < args.length; i++) {
            if (args[i] == null) {
                break
            }    
            reqArgs.push(args[i])
        }
        
        let sendStr = reqArgs.toString().replace(/\,/g, "|")
        this.reportData(sendStr)
    }

    /**
     * @description 以对为单位上报数据，此接口未对头
     * @param key ID
     */
    reportPairEventWithKey(key: string) {
        this.reportEventWithKey(key)
        this._setReportTag(key)   
    }

    /**
     * @description 以对为单位上报数据，此接口未对尾
     * @param key ID
     * @param pairKey 对应对头ID
     */
    reportSecondEventWithKey(key: string, pairKey: string) {
        if (pairKey && this._hasReportTag(pairKey)) {
            this.reportEventWithKey(key)
            this._clearReportTag(pairKey)
        }
    }

    /**
     * @description 玩家数据上报，抽样上报
     * @param key ID
     * @param args 数据
     */
    reportUserBehavior(key: string, ...args: string[]) {
        // @todo 需要做取样统计，并且只能上报一段时间里的行为
        if (this._willReportUserBehavior()) {
            this.reportEventWithKey(key, ...args)
        }
    }

    /**
     * @description 时间类统计
     * @param key ID
     * @param timeV 开始时间
     */
    reportTimeEventBegin(key: string, timeV: number) {
        this._timeEventMap.set(key, timeV || Date.now())
    }

    /**
     * @description 时间类统计结束
     * @param key ID
     * @param args 结束时间
     */
    reportTimeEventEnd(key: string, ...args: string[]) {
        if (this._timeEventMap.get(key)) {
            args.unshift(Date.now() - this._timeEventMap.get(key) + "")
            this.reportEventWithKey(key, ...args)
        }
    }
}

export let staticsReport = new StatisticReport()
