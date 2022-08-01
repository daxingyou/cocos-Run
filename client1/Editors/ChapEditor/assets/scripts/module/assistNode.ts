// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html
import main from "../main";
const {ccclass, property} = cc._decorator;

@ccclass
export default class assistNode extends cc.Component {
    @property(main) app: main = null;
    //辅助功能列表
    @property(cc.Toggle) checkBox0: cc.Toggle = null;
    @property(cc.Toggle) checkBox1: cc.Toggle = null;
    @property(cc.Toggle) checkBox2: cc.Toggle = null;

    onCheckBox0Selected(event:cc.Toggle){
        let checked = event.isChecked;
        this.app.container.getComponent("container").showAllTages(checked);
    }
    onCheckBox1Selected(event:cc.Toggle){
        let checked = event.isChecked;
        if(checked) this.app.onButtonShowLines();
        if(!checked) this.app.onButtonHideLines();
    }
    onCheckBox2Selected(event:cc.Toggle){
        
    }
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {

    }

    // update (dt) {}
}
