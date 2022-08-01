import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";



const {ccclass, property} = cc._decorator;

@ccclass
export default class EditorDescView extends ViewBaseComponent {
    @property(cc.EditBox)
    editDesc: cc.EditBox = null;

    private _callback: Function = null;

    onInit (desc: string, callback: Function) {
        this.editDesc.string = desc || '';
        this._callback = callback;
    }

    get desc (): string {
        return this.editDesc.string;
    }

    onConfirmClick () {
        this._callback && this._callback(this.desc);
        this.closeView();
    }    
}