package org.cocos2d.RunX;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;

import org.cocos2dx.javascript.AppActivity;
import org.json.JSONArray;
import org.json.JSONObject;

import com.talkingsdk.models.PayData;
import com.talkingsdk.models.PlayerData;
import com.zqgame.RunX.BuildConfig;
import com.talkingsdk.MainApplication;

import java.util.HashMap;
import java.util.Map;

@SuppressWarnings("unused")
public class PackageUtils {

    static boolean IsUseWIFI () {
        ConnectivityManager cm = (ConnectivityManager) AppActivity.getContext().getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo info = cm.getNetworkInfo(ConnectivityManager.TYPE_WIFI);
        return info.isConnected();
    }

    static double GetBatteryLevel () {
        return 0;
    }

    static String GetDeviceID () {
        return "none";
    }

    static String GetPackageVersion () {
        return BuildConfig.VERSION_NAME;
    }

    static String GetPackageBuild () {
        return Integer.toString(BuildConfig.VERSION_CODE);
    }

    static String GetIntentPath () {
        return AppActivity.intentPath;
    }

    static String GetIntentSearch () {
        return AppActivity.intentSearch;
    }

    static int GetSdkInitStatus () {
        return AppActivity.sdkStatus;
    }

    static String GetAccountAge () {
        return AppActivity.age;
    }

    static void Login () {
        MainApplication.getInstance().login();
    }

    static void LoginWX4YYB () {
        MainApplication.getInstance().login(35);
    }

    static void LoginQQ4YYB () {
        MainApplication.getInstance().login(27);
    }

    static void Logout () {
        MainApplication.getInstance().logout();
    }

    static void GetIsAntiAddiction () {
        MainApplication.getInstance().getIsAntiAddiction();
    }

    static void ChangeAccount () {
        MainApplication.getInstance().changeAccount();
    }

    static void CreateRole (String serverID, String serverName, int roleID, String roleName, String createTime) {
        PlayerData _playerData = new PlayerData();

        _playerData.setServerNo(serverID);
        _playerData.setServerName(serverName);
        _playerData.setRoleId(roleID);
        _playerData.setRoleName(roleName);
        _playerData.setLevel(1);

        Map<String,String> exs = new HashMap<String,String>();
        exs.put("roleCTime",createTime);// 单位：秒 即10位数
        _playerData.setEx(exs);

        MainApplication.getInstance().createRole(_playerData);
    }

    static void EnterGame (String serverID, String serverName, int roleID, String roleName, int level, String createTime) {
        PlayerData _playerData = new PlayerData();

        _playerData.setServerNo(serverID);
        _playerData.setServerName(serverName);
        _playerData.setRoleId(roleID);
        _playerData.setRoleName(roleName);
        _playerData.setLevel(level);

        Map<String,String> exs = new HashMap<String,String>();
        exs.put("roleCTime",createTime);// 单位：秒 即10位数
        _playerData.setEx(exs);

        MainApplication.getInstance().enterGame(_playerData);
    }

    static void UserLevelUp (String serverID, String serverName, int roleID, String roleName, int level, String createTime) {
        PlayerData _playerData = new PlayerData();

        _playerData.setServerNo(serverID);
        _playerData.setServerName(serverName);
        _playerData.setRoleId(roleID);
        _playerData.setRoleName(roleName);
        _playerData.setLevel(level);

        Map<String,String> exs = new HashMap<String,String>();
        exs.put("roleCTime",createTime);// 单位：秒 即10位数
        _playerData.setEx(exs);

        MainApplication.getInstance().userUpLevel(_playerData);
    }

    static void Pay (
            String order,
            String productID,
            String productName,
            int price,
            int idealPrice,
            int count,
            String desc,
            String orderTime,
            String accid,
            String account,
            String roleID,
            String roleName,
            String level,
            String serverID,
            String serverName,
            String ext,
            String session,
            String sign,
            String platOrderID,
            String noticeUrl
    ) {
        PayData payData = new PayData();

        payData.setSubmitTime(orderTime);
        payData.setMyOrderId(order);
        payData.setDescription(desc);
        payData.setProductCount(count);
        payData.setProductId(productID);
        payData.setProductIdealPrice(price);
        payData.setProductRealPrice(price);
        payData.setProductName(productName);
        
        Map<String,String> exs = new HashMap<String,String>();

        exs.put("UserLevel", level);
        exs.put("UserRoleName", roleName);
        exs.put("UserRoleId", roleID);
        exs.put("UserServerName", serverName);
        exs.put("UserServerId", serverID);
        exs.put("GameMoneyAmount", String.valueOf(count));
        exs.put("GameMoneyName", productName);
        exs.put("UserBalance", "0");
        exs.put("UserGamerVip", "0");
        exs.put("UserPartyName", "无");

        exs.put("UserId", accid);
        exs.put("LoginAccount", account);
        exs.put("LoginDataEx", ext);
        exs.put("LoginSession", session);
        exs.put("AccessKey", sign);
        exs.put("OutOrderID", platOrderID);
        exs.put("NoticeUrl", noticeUrl);

        payData.setEx(exs);
        MainApplication.getInstance().pay(payData);
    }
}
