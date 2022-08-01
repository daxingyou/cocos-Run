// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html
cc.Class({
    extends: cc.Component,

    properties: {
        completeEvent: cc.Component.EventHandler,
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {
    },

    onLoad (){
        this._input = document.createElement('input');
        this._input.type = 'file';
        this._input.onchange = (e) => {
            let files = e.target.files;
            if (files.length == 0) {
                return;
            }
            let fileReader = new FileReader();
            fileReader.onload = (e) => {
                //获得数据
                let dataURL = e.target.result;
                cc.assetManager.loadRemote(dataURL, {ext: '.json'}, (error, asset) => {
                    cc.Component.EventHandler.emitEvents([this.completeEvent], asset.json);
                });
            }
            fileReader.readAsDataURL(files[0]);
        }
    },
    onClick(){
        this._input.click();
        this.node.parent.active = false;
    }
    // update (dt) {},
});
