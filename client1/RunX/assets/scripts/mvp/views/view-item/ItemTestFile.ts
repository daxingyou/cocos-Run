

const { ccclass, property } = cc._decorator;
@ccclass export default class ItemTestFile extends cc.Component {

    @property(cc.Label) lbName: cc.Label = null;
    @property(cc.Node) ndSetlect: cc.Node = null;

    private _file: string = "";
    set file (v: string) {
        this._file = v;
        this.lbName.string = v
    }

    get file () {
        return this._file;
    }

    set select (v: boolean) {
        this.ndSetlect.active = v;
    }

    get select () {
        return this.ndSetlect.active;
    }

    onClickSelect () {
        let origin = this.select
        this.select = !origin
    }
}