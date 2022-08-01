import { ResultData, RoleTimer, TeamData } from "./CSInterface"

let csCmd = {
    // req/res
    REQ_BATTLE_READY:               "ReqBattleReady",
    REQ_ACTION_FINISH:              "ReqActionFinish",

    // Notify
    EFFECT_RESULT_NOTIFY:           "EffectResultNotify",
    ASYNC_BATTLE_BASE_NOTIFY:       "AsyncBattleBaseNotify",
    BATTLE_START_NOTIFY:            "BattleStartNotify",
    ROUND_START_NOTIFY:             "RoundStartNotify",
    CHANGE_IDLE_STATE_NOTIFY:       "ChangeIdleStateNotify",
    BATTLE_END_NOTIFY:              "BattleEndNotify",
    UPDTAE_TIMER_NOTIFY:            "UpdaeTimerNotify",
}

interface ReqBattleReady {
    heroList: number[],
    enemyList: number[],
}

interface ReqActionFinish {
}

interface EffectResultNotify {
    Results: ResultData[]
}

interface AsyncBattleBaseNotify {
    teamData: TeamData[]
}

interface BattleStartNotify {
    timer: RoleTimer[]
}

interface RoundStartNotify {
}

interface ChangeIdleStateNotify {
}

interface BattleEndNotify {
}

interface UpdateTimerNotify {
    timer: RoleTimer[]
}

export {
    // 命令字
    csCmd,

    // 返回数据
    ReqBattleReady,
    ReqActionFinish,
    EffectResultNotify,
    AsyncBattleBaseNotify,
    BattleStartNotify,
    UpdateTimerNotify,
    RoundStartNotify,
    ChangeIdleStateNotify,
    BattleEndNotify,
}