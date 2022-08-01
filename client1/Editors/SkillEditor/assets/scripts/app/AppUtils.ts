import { logger } from "../common/log/Logger";

/*
 * @Author: fly
 * @Date: 2021-03-16 11:13:51
 * @LastEditTime: 2021-03-16 13:42:50
 * @Description: 项目通用接口与常量
 */
declare var require: any;
export class AppUtils {
    static HeroUID: number = 200000000;
    static MonsterUID: number = 300000000;
    static BuffUID: number = 400000000;
    static HaloUID: number = 400000000;

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

    //代码添加点击事件
    addClickEventListener(node: cc.Node, callBack: Function, params?: any, startFunc?: Function) {
        if (!node || !cc.isValid(node)) return;

        var btnComp = node.getComponent(cc.Button);
        if (!btnComp) {
            btnComp = node.addComponent(cc.Button);
        }

        var touchSize_r = 1;

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
        var touchMove = (event: cc.Event.EventTouch) => {
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

        var touchEnd = function (event: cc.Event.EventTouch) {
            if (event && (node as any).onBtnClickId != event.getID()) {
                return;
            }
            if (!(node as any).clickEnable) return;
            if (event && !(event as any).node) {
                (event as any).node = node;
            }
            callBack && callBack(event, params);
        }
        var touchCancel = function (event: cc.Event.EventTouch) {

        }

        var touchNode = node.getChildByName('touchNode');
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
    deepCopy(obj: any) {
        let result = {};
        try {
            result = JSON.parse(JSON.stringify(obj));
        } catch (error) {
            logger.warn(`can't stringfy and parse obj. obj = `, obj);
        }
        return result;
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
            for (var i = 0; i < strArr.length; i++) {
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

    parseStingList(string: string) {
        if (string) {
            let tempStringList: string[] = string.split("|");
            tempStringList.forEach(item => {
                if (item.indexOf(";") > -1) {
                    item.split(";");
                }
            });
            return tempStringList;
        }
        return null;
    }
};

export let utils = new AppUtils();