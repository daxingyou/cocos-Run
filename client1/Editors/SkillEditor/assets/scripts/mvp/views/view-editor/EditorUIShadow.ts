import { EditorEvent } from "./models/EditorConst";
import { EffectShadowInfo } from "./view-actor/CardSkill";

/*
 * @Description: 
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-12-07 17:23:00
 * @LastEditors: lixu
 * @LastEditTime: 2021-12-09 19:55:51
 */
const {ccclass, property} = cc._decorator;

const ShadowItemName = 'shadow_item';

@ccclass
export default class EditorUIShadow extends cc.Component {

    @property(cc.Button) addBtn: cc.Button  = null;
    @property(cc.Node) itemTemplate: cc.Node = null;

    private _pool: cc.NodePool = null;
    private _isBuildItem: boolean = false;

    private _data: EffectShadowInfo[] = null;
    private _currSeq: number = 0;

    start(){
        this._isBuildItem = false;
        this._currSeq = 0;
        this._pool = this._pool || new cc.NodePool();
        this.recycleAllItemChild();
        let compHandler = new cc.Component.EventHandler();
        compHandler.target = this.node;
        compHandler.component = 'EditorUIShadow';
        compHandler.handler = 'onAddClick';
        this.addBtn.clickEvents.push(compHandler);
        
    }

    onAddClick(){
        if(this._isBuildItem) return;
        this._isBuildItem = true;
        this._addOneItem(null, this._onAddItemFinish.bind(this));
    }

    private _onAddItemFinish(){
        this._updateLayout();
        this._dispatchEvent();
        this._isBuildItem = false;
    }

    private _addOneItem(data: EffectShadowInfo, cb?: Function){
        return this._getItem(data).then(node => {
            this.node.addChild(node);
            cb && cb();
        });
    }

    onDelCLick(event: any){
        let itemNode: cc.Node = event.target || null;
        if(!cc.isValid(itemNode)) return;
        this._recycleOneItem(itemNode.parent.parent);
        this._dispatchEvent();
    }

