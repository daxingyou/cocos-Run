import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";

/*
 * @Description:
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-10-28 12:26:47
 * @LastEditors: lixu
 * @LastEditTime: 2021-10-29 11:51:22
 */
const {ccclass, property} = cc._decorator;

let GetItemAnimTYpe = cc.Enum ({
    BACK: 0,
    FRONT: 1,

});

@ccclass
export default class GetSSRPVItem extends cc.Component {

    @property(sp.Skeleton) sp: sp.Skeleton = null;
    @property(cc.Boolean) isFront: boolean = false;

    private _spLoader: SpriteLoader = null;
    private _attachNode: cc.Node = null;

    onInit(imageUrl: string){
        if(this.isFront) return null;
        if(!imageUrl) return null;
        this._spLoader = this._spLoader || new SpriteLoader();
        if(!cc.isValid(this._attachNode)){
            this._attachNode = new cc.Node();
            let spComp = this._attachNode.addComponent(cc.Sprite);
            spComp.type = cc.Sprite.Type.SIMPLE;
            spComp.sizeMode = cc.Sprite.SizeMode.RAW;
            spComp.trim = false;
        }
        return this._spLoader.changeSpriteP(this._attachNode.getComponent(cc.Sprite), imageUrl);
    }

    deInit(){
        this.sp.clearTracks();
        this.sp.setCompleteListener(()=>{})
        if(cc.isValid(this._attachNode)){
          this._spLoader.deleteSprite(this._attachNode.getComponent(cc.Sprite));
          this._attachNode.removeFromParent();
        }
    }

    onRelease(){
        this.deInit();
        this._spLoader && this._spLoader.release();
        this._spLoader = null;
        cc.isValid(this._attachNode) && this._attachNode.destroy();
        this._attachNode = null;
        this._deInitAttachNode();
    }

    play(){
        this.sp.clearTracks();
        if(this.isFront) {
            this.sp.setCompleteListener( ()=> {
                this.sp.addAnimation(0, 'idle-A', true);
            })
            this.sp.setAnimation(0, 'start-A', false);
           
        }else{
            this._initAttachNode();
            this.sp.setCompleteListener( ()=> {
                this.sp.addAnimation(0, 'idle-B', true);
            })
            this.sp.setAnimation(0, 'start-B', false);
        }
    }

    private _initAttachNode(){
        if(this.isFront) return;
        //@ts-ignore
        let bones = this.sp.attachUtil.generateAttachedNodes('ssr');
        if(!bones || bones.length == 0) return;
        bones[0].addChild(this._attachNode);
    }

    private _deInitAttachNode(){
        if(this.isFront) return;
        //@ts-ignore
        let bones = this.sp.attachUtil.generateAttachedNodes('ssr');
        if(!bones || bones.length == 0) return;
        //@ts-ignore
        this.sp.attachUtil.destroyAttachedNodes('ssr');

    }
}
