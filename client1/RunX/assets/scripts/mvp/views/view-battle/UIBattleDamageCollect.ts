/*
 * @Description:
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2022-06-17 18:27:07
 * @LastEditors: lixu
 * @LastEditTime: 2022-06-20 19:00:01
 */
const {ccclass, property} = cc._decorator;

@ccclass
export default class UIBattleDamageCollect extends cc.Component {
    @property(cc.ProgressBar) damagePb: cc.ProgressBar = null;
    @property(cc.Label) damageLb: cc.Label = null;
    @property(cc.Node) boxNode: cc.Node = null;
    @property(cc.Label) boxLv: cc.Label = null;

    private _isInited: boolean = false;
    private _damageLv: number[] = null;
    private _curLvIdx: number = 0;
    private _curDamage: number = 0;

    get totalDamage() {
        return this._curDamage;
    }

    init(damageLv: number[]) {
        this._isInited = true;
        this._damageLv = damageLv;
        this._curLvIdx = 0;
        this.boxLv.string = '';
        this.node.active = true;
        this._updateProgress();
    }

    deInit() {
        cc.Tween.stopAllByTarget(this.damagePb);
        cc.Tween.stopAllByTarget(this.boxNode);
        cc.Tween.stopAllByTarget(this.boxLv.node);
        this._isInited = false;
        this.node.active = false;
        this._damageLv = null;
        this._curDamage = 0;
        this._curLvIdx = 0;
    }

    updateDamage(offset: number) {
        if(!this._isInited) return;
        if(offset == 0) return;
        this._curDamage += Math.abs(offset);

        while(this._curDamage >= this._damageLv[this._curLvIdx]){
            this._curLvIdx += 1;
        }
        this._updateProgress();
    }

    private _updateProgress() {
        let lastStr = this.boxLv.string;
        let curStr =  this._curLvIdx <= 0 ? '' : `X${this._curLvIdx}`;
        if(lastStr != curStr) {
           this.boxLv.string = curStr;
           cc.Tween.stopAllByTarget(this.boxNode);
           this.boxNode.rotation = 0;
           let tween = cc.tween().to(0.05,{angle: -20}).to(0.05, {angle: 0}).to(0.05, {angle: 20}).to(0.05, {angle: 0});
           cc.tween(this.boxNode).repeat(3, tween).start();
           cc.Tween.stopAllByTarget(this.boxLv.node);
           cc.tween(this.boxLv.node).to(0.1, {scale: 3}, {easing: 'backOut'}).to(0.1, {scale: 1}).start();
        }

        let curDamage =this._curDamage;
        this.damageLb.string = `${curDamage}/${this._damageLv[this._curLvIdx]}`;

        let curProgress = this.damagePb.progress;
        let targetProgress = Math.floor(curDamage/this._damageLv[this._curLvIdx]* 1000) / 1000;
        if(curProgress >= targetProgress) {
            this.damagePb.progress = targetProgress;
        } else {
            cc.Tween.stopAllByTarget(this.damagePb);
            cc.tween(this.damagePb).to(0.2, {progress: targetProgress}).start();
        }
    }
}
