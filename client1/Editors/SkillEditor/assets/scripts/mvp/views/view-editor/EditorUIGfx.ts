import { EffectGfxInfo, EffectConst, GFX_TYPE, AOE_TYPE, ANIMATION_GROUP } from "./view-actor/CardSkill";
import EditorUtils from "./EditorUtils";
import { EditorEvent, StateCurrEffect, EditorActionType } from "./models/EditorConst";
import { logger } from "../../../common/log/Logger";
import guiManager from "../../../common/GUIManager";
import { store } from "./store/EditorStore";
import EditorUIMove from "./EditorUIMove";
import EditorUIRandomAngle from "./EditorUIRandomAngle";
import { stateCurrEffect, getCurrEffectInfo } from "./reducers/EditorReducers";
import EditorUICheckbox from "./EditorUICheckbox";
import UICombox from "./components/UICombox";
import skeletonManager from "./view-actor/SkeletonManager";

const {ccclass, property} = cc._decorator;

@ccclass
export default class EditorUIGfx extends cc.Component {
    @property(UICombox)         comboxType: UICombox = null;
    @property(UICombox)         comboxAoe: UICombox = null;
    @property(UICombox)         comboxGfxFile: UICombox = null;
    @property(UICombox)         comboxGfxAnimation: UICombox = null;
    @property(UICombox)         comboxGfxSkin: UICombox = null;
    @property(cc.EditBox)       editGfxDelay: cc.EditBox = null;
    @property(cc.EditBox)       editGfxScale: cc.EditBox = null;
    @property(cc.EditBox)       editGfxOffsetX: cc.EditBox = null;
    @property(cc.EditBox)       editGfxOffsetX1: cc.EditBox = null;
    @property(cc.EditBox)       editGfxOffsetY: cc.EditBox = null;
    @property(cc.EditBox)       editGfxOffsetY1: cc.EditBox = null;
    @property(EditorUIMove)     cuveInfo: EditorUIMove = null;
    @property(EditorUIRandomAngle)      randomAngle: EditorUIRandomAngle = null;
    @property(EditorUICheckbox)         checkBehind: EditorUICheckbox = null;    
    @property(EditorUICheckbox)         flipX: EditorUICheckbox = null;    
    @property(EditorUICheckbox) randomPos: EditorUICheckbox = null;

    private _data: EffectGfxInfo = null;

    onLoad () {
        store.registerReady(this._onEditorPrepare, this);
    }

    private _checkAoe (): boolean {
        const effInfo = getCurrEffectInfo(store.getState());
        let aoe = this.comboxAoe.selected;
        if (effInfo && (effInfo.tag & ANIMATION_GROUP.TARGET)) {
            if (aoe && aoe != AOE_TYPE.NONE) {
                guiManager.showTips(`AOE类型设置，只能绑定在SOURCE上，无法绑定在TARGET上！`);
                this.comboxAoe.selected = AOE_TYPE.NONE;
                aoe = this.comboxAoe.selected;
                return false;
            }
        }
        return true;
    }

    private _onEditorPrepare () {
        this.comboxType.addItem([GFX_TYPE.NONE, GFX_TYPE.SKELETON, GFX_TYPE.COCOS_ANIMATION, GFX_TYPE.COCOS_PREFAB]);
        this.comboxType.setHandler(data => {
            this._onGfxTypeChanged(data);
            this._dispatchEvent();
        });
        this.comboxType.selected = GFX_TYPE.SKELETON;

        this.comboxGfxFile.setHandler(data => {
            this._onGfxFileChanged(data);
            this._dispatchEvent();
        });

        this.comboxGfxFile.addItem(EditorUtils.GfxSkeleton);

        this.comboxAoe.addItem([AOE_TYPE.NONE, AOE_TYPE.SOURCE, AOE_TYPE.TARGET]);
        this.comboxAoe.setHandler(data => {
            this._checkAoe();
            this._dispatchEvent();
        });

        this._registerEditBoxEvent(this.editGfxDelay, 'editGfxDelay');
        this._registerEditBoxEvent(this.editGfxOffsetX, 'editGfxOffsetX');
        this._registerEditBoxEvent(this.editGfxOffsetX1, 'editGfxOffsetX1');
        this._registerEditBoxEvent(this.editGfxOffsetY, 'editGfxOffsetY');
        this._registerEditBoxEvent(this.editGfxOffsetY1, 'editGfxOffsetY1');
        this._registerEditBoxEvent(this.editGfxScale, 'editGfxScale');

        this.randomPos.init(null, () => {
            this.editGfxOffsetX1.node.active = this.randomPos.select;
            this.editGfxOffsetY1.node.active = this.randomPos.select;
            this._dispatchEvent();
        });
        

        this.comboxGfxAnimation.setHandler(data => {
            this._dispatchEvent();
        });
        this.comboxGfxSkin.setHandler(data => {
            this._dispatchEvent();
        });

        // this.cuveInfo.node.on(EditorEvent.CUVE_CHANGED, () => {
        //     this._dispatchEvent();
        // });

        // this.randomAngle.node.on(EditorEvent.RANDOM_ANGLE_CHANGED, () => {
        //     this._dispatchEvent();
        // });

        this.checkBehind.init({}, () => {
            this._dispatchEvent();
        });
        this.flipX.init({}, () => {
            this._dispatchEvent();
        });
    }

