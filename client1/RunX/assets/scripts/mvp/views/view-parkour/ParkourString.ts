import { ParkourLazyLoadMaps, ParkourLazyLoadType } from "./ParkourConst";

/*
 * @Description:
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-06-15 18:28:16
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-27 15:47:46
 */
let ParkourStrConfig = {
    NoLevelBgConfig:    '当前关卡没有背景配置',
    ItemWeight: '道具权重：',
    BulletWeight: '子弹权重：',
    MonsterWeight:  '怪物权重：',
    AllWeight:  '总权重：',
    IsHere: '在当前区域：',
    DebugParamSetting: '参数配置'
}

const lazyLoadRes: any = {};
lazyLoadRes[ParkourLazyLoadType.Sound] = {
    Warn: 'sfx/sound/get_warning'
}

lazyLoadRes[ParkourLazyLoadType.Sprite] = {

}

lazyLoadRes[ParkourLazyLoadType.AnimClip] = {
    ChongFeng: 'animClip/chongFeng',  //冲刺
    MonsterBoom: 'animClip/monsterBoom',   //怪物死亡爆炸
    RunDirt: 'animClip/runDirt',      //奔跑的灰尘
    OneJumpDirt: 'animClip/oneJumpDirt',  //一段条的灰尘
    DoubleJumpDirt: 'animClip/doubleJumpDirt',  //二段条的灰尘
    LandDirt: 'animClip/landDirt',  //落地的灰尘
}

export {
    ParkourStrConfig,
    lazyLoadRes
}
