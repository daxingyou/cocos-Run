/****************************************************************************
Copyright (c) 2015-2016 Chukong Technologies Inc.
Copyright (c) 2017-2018 Xiamen Yaji Software Co., Ltd.

http://www.cocos2d-x.org

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
****************************************************************************/
package org.cocos2dx.javascript;

import org.cocos2dx.lib.Cocos2dxActivity;
import org.cocos2dx.lib.Cocos2dxGLSurfaceView;
import org.cocos2dx.lib.Cocos2dxJavascriptJavaBridge;

import org.json.JSONException;
import org.json.JSONObject;

import android.net.Uri;
import android.os.Bundle;

import android.content.Intent;
import android.content.res.Configuration;
import android.util.Log;
import android.view.KeyEvent;

import com.tencent.bugly.crashreport.CrashReport;

import com.talkingsdk.MainApplication;
import com.talkingsdk.ZQCode;
import com.talkingsdk.ZqgameSdkListener;

public class AppActivity extends Cocos2dxActivity implements ZqgameSdkListener {
    static public String intentPath;
    static public String intentSearch;
    static public int sdkStatus;
    static public String platfromId;
    static public String age;

    private final String TAG = "AppActivity";
    private MainApplication mainInstance;

    private void passIntent(Intent intent) {
        if (intent == null) {
            return;
        }

        if (intent.getData() == null) {
            return;
        }

        Uri uri = intent.getData();
        final String path = uri.getPath();
        final String search = uri.getQuery();
        this.runOnGLThread(new Runnable() {
            @Override
            public void run() {
                intentPath = path;
                intentSearch = search;
                Cocos2dxJavascriptJavaBridge.evalString(String.format(
                        "if (window.NotifyIntent) window.NotifyIntent();"
                ));
            }
        });
    }

    private void evalClientMsg(final String msg) {
        this.runOnGLThread(new Runnable() {
            @Override
            public void run() {
                Cocos2dxJavascriptJavaBridge.evalString(msg);
            }
        });
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Workaround in
        // https://stackoverflow.com/questions/16283079/re-launch-of-activity-on-home-button-but-only-the-first-time/16447508
        if (!isTaskRoot()) {
            // Android launched another instance of the root activity into an existing task
            // so just quietly finish and go away, dropping the user back into the activity
            // at the top of the stack (ie: the last state of this task)
            // Don't need to finish it again since it's finished in super.onCreate .
            return;
        }
        // DO OTHER INITIALIZATION BELOW
        SDKWrapper.getInstance().init(this);
        
        // Bugly
        CrashReport.initCrashReport(getApplicationContext(), "546747a831", false);
        // CrashReport.testJavaCrash();
        // init sdk
        initSdk(savedInstanceState);

        // 如果intent蕴含schema数据，解析并记录下来
        passIntent(getIntent());
    }

    private void initSdk(Bundle savedInstanceState) {
        mainInstance = MainApplication.getInstance();

        mainInstance.initSdk(this, this);
    }

    @Override
    public Cocos2dxGLSurfaceView onCreateView() {
        Cocos2dxGLSurfaceView glSurfaceView = new Cocos2dxGLSurfaceView(this);
        // TestCpp should create stencil buffer
        glSurfaceView.setEGLConfigChooser(5, 6, 5, 0, 16, 8);
        SDKWrapper.getInstance().setGLSurfaceView(glSurfaceView, this);

        return glSurfaceView;
    }

    @Override
    public void onChangeAccountResult(String arg0) {
        Log.d(TAG,"onChangeAccountResult:"+arg0);
        //切换帐号回调，此接口会返回已经账户信息
        this.runOnGLThread(new Runnable() {
            @Override
            public void run() {
                Cocos2dxJavascriptJavaBridge.evalString(String.format(
                        "if (window.NotifyChangeAccount) window.NotifyChangeAccount();"
                ));
            }
        });
    }

    @Override
    public void onInitComplete(String arg0) {
        Log.d(TAG,"onInitComplete:"+arg0);
        try {
            JSONObject json = new JSONObject(arg0);
            int code = json.optInt("code");
            String msg = json.optString("msg");
            sdkStatus = code;
        } catch (JSONException e) {
            sdkStatus = ZQCode.CODE_INIT_FAIL;
        }

        this.runOnGLThread(new Runnable() {
            @Override
            public void run() {
                Cocos2dxJavascriptJavaBridge.evalString(String.format(
                        "if (window.NotifyInitComplete) window.NotifyInitComplete('%b');", sdkStatus == ZQCode.CODE_INIT_SUCCESS
                ));
            }
        });
    }

