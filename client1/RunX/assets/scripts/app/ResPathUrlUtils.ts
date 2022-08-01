/**
 * 资源路径管理类
 * zhy
 * 2021.5.27
 */

import { configManager } from "../common/ConfigManager";
import { logger } from "../common/log/Logger";
import { cfg } from "../config/config";
import { RES_ICON_PRE_URL } from "./AppConst";
import { HEAD_ICON, QUALITY_TYPE } from "./AppEnums";
import { configUtils } from "./ConfigUtils";

export default class ResPathUrlUtils {

    /**
     * 获得品质框Url 方形
     * @param id heroId或者equipId
     * @returns 
     */
    getQualityFrameUrl(id: number): string {
        let cfg: cfg.HeroBasic | cfg.Equip = configUtils.getHeroBasicConfig(id);
        if (!cfg) {
            cfg = configUtils.getEquipConfig(id);
            if (!cfg) {
                logger.error(`getQualityFrameUrl id err: ${id}`);
                return null;
            } else {
                return `textures/equip-quality/common_bg_character_${cfg.Quality}`;
            }
        } else {
            return `textures/equip-quality/common_bg_character_${cfg.HeroBasicQuality}`;
        }
    }

    getQualityHeroListBg(qualityId: number, type: string) {
        let cfg = configUtils.getQualityConfig(qualityId);
        if(cfg) {
            let textureName: string = '';
            if("heroBg" == type) {
                textureName = cfg.QualityHeroListBg;
            } else if("starBg" == type) {
                textureName = cfg.QualityHeroListStarBg;
            } else if("nameBg" == type) {
                textureName = cfg.QualityHeroListNameBg;
            }
            return `textures/hero-type/${textureName}`;
        }
        return null;
    }
    /**
     * 获得英雄 allType 资源Url
     * @param name 
     * @returns 
     */
    getHeroAllTypeIconUrl(name: string): string {
        return `${RES_ICON_PRE_URL.HERO_TYPE}${name}`;
    }

    /**
     * 获得英雄的职业类型icon路径
     * @param heroConfig 武将配置 
     * @returns 
     */
    getHeroTypeIconUrl(heroConfig: cfg.HeroBasic): string {
        let icon = this.getHeroTypeIcon(heroConfig)
        return `${RES_ICON_PRE_URL.HERO_TYPE}${icon}`;
    }

    getHeroTypeIcon(heroConfig: cfg.HeroBasic): string {
        let allTypeConfig = configManager.getConfigs('allType');
        let icon = "";
        for (const k in allTypeConfig) {
            let _cfg: cfg.ALLType = allTypeConfig[k];
            if (_cfg.HeroTypeForm == 1 && _cfg.HeroTypeFormNum == heroConfig.HeroBasicAbility) {
                icon = _cfg.HeroTypeIcon;
            }
        }
        return `${icon}`;
    }

    /**
     * 获得技能iconUrl
     */
    getSkillIconUrl(icon: string): string {
        return `${RES_ICON_PRE_URL.SKILL}${icon}`;
    }
    /**
     * 获得英雄品质icon (圆形)
     * @param quality 
     * @returns  
     */
    getHeroPropertyQualityIcon(quality: QUALITY_TYPE): string {
        return `${RES_ICON_PRE_URL.HERO_TYPE}quality${quality}`;
    }

    getEquipIcon(equipId: number) {
        let cfgs = configUtils.getEquipConfig(equipId);
        return `textures/item/${cfgs.Icon}`;
    }
    /**
     * 获得英雄头像品质框 （圆形）
     * @param quality 英雄品质
     */
    getHeroHeadQualityIcon(quality: number, circle: boolean = false): string {
        if (circle)
            return `${RES_ICON_PRE_URL.HERO_TYPE}roundbg_${quality}`;
        else 
            return `${RES_ICON_PRE_URL.HERO_TYPE}squarebg_${quality}`;
    }

    getBuffIconPath (res: string) {
        return `${RES_ICON_PRE_URL.BUFF_ICON}${res}`;
    }

