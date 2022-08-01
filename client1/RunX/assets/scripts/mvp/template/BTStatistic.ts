/*
 * @Description:
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-10-20 14:32:55
 * @LastEditors: lixu
 * @LastEditTime: 2021-10-22 17:24:04
 */
/**
 * 统计项类型
 */
enum  BTStatisticItemType{
    None = 0,
    Skill = 1,        //技能
    Buff,             //buff
    Halo              //光环
}

/**
 * 统计项
 */
interface BTStatisticSubItem{
    itemType : BTStatisticItemType,  //类型
    itemID: number,   //类型id
    delta: number     //具体数值
}

/**
 * 通用统计
 */
interface BTStatisticItem{
    count: number,  //总量
    detail?: BTStatisticSubItem[],
}

interface BTKillStatisticSubItem extends BTStatisticSubItem{
    beKillID: number
}

/**
 * 击杀统计
 */
interface BTKillStatisticItem{
    count: number,
    detail?: BTKillStatisticSubItem[],
}


export {
    BTStatisticItemType,
    BTStatisticSubItem,
    BTKillStatisticSubItem,
    BTStatisticItem,
    BTKillStatisticItem
}
