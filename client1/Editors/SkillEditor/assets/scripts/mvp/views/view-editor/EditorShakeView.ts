import { ViewBaseComponent } from '../../../common/components/ViewBaseComponent';
import { store } from './store/EditorStore';
import { stateCurrSkill, getCurrShakeInfo, stateCurrEffect, stateCurrShake } from './reducers/EditorReducers';
import { StateCurrShake } from './models/EditorConst';
import {  actionAddShakeEventInfo, actionDeleteShake, actionSelectShake, actionUpdateShake } from './actions/EditorActions';
import { ShakeInfo, SHAKE_REDUCT_TYPE } from './view-actor/CardSkill';
import UIGridView, { GridData } from '../../../common/components/UIGridView';
import EditorItemSkillEvent from './EditorItemSkillEvent';
import EditorItemShake from './EditorItemShake';
import guiManager from '../../../common/GUIManager';
import UICombox from './components/UICombox';
import EditorUtils from './EditorUtils';

const {ccclass, property} = cc._decorator;

@ccclass
export default class EditorShakeView extends ViewBaseComponent {
    @property(cc.Node) inspectorNode: cc.Node = null
    @property(cc.EditBox) editDuration: cc.EditBox = null;
    @property(cc.EditBox) editTimes: cc.EditBox = null;
    @property(cc.EditBox) editOriPosX: cc.EditBox = null;
    @property(cc.EditBox) editOriPosY: cc.EditBox = null;
    @property(cc.EditBox) editDelay: cc.EditBox = null;
    @property(cc.EditBox) editAmplitudeX: cc.EditBox = null;
    @property(cc.EditBox) editAmplitudeY: cc.EditBox = null;
    @property(UIGridView)       gridView: UIGridView = null;
    @property(cc.Prefab)        prefabItem: cc.Prefab = null;
    @property(UICombox)   reductType: UICombox = null;

    private _seleShakeId: number = 0;
    onInit () {
        this._seleShakeId = store.getState().stateCurrShake.id;
        this.reductType.addItem(Object.keys(SHAKE_REDUCT_TYPE));
        store.subscribe(stateCurrSkill, this._onCurrSkillChange, this);
        store.subscribe(stateCurrShake, this._onCurrShakeChange, this);
        this.show();
    }

    onRelease () {
        this.gridView.clear();
        store.unSubscribe(stateCurrSkill, this);
        store.unSubscribe(stateCurrShake, this);
    }

    private _onCurrSkillChange () {
        this.show();
    }

    onCloseClick () {
        this.closeView();
    }

    onAddClick () {
        const info: ShakeInfo = {
            id: this._genID(),
            times: 0,
            duration: 0,
        };
        store.dispatch(actionAddShakeEventInfo(info));
    }

    onResetClick(){
        this._updateLeftPanel();
    }

    onSaveClick(){
        const shakes: ShakeInfo[] = getCurrShakeInfo(store.getState());
        if(!shakes || shakes.length === 0){
            guiManager.showTips('想干啥？ 振屏列表中都没有振屏项！！！')
            return;
        }
        
        let currShake: ShakeInfo = null;
        shakes.some(ele => {
            if(ele.id === this._seleShakeId){
                currShake = ele;
                return true;
            }
            return false;
        });

        if(!currShake){
            guiManager.showTips('振屏列表中没有这个东东，先创建一个在编辑！！！');
            return;
        }

        let newShakeInfo = this._genData();
        if(!newShakeInfo){
            guiManager.showTips('保存失败！！！');
            return;
        }
        store.dispatch(actionUpdateShake(newShakeInfo));
        guiManager.showTips('保存成功');
    }

