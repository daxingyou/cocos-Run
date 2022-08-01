
/*
 * @Author:xuyang
 * @Date: 2021-06-09 14:21:03
 * @Description: 角色升级弹窗
 */
import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { useInfoEvent } from "../../../common/event/EventData";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { userData } from "../../models/UserData";

const { ccclass, property } = cc._decorator;
@ccclass
export default class LevelUpView extends ViewBaseComponent {

    @property(cc.Label) txtLv: cc.Label = null;
    @property(cc.Label) txtLvNew: cc.Label = null;
    @property(cc.Label) txtLvOld: cc.Label = null;
    @property(cc.Node) tipsLabel: cc.Node = null;

    // 新功能开启提示
    @property(cc.Label) titleNewLb: cc.Label = null;
    @property(cc.Label) physicalLb: cc.Label = null;
    @property(cc.Node) newFuncNode: cc.Node = null;
    @property(cc.Node) newFuncItem: cc.Node = null;

    private _sprLoader = new SpriteLoader();

    onInit(oldLv: number) {
      
        this.showLevelInfo(oldLv);
        this.showPhysicalInfo();
        this.showNewOpenFunc();

        cc.tween(this.tipsLabel)
            .to(1.5, { opacity: 64 }, { easing: "sineOut" })
            .to(1.5, { opacity: 255 }, { easing: "sineIn" })
            .union().repeatForever().start();

        //全局同步体力值刷新
        eventCenter.fire(useInfoEvent.USER_LEVEL_CHANGE)
    }

    showLevelInfo(oldLv: number){
        let newLv = userData.lv;
        this.txtLv.string = newLv.toString();
        this.txtLvNew.string = newLv.toString();
        this.txtLvOld.string = oldLv.toString();
    }

    showPhysicalInfo(){
        let cfg = configUtils.getBasicConfig();
        if (cfg) {
            if (cfg.LevelUpGet)
                this.physicalLb.string = `获得额外体力：+${cfg.LevelUpGet}\n`;
            if (cfg.LevelUpMax)
                this.physicalLb.string += `恢复体力上限：+${cfg.LevelUpMax}`;
        }
    }

    showNewOpenFunc(){
        let newFuncCfg = this.checkNewOpenFunc();
        let haveOpenFunc = true;
        if (!newFuncCfg.length) {
            newFuncCfg = this.checkIncomingFunc();
            haveOpenFunc = false;
        }

        this.newFuncNode.removeAllChildren();
        newFuncCfg.forEach(_cfg =>{
            let newItem = cc.instantiate(this.newFuncItem);
            let nameLb = newItem.getChildByName('name');
            let levelLb = newItem.getChildByName('level');
            let icon = newItem.getComponentInChildren(cc.Sprite);

            newItem.parent = this.newFuncNode;
            newItem.active = true;
            newItem.y = 0;

            nameLb.getComponent(cc.Label).string = _cfg.FunctionExplain;
            levelLb.active = !haveOpenFunc;
            levelLb.getComponent(cc.Label).string = _cfg.FunctionOpenCondition.split('|')[1] + '级开启';

            // icon
            if (icon && _cfg.FunctionShowIcon){
                this._sprLoader.changeSprite(icon, _cfg.FunctionShowIcon);
            }
        })

        this.newFuncNode.active = !!newFuncCfg.length;
        this.titleNewLb.node.active = !!newFuncCfg.length;
        this.titleNewLb.string = haveOpenFunc ? '新功能开启' : '即将开启功能';
    }

    checkNewOpenFunc() {
        let funcCfgs: cfg.FunctionConfig[] = configManager.getConfigList("function");
        let newLv = userData.lv;
        funcCfgs = funcCfgs.filter((_cfg: cfg.FunctionConfig)=>{
            if (_cfg.FunctionOpenShow && _cfg.FunctionOpenCondition){
                let openCond = _cfg.FunctionOpenCondition.split('|');
                if (openCond[0] && openCond[0] == '1' && openCond[1] && openCond[1] == newLv.toString()){
                    return true;
                }
            }
            return false;
        })

        return funcCfgs;
    }

    checkIncomingFunc(){
        let funcCfgs: cfg.FunctionConfig[] = configManager.getConfigList("function");
        let newLv = userData.lv;
        let moduleCfg = configUtils.getModuleConfigs();
        funcCfgs = funcCfgs.filter((_cfg: cfg.FunctionConfig) => {
            if (_cfg.FunctionOpenShow && _cfg.FunctionOpenCondition) {
                let openCond = _cfg.FunctionOpenCondition.split('|').map(str =>{return Number(str)});
                if (openCond.length > 1 && openCond[0] == 1 && openCond[1] > newLv && openCond[1] <= (newLv + moduleCfg.OpenNoticeLevel || 0)) {
                    return true;
                }
            }
            return false;
        })

        return funcCfgs.slice(0, moduleCfg.OpenNoticeNum || 3);
    }

    //计算新旧等级
    checkUpgrade(exp: number) {
        let expConfigs = configUtils.getLevelExpConfigsByType(3);
        let lv: number = 0;
        if (exp) {
            let expCount: number = 0;
            for (const k in expConfigs) {
                expCount += expConfigs[k].LevelExpNeedNum;
                lv = Number(k);
                if (exp < expCount) {
                    break;
                }
            }
        }
        return [userData.lv, lv];
    }

    onRelease(){
        cc.tween(this.tipsLabel).stop();
        this.node.stopAllActions();
    }
}