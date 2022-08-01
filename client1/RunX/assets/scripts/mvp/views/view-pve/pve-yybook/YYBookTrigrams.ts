const {ccclass, property} = cc._decorator;

@ccclass
export default class YYBookTrigrams extends cc.Component {

    @property([cc.SpriteFrame]) defaultSpriteFrames: cc.SpriteFrame[] = []; 
    @property([cc.SpriteFrame]) selectedSpriteFrames: cc.SpriteFrame[] = [];

    @property(cc.Sprite) trigramsImage: cc.Sprite = null;
    @property(cc.Label) rewardIncrease: cc.Label = null;

    private _trigrams: number = null;

    init(trigrams: number) {
        this._trigrams = trigrams;
        this.cancleTrigrams();
    }

    deInit() {
        this.cancleTrigrams();
    }

    confirmTrigrams(increase: number, color: cc.Color) {
        this.trigramsImage.spriteFrame = this.selectedSpriteFrames[this._trigrams-1];

        if (increase > 0) {
            this.rewardIncrease.string = `奖励+${increase}%`;
            this.rewardIncrease.node.color = color;
            this.rewardIncrease.node.parent.active = true;
        } else {
            this.rewardIncrease.node.parent.active = false;
        }
    }

    cancleTrigrams() {
        this.trigramsImage.spriteFrame = this.defaultSpriteFrames[this._trigrams-1];
        this.rewardIncrease.node.parent.active = false;
    }
}
