import EditorUtils, { BindType } from "./EditorUtils";
import { RoleSkillInfo, EffectConst } from "./view-actor/CardSkill";
import { EditorEvent } from "./models/EditorConst";

const {ccclass, property} = cc._decorator;

const DEFAULT_COLOR = '<color=#000000>';
const COLOR_END = '</c>';
const LIGHT_COLOR = '<color=#ff0000>';

const COLOR_MAP = {
    'card': '<color=#0000f0>',
    'monster': '<color=#ff0000>',
    'kit': '<color=#f0f000>',
    'buff': '<color=#f000f0>'
};

interface BindInfoName {
    type: BindType;
    name: string;
}

interface ItemUIState {
    select?: boolean;
}

@ccclass
export default class ItemSkill extends cc.Component {
    @property(cc.Label)
    labelId: cc.Label = null;

    @property(cc.RichText)
    richContent: cc.RichText = null;

    private _data: RoleSkillInfo = null;
    private _uiState: ItemUIState = {};

    updateItem (data: RoleSkillInfo) {
        this._data = data;
        const info: RoleSkillInfo = data;
        this.labelId.string = info.id + '';
        this.richContent.string = info.desc || '';

        if (this._uiState.select) {
            this.node.color = cc.Color.WHITE.fromHEX('#E1A3E9');
        } else {
            this.node.color = cc.Color.WHITE.fromHEX('#DDDADA');
        }
    }

    private _dispatchEvent (eventName: string) {
        const event = new cc.Event.EventCustom(eventName, true);
        event.detail = this._data;
        this.node.dispatchEvent(event);
    }

    get uiState (): ItemUIState {
        return this._uiState;
    }

    set uiState (v: ItemUIState) {
        v = v || {};
        this._uiState = v;
        if (v.select) {
            this.node.color = cc.Color.WHITE.fromHEX('#E1A3E9');
        } else {
            this.node.color = cc.Color.WHITE.fromHEX('#DDDADA');
        }
    }

    get data (): RoleSkillInfo {
        return this._data;
    }

    onEditClick () {
        this._dispatchEvent(EditorEvent.EDIT_SKILL);
    }

    onCopyClick () {
        this._dispatchEvent(EditorEvent.COPY_SKILL);
    }

    onDeleteClick () {
        this._dispatchEvent(EditorEvent.DELETE_SKILL);
    }
}