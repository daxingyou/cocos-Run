import { AntiAdditionCode } from "../../../app/AppEnums";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";

const { ccclass, property } = cc._decorator;

const INFO_NONAGE_LOGIN = `未成年人用户仅可周五、周六、周日和法定节假日每日20时至21时体验游戏，其他时间段禁用，请合理安排游戏时间，做适当身体活动。`

const INFO_NONAGE_LOGIN_FORBIDDEN = `您处于禁用时间段登录，系统将强制下线休息，请合理安排游戏时间，注意休息。`

// 预留
const INFO_NONAGE_TIMEOUT = `您已处于禁用时间段，系统将强制下线休息，请合理安排游戏时间，注意休息。`

const INFO_CHARGE_FORBIDDEN_UNDER_8 = `未满8岁的用户不能充值。`

const INFO_CHARGE_FORBIDDEN_8_16 = `8岁以上未满16岁的用户，单次充值金额不得超过50元人民币，每月充值金额累计不得超过200元人民币，请合理消费`

const INFO_CHARGE_FORBIDDEN_8_16_2 = `8岁以上未满16岁的用户，每月充值金额累计不得超过200元人民币，您已超额，请合理消费。`

const INFO_CHARGE_FORBIDDEN_16_18 = `16岁以上未满18岁的用户，单次充值金额不得超过100元人民币，每月充值金额累计不得超过400元人民币，请合理消费。`

const INFO_CHARGE_FORBIDDEN_16_18_2 = `16岁以上未满18岁的用户，每月充值金额累计不得超过400元人民币，您已超额，请合理消费。`


@ccclass
export default class AntiAddictionView extends ViewBaseComponent {

    @property(cc.Node)  ndNotice: cc.Node = null;
    @property(cc.Node)  ndMessage: cc.Node = null;
    @property(cc.Label) lbMessage: cc.Label = null;

    private _closeHandler: Function = null

    onInit (code: AntiAdditionCode, closeHandler?: Function) {
        this.ndNotice.active = false;
        this.ndMessage.active = false;

        let strMsg = "";
        switch (code) {
            case AntiAdditionCode.LOGIN: {
                this.ndNotice.active = true;
                break;
            }
            case AntiAdditionCode.NON_ADULT_NORMAL: {
                this.ndMessage.active = true;
                strMsg = INFO_NONAGE_LOGIN;
                break;
            }
            case AntiAdditionCode.NON_ADULT_TIME_FORBIDDEN: {
                this.ndMessage.active = true;
                strMsg = INFO_NONAGE_LOGIN_FORBIDDEN;
                break;
            }
            case AntiAdditionCode.NON_ADULT_TIMEOUT: {
                this.ndMessage.active = true;
                strMsg = INFO_NONAGE_TIMEOUT;
                break;
            }
            case AntiAdditionCode.NON_ADULT_UNDER8: {
                this.ndMessage.active = true;
                strMsg = INFO_CHARGE_FORBIDDEN_UNDER_8;
                break;
            }
            case AntiAdditionCode.NON_ADULT_8TO16: {
                this.ndMessage.active = true;
                strMsg = INFO_CHARGE_FORBIDDEN_8_16;
                break;
            }
            case AntiAdditionCode.NON_ADULT_8TO16_TOTAL: {
                this.ndMessage.active = true;
                strMsg = INFO_CHARGE_FORBIDDEN_8_16_2;
                break;
            }
            case AntiAdditionCode.NON_ADULT_16TO18: {
                this.ndMessage.active = true;
                strMsg = INFO_CHARGE_FORBIDDEN_16_18;
                break;
            }
            case AntiAdditionCode.NON_ADULT_16TO18_TOTAL: {
                this.ndMessage.active = true;
                strMsg = INFO_CHARGE_FORBIDDEN_16_18_2;
                break;
            }
            default: {
                this.onClickClose();
                break;
            }
        }

        this.lbMessage.string = strMsg;
        this._closeHandler = closeHandler
    }

    onClickClose () {
        this.closeView();
        this._closeHandler && this._closeHandler();
    }
}