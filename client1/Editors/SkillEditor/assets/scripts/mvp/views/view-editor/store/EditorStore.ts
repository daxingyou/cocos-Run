
import { EditorAction, EditorKey, EditorEvent, StateSkillDesc, StateSkillList } from "../models/EditorConst";
import EditorUtils from "../EditorUtils";
import EventCenter from "../../../../common/event/EventCenter";
import ItemRole from "../../view-item/ItemRole";
import { actionUpdateSkill } from "../actions/EditorActions";
import { RoleSkillInfo } from "../view-actor/CardSkill";

interface EditorReducer<Type> {
    (state: Type, action: EditorAction): Type;
}

interface EditorRoot {
    [index: string]: Function;
}

function combineReducers(...rest: EditorReducer<any>[]): EditorRoot {
    const ret: EditorRoot = {};
    rest.forEach(v => {
        // @ts-ignore
        ret[v.name] = v;
    })
    return ret;
}

interface EditorState {
    [index: string]: any;
}

interface EditorListener {
    (cmd: string, state: EditorState, action?: any): void;
}


interface EditorRecord {
    action: EditorAction;
    state: EditorState;
}

class EditorStore {
    private _history: EditorRecord[] = [];
    private _reducers: EditorRoot = null;
    private _state: EditorState = {};
    private _eventHelper = new EventCenter();

    private _itemRoleSource: ItemRole = null;
    private _itemRoleTarget: ItemRole = null;
    private _filterIndex: number = -1;

    constructor () {
    }

    /**
     * @desc 初始化EditorStore
     *
     * @param {EditorRoot} root 根Reducer，通过 combindReducers 返回的结果
     * @param {boolean} [load=true] 是否从缓存中读取数据
     * @memberof EditorStore
     */
    initialize (root: EditorRoot, load = true) {
        this._eventHelper.fire(EditorEvent.EDITOR_DATA_READY);

        if (load) {
            this._loadState();
        }

        this._eventHelper.fire(EditorEvent.EDITOR_LOADSTAT_SUCC);

        this._reducers = root;

        for (let k in this._reducers) {
            this._state[k] = this._reducers[k](this._state[k], {});
        }

        // 对state进行派发，以便对UI做初始化
        for (let k in this._reducers) {
            this._eventHelper.fire(k, this._state[k]);
        }
    }

    /**
     * @desc 放弃当前的内容，从缓存里边重新读取一遍
     *
     * @memberof EditorStore
     */
    reload () {
        this._loadState();
        for (let k in this._reducers) {
            this._state[k] = this._reducers[k](this._state[k], {});
        }

        // 对state进行派发，以便对UI做初始化
        // for (let k in this._reducers) {
        //     switch (k) {
        //         case "stateSkillList": {
        //             this._state[k].arrSkillInfo.forEach((skillInfo: RoleSkillInfo)=> {
        //                 this._eventHelper.fire(k, actionUpdateSkill(skillInfo));
        //             })
        //             break;
        //         }
        //     }

        // }

        this._eventHelper.fire(EditorEvent.EDITOR_RELOAD_SUCC);
    }

    /**
     * @desc 从缓存里边读取state状态
     *
     * @private
     * @memberof EditorStore
     */
    private _loadState () {
        this._state = EditorUtils.loadFromStorage(EditorKey.KEY_STATE);
        // 处理下Desc
        const allDesc: StateSkillDesc = this._state.stateSkillDesc;
        if (allDesc) {
            const skillList: StateSkillList = this._state.stateSkillList;
            for (let k in allDesc) {
                if (allDesc.hasOwnProperty(k) && allDesc[k]) {
                    skillList.arrSkillInfo.some(v => {
                        if (v.id == parseInt(k)) {
                            if (!v.desc) {
                                v.desc = allDesc[k];
                            }
                            return true;
                        }
                        return false;
                    })
                }
            }
        }
    }

    /**
     * @desc 将当前的状态数据，保存到缓存
     *
     * @memberof EditorStore
     */
    save () {        
        const str = JSON.stringify(this._state);
        cc.sys.localStorage.setItem(EditorKey.KEY_STATE, str);
    }

    private _dispatchOneAction (action: EditorAction) {
        const stateChange: EditorState = {};
        for (let k in this._reducers) {
            const st = this._reducers[k](this._state[k], action);
            if (st != this._state[k]) {
                stateChange[k] = st;
                this._state[k] = stateChange[k];
            }
        }

        for (let k in stateChange) {
            this._eventHelper.fire(k, stateChange[k], action);
        }        

        // 每次执行完，都会记录一下
        this._history.push({
            action: action,
            state: {...this._state},
        });        
    }

    dispatch<Type extends EditorAction>(action: Type) {       
        // this._cmdQueue.push(action);
        this._dispatchOneAction(action);
    }

    /**
     * @desc 订阅状态数据的变化；state，请参见 EditorReducers里边的导出状态
     *
     * @param {EditorReducer<any>} state
     * @param {EditorListener} listener
     * @param {*} target
     * @memberof EditorStore
     */
    subscribe (state: EditorReducer<any>, listener: EditorListener, target: any) {
        // @ts-ignore
        this._eventHelper.register(state.name, target, listener);
    }

    unSubscribe (state: EditorReducer<any>, target: any) {
        // @ts-ignore
        this._eventHelper.unregister(state.name, target);
    }

    getState (): EditorState {
        return this._state;
    }

    registerReady (listener: Function, target: any) {
        this._eventHelper.register(EditorEvent.EDITOR_DATA_READY, target, listener);
    }

    registerLoadState (listener: Function, target: any) {
        this._eventHelper.register(EditorEvent.EDITOR_LOADSTAT_SUCC, target, listener);
    }

    registerReload (listener: Function, target: any) {
        this._eventHelper.register(EditorEvent.EDITOR_RELOAD_SUCC, target, listener);
    }

    unRegisterAll (target: any) {
        this._eventHelper.unregisterAll(target);
    }

    get sourceRole (): ItemRole {
        return this._itemRoleSource;
    }

    set sourceRole (v: ItemRole) {
        this._itemRoleSource = v;
    }

    get targetRole (): ItemRole {
        return this._itemRoleTarget;
    }

    set targetRole (v: ItemRole) {
        this._itemRoleTarget = v;
    }

    get filterIndex(): number {
        return this._filterIndex;
    }

    set filterIndex(index: number) {
        this._filterIndex = index;
    }
}

const store = new EditorStore();

export {
    store,
    combineReducers,
}
