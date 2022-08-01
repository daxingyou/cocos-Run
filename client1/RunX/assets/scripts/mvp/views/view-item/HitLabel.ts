import { BACK_ATTACK_ID, DOUBLE_ATTACK_ID, PURSUE_ATTACK_ID, SPUTTER_ATTACK_ID } from "../../../app/BattleConst";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { gamesvr } from "../../../network/lib/protocol";

const {ccclass, property} = cc._decorator;

// const COLOR_L = {
//     RED: cc.color().fromHEX("#CB0E0E"),
//     GREEN: cc.color().fromHEX("#458B00"),
// }

export const enum ATTACK_TYPE {
    DOUBLE_ATTACK,
    BACK_ATTACK,
    PURSUE_ATTACK,
    MISS,
    INVINCIBLE,             // 无敌
}

const enum DETAIL_TYPE {
    CRIT,                   // 暴击
    POWER,                  // 能量
    ADD_HP,                  // 回血
    SHIELD,                  // 护盾
    SPUTTER,                // 溅射没特效先走普攻效果
}

interface HitLabelParam {
    oriPos: cc.Vec3;
    controlPoint: cc.Vec3[];    
    fadeInTime: number;
    holdTime: number;
    fadeOutTime: number;
    zIndex: number;
    scale?: number;
}

interface LabelConfig {
    size: number,
    color: cc.Color,
    outline: cc.Color,
    icon?: string
}

const NORMAL_LABEL: LabelConfig = {
    size: 30,
    color: cc.color().fromHEX("#F6EAAD"),
    outline: cc.color().fromHEX("#4f160b"),
    icon: null
}

const ADD_HP_LABEL: LabelConfig = {
    size: 30,
    color: cc.color().fromHEX("#57CB38"),
    outline: cc.color().fromHEX("#FFFFFF"),
    icon: "icon_damage_hardattack"
}

const CRIT_LABEL: LabelConfig = {
    size: 35,
    color: cc.color().fromHEX("#FCDE82"),
    outline: cc.color().fromHEX("#FFFFFF"),
    icon: "icon_damage_hardattack"
}

const POWER_LABEL: LabelConfig = {
    size: 30,
    color: cc.color().fromHEX("#F1C97B"),
    outline: cc.color().fromHEX("#FFFFFF"),
    icon: "icon_damage_hardattack"
}

const DEFAULT_PARAM: HitLabelParam = {
    oriPos: cc.v3(0, 200),
    controlPoint: [cc.v3(70, 100), cc.v3(70, -200)],
    fadeInTime: 0.25,
    holdTime: 0.15,
    fadeOutTime: 0.2,
    zIndex: 3
}

const NEW_HIT_PARAM: HitLabelParam = {
    oriPos: cc.v3(0, 180),
    controlPoint: [cc.v3(70, 100), cc.v3(70, -200)],
    fadeInTime: 0.1,
    holdTime: 0.3,
    fadeOutTime: 0.1,
    zIndex: 3,
    scale: 3
}


let COUNTER = 0;
const FILED_NORMAL = 30;
const STEP_RESO = [0, 3, 1, 2];

@ccclass
export default class HitLabel extends cc.Component {
    @property(cc.Label) hitLabel: cc.Label = null;
    @property(cc.LabelOutline) hitLbOt: cc.LabelOutline = null; 
    @property(cc.Sprite) hitTypeIcon: cc.Sprite = null;
    @property([sp.SkeletonData]) skeletonDatas: sp.SkeletonData[] = [];
    @property(sp.Skeleton) specialSpine: sp.Skeleton = null;
    @property(cc.Label) specialLabel: cc.Label = null;
    @property([cc.Font]) specialFonts: cc.Font[] = [];
    @property([cc.SpriteFrame]) specialIcons: cc.SpriteFrame[] = [];

