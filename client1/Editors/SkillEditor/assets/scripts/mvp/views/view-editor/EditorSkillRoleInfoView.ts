import { ViewBaseComponent } from '../../../common/components/ViewBaseComponent';
import { store } from './store/EditorStore';
import { actionUpdateRoleInfo } from './actions/EditorActions';
import { RoleInfo } from './view-actor/CardSkill';

declare var require: any;

const {ccclass, property} = cc._decorator;

@ccclass
export default class EditorSkillRoleInfoView extends ViewBaseComponent {
    @property(cc.EditBox)
    editWidth: cc.EditBox = null;

    @property(cc.EditBox)
    editHeight: cc.EditBox = null;

    // @property(cc.EditBox)
    // editTimeOffset: cc.EditBox = null;

    private _info: RoleInfo = null;

    onInit (info: RoleInfo) {
        this._info = info;
        this.editWidth.string = (info.width || 0) + '';
        this.editHeight.string = (info.height || 0) + '';
    }

    onRelease () {
    }

    onCloseClick () {
        this.closeView();
    }

    onSubmitClick () {
        const info: RoleInfo = {
            name: this._info.name,
            width: parseInt(this.editWidth.string),
            height: parseInt(this.editHeight.string),
        };

        store.dispatch(actionUpdateRoleInfo(info));
        this.closeView();
    }
}