    private _onGfxTypeChanged (data: string) {
        this.comboxGfxFile.clearAll();
        if (data == GFX_TYPE.SKELETON) {
            this.comboxGfxFile.addItem(EditorUtils.GfxSkeleton);
        } else if (data == GFX_TYPE.COCOS_ANIMATION) {
            this.comboxGfxFile.addItem(EditorUtils.GfxCocosAnimation);
        } else if (data === GFX_TYPE.COCOS_PREFAB) {
            this.comboxGfxFile.addItem(EditorUtils.GfxCocosPrefab);
        } else {
        }
    }

    private _registerEditBoxEvent (editBox: cc.EditBox, name: string) {
        const handler = new cc.Component.EventHandler();
        handler.target = this.node;
        handler.component = "EditorUIGfx";
        handler.handler = '_onTextChanged';
        handler.customEventData = name;
        editBox.textChanged.push(handler);
    }

    private _onTextChanged (editbox: cc.EditBox, customData: string) {
        this._dispatchEvent();
    }

    private _dispatchEvent () {
        const event = new cc.Event.EventCustom(EditorEvent.GFX_CHANGED, true);
        event.detail = this.data;
        this.node.dispatchEvent(event);
    }

    get data () : EffectGfxInfo {
        const type = this.comboxType.selected;
        const gfxSkeleton = this.comboxGfxFile.selected;
        const gfxAnimation = this.comboxGfxAnimation.selected;
        const gfxDelay = parseFloat(this.editGfxDelay.string);
        const gfxScale = parseFloat(this.editGfxScale.string);
        let offsetX0 = parseFloat(this.editGfxOffsetX.string);
        let offsetX1 = parseFloat(this.editGfxOffsetX1.string);
        let offsetY0 = parseFloat(this.editGfxOffsetY.string);
        let offsetY1 = parseFloat(this.editGfxOffsetY1.string);

        let isPosRandom = this.randomPos.select;

        isNaN(offsetX0) && (offsetX0 = 0);
        isNaN(offsetY0) && (offsetY0 = 0);

        isPosRandom && isNaN(offsetX1) && (offsetX1 = 0);
        isPosRandom && isNaN(offsetY1) && (offsetY1 = 0);
        
        const offsetX = isPosRandom ? Math.min(offsetX0, offsetX1) : offsetX0;
        const offsetY = isPosRandom ? Math.min(offsetY0, offsetY1) : offsetY0;

        const scopeX = Math.abs(offsetX0 - offsetX1);
        const scopeY = Math.abs(offsetY0 - offsetY1);
        
        const gfxSkin = this.comboxGfxSkin.selected;
        this._checkAoe();
        const aoe = this.comboxAoe.selected;

        if (gfxSkeleton.length < 2) {
            return null;
        }

        if (this.comboxType.selected == GFX_TYPE.NONE) {
            return null;
        }

        let ret : EffectGfxInfo = {
            delay: gfxDelay,
            skeleton: gfxSkeleton,
            animation: gfxAnimation,
            skin: gfxSkin.length > 1 ? gfxSkin : null,
            scale: gfxScale,
            offset: cc.v3(offsetX, offsetY),
            type: type,
            // cuve: this.cuveInfo.data,
            // randomAngle: this.randomAngle.data,
            aoe: aoe,
            behindJoint: this.checkBehind.select,
            flipX: this.flipX.select,
        };
      
        if(isPosRandom && (scopeX != 0 || scopeY != 0)){
            ret.offsetScope = cc.v2(scopeX, scopeY)
        }

        return ret;
    }

