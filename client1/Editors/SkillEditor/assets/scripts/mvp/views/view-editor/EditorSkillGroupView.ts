import { ViewBaseComponent } from '../../../common/components/ViewBaseComponent';
import { store } from './store/EditorStore';
import { actionEditSkill, actionDeleteSkill, actionSelectEffect, actionDeleteSkillEventInfo, actionAddSkillEventInfo, actionUpdateGroupInfo } from './actions/EditorActions';
import { RoleSkillInfo, EffectInfo, ANIMATION_TAG, SkillEventInfo, SKILL_EVENT, AnimationGroupInfo, ANIMATION_GROUP, EffectConst } from './view-actor/CardSkill';
import UICombox from './components/UICombox';

declare var require: any;

const {ccclass, property} = cc._decorator;

@ccclass
export default class EditorSkillGroupView extends ViewBaseComponent {
    @property(UICombox)
    comboxGroupType: UICombox = null;

    @property(cc.EditBox)
    editTime: cc.EditBox = null;

    onInit (groupInfo: AnimationGroupInfo) {

        this.comboxGroupType.clearAll();
        this.comboxGroupType.addItem(['SOURCE', 'TARGET']);
        this.comboxGroupType.selected = groupInfo.group;
        this.comboxGroupType.setHandler((v) => {
            this._onTargetEffectChanged();
        });
        this.comboxGroupType.enabled = true;

        this.editTime.string = groupInfo.duration + '';
    }

    onRelease () {
    }

    onCloseClick () {
        this.closeView();
    }

    onSubmitClick () {
        const info: AnimationGroupInfo = {
            // @ts-ignore
            group: this.comboxGroupType.selected,
            duration: parseFloat(this.editTime.string),
        };

        store.dispatch(actionUpdateGroupInfo(info));
        this.closeView();
    }

    onResetClick () {
        // @ts-ignore
        const duration = EffectConst.filterGroupTime(store.getState().stateCurrSkill.skillInfo, ANIMATION_GROUP[this.comboxGroupType.selected]).end;
        this.editTime.string = duration + '';

        const info: AnimationGroupInfo = {
            // @ts-ignore
            group: this.comboxGroupType.selected,
            duration: parseFloat(this.editTime.string),
        };
        store.dispatch(actionUpdateGroupInfo(info));        
    }
    private _onTargetEffectChanged () {
        let currGroup = store.getState().stateCurrSkill.skillInfo.arrGroupInfo

        for (let i = 0; i < currGroup.length; i++) {
            let info = currGroup[i];
            if (info.group == this.comboxGroupType.selected) {
                this.editTime.string = info.duration
                break;
            }
        }
    }
}