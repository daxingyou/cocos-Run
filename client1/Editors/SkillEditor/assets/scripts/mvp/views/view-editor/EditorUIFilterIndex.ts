import { EditorEvent } from "./models/EditorConst";
import { store } from "./store/EditorStore";

const {ccclass, property} = cc._decorator;

@ccclass
export default class EditorUIFilterIndex extends cc.Component {
    @property(cc.EditBox) filterIndexEditor: cc.EditBox = null;
    
    onLoad() {
        this.node.on(EditorEvent.EDIT_SKILL, this._onEditorSkill, this);
        this.resetFilterIndex();
    }

    onInputEnd() {
        let newIndex = this.filterIndexEditor.string != '' ?  Number(this.filterIndexEditor.string) : -1; 
        if(newIndex != store.filterIndex) {
            store.filterIndex = newIndex;
            this._fireChangeFilterIndex();
        }
    }

    private _fireChangeFilterIndex() {
        let event = new cc.Event.EventCustom(EditorEvent.FILTER_INDEX_CHANGED, true);
        this.node.dispatchEvent(event);
    }

    private _onEditorSkill() {
        this.resetFilterIndex();
    }

    resetFilterIndex() {
        this.filterIndexEditor.string = `${store.filterIndex > -1 ? store.filterIndex : 'Index'}`;
    }
}
