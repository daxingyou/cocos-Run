import { ItemWeights } from "../view-parkour/ParkourConst";
import ItemGold from "./ItemGold";

/*
 * @Description:
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-07-20 15:22:50
 * @LastEditors: lixu
 * @LastEditTime: 2021-07-27 19:34:30
 */
const {ccclass, property} = cc._decorator;
@ccclass
export default class ItemMidGold extends ItemGold {
    protected getWeight(): number{
        return ItemWeights.MID_COIN;
    }
}
