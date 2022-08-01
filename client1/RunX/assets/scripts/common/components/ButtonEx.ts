import { appCfg } from "../../app/AppConfig";
import { GLOBAL_CLICK_INTERVAL } from "../../app/AppConst";
import { audioManager, SFX_TYPE } from "../AudioManager";
import { logger } from "../log/Logger";
import ListItem from "./ListItem";

const {ccclass, property, menu} = cc._decorator;

/**
 * ButtonClick 和 ButtonAntiClick的结合
 */
 const GRAY_MATERIAL_NAME: string = 'builtin-2d-gray-sprite';
 const NORMAL_MATERIAL_NAME: string = 'builtin-2d-sprite';

@ccclass
@menu('自定义组件/ButtonEx')
export default class ButtonEx extends cc.Component {
    @property(cc.Node)
    target: cc.Node = null;
    @property({
        displayName: '是否可交互',
        'tooltip': '按钮是否可交互'
    })
    interactable: Boolean = true;

    @property({
        tooltip: '点击间隔',
        displayName: '点击间隔'
    })
    antiClickTime: number = 0.5;

    @property({
        displayName: '是否需要额外绑定展示文字',
        tooltip: '有时候DC优化，文字提示不在按钮子节点，需要额外绑定的情况'
    })
    isNeedBindBtnTips: Boolean = false;

    @property({
        displayName: '按钮提示',
        tooltip: '为了防止优化DC按钮上的提示问题是跟按钮分开的按钮提示',
        type: cc.Node,
        // @ts-ignore
        visible(){ return this.isNeedBindBtnTips; }
    }) buttonTips: cc.Node = null;

    @property({
        displayName: "按钮声音",
        tooltip: "按钮点击提示音",
        type: cc.Enum(SFX_TYPE),
    })
    clickSound: SFX_TYPE = SFX_TYPE.BUTTON_CLICK;

    private _isGray: boolean = false;
    
    onLoad() {
        let selfButton = this.node.getComponent(cc.Button);
        if (cc.isValid(selfButton) && this.antiClickTime > 0) {
            //@ts-ignore
            let _onTouchEnded = selfButton._onTouchEnded;
            if (_onTouchEnded) {
                //@ts-ignore
                selfButton._onTouchEnded = (event: any) => {
                    let curr = new Date().getTime();
                    if (curr - appCfg.globalClick > GLOBAL_CLICK_INTERVAL) {
                        appCfg.globalClick = curr
                        _onTouchEnded.call(selfButton, event);

                        if (selfButton.interactable) {
                            selfButton.interactable = false;
                            this.scheduleOnce(() => {
                                selfButton.interactable = true;
                            }, this.antiClickTime);
                        }
                    } else {
                        logger.warn(`_onTouchEnded is to fast`);
                    }
                }
            } else {
                logger.error(`_onTouchEnded is invalid. pls handle mulit click.`);
            }
        }
        this.node.on(cc.Node.EventType.TOUCH_START,this._playClip, this);
    }

    setGray(isGray: boolean) {
        if(this._isGray != isGray) {
            this._isGray = isGray;
            this._updateMaterialState();
        }
    }

    setActivity(isShow: boolean) {
        this.node.active = isShow;
        if(this.isNeedBindBtnTips) {
            this.buttonTips && (this.buttonTips.active = isShow);
        }
    }

    setButtonTipsContent(str: string, fontSize?: number, overFlow?: cc.Label.Overflow) {
        const label = this.buttonTips.getComponent(cc.Label);
        if(label) {
            label.string = `${str}`;
            if(fontSize) {
                label.fontSize = fontSize;
            }
            if(overFlow) {
                label.overflow = overFlow;
            }
        }
    }

    private _playClip() {
        //防止列表Button在滑动过程被点击
        let listItem: ListItem = this.node.getComponent(ListItem);
        if (!(listItem && listItem.listScrolling)) {
            audioManager.playSfx(SFX_TYPE.BUTTON_CLICK);
            return true;
        }
        return false;
    }

    private _updateMaterialState() {
        let target = this.target ? this.target : this.node;
        let materialName: string = '';
        if(this._isGray) {
            materialName = GRAY_MATERIAL_NAME;
        } else {
            materialName = NORMAL_MATERIAL_NAME;
        }
        let material = this._getMaterialByName(materialName);
        if(!material) {
            // @ts-ignore
            material = this._loadMaterialByName(materialName);
        }
        let spriteCmp = target.getComponent(cc.Sprite);
        if(spriteCmp) {
            spriteCmp.setMaterial(0, material);
        }

        let refreshChildrenMaterialFunc = (parent: cc.Node) => {
            this._updateRenderMaterial(parent, material);
            parent.children.forEach(_c => {
                refreshChildrenMaterialFunc(_c);
            });
        }
        refreshChildrenMaterialFunc(this.node);
        if(this.buttonTips) {
            refreshChildrenMaterialFunc(this.buttonTips);
        }
    }

    private _updateRenderMaterial(materialNode: cc.Node, material: cc.Material) {
        if(materialNode) {
            let spriteCmp = materialNode.getComponent(cc.Sprite);
            if(spriteCmp) {
                spriteCmp.setMaterial(0, material);
            }
        }
    }
    
    private _getMaterialByName(name: string) {
        let target = this.target ? this.target : this.node;
        let spriteCmp = target.getComponent(cc.Sprite);
        if(spriteCmp) {
            let materials = spriteCmp.getMaterials()
            return materials.find(_material => {
                return _material.name == name;
            });
        }
        return null;
    }

    private _loadMaterialByName(name: string) {
        return cc.assetManager.builtins.getBuiltin('material', name);
    }
}