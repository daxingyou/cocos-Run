import EditorUISwitchButton from "./EditorUISwitchButton";

const {ccclass, property} = cc._decorator;

@ccclass
export default class EditorBaseInspector extends cc.Component {
    @property(EditorUISwitchButton)
    btnSwitch: EditorUISwitchButton = null;

    @property(cc.Node)
    nodeTitle: cc.Node = null;

    private _status = new Map<string, boolean>();

    onLoad () {
        this.btnSwitch.init('', () => {
            this._onSwitchClick();
        })
    }

    private _onSwitchClick () {
        if (this.btnSwitch.select) {
            this._openInspector();
        } else {
            this._closeInspector();
        }
    }

    private _openInspector () {
        this.node.children.forEach(v => {
            if (v !== this.nodeTitle) {
                v.active = this._status.get(v.uuid);
            }
        });
        this._updateLayout();
    }

    private _updateLayout () {
        // 向上递归更新Layout
        let node = this.node;
        while (node) {
            let layout = node.getComponent(cc.Layout);
            if (layout) {
                layout.affectedByScale = true;
                layout.updateLayout();
                node = node.parent;
            } else {
                break;
            }
        }
    }

    private _closeInspector () {
        this.node.children.forEach(v => {
            if (v !== this.nodeTitle) {
                this._status.set(v.uuid, v.active);
                v.active = false;
            }
        });
        this._updateLayout();
    }
}