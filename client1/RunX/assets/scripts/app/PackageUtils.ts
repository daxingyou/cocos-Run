/*
 * @Author: fly
 * @Date: 2021-03-16 11:13:51
 * @LastEditTime: 2021-03-16 13:43:01
 * @Description: 原生接口相关
 */

const PUClassName = "org.cocos2d.RunX.PackageUtils";

function isIos () {
    return cc.sys.os == cc.sys.OS_IOS;
}

function isAndroid () {
    return cc.sys.os == cc.sys.OS_ANDROID;
}

function isNative () {
    return cc.sys.isNative
}

class PackageUtils {
    isUseWifi (): boolean {
        if (isAndroid()) {
            //@ts-ignore
            return jsb.reflection.callStaticMethod(PUClassName, "IsUseWIFI", "()Z");
        } else if (isIos()) {
            // @ts-ignore
            return jsb.reflection.callStaticMethod("PackageUtils", "IsUseWIFI");
        } else {
            return true;
        }
    }

    getBatteryLevel (): number {
        if (isAndroid()) {
            //@ts-ignore
            return jsb.reflection.callStaticMethod(PUClassName, "GetBatteryLevel", "()D");
        } else if (isIos()) {
            // @ts-ignore
            return jsb.reflection.callStaticMethod("PackageUtils", "GetBatteryLevel");
        } else {
            return 1;
        }
    }

    getDeviceID (): string {
        if (isAndroid()) {
            //@ts-ignore
            return jsb.reflection.callStaticMethod(PUClassName, "GetDeviceID", "()Ljava/lang/String;");
        } else if (isIos()) {
            // @ts-ignore
            return jsb.reflection.callStaticMethod("PackageUtils", "GetDeviceID");
        } else {
            return "none";
        }
    }

    getPackageVersion (): string {
        if (isAndroid()) {
            //@ts-ignore
            return jsb.reflection.callStaticMethod(PUClassName, "GetPackageVersion", "()Ljava/lang/String;")
        } else if (isIos()) {
            // @ts-ignore
            return jsb.reflection.callStaticMethod("PackageUtils", "GetPackageVersion");
        } else {
            return "0.0.0"
        }
    }

    getPackageBuild (): string {
        if (isAndroid()) {
            //@ts-ignore
            return jsb.reflection.callStaticMethod(PUClassName, "GetPackageBuild", "()Ljava/lang/String;")
        } else if (isIos()) {
            // @ts-ignore
            return jsb.reflection.callStaticMethod("PackageUtils", "GetPackageBuild");
        } else {
            return "0"
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

    getSdkInitStatus () {
        if (isAndroid()) {
            //@ts-ignore
            return jsb.reflection.callStaticMethod(PUClassName, "GetSdkInitStatus", "()I")
        } else if (isIos()) {
            // @ts-ignore
            return jsb.reflection.callStaticMethod("PackageUtils", "GetSdkInitStatus")
        }
    }

    getIsAntiAddiction () {
        if (isAndroid()) {
            //@ts-ignore
            return jsb.reflection.callStaticMethod(PUClassName, "GetIsAntiAddiction", "()V")
        } else if (isIos()) {
            // @ts-ignore
            return jsb.reflection.callStaticMethod("PackageUtils", "GetIsAntiAddiction")
        }
    }

    getAccountAge () {
        if (isAndroid()) {
            //@ts-ignore
            return jsb.reflection.callStaticMethod(PUClassName, "GetAccountAge", "()Ljava/lang/String;")
        } else if (isIos()) {
            // @ts-ignore
            return jsb.reflection.callStaticMethod("PackageUtils", "GetAccountAge")
        } else {
            // 未实名
            return "-1";
        }
    }

    changeAccount () {
        if (isAndroid()) {
            //@ts-ignore
            return jsb.reflection.callStaticMethod(PUClassName, "ChangeAccount", "()V")
        } else if (isIos()) {
            // @ts-ignore
            return jsb.reflection.callStaticMethod("PackageUtils", "ChangeAccount")
        }
    }

    login() {
        if (isAndroid()) {
            //@ts-ignore
            jsb.reflection.callStaticMethod(PUClassName, "Login", "()V")
        } else if (isIos()) {
            // @ts-ignore
            jsb.reflection.callStaticMethod("PackageUtils", "Login")
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

    nativePay (order: string, productID: string, productName: string, price: number, 
        idealPrice: number, count: number, desc: string, orderTime: string, 
        accid: string, account: string, roleID: string, roleName: string, 
        level: string, serverID: string, serverName: string, ext: string, 
        session: string, sign: string, platOrderID: string, noticeUrl: string)
    {
        if (isAndroid()) {
            //@ts-ignore
            jsb.reflection.callStaticMethod(PUClassName, 
                "Pay", 
                "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;I\
IILjava/lang/String;Ljava/lang/String;\
Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;\
Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;\
Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V",
                order, productID, productName, price, 
                    idealPrice, count, desc, orderTime,
                    accid, account, roleID, roleName,
                    level, serverID, serverName, ext,
                    session, sign, platOrderID, noticeUrl)
        } else if (isIos()) {
            // @ts-ignore
            jsb.reflection.callStaticMethod("PackageUtils", "Pay")
        }
    }

    reportCreateRole (serverID: string, serverName: string, roleID: number, roleName: string, createTime: string) {
        if (isAndroid()) {
            //@ts-ignore
            jsb.reflection.callStaticMethod(PUClassName, 
                "CreateRole", 
                "(Ljava/lang/String;Ljava/lang/String;ILjava/lang/String;Ljava/lang/String;)V", 
                serverID, serverName, roleID, roleName, createTime)
        } else if (isIos()) {
            // @ts-ignore
            jsb.reflection.callStaticMethod("PackageUtils", "CreateRole:", roleID)
        }
    }

    reportLogin (serverID: string, serverName: string, roleID: number, roleName: string, level: number, createTime: string) {
        if (isAndroid()) {
            //@ts-ignore
            jsb.reflection.callStaticMethod(PUClassName, 
                "EnterGame", 
                "(Ljava/lang/String;Ljava/lang/String;ILjava/lang/String;ILjava/lang/String;)V",
                serverID, serverName, roleID, roleName, level, createTime)
        } else if (isIos()) {
            // @ts-ignore
            jsb.reflection.callStaticMethod("PackageUtils", "EnterGame:", roleID)
        }
    }

    reportLevelUp (serverID: string, serverName: string, roleID: number, roleName: string, level: number, createTime: string) {
        if (isAndroid()) {
            //@ts-ignore
            jsb.reflection.callStaticMethod(PUClassName, 
                "UserLevelUp", 
                "(Ljava/lang/String;Ljava/lang/String;ILjava/lang/String;ILjava/lang/String;)V",
                serverID, serverName, roleID, roleName, level, createTime)
        } else if (isIos()) {
            // @ts-ignore
            jsb.reflection.callStaticMethod("PackageUtils", "EnterGame:", roleID)
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