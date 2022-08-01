
/*
 * @Description: 
 * @Autor: lixu
 * @Date: 2021-05-25 10:25:44
 * @LastEditors: lixu
 * @LastEditTime: 2021-06-21 13:27:05
 */

import BulletGroup from "./BulletGroup";
import BulletLittleGroup from './BulletLittleGroup';
import Bullet from './Bullet';
import {global} from './main';

const {ccclass, property} = cc._decorator;

@ccclass
export default class RightContainor extends cc.Component {
    @property(cc.Prefab) groupPrefab: cc.Prefab = null;
    @property(cc.Prefab) groupLittlePrefab: cc.Prefab = null;
    @property(cc.Prefab) bulletPrefab: cc.Prefab = null;

    private _currGroup: cc.Node = null;
    private _currLittleGroup: cc.Node[] = [];
    private _currBullets: Map<cc.Node, cc.Node[]> = new Map<cc.Node, cc.Node[]>();

    parseData(config: string){
        if(!config || config.length == 0){
            global.showToastMsg(`文件解析异常，内容为空`);
        }
        try{
            let currIndex = -1;
            let data = JSON.parse(config);
            this.createNewGroup(data.name, data.groupId);
            let littleGroup: [] = data.littleGroups;
            let bullets: [] = data.bullets;
            littleGroup.forEach((elem: any, idx) =>{
                let currBullets: []  = elem.bullets;
                if(!currBullets || currBullets.length == 0) return;
                let littleComp =this.createNewLittleGroup(this._currGroup.getComponent(BulletGroup)
                    , elem.name, elem.startPosx, elem.startPosy, elem.delay, elem.targetRotation);
                
                for(let i = 0, len = currBullets.length; i < len; i++){
                    currIndex += 1;
                    let bulletID = currBullets[i];
                    let bulletData: any = bullets[currIndex];
                    if(bulletID != bulletData.ID){
                        global.showToastMsg(`文件解析异常，子弹小组${elem.name}中的子弹ID和子弹序列中的子弹ID不匹配`);
                    }
                    bulletData.delay -= elem.delay;
                    bulletData.targetFollowDelay -= elem.delay;

                    bulletData.startPosx[0] -= elem.startPosx;
                    (bulletData.startPosx.length > 1) && (bulletData.startPosx[1] -= elem.startPosx);

                    bulletData.startPosy[0] -= elem.startPosy;
                    (bulletData.startPosy.length > 1) && (bulletData.startPosy[1] -= elem.startPosy);

                    bulletData.endPosx -= elem.startPosx;
                    bulletData.endPosy -= elem.startPosy;

                    bulletData.targetRotation -= elem.targetRotation;
                    this.createNewBullet(littleComp, bulletData);
                }
            });
        }catch(e){
            global.showToastMsg(e.stack);
        }
        
    }

    createNewGroup(...rest: any){
        if(this._currGroup){
            this.clear();
        }
        this._currGroup = cc.instantiate(this.groupPrefab);
        this._currGroup.getComponent(BulletGroup).init(this, ...rest);
        this.node.addChild(this._currGroup);
    }

    clear(){
        this._currGroup = null;
        this._currLittleGroup.length = 0;
        this._currBullets.clear();
        this.node.destroyAllChildren();
    }

    createNewLittleGroup(parentComp: BulletGroup, ...rest: any){
        if(!this._currGroup) return;
        let littleGroup = cc.instantiate(this.groupLittlePrefab);
        let comp = littleGroup.getComponent(BulletLittleGroup);
        comp.init(this,parentComp, false, ...rest);
        parentComp.addToGroup(littleGroup);
        this._currLittleGroup.push(littleGroup);
        return comp;
    }

    copyLittleGroup(parentComp: BulletGroup,templateNode: BulletLittleGroup, ...rest: any){
        if(!this._currGroup) return;
        if(!cc.isValid(templateNode.node)) return;
        let littleGroup = cc.instantiate(templateNode.node);
        let comp = littleGroup.getComponent(BulletLittleGroup);
        comp.init(this, parentComp, true);
        parentComp.addToGroup(littleGroup);
        this._currLittleGroup.push(littleGroup);
        littleGroup.children.forEach((ele) =>{
            if(ele.name != "bullet") return;
            let child = ele;
            let bullrtComp = child.getComponent(Bullet);
            bullrtComp.init(this, comp, true);
            if(!this._currBullets.has(littleGroup)){
                this._currBullets.set(littleGroup, []);
            }
            this._currBullets.get(littleGroup).push(child);
        });
        return comp;
    }

    copyBullet(parentComp: BulletLittleGroup, templateNode: Bullet, ...rest: any){
        if(!this._currGroup) return;
        if(!cc.isValid(templateNode.node)) return;
        let node = cc.instantiate(templateNode.node);
        let comp = node.getComponent(Bullet);
        comp.init(this, parentComp, true, ...rest);
        parentComp.addToGroup(node);
        if(!this._currBullets.has(parentComp.node))
            this._currBullets.set(parentComp.node, []);
        this._currBullets.get(parentComp.node).push(node);
    }

