
import ItemStone from "../view-item/ItemStone";
import ItemTrapSprike from "../view-item/ItemTrapSprike";
import { IParkourItemPool } from "./ItemPoolManager";
import { ItemNames, Item_Prefab_Path } from "./ParkourConst";
import TrapBase from "./TrapBase";

/*
 * @Description: 道具内存池的配置
 * @Autor: lixu
 * @Date: 2021-06-05 17:49:34
 * @LastEditors: lixu
 * @LastEditTime: 2021-11-18 11:40:21
 */
const parkourItemConfig: IParkourItemPool[] = [
    //金币
    {
        comp: ItemNames.COIN,
        prefabPath: `${Item_Prefab_Path}${ItemNames.COIN}`,
    },
    //中等金币
    {
        comp: ItemNames.MID_COIN,
        prefabPath: `${Item_Prefab_Path}${ItemNames.MID_COIN}`,
    },
    //大金币
    {
        comp: ItemNames.LARGE_COIN,
        prefabPath: `${Item_Prefab_Path}${ItemNames.LARGE_COIN}`,
    },
    // 回复道具
    {
        comp: ItemNames.BLOOD,
        prefabPath: `${Item_Prefab_Path}${ItemNames.BLOOD}`,
    },
    //钻石
    {
        comp: ItemNames.DIAMOND,
        prefabPath: `${Item_Prefab_Path}${ItemNames.DIAMOND}`,
    },
    //强化
    {
        comp: ItemNames.STRONG,
        prefabPath: `${Item_Prefab_Path}${ItemNames.STRONG}`,
    },
    //冲刺道具
    {
        comp: ItemNames.CHONG_CI,
        prefabPath: `${Item_Prefab_Path}${ItemNames.CHONG_CI}`,
    },
    //石头道具
    {
        comp: ItemNames.STONE,
        prefabPath: `${Item_Prefab_Path}${ItemNames.STONE}`,
    },
    //突刺陷阱道具
    {
        comp: ItemNames.SPRIKE,
        prefabPath: `${Item_Prefab_Path}${ItemNames.SPRIKE}`,
    },
     //天火陷阱
    {
        comp: ItemNames.FIRE,
        prefabPath: `${Item_Prefab_Path}${ItemNames.FIRE}`,
    },
    //炸弹陷阱
    {
        comp: ItemNames.BOMB,
        prefabPath: `${Item_Prefab_Path}${ItemNames.BOMB}`,
    }
];

let getParkourItemCfgByPath = function (path: string): IParkourItemPool {
    if(!path || path.length === 0) return null;
    return parkourItemConfig.find((ele, idx) => {
        return ele.prefabPath === path;
    });
}

let getParkourItemCfgByName = function (name: string): IParkourItemPool {
  if(!name || name.length === 0) return null;
  return parkourItemConfig.find((ele, idx) => {
      return ele.comp === name;
  });
}

//突刺陷阱spine资源样式，与跑酷地形的皮肤对应
const parkourTrapSprikeCfg = {
    1 : 'bingchuan_1',
    2 : 'yiji_1',
    3 : 'yiji_1',
    4 : 'pingyuan_1',
    5 : 'pingyuan_1'

}

export{
    parkourItemConfig,
    parkourTrapSprikeCfg,
    getParkourItemCfgByPath,
    getParkourItemCfgByName
}
