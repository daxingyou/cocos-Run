
import EditorUtils from "./EditorUtils";
import { store } from './store/EditorStore';
import { stateSkillList, getSkillDesc, getCurrSkill } from './reducers/EditorReducers';
import { StateSkillList, EditorEvent, EditorAction, EditorActionType } from './models/EditorConst';
import guiManager from '../../../common/GUIManager';
import { actionEditSkill, actionDeleteSkill, actionSelectEffect, actionUpdateSkill } from './actions/EditorActions';
import { RoleSkillInfo } from './view-actor/CardSkill';
import UIGridView, { GridData } from '../../../common/components/UIGridView';
import ItemSkill from './EditorUIItemSkill';
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";

declare var require: any;

const {ccclass, property} = cc._decorator;

@ccclass
export default class EditorSkillListView extends ViewBaseComponent {
    @property(UIGridView)       scroll: UIGridView = null;
    @property(cc.Node)          nodeImportButton: cc.Node = null;
    @property(cc.Prefab)        prefabItem: cc.Prefab = null;

    private _inited = false;
    private _currSelect: RoleSkillInfo = null;

    onInit () {
        if (!this._inited) {
            store.subscribe(stateSkillList, this._onSkillListChange, this);
            this.show();
    
            this.node.on(EditorEvent.EDIT_SKILL, (event: cc.Event.EventCustom) => {
                this._onEditSkill(event.detail);
                this.closeView();
            });
    
            this.node.on(EditorEvent.DELETE_SKILL, (event: cc.Event.EventCustom) => {
                this._onDeleteSkill(event.detail);
            });
    
            this.node.on(EditorEvent.COPY_SKILL, (event: cc.Event.EventCustom) => {
                this._onCopySkill(event.detail);
                this.closeView();
            });
            store.registerReload(this._onReload, this);

            const nowSkill = store.getState().stateCurrSkill.skillInfo;
            if (nowSkill) {
                this._selectItem(nowSkill);
            }

            this._inited = true;
        }
    }

    onRelease () {
        this.scroll.clear();
        store.unSubscribe(stateSkillList, this);
        store.unRegisterAll(this);
    }

    private _onReload () {
        this._inited = false;
        if (this.node.active) {
            this.show(true);
        }
    }

    private _onSkillListChange (stateName: string, state: any, action: EditorAction) {
        switch (action.type) {
            case EditorActionType.DELETE_SKILL: {
                this.scroll.deleteItem(`${action.skillInfo.id}`);
            } break;
            case EditorActionType.UPDATE_SKILL: {
                this.scroll.updateItem({
                    key: `${action.skillInfo.id}`,
                    data: {...action.skillInfo},
                }, true);
            } break;
        }
    }

    onImportClick () {
        guiManager.loadView('EditorImportView', this.node);
    }

    onExportClick () {
        this._saveToLocal('SkillDisplayConfig.js');
    }

    onCloseClick () {
        this.closeView();
    }

    private _onEditSkill (info: RoleSkillInfo) {
        store.dispatch(actionEditSkill(info));

        this._selectItem(info);

        const selId = info.effectList.length > 0 ? info.effectList[0].id : 0;
        store.dispatch(actionSelectEffect(selId));
    }

    private _selectItem (info: RoleSkillInfo) {
        if (this._currSelect) {
            this.scroll.updateItem({
                key: `${this._currSelect.id}`,
                data: this._currSelect,
            });
        }
        this.scroll.updateItem({
            key: `${info.id}`,
            data: info,
            uiState: {select: true},
        });
        this._currSelect = {...info};

        this.scheduleOnce(() => {
            this.scroll.scrollTo({
                key: `${info.id}`,
                data: info,
            });
        }, 0.1);
    }

    private _onCopySkill (info: RoleSkillInfo) {
        const newData= EditorUtils.deepCopy(info);
        const skillObj = this._getSkillList();
        while (skillObj.has(newData.id)) {
            ++newData.id;
        }
        
        store.dispatch(actionUpdateSkill(newData));
        this._onEditSkill(newData);
    }

    private _onDeleteSkill (info: RoleSkillInfo) {
        store.dispatch(actionDeleteSkill(info));
    }
    
    private _getSkillList (): Map<number, RoleSkillInfo> {
        const stateSkillList: StateSkillList = store.getState().stateSkillList;
        const ret = new Map<number, RoleSkillInfo>();

        stateSkillList.arrSkillInfo.forEach(v => {
            ret.set(v.id, v);
        });

        return ret;
    }

    show (foreceUpdate = false) {
        if (foreceUpdate || !this._inited) {
            const allSkill: GridData[] = [];
            this._getSkillList().forEach((v, k) => {
                allSkill.push({
                    key: `${k}`,
                    data: {...v},
                    uiState: {select: false},
                })
            });
            this.scroll.init(allSkill, {
                getItem: () => {
                    const node = cc.instantiate(this.prefabItem);
                    return node.getComponent(ItemSkill);
                },
                releaseItem: (item: ItemSkill) => {
                    item.node.destroy();
                },
                onInit: (item: ItemSkill, data: GridData) => {
                    item.updateItem(data.data);
                    item.uiState = data.uiState;
                },
                sortFunc: (l: GridData, r: GridData) => {
                    return l.key > r.key ? 1 : -1;
                },
            });
        }
    }

    /**
     * @desc 下载到本地下载目录，然后有一个优化的选项可以减少字段数量
     * @param fileName 
     * @param opt 
     */
    private _saveToLocal (fileName: string, opt = false) {
        const skillInfo = {};

        const arrSkill: RoleSkillInfo[] = store.getState().stateSkillList.arrSkillInfo;
        arrSkill.forEach(skill => {
            // @ts-ignore
            skillInfo[skill.id] = skill;
        });

        const roleInfo = store.getState().stateRoleInfo;

        let obj = {
            skillInfo: skillInfo,
            cardSkill: {},
            roleInfo: roleInfo,
        };
        
        // let FileSaver = require('./dist/FileSaver');
        // let FileSaver = require('FileSaver');
        let blob = new Blob(['module.exports = ' + JSON.stringify(obj)], {type: "text/plain;charset=utf-8"});
        // @ts-ignore
        saveAs(blob, fileName);
        // FileSaver.saveAs(blob, fileName);
    }
}