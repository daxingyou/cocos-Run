/*
 * @Author: xuyang
 * @Date: 2021-05-20 10:36:36
 * @FilePath: \RunX\assets\scripts\mvp\models\MailData.ts
 */
import { utils } from "../../app/AppUtils";
import { configUtils } from "../../app/ConfigUtils";
import { data } from "../../network/lib/protocol";
import BaseModel from "./BaseModel";

class MailData extends BaseModel {
    private _mailData: { [k: string]: data.IMailItem } = {};

    init() {
        this._mailData = {};
    }

    deInit() {
        this._mailData = {};
    }

    initMailData(data: data.IMailData) {
        let rawData;
        if (mailData != null) {
            rawData = data.Items;
            this._mailData = {};
            for (let key in rawData) {
                let _mail = rawData[key];
                let seq = _mail.Seq ? utils.longToNumber(_mail.Seq) : 0;
                this._mailData[seq.toString()] = _mail;
            }
        }
    }

    getMailData() {
        return this._mailData;
    }

    //清理部分邮件
    clearMailData(seqs: any[]) {
        for (let i = 0; i < seqs.length; i++) {
            let seq = utils.longToNumber(seqs[i]);
            for (let key in this._mailData) {
                let ele = this._mailData[key];
                let num = utils.longToNumber(ele.Seq);
                if (num == seq) {
                    delete this._mailData[ele.Seq];
                }
            }
        }
    }
    //设置邮件的已读状态
    setMailRead(seq: any) {
        let seqNum = utils.longToNumber(seq);
        for (let key in this._mailData) {
            let _mail = this._mailData[key];
            if (utils.longToNumber(_mail.Seq) == seqNum) {
                this._mailData[key].Readed = true;
                break;
            }
        }
    }
    //设置邮件的领取状态
    setMailToken(item: data.IMailItem) {
        let seq = utils.longToNumber(item.Seq);
        for (let key in this._mailData) {
            let ele = this._mailData[key];
            let num = utils.longToNumber(ele.Seq);
            if (num == seq) {
                this._mailData[key].TakenOut = true;
                break;
            }
        }
    }

    //一键领取后邮件数据更新
    updateTokenMail(items: data.IMailItem[]) {
        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            this.setMailToken(item);
        }
    }

    //添加邮件置顶
    addMail(mail: data.IMailItem) {
        let seq = mail.Seq ? utils.longToNumber(mail.Seq) : 0;
        if (!this._mailData.hasOwnProperty(seq))
            this._mailData[seq.toString()] = mail;
    }

    //提取物品信息
    extractItemInfo(mails: data.IMailItem[]): data.IItemInfo[] {
        let itemList: data.IItemInfo[] = [];
        if (!mails || mails.length == 0) return itemList;
        mails.forEach(item => {
            if(!item.Prizes || item.Prizes.length == 0) return;
            itemList.splice(itemList.length, 0, ...item.Prizes);
        })
        //按照ID归并,可合并的道具合并，不可合并的道具采用数组存储对应的数量
        let idMap = new Map<number, number>();

        itemList.forEach(item => {
            let oldV = idMap.has(item.ID) ? (idMap.get(item.ID) as number): 0;
            idMap.set(item.ID, oldV + utils.longToNumber(item.Count));
        });

        //重构物品信息
        itemList.length = 0;
        idMap.forEach((v, k) => {
            if(v <= 0) return;
            let equipCfg = configUtils.getEquipConfig(k);
            if(equipCfg){
                itemList.push(...(new Array(v).fill({ID: k, Count: 1})));
                return;
            }

            itemList.push({ID: k, Count: v});
        })
        return itemList;
    }
}

let mailData = new MailData();
export { mailData }