    /**
     * 获得物品icon路径
     * @param itemId 物品ID
     * @description 如果是英雄奖励，必须传入头像框类型
     */
    getItemIconPath(itemId: number, headType?: HEAD_ICON): string {
        let url = ``;
        let cfg: any = null;
        if (headType) {
            cfg = configUtils.getHeroBasicConfig(itemId);
            let modelCfg: cfg.Model = null;
            if (cfg && cfg.HeroBasicModel) {
                modelCfg = configManager.getConfigByKey("model", cfg.HeroBasicModel);

            } else {
                cfg = configUtils.getMonsterConfig(itemId);
                if (cfg && cfg.ModelId) {
                    modelCfg = configManager.getConfigByKey("model", cfg.ModelId);
                }
            }
            if (modelCfg && modelCfg.ModelHeadIconSquare && headType == HEAD_ICON.SQUARE)
                url = `${RES_ICON_PRE_URL.HEAD_IMG}/${modelCfg.ModelHeadIconSquare}`;
            if (modelCfg && modelCfg.ModelHeadIconCircular && headType == HEAD_ICON.CIRCLE)
                url = `${RES_ICON_PRE_URL.HEAD_IMG}/${modelCfg.ModelHeadIconCircular}`;
            if (modelCfg && modelCfg.ModelHeadIconCircular && headType == HEAD_ICON.BIG)
                url = `${RES_ICON_PRE_URL.HEAD_IMG}/${modelCfg.ModelHeadIconBig}`;
        }

        if (!cfg) {
            cfg = configUtils.getItemConfig(itemId);
            if (cfg && cfg.ItemIcon)
                url = `textures/item/${cfg.ItemIcon}`
        }

        if (!cfg) {
            cfg = configUtils.getEquipConfig(itemId);
            if (cfg && cfg.Icon)
                url = `textures/item/${cfg.Icon}`;
        }

        return url;
    }

    getModelPhotoPath(modelId: number): string {
        let modelConfig = configUtils.getModelConfig(modelId);
        if (modelConfig) {
            return `${RES_ICON_PRE_URL.HERO_PHOTO}/${modelConfig.ModelPhoto}`;
        } else {
            logger.error(`getModelPhotoPath err: ${modelId}`);
            return null;
        }
    }

    /**
     * @description 获取召唤抽卡背景图
     * @param path 
     * @returns 
     */
    getSummonBg(path: string) {
        return "textures/summon-card/" + path;
    }

    getActivityBg(path: string) {
        return "textures/activity/" + path;
    }

    getModelSpinePath(modelId: number) {
        let modelConfig = configUtils.getModelConfig(modelId);
        if (modelConfig) {
            return `spine/role/${modelConfig.ModelAttack}`;
        } else {
            logger.error(`getModelSpinePath err: ${modelId}`);
            return null;
        }

    }

    getModelLive2dPath(modelName: string) {
        return `spine/model-live2d/${modelName}`;
    }

    /**
     * 获得天赋icon
     * @param iconName 
     * @returns 
     */
    getGiftIconPath(iconName: string) {
        return `${RES_ICON_PRE_URL.SKILL}${iconName}`;
    }

    getEquipSuitIconPath(suitId: number) {
        let suitCfg: cfg.EquipSuit = configUtils.getEquipSuitConfig(suitId);
        return `textures/suit/${suitCfg.SuitIcon}`;
    }
    /**
     * PVE列表背景图
     * @param bgName 
     * @returns 
     */
    getPveListBgRes(bgName: string) {
        return `textures/pve-image/${bgName}`;
    }
    /**
     * PVE列表背景图
     * @param bgName 
     * @returns 
     */
    getPvpListBgRes(bgName: string) {
        return `textures/pvp-image/${bgName}`;
    }

    getTreasureIconPath(groupIcon: string) {
        return `textures/treasure/${groupIcon}`;
    }