    drawbBackLittleGroup(littleNode: cc.Node){
        if(!cc.isValid(littleNode)) return;
        if(!this._currBullets.has(littleNode) || this._currBullets.get(littleNode).length === 0)  return;
        let bullets = this._currBullets.get(littleNode);
        bullets.forEach((node) => {
            node.active = false;
        })
    }

    drawExpandLittleGroup(littleNode: cc.Node){
        if(!cc.isValid(littleNode)) return;
        if(!this._currBullets.has(littleNode) || this._currBullets.get(littleNode).length === 0)  return;
        let bullets = this._currBullets.get(littleNode);
        bullets.forEach((node) => {
            node.active = true;
        })
    }

    createNewBullet(parentComp: BulletLittleGroup, ...rest: any){
        if(!this._currGroup) return;
        let node = cc.instantiate(this.bulletPrefab);
        let comp = node.getComponent(Bullet);
        comp.init(this, parentComp, false, ...rest);
        parentComp.addToGroup(node);
        if(!this._currBullets.has(parentComp.node))
            this._currBullets.set(parentComp.node, []);
        this._currBullets.get(parentComp.node).push(node);
    }

    delLittleGroup(littleGroup: BulletLittleGroup){
        if(littleGroup && littleGroup.isValid && cc.isValid(littleGroup.node)){
            littleGroup.playDelAnim(() =>{
                let node = littleGroup.node;
                let idx = this._currLittleGroup.indexOf(node);
                if(idx != -1){
                    if( this._currBullets.has(node)){
                        let arr = this._currBullets.get(node);
                        while(arr.length > 0){
                            let child = arr.pop();
                            child.destroy();
                        }
                        this._currBullets.delete(node);
                    }
                    this._currLittleGroup.splice(idx, 1);
                    node.destroy();
                }
            }); 
        }
    }

    delBullet(bullet: Bullet){
        if(bullet && bullet.isValid && cc.isValid(bullet.node)){
            bullet.playDelAnim(() =>{
                let node = bullet.node;
                let parentNode = node.parent;
                
                node.destroy();
                let idx = this._currLittleGroup.indexOf(parentNode);
                if(idx != -1 && this._currBullets.has(parentNode)){
                    let arr = this._currBullets.get(parentNode);
                    let index = arr.indexOf(node);
                    if(index != -1){
                        arr.splice(index, 1);
                    }
                }
            });
        }
    }

    getEmitInterval(): number{
        if(!this._currGroup){
           return;
        }
        return this._currGroup.getComponent(BulletGroup).getEmitInterval();
    }

    getConfigData(): string{
        if(!this._currGroup){
            global.showToastMsg("没有可保存的子弹组");
            return null;
        }
        let group = this._currGroup.getComponent(BulletGroup).getConfig();
        if(!group){
            global.showToastMsg("子弹组配置异常");
            return null;
        }

        if(!this._currLittleGroup || this._currLittleGroup.length == 0 || !this._currBullets || this._currBullets.size == 0){
            global.showToastMsg("当前子弹组中没有配置子弹");
            return null;
        }

        if(this._currLittleGroup.length != this._currBullets.size){
            global.showToastMsg("子弹配置异常，组缓存和子弹缓存不一致");
            return null;
        }

        let isEmpty = true;
        let idx = 0;
        let isErr = false;
        this._currBullets.forEach((elem, node) =>{
            if(!elem || elem.length == 0) return;
            if(isErr) return;
            isEmpty = false;
            group.littleGroups = group.littleGroups || [];
            let littleGroup = node.getComponent(BulletLittleGroup).getConfig();
            littleGroup.idx = idx;
            littleGroup.bullets = littleGroup.bullets || [];
            group.littleGroups.push(littleGroup);

            for(let i = 0, len = elem.length; i < len; i++){
                let bulletNode = elem[i];
                let buletData = bulletNode.getComponent(Bullet).getConfig();
                if(!buletData){
                    isErr = true;
                    break;
                }
                littleGroup.bullets.push(buletData.ID);
                buletData.startPosx[0] += littleGroup.startPosx;
                (buletData.startPosx.length > 1) && (buletData.startPosx[1] += littleGroup.startPosx);
                
                buletData.startPosy[0] += littleGroup.startPosy;
                (buletData.startPosy.length > 1) && (buletData.startPosy[1] += littleGroup.startPosy);

                buletData.endPosx += littleGroup.startPosx;
                buletData.endPosy += littleGroup.startPosy;

                buletData.delay += littleGroup.delay;
                buletData.targetFollowDelay += littleGroup.delay;

                buletData.targetRotation += littleGroup.targetRotation;
                buletData.startRotation = littleGroup.targetRotation;

                group.bullets = group.bullets || [];
                group.bullets.push(buletData);
            }
            idx += 1;
        });

        if(isEmpty){
            global.showToastMsg("子弹组中必须有子弹");
            return null;
        }

        if(isErr){
            return null;
        }
        let data = JSON.stringify(group);

        return data;
    }
}
