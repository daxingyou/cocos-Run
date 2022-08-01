/*
 * @Description: 
 * @Autor: lixu
 * @Date: 2021-05-29 15:58:58
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-17 18:24:05
 */

import { global } from "./main";
import RoleComp from './RoleComp';
import BulletManager from './BulletManager';
import EffectLayerComp from "./EffectLayerComp";
import DebugView from "./DebugView";

const {ccclass, property} = cc._decorator;

@ccclass
export default class MainController extends cc.Component {

    @property(RoleComp) roleComp: RoleComp = null;
    @property(BulletManager) bulletManager: BulletManager = null;
    @property(EffectLayerComp) effectLayer: EffectLayerComp = null;
    @property(DebugView) debugView: DebugView = null;
    @property({type: [cc.Node]}) roleArrs: cc.Node[] = [];

    onLoad(){
        this.roleComp.node.active = false;
    }

    //开始预览
    startPreview(config: any, interval: number): boolean{
        if(!config){
            global.showToastMsg('当前配置无法预览');
            return false;
        }
        this.roleComp.node.active = true;
        this.roleComp.startShoot(config, interval);
        return true;
    }

    //停止预览
    stopPreview(){
        this.roleComp.stopShoot();
    }
    
    setHeroVisible(visible: boolean){
        this.roleArrs.forEach(ele => {
            ele.active = visible;
        })
    }
}