
import EditorUtils from "./EditorUtils";
import guiManager from '../../../common/GUIManager';
import EditorUIPlayButton from './EditorUIPlayButton';
import { EditorKey } from './models/EditorConst';
import { store } from './store/EditorStore';
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";

const {ccclass, property} = cc._decorator;
declare var require: any;

@ccclass
export default class EditorImportView extends ViewBaseComponent {
    @property(cc.EditBox)
    editBox: cc.EditBox = null;

    @property(cc.Node)
    nodeImportButton: cc.Node = null;

    @property(cc.Node)
    nodeRecoverButton: cc.Node = null;

    @property(cc.Label)
    labelImportTips: cc.Label = null;    

    private _lastData: string = null;

    onInit () {
        this.labelImportTips.node.active = false;
        this.nodeRecoverButton.active = this._lastData? true:false;
    }

    onRelease () {        
    }

    /**
     * 
     */
    onImportClick () {
        const str = this.editBox.string;
        if (str.length <= 0) {
            guiManager.showTips(`请在输入框输入点东西才可以的吧！`);
            return;
        }

        this.labelImportTips.node.active = true;
        this.nodeRecoverButton.active = true;

        const obj = EditorUtils.deSearilizeFromString(str);
        // 重新写回去
        cc.sys.localStorage.setItem(EditorKey.KEY_STATE, JSON.stringify(obj));
        // 重新再读取一遍
        store.reload();
    }


    onImportFileComplete(assets: any){
        const str = assets.toString();
        if (str.length <= 0) {
            guiManager.showTips(`导入文件异常！`);
            return;
        }

        this.labelImportTips.node.active = true;
        this.nodeRecoverButton.active = true;
        const obj = EditorUtils.deSearilizeFromString(str);

        const nowState = EditorUtils.loadFromStorage(EditorKey.KEY_STATE);
        nowState.stateSkillList = nowState.stateSkillList || {
            arrSkillInfo: [],
        };

        nowState.stateSkillList.arrSkillInfo = [];
        for (let k in obj.skillInfo) {
            if (obj.skillInfo.hasOwnProperty(k) && obj.skillInfo[k]) {
                nowState.stateSkillList.arrSkillInfo.push(obj.skillInfo[k]);
            }
        }

        nowState.stateRoleInfo = obj.roleInfo;
        // 重新写回去
        cc.sys.localStorage.setItem(EditorKey.KEY_STATE, JSON.stringify(nowState));
        // 重新再读取一遍
        store.reload();
    }

    onImportOldClick () {
        const str = this.editBox.string;
        if (str.length <= 0) {
            guiManager.showTips(`请在输入框输入点东西才可以的吧！`);
            return;
        }
        this.labelImportTips.node.active = true;
        this.nodeRecoverButton.active = true;
        const obj = EditorUtils.deSearilizeFromString(str);
        
        const nowState = EditorUtils.loadFromStorage(EditorKey.KEY_STATE);
        nowState.stateSkillList = nowState.stateSkillList || {
            arrSkillInfo: [],
        };

        nowState.stateSkillList.arrSkillInfo = [];
        for (let k in obj.skillInfo) {
            if (obj.skillInfo.hasOwnProperty(k) && obj.skillInfo[k]) {
                nowState.stateSkillList.arrSkillInfo.push(obj.skillInfo[k]);
            }
        }

        nowState.stateRoleInfo = obj.roleInfo;

        // 重新写回去
        cc.sys.localStorage.setItem(EditorKey.KEY_STATE, JSON.stringify(nowState));

        // 重新再读取一遍
        store.reload();
    }

    onRecoverClick () {
        this.labelImportTips.node.active = false;
        if (this._lastData) {
            this.editBox.string = this._lastData;
            cc.sys.localStorage.setItem(EditorUtils.KEY_SKILL_LIST, this._lastData);
        }
    }

    onCloseClick () {
        this.closeView();
    }
}