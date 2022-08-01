/*
 * @Description: 
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-06-15 18:28:14
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-17 19:47:50
 */

import MainController from "./MainController";

const {ccclass, property} = cc._decorator;

@ccclass
export default class RoleDragable extends cc.Component {

    private _curTouchID: number = NaN;
    private _isTouch: boolean = false;
    start(){
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMoved, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnded, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    onTouchStart(event: cc.Event.EventTouch){
        if(!isNaN(this._curTouchID) || this._isTouch === true) return;
        this._curTouchID = event.getID();
        this._isTouch = true;
    }

    onTouchMoved(event: cc.Event.EventTouch){
        if(isNaN(this._curTouchID) || this._isTouch == false || this._curTouchID != event.getID()) return;
        let prePos = event.getPreviousLocation();
        let currPos = event.getLocation();
        let offset = currPos.sub(prePos);
        let isMovedBound = false;
        if(this.node.x + offset.x > (this.node.parent.width - this.node.width / 2)){
            this.node.x = this.node.parent.width - this.node.width / 2;
            isMovedBound = true;
        }
        
        if(this.node.x + offset.x < (this.node.width / 2)){
            this.node.x = this.node.width / 2;
            isMovedBound = true;
        }
        
        if(this.node.y + offset.y > (this.node.parent.height - this.node.height)){
            this.node.y = this.node.parent.height - this.node.height;
            isMovedBound = true;
        }
        
        if(this.node.y + offset.y < 0){
            this.node.y = 0;
            isMovedBound = true;
        }

        if(isMovedBound){
            return;
        }
        
        this.node.x += offset.x;
        this.node.y += offset.y;
        
        let pos: cc.Vec2 = this.node.parent.convertToWorldSpaceAR(cc.v2(this.node.x, this.node.y));
        pos.x = Math.floor(pos.x);
        pos.y = Math.floor(pos.y);
        this.node.parent.getComponent(MainController).debugView.updateHeroPos(pos);
    }

    onTouchEnded(event: cc.Event.EventTouch){
        if(isNaN(this._curTouchID) || this._isTouch == false || this._curTouchID != event.getID()) return;
        this._curTouchID = NaN;
        this._isTouch = false;
    }

    onTouchCancel(event: cc.Event.EventTouch){
        if(isNaN(this._curTouchID) || this._isTouch == false || this._curTouchID != event.getID()) return;
        this._curTouchID = NaN;
        this._isTouch = false;
    }

    onDestroy(){
        this.node.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this.onTouchMoved, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchEnded, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }
}
