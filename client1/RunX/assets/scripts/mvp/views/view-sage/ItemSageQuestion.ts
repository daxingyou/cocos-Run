const { ccclass, property } = cc._decorator;

@ccclass export default class ItemSageQuestion extends cc.Component {

    @property(cc.Label) lbAnswer: cc.Label = null;
    @property(cc.Label)  lbQuestion: cc.Label = null;

    private _answerIdx: number = -1;
    private _selectHandler: Function = null;

    onInit (answer: string, desc: string, answerIdx: number, select: Function) {
        this.lbAnswer.string = answer;
        this.lbQuestion.string = desc;
        this._answerIdx = answerIdx;
        this._selectHandler = select;
    }

    onSelect () {
        this._selectHandler && this._selectHandler(this._answerIdx)
    }
}