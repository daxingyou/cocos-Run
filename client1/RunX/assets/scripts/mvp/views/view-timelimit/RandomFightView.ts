import { SCENE_NAME, VIEW_NAME } from "../../../app/AppConst";
import { PVE_MODE } from "../../../app/AppEnums";
import { PveConfig } from "../../../app/AppType";
import { utils } from "../../../app/AppUtils";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import guiManager from "../../../common/GUIManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { cfg } from "../../../config/config";
import { data } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { limitData } from "../../models/LimitData";
import { pveData } from "../../models/PveData";
import { userData } from "../../models/UserData";
import ItemBag from "../view-item/ItemBag";
import RandomBaseView from "./RandomBaseView";

const {ccclass, property} = cc._decorator;

@ccclass
export default class RandomFightView extends RandomBaseView {
    @property(cc.Node)              rewards: cc.Node = null;
    
    onRelease() {
        super.onRelease();
        let children = [...this.rewards.children]
        children.forEach(_t => {
            let item = _t.getComponent(ItemBag);
            _t.removeFromParent();
            if (item){
                item.deInit();
                ItemBagPool.put(item);
            }
        });
    }

    refreshView() {
        this._limitData.rewards.forEach((_r, _index) => {
            let item = this.rewards.children[_index];
            if(!item) {
                item = this.getItemShop();
                this.rewards.addChild(item);
            }
            let count = utils.longToNumber(_r.Count);
            item.getComponent(ItemBag).init({
                id: _r.ID,
                count: count,
                clickHandler: () => {
                    this.onClickItem(_r.ID, count);
                }
            });
        });
    }

    onClickFight() {
        // TODO 需要改到预设编队那里 点击开始才会战斗 请求这个
        // limitDataOpt.sendEnterLimitFightBattle(this._limitData.ID, this.);
        limitData.enterRandomFightBattle(this._limitData);
        let pveConfig: PveConfig = {
            lessonId: this._limitData.ID,
            userLv: userData.lv,
            pveMode: PVE_MODE.RANDOM_FIGHT,
        }
        pveData.pveConfig = pveConfig;
        guiManager.loadScene(SCENE_NAME.BATTLE);
    }

    onClickItem(itemId: number, count: number) {
        let cfg: any = configUtils.getItemConfig(itemId);
        if(cfg) {
            let newitem: data.IBagUnit = { ID: itemId, Count: count, Seq: 0 };
            super.loadView(VIEW_NAME.TIPS_ITEM, newitem);
            return;
        }
        cfg = configUtils.getEquipConfig(itemId);
        if(cfg) {
            let item: data.IBagUnit = bagDataUtils.buildDefaultEquip(itemId);
            super.loadView(VIEW_NAME.TIPS_EQUIP, item);
            return;
        }
        cfg = configUtils.getHeroBasicConfig(itemId);
        if(cfg) {
            let heroCfg = cfg as cfg.HeroBasic;
            super.loadView(VIEW_NAME.TIPS_HERO, heroCfg.HeroBasicId);
            return;
        }
    }

    getItemShop(): cc.Node {
        return ItemBagPool.get().node;
    }
}
