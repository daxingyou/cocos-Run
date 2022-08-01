import CreateGroupWindow from './CreateGroupWindow';
import RightContainor from './RightContainor';
import SaveWindow from './SaveWindow';
import ToastLayer from './ToastLayer';
import OpenWindow from './OpenWindow';
import MainController from './MainController';
import SettingWindow from './SettingWindow';

/*
 * @Description: 
 * @Autor: lixu
 * @Date: 2021-05-25 10:05:55
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-17 19:46:12
 */

/**
 * @description: 
 * @param {*}
 * @return {*}
 * @author: lixu
 */
const {ccclass, property} = cc._decorator;

let global: any =  {};

const RelativePathBulletConfig = 'Runx\\\\assets\\\\resources\\\\config\\\\bullets\\\\';

let saveFileBrowser =function (data: string, fileName: string) {
    var elementA = document.createElement('a');
    
    elementA.setAttribute('href', 'data:text/plain;charset=utf-8,' + data);
    elementA.setAttribute('download', `${fileName}.json`);
    elementA.style.display = 'none';
    document.body.appendChild(elementA);
    elementA.click();
    document.body.removeChild(elementA);
}

let saveFileNative = function(data:string, fileName: string) {
    if(!jsb.fileUtils.isDirectoryExist(global.savePath)){
        jsb.fileUtils.createDirectory(global.savePath);
    }

    let relativePath = 'client\\';
    let startIdx = global.savePath.indexOf(relativePath);
    let absolutePath = (global.savePath as string).substring(0, startIdx + relativePath.length + 1);
    absolutePath = `${absolutePath}${RelativePathBulletConfig}`;
    if(!jsb.fileUtils.isDirectoryExist(absolutePath)){
        jsb.fileUtils.createDirectory(absolutePath);
    }

    let path = `${global.savePath}${fileName}.json`;
    if(jsb.fileUtils.isFileExist(path)){
        jsb.fileUtils.removeFile(path);
    }

    let proPath = `${absolutePath}${fileName}.json`;
    if(jsb.fileUtils.isFileExist(proPath)){
        jsb.fileUtils.removeFile(proPath);
    }

    if(jsb.fileUtils.writeStringToFile(data, path) && jsb.fileUtils.writeStringToFile(data, proPath)){
       global.showToastMsg("子弹组保存成功"); 
    }
}

let readConfig = function(path: string):string {
    if(!jsb.fileUtils.isFileExist(path)){
        global.showToastMsg(`文件${path}不存在`);
        return;
    }
    let content = jsb.fileUtils.getStringFromFile(path);
    global.showToastMsg(`文件加载完成`);
    return content;
}

@ccclass
export default class Main extends cc.Component {
    @property(CreateGroupWindow) createGroupWindow: CreateGroupWindow = null;
    @property(RightContainor) rightContainor: RightContainor = null;
    @property(ToastLayer) toastLayer: ToastLayer = null;
    @property(SaveWindow) saveWindow: SaveWindow = null;
    @property(cc.TextAsset)  nativeSaveConfig: cc.TextAsset = null;
    @property(OpenWindow) openLayer: OpenWindow = null;
    @property(MainController) mainController: MainController = null;
    @property(cc.Node) shadeLayer: cc.Node = null;
    @property(SettingWindow) settingWindow: SettingWindow = null;
    
    private static _ins: Main = null;

    static getInstance(): Main{
        return Main._ins;
    }

    private _isPreview: boolean = false;
    private _isLoadedEffect: boolean = false;
    
    onLoad(){
        Main._ins = this;
        this.shadeLayer.active = false;
        global.toastLayer = this.toastLayer;
        let config = JSON.parse(this.nativeSaveConfig.text);
        global.savePath = config.savePath;
        global.bulletConfigPath = config.bulletConfigPath,
        global.bulletConfigSrc = config.syncPath;
        global.syncResPath = config.syncResPath;
        global.targetResPath = config.targetResPath;
        global.syncList = config.syncList;
        global.bulletPrefabPath = "prefabs/bullets/";
        this._checkBulletConfig();
        cc.director.getCollisionManager().enabled = true;
    }

    start(){
        this.mainController.setHeroVisible(false);
    }

    //检查子弹配置文件是否存在
    private _checkBulletConfig(){
        if(!cc.sys.isNative || cc.sys.OS_WINDOWS != cc.sys.os) return;
        if(!jsb.fileUtils.isDirectoryExist(global.bulletConfigPath)){
            jsb.fileUtils.createDirectory(global.bulletConfigPath);
        }
        
        if(!jsb.fileUtils.isFileExist(`${global.bulletConfigPath}ConfigRunXBullet.json`)){
            let data: string = jsb.fileUtils.getStringFromFile(global.bulletConfigSrc);
            let startIdx = data.indexOf('[');
            data = data.substring(startIdx);
            jsb.fileUtils.writeStringToFile(data, `${global.bulletConfigPath}ConfigRunXBullet.json`);
        }
        this._loadBulletConfigs();
    }

    //加载子弹配置
    private _loadBulletConfigs(){
        let data = jsb.fileUtils.getStringFromFile(`${global.bulletConfigPath}ConfigRunXBullet.json`);
        let configs = JSON.parse(data);
        if(!configs || !Array.isArray(configs) || configs.length == 0){
            global.showToastMsg("子弹配置文件异常，先同步资源下试试！！！");
            return;
        }
        let bulletConfigs = new Map<any, any>();
        for(let i = 0, len = configs.length; i < len; i++){
            bulletConfigs.set(configs[i].BulletID, configs[i]);
        }
        global.bulletCongigs = bulletConfigs;
    }
    
