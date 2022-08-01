import { configManager } from "../common/ConfigManager";
import { logger } from "../common/log/Logger";
import { EFFECT_TYPE } from "./AppEnums";

declare var require: any;
class ConfigUtils {
    getHeroConfig (heroId: number): any {
        let cfg = configManager.getConfigByKey("hero", heroId);
        if (cfg) return cfg;
        else {
            logger.error("[ConfigUtils] cant find hero Config", heroId);
        }
        return null
    }

    getMonsterConfig (monsterId: number): any {
        let cfg = configManager.getConfigByKey("monster", monsterId);
        if (cfg) return cfg;
        else {
            logger.error("[ConfigUtils] cant find monster Config", monsterId);
        }
        return null
    }

    getGoodCofnig (goodId: number): any {
        let cfg = configManager.getConfigByKey("item", goodId);
        if (cfg) return cfg;
        else {
            logger.error("[ConfigUtils] cant find item Config", goodId);
        }
        return null
    }

    getSkillConfig (skillId: number): any {
        let cfg = configManager.getConfigByKey("skill", skillId);
        if (cfg) return cfg;
        else {
            logger.warn("[ConfigUtils] cant find skill", skillId);
        }
        return null
    }

    getConfig (type: EFFECT_TYPE, id: number) {
        if (type == EFFECT_TYPE.SKILL) {
            return this.getSkillConfig(id);
        } else if (type == EFFECT_TYPE.BUFF) {
            return this.getBuffConfig(id);
        }

        return null;
    }

    getBuffConfig (buffId: number): any {
        let cfg = configManager.getConfigByKey("buff", buffId);
        if (cfg) return cfg;
        else {
            logger.warn("[ConfigUtils] cant find buff", buffId);
        }
        return null
    }

    getHaloConfig (haloId: number): any {
        let cfg = configManager.getConfigByKey("halo", haloId);
        if (cfg) return cfg;
        else {
            logger.warn("[ConfigUtils] cant find halo", haloId);
        }
        return null
    }

    getEffectConfig (effectId: number): any {
        let cfg = configManager.getConfigByKey("effect", effectId);
        if (cfg) return cfg;
        else {
            logger.error("[ConfigUtils] cant find effect", effectId);
        }
        return null
    }


    getHallConfig(effectId: number): any {
        let cfg = configManager.getConfigByKey("hall", effectId);
        if (cfg) return cfg;
        else {
            logger.error("[ConfigUtils] cant find effect", effectId);
        }
        return null
    }

    getChapterConfig(chapterId: number) {
        let cfg = configManager.getConfigByKey("chapter", chapterId);
        if (cfg) return cfg;
        else {
            logger.error("[ConfigUtils] cant find chapter", chapterId);
        }
        return null
    }

    getLessonConfig(lessonId: number) {
        let cfg = configManager.getConfigByKey("lesson", lessonId);
        if (cfg) return cfg;
        else {
            logger.error("[ConfigUtils] cant find lesson", lessonId);
        }
        return null
    }
};

export let configUtils = new ConfigUtils();