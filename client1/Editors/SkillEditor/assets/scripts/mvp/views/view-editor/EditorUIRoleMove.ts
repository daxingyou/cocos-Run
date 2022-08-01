import { EffectGfxInfo, ROLE_MOVE_TYPE, EffectMoveInfo } from "./view-actor/CardSkill";
import { EditorEvent} from "./models/EditorConst";
import { store } from "./store/EditorStore";
import UICombox from "./components/UICombox";

const {ccclass, property} = cc._decorator;

@ccclass
export default class EditorUIRoleMove extends cc.Component {
    @property(UICombox)         comboxType: UICombox = null;

    @property(cc.EditBox)       editMoveTime: cc.EditBox = null;
    @property(cc.EditBox)       editDelayTime: cc.EditBox = null;
    @property(cc.EditBox)       editX: cc.EditBox = null;
    @property(cc.EditBox)       editY: cc.EditBox = null;

    @property(cc.Label)         lbCurrPos: cc.Label = null;
    @property(cc.Node)          ndRole: cc.Node = null;

    private _data: EffectMoveInfo = null;

    onLoad () {
        store.registerReady(this._onEditorPrepare, this);
    }


    private _onEditorPrepare () {
        this.comboxType.addItem([ROLE_MOVE_TYPE.NONE, ROLE_MOVE_TYPE.DEFAULT, ROLE_MOVE_TYPE.RELATIVE, ROLE_MOVE_TYPE.ABSOLUTE]);
        this.comboxType.setHandler(data => {
            this._onMoveTypeChanged(data);
            this._dispatchEvent();
        });
        this.comboxType.selected = ROLE_MOVE_TYPE.NONE;

        this._registerEditBoxEvent(this.editMoveTime, 'editMoveTime');
        this._registerEditBoxEvent(this.editDelayTime, 'editDelayTime');
        this._registerEditBoxEvent(this.editX, 'editX');
        this._registerEditBoxEvent(this.editY, 'editY');

        this._showCurrWorldPos();
    }

    private _showCurrWorldPos () {
        let worldPos = this.ndRole.convertToWorldSpaceAR(cc.v3(0, 0, 0));
        let curr = worldPos.add(cc.v3(-cc.winSize.width/2, -cc.winSize.height/2, 0))
        this.lbCurrPos.string = `( ${curr.x} , ${curr.y})`
    }

    private _onMoveTypeChanged (data: string) {

    }

    private _registerEditBoxEvent (editBox: cc.EditBox, name: string) {
        const handler = new cc.Component.EventHandler();
        handler.target = this.node;
        handler.component = "EditorUIRoleMove";
        handler.handler = '_onTextChanged';
        handler.customEventData = name;
        editBox.textChanged.push(handler);
    }

    private _onTextChanged (editbox: cc.EditBox, customData: string) {
        this._dispatchEvent();
    }

    private _dispatchEvent () {
        const event = new cc.Event.EventCustom(EditorEvent.MOVE_CHANGED, true);
        event.detail = this.data;
        this.node.dispatchEvent(event);
    }

    get data () : EffectMoveInfo {
        const type = this.comboxType.selected;
        const moveTime = parseFloat(this.editMoveTime.string);
        const delayTime = parseFloat(this.editDelayTime.string);
        const moveX = parseFloat(this.editX.string);
        const moveY = parseFloat(this.editY.string);

        if (type == ROLE_MOVE_TYPE.NONE) {
            return null;
        }
        return {
           type: type,
           time: moveTime,
           delay: delayTime,
           position: cc.v3(moveX, moveY)
        };
    }

    clear () {
        this.data = null;
    }

    set data (data: EffectMoveInfo) {
        data = data || {time: 0, type: '', position: cc.v3(0, 0), delay: 0};

        this.comboxType.selected = data.type || ROLE_MOVE_TYPE.NONE;
        this._onMoveTypeChanged(this.comboxType.selected);

        this.editX.string = data.position.x + ``;
        this.editY.string = data.position.y + ``;
        this.editMoveTime.string = data.time + ``;
        this.editDelayTime.string = data.delay + ``;

        this._data = data;
        this._onRoleMoveFileChanged(data.type);
    }

    private _onRoleMoveFileChanged (data: string) {
        if (data && data.length > 0) {
            switch (this.comboxType.selected) {
                case ROLE_MOVE_TYPE.RELATIVE: this._onMoveTypeChanged(data); break;
                case ROLE_MOVE_TYPE.ABSOLUTE: this._onMoveTypeChanged(data); break;
                case ROLE_MOVE_TYPE.DEFAULT: this._onMoveTypeChanged(data); break;
                default: {
                    this._onMoveTypeChanged(data);
                    break;
                }
            }
        }
    }
}