    getHeroCircleHeadIcon(modelId: number, type:HEAD_ICON){
        let modelConfig = configUtils.getModelConfig(modelId);
        if(!modelConfig) return null;

        if(type == HEAD_ICON.SQUARE)
            return `${RES_ICON_PRE_URL.HEAD_IMG}/${modelConfig.ModelHeadIconSquare}`;

        if(type == HEAD_ICON.CIRCLE)
            return `${RES_ICON_PRE_URL.HEAD_IMG}/${modelConfig.ModelHeadIconCircular}`;

        if(type == HEAD_ICON.BIG)
            return `${RES_ICON_PRE_URL.HEAD_IMG}/${modelConfig.ModelHeadIconBig}`;

        return null;
    }

    getIntroduceNameUrl(name: string) {
        return `${RES_ICON_PRE_URL.INTRODUCE_NAME}/${name}`;
    }

    getGuildBossHead(name: string): string {
        return `textures/head-hero/${name}`;
    }

    getGuildBossModel(name: string): string {
        return `textures/hero-model/${name}`;
    }

    getNeedTypeStarIcon(star: number) {
        return `textures/hero-type/star${star}`;
    }

    getNeedTypeQualityIcon(quality: number) {
        return `textures/hero-type/quality${quality}`;
    }

    getChapterTitleBgUrl(chapterBgName: string) {
        return `textures/hero-model/${chapterBgName}`;
    }

    getBeastBgPath(type: number) {
        return  `textures/hero-type/lingshou_bg_${type}`;
    }

    getBeastIconPath(type: number) {
        return  `textures/hero-type/lingshou_icon_${type}`;
    }

    getGongFengViewBgPath() {
        return `textures/gong-feng/sanhuang_bg`;
    }

    getGongFengStatueIconPath(statueID: number, isSmall: boolean = false) {
        if(isSmall) {
            return `textures/gong-feng/sanhuang_tx_${statueID}`;
        }
        return `textures/gong-feng/sanhuang_icon_${statueID}`;
    }


    getSkillIconPathByID (skillID: number): string{
      let skillCfg = configUtils.getSkillConfig(skillID);

      if(skillCfg) return this.getSkillIconUrl(skillCfg.Icon);

      let changeCfg = configUtils.getSkillChangeConfig(skillID);
      if(!changeCfg) return null;

      let skillId = changeCfg.NoumenonSkill ? changeCfg.NoumenonSkill.split('|')[0] : '0';
      let curSkillCfg = configUtils.getSkillConfig(parseInt(skillId));
      return this.getSkillIconUrl(curSkillCfg.Icon);
  }

  getBeastModel(name: string): string {
      return `${RES_ICON_PRE_URL.BEAST_MODEL}${name}`;
  }

    /** 获得英雄纯圆形头像品质框
     * @param quality 品质
     */
    getHeroCircleHeadFrame(quality: number) {
        if ([2, 3, 4, 5].indexOf(quality) === -1) {
            quality = 1;
        }

        return `${RES_ICON_PRE_URL.HEAD_QUALITY}circle_frame_hero_${quality}`;
    }

    /**
     * 获得Buff对应的ICON
     * @param heroTypeForm 英雄类型
     * @param heroTypeFormNum 英雄编号
     */
    getPveBuffIcon(heroTypeForm: number, heroTypeFormNum: number) {
        let allTypeConfig: {[key: number]: cfg.ALLType} = configManager.getConfigs('allType');
        let icon = "";
        for (let k in allTypeConfig) {
            if (allTypeConfig[k].HeroTypeForm === heroTypeForm
                && allTypeConfig[k].HeroTypeFormNum === heroTypeFormNum) {
                
                icon = `${RES_ICON_PRE_URL.HERO_TYPE}${allTypeConfig[k].HeroTypeIcon}`;
            }
        }
        return icon;
    }

    // 获取技能音效资源的路径
    getSkillSfxPathByID(url: string) {
        return `sfx/skill/${url}`
    }
}

let resPathUtils = new ResPathUrlUtils();
export {
    resPathUtils
}
