/*
 * @Author:xuyang
 * @Date: 2021-05-18 19:33:46
 * @Description: 背包操作类
 */
import { bagDataUtils } from "../../app/BagDataUtils";
import { eventCenter } from "../../common/event/EventCenter";
import { bagDataEvent, commonEvent, heroViewEvent } from "../../common/event/EventData";
import { redDotMgr, RED_DOT_MODULE } from "../../common/RedDotManager";
import { data, gamesvr } from "../../network/lib/protocol";
import { operationSvr } from "../../network/OperationSvr";
import { bagData } from "../models/BagData";
import { taskData, TASK_FINISH_TYPE } from "../models/TaskData";
import { userData } from "../models/UserData";
import { BaseOpt } from "./BaseOpt";

class BagDataOpt extends BaseOpt {
    init() {
        this.registerAllEvent();
    }

    registerAllEvent() {
        this.addEventListener(gamesvr.CMD.ITEM_CHANGE_NOTIFY, this._onItemChangeNotify);
        this.addEventListener(gamesvr.CMD.USE_ITEM_RES, this._onItemUse);
        this.addEventListener(gamesvr.CMD.ENHANCE_EQUIPMENT_RES, this._onEquipEnhanced);
        this.addEventListener(gamesvr.CMD.BREAK_EQUIPMENT_RES, this._onEquipBroke);
        this.addEventListener(gamesvr.CMD.HERO_EQUIP_RES, this._onEquip);
        this.addEventListener(gamesvr.CMD.HERO_UNEQUIP_RES, this._onUnEquip);
        this.addEventListener(gamesvr.CMD.ONCE_EQUIP_RES, this._onOnceEquip);
        this.addEventListener(gamesvr.CMD.ONCE_UNEQUIP_RES, this._onOnceUnEquip);
        this.addEventListener(gamesvr.CMD.ADD_HERO_STAR_RES, this._onAddHeroStar);
        this.addEventListener(gamesvr.CMD.COMPOSE_HERO_RES, this._onCompoundHero);
        this.addEventListener(gamesvr.CMD.GAIN_GIFT_RES, this._onGainGift);
        this.addEventListener(gamesvr.CMD.SELECT_GIFT_SKILL_RES, this._onSelectGiftSkill);
        this.addEventListener(gamesvr.CMD.HERO_POWER_NOTIFY, this._onHeroPowerChange);
        this.addEventListener(gamesvr.CMD.CAST_SOUL_FOUND_EQUIPMENT_RES, this._onEquipCastSoulRes);
        this.addEventListener(gamesvr.CMD.CAST_SOUL_CHOOSE_EQUIPMENT_RES, this._onEquipCastSoulChooseRes);
        this.addEventListener(gamesvr.CMD.SMELT_REFINE_RES, this._onSmeltRefineRes);
        this.addEventListener(gamesvr.CMD.ITEM_REPLACE_NOTIFY, this._onItemReplaceRes);
        // 装备还原、分解
        this.addEventListener(gamesvr.CMD.RESOLVE_EQUIPMENT_RES, this._onEquipSplitRes);
        this.addEventListener(gamesvr.CMD.DECLINE_EQUIPMENT_RES, this._onEquipRevertRes);
        
        this.addEventListener(gamesvr.CMD.ENHANCE_TOTAL_EQUIPMENT_RES, this._onEnhanceTotalEquipmentRes);
    }