    onClickNewGroup(){
        this.createGroupWindow.show((name:string)=>{
            this._createNewGroup(name);
        });
    }

    onClickOpenGroup(){
        this.openLayer.show((path:string)=>{
            let content = readConfig(path);
            this.rightContainor.parseData(content);
        });
    }

    onClickSave(){
        let data = this.rightContainor.getConfigData();
        if(data){
            this.saveWindow.show((fileName:string) =>{
                if(cc.sys.isNative){
                    saveFileNative(data, fileName);
                    return;   
                }
                saveFileBrowser(data, fileName);
            });
        }
    }

    onClickSyncRes(){
        if(!cc.sys.isNative || cc.sys.os != cc.sys.OS_WINDOWS){
            global.showToastMsg('该操作目前仅支持Window平台');
            return;
        }
        
        this.shadeLayer.active = true;
        new Promise((resolve, reject)=> {
            //同步子弹配置
            if(jsb.fileUtils.isDirectoryExist(global.bulletConfigPath)){
                jsb.fileUtils.removeDirectory(global.bulletConfigPath);
            }
            this._checkBulletConfig();

            //同步子弹资源
            for(let k in global.syncList){
                let obj = global.syncList[k];
                let srcPath = `${global.syncResPath}${obj.src}`;
                let targetPath = `${global.targetResPath}${obj.target}`;
                if(!jsb.fileUtils.isDirectoryExist(targetPath)){
                    jsb.fileUtils.createDirectory(targetPath);
                }
                
                let files: string[] = jsb.fileUtils.listFiles(srcPath);
                files.forEach(ele => {
                    if(ele.endsWith(".png") 
                    || ele.endsWith(".plist") 
                    || ele.endsWith(".meta") 
                    || ele.endsWith(".anim")
                    || ele.endsWith(".prefab")){
                        let name = ele.substring(ele.lastIndexOf('/') + 1);
                        let fullName = `${targetPath}${name}`;
                        if(jsb.fileUtils.isFileExist(fullName)) return;
                        //@ts-ignore
                        let data = jsb.fileUtils.getDataFromFile(ele);
                        //@ts-ignore
                        jsb.fileUtils.writeDataToFile(data, `${targetPath}${name}`);
                        
                    }
                })
            }
            resolve(true);
        }).then(() => {
            this.shadeLayer.active = false;
            global.showToastMsg('资源同步完成，请重新启动编辑器');
        }).catch((msg: string)=>{
            global.showToastMsg(msg);
            this.shadeLayer.active = false;
        });
    }

    onSelectShowSelfPos(toggle: cc.Toggle){
        this.mainController.setHeroVisible(toggle.isChecked);
    }

    onClickSetting(){
        let heroPos = this.mainController.node.convertToWorldSpaceAR(this.mainController.roleComp.node.getPosition());
        this.settingWindow.show((...rest: any[]) => {
            let newPos: cc.Vec2 = rest[0];
            this.mainController.debugView.updateHeroPos(newPos);
            this.mainController.roleComp.node.setPosition(this.mainController.node.convertToNodeSpaceAR(newPos));
        }, heroPos);
    }

    //预览
    onClickPreview(event: cc.Event){
        if(!this._isLoadedEffect){
            this.shadeLayer.active = true;
            new Promise((resolve, reject)=>{
                cc.resources.loadDir(global.bulletPrefabPath, cc.Prefab, (error: Error, assets: cc.Prefab[]) =>{
                    if(error){
                        reject();
                        return;
                    }
                    resolve(assets);
                });
            }).then((assets:  cc.SpriteAtlas[])=>{
                this._isLoadedEffect = true;
                this.shadeLayer.active = false;
                this.onClickPreview(event);
            }).catch(() =>{
                global.showToastMsg('子弹资源加载失败');
                cc.find('Background/Label',event.target).getComponent(cc.Label).string = "预览"
                this.mainController.stopPreview();
                this._isPreview = false;
            });
            return;
        }

        if(!this._isPreview){
            let data = this.rightContainor.getConfigData();
            if(data){
                let emitInterval: number = this.rightContainor.getEmitInterval();
                if(this.mainController.startPreview(JSON.parse(data), emitInterval)){
                    this.rightContainor.node.active = false;
                    let pos = this.mainController.node.convertToWorldSpaceAR(this.mainController.roleComp.node.getPosition());
                    this.mainController.debugView.updateHeroPos(pos);
                    cc.find('Background/Label',event.target).getComponent(cc.Label).string = "停止预览";
                    this._isPreview = true;
                }
            }else{
                global.showToastMsg('当前子弹组配置异常，仔细检查配置数据后重试');
            }
        }else{
            //停止预览
            cc.find('Background/Label',event.target).getComponent(cc.Label).string = "预览"
            this.mainController.stopPreview();
            this.rightContainor.node.active = true;
            this._isPreview = false;
        }
    }

    private _createNewGroup(name: string){
        this.rightContainor.createNewGroup(name);
    }
}

global.showToastMsg = (msg) =>{
    global.toastLayer.showToast(msg);
}
export {
    global
}