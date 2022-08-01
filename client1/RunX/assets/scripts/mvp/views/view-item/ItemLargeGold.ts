/*
 * @Description:
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-07-20 15:35:04
 * @LastEditors: lixu
 * @LastEditTime: 2021-07-27 19:34:52
 */

import { ItemWeights } from "../view-parkour/ParkourConst";
import ItemGold from "./ItemGold";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemLargeGold extends ItemGold {
    protected getWeight(): number{
        return ItemWeights.LARGE_COIN;
    }
}
