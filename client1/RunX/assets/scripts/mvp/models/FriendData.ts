import { data } from "../../network/lib/protocol";
import BaseModel from "./BaseModel";

class FriendData extends BaseModel {

    private _friendData: data.IFriendData = null;

    init (){

    }

    deInit(): void {
        
    }
    
    initFriendData (data: data.IFriendData) {
        this._friendData = data;
    }

    get friendData () {
        return this._friendData;
    }

    addBlockList(user: data.IOtherData) {
        let find = this._friendData.BlockedList.filter(_info => { return _info.UserID == user; });
        if (find.length == 0)
            this._friendData.BlockedList.push(user);
    }

    removeBlockList(userid: string) {
        let ids = this._friendData.BlockedList.map(_info => { return _info.UserID });
        let index = ids.indexOf(userid);
        if (index != -1) {
            this._friendData.BlockedList.splice(index, 1);
        }
    }
}

let friendData = new FriendData();
export { friendData }