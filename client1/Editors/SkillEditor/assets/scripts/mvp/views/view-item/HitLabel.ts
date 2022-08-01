import { AttackResult, HPResult } from "../../../game/CSInterface";

const {ccclass, property} = cc._decorator;

interface HitLabelParam {
    oriPos: cc.Vec3;
    controlPoint: cc.Vec3[];    
    fadeInTime: number;
    holdTime: number;
    fadeOutTime: number;
    zIndex: number;
}

interface LabelConfig {
    size: number,
    color: cc.Color,
    outline: cc.Color,
    icon?: string
}

const NORMAL_LABEL: LabelConfig = {
    size: 30,
    color: cc.color().fromHEX("#f24d26"),
    outline: cc.color().fromHEX("#4f160b"),
    icon: null
}

const ADD_HP_LABEL: LabelConfig = {
    size: 30,
    color: cc.color().fromHEX("#458B00"),
    outline: cc.color().fromHEX("#FFFFFF"),
    icon: "icon_damage_hardattack"
}

const DEFAULT_PARAM: HitLabelParam = {
    oriPos: cc.v3(0, 150),
    controlPoint: [cc.v3(70, 100), cc.v3(70, -200)],
    fadeInTime: 0.25,
    holdTime: 0.15,
    fadeOutTime: 0.2,
    zIndex: 3
}

let COUNTER = 0;
const FILED_NORMAL = 30;
const STEP_RESO = [0, 3, 1, 2];

@ccclass
export default class HitLabel extends cc.Component {
    @property(cc.Label)     hitLabel: cc.Label = null;
    @property(cc.LabelOutline) hitLbOt: cc.LabelOutline = null; 

    private _finishHandler: Function = null

    show (root: cc.Node, handler: Function, hpRes: HPResult, attRes: AttackResult, saperateRate: number = 100) {
        let descStr: string = "";
        let num = 0;
        let rate = saperateRate / 100;
        if (hpRes && hpRes.Delta > 0) {
            this.hitLabel.node.color = ADD_HP_LABEL.color;
            this.hitLbOt.color = ADD_HP_LABEL.outline;
            this.hitLabel.fontSize = ADD_HP_LABEL.size;
            num = hpRes.Delta;
            descStr= "恢复" + hpRes.Delta + "";
        } else if (attRes) {
            this.hitLabel.node.color = NORMAL_LABEL.color;
            this.hitLbOt.color = NORMAL_LABEL.outline;
            this.hitLabel.fontSize = NORMAL_LABEL.size;
            descStr = attRes.Attack + '';
            num = attRes.Attack;
            if (attRes.Crit) {
                descStr = "暴击 " + attRes.Attack;
            }

            if (attRes.TrueAttack) {
                num = attRes.TrueAttack;
                descStr = "真实伤害 " + attRes.TrueAttack;
            }

            if (attRes.Miss) {
                descStr = "躲避成功";
            }
        }

        if (descStr) {
            this.hitLabel.string = descStr;
            let numMulit = Math.min(6, Math.floor(Math.abs(num) / 10)) + 1;
            numMulit = ((numMulit - 1) * 1.8 / 5);
            numMulit = numMulit * numMulit * numMulit;
            if (numMulit == 0) numMulit = 10;
            this._realShow(root, DEFAULT_PARAM, ()=>{}, numMulit);
        }
    }

    private _realShow (node: cc.Node, param: HitLabelParam, callback: () => void, numMulit: number) {
        const oriPos = param.oriPos;

        const dir = Math.pow(-1, (COUNTER % 2));
        const xstep = STEP_RESO[Math.floor((COUNTER % 8) / 2)];
        const ystep = Math.floor(COUNTER % 6) + numMulit;

        const cp = param.controlPoint.map((p, i) => {
            return cc.v2(
                dir * (p.x - xstep * 20),
                p.y + ystep * 5,
            );
        });

        COUNTER++;

        const holdtime = param.holdTime;
        const totalTime = param.fadeInTime + param.fadeOutTime + holdtime + param.fadeInTime / 2;
        const fadeInTime = param.fadeInTime;
        const fadeOutTime = param.fadeOutTime;
        const zIndex = param.zIndex||0;

        this.node.stopAllActions();
        this.node.active = true;
        this.node.opacity = 255;
        this.node.position = oriPos;
        this.node.scale = 1;
        node.addChild(this.node, zIndex);
        this.node.runAction(cc.spawn(
            cc.bezierBy(totalTime, [cc.v2(oriPos), ...cp]),
            cc.sequence(
                cc.scaleTo(fadeInTime/2, 1.5),
                cc.delayTime(fadeInTime/2),
                cc.scaleTo(fadeInTime/2, 1),
                cc.scaleTo(holdtime, 0.5).easing(cc.easeCubicActionIn()),
                cc.fadeOut(fadeOutTime).easing(cc.easeQuinticActionIn()),
                cc.callFunc(() => {
                    callback && callback();
                })
            )
        ));
    }

}