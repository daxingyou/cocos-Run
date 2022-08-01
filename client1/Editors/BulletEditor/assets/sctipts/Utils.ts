/*
 * @Description: 
 * @Autor: lixu
 * @Date: 2021-05-25 10:16:28
 * @LastEditors: lixu
 * @LastEditTime: 2021-05-29 16:11:47
 */

const {ccclass, property} = cc._decorator;

class Utils {
    getUUID():string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }

    getRandomInBlock(block: number[]) {
        return block[0] + (block[1] - block[0]) * Math.random();
    }

    getRandomInArray<T>(arr: T[]): T {
        if (!arr || arr.length == 0) return null;

        let len = arr.length;
        return arr[Math.floor(Math.random() * len)];
    }

    deepCopy(obj: any){
        let target = null;
        if(obj instanceof Array){
            target = [];
            for(let i = 0, len = obj.length; i< len; i++){
                target[i] = this.deepCopy(obj[i]);
            }
            return target;
        }

        if(typeof obj == 'object'){
            target = {};
            for(let k in obj){
                target[k] = this.deepCopy(obj[k]);
            }
            return target;
        }
        return obj;
    }
}
let utils = new Utils();
export default utils;