    @Override
    public void onLoginResult(String arg0) {
        Log.d(TAG,"onLoginResult:"+arg0);
        try {
            JSONObject json = new JSONObject(arg0);
            String ext = json.optString("Ext");
            String status = new JSONObject(ext).getString("status");
            if(String.valueOf(ZQCode.CODE_LOGIN_SUCCESS).equals(status)){
                //登录成功
                final String UserId = json.optString("UserId");
                final String SessionId = json.optString("SessionId");
                final boolean Succ = true;
                // 获取平台Id
                platfromId = mainInstance.getPlatformId();
                //获取到这些数据后，请发送给游戏服，由游戏服去sdk服验证登录状态
                //这数据都不一定有，但userid和session中肯定有一个非空
                this.runOnGLThread(new Runnable() {
                    @Override
                    public void run() {
                        Cocos2dxJavascriptJavaBridge.evalString(String.format(
                                "if (window.NotifyLogin) window.NotifyLogin('%b', '%s', '%s', '%s');", Succ, UserId, SessionId, platfromId
                        ));
                    }
                });
            }else{
                //登录失败
                 this.runOnGLThread(new Runnable() {
                    @Override
                    public void run() {
                        Cocos2dxJavascriptJavaBridge.evalString(String.format(
                                "if (window.NotifyLogin) window.NotifyLogin('%b');", false
                        ));
                    }
                });
            }
        } catch (JSONException e) {
        }
    }

    @Override
    public void onLogoutResult(String arg0) {
        // TODO Auto-generated method stub
        Log.d(TAG,"onLogoutResult:"+arg0);
        //注销、登出回调，此处只会返回一个状态码，收到此回调，请cp实现：返回登录界面--重新登录的操作
        this.runOnGLThread(new Runnable() {
            @Override
            public void run() {
                Cocos2dxJavascriptJavaBridge.evalString(String.format(
                        "if (window.NotifyLogout) window.NotifyLogout();"
                ));
            }
        });
    }

    @Override
    public void onPayResult(String arg0) {
        // TODO Auto-generated method stub
        Log.d(TAG,"onPayResult:"+arg0);
        //支付回调，
        this.runOnGLThread(new Runnable() {
            @Override
            public void run() {
                Cocos2dxJavascriptJavaBridge.evalString(String.format(
                        "if (window.NotifyPaySucc) window.NotifyPaySucc();"
                ));
            }
        });
    }

     @Override
    public void onExitAppResult() {
        //退出框回调
        mainInstance.destroyToolBar();
        finish();
    }

    @Override
    public void onResult(String result) {
        Log.d(TAG,"onResult:"+result);
        try {
            JSONObject json  = new JSONObject(result);
            int code = json.optInt("code");
            if(code==29){//已实名，并返回年龄
                age = json.optString("msg");
                evalClientMsg(String.format(
                    "if (window.NotifyAuth) window.NotifyAuth('%b');", true
                ));
            }else if(code==30){
                //未实名或实名失败，msg会返回-1
                age = "0";
                evalClientMsg(String.format(
                    "if (window.NotifyAuth) window.NotifyAuth('%b');", false
                ));
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    @Override
    protected void onStart() {
        SDKWrapper.getInstance().onStart();
        super.onStart();
        mainInstance.onStart();
    }

    @Override
    protected void onRestart() {
        super.onRestart();
        SDKWrapper.getInstance().onRestart();
        mainInstance.onRestart();
    }

    @Override
    protected void onResume() {
        super.onResume();
        SDKWrapper.getInstance().onResume();
        mainInstance.onResume();
    }

    @Override
    protected void onPause() {
        super.onPause();
        SDKWrapper.getInstance().onPause();
        mainInstance.onPause();
    }

    @Override
    protected void onStop() {
        super.onStop();
        SDKWrapper.getInstance().onStop();
        mainInstance.onStop();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();

        // Workaround in https://stackoverflow.com/questions/16283079/re-launch-of-activity-on-home-button-but-only-the-first-time/16447508
        if (!isTaskRoot()) {
            return;
        }

        SDKWrapper.getInstance().onDestroy();
        mainInstance.onDestroy();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        SDKWrapper.getInstance().onNewIntent(intent);
        mainInstance.onNewIntent(intent);
        passIntent(intent);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        SDKWrapper.getInstance().onActivityResult(requestCode, resultCode, data);
        mainInstance.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        SDKWrapper.getInstance().onSaveInstanceState(outState);
        super.onSaveInstanceState(outState);
        mainInstance.onSaveInstanceState(outState);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        mainInstance.onRequestPermissionsResult(requestCode,permissions,grantResults);
    }

    @Override
    public void onBackPressed() {
        SDKWrapper.getInstance().onBackPressed();
//        super.onBackPressed();
        mainInstance.getSdkInstance().onKeyBack();
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getKeyCode() == KeyEvent.KEYCODE_BACK) {
            if (event.getAction() == KeyEvent.ACTION_UP) {
                onBackPressed();
            }
            return true;
        }
        return super.dispatchKeyEvent(event);
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        SDKWrapper.getInstance().onConfigurationChanged(newConfig);
        super.onConfigurationChanged(newConfig);
    }

    @Override
    protected void onRestoreInstanceState(Bundle savedInstanceState) {
        SDKWrapper.getInstance().onRestoreInstanceState(savedInstanceState);
        super.onRestoreInstanceState(savedInstanceState);
    }
}