    clear () {
        this.data = null;
    }

    set data (data: EffectGfxInfo) {
        data = data || {skeleton: '', animation: ''};

        this.comboxType.selected = data.type || GFX_TYPE.SKELETON;
        this._onGfxTypeChanged(this.comboxType.selected);

        this.comboxAoe.selected = data.aoe ? data.aoe : AOE_TYPE.NONE;

        this.comboxGfxFile.selected = data.skeleton;
        this.comboxGfxAnimation.selected = data.animation;
        if (data.skin) {
            this.comboxGfxSkin.selected = data.skin;
        } else {
            this.comboxGfxSkin.selected = null;
        }
        this.editGfxDelay.string = (data.delay || 0) + '';
        this.editGfxScale.string = (data.scale || 1)+ '';
        
        if (data.offset) {
            this.editGfxOffsetX.string = data.offset.x + '';
            this.editGfxOffsetY.string = data.offset.y + '';
        } else {
            this.editGfxOffsetX.string = '0';
            this.editGfxOffsetY.string = '0';
        }

        if(data.offsetScope){
            this.randomPos.select = true;
            this.editGfxOffsetX1.node.active = true;
            this.editGfxOffsetY1.node.active = true;
            this.editGfxOffsetX1.string = data.offsetScope.x != 0 ? `${data.offsetScope.x + data.offset.x}` : '';
            this.editGfxOffsetY1.string = data.offsetScope.y != 0 ? `${data.offsetScope.y + data.offset.y}` : '';
        }else{
            this.randomPos.select = false;
            this.editGfxOffsetX1.node.active = false;
            this.editGfxOffsetY1.node.active = false;
        }

        // this.cuveInfo.data = data.cuve;
        // this.randomAngle.data = data.randomAngle;

        this.checkBehind.select = data.behindJoint ? true : false;

        this._data = data;
        if (!this._checkAoe()) {
            this._dispatchEvent();
        }

        this._onGfxFileChanged(data.skeleton);
    }

    private _onSkeletonFileChanged (data: string) {
        const skeletonData = skeletonManager.loadSkeletonData(data);
        skeletonData.then(ret => {
            const animations = skeletonManager.parseAnimations(ret).map(el => el.name);
            this.comboxGfxAnimation.clearAll();
            this.comboxGfxAnimation.addItem(animations);
            if (this._data) {
                this.comboxGfxAnimation.selected = this._data.animation;
            }

            // 皮肤
            const skins = skeletonManager.parseSkin(ret);
            this.comboxGfxSkin.clearAll();
            this.comboxGfxSkin.addItem(skins);
            if (this._data) {
                this.comboxGfxSkin.selected = this._data.skin;
                // this._data = null;
            }
        }).catch(() => {
            console.log(`load skeleton file ${data} failed.`);
        })
    }

    private _onCocosAnimationFileChanged (data: string) {
        cc.loader.loadRes(data, cc.Prefab, (err, res) => {
            if (err) {
                logger.error('Editor', `Can not load cocos Animation for path = ${data}`);
            } else {
                let node: cc.Node = cc.instantiate(res);
                const anim: cc.Animation = node.getComponent(cc.Animation);
                if (!anim) {
                    logger.error('Editor', `Can not find animation component for prefab = ${data}`);
                    return;
                }

                const anims = anim.getClips();
                this.comboxGfxAnimation.clearAll();
                this.comboxGfxAnimation.addItem(anims.map(el => {
                    return el.name;
                }));

                if (this._data) {
                    this.comboxGfxAnimation.selected = this._data.animation;
                }
            }
        });
    }

    private _onCocosPrefabFileChanged (data: string) {
        this.comboxGfxAnimation.clearAll();
    }

    private _onGfxFileChanged (data: string) {
        if (data && data.length > 0) {
            switch (this.comboxType.selected) {
                case GFX_TYPE.SKELETON: this._onSkeletonFileChanged(data); break;
                case GFX_TYPE.COCOS_ANIMATION: this._onCocosAnimationFileChanged(data); break;
                case GFX_TYPE.COCOS_PREFAB: this._onCocosPrefabFileChanged(data); break;
                default: break;
            }
        }
    }
}
