import ButtonAntiClick from "../common/components/ButtonAntiClick";
import { configManager } from "../common/ConfigManager";
import { localStorageMgr, SAVE_TAG } from "../common/LocalStorageManager";
import { logger } from "../common/log/Logger";
import { cfg } from "../config/config";
import { serverTime } from "../mvp/models/ServerTime";
import { data } from "../network/lib/protocol";
import { RES_ICON_PRE_URL } from "./AppConst";
import { LEVEL_EXP_TYPE } from "./AppEnums";
import { configUtils } from "./ConfigUtils";
import { resPathUtils } from "./ResPathUrlUtils";

/*
 * @Author: fly
 * @Date: 2021-03-16 11:13:51
 * @LastEditTime: 2021-11-03 10:30:14
 * @Description: 项目通用接口与常量
 */
declare let require: any;
export class AppUtils {
    static HeroUID: number = 200000000;
    static MonsterUID: number = 300000000;
    static BuffUID: number = 400000000;
    static HaloUID: number = 500000000;
    static Timer: number = 0;
    /**
     *
     * @param max
     * @returns 返回随机整数范围 [0, max)
     */
    getRandomInt(max: number): number {
        let min = 0;
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    }

    getRandomInBlock(block: number[]) {
        return block[0] + (block[1] - block[0]) * Math.random();
    }

    getRandomInArray<T>(arr: T[]): T {
        if (!arr || arr.length == 0) return null;

        let len = arr.length;
        return arr[Math.floor(Math.random() * len)];
    }

    isNull(key: any): boolean{
        return typeof key == 'undefined' || key == null;
    }

    //代码添加点击事件
    addClickEventListener(node: cc.Node, callBack: Function, params?: any, startFunc?: Function) {
        if (!node || !cc.isValid(node)) return;

        let btnComp = node.getComponent(cc.Button);
        if (!btnComp) {
            btnComp = node.addComponent(cc.Button);
        }

        let touchSize_r = 1;

        let touchStart = (event: cc.Event.EventTouch) => {
            if (node.hasOwnProperty("onBtnClickId")) {
                delete (node as any).onBtnClickId
            }
            if (node.hasOwnProperty("clickEnable")) {
                delete (node as any).clickEnable
            }
            if ((node as any).onBtnClickId === null || typeof (node as any).onBtnClickId === "undefined") {
                (node as any).onBtnClickId = event.getID();
                (node as any).clickEnable = true;
            }

            if (!btnComp.interactable || !btnComp.enabledInHierarchy) {
                (node as any).clickEnable = false;
                return;
            }

            if (startFunc) startFunc(event);
        }
        let touchMove = (event: cc.Event.EventTouch) => {
            if (event && event.getID() != (node as any).onBtnClickId) {
                return;
            }
            if (!btnComp.interactable || !btnComp.enabledInHierarchy) {
                (node as any).clickEnable = false;
                return;
            }

            if ((node as any).clickEnable && cc.Vec2.distance(event.getStartLocation(), event.getLocation()) > 30) {
                (node as any).clickEnable = false;
            }
        }

        let touchEnd = function (event: cc.Event.EventTouch) {
            if (event && (node as any).onBtnClickId != event.getID()) {
                return;
            }
            if (!(node as any).clickEnable) return;
            if (event && !(event as any).node) {
                (event as any).node = node;
            }
            callBack && callBack(event, params);
        }
        let touchCancel = function (event: cc.Event.EventTouch) {

        }

        let touchNode = node.getChildByName('touchNode');
        if (touchNode) {
            touchNode.destroy();
        }

        touchNode = new cc.Node('touchNode');
        touchNode.on(cc.Node.EventType.TOUCH_START, touchStart, params);
        touchNode.on(cc.Node.EventType.TOUCH_MOVE, touchMove);
        touchNode.on(cc.Node.EventType.TOUCH_END, touchEnd);
        touchNode.on(cc.Node.EventType.TOUCH_CANCEL, touchCancel);
        touchNode.width = node.width * touchSize_r;
        touchNode.height = node.height * touchSize_r;
        touchNode.x = (0.5 - node.anchorX) * node.width;
        touchNode.y = (0.5 - node.anchorY) * node.height;
        node.addChild(touchNode);
    };

    containsRectInX(rectA: cc.Rect, rectB: cc.Rect): boolean {
        return (rectA.x <= rectB.x &&
            rectA.x + rectA.width >= rectB.x + rectB.width);
    }

    containsRectInY(rectA: cc.Rect, rectB: cc.Rect): boolean {
        return (rectA.y <= rectB.y &&
            rectA.y + rectA.height >= rectB.y + rectB.height);
    }

    /**
     * @desc prefix的相对路径，是相对于AppUtils的相对路径，而不是发起者的相对路径！！
     *
     * @param {string} name
     * @param {string} [prefix='../template-data/item-effect/item-imp/']
     * @returns
     * @memberof AppUtils
     */
    sRequire(name: string, prefix = '../template-data/item-effect/item-imp/') {
        try {
            //@ts-ignore
            if (cc) {
                return require(name);
            } else {
                return require(`${prefix}${name}`);
            }
        } catch (error) {
            logger.error("require file err: ", error)
        }
    }

