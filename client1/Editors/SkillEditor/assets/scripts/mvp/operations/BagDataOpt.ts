import { End_HeroBasic_Id, Start_HeroBasic_Id } from "../../app/AppConst";
import { ITEM_TYPE } from "../../app/AppEnums";
import { configManager } from "../../common/ConfigManager";
import { logger } from "../../common/log/Logger";
import { data } from "../../network/lib/protocol";
import { ItemConfig } from "../models/BagData";
import { HeroBasicInfo } from "../models/HeroData";
import { modelManager } from "../models/ModeManager";
import { optManager } from "./OptManager";


export default class BagDataOpt {
    init(bagData: data.IBagData) {
        modelManager.bagData.init(bagData);
    }

    addEvent() {

    }

    checkIsHeroBasic(id: number) {
        return id >= Start_HeroBasic_Id && id <= End_HeroBasic_Id;
    }

    checkIsHeroChip(id: number) {
        return this.checkIsHeroBasic(this.heroChipIdToBaseId(id));
    }

    getItemConfigById(itemId: number): ItemConfig {
        return configManager.getConfigByKey('item', itemId);
    }

    getItemTypeById(itemId: number) {
        let itemConfig = this.getItemConfigById(itemId);
        let itemType: ITEM_TYPE = null;
        if (itemConfig) {
            switch (itemConfig.ItemId) {
                case 10010001:
                    itemType = ITEM_TYPE.COIN;
                    break;
                case 10010002:
                    itemType = ITEM_TYPE.DIAMOND;
                    break;
                case 10010003:
                    itemType = ITEM_TYPE.PHYSICAL;
                    break;
                case 10010004:
                    itemType = ITEM_TYPE.HONOUR;
                    break;
                case 10010005:
                    itemType = ITEM_TYPE.REPUTATION;
                    break;
                case 10011001:
                    itemType = ITEM_TYPE.TICKET_HERO;
                    break;
                case 10012001:
                    itemType = ITEM_TYPE.TICKET_EQUIP;
                    break;
                case 10013001:
                case 10013002:
                case 10013003:
                case 10013004:
                    itemType = ITEM_TYPE.MATERIAL_STRENGTHEN;
                    break;
                case 10014001:
                case 10014002:
                case 10014003:
                case 10014004:
                case 10014005:
                case 10014006:
                    itemType = ITEM_TYPE.MATERIAL_BREAK;
                    break;
                case 10015001:
                case 10015002:
                    itemType = ITEM_TYPE.MATERIAL_BREAK_ALLPOWER;
                    break;
                case 10016001:
                case 10016002:
                case 10016003:
                case 10016004:
                case 10016005:
                case 10016006:
                case 10016007:
                case 10016008:
                    itemType = ITEM_TYPE.MATERIAL_TALENT;
                    break;
                case 10017001:
                case 10017002:
                case 10017003:
                    itemType = ITEM_TYPE.MATERIAL_CASTSOUL;
                    break;
                case 10018001:
                case 10018002:
                case 10018003:
                case 10018004:
                    itemType = ITEM_TYPE.EXP_HERO_ADD;
                    break;
                case 10019001:
                case 10019002:
                case 10019003:
                case 10019004:
                    itemType = ITEM_TYPE.PHYSICAL_ADD;
                    break;
                default:
                    if (itemConfig.ItemId >= 10175111 && itemConfig.ItemId <= 10183311) {
                        itemType = ITEM_TYPE.HERO_CHIP;
                    }
                    break;
            }
        }
        return itemType;
    }

    getHeroBaseConfigById(id: number) {
        if (this.checkIsHeroBasic(id)) {
            return this.getHeroBasicConfig(id);
        } else if (this.checkIsHeroChip(id)) {
            return this.getHeroBasicConfig(this.heroChipIdToBaseId(id));
        } else {
            logger.error('getHeroBaseConfigById id 错误：', id);
            return null;
        }
    }

    private getHeroBasicConfig(heroBasicId: number): HeroBasicInfo {
        return configManager.getConfigByKey('heroBasic', heroBasicId);
    }

    getHeroFriendConfig(heroFriendId: number) {
        return configManager.getConfigByKey('heroFriend', heroFriendId);
    }

    getHeroGiftConfig(heroGiftId: number) {
        return configManager.getConfigByKey('heroGift', heroGiftId);
    }

    getLevelExpConfig(levelExpId: number) {
        return configManager.getConfigByKey('levelExp', levelExpId);
    }

    getEquipConfig(equipId: number) {
        return configManager.getConfigByKey('equip', equipId);
    }

    getEquipCastSoulConfig(equipCastSoulId: number) {
        return configManager.getConfigByKey('equipCastSoul', equipCastSoulId);
    }

    getHeroPropertyConfig(heroId: number) {
        return configManager.getConfigByKey('heroProperty', heroId);
    }

    // getLevelStarConfig(levelStarId: number) {
    //     return configManager.getConfigByKey('levelStar', levelStarId);
    // }


    heroBaseIdToChipId(id: number) {
        return id + 10000000;
    }

    heroChipIdToBaseId(id: number) {
        return id - 10000000;
    }

    checkHeroChipIsCanCompound(heroId: number): boolean {
        // 碎片id
        let needCount: number = 0;
        let bagChips: data.IBagUnit[] = [];
        if (heroId > 10000000) {
            needCount = optManager.loginOpt.getRoleToChipCount(this.heroChipIdToBaseId(heroId));
            bagChips = modelManager.bagData.getHeroChipInfosById(this.heroChipIdToBaseId(heroId));
        } else {
            needCount = optManager.loginOpt.getRoleToChipCount(heroId);
            bagChips = modelManager.bagData.getHeroChipInfosById(heroId);
        }
        let bagSumCount: number = 0;
        if (bagChips.length > 1) {
            for (let i = 0; i < bagChips.length; ++i) {
                if (bagChips[i].Combinable && bagChips[i].Count > 0) {
                    bagSumCount += bagChips[i].Count;
                }
            }
        } else {
            bagSumCount = bagChips[0].Count;
        }
        return bagSumCount >= needCount;
    }

    getHeroPropertyByStar(heroId: number, star: number) {
        let basicConfig: HeroBasicInfo = optManager.bagDataOpt.getHeroBaseConfigById(heroId);
    }
}