    private _updateLayout () {
        // 向上递归更新Layout
        let node = this.node;
        while (cc.isValid(node)) {
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

    recycleAllItemChild(){
        let childrens = [...this.node.children];
        childrens.forEach(ele => {
            this._recycleOneItem(ele);
        });
    }

    private _dispatchEvent () {
        const event = new cc.Event.EventCustom(EditorEvent.SHADOW_CHANGE, true);
        event.detail = this.data;
        this.node.dispatchEvent(event);
    }

    private _recycleOneItem(node: cc.Node){
        if(!cc.isValid(node) || node.name != ShadowItemName) return;
        let delBtn = cc.find('line/delBtn', node);
        let btnComp = delBtn.getComponent(cc.Button);
        cc.isValid(btnComp) && (btnComp.clickEvents.length = 0);

        let opacityNode = cc.find('opacity/EditBox', node);
        cc.isValid(opacityNode) &&  opacityNode.getComponent(cc.EditBox) && this._deinitEditBox(opacityNode.getComponent(cc.EditBox));
        let colorNode = cc.find('color/EditBox', node);
        cc.isValid(colorNode) &&  colorNode.getComponent(cc.EditBox) && this._deinitEditBox(colorNode.getComponent(cc.EditBox));
        let delayNode = cc.find('delay/EditBox', node);
        cc.isValid(delayNode) &&  delayNode.getComponent(cc.EditBox) && this._deinitEditBox(delayNode.getComponent(cc.EditBox));

        node.removeFromParent(true);
        this._pool.put(node);
    }

    private async _getItem(data: EffectShadowInfo){
        let node: cc.Node = null;
        if(this._pool.size() > 0){
            node = this._pool.get();
        }
        node = node || cc.instantiate(this.itemTemplate);
        node.name = ShadowItemName;
        let delBtn = cc.find('line/delBtn', node);
        let btnComp = delBtn.getComponent(cc.Button);
        if(!cc.isValid(btnComp)){
            btnComp = delBtn.addComponent(cc.Button);
        }
        
        let id = cc.find('name/ID', node);
        id.getComponent(cc.Label).string = `${data ? data.id : ++this._currSeq}`;
        let opacityNode = cc.find('opacity/EditBox', node);
        let opacity = data ? (typeof data.opacity == 'undefined' ? '255' : `${data.opacity}`) : '255';
        cc.isValid(opacityNode) &&  opacityNode.getComponent(cc.EditBox) && this._initEditBox(opacityNode.getComponent(cc.EditBox), opacity);
        let colorNode = cc.find('color/EditBox', node);
        let color = data ? (typeof data.color == 'undefined' ? '0' : `${data.color}`) : '0';
        cc.isValid(colorNode) &&  colorNode.getComponent(cc.EditBox) && this._initEditBox(colorNode.getComponent(cc.EditBox), color);
        let delayNode = cc.find('delay/EditBox', node);
        let delayTime = data ? (typeof data.delay == 'undefined' ? '0' : `${data.delay}`) : '0';
        cc.isValid(delayNode) &&  delayNode.getComponent(cc.EditBox) && this._initEditBox(delayNode.getComponent(cc.EditBox), delayTime);
        
        let clickEventHandle = new cc.Component.EventHandler();
        clickEventHandle.target = this.node;
        clickEventHandle.component = 'EditorUIShadow';
        clickEventHandle.handler = 'onDelCLick';
        btnComp.clickEvents.push(clickEventHandle);
        return node;
    }

    private _initEditBox(editBox: cc.EditBox, defaultValue: string = ''){
        if(!cc.isValid(editBox)) return;
        editBox.string = defaultValue;
        let editEvtHandler = new cc.Component.EventHandler();
        editEvtHandler.target = this.node;
        editEvtHandler.component = 'EditorUIShadow';
        editEvtHandler.handler = '_onTextChange';
        editBox.textChanged.push(editEvtHandler);
    }

    private _deinitEditBox(editBox: cc.EditBox){
        if(!cc.isValid(editBox)) return;
        editBox.textChanged.length = 0;
    }

    private _onTextChange(event: any){
        this._dispatchEvent();
    }

    get data () : EffectShadowInfo[] {
        let data: EffectShadowInfo[] = null;
        this.node.children.forEach(ele => {
            if(!cc.isValid(ele) || ele.name != ShadowItemName) return;
            let id = parseInt(cc.find('name/ID', ele).getComponent(cc.Label).string);
            let opacity = parseInt(cc.find('opacity/EditBox', ele).getComponent(cc.EditBox).string);
            let color = parseInt(cc.find('color/EditBox', ele).getComponent(cc.EditBox).string);
            let delay = parseFloat(cc.find('delay/EditBox', ele).getComponent(cc.EditBox).string);
            if(isNaN(opacity) && isNaN(color)) return;
            let item: EffectShadowInfo = {id: id};
            !isNaN(delay) && (item.delay = delay);
            isNaN(opacity) && (opacity = 0);
            isNaN(color) && (color = 0);
            opacity = Math.max(0, opacity);
            opacity = Math.min(opacity, 255);
            item.opacity = opacity;

            color = Math.max(0, color);
            color = Math.min(color, 255);
            item.color = color;
            data = data || [];
            data.push(item);
        });
        return data;
    }

    clear () {
        this.data = null;
    }

    set data (data: EffectShadowInfo[]) {
        this._data = data;
        this.recycleAllItemChild();
        this._updateLayout();
        if(!this._data || this._data.length == 0) return;
        if(this._isBuildItem) return;
        this._isBuildItem = true;
        this.scheduleOnce(() => {
            this._currSeq = 0;
            let promiseArr: Promise<any>[] = null;
            this._data && this._data.forEach(ele => {
                this._currSeq = Math.max(this._currSeq, ele.id);
                promiseArr = promiseArr || [];
                promiseArr.push(this._addOneItem(ele));
            });
            if(!promiseArr || promiseArr.length == 0){
                this._onAddItemFinish();
                return;
            };
            Promise.all(promiseArr).then(()=> {
                this._onAddItemFinish();
            });
        });
    }

    onDestroy(){
        this._pool && this._pool.clear();
        this._pool = null;
    }
}
