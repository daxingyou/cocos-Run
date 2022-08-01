import RightContainor from './RightContainor';
import {global} from './main';
import { BULLET_ATTACH_TYPE,
    BULLET_TARGET_POS_TYPE,
    BULLET_ROTATION_TYPE,
    BulletEntity,
    BulletGroupEntity} from './BulletGroupEntity';
/*
 * @Description: 
 * @Autor: lixu
 * @Date: 2021-05-25 11:02:12
 * @LastEditors: lixu
 * @LastEditTime: 2021-05-29 16:47:01
 */
const {ccclass, property} = cc._decorator;

@ccclass
export default class BulletGroup extends cc.Component {
    @property(cc.EditBox) groupName: cc.EditBox = null;
    @property(cc.Button) add: cc.Button = null;
    @property(cc.EditBox) groupID: cc.EditBox = null;
    @property(cc.EditBox) delay: cc.EditBox = null;
    @property(cc.ScrollView) containor: cc.ScrollView = null;

    private controller: RightContainor = null;

    init(controller: RightContainor, ...params: any){
        this.controller = controller;
        this.initUI(...params);
    }

    private initUI(...rest: any){
        if(!rest && rest.length == 0) return;
        let groupName = rest[0];
        let groupID = rest[1];
        groupName &&  (this.groupName.string = groupName);
        groupID && (this.groupID.string = groupID);
    }

    onClickAdd(){
        this.controller && this.controller.createNewLittleGroup(this);
    }

    addToGroup(node: cc.Node){
        if(!cc.isValid(node)) return;
        this.containor.content.addChild(node);
    }

    getEmitInterval(){
        let interval = parseInt(this.delay.string);
        interval = isNaN(interval) ? 200 : interval;
        return interval / 1000;
    }

    getConfig(): BulletGroupEntity{
        let ID = this.groupID.string;
        if(!ID || ID.length == 0){
            global.toastLayer.showToast("子弹组ID为空");
            return null;
        }
        let name = this.groupName.string;
        return {name: name,
                groupId: parseInt(ID), 
                littleGroups: null, 
                bullets: null};
    }
}
