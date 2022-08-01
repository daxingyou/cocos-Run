import { CustomDialogId } from "../../app/AppConst"
import MessageBoxView from "../../mvp/views/view-other/MessageBoxView"
import { operationSvr } from "../../network/OperationSvr"
import { eventCenter } from "../event/EventCenter"
import { netEvent } from "../event/EventData"
import guiManager from "../GUIManager"
import { ViewBaseComponent } from "./ViewBaseComponent"

const WAITTING_NODE = "WAITTING_NODE"
/**
 * @注意只能挂在scene节点上面，如果挂在view上面的话会导致重复监听而弹出多个提示框
 */
class NetStatusWatcher {
    private root: cc.Node
    private waiting: cc.Node

    init (root: cc.Node) {
        this.root = root;
        this.waiting = this.root.getChildByName(WAITTING_NODE);
    }

    private watching: boolean = false
    private watchMsgBoxView: ViewBaseComponent = null
    private watchMsgBoxIsLoading: boolean = false

    watchNet () {
        if (this.watching) return
        this.watching = true


        if (!this.waiting || !cc.isValid(this.waiting)) return;

        this.waiting.active = false;

        const showMsgBox = async ()=> {
            this.waiting.active = false;
            this.watchMsgBoxIsLoading = true
            // ??? 如果连载入msgboxview都出错了，怎么办 ???
            this.watchMsgBoxView = await guiManager.showMessageBox(this.root, {
                content: "连接已经断开，请重连",
                leftStr: "重 连",
                leftCallback: (msgBox: MessageBoxView) => {
                    if (this.waiting.active) {
                        guiManager.showDialogTips(CustomDialogId.NET_RECONNECTING);
                        return
                    }
                    // reconnecting = true
                    msgBox.closeView();
                    if (this.watchMsgBoxView)
                        this.watchMsgBoxView = null

                    this.waiting.active = true;
                    operationSvr.reconnect()
                },
                rightStr: null,
                rightCallback: null,
            })
            this.watchMsgBoxIsLoading = false
        }


        eventCenter.register(netEvent.NET_CLOSED, this, async ()=>{
            if (this.watchMsgBoxIsLoading) return // 不可能在msgbox还没展现给用户前再次收到NET_CLOSED，但是保护一下

            if (this.watchMsgBoxView != null) { // 已经有弹出框，说明重连失败了
                if (this.waiting.active) {
                    guiManager.showTips("重连失败，请重试。")
                    this.waiting.active = false;
                    return
                }
            } else { // 没有弹出框时，加载一个弹出框让用户选择重连
                showMsgBox()
            }
        })

        eventCenter.register(netEvent.NET_RECONNECTED, this, ()=>{
            if (!this.watchMsgBoxIsLoading) {
                if (this.watchMsgBoxView == null) { // 不是弹出框的用户操作导致的重连成功，不用处理
                } else { // 是弹出导致的重连成功，弹出框可以关闭了
                    // reconnecting = false
                    this.watchMsgBoxView.closeView()
                    this.watchMsgBoxView = null
                }
            } else { // 正在载入弹出框的时候，发现重连成功了，不应该出现，除非有其他地方在watching的时候主动去调用reconnect
            }
            this.waiting.active = false
        })

        if (operationSvr.disconnected) {
            operationSvr.reconnect()
        }
    }

    unwatchNet () {
        if (!this.watching) return
        this.watching = false

        eventCenter.unregister(netEvent.NET_RECONNECTED, this)
        eventCenter.unregister(netEvent.NET_CLOSED, this)

        if (this.watchMsgBoxIsLoading) { // 正在载入弹出框时，上层取消掉了本次watch
            // ??? 这种情况怎么办 ???
            this.watchMsgBoxIsLoading = false
        } else {
            if (this.watchMsgBoxView != null) { // 在有弹出框的情况下，取消掉了本次watch
                this.watchMsgBoxView.closeView()
                this.watchMsgBoxView = null
            } else { // 没有弹出框，并且弹出框也没在载入中，可以忽略
            }
        }
        if (!this.waiting || !cc.isValid(this.waiting)) return;
        this.waiting.active = false;
    }

}

let netStatusWatcher = new NetStatusWatcher()
export default netStatusWatcher