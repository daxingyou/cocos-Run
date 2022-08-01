import { data } from "../../../network/lib/protocol";
import { HeroBasicInfo } from "../../models/HeroData";
import { optManager } from "../../operations/OptManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class HeroListItem extends cc.Component {
    @property({ type: cc.Sprite, tooltip: '英雄品质框' }) heroQualityCircleSp: cc.Sprite = null;
    @property({ type: cc.Sprite, tooltip: '英雄头像' }) heroHeadSp: cc.Sprite = null;
    @property({ type: cc.Sprite, tooltip: '英雄类型Icon' }) heroTypeSp: cc.Sprite = null;
    @property({ type: cc.Node, tooltip: '星级父节点' }) levelStarParent: cc.Node = null;
    @property({ type: cc.Node, tooltip: '未合成的蒙版' }) lockStateNode: cc.Node = null;
    @property({ type: cc.Node, tooltip: '满足合成时的提示' }) canUnlockTips: cc.Node = null;
    @property({ type: cc.Label, tooltip: '等级' }) heroLvLb: cc.Label = null;

    onLoad() {

    }

    start() {

    }
    private _heroInfo: data.IBagUnit = null;
    setData(heroInfo: data.IBagUnit) {
        this._heroInfo = heroInfo;
        this.refreshView();
    }

    refreshView() {
        // todo 判断是否是完整英雄
        let heroConfig: HeroBasicInfo = null;
        if (optManager.bagDataOpt.checkIsHeroBasic(this._heroInfo.ID)) {
            heroConfig = optManager.bagDataOpt.getHeroBaseConfigById(this._heroInfo.ID);
            this.lockStateNode.active && (this.lockStateNode.active = false);
            this.canUnlockTips.active && (this.canUnlockTips.active = true);
            this.refreshStarView();
        } else if (optManager.bagDataOpt.checkIsHeroChip(this._heroInfo.ID)) {
            heroConfig = optManager.bagDataOpt.getHeroBaseConfigById(optManager.bagDataOpt.heroChipIdToBaseId(this._heroInfo.ID));
            !this.lockStateNode.active && (this.lockStateNode.active = true);
            // 可以合成
            if (optManager.bagDataOpt.checkHeroChipIsCanCompound(heroConfig.HeroBasicId)) {
                this.canUnlockTips.active = true;
            } else {
                this.canUnlockTips.active = false;
            }
        }
        // todo 根据英雄品质 显示不同的品质框
        // todo 显示英雄定位标签
        // todo 显示英雄头像
    }

    refreshStarView() {
        for (let i = 0; i < this.levelStarParent.childrenCount; ++i) {
            if (i < this._heroInfo.HeroUnit.Star) {
                !this.levelStarParent.children[i].active && (this.levelStarParent.children[i].active = true);
            } else {
                this.levelStarParent.children[i].active && (this.levelStarParent.children[i].active = false);
            }
        }
    }

    onClickItem() {
        // 改变为被选中状态
    }
}
