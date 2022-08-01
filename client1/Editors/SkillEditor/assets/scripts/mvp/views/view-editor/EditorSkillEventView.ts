import { ViewBaseComponent } from '../../../common/components/ViewBaseComponent';
import { store } from './store/EditorStore';
import { stateSkillList, getSkillDesc, stateCurrSkill } from './reducers/EditorReducers';
import { StateSkillList, EditorEvent } from './models/EditorConst';
import { actionEditSkill, actionDeleteSkill, actionSelectEffect, actionDeleteSkillEventInfo, actionAddSkillEventInfo } from './actions/EditorActions';
import { RoleSkillInfo, EffectInfo, ANIMATION_TAG, SkillEventInfo, SKILL_EVENT } from './view-actor/CardSkill';
import UIGridView, { GridData } from '../../../common/components/UIGridView';
import EditorItemSkillEvent from './EditorItemSkillEvent';
import UICombox from './components/UICombox';

declare var require: any;

const {ccclass, property} = cc._decorator;

@ccclass
export default class EditorSkillEventView extends ViewBaseComponent {
    @property(UICombox)         comboxType: UICombox = null;
    @property(UICombox)         comboxGroup: UICombox = null;
    @property(cc.EditBox)       editTime: cc.EditBox = null;
    @property(UIGridView)       gridView: UIGridView = null;
    @property(cc.Prefab)        prefabItem: cc.Prefab = null;

    onInit (now: number) {
        this.show();
        this.node.on(EditorEvent.DELETE_SKILLEVENT, (event: cc.Event.EventCustom) => {
            this._onDeleteSkillEvent(event.detail);
        });

        this.editTime.string = now + '';
        
        this.comboxType.addItem([SKILL_EVENT.HIT_TARGET]);
        this.comboxType.selected = SKILL_EVENT.HIT_TARGET;

        this.comboxGroup.addItem(['TARGET', 'SOURCE']);
        this.comboxGroup.selected = 'TARGET';

        store.subscribe(stateCurrSkill, this._onCurrSkillChange, this);
    }

    onRelease () {
        this.gridView.clear();
        store.unSubscribe(stateCurrSkill, this);
    }

    private _onCurrSkillChange () {
        this.show();
    }

    onCloseClick () {
        this.closeView();
    }

    onAddClick () {
        const info: SkillEventInfo = {
            // @ts-ignore
            type: this.comboxType.selected,
            time: parseFloat(this.editTime.string),
            group: this.comboxGroup.selected,
        };

        store.dispatch(actionAddSkillEventInfo(info));
    }

    private _onDeleteSkillEvent (info: SkillEventInfo) {
        store.dispatch(actionDeleteSkillEventInfo(info));
    }

    show () {
        const groupEvent: SkillEventInfo[] = store.getState().stateCurrSkill.skillInfo.arrEvent || [];
        if(groupEvent.length > 2) {
            groupEvent.sort((_a, _b) => {
                return Number(_a.time) - Number(_b.time);
            });
        }
        this.gridView.init(groupEvent.map((v, index) => {
            return {
                key: v.group + v.type + index,
                data: v,
            }
        }), {
            getItem: () => {
                const node = cc.instantiate(this.prefabItem);
                return node.getComponent(EditorItemSkillEvent);
            },
            onInit: (item: EditorItemSkillEvent, data: GridData) => {
                item.init(data.data);
            },
            releaseItem: (item: EditorItemSkillEvent) => {
                item.node.destroy();
            },
        })
    }
}