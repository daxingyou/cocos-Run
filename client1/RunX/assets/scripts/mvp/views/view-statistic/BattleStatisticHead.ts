import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";

/*
 * @Description:
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-10-21 19:41:51
 * @LastEditors: lixu
 * @LastEditTime: 2021-10-27 11:01:47
 */
const {ccclass, property} = cc._decorator;

interface BattleStatisticHeadInfo{
    headUrl? : string,
    name? : string,
    hpDesc? : string,
}

@ccclass
class BattleStatisticHead extends cc.Component {
    @property(cc.Sprite) roleHead: cc.Sprite = null;
    @property(cc.Label) roleName: cc.Label = null;
    @property(cc.Label) roleHp: cc.Label = null;

    private _spLoader: SpriteLoader = null;

    showRoleInfo(headInfo: BattleStatisticHeadInfo){
        if(!headInfo) return;
        this.node.active = true;
        this._spLoader = this._spLoader || new SpriteLoader();
        headInfo.headUrl && headInfo.headUrl.length > 0 && this._spLoader.changeSprite(this.roleHead, headInfo.headUrl);
        this.roleName.string = headInfo.name || '';
        this.roleHp.string = headInfo.hpDesc || '';
    }

    deInit(){
        this._spLoader && this._spLoader.release();
        this._spLoader = null;
    }

    onRelease(){
        this.deInit();
    }
}

export {
  BattleStatisticHead,
  BattleStatisticHeadInfo
}
