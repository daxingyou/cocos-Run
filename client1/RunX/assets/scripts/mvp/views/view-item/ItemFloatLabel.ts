import { WatcherHelper } from "../../../common/components/WatcherHelper";

const {ccclass, property} = cc._decorator;

enum FLOAT_TYPE {
    BUFF,
    DEBUFF,
    ADD_HP,
    ADD_MAXHP,
}

interface FloatLabel {
    info: string;
    parent: cc.Node;
    offset: cc.Vec3;
    type: FLOAT_TYPE;
    zIndex: number;
}

const WHITE = cc.color(220, 220, 220);
const WHITE_BORDER = cc.color(56, 52, 96);
const RED = cc.color(200, 31, 45);
const RED_BORDER = cc.color(75, 6, 25);

const LABEL_COLOR: cc.Color[] = [
    cc.Color.WHITE.fromHEX(`#dcdcdc`),
    cc.Color.WHITE.fromHEX(`#dc2d2e`),
    cc.Color.WHITE.fromHEX(`#8ae817`),
    cc.Color.WHITE.fromHEX(`#8ae817`)
]

@ccclass
export default class ItemFloatLabel extends cc.Component {
    @property(cc.Label)
    label: cc.Label = null;

    show (info: FloatLabel, finCallback: Function) {
        this._play(info, finCallback);
    }

    stop () {
        this.node.stopAllActions();
        WatcherHelper.removeWatcher(this.node);
    }

    private _play (info: FloatLabel, finCallback: Function) {
        let color = LABEL_COLOR[info.type];

        let offsetY = 30;

        const onFinish = () => {
            WatcherHelper.removeWatcher(this.node);
            finCallback && finCallback();
        }

        this.label.string = info.info;
        this.node.stopAllActions();
        this.node.active = true;
        this.node.opacity = 10;
        this.node.position = info.offset;
        this.node.color = color;
        this.node.scale = 1;

        const zIndex = info.zIndex||0;
        info.parent.addChild(this.node, zIndex);
        WatcherHelper.addWatcher({
            node: this.node,
            parent: info.parent,
            onDisable: () => {
                onFinish();
            }
        });

        this.node.runAction(
            cc.sequence(
                cc.spawn(
                    cc.moveBy(0.5, cc.v2(0, offsetY)).easing(cc.easeExponentialOut()),
                    cc.tintTo(0.4, color.getR(), color.getG(), color.getB()),
                    cc.fadeIn(0.3),
                ),                
                cc.delayTime(0.5),
                cc.spawn(
                    cc.moveBy(0.35, cc.v2(0, 40)),
                    cc.fadeOut(0.35),
                ),
                cc.callFunc(() => {
                    onFinish();
                }),
            )
        );
    }
}

export {
    FloatLabel,
    FLOAT_TYPE,
}