/*
 * @Author: fly
 * @Date: 2021-03-16 13:57:38
 * @LastEditTime: 2021-03-16 14:21:09
 * @Description: 事件定义
 */

let _curEvtId: number = 0;
function _newEvtId() {
    _curEvtId++;
    return _curEvtId;
};

let commonEvent = {
    EVENT_TEST: _newEvtId(),
    GAME_RESUME: _newEvtId(),
    GAME_PAUSE: _newEvtId(),
}

let netEvent = {
    LOGIN_RESULT: _newEvtId(),
    NET_LOGIN_SUCC: _newEvtId(),
    NET_LOGIN_FAIL: _newEvtId(),
    NET_CLOSED: _newEvtId(),
    NET_RECONNECTED: _newEvtId(),
    NET_ERROR: _newEvtId(),
    RECV_SERVER_RES: _newEvtId(),
    FETCH_SERVER_RES: _newEvtId(),
}

//跑酷事件
let parkourEvent = {
    MAP_INIT_FINISH: _newEvtId(),   //地图初始化完成
    GO_DOWN: _newEvtId(),  //速降点击
    GO_UP: _newEvtId(),    //上跳点击
    MAP_FAST_MOVE: _newEvtId(),   //地图快速移动
    MAP_STOP_MOVE: _newEvtId(),     //地图停止移动
    MAP_NORMAL_MOVE: _newEvtId(),   //地图正常移动
    ACTOR_ENTER_FINISH: _newEvtId(),    //主角进入场景
    LEVEL_FINISH: _newEvtId(),    //通关
    UPDATE_HP: _newEvtId(),    //更新血量
    UPDTAE_ITEM: _newEvtId(),   //更新道具
    ADD_BUFF: _newEvtId(),  //增加BUFF
    REMOVE_BUFF: _newEvtId(),   //移除buff
    RELIVE: _newEvtId(),    //复活
    PRODUCT_ITEM: _newEvtId(),  //生成道具
    CAMERA_MOVE: _newEvtId(),    //相机移动
    USE_ITEM: _newEvtId(),    //使用道具
    UPDATE_LEVEL_PROGRESS: _newEvtId(), //更新关卡进度
    SHOOT: _newEvtId(), //射击
    RESET_OPERATE_TYPE: _newEvtId(),    //重置操作方式
    SHOW_RESULT: _newEvtId(),   //展示结算
    PAUSE_LOGIC: _newEvtId(),   //暂停逻辑帧
    RESUME_LOGIC: _newEvtId(),  //继续逻辑帧
    CHANGE_DEBUG_CONFIG: _newEvtId(),   //debug模式下修改配置


    OPEN_PARKOUR_POP_WINDOW: _newEvtId(),   //打开弹窗  
    CLOSE_PARKOUR_POP_WINDOW: _newEvtId(), //关闭弹窗
}

// opt -> view
let battleEvent = {
    VIEW_UPDTAE_TIMER: _newEvtId(),
    BATTLE_START: _newEvtId(),
    ROUND_START: _newEvtId(),
    CHANGE_IDLE: _newEvtId(),
    BATTLE_END: _newEvtId(),
    EFFECT_EVENT: _newEvtId(),
}
/**
 * 关卡数据事件
 */
let lvMapViewEvent = {
    REFRESH_LVMAP_VIEW: _newEvtId(),
}
/**
 * 登录事件
 */
let loginEvent = {
    SELECT_CHANNEL: _newEvtId(),
    LOGIN_SUCCESS: _newEvtId(),
    CHANGE_BIGCHANNEL: _newEvtId(),
    CHANGE_NOTICE: _newEvtId(),
}
/**
 * 用户信息界面
 */
let useInfoEvent = {
    USER_HEAD_CHANGE: _newEvtId(),
    USER_NAME_CHANGE: _newEvtId(),
}
/**
 * 英雄界面事件
 */
let heroViewEvent = {
    HERO_EVENT_TYPE: _newEvtId(),
}

export {
    commonEvent,
    netEvent,
    parkourEvent,
    battleEvent,
    lvMapViewEvent,
    loginEvent,
    useInfoEvent,
    heroViewEvent,

}

