/*
 * @Author: xuyang
 * @Date: 2021-07-24 14:40:19
 * @FilePath: 文件导入按钮
 */
cc.Class({
    extends: cc.Component,

    properties: {
        completeEvent: cc.Component.EventHandler,
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
                cc.assetManager.loadRemote(dataURL, (error, asset) => {
                    cc.Component.EventHandler.emitEvents([this.completeEvent], asset._$nativeAsset);
                });
            }
            fileReader.readAsDataURL(files[0]);
        }
    },

    onClick(){
        this._input.click();
    }
    // update (dt) {},
});