    private _finishHandler: Function = null
    show (root: cc.Node, handler: ()=> void, hpRes: gamesvr.IHPResult, saperateRate: number = 100, attackId: number = 0) {
        let descStr: string = "";
        let num = 0;
        let rate = saperateRate / 100;
        this.hitLabel.string = '';
        this.hitLabel.node.opacity = 255;
        this.specialLabel.node.opacity = 0;
        this.hitTypeIcon.spriteFrame = null;
        // 更新伤害类型的icon
        this._refreshHitTypeIconView(hpRes);
        let detailHp = hpRes.HPDetail;
        if (hpRes.Delta < 0 || hpRes.DeltaShield < 0) {
            // 掉血 掉护盾
            if(hpRes.Delta < 0 && hpRes.DeltaShield < 0) {
                num = Math.floor((hpRes.Delta + hpRes.DeltaShield)  * rate);
            } else if(hpRes.DeltaShield < 0) {
                num = Math.floor(hpRes.DeltaShield  * rate);
            } else if(hpRes.Delta < 0) {
                num = Math.floor(hpRes.Delta  * rate);
            }
            // 真实伤害还没特效 所以只能用普通字体
            if (detailHp.TrueAttack) {
                num = Math.floor(detailHp.TrueAttack * rate);
                descStr = `-${num}`;
            } else if (detailHp.Parry) {
                descStr = `招架${num}`;
            } else if (detailHp.Crit) {
                descStr = `${num}`;
                this._refreshSpecialLabel(descStr, DETAIL_TYPE.CRIT, root, handler);
                return;
            } else if (attackId == SPUTTER_ATTACK_ID) {
                descStr = `溅射${num}`;
                this.hitTypeIcon.spriteFrame = this._getSpecialIcon(DETAIL_TYPE.SPUTTER);
                this._refreshSpecialLabel(descStr, DETAIL_TYPE.SPUTTER, root, handler);
                return;
            }

            // TODO 无敌
            else if (detailHp.Attack == 0 && !hpRes.DeltaShield) {
                this._showSpecialType(root, NEW_HIT_PARAM, ATTACK_TYPE.INVINCIBLE, handler);
                return;
            }
            else {
                descStr = `${num}`;
            }
            if(!detailHp.Crit) {
                this._refreshSpecialLabel(descStr, DETAIL_TYPE.POWER, root, handler);
                return;
            }
        } else if (hpRes.Delta > 0 || hpRes.DeltaShield > 0) {
            // 加血 加护盾
            if(hpRes.DeltaShield > 0) {
                num = Math.floor(hpRes.DeltaShield);
            } else if(hpRes.Delta > 0) {
                num = Math.floor(hpRes.Delta);
            }
            if (hpRes.Delta == hpRes.HP) {
                descStr= `+${num}`;
            } else if(hpRes.HPDetail && !!hpRes.HPDetail.Vampire) {
                descStr= `+${hpRes.HPDetail.Vampire}`;
            } else if (hpRes.Delta > 0) {
                descStr= `+${num}`;
            } else {
                descStr= `护盾+${num}`;
                this._refreshSpecialLabel(descStr, DETAIL_TYPE.SHIELD, root, handler);
                return;
            }
            if(hpRes.Delta > 0) {
                this._refreshSpecialLabel(descStr, DETAIL_TYPE.ADD_HP, root, handler);
                return;
            }
        } else {
            // 触发了特殊事件
            if(detailHp.Miss) {
                // MISS
                this._showSpecialType(root, NEW_HIT_PARAM, ATTACK_TYPE.MISS, handler);
                return;
            }
        }

        if (descStr) {
            this._initHitLabel(descStr, NORMAL_LABEL);
            let numMulit = Math.min(6, Math.floor(Math.abs(num) / 10)) + 1;
            numMulit = ((numMulit - 1) * 1.8 / 5);
            numMulit = numMulit * numMulit * numMulit;
            if (numMulit == 0) numMulit = 10;
            this._realShow2(root, NEW_HIT_PARAM, handler, numMulit);
        }

    }
    /**
     * 特殊伤害
     * @param root 
     * @param handler 
     * @param hpRes 
     * @param saperateRate 
     * @param attackId 
     * @returns 
     */
    showSpecial(root: cc.Node, handler: ()=> void, hpRes: gamesvr.IHPResult, saperateRate: number = 100, attackId: number = 0) {
        if (!!attackId) {
            if(DOUBLE_ATTACK_ID == attackId) {
                this._showSpecialType(root, NEW_HIT_PARAM, ATTACK_TYPE.DOUBLE_ATTACK, handler);
                return;
            } else if(BACK_ATTACK_ID == attackId) {
                this._showSpecialType(root, NEW_HIT_PARAM, ATTACK_TYPE.BACK_ATTACK, handler);
                return;
            } else if(PURSUE_ATTACK_ID == attackId) {
                this._showSpecialType(root, NEW_HIT_PARAM, ATTACK_TYPE.PURSUE_ATTACK, handler);
                return;
            } else if(SPUTTER_ATTACK_ID == attackId) {
                // this._showSpecialType(root, NEW_HIT_PARAM, ATTACK_TYPE.SPUTTER, handler);
                // this.showCustomHitLabel(root, descStr, handler, NORMAL_LABEL);
                return;
            }
        }
        handler && handler();
    }

