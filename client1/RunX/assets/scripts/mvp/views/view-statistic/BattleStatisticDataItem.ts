/*
 * @Description:
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-10-21 20:03:35
 * @LastEditors: lixu
 * @LastEditTime: 2021-10-25 11:39:51
 */
const {ccclass, property} = cc._decorator;

interface BattleStatisticDataInfo{
    dataName? : string,
    dataValue?: number,
    dataMaxValue?: number
}

const dataGraphPosx : number = 75;
const AnimFrameCount: number = 60;

@ccclass
class BattleStatisticDataItem extends cc.Component {

    @property totalLen: number = 400;
    @property(cc.Label) dataName: cc.Label = null;
    @property(cc.Label) dataValue: cc.Label = null;
    @property(cc.Node) dataGraph: cc.Node = null;

    private _graphLen: number = 0;
    private _data: BattleStatisticDataInfo = null;
    private _currFrame: number = 0;
    private _isEnemy: boolean = false;


    show(dataInfo: BattleStatisticDataInfo, isEnemy: boolean = false){
        this.node.active = true;
        this._data = dataInfo;
        this._isEnemy = isEnemy;
        this._init();
        this.dataName.string = dataInfo.dataName || '';
        if(dataInfo.dataMaxValue <= 0){
            this._graphLen = 0;
        }else{
            this._graphLen = Math.floor(Math.abs(dataInfo.dataValue) / Math.abs(dataInfo.dataMaxValue) * this.totalLen);
        }

        this.schedule(this._playAnim, 0, AnimFrameCount, 0.1);
    }

    private _init(){
        this.dataValue.string = '';
        this.dataGraph.width = 0;
        this.dataName.node.x =  Math.abs(this.dataName.node.x) * (this._isEnemy ? -1 : 1);
        let dataNameBg = cc.find('dataNameBg', this.node);
        dataNameBg.x = Math.abs(dataNameBg.x) * (this._isEnemy ? -1 : 1);
        this.dataGraph.anchorX = this._isEnemy ? 1 : 0;
        this.dataGraph.x = dataGraphPosx * (this._isEnemy ? -1 : 1);
        this.dataValue.node.x = this.dataGraph.x;
        this._currFrame = 0;
    }

    private _playAnim(){
        let graphLen = this._graphLen * this._currFrame / AnimFrameCount;
        let currDataValue = Math.floor(this._data.dataValue * this._currFrame / AnimFrameCount);
        this.dataValue.string = `${currDataValue}`;
        this.dataGraph.width = graphLen;
        this.dataValue.node.x = this.dataGraph.x + graphLen / 2 * (this._isEnemy ? -1 : 1);
        if(this._currFrame >= AnimFrameCount){
            this.unschedule(this._playAnim);
            return;
        }
        this._currFrame += 1;
    }

    deInit(){
        this.unschedule(this._playAnim);
        this._data = null;
    }

    onRelease(){
        this.deInit();
    }
}

export {
  BattleStatisticDataInfo,
  BattleStatisticDataItem
}
