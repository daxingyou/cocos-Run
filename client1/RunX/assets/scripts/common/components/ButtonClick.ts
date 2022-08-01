import { audioManager, SFX_TYPE } from "../../common/AudioManager"
import ListItem from "./ListItem";
const { ccclass, property, menu, disallowMultiple } = cc._decorator;

@ccclass
@disallowMultiple

/**
 * 【注意】 如果组件挂的节点频繁onEnable和disable，则不要挂这个组件，在点击事件的回调了手动添加播放音效的代码即可
 * 尤其是ScrollView，List相关组件，里面调用了节点池的，千万不能用！除非能保证按钮的点击函数的触碰回调栈正确
 */
@menu('自定义组件/ButtonClickAudio')
export default class ButtonClick extends cc.Component {

    @property({
        displayName: "按钮声音",
        tooltip: "按钮点击提示音",
        type: cc.Enum(SFX_TYPE),
    })
    clickSound: SFX_TYPE = SFX_TYPE.BUTTON_CLICK;

    @property({type: [cc.Button]}) effArr: cc.Button[] = [];

    playClip() {
        //防止列表Button在滑动过程被点击
        let listItem: ListItem = this.node.getComponent(ListItem);
        if (!(listItem && listItem.inList() && listItem.listScrolling)) {
            audioManager.playSfx(this.clickSound);
            return true;
        }
        return false;
    }

    onLoad() {
        this.node.on(cc.Node.EventType.TOUCH_START,this.playClip, this);
    }
    
};
