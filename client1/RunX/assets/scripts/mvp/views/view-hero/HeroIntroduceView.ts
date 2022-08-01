import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { logger } from "../../../common/log/Logger";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import ItemHeroShow from "../view-item/ItemHeroShow";

const {ccclass, property} = cc._decorator;

@ccclass
export default class HeroIntroduceView extends ViewBaseComponent {
    @property(cc.Node)          introduceParent: cc.Node = null;
    @property(cc.Node)          introduceTemp: cc.Node = null;
    @property(cc.Sprite)        nameSp: cc.Sprite = null;
    @property(cc.Label)         locationLB: cc.Label = null;
    @property(cc.Label)         traitLB: cc.Label = null;
    @property(ItemHeroShow)     itemHeroShow: ItemHeroShow = null;

    private _heroId: number = 0;
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    onInit(heroId: number) {
        this._heroId = heroId;
        this._refreshView();
    }

    onRelease() {
        this.itemHeroShow.onRelease();
        this._spriteLoader.release();
    }

    private _refreshView() {
        let heroIntroduce: cfg.HeroIntroduce = configManager.getConfigByKV('heroIntroduce', 'HeroIntroduceHeroID', this._heroId)[0];
        if(heroIntroduce) {
            let heroBasic = configUtils.getHeroBasicConfig(this._heroId);
            this._refreshIntroduces(heroIntroduce);
            this.locationLB.string = `${heroIntroduce.HeroIntroduceLocation || '暂无介绍'}`;
            this.traitLB.string = `${heroIntroduce.HeroIntroduceTrait || '暂无介绍'}`;
            this.itemHeroShow.onInit(heroBasic.HeroBasicModel);
            let nameUrl = resPathUtils.getIntroduceNameUrl(heroBasic.HeroIntroduceNameImage);
            this._spriteLoader.changeSprite(this.nameSp, nameUrl);
        } else {
            logger.info(`未找到数据 ${this._heroId}`);
        }
    }

    private _refreshIntroduces(heroIntroduce: cfg.HeroIntroduce) {
        if(!heroIntroduce) {
            logger.info(`暂无配置介绍 ${this._heroId}`);
            return;
        }
        this.introduceParent.children.forEach(_c => {
            _c.active = false;
        });
        let createIntroduce = (index: number, str: string): cc.Node => {
            let item = this.introduceParent.children[index];
            if(!item) {
                item = cc.instantiate(this.introduceTemp);
                this.introduceParent.addChild(item);
            }
            item.active = true;
            item.getComponent(cc.Label).string = str;
            return item;
        }
        let introduces = heroIntroduce.HeroIntroduceText.split('\\n');
        for(let i = 0; i < introduces.length; ++i) {
            let item = createIntroduce(i, introduces[i]);
            item.getComponent(cc.Label).horizontalAlign = cc.Label.HorizontalAlign.LEFT;
            item.y = 0;
        }
        let from = createIntroduce(introduces.length, '\n'.concat(heroIntroduce.HeroIntroduceFrom));
        from.getComponent(cc.Label).horizontalAlign = cc.Label.HorizontalAlign.RIGHT;
        from.y = -200;
    }
}