    /**
     * @description 一个简单的对象深拷贝接口
     *  PS： 于RegExp类型和Function类型则无法完全满足，而且不支持有循环引用的对象。
     * @param v
     * @returns
     */
    deepCopy(obj: any): any {
        var objClone: any = null;
        //进行深拷贝的不能为空，并且是对象或者是
        if (obj && typeof obj === "object") {
            objClone = (Array.isArray(obj) ? [] : {});
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (obj[key] && typeof obj[key] === "object") {
                    objClone[key] = this.deepCopy(obj[key]);
                    } else {
                    objClone[key] = obj[key];
                    }
                }
            }
        }
        return obj == null ? null : objClone;
    }
    /**
     * 一个简单的数组深拷贝
     * @param arr
     * @returns
     */
    deepCopyArray(arr: any[]) {
        let arrayString = JSON.stringify(arr);
        return JSON.parse(arrayString);
    }

    /**
    * 获得中文数字字符
    * @param num
    * @returns
    */
    transformToChinese(num: number) {
        let changeNum = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
        let unit = ["", "十", "百", "千", "万"];
        let getWan = (temp: number) => {
            let strArr = temp.toString().split("").reverse();
            let newNum = "";
            for (let i = 0; i < strArr.length; i++) {
                newNum =
                    (i == 0 && strArr[i] == '0'
                        ? ""
                        : i > 0 && strArr[i] == '0' && strArr[i - 1] == '0'
                            ? ""
                            : changeNum[Number(strArr[i])] + (strArr[i] == '0' ? unit[0] : unit[i])) +
                    newNum;
            }
            return newNum;
        };
        let overWan = Math.floor(num / 10000);
        let noWan = num % 10000;
        if (noWan.toString().length < 4) {
            noWan = Number("0" + noWan);
        }
        return overWan ? getWan(overWan) + "万" + getWan(noWan) : getWan(num);
    }

    parseStringTo1Arr(str: string, branchStr: string = '|'): string[] {
        if (!str) return null;
        if (!branchStr || branchStr.length === 0) return [str];
        let strArr: string[] = null;
        if (str.indexOf(branchStr) != -1) {
            strArr = str.split(branchStr);
        }
        strArr = strArr || [str];
        return strArr;
    }

    /**
     * @description 处理配置中的字符串信息，基础格式是 "A1;A2|B1;B2|C1;C2" 返回二维数组, 或者二维数组
     * @param string 
     * @param customFunc 
     * @returns 
     */
    parseStingList(string: string, customFunc?: Function) {
        if (!string) return [];

        let retrunList: any[] = [];
        let tempString = string.split('|');
        tempString.forEach((item, index) => {
            if (item.indexOf(';') > -1) {
                let tempArray = item.split(';');
                customFunc && (tempArray = customFunc(tempArray, index));
                retrunList.push(tempArray);
            } else {
                let temp = item;
                customFunc && (temp = customFunc(temp, index));
                retrunList.push(temp);
            }
        });
        return retrunList;
    }
    /**
     * 获得万分比的百分比
     * @param num
     * @returns
     */
    getPercent(num: number): number {
        return Number(((num / 10000) * 100).toFixed(1));
    }

    longToNumber(long: { low: number, high: number, unsigned: boolean }): number {
        if(long) {
            if (long.low) {
                if (long.high == 0) {
                    return long.low;
                } else {
                    if (long.low + long.high > Math.pow(2, 53)) {
                        logger.error(`longNum is Max`);
                        return 0;
                    } else {
                        return long.low + long.high;
                    }
                }
            } else {
                return Number(long);
            }
        } else {
            return 0;
        }
    }

    checkTwoNodeIsIntersect(node1: cc.Node, node2: cc.Node) {
        if (!cc.isValid(node1) || !cc.isValid(node2)) return false;
        // console.log('node1 name:', node1.name, 'bounding:', node1.getBoundingBoxToWorld());
        // console.log('node2 name:', node2.name, 'bounding:', node2.getBoundingBoxToWorld());
        let pos1: cc.Vec2 = node1.getPosition();
        let world1: cc.Vec2 = node1.parent.convertToWorldSpaceAR(pos1);
        let rect1: cc.Rect = cc.rect(world1.x, world1.y, node1.width, node1.height);

        let pos2: cc.Vec2 = node2.getPosition();
        let world2: cc.Vec2 = node2.parent.convertToWorldSpaceAR(pos2);
        let rect2: cc.Rect = cc.rect(world2.x, world2.y, node2.width, node2.height);
        // console.log('node1 rect:', rect1, 'node2 rect:', rect2);
        return rect1.intersects(rect2);
        // 因为spine大小很大 判断会有误差
        return node1.getBoundingBoxToWorld().intersects(node2.getBoundingBoxToWorld());
    }

    getWorldPosition(node: cc.Node) {
        if (node.parent) {
            return node.parent.convertToWorldSpaceAR(node.position);
        } else {
            return node.position;
        }
    }

    getObjLength(data: { [k: string]: any }) {
        let count: number = 0;
        for (const k in data) {
            if (data[k]) {
                ++count;
            }
        }
        return count;
    }

    getObjByIndex(data: { [k: string]: any }, index: number) {
        let count: number = 0;
        for (const k in data) {
            if (data[k] && index == count) {
                return data[k];
            }
            ++count;
        }
        return null;
    }

    objToMap(data: { [k: string]: any }) {
        let map: Map<string, any> = new Map();
        for (const k in data) {
            map.set(k, data[k]);
        }
        return map;
    }

    concatObj(...objs: { [k: string]: any }[]) {
        let newObj: { [k: string]: any } = {};
        if (objs) {
            for (let i = 0; i < objs.length; ++i) {
                let obj = objs[i];
                for (const k in obj) {
                    if (!newObj.hasOwnProperty(k)) {
                        newObj[k] = obj[k];
                    }
                }
            }
        }
        return newObj;
    }

    getObjMaxIndex(data: { [k: string]: any }) {
        let maxIndex: number = 0;
        for (const k in data) {
            if (data.hasOwnProperty(k)) {
                maxIndex = Number(k);
            }
        }
        return maxIndex;
    }

    /**
     * @description 获取武将的初始星级
     * @param hero 武将basic配置
     * @returns
     */
    getHeroInitStar(heroId: number) {
        let hero: cfg.HeroBasic = configUtils.getHeroBasicConfig(heroId);
        let modelConfig: cfg.ConfigModule = configUtils.getModuleConfigs();
        let heroBeginStarString = modelConfig.HeroBeginStar;
        let heroBeginStarList: string[] = utils.parseStingList(heroBeginStarString);
        for (const k in heroBeginStarList) {
            if (hero.HeroBasicQuality == Number(heroBeginStarList[k][0])) {
                return Number(heroBeginStarList[k][1])
            }
        }
        return 1;
    }

    private _maxLevel: number = -1;
    getUserMaxLv(): number {
        if (this._maxLevel === -1) {
            let levelExpConfigs: {[key: number]: cfg.LevelExp} = configManager.getConfigs("levelExp");
            let maxLevel: number = 0;
            for (let k in levelExpConfigs) {
                if (levelExpConfigs[k].LevelExpType === LEVEL_EXP_TYPE.USER) {
                    maxLevel += 1;
                }
            }
            this._maxLevel = maxLevel;
        }

        return this._maxLevel;
    }

    /**
   * @description 根据时间差获得时间
   * @param timeStamp 时间差 【秒】
   * @param format 指定格式
   */
    getTimeInterval(timeStamp: number, format?: string): string {
        let _format = format || 'hh:mm:ss';
        let leftTime = timeStamp;
        let days = Math.floor(leftTime / 3600 / 24);

        leftTime -= days * 3600 * 24;
        let hours = Math.floor(leftTime / 3600);

        leftTime -= hours * 3600;
        let minutes = Math.floor(leftTime / 60);
        let seconds = leftTime - minutes * 60;

        let timeStr: string = '';
        if (_format == 'hh:mm:ss') {
            if (days > 0) {
                timeStr = `${days}天`;
            }
            else if (hours > 0) {
                timeStr = `${hours}小时`;
            }
            else {
                timeStr = this.getzf(minutes) + ':' + this.getzf(seconds);
            }
        }
        return timeStr;
    }

     /**
   * @description 根据时间差获得时间
   * @param timeStamp 时间差 【秒】, 最大单位小时，不会出现天数
   * @param format 指定格式
   * @param fixZero 是否固定将0补齐
   */
    getTimeIntervalHour (timeStamp: number, format?: string,fixZero?:boolean): string {
        let _format = format || 'hh:mm:ss';
        let leftTime = timeStamp;
        // let days = Math.floor(leftTime / 3600 / 24);

        // leftTime -= days * 3600 * 24;
        let hours = Math.floor(leftTime / 3600);

        leftTime -= hours * 3600;
        let minutes = Math.floor(leftTime / 60);
        let seconds = leftTime - minutes * 60;

        let timeStr: string = '';
        if (_format == 'hh:mm:ss') {
            if (hours > 0) {
                timeStr = `${hours}:`;
            }
            if (fixZero) {
                timeStr = this.getzf(hours) + `:`;
            }
            timeStr += this.getzf(minutes) + ':' + this.getzf(seconds);
        } else if (_format == 'HH:MM:SS') {
            // 不足1小时也显示1小时，强制格式为00:00:00
            timeStr = `${this.getzf(hours)}:${this.getzf(minutes)}:${this.getzf(seconds)}`;
        }
        return timeStr;
    }

    /**
     * @description 获取剩下的时间
     *      1. 大于1天， 返回xx天
     *      2. 小于1天大于1小时，返回 xx小时
     *      3. 小于1小时，返回 xx分钟
     * @param timeStamp 时间差 【秒】
     * @param format 指定格式
     */
    getTimeLeft(timeStamp: number): string {
        let leftTime = timeStamp;
        let days = Math.floor(leftTime / 3600 / 24);

        leftTime -= days * 3600 * 24;
        let hours = Math.floor(leftTime / 3600);

        leftTime -= hours * 3600;
        let minutes = Math.floor(leftTime / 60);

        let timeStr: string = '';
        if (days >= 1) {
            timeStr = `${days}天`;
        } else if (hours >= 1) {
            timeStr = `${hours}小时`;
        } else {
            timeStr = `${minutes}分钟`;
        }
        return timeStr;
    }

    /**
     * @description 通过日期格式获得时间戳
     * @param time 日期 yyyy;mm;dd
     */
    parseTimeToStamp(time: string) {
        if (!time) return 0;
        let timeStr = time.split(";")
        let year = timeStr[0];
        let month = timeStr[1];
        let day = timeStr[2];

        let beginDate = new Date(`${year}/${month}/${day} 0:0:0`);
        return beginDate.getTime();
    }

    parseSecondsToHours(seconds: number) {
        let hour: string = this.getzf(seconds / (60 * 60));
        let minute: string = this.getzf(seconds % 3600 / 60);
        let second: string = this.getzf(seconds % 60);
        return `${hour}:${minute}:${second}`;
    }

    //补0操作
    getzf(num: number) {
        let numStr = '';
        if (Math.floor(num) < 10) {
            numStr = '0' + Math.floor(num).toString();
        } else {
            numStr = '' + Math.floor(num).toString();
        }
        return numStr;
    }

    //解析奖品数据
    public parseStr2Iteminfo(str: string): data.IItemInfo[] {
        let itemList: data.IItemInfo[] = [];
        utils.parseStingList(str).forEach((ele) => {
            let itemInfo: data.ItemInfo = {
                Count: Number(ele[1] | 0),
                ID: Number(ele[0]),
                toJSON: null,
            }
            itemList.push(itemInfo);
        })
        return itemList;
    }

    /**
     * @description 根绝角色ID获取角色spine的路径
     * @param roleId
     */

    getRoleSketonById(roleId: number) {
        let cfg: any = configUtils.getHeroBasicConfig(roleId);
        let skeleton = "";
        if (cfg) {
            if (cfg && cfg.HeroBasicModel) {
                skeleton = resPathUtils.getModelSpinePath(cfg.HeroBasicModel);
            }
        } else {
            cfg = configUtils.getMonsterConfig(roleId);
            if (cfg) {
                //@ts-ignore
                let modelId = cfg.ModelId;
                if (modelId) {
                    skeleton = resPathUtils.getModelSpinePath(modelId);
                }
            }
        }

        return skeleton;
    }
    /**
     * 获取基于锚点的特定时间戳
     * @param stage 1.日开始 2.周开始 3.月开始
     * @param anchor 时间锚点，秒
     */
    getStageTimeStamp(stage: number, anchor?: number) {
        let time = anchor || serverTime.currServerTime();
        let now = new Date(time * 1000); // 当前日期
        let nowDayOfWeek = now.getDay() || 7; // 本周第几天
        let stamp: number = Number(now);
        let resetTime = configUtils.getBasicConfig().ActivityResetCron;            //活动重置时间
        let resetArr = resetTime.split("|") || [];
        let year = now.getFullYear(),
            month = now.getMonth() + 1,
            day = now.getDate();
        let hour = resetArr[1] || 0,
            minute = resetArr[0] || 0,
            second = 0;
        //当前时间大于重置时间，开始时间是今天，否则为上一天
        let beginOfDay =
            Number(new Date(`${year}-${month}-${day} ${hour}:${minute}:${second}`));
        if (Number(now) < beginOfDay) { beginOfDay -= 24 * 60 * 60 * 1000 };

        switch (stage) {
            case 1: { stamp = beginOfDay; break; } //日开始
            case 2: { stamp = beginOfDay - (nowDayOfWeek - 1) * 60 * 60 * 24 * 1000; break; } //周开始
            case 3: { stamp = beginOfDay - (day - 1) * 60 * 60 * 24 * 1000; break; }//月开始
            default: break;
        }
        return stamp / 1000;
    }

    /**
    * 获取基于锚点的特定时间戳(不含重置时间)
    * @param stage 1.日开始 2.周开始 3.月开始
    * @param anchor 时间锚点，秒
    */
    getStageTimeStampEx(stage: number, anchor?: number) {
        let time = anchor || serverTime.currServerTime();
        let now = new Date(time * 1000); // 当前日期
        let nowDayOfWeek = now.getDay() || 7; // 本周第几天
        let stamp: number = Number(now);
        let year = now.getFullYear(),
            month = now.getMonth() + 1,
            day = now.getDate();
        //当前时间大于重置时间，开始时间是今天，否则为上一天
        let beginOfDay =
            Number(new Date(`${year}-${month}-${day} 0:0:0`));

        switch (stage) {
            case 1: { stamp = beginOfDay; break; } //日开始
            case 2: { stamp = beginOfDay - (nowDayOfWeek - 1) * 60 * 60 * 24 * 1000; break; } //周开始
            case 3: { stamp = beginOfDay - (day - 1) * 60 * 60 * 24 * 1000; break; }//月开始
            default: break;
        }
        return stamp / 1000;
    }

    /**
     * 获取当前到重置日的时间戳
     * @param resetWeekDay 周几重置
     */
    getTimeStampByReset(resetWeekDay: number) {
        let time = serverTime.currServerTime();
        let now = new Date(time * 1000); // 当前日期
        let nowDayOfWeek = now.getDay() || 7; // 本周第几天
        let stamp: number = Number(now);
        let year = now.getFullYear(),
            month = now.getMonth() + 1,
            day = now.getDate();
        //跨天零时
        let beginOfDay =
            Number(new Date(`${year}-${month}-${day + 1} 0:0:0`));
        if (nowDayOfWeek >= resetWeekDay) {
            // (7-nowDay): 本周剩余天数 
            // (resetWeekDay - 1) 下周离重置剩余的天数
            // (beginOfDay - time) 今天剩余时间
            stamp = (7 - nowDayOfWeek + resetWeekDay - 1) * 24 * 60 * 60 + (beginOfDay / 1000 - time);
        } else {
            stamp = (beginOfDay / 1000 - time) + (resetWeekDay - 1 - nowDayOfWeek) * 24 * 60 * 60;
        }

        return stamp;
    }

    /**
     * @desc 配置开始时间，持续时间
     * @param cfgBeginTime 
     * @param cfgDurTime 
     * @returns 开始、结束时间(s)
     */
    getActiveTime(cfgBeginTime:string,cfgDurTime:number):number[]{
        let parseArr = utils.parseStingList(cfgBeginTime) || [];
        let resetTime = configUtils.getBasicConfig().ActivityResetCron;            //活动重置时间
        let resetArr = resetTime.split("|") || [];

        let beginTime: number = 0;
        let endTime: number = 0;
        
        if (parseArr[0] === "1") {
            // 1|x：表示开服时间起第x天
            let openDate = new Date(serverTime.openServerTime * 1000);
            let beginOfOpenDay = this.parseTimeToStamp(`${openDate.getFullYear()};${openDate.getMonth() + 1};${openDate.getDate()}`) / 1000;
            beginTime = beginOfOpenDay + (parseFloat(parseArr[1])-1) * 24 * 60 * 60;
        } else {
            // 2|x：表示自然时间，x为对应时间戳
            beginTime = this.parseTimeToStamp(parseArr[1]) / 1000;
        }

        // 加上重置时间（这个不太懂，但是不改变不懂的地方）
        beginTime += parseFloat(resetArr[1]) * 60 * 60 + parseFloat(resetArr[1]) * 60;
        
        cfgDurTime && (endTime = beginTime + cfgDurTime * 24 * 60 * 60);

        if(beginTime && endTime){
            return [beginTime, endTime];
        }else{
            return [];
        }
    }

   getFormatTime(stamp: number) {
        let date = new Date(stamp*1000);
        let digitFormat = (num: number)=>{
            if (num && num<10) return "0" + num;
            return num;
        }
        var year = date.getFullYear(),
            month = digitFormat(date.getMonth() + 1),//月份是从0开始的
            day = digitFormat(date.getDate()),
            hour = digitFormat(date.getHours()),
            min = digitFormat(date.getMinutes()),
            sec = digitFormat(date.getSeconds());
        var newTime = year + '-' +
            month + '-' +
            day + ' ' +
            hour + ':' +
            min + ':' +
            sec;
        return newTime;
    }

    /**
     * @description 获取格式化剩余时间
     * @param time 剩余时间，单位: s
     * @returns 返回时间格式数组，长度为4， 依次为天、时、分、秒
     */
    getLeftTime(leftSec: number): number[] {
        if(leftSec <= 0) return [0,0,0,0];
        let next = leftSec;
        let sec = leftSec % 60;
        next -= sec;
        next = Math.floor(next / 60);
        let min = next % 60;
        next = Math.floor(next / 60);
        let hour = next % 24;
        next = Math.floor(next / 24);
        return [next, hour, min, sec];
    }

    fadeToAction(target: cc.Node, time: number = 0.2, opacity: number = 255, delayTime: number = 0, startCb?: Function, endCb?: Function) {
        if(target) {
            target.stopAllActions();
            cc.tween(target)
                .call(() => {
                    startCb && startCb();
                })
                .delay(delayTime)
                .to(time, { opacity:  opacity})
                .call(() => {
                    endCb && endCb();
                })
                .start();
        }
    }

    getNumChangeRes(num: number, defaultDesc: string = ''){
        if (typeof(num) != "number" || !num) return defaultDesc;
        if (num>=0) return `+${num}`;
        return `${num}`;
    }

    beginTimer () {
        AppUtils.Timer = new Date().getTime(); 
    }

    endTimer () {
        let interval = new Date().getTime() -  AppUtils.Timer;
        console.log("[AppUtils] Timer = ", interval , "ms")
    }

    getMonsterIdsByCfg (groupCfg: cfg.MonsterGroup) {
        if (groupCfg) {
            let monsterIds: number[] = [];
            monsterIds.push(groupCfg.MonsterId1? groupCfg.MonsterId1 : 0);
            monsterIds.push(groupCfg.MonsterId2? groupCfg.MonsterId2 : 0);
            monsterIds.push(groupCfg.MonsterId3? groupCfg.MonsterId3 : 0);
            monsterIds.push(groupCfg.MonsterId4? groupCfg.MonsterId4 : 0);
            monsterIds.push(groupCfg.MonsterId5? groupCfg.MonsterId5 : 0);
            return monsterIds;
        } else {
            logger.error("[AppUtils Battle Prepare], cant find monsterids", groupCfg)
            return [];
        }
    }

    getTodayZeroTime(isSecond: boolean = true) {
        return this.getZeroTimeByTimeStamp(null, true);
    }

    getZeroTimeByTimeStamp(timeStamp: number, isSecond: boolean = true) {
        timeStamp = timeStamp || serverTime.currServerTime();
        let zeroData = timeStamp - (timeStamp + 8 * 3600) % 86400;
        return isSecond ? zeroData : zeroData * 1000;
    }

    /**
     * 格式化文本字符串
     * let template = "【%itemname】不足\\n\\n是否要消耗【%itemnum%itemname】进行补充？";
     * let replacement = [{itemname:1}, {itemnum: 2}, {itemname: 3}];
     * convertFormatString(template, replacement);
     */
    convertFormatString(src: string, replacement: Array<any>){
        let result = src;
        return replacement.every((obj, idx) => {
            if(!obj) return false;
            for(let key in obj){
                let reg = new RegExp(`%${key}`, 'i');
                if(result.search(reg) == -1) return false;
                result = result.replace(reg, obj[key]);
            }
            return true; 
        }) ? result : src;
    }

    swap(list: any[], index1: number, index2: number) {
        if(index1 < list.length && index2 < list.length && index1 != index2) {
            [list[index1], [list[index2]]] = [list[index2], list[index1]];
        }
    }

    /**
     * 获取字符串长度
     * @param str
     * @param ignoreCN 忽略中文， true 中文当作一个字符长度， false 当作两个
     */
    strLen(str: string, ignoreCN: boolean = false){
        if(!str || str.length == 0) return 0;
        if(ignoreCN) return str.length;
        let temp = str.replace(/[^\x00-\xff]/g,"01");
        return temp.length;
    }

    isNodeContain(parentNode: cc.Node, childNode: cc.Node): boolean {
        if(!cc.isValid(parentNode) || !cc.isValid(childNode)) return false;
        for(let i = 0, len = parentNode.childrenCount; i < len; i++){
            let child = parentNode.children[i];
            if(child === childNode) return true;
            if(child.childrenCount > 0 && this.isNodeContain(child, childNode)){
                return true
            }
        }
        return false;
    }

    checkIsOnLines(point1: cc.Vec2 | cc.Vec3, point2: cc.Vec2 | cc.Vec3, srcPoint: cc.Vec2 | cc.Vec3) {
        const newPoint1 = cc.v2(point1);
        const newPoint2 = cc.v2(point2);
        const newSrcPoint = cc.v2(srcPoint);
        const cross = Math.abs((newSrcPoint.x - newPoint1.x) * (newPoint2.y - newPoint1.y) - (newSrcPoint.y - newPoint1.y) * (newPoint2.x - newPoint1.x));
        return cross >= 0 && cross < 0.1;
        return newPoint1.cross(newPoint2) == newPoint1.cross(newSrcPoint) && Math.abs(newPoint1.sub(newPoint2).len()) >= Math.abs(newPoint1.sub(newSrcPoint).len());
    }

    // 多次使用action去move的话，左边会有误差，避免因为这些误差而频繁地耗时间去做无意义的移动
    checkPosNeedMove (p1: cc.Vec2, p2: cc.Vec2) {
        if (Math.abs(p1.x-p2.x) < 5 && Math.abs(p1.y-p2.y) < 5) {
            return false
        }
        return true
    }

    /**
     * 取得当前用户的account
     * @returns 
     */
    getUserAccount(): string {
        let localAccount = localStorageMgr.getLocalStorage(SAVE_TAG.LAST_ACCOUNT)
        if (localAccount) {
            return localAccount + "";
        } else {
            let account = serverTime.currServerTime().toString();
            this.setUserAccount(account);
            return account + '';
        }
    }

    /**
     * 设置当前用户的account
     * @param account 
     */
    setUserAccount(account: string) {
        localStorageMgr.setLocalStorage(SAVE_TAG.LAST_ACCOUNT, account)
    }

    /**
     * 设置节点的单点触摸,一般用于系统UI组件(PS： 用于自定义组件时，要保证响应触摸事件的方法名称是下面的名称)
     * @param comp 带有触摸事件的组件
     *
     */
    setSingleTouch<T extends cc.Component>(comp: T) {
        if(!cc.isValid(comp) || !cc.isValid(comp.node)) return;
        comp._touchID = NaN;

        comp._onTouchBegan && comp.node.off(cc.Node.EventType.TOUCH_START, comp._onTouchBegan, comp, true);
        comp._onTouchMoved && comp.node.off(cc.Node.EventType.TOUCH_MOVE, comp._onTouchMoved, comp, true);
        comp._onTouchEnded && comp.node.off(cc.Node.EventType.TOUCH_END, comp._onTouchEnded, comp, true);
        comp._onTouchCancelled && comp.node.off(cc.Node.EventType.TOUCH_CANCEL, comp._onTouchCancelled, comp, true);

        let proto =  Object.getPrototypeOf(comp);
        if(comp._onTouchBegan) {
            comp._onTouchBegan = (event: cc.Event.EventTouch, captureListeners: any) => {
                if(!isNaN(comp._touchID) && event.getID() != comp._touchID) {
                    event.stopPropagation();
                    return;
                }
                comp._touchID = event.getID();
                proto._onTouchBegan.call(comp, event, captureListeners);
            }
            comp.node.on(cc.Node.EventType.TOUCH_START, comp._onTouchBegan, comp, true);
        }

        if(comp._onTouchMoved) {
            comp._onTouchMoved = (event: cc.Event.EventTouch, captureListeners: any) => {
                if(!isNaN(comp._touchID) && event.getID() != comp._touchID) {
                    event.stopPropagation();
                    return;
                }
                proto._onTouchMoved.call(comp, event, captureListeners);
            }
            comp.node.on(cc.Node.EventType.TOUCH_MOVE, comp._onTouchMoved, comp, true);
        }

        if(comp._onTouchEnded) {
            comp._onTouchEnded = (event: cc.Event.EventTouch, captureListeners: any) => {
                if(!isNaN(comp._touchID) && event.getID() != comp._touchID) {
                    event.stopPropagation();
                    return;
                }
                proto._onTouchEnded.call(comp, event, captureListeners);
                comp._touchID = NaN;
            }
            comp.node.on(cc.Node.EventType.TOUCH_END, comp._onTouchEnded, comp, true);
        }

        if(comp._onTouchCancelled) {
            comp._onTouchCancelled = (event: cc.Event.EventTouch, captureListeners: any) => {
                if(!isNaN(comp._touchID) && event.getID() != comp._touchID) {
                    event.stopPropagation();
                    return;
                }
                proto._onTouchCancelled.call(comp, event, captureListeners);
                comp._touchID = NaN;
            }
            comp.node.on(cc.Node.EventType.TOUCH_CANCEL, comp._onTouchCancelled, comp, true);
        }

        let oldDisableFn = comp.onDisable;
        comp.onDisable = () {
            oldDisableFn && oldDisableFn.call(comp);
           comp._touchID = NaN;
        }
    }

    /**
     * 把道具数组合并，避免多个相同道具重复显示
     */
    mergeItemList (data: data.IItemInfo[]) {
        let itemList: data.IItemInfo[] = [];
        data.forEach ( ele => {
            itemList.forEach( ori => {
                let isNormalItem = configUtils.getItemConfig(ele.ID);
                if (ori.ID == ele.ID && isNormalItem && ori.Count) {
                    ori.Count = utils.longToNumber(ele.Count) + utils.longToNumber(ori.Count) ;
                    ele.Count = 0;
                }
            })
            itemList.push(ele)
        })
        
        itemList = itemList.filter( ele => {return ele.Count > 0})
        return itemList;
    }

    //数组中快速删除一个元素，注意：这种方式可能会打乱元素的索引
    arrayFastRemoveEle(arr: any[], ele: any): boolean {
        if(!arr || arr.length == 0) return false;
        let idx = arr.indexOf(ele);
        if(idx != -1) {
            arr[idx] = arr[arr.length - 1];
            arr.length = arr.length - 1;
            return true;
        }
        return false;
    }

    /**
     * @param itemId 
     * @returns 返回一个本地合法的itemURl路劲
     */
    findValidItemUrlByID(itemId: number): string {
        //itme
        let cfg: cfg.Item = configUtils.getItemConfig(itemId);
        if (cfg && cfg.ItemId && cfg.ItemIcon) { 
            return `${RES_ICON_PRE_URL.BAG_ITEM}/${cfg.ItemIcon}`;
        } 

        //装备
        let cfgEquip:cfg.Equip = configUtils.getEquipConfig(itemId);
        if (cfgEquip && cfgEquip.Icon) {
            return `${RES_ICON_PRE_URL.BAG_ITEM}/${cfgEquip.Icon}`; 
        }

        let cfgBeast:cfg.Beast = configUtils.getBeastConfig(itemId);
        if (cfgBeast && cfgBeast.BeastHeadImage) {
            return `${RES_ICON_PRE_URL.BAG_ITEM}/${cfgBeast.BeastHeadImage}`;;
        }

        //hero
        let cfgHero:cfg.HeroBasic = configUtils.getHeroBasicConfig(itemId);
        if (cfgHero && cfgHero.HeroBasicModel) {
            let modelCfg: cfg.Model = configManager.getConfigByKey("model", cfgHero.HeroBasicModel);
            if (!modelCfg) return null;
            return `${RES_ICON_PRE_URL.HEAD_IMG}/${modelCfg.ModelHeadIconSquare}`;
            
        }
        
        logger.error(`AppUtils`, `dont find Valid Url,itemId:${itemId}`);
        return null;
    }

	/** 根据通用配置的活动刷新时间计算剩余时间 */
    getRestTimeForActivityResetCron() {
        let currServerTime = serverTime.currServerTime();

        // 通过当天凌晨的时间，计算剩余的时间
        let date = new Date(currServerTime * 1000);
        let leftDayTime = 24 * 60 * 60 - date.getHours() * 60 * 60 - date.getMinutes() * 60 - date.getSeconds();

        // 加上配置的刷新时间
        let resetCron = configUtils.getBasicConfig().ActivityResetCron;
        let parseResult = resetCron.split("|");
        let minute = parseResult[0] ? Number(parseResult[0]) : 0;
        let hour = parseResult[1] ? Number(parseResult[1]) : 0;

        return leftDayTime + hour * 60 * 60 + minute * 60;
    }

    /** 根据通用配置的活动刷新时间计算当天刷新的时间对应的时间戳(s) */
    getTodayTimeForActivityResetCron() {
        let currServerTime = serverTime.currServerTime();

        // 通过当天凌晨的时间，计算剩余的时间
        let date = new Date(currServerTime * 1000);
        let todayTime = currServerTime - date.getHours() * 60 * 60 - date.getMinutes() * 60 - date.getSeconds();

        // 加上配置的刷新时间
        let resetCron = configUtils.getBasicConfig().ActivityResetCron;
        let parseResult = resetCron.split("|");
        let minute = parseResult[0] ? Number(parseResult[0]) : 0;
        let hour = parseResult[1] ? Number(parseResult[1]) : 0;

        todayTime += hour * 60 * 60 + minute * 60;

        return todayTime;
    }

    /** 随机数种子(整数) */
    private _seed: number = Math.floor(Date.now() / 1000);
    get seed() {
        return this._seed
    }
    set seed(seed: number) {
        this._seed = seed;
    }

    /**
     * 获得随机整数(可通过设置随机数种子seed来控制结果)
     * @returns 随机整数
     */
    getRandomInteger(): number {
        return ((this._seed * 214013 + 2531011) >> 16) & 0x7fff;
    }

    /**
     * 使用随机函数getRandomInteger打乱数组，如果想控制结果，可设置随机数种子
     * @param arr 数组 
     * @param seed 随机种子
     */
    randomArray(arr: any[], seed?: number) {
         this.seed = seed;

        let mold = arr.length;
        let randomIndex = 0;
        let temp = 0;
        for (let i = arr.length - 1; i >= 0; --i) {
            randomIndex = this.getRandomInteger() % mold;
            mold -= 1;

            temp = arr[i];
            arr[i] = arr[randomIndex];
            arr[randomIndex] = temp;
        }
    }

    /** 设置按钮interactable，用于规避ButtonAntiClick组件的影响
     */
    setButtonInteractable(button: cc.Button, interactable: boolean) {
        let buttonAntiClick: ButtonAntiClick = button.node.getComponent(ButtonAntiClick);
        if (buttonAntiClick != null) {
            buttonAntiClick.enabled = interactable;
        }

        button.interactable = interactable;
    }

    /**
     * 设置节点及其子节点灰色材质
     * @param node 节点
     * @param isGray 是否为灰
     */
    setNodeAndChildrenGray(node: cc.Node, isGray: boolean) {
        let materialStr: string = isGray ? 'builtin-2d-gray-sprite' : 'builtin-2d-sprite';
        let material: cc.Material = cc.assetManager.builtins.getBuiltin('material', materialStr) as cc.Material;
        let sprites = node.getComponentsInChildren(cc.Sprite);
        sprites && sprites.forEach(ele => {
            ele.setMaterial(0, material);
        });
    }

    /**
     * 设置Sprite的材质是否为灰色
     * @param sp 精灵
     * @param isGray 是否为灰
     */
    setSpriteGray(sp: cc.Sprite, isGray: boolean) {
        let materialStr: string = isGray ? 'builtin-2d-gray-sprite' : 'builtin-2d-sprite';
        let material: cc.Material = cc.assetManager.builtins.getBuiltin('material', materialStr) as cc.Material;
        sp.setMaterial(0, material);
    }

    /**
     * 获取fromNode在toNode中的位置(未处理锚点)
     * @param fromNode 
     * @param toNode 
     */
    getPositionInNode(fromNode: cc.Node, toNode: cc.Node) {
        let worldPosition = fromNode.convertToWorldSpaceAR(cc.v2(0, 0));
        let mat = new cc.AffineTransform();
        toNode.getWorldToNodeTransform(mat);
        let position = cc.v2(0, 0);
        cc.AffineTransform.transformVec2(position, worldPosition, mat);

        return position;
    }
};

export let utils = new AppUtils();
