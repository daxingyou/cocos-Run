import { audioCache, audioManager } from "../../../common/AudioManager";
import UIGridView, { GridData } from "../../../common/components/UIGridView";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import guiManager from "../../../common/GUIManager";
import { actionAddWholeSfx, actionDeleteWholeSfx, actionSelectWholeSfx, actionUpdateWholeSfx } from "./actions/EditorActions";
import EditorItemSfx from "./EditorItemSfx";
import { StateCurrSfx } from "./models/EditorConst";
import { getCurrSfxInfo, stateCurrSfx, stateCurrSkill } from "./reducers/EditorReducers";
import { store } from "./store/EditorStore";
import { EffectSfxInfo } from "./view-actor/CardSkill";

const {ccclass, property} = cc._decorator;

@ccclass
export default class EditorUISfxView extends ViewBaseComponent {
    @property(cc.Node) inspectorNode: cc.Node = null
    @property(cc.Label) duration: cc.Label = null;
    @property(cc.EditBox) fileName: cc.EditBox = null;
    @property(cc.EditBox) editDelay: cc.EditBox = null;
    @property(cc.EditBox) startTime: cc.EditBox = null;
    @property(UIGridView)       gridView: UIGridView = null;
    @property(cc.Prefab)        prefabItem: cc.Prefab = null;
    @property(cc.Button)        playBtn: cc.Button = null;
    @property(cc.Button)        addBtn: cc.Button = null;

    private _seleSoundId: number = 0;
    onInit () {
        this._seleSoundId = store.getState().stateCurrSfx.id;
        store.subscribe(stateCurrSkill, this._onCurrSkillChange, this);
        store.subscribe(stateCurrSfx, this._onCurrSfxChange, this);
        this.show();
    }

    onRelease () {
        const sfxInfo: EffectSfxInfo = getCurrSfxInfo(store.getState());
        sfxInfo && audioManager.stopSfxsByUrl(`sfx/skill/${sfxInfo.url}`);
        this.gridView.clear();
        store.unSubscribe(stateCurrSkill, this);
        store.unSubscribe(stateCurrSfx, this);
    }

    private _onCurrSkillChange () {
        this.show();
    }

    onCloseClick () {
        this.closeView();
    }

    onAddClick () {
        const info: EffectSfxInfo = {
            id: this._genID(),
        };
        store.dispatch(actionAddWholeSfx(info));
    }

    onClickPlay() {
        let audioName = this.fileName.string;
        if(!audioName || audioName.length == 0) {
            guiManager.showTips('还没配置音效，无法播放')
            return;
        }
        let audioPath = `sfx/skill/${audioName}`;
        let startTime = parseFloat(this.startTime.string);
        isNaN(startTime) && (startTime = 0);
        if(audioManager.isPlayingSfx(audioPath)) {
            guiManager.showTips('正在播放中');
            return;
        }
        audioManager.play(audioPath, false, null, startTime);
    }

    onClikcStop() {
        let audioName = this.fileName.string;
        if(!audioName || audioName.length == 0) {
            guiManager.showTips('还没配置音效，无法播放')
            return;
        }
        let audioPath = `sfx/skill/${audioName}`
        if(audioManager.isPlayingSfx(audioPath)){
            audioManager.stopSfxsByUrl(audioPath);
        }
    }

    onResetClick(){
        audioManager.stopAllEffects();
        this._updateLeftPanel();
    }

    onSaveClick(){ 
        let newSfxInfo = this._genData();
        if(!newSfxInfo || !newSfxInfo.url || newSfxInfo.url.length == 0){
            guiManager.showTips('保存失败！！！');
            return;
        }
        store.dispatch(actionUpdateWholeSfx(newSfxInfo));
        guiManager.showTips('保存成功');
    }

    private _genData(): EffectSfxInfo{
        if(this._seleSoundId <= 0) return null;
        let fileName = this.fileName.string;
        
        let startTime : number = parseFloat(this.startTime.string);
        isNaN(startTime) && (startTime = 0);
        
        let delay: number = parseFloat(this.editDelay.string);
        isNaN(delay) && (delay = 0);

        let sfxInfo: EffectSfxInfo = {
            id: this._seleSoundId,
            url: fileName,
        };
        
        (startTime != 0) && ( sfxInfo.start = startTime);
        (delay != 0) && (sfxInfo.delay = delay);
        delay != 0 && (sfxInfo.delay = delay);
        return sfxInfo;
    }

    show () {
        const sfxInfo: EffectSfxInfo = getCurrSfxInfo(store.getState());
        this.addBtn.node.active = !(sfxInfo);
        this.gridView.clear();
        this._updateLeftPanel();
        if(!sfxInfo) return;
        this.gridView.init([{
                key: `${sfxInfo.id}`,
                data: sfxInfo,
        }], {
            getItem: () => {
                const node = cc.instantiate(this.prefabItem);
                return node.getComponent(EditorItemSfx);
            },
            onInit: (item: EditorItemSfx, data: GridData) => {
                item.updateData(data.data, this._onSfxItemOperCb.bind(this));
                item.select = this._seleSoundId == data.data.id;
            },
            releaseItem: (item: EditorItemSfx) => {
                item.deInit();
                item.node.destroy();
            },
        });
       
    }

    private _genID(): number{
        let sfxInfos: EffectSfxInfo = getCurrSfxInfo(store.getState());
        if(!sfxInfos) return 1;
        
        return sfxInfos.id + 1;
    }

    private _onCurrSfxChange(cmd: string, state: StateCurrSfx){
        this._seleSoundId = state.id;
        if(this._seleSoundId <= 0) return;
        this.show();
    }

    private _updateLeftPanel(){
        const sfxInfos: EffectSfxInfo = getCurrSfxInfo(store.getState());
        if(this._seleSoundId == 0 || !sfxInfos){
            this.inspectorNode.active = false;
            return;
        }

        this.inspectorNode.active = true;
        
        audioCache.loadAudio(`sfx/skill/${sfxInfos.url}`, (err: Error, clip: cc.AudioClip) => {
            if(err) {
                this.fileName.string = '';
                this.duration.string = '';
                this.startTime.string = '';
                this.editDelay.string = ''
                return;
            }
            this.fileName.string = sfxInfos.url;
            this.duration.string = `${clip.duration}`;
            this.startTime.string = sfxInfos.start ? `${sfxInfos.start}` : '';
            this.editDelay.string = sfxInfos.delay ? `${sfxInfos.delay}` : '';
        });
    }

    private _onSfxItemOperCb(cmd: string, data: EffectSfxInfo){
        if(this._seleSoundId === data.id){
            this._seleSoundId = 0;
            store.dispatch(actionSelectWholeSfx(this._seleSoundId));
        }
        store.dispatch(actionDeleteWholeSfx(data));
    }
}
