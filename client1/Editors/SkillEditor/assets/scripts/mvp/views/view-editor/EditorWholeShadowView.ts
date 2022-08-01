import { ViewBaseComponent } from '../../../common/components/ViewBaseComponent';
import { store } from './store/EditorStore';
import { stateCurrSkill, stateCurrShadow, getCurrWholeShadows } from './reducers/EditorReducers';
import { StateCurrShadow } from './models/EditorConst';
import { actionAddWholeShadow, actionDeleteWholeShadow, actionSelectWhoneShadow, actionUpdateShadow } from './actions/EditorActions';
import { EffectShadowInfo, ROLE_SHADOW_TYPE } from './view-actor/CardSkill';
import UIGridView, { GridData } from '../../../common/components/UIGridView';
import EditorItemSkillEvent from './EditorItemSkillEvent';
import guiManager from '../../../common/GUIManager';
import EditorItemShadow from './EditorItemShadow';

const {ccclass, property} = cc._decorator;

@ccclass
export default class EditorWholeShadowView extends ViewBaseComponent {
    @property(cc.Node) inspectorNode: cc.Node = null
    @property(cc.EditBox) editDelay: cc.EditBox = null;
    @property(cc.EditBox) editOpacity: cc.EditBox = null;
    @property(cc.EditBox) editColor: cc.EditBox = null;
    @property(cc.Toggle) playGfx: cc.Toggle = null;
    @property(UIGridView)       gridView: UIGridView = null;
    @property(cc.Prefab)        prefabItem: cc.Prefab = null;

    private _seleShadowId: number = 0;
    onInit () {
        this._seleShadowId = store.getState().stateCurrShadow.id;
        store.subscribe(stateCurrSkill, this._onCurrSkillChange, this);
        store.subscribe(stateCurrShadow, this._onCurrShadowChange, this);
        this.show();
    }

    onRelease () {
        this.gridView.clear();
        store.unSubscribe(stateCurrSkill, this);
        store.unSubscribe(stateCurrShadow, this);
    }

    private _onCurrSkillChange () {
        this.show();
    }

    onCloseClick () {
        this.closeView();
    }

    onAddClick () {
        const info: EffectShadowInfo = {
            id: this._genID(),
            opacity: 255,
            color: 0,
            type: ROLE_SHADOW_TYPE.WHOLE
        };
        store.dispatch(actionAddWholeShadow(info));
    }

    onResetClick(){
        this._updateLeftPanel();
    }

    onSaveClick(){
        const shadows: EffectShadowInfo[] = getCurrWholeShadows(store.getState());
        if(!shadows || shadows.length === 0){
            guiManager.showTips('想干啥？ 分身列表中都没有分身项！！！')
            return;
        }
        
        let currShadow: EffectShadowInfo = null;
        shadows.some(ele => {
            if(ele.id === this._seleShadowId){
                currShadow = ele;
                return true;
            }
            return false;
        });

        if(!currShadow){
            guiManager.showTips('分身列表中没有这个东东，先创建一个在编辑！！！');
            return;
        }

        let newShadowInfo = this._genData();
        if(!newShadowInfo){
            guiManager.showTips('保存失败！！！');
            return;
        }
        store.dispatch(actionUpdateShadow(newShadowInfo));
        guiManager.showTips('保存成功');
    }

    private _genData(): EffectShadowInfo{
        if(this._seleShadowId <= 0) return null;
        
        let delay: number = parseFloat(this.editDelay.string);
        isNaN(delay) && (delay = 0);
         
        let color : number = parseInt(this.editColor.string);
        isNaN(color) && (color = 0);
        
        let opacity : number = parseInt(this.editOpacity.string);
        isNaN(opacity) && (opacity = 255);

        let shadow: EffectShadowInfo = {
            id: this._seleShadowId,
            type: ROLE_SHADOW_TYPE.WHOLE,
            color: color,
            opacity: opacity,
        };
        delay > 0 && (shadow.delay = delay);
        this.playGfx.isChecked && (shadow.isPlayGfx = true);
        return shadow;
    }

    show () {
        const shadows: EffectShadowInfo[] = getCurrWholeShadows(store.getState()) || [];
        this.gridView.init(shadows.map((v, index) => {
            return {
                key: `${v.id}`,
                data: v,
            }
        }), {
            getItem: () => {
                const node = cc.instantiate(this.prefabItem);
                return node.getComponent(EditorItemShadow);
            },
            onInit: (item: EditorItemShadow, data: GridData) => {
                item.updateData(data.data, this._onShadowItemOperCb.bind(this));
                item.select = this._seleShadowId == data.data.id;
            },
            releaseItem: (item: EditorItemSkillEvent) => {
                item.node.destroy();
            },
        });
        
        this._updateLeftPanel();
    }

    private _genID(): number{
        let shadows: EffectShadowInfo[] = getCurrWholeShadows(store.getState());
        if(!shadows || shadows.length === 0) return 1;
        
        let _id = 0;
        shadows.forEach(ele => {
            _id = Math.max(_id, ele.id);
        });
        return ++_id;
    }

    private _onCurrShadowChange(cmd: string, state: StateCurrShadow){
        this._seleShadowId = state.id;
        if(this._seleShadowId <= 0) return;
        this.show();
    }

    private _updateLeftPanel(){
        const shadows: EffectShadowInfo[] = getCurrWholeShadows(store.getState());
        if(!shadows || shadows.length === 0){
            this.inspectorNode.active = false;
            return;
        }

        let currShadow: EffectShadowInfo = null;
        shadows.some(ele => {
            if(ele.id === this._seleShadowId){
                currShadow = ele;
                return true;
            }
            return false;
        });
       
        if(!currShadow){
            this.inspectorNode.active = false;
            return;
        }

        this.inspectorNode.active = true;
        this.editOpacity.string = `${currShadow.opacity || 255}`;
        this.editColor.string = `${currShadow.color || 0}`;
        this.editDelay.string = `${currShadow.delay || 0}`;
        this.playGfx.isChecked = typeof currShadow.isPlayGfx != 'undefined' && currShadow.isPlayGfx;
    }

    private _onShadowItemOperCb(cmd: string, data: EffectShadowInfo){
        if(this._seleShadowId === data.id){
            this._seleShadowId = 0;
            store.dispatch(actionSelectWhoneShadow(this._seleShadowId));
        }
        store.dispatch(actionDeleteWholeShadow(data));
    }
}