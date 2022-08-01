import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { data } from "../../../network/lib/protocol";
import { BattleArray } from "../view-scene/BattleArray";
import HeroHeadItem from "./HeroHeadItem";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PresetListComp extends cc.Component {

    @property([cc.Node]) teamsList: cc.Node[] = [];
    @property(cc.Prefab) heroHeadItemPfb: cc.Prefab = null;

    private _autoHide: boolean = false;

    onInit (autoHide: boolean) {
        this._autoHide = autoHide;
    }

    deInit () {
        for (let i = 0; i < this.teamsList.length; ++i) {
            for (let j = 0; j < this.teamsList[i].childrenCount; ++j) {
                let headitem: cc.Node = this.teamsList[i].children[j];
                if (headitem) {
                    headitem.getComponent(HeroHeadItem).deInit();
                }
            }
        }
    }

    onRefresh (data: {[key: string]: data.ITeamInfo}, currSelect: number = 0) {
        let maxTeams: number = configUtils.getModuleConfigs().PreinstallMax;
        for (let i = 0; i < maxTeams; ++i) {
            this.refreshTeamByIndex(i, data[i]);
        }

        if (this._autoHide) {
            this.teamsList.forEach((_c, _index) => {
                _c.parent.active = data[_index] && data[_index].Heroes && utils.getObjLength(data[_index].Heroes) > 0;
            });
        }
        this.updateSelect(currSelect);
    }

    updateSelect (currSelect: number) {
        if (currSelect != -1) {
            this.teamsList.forEach((_n, _idx) => {
                let selectNode = _n.parent.getChildByName("SELECT");
                selectNode.active = _idx == currSelect;
            })
        }
    }

     /**
     * 刷新一队的显示
     * @param index 
     */
    refreshTeamByIndex (index: number, v: data.ITeamInfo) {
        let datas = v;
        if(!datas || !datas.Heroes) {
           datas = {Index:index, Heroes: {}}
        }
        let teamNode: cc.Node = this.teamsList[index];
        let count = 5;
        if (teamNode.childrenCount > count) {
            count = teamNode.childrenCount;
        }

        for (let i = 0; i < count; ++i) {
            let heroHeadItem: cc.Node = teamNode.children[i];
            if (!heroHeadItem) {
                heroHeadItem = cc.instantiate(this.heroHeadItemPfb);
                teamNode.addChild(heroHeadItem);
                let posX: number = i * (heroHeadItem.width - 26) + heroHeadItem.width / 2;
                heroHeadItem.setPosition(cc.v2(posX, 0));
                heroHeadItem.scale = 0.7;
            }
            !heroHeadItem.active && (heroHeadItem.active = true);
            let item = heroHeadItem.getComponent(HeroHeadItem)
            item.setData(datas && datas.Heroes ? datas.Heroes[i] : null, true, false);
        }
    }

    // onRefreshBattleArrayInfo (battleArray?: BattleArray) {
    //     if (!battleArray || battleArray.size <= 1) {
    //         return;
    //     }
    //     for (let i = 0; i < 5; ++i) {
    //         let teamNode: cc.Node = this.teamsList[i];
    //         if (!teamNode || !cc.isValid(teamNode)) continue;

    //         for (let j = 0; j < teamNode.childrenCount; ++j) {
    //             let heroHeadItem: cc.Node = teamNode.children[i];
    //             let item = heroHeadItem.getComponent(HeroHeadItem)
    //             if (!item) continue;
    //             item.setBattleArrayInfo(battleArray);
    //         }
    //     }
    // }

}