    private _genData(): ShakeInfo{
        if(this._seleShakeId <= 0) return null;
        let duration: number = parseFloat(this.editDuration.string);
        isNaN(duration) && (duration = 0);
        
        let times : number = parseInt(this.editTimes.string);
        isNaN(times) && (times = 0);
        
        let delay: number = parseFloat(this.editDelay.string);
        isNaN(delay) && (delay = 0);
        
        let oriPosX: number = parseFloat(this.editOriPosX.string);
        isNaN(oriPosX) && (oriPosX = 0);
        
        let oriPosY: number = parseFloat(this.editOriPosY.string);
        isNaN(oriPosY) && (oriPosY = 0); 
         
        let amplitudeX : number = parseFloat(this.editAmplitudeX.string);
        isNaN(amplitudeX) && (amplitudeX = 0);
        
        let amplitudeY : number = parseFloat(this.editAmplitudeY.string);
        isNaN(amplitudeY) && (amplitudeY = 0);

        let shakeInfo: ShakeInfo = {
            id: this._seleShakeId,
            times: times,
            duration: duration,
        };
        
        (oriPosX != 0 || oriPosY != 0) && ( shakeInfo.ori = cc.v3(oriPosX, oriPosY));
        (amplitudeX != 0 || amplitudeY != 0) && (shakeInfo.amplitude = cc.v3(amplitudeX, amplitudeY));
        delay != 0 && (shakeInfo.delay = delay);
        SHAKE_REDUCT_TYPE[this.reductType.selected] != 0 && (shakeInfo.reduct = SHAKE_REDUCT_TYPE[this.reductType.selected]);
        return shakeInfo;
    }

    show () {
        const shakes: ShakeInfo[] = getCurrShakeInfo(store.getState()) || [];
        this.gridView.init(shakes.map((v, index) => {
            return {
                key: `${v.id}`,
                data: v,
            }
        }), {
            getItem: () => {
                const node = cc.instantiate(this.prefabItem);
                return node.getComponent(EditorItemShake);
            },
            onInit: (item: EditorItemShake, data: GridData) => {
                item.updateData(data.data, this._onShakeItemOperCb.bind(this));
                item.select = this._seleShakeId == data.data.id;
            },
            releaseItem: (item: EditorItemSkillEvent) => {
                item.node.destroy();
            },
        });
        
        this._updateLeftPanel();
    }

    private _genID(): number{
        let shakes: ShakeInfo[] = getCurrShakeInfo(store.getState());
        if(!shakes || shakes.length === 0) return 1;
        
        let _id = 0;
        shakes.forEach(ele => {
            _id = Math.max(_id, ele.id);
        });
        return ++_id;
    }

    private _onCurrShakeChange(cmd: string, state: StateCurrShake){
        this._seleShakeId = state.id;
        if(this._seleShakeId <= 0) return;
        this.show();
    }

    private _updateLeftPanel(){
        const shakes: ShakeInfo[] = getCurrShakeInfo(store.getState());
        if(!shakes || shakes.length === 0){
            this.inspectorNode.active = false;
            return;
        }

        let currShake: ShakeInfo = null;
        shakes.some(ele => {
            if(ele.id === this._seleShakeId){
                currShake = ele;
                return true;
            }
            return false;
        });
       
        if(!currShake){
            this.inspectorNode.active = false;
            return;
        }

        this.inspectorNode.active = true;
        this.editDuration.string = `${currShake.duration || 0}`;
        this.editTimes.string = `${currShake.times || 0}`;
        let oriPos: cc.Vec3 = currShake.ori || cc.v3();
        this.editOriPosX.string = `${oriPos.x}`;
        this.editOriPosY.string = `${oriPos.y}`;
        this.editDelay.string = `${currShake.delay || 0}`;
        let amplitude = currShake.amplitude || cc.v3();
        this.editAmplitudeX.string = `${amplitude.x}`;
        this.editAmplitudeY.string = `${amplitude.y}`;
        let reductType = currShake.reduct || SHAKE_REDUCT_TYPE.NONE;        
        this.reductType.selected = EditorUtils.getShakeReductType(reductType);
    }

    private _onShakeItemOperCb(cmd: string, data: ShakeInfo){
        if(this._seleShakeId === data.id){
            this._seleShakeId = 0;
            store.dispatch(actionSelectShake(this._seleShakeId));
        }
        store.dispatch(actionDeleteShake(data));
    }
}