    //宝物满级后替换其他道具
    private _onItemReplaceRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.IItemReplaceNotify }){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
    }

    private _onItemChangeNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ItemChangeNotify }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;

        let hasFinishedTasks = taskData.checkNewFinishedTask();

        bagData.updateBagData(msg.Units);
        taskData.setTargetTypeDirty(TASK_FINISH_TYPE.HERO_STAR);
        eventCenter.fire(bagDataEvent.ITEM_CHANGE, msg);

        // 新任务检测
        let newFinishedTask = taskData.checkNewFinishedTask();
        newFinishedTask = newFinishedTask.filter(ele => {
            return hasFinishedTasks.indexOf(ele) == -1;
        });

        if (newFinishedTask && newFinishedTask.length) {
            eventCenter.fire(commonEvent.NEW_TASK_FINISHED, newFinishedTask);
        }
    }

    private _onEquipEnhanced(recvMsg: { Result: number, Desc: string, Msg: gamesvr.EnhanceEquipmentRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        // TODO 更新model数据
        eventCenter.fire(bagDataEvent.EQUIP_ENHANCED, msg);
    }

    private _onEquip(recvMsg: { Result: number, Desc: string, Msg: gamesvr.HeroEquipRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        eventCenter.fire(heroViewEvent.HERO_DRESS_EQUIP, recvMsg.Msg);
    }

    private _onUnEquip(recvMsg: { Result: number, Desc: string, Msg: gamesvr.HeroUnequipRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        eventCenter.fire(heroViewEvent.HERO_UNDRESS_EQUIP, recvMsg.Msg);
    }

    private _onOnceEquip(recvMsg: { Result: number, Desc: string, Msg: gamesvr.OnceEquipRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        eventCenter.fire(heroViewEvent.HERO_ONCE_DRESS_EQUIP, recvMsg.Msg);
    }

    private _onOnceUnEquip(recvMsg: { Result: number, Desc: string, Msg: gamesvr.OnceUnequipRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        eventCenter.fire(heroViewEvent.HERO_ONCE_UNDRESS_EQUIP, recvMsg.Msg);
    }

    private _onAddHeroStar(recvMsg: { Result: number, Desc: string, Msg: gamesvr.AddHeroStarRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        taskData.setTargetTypeDirty(TASK_FINISH_TYPE.HERO_STAR);
        eventCenter.fire(heroViewEvent.ADD_HERO_STAR_SUC, msg);
        redDotMgr.fire(RED_DOT_MODULE.MAIN_TASK);
    }

    private _onCompoundHero(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ComposeHeroRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        eventCenter.fire(heroViewEvent.COMPOUND_HERO_SUC, msg);
        redDotMgr.fire(RED_DOT_MODULE.MAIN_TASK);
    }

    private _onItemUse(recvMsg: { Result: number, Desc: string, Msg: gamesvr.UseItemRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        let TotalExp = msg.TotalExp;
        if (msg.TotalExp) {
            userData.updateExp(msg.TotalExp);
        }
        eventCenter.fire(bagDataEvent.ITEM_USE, msg.Prizes);
    }
    private _onEquipBroke(recvMsg: { Result: number, Desc: string, Msg: gamesvr.EnhanceEquipmentRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        // TODO 更新model数据
        eventCenter.fire(bagDataEvent.EQUIP_BROKE, msg);
        redDotMgr.fire(RED_DOT_MODULE.MAIN_TASK);
        redDotMgr.fire(RED_DOT_MODULE.MAIN_BAG);
    }
    // 解锁天赋成功
    private _onGainGift(recvMsg: { Result: number, Desc: string, Msg: gamesvr.GainGiftRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        bagData.updateHeroGift(msg.HeroID, msg.GiftID, msg.SkillID);
        eventCenter.fire(heroViewEvent.GAIN_GIFT, msg);
    }

    // 更换天赋技能成功
    private _onSelectGiftSkill(recvMsg: { Result: number, Desc: string, Msg: gamesvr.SelectGiftSkillRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        } 
        let msg = recvMsg.Msg;
        bagData.updateHeroGift(msg.HeroID, msg.GiftID, msg.SkillID);
        eventCenter.fire(heroViewEvent.SELECT_GIFT_SKILL, msg);
    }

    // 铸魂
    private _onEquipCastSoulRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.CastSoulFoundEquipmentRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        } 
        let msg = recvMsg.Msg;
        bagData.updateEquipUnit(msg.ID, msg.Seq, msg.CastSoulPoolMap);
        eventCenter.fire(bagDataEvent.EQUIP_CAST_SOUL);
    }

    // 铸魂选择
    private _onEquipCastSoulChooseRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.CastSoulChooseEquipmentRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        bagData.updateEquipUnit(msg.ID, msg.Seq, msg.CastSoulPoolMap, msg.CastSoulChooseMap);
        let equip = bagData.getEquipById(msg.ID, msg.Seq);
        //被穿戴的装备铸魂属性可能发生变化，需要重新计算战斗力
        if(equip && equip.equipData && bagDataUtils.checkEquipIsDressed(equip.equipData)){
            userData.updateCapability();
        }
        eventCenter.fire(bagDataEvent.EQUIP_CAST_SOUL_CHOOSE);
    }

    // 熔炼结果
    private _onSmeltRefineRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.SmeltRefineRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        eventCenter.fire(bagDataEvent.SMELT_SUCCESS, msg.Prizes);
    }

    private _onHeroPowerChange(recvMsg: { Result: number, Desc: string, Msg: gamesvr.HeroPowerNotify }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        bagData.updateHeroPower(msg);
        setTimeout(() => {
            eventCenter.fire(heroViewEvent.HERO_POWER_CHANGE, msg);
            userData.updateCapability(0, true, true);
        }, 60);
    }

    private _onEquipSplitRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ResolveEquipmentRes }){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg && msg.Prizes){
            eventCenter.fire(bagDataEvent.SPLIT_SUCCESS, msg.Prizes);
        }
    }

    private _onEquipRevertRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.DeclineEquipmentRes }){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg){
            msg.equipItem && bagData.updateBagData([msg.equipItem]);
            eventCenter.fire(bagDataEvent.ITEM_CHANGE);
            eventCenter.fire(bagDataEvent.REVERT_SUCCESS, msg.equipItem, msg.Prizes);
        }
    }

    private _onEnhanceTotalEquipmentRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.EnhanceTotalEquipmentRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        
        let msg = recvMsg.Msg;
        // 更新装备的经验
        msg.EnhanceTotalEquipmentInfoList.forEach((item) => {
            bagData.updateEquipExp(item.EquipSeq, item.EquipID, item.Exp);
        });

        eventCenter.fire(bagDataEvent.EQUIP_TOTAL_ENHANCED, msg);
    }

    public sendItemGetRequst(id: number, count: number) {
        let sendData = gamesvr.GetItemReq.create({
            ID: id,
            Count: count,
        })
        operationSvr.send(sendData);
    }

    public sendItemUseRequst(item: data.IBagUnit, selIndex?: number[]) {
        let sendData = gamesvr.UseItemReq.create({
            ID: item.ID,
            Seq: item.Seq,
            Count: item.Count,
            SelectGiftIndex: selIndex
        })
        operationSvr.send(sendData);
    }
    //装备强化
    public sendEnhanceEquipRequest(equip: data.IBagUnit, data: data.IBagUnit[]) {
        let sendData = gamesvr.EnhanceEquipmentReq.create({
            ID: equip.ID,
            Seq: equip.Seq,
            Items: data
        })
        operationSvr.send(sendData);
    }
    //装备突破
    public sendBreakEquipRequest(equip: data.IBagUnit, data: data.IBagUnit[]) {
        let sendData = gamesvr.BreakEquipmentReq.create({
            ID: equip.ID,
            Seq: equip.Seq,
            Items: data
        })
        operationSvr.send(sendData);
    }
    //装备铸魂
    public sendEquipCastSoulRequest(equip: data.IBagUnit, itemId: number) {
        let sendData = gamesvr.CastSoulFoundEquipmentReq.create({
            ID: equip.ID,
            Seq: equip.Seq,
            ItemID: itemId
        })
        operationSvr.send(sendData);
    }
    //装备铸魂 选择属性
    public sendEquipCastSoulChooseRequest(equip: data.IBagUnit, chooseMap: {[k:string]: number}) {
        let sendData = gamesvr.CastSoulChooseEquipmentReq.create({
            ID: equip.ID,
            Seq: equip.Seq,
            CastSoulChooseMap: chooseMap
        })
        operationSvr.send(sendData);
    }
    // 穿戴装备
    public sendDressEquip(heroID: number, position: number, equipSeq: number, equipId: number) {
        let sendData = gamesvr.HeroEquipReq.create({
            HeroID: heroID,
            Positon: position,
            EquipSeq: equipSeq,
            EquipID: equipId
        });
        operationSvr.send(sendData);
    }
    // 卸载装备
    public sendUnDressEquip(heroID: number, position: number) {
        let sendData = gamesvr.HeroUnequipReq.create({
            HeroID: heroID,
            Positon: position,
        });
        operationSvr.send(sendData);
    }
    // 一键穿戴
    public sendOnceDressEquip(heroId: number, result: { [k: string]: gamesvr.IEquipInfo }) {
        let sendData = gamesvr.OnceEquipReq.create({
            HeroID: heroId,
            Equips: result
        });
        operationSvr.send(sendData);
    }
    // 一键卸载
    public sendOnceUnDressEquip(heroId: number) {
        let sendData = gamesvr.OnceUnequipReq.create({
            HeroID: heroId
        });
        operationSvr.send(sendData);
    }
    // 英雄升星
    public sendAddHeroStar(heroId: number) {
        let sendData = gamesvr.AddHeroStarReq.create({
            HeroID: heroId
        });
        operationSvr.send(sendData);
    }
    // 合成英雄
    public sendCompoundHero(heroId: number) {
        let sendData = gamesvr.ComposeHeroReq.create({
            HeroID: heroId
        });
        operationSvr.send(sendData);
    }
    // 解锁天赋
    public sendGainGift(heroId: number, giftId: number, skillId: number = 0) {
        let sendData = gamesvr.GainGiftReq.create({
            HeroID: heroId,
            GiftID: giftId,
            SkillID: skillId
        });
        operationSvr.send(sendData);
    }
    // 重新选择天赋选择
    public sendSelectGiftSkill(heroId: number, giftId: number, skillId: number) {
        let sendData = gamesvr.SelectGiftSkillReq.create({
            HeroID: heroId,
            GiftID: giftId,
            SkillID: skillId
        });
        operationSvr.send(sendData);
    }
    // 熔炼选择
    public sendSmeltRequest(stove0: gamesvr.ISmeltStove, stove1: gamesvr.ISmeltStove, stove2: gamesvr.ISmeltStove) {
        let sendData = gamesvr.SmeltRefineReq.create({
            SmeltStove1: stove0,
            SmeltStove2: stove1,
            SmeltStove3: stove2
        });
        operationSvr.send(sendData);
    }
    // 装备分解
    public sendEquipSplitRequest(items: data.IBagUnit[]){
        let sendData = gamesvr.ResolveEquipmentReq.create({
           Items: items
        });
        operationSvr.send(sendData);
    }
    // 装备还原
    public sendEquipRevertRequest(id: number, seq: any) {
        let sendData = gamesvr.DeclineEquipmentReq.create({
            Seq: seq,
            ID: id
        });
        operationSvr.send(sendData);
    }
    
    /**
     * 发送一键强化请求
     * @param heroID 英雄ID
     * @param enhanceTotalEquipmentInfoList 装备强化信息数组
     */
    sendEnhanceTotalEquipmentRequest(heroID: number, enhanceTotalEquipmentInfoList: gamesvr.EnhanceTotalEquipmentInfo[]) {
        let sendData = gamesvr.EnhanceTotalEquipmentReq.create({
            HeroID: heroID,
            EnhanceTotalEquipmentInfoList: enhanceTotalEquipmentInfoList
        });

        operationSvr.send(sendData);
    }
}

let bagDataOpt = new BagDataOpt();
export { bagDataOpt }