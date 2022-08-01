/*
 * @Description:
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-10-22 19:15:51
 * @LastEditors: lixu
 * @LastEditTime: 2021-10-29 16:57:00
 */

import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import {BTStatisticItem, BTStatisticItemType, BTStatisticSubItem } from "../../template/BTStatistic";
const {ccclass, property} = cc._decorator;

enum BattleStatisticDataType{
    Hurt = 1,
    AddBlood,
}

enum BattleSkillType{
    RoleDrivSkill = 1,  //角色主动技
    RolePassiveSkill,   //角色被动技
    OnlyBelong,         //专属
    Fetters,            //羁绊
    Talent,             //天赋
    EquipPassiveSkill,  //装备被动技
    Suit,               //套装
    GiftPerks,          //主角宝物，天赋被动技
}

@ccclass
class BattleStatisticDetailDataItem extends cc.Component {
    @property(cc.Label) detailLabel : cc.Label = null;
    @property(cc.Node) bgNode: cc.Node = null;;

    private _hurtDetailMap: Map<string, BTStatisticSubItem> = null;
    private _addBloodDetailMap: Map<string, BTStatisticSubItem> = null;

    deInit(){
        this._hurtDetailMap && this._hurtDetailMap.clear();
        this._hurtDetailMap = null;
        this._addBloodDetailMap && this._addBloodDetailMap.clear();
        this._addBloodDetailMap = null;
    }

    onRelease(){
        this.deInit();
    }

    showDetail(info: BTStatisticItem, roleID: number, dataType: BattleStatisticDataType, isEnemy: boolean, roundCount: number){
        if(!info) return;
        if(isEnemy){
            this.bgNode.x = -this.bgNode.width;
            this.detailLabel.node.x = -this.detailLabel.node.width;
        }
        this.node.active = true;
        this._processData(info, dataType, roundCount);
        this.detailLabel.string = this._getDesc(info, roleID, dataType, roundCount);
        //@ts-ignore
        this.detailLabel._forceUpdateRenderData();
        this.node.height = this.bgNode.height = this.detailLabel.node.height;
        this.bgNode.y = 0;
        this.detailLabel.node.y = 0;
    }

    //对统计数据进一步处理
    private _processData(info: BTStatisticItem, dataType: BattleStatisticDataType, roundCount: number){
        if(!info) return;
        if(dataType == BattleStatisticDataType.Hurt){
            this._hurtDetailMap = this._hurtDetailMap || new Map<string, BTStatisticSubItem>();
        }else{
            this._addBloodDetailMap = this._addBloodDetailMap || new Map<string, BTStatisticSubItem>();
        }
        info.detail && info.detail.forEach((ele: BTStatisticSubItem, idx) => {
            this._dealDetailInfo(ele, dataType);
        });

        let map = dataType == BattleStatisticDataType.Hurt ? this._hurtDetailMap : this._addBloodDetailMap;
        let arr : BTStatisticSubItem[] = [];
        map.forEach((ele) => {
            ele.delta /= roundCount;
            arr.push(ele);
        });
        arr.sort((a, b) => {
            return b.delta - a.delta;
        });
    }

    private _dealDetailInfo(info: BTStatisticSubItem, dataType: BattleStatisticDataType){
        if(!info) return;
        let map = dataType == BattleStatisticDataType.Hurt ? this._hurtDetailMap : this._addBloodDetailMap;
        let key = `${info.itemType}-${info.itemID}`;
        !map.has(key) && map.set(key, {itemType: info.itemType, itemID: info.itemID, delta: 0});
        let item: BTStatisticSubItem = map.get(key);
        item.delta += Math.abs(info.delta);
    }

    private _getDesc(info: BTStatisticItem, roleID: number, dataType: BattleStatisticDataType, roundCount: number): string{
        let str = '';
        str += (dataType == BattleStatisticDataType.Hurt ? '总输出：' : '施展恢复：');
        str += info.count / roundCount;
        str += '\n';
        let map = (dataType == BattleStatisticDataType.Hurt ? this._hurtDetailMap : this._addBloodDetailMap);
        map.forEach((value, key) => {
            let str1 = '';
            if(value.itemType == BTStatisticItemType.Skill){
              let skillCfg = configUtils.getSkillConfig(value.itemID, roleID);
              str1 += skillCfg.Name || value.itemID;
              str1 += this._getSkillTypeDesc(skillCfg.Type);
              let strlen = utils.strLen(str1);
              let padStr = '';
              //@ts-ignore
              padStr = padStr.padEnd(25 - strlen);
              str1 += padStr;
              str1 += value.delta;
              strlen = utils.strLen(str1);
              padStr = '';
              //@ts-ignore
              padStr = padStr.padEnd(35 - strlen);
              str1 += padStr;
              str1 += `占比${(value.delta * 100 / info.count).toFixed(2)}%`;
              str1 += '\n';
            }

            if(value.itemType == BTStatisticItemType.Buff){
              let buffCfg = configUtils.getBuffConfig(value.itemID);
              str1 += buffCfg.Name || value.itemID;
              str1 += '(BUFF)';
              let strlen = utils.strLen(str1);
              let padStr = '';
              //@ts-ignore
              padStr = padStr.padEnd(25 - strlen);
              str1 += padStr;
              str1 += value.delta;
              strlen = utils.strLen(str1);
              padStr = '';
              //@ts-ignore
              padStr = padStr.padEnd(35 - strlen);
              str1 += padStr;
              str1 += `占比${(value.delta * 100 / info.count).toFixed(2)}%`;
              str1 += '\n';
            }

            if(value.itemType == BTStatisticItemType.Halo){
              let haloCfg = configUtils.getHaloConfig(value.itemID);
              str1 += haloCfg.Name || value.itemID;
              str1 += '(光环)';
              let strlen = utils.strLen(str1);
              let padStr = '';
              //@ts-ignore
              padStr = padStr.padEnd(25 - strlen);
              str1 += padStr;
              str1 += value.delta;
              strlen = utils.strLen(str1);
              padStr = '';
              //@ts-ignore
              padStr = padStr.padEnd(35 - strlen);
              str1 += padStr;
              str1 += `占比${(value.delta * 100 / info.count).toFixed(2)}%`;
              str1 += '\n';
            }
            str += str1;
        });
        return str
    }

    private _getSkillTypeDesc(skillType: number){
        let str = null;
        switch(skillType){
            case BattleSkillType.RoleDrivSkill:
              str = '(主动技)';
              break
            case BattleSkillType.RolePassiveSkill:
              str = '(被动技)';
              break;
            case BattleSkillType.OnlyBelong:
              str = '(专属)';
              break;
            case BattleSkillType.Fetters:
              str = '(羁绊)';
              break;
            case BattleSkillType.Talent:
              str = '(天赋)';
              break;
            case BattleSkillType.EquipPassiveSkill:
              str = '(装备被动技)';
              break;
            case BattleSkillType.Suit:
              str = '(套装)';
              break;
            case BattleSkillType.GiftPerks:
              str = '(宝物/天赋被动技)';
              break;
            default:
              str = '(未知)';
        }
        return str;
    }
}

export {
    BattleStatisticDataType,
    BattleStatisticDetailDataItem
}
