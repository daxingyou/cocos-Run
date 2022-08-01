import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configCache } from "../../../common/ConfigCache";
import { configManager } from "../../../common/ConfigManager";
import { cfg } from "../../../config/config";


const {ccclass, property} = cc._decorator;

const MIN_H = 110;

@ccclass
export default class TipsWuDaoSkill extends ViewBaseComponent {
    @property(cc.Node) baseSKillNode: cc.Node = null;
    @property(cc.Node) nextSkillNode: cc.Node = null;
    @property(cc.Node) lineNode: cc.Node = null;

    onInit(groupID: number, skillType: number, curLv: number) {
        let wuDaoCache = configCache.getWuDaoCfgsByTeamID(groupID);
        let skills = wuDaoCache.Skills.get(skillType);

        let curLvCfg: cfg.LeadEnlightenment = null;

        let firstLvCfg: cfg.LeadEnlightenment = configManager.getConfigByKey('LeadEnlightenment', skills[0]);
        let isLock = curLv < firstLvCfg.LeadEnlightenmentLevel;

        if(isLock) {
            curLvCfg = firstLvCfg;
            this.nextSkillNode.active = false;
            this.lineNode.active = false;
            let baselvTip = this.baseSKillNode.getChildByName('lvTip').getComponent(cc.Label);
            baselvTip.string = `解锁等级：${curLvCfg.LeadEnlightenmentLevel}`;
            let skillIntroLb = this.baseSKillNode.getChildByName('skillIntroduceLb').getComponent(cc.Label);
            if((curLvCfg as any)[`LeadEnlightenmentSkillId${skillType}`]) {
                let skillCfg: cfg.Skill = configUtils.getSkillConfig((curLvCfg as any)[`LeadEnlightenmentSkillId${skillType}`]);
                skillIntroLb.string = skillCfg.Illustrate;
            } else if((curLvCfg as any)[`LeadEnlightenmentSkillChangeId${skillType}`]){
                let skillCfg: cfg.SkillChange = configUtils.getSkillChangeConfig((curLvCfg as any)[`LeadEnlightenmentSkillChangeId${skillType}`]);
                skillIntroLb.string = skillCfg.Desc;
            }
            //@ts-ignore
            skillIntroLb._forceUpdateRenderData();
            let baseH = Math.max(MIN_H, baselvTip.node.y + skillIntroLb.node.height + 20);
            this.baseSKillNode.height = baseH;
            this.baseSKillNode.parent.height = baseH + 20;
            this.baseSKillNode.parent.parent.height = baseH + 30;
            this.baseSKillNode.y = (this.baseSKillNode.parent.height >> 1) - 20;
            return;
        }

        let maxLvCfg: cfg.LeadEnlightenment = configManager.getConfigByKey('LeadEnlightenment', skills[skills.length - 1]);
        let isMax = curLv >= maxLvCfg.LeadEnlightenmentLevel;
        if(isMax) {
            curLvCfg = maxLvCfg;
            this.nextSkillNode.active = false;
            this.lineNode.active = false;
            let baselvTip = this.baseSKillNode.getChildByName('lvTip').getComponent(cc.Label);
            baselvTip.string = `已满级`;

            let skillIntroLb = this.baseSKillNode.getChildByName('skillIntroduceLb').getComponent(cc.Label);
            if((curLvCfg as any)[`LeadEnlightenmentSkillId${skillType}`]) {
                let skillCfg: cfg.Skill = configUtils.getSkillConfig((curLvCfg as any)[`LeadEnlightenmentSkillId${skillType}`]);
                skillIntroLb.string = skillCfg.Illustrate;
            } else if((curLvCfg as any)[`LeadEnlightenmentSkillChangeId${skillType}`]){
                let skillCfg: cfg.SkillChange = configUtils.getSkillChangeConfig((curLvCfg as any)[`LeadEnlightenmentSkillChangeId${skillType}`]);
                skillIntroLb.string = skillCfg.Desc;
            }
            //@ts-ignore
            skillIntroLb._forceUpdateRenderData();

            let baseH = Math.max(MIN_H, skillIntroLb.node.y + skillIntroLb.node.height + 20);
            this.baseSKillNode.height = baseH;
            this.baseSKillNode.parent.height = baseH + 20;
            this.baseSKillNode.parent.parent.height = baseH + 30;
            this.baseSKillNode.y = (this.baseSKillNode.parent.height >> 1) - 20;
            return;
        }

        let low = 0, high = skills.length - 1, curLvIdx = -1;
        while(low <= high) {
            let mid = low + ((high - low) >> 1);
            let midCfg: any = configManager.getConfigByKey('LeadEnlightenment', skills[mid]);
            if(midCfg.LeadEnlightenmentLevel == curLv) {
               curLvCfg = midCfg;
               curLvIdx = mid;
               break;
            }
            if(midCfg.LeadEnlightenmentLevel <= curLv) {
                low = mid + 1;
                curLvCfg = midCfg;
                curLvIdx = mid;
            } else {
                high = mid - 1;
            }
        }

        this.lineNode.active = true;
        this.nextSkillNode.active = true;
        let baselvTip = this.baseSKillNode.getChildByName('lvTip').getComponent(cc.Label);
        baselvTip.string = '';
        let skillIntroLb = this.baseSKillNode.getChildByName('skillIntroduceLb').getComponent(cc.Label);
        if((curLvCfg as any)[`LeadEnlightenmentSkillId${skillType}`]) {
            let skillCfg: cfg.Skill = configUtils.getSkillConfig((curLvCfg as any)[`LeadEnlightenmentSkillId${skillType}`]);
            skillIntroLb.string = skillCfg.Illustrate;
        } else if((curLvCfg as any)[`LeadEnlightenmentSkillChangeId${skillType}`]){
            let skillCfg: cfg.SkillChange = configUtils.getSkillChangeConfig((curLvCfg as any)[`LeadEnlightenmentSkillChangeId${skillType}`]);
            skillIntroLb.string = skillCfg.Desc;
        }
        //@ts-ignore
        skillIntroLb._forceUpdateRenderData();

        let totalH = 0;
        let baseH = Math.max(MIN_H, baselvTip.node.y + skillIntroLb.node.height + 40);
        totalH += baseH;
        this.baseSKillNode.height = baseH;


        let nextLvCfg: cfg.LeadEnlightenment = configManager.getConfigByKey('LeadEnlightenment', skills[curLvIdx + 1]);
        let nextlvTip = this.nextSkillNode.getChildByName('lvTip').getComponent(cc.Label);
        nextlvTip.string = `解锁等级：${nextLvCfg.LeadEnlightenmentLevel}`;
        let nextSkillIntroLb = this.nextSkillNode.getChildByName('skillIntroduceLb').getComponent(cc.Label);
        if((nextLvCfg as any)[`LeadEnlightenmentSkillId${skillType}`]) {
            let skillCfg: cfg.Skill = configUtils.getSkillConfig((nextLvCfg as any)[`LeadEnlightenmentSkillId${skillType}`]);
            nextSkillIntroLb.string = skillCfg.Illustrate;
        } else if((nextLvCfg as any)[`LeadEnlightenmentSkillChangeId${skillType}`]){
            let skillCfg: cfg.SkillChange = configUtils.getSkillChangeConfig((nextLvCfg as any)[`LeadEnlightenmentSkillChangeId${skillType}`]);
            nextSkillIntroLb.string = skillCfg.Desc;
        }
        //@ts-ignore
        nextSkillIntroLb._forceUpdateRenderData();
        let nextH = Math.max(MIN_H, nextlvTip.node.y + nextSkillIntroLb.node.height + 40);
        totalH += nextH;

        this.baseSKillNode.parent.height = totalH + 20;
        this.baseSKillNode.parent.parent.height = totalH + 30;
        this.baseSKillNode.y = (this.baseSKillNode.parent.height >> 1) - 20;
        this.lineNode.y =

        this.lineNode.y = this.baseSKillNode.y - baseH + 2;
        this.nextSkillNode.y = this.baseSKillNode.y - baseH - 20;
    }

    onRelease() {

    }
}
