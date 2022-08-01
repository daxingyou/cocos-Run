/*
 * @Author: fly
 * @Date: 2021-03-16 11:13:51
 * @LastEditTime: 2021-03-16 13:43:01
 * @Description: 原生接口相关
 */

const PUClassName = "org.cocos2d.ProjectS.PackageUtils";

function isIos () {
    try {
        //@ts-ignore
        return cc.sys.os == cc.sys.OS_IOS;
    } catch (error) {
    }
    return false;
}

function isAndroid () {
    try {
        //@ts-ignore
        return cc.sys.os == cc.sys.OS_ANDROID;
    } catch (error) {
    }
    return false;
}

function isNative () {
    try {
        //@ts-ignore
        if (cc && cc.sys.isNative) {
            return true;
        }
    } catch (error) {
    }
    return false;
}

class PackageUtils {
    isUseWifi (): boolean {
        if (isIos()) {
            // @ts-ignore
            return jsb.reflection.callStaticMethod("PackageUtils", "IsUseWIFI");
        } else if (isAndroid()) {
            //@ts-ignore
            return jsb.reflection.callStaticMethod(PUClassName, "IsUseWIFI", "()Z");
        } else {
            return true;
        }
    }

    getBatteryLevel (): number {
        if (isIos()) {
            // @ts-ignore
            return jsb.reflection.callStaticMethod("PackageUtils", "GetBatteryLevel");
        } else if (isAndroid()) {
            //@ts-ignore
            return jsb.reflection.callStaticMethod(PUClassName, "GetBatteryLevel", "()D");
        } else {
            return 1;
        }
    }

    getDeviceID (): string {
        if (isIos()) {
            // @ts-ignore
            return jsb.reflection.callStaticMethod("PackageUtils", "GetDeviceID");
        } else if (isAndroid()) {
            //@ts-ignore
            return jsb.reflection.callStaticMethod(PUClassName, "GetDeviceID", "()Ljava/lang/String;");
        } else {
            return "none";
        }
    }

    getPackageVersion (): string {
        if (isIos()) {
            // @ts-ignore
            return jsb.reflection.callStaticMethod("PackageUtils", "GetPackageVersion");
        } else if (isAndroid()) {
            //@ts-ignore
            return jsb.reflection.callStaticMethod(PUClassName, "GetPackageVersion", "()Ljava/lang/String;")
        } else {
            return "0.0.0"
        }
    }

    getPackageBuild (): string {
        if (isIos()) {
            // @ts-ignore
            return jsb.reflection.callStaticMethod("PackageUtils", "GetPackageBuild");
        } else if (isAndroid()) {
            //@ts-ignore
            return jsb.reflection.callStaticMethod(PUClassName, "GetPackageBuild", "()Ljava/lang/String;")
        } else {
            return "0"
        }
    }

    reportRegister (userid: string) {
        if (isAndroid()) {
            //@ts-ignore
            jsb.reflection.callStaticMethod(PUClassName, "ReportRegister", "(Ljava/lang/String;)V", userid)
        } else if (isIos()) {
            // @ts-ignore
            jsb.reflection.callStaticMethod("PackageUtils", "ReportRegister:", userid)
        }
    }

    reportLogin (userid: string) {
        if (isAndroid()) {
            //@ts-ignore
            jsb.reflection.callStaticMethod(PUClassName, "ReportLogin", "(Ljava/lang/String;)V", userid)
        } else if (isIos()) {
            // @ts-ignore
            jsb.reflection.callStaticMethod("PackageUtils", "ReportLogin:", userid)
        }
    }

    reportCreateRole (userid: string) {
        if (isAndroid()) {
            //@ts-ignore
            jsb.reflection.callStaticMethod(PUClassName, "ReportCreateRole", "(Ljava/lang/String;)V", userid)
        } else if (isIos()) {
            // @ts-ignore
            jsb.reflection.callStaticMethod("PackageUtils", "ReportCreateRole:", userid)
        }
    }

    // url目前为： http://func01.hzyoka.com/uncache/recover-battle.html#xxx
    // 其中xxx为 zip2base64(JSON.stringify(战斗信息对象))再把=替换成_
    shareToLandingPage (trans: string, title: string, desc: string, url: string) {
        if (isAndroid()) {
            //@ts-ignore
            jsb.reflection.callStaticMethod(PUClassName, "ShareToLandingPage", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V", trans, title, desc, url)
        } else if (isIos()) {
            //@ts-ignore
            jsb.reflection.callStaticMethod("PackageUtils", "ShareToLandingPage:title:desc:url:", trans, title, desc, url)
        }
    }

    getIntentPath () {
        if (isAndroid()) {
            //@ts-ignore
            return jsb.reflection.callStaticMethod(PUClassName, "GetIntentPath", "()Ljava/lang/String;")
        } else if (isIos()) {
            // @ts-ignore
            return jsb.reflection.callStaticMethod("PackageUtils", "GetIntentPath")
        }
    }

    getIntentSearch () {
        if (isAndroid()) {
            //@ts-ignore
            return jsb.reflection.callStaticMethod(PUClassName, "GetIntentSearch", "()Ljava/lang/String;")
        } else if (isIos()) {
            // @ts-ignore
            return jsb.reflection.callStaticMethod("PackageUtils", "GetIntentSearch")
        }
    }

    showLogin () {
        if (isAndroid()) {
            //@ts-ignore
            jsb.reflection.callStaticMethod(PUClassName, "ShowLogin", "()V")
        } else if (isIos()) {
            // @ts-ignore
            jsb.reflection.callStaticMethod("PackageUtils", "ShowLogin")
        }
    }

    logout () {
        if (isAndroid()) {
            //@ts-ignore
            jsb.reflection.callStaticMethod(PUClassName, "Logout", "()V")
        } else if (isIos()) {
            // @ts-ignore
            jsb.reflection.callStaticMethod("PackageUtils", "Logout")
        }
    }

    showBindIDCard () {
        if (isAndroid()) {
            //@ts-ignore
            jsb.reflection.callStaticMethod(PUClassName, "ShowBindIDCard", "()V")
        }
    }
}

let packageUtils = new PackageUtils()
export {
    packageUtils as default,
    isIos,
    isAndroid,
    isNative
}