    showPower(root: cc.Node, handler: ()=> void, powerRes: gamesvr.IPowerResult) {
        let powerDetail = powerRes.Delta;
        let numMulit = Math.abs(powerDetail) > 10 ? 10 : Math.abs(powerDetail);
        this._refreshPowerIconView(powerRes);
        let str = powerDetail > 0 ? ('+' + powerDetail) : (powerDetail + '');
        this._refreshSpecialLabel(str, DETAIL_TYPE.POWER, root, handler);
        this._realShow2(root, NEW_HIT_PARAM, handler, numMulit);
    }
    /**
     * 显示自定义类型的
     * @param root 
     * @param str 
     * @param handler 
     * @param labelCfg 
     */
    showCustomHitLabel(root: cc.Node, str: string, handler: () => void, labelCfg: LabelConfig = NORMAL_LABEL) {
        this.hitLabel.node.opacity = 255;
        this.specialLabel.node.opacity = 0;
        this.hitTypeIcon.node.opacity = 0;
        this._initHitLabel(str, labelCfg);
        this._realShow2(root, NEW_HIT_PARAM, handler, 0);
    }

    private _initHitLabel(str: string, labelCfg: LabelConfig) {
        this.hitLabel.node.opacity = 255;
        this.specialLabel.node.opacity = 0;
        this.hitTypeIcon.node.opacity = 0;
        this.hitLabel.string = str;
        this.hitLabel.node.color = labelCfg.color;
        this.hitLabel.fontSize = labelCfg.size;
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
    /**
     * 不带bezier曲线移动得
     * @param node 
     * @param param 
     * @param callback 
     * @param numMulit 
     */
    private _realShow2(node: cc.Node, param: HitLabelParam, callback: () => void, numMulit: number = 0) {
        const oriPos = param.oriPos;
        const holdtime = param.holdTime;
        const totalTime = param.fadeInTime + param.fadeOutTime + holdtime + param.fadeInTime / 2;
        const fadeInTime = param.fadeInTime;
        const fadeOutTime = param.fadeOutTime;
        const zIndex = param.zIndex || 0;
        const scale = param.scale || 1;

        this.specialSpine.node.active = false;
        this.node.stopAllActions();
        this.node.active = true;
        this.node.opacity = 255;
        this.node.position = oriPos;
        this.node.scale = 1;
        node.addChild(this.node, zIndex);
        this.node.runAction(cc.sequence(
            cc.scaleTo(fadeInTime, scale),
            cc.scaleTo(fadeInTime + 0.1, 1),
            cc.spawn(
                cc.moveBy(holdtime, cc.v2(0, 60)).easing(cc.easeCubicActionOut()),
                cc.sequence(
                    cc.delayTime(holdtime - fadeOutTime),
                    cc.fadeOut(fadeOutTime)
                )
            ),
            cc.callFunc(() => {
                callback && callback();
            })
        ));
    }

    private _realshowSpecialAni(node: cc.Node, param: HitLabelParam) {
        const oriPos = param.oriPos;
        this.node.stopAllActions();
        this.node.active = true;
        this.node.position = oriPos;
        this.node.scale = 1;
        this.node.opacity = 255;
        node.addChild(this.node);
    }
    /**
     * 刷新伤害类型的图标
     * @param hpResult 
     * @returns 
     */
    private _refreshHitTypeIconView(hpResult: gamesvr.IHPResult) {
        // TODO 更换攻击类型的icon
        this.hitTypeIcon.node.opacity = 255;
        if(!hpResult) return;
        if(!!hpResult.Delta && hpResult.Delta < 0) {
            // 扣血
            let detaiHp = hpResult.HPDetail;
            if(detaiHp.Crit) {
                // 暴击
                this.hitTypeIcon.spriteFrame = this._getSpecialIcon(DETAIL_TYPE.CRIT);
            } else if(detaiHp.Miss) {
                // MISS
            } else if(detaiHp.Parry) {
                // 招架
            } else if(detaiHp.Protect) {
                // 保护
            } else if(detaiHp.TrueAttack) {
                // 真是伤害
            } else if(detaiHp.Vampire) {
                // 吸血
            } else if(detaiHp.BackAttack) {
                // 反击
            }
        } else {
            if(!!hpResult.Delta && hpResult.Delta > 0) {
                // 加血
                this.hitTypeIcon.spriteFrame = this._getSpecialIcon(DETAIL_TYPE.ADD_HP);
            } else if(!!hpResult.DeltaShield && hpResult.DeltaShield > 0) {
                this.hitTypeIcon.spriteFrame = this._getSpecialIcon(DETAIL_TYPE.SHIELD);
            }
        }
    }
    /**
     * 刷新能量ICON
     * @param detailPower 
     */
    private _refreshPowerIconView(detailPower: gamesvr.IPowerResult) {
        // TODO 更换能量类型的icon
        this.hitTypeIcon.node.opacity = 255;
        // this.hitLabel.node.x = -this.hitLabel.node.width / 2;
        this.hitTypeIcon.spriteFrame = this._getSpecialIcon(DETAIL_TYPE.POWER);
    }
    /**
     * 更换特殊类型 字体
     * @param str 
     * @param specialType 
     * @param root 
     * @param handler 
     */
    private _refreshSpecialLabel(str: string, specialType: DETAIL_TYPE, root: cc.Node, handler: () => void) {
        this.specialLabel.node.opacity = 255;
        this.hitLabel.node.opacity = 0;
        let font = this._getFont(specialType);
        this.specialLabel.font = font;
        this.specialLabel.string = str;
        if(this.hitTypeIcon.spriteFrame) {
            this.hitTypeIcon.node.x = -this.hitTypeIcon.node.width / 2 * this.hitTypeIcon.node.scaleX;
            this.specialLabel.node.x = this.specialLabel.node.width / 2 - 10;
            this.hitTypeIcon.node.opacity = 255;
        } else {
            this.specialLabel.node.x = 0;
        }
        this._realShow2(root, NEW_HIT_PARAM, handler);
    }
    /**
     * 特殊特效 会有spine动画的
     * @param rootNode 
     * @param param 
     * @param specialType 
     * @param callBack 
     */
    private _showSpecialType(rootNode: cc.Node, param: HitLabelParam, specialType: ATTACK_TYPE, callBack: Function) {
        this.hitLabel.node.opacity = 0;
        this.specialLabel.node.opacity = 0;
        this.hitTypeIcon.node.opacity = 0;
        let skeletonData = this.skeletonDatas[specialType];
        if(skeletonData && this.specialSpine) {
            this.specialSpine.node.active = true;
            this.specialSpine.skeletonData = skeletonData;
            this.specialSpine.animation = 'animation';
            this.specialSpine.loop = false;
            this.specialSpine.setCompleteListener(() => {
                this.specialSpine.animation = '';
                this.specialSpine.setCompleteListener(null);
                this.specialSpine.clearTracks();
                this.specialSpine.skeletonData = null;
                callBack && callBack();
            });
            this._realshowSpecialAni(rootNode, param);
        } else {
            this.specialSpine.animation = '';
            this.specialSpine.skeletonData = null;
            callBack && callBack();
        }
    }

    

    private _getFont(specialType: DETAIL_TYPE): cc.Font {
        return this.specialFonts[specialType]? this.specialFonts[specialType]:this.specialFonts[DETAIL_TYPE.POWER];
    }

    private _getSpecialIcon(specialType: DETAIL_TYPE): cc.SpriteFrame {
        return this.specialIcons[specialType];
    }
}