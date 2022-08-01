import guiManager from "../../../../common/GUIManager";
import { logger } from "../../../../common/log/Logger";
import UIComboxItem from "./UIComboxItem";

const {ccclass, property} = cc._decorator;

const SPACE = 4;

@ccclass
export default class UICombox extends cc.Component {
    @property(cc.Node)
    nodeCloseBtn: cc.Node = null;

    @property(cc.Node)
    nodeSelectBtn: cc.Node = null;

    @property(cc.Node)
    nodeScrollview: cc.Node = null;

    @property(cc.Node)
    nodeLayout: cc.Node = null;

    @property(cc.Prefab)
    prefabItem: cc.Prefab = null;

    @property(cc.Node)
    nodeRoot: cc.Node = null;

    @property(cc.EditBox)
    editSearch: cc.EditBox = null;

    @property(cc.Boolean)
    enableSearch = false;

    @property
    maxDisplay = 5;

    private _scroll: cc.ScrollView = null;
    private _layout: cc.Layout = null;
    private _dirty: boolean = true;
    private _handler: (data: any) => void;
    private _data: string [] = [];
    private _currSelected: number = -1;
    private _contentWidth: number = 0;

    private _items: UIComboxItem[] = [];

    onLoad () {
        this._scroll = this.nodeScrollview.getComponent(cc.ScrollView);
        this._layout = this.nodeLayout.getComponent(cc.Layout);
        this.nodeRoot = this.nodeRoot || guiManager.sceneNode;

        this._updateScrollView();
        this._closeContent();

        this._bindEvent();
    }

    onDestroy () {
        this.nodeScrollview.parent = null;
    }

    private _updateScrollView () {
        this.nodeScrollview.width = this._scroll.node.parent.width;
        this.nodeScrollview.height = this.maxDisplay * this.prefabItem.data.height + (this.maxDisplay - 1) * SPACE;
    }

    private _bindEvent () {
        if (this.enableSearch) {
            if (!cc.isValid(this.editSearch)) {
                logger.error("UIComBox has no edit box")
                return
            }
            this.editSearch.enabled = true;
            let clickHandler = new cc.Component.EventHandler();
            clickHandler.target = this.node;
            clickHandler.component = 'UICombox';
            clickHandler.handler = 'onSelectBtnClick';
            this.editSearch.editingDidBegan = [clickHandler];
            this.nodeSelectBtn.active = false;
        } else {
            this.nodeSelectBtn.active = true;
            if (cc.isValid(this.editSearch))
                this.editSearch.enabled = false;
        }
    }

    private unBindEvent () {
        if (cc.isValid(this.editSearch)) {
            this.editSearch.editingDidBegan.length = 0;
            this.editSearch.enabled = false;
        }
        this.nodeSelectBtn.active = false;
    }

    onEnable () {
        this._scroll.enabled = true;
        this._bindEvent();
    }

    onDisable () {
        this._scroll.enabled = false;
        this.unBindEvent();
    }

    addItem (item: string | string[]) {
        if (item instanceof Array) {
            item.forEach(el => {
                this._addOneItem(el);
            })
        } else {
            this._addOneItem(item);
        }
    }

    onCloseBtnClick () {
        this._closeContent();
    }

    onSelectBtnClick () {
        this._showContent();
    }

    clearAll () {
        this.nodeLayout.removeAllChildren(true);
        this._data = [];
        this._dirty = true;
        this._currSelected = -1;

        if (cc.isValid(this.editSearch)) this.editSearch.string = '';
        this._updateLayout();
    }

    setHandler (handler: (data: any) => void) {
        this._handler = handler;
    }

    get items (): string[] {
        return this._data;
    }

    get selected () : string {
        if (this._currSelected >= 0) {
            return this._data[this._currSelected];
        }
        return '';
    }

    set selected (v: string) {
        if (this._data.indexOf(v) >= 0) {
            if (cc.isValid(this.editSearch)) this.editSearch.string = v;
            this._closeContent();
            this._currSelected = this._data.indexOf(v);
        }

        if (!v || v.length <= 0) {
            this._currSelected = -1;
            if (cc.isValid(this.editSearch)) this.editSearch.string = '';
        }
    }

    onDeleteClick () {
        this._currSelected = -1;
        if (cc.isValid(this.editSearch)) this.editSearch.string = '';
        this._handler && this._handler('');
    }

    private _addOneItem (item: string) {
        if (this._data.indexOf(item) != -1) {
            logger.warn('UICombox', `Combox. item ${item} already in list`);
            return;
        }

        const nodeItem: cc.Node = cc.instantiate(this.prefabItem);
        const itemComponent: UIComboxItem = nodeItem.getComponent(UIComboxItem);
        itemComponent.string = item;
        itemComponent.setHandler((data) => {
            this._onItemClicked(data);
        });
        this.nodeLayout.addChild(nodeItem);

        this._dirty = true;

        this._data.push(item);
        this._items.push(itemComponent);
    }

    private _setContentPos () {
         if (!cc.isValid(this.editSearch)) return;

        const node = this.editSearch.node.parent.parent;
        let worldPos = cc.Vec3.ZERO;
        node.convertToWorldSpaceAR(cc.v3(0, 0), worldPos);
        // 默认向下探索，如果底部超出屏幕，就向上弹出
        if ( (worldPos.y - node.height / 2 - this.nodeScrollview.height) <= SPACE ) {
            this.nodeScrollview.anchorY = 0;
            worldPos.y += node.height / 2 + 2;
            this.nodeScrollview.parent = this.nodeRoot;

            let newPos = new cc.Vec3();
            this.nodeRoot.convertToNodeSpaceAR(worldPos, newPos);
            this.nodeScrollview.position = newPos;  
        } else {
            this.nodeScrollview.anchorY = 1;
            worldPos.y -= node.height / 2;
            this.nodeScrollview.parent = this.nodeRoot;
            let newPos = new cc.Vec3();
            this.nodeRoot.convertToNodeSpaceAR(worldPos, newPos);
            this.nodeScrollview.position = newPos;
        }

        let scrollPos = this._scroll.node.convertToWorldSpaceAR(cc.Vec3.ZERO);
        if (scrollPos.x + this._contentWidth > cc.winSize.width) {
            // 反向显示
            this.nodeScrollview.x -= scrollPos.x + this._contentWidth - cc.winSize.width + 8;
        }
    }

    private _updateLayout () {
        if (this._dirty) {
            this.nodeLayout.children.forEach(node => {
                const item = node.getComponent(UIComboxItem);
                let edWidth = this.editSearch? this.editSearch.node.parent.width : 10;
                this._contentWidth = Math.max(this._contentWidth, item.nodeLabel.width, edWidth);
            });
            this._scroll.node.width = this._contentWidth;
            this.nodeLayout.children.forEach(node => {
                node.width = this._contentWidth;
                node.x = -this._contentWidth / 2 + 4;
            });

            this._scroll.content.width = this._contentWidth;
            this._scroll.content.parent.width = this._contentWidth;
            this.nodeLayout.width = this._contentWidth;

            this._layout.updateLayout();
            this._scroll.content.height = this.nodeLayout.height;
            this._dirty = false;
        }
    }

    private _closeContent () {
        this.nodeScrollview.active = false;
        this.nodeCloseBtn.active = false;
        this._bindEvent();
        
        this._unregisterEditbox();
    }

    private _showContent () {
        this.nodeScrollview.active = true;
        this.nodeCloseBtn.active = true;
        this._dirty = true;
        this._updateLayout();
        this._setContentPos();

        this._registerEditbox();
    }

    private _registerEditbox () {
        if (this.editSearch) {
            let clickHandler = new cc.Component.EventHandler();
            clickHandler.target = this.node;
            clickHandler.component = 'UICombox';
            clickHandler.handler = 'onTextChanged';
            this.editSearch.textChanged.push(clickHandler);
        }
    }

    private _unregisterEditbox () {
        if (this.editSearch) {
            this.editSearch.textChanged.length = 0;
        }
    }

    private onTextChanged () {
        if(!this.editSearch) return;
        const now = this.editSearch.string;
        this._updateByFilter(now.trim());
    }

    private _updateByFilter (key: string) {
        let showAll = key.length == 0;
        this._items.forEach(v => {
            if (showAll) {
                v.node.active = true;
            } else {
                if (v.string.indexOf(key) >= 0) {
                    v.node.active = true;
                } else {
                    v.node.active = false;
                }
            }
        });

        this._dirty = true;

        this._updateLayout();
    }

    private _onItemClicked (data: any) {
        this._closeContent();
        this._currSelected = this._data.indexOf(data);
        if (this._currSelected >= 0) {
            this.editSearch.string = data;
        }
        this._handler && this._handler(data);
    }    
}