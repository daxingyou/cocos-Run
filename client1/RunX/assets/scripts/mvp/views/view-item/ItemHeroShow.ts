import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { logger } from "../../../common/log/Logger";
import skeletonManager from "../../../common/SkeletonManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";

const HERO_SHOW_TAG = 'MAIN_HERO_SHOW';

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemHeroShow extends ViewBaseComponent {
    @property(cc.Sprite)            heroImg: cc.Sprite = null;
    @property(cc.Node)              spineParent: cc.Node = null;

    private _modelId: number = 0;
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _curSpineName: string = "";

    get modelId() {
        return this._modelId;
    }

    onInit(modelId: number) {
        this._switchModel(modelId)
    }

    onRelease() {
        if(this._spriteLoader) {
            this._spriteLoader.release();
        }
        this._releaseSpine();
        this._modelId = 0;
        this._curSpineName = "";
    }

    private _switchModel (modelId: number) {
        if(modelId != this._modelId) {
            this._modelId = modelId;
            this._releaseSpine();
            this._refreshHeroShow();
        }
    }

    private _refreshHeroShow() {
        let modelCfg = configUtils.getModelConfig(this._modelId);
        if(!modelCfg) {
            logger.error('ItemHeroShow modelCfg error:', this._modelId);
            return;
        }
        let changeSizeCb = (node: cc.Node, sizeList: string[]) => {
                let size = cc.v2(((Number(sizeList[0]) / 10000) || 1) , ((Number(sizeList[1]) / 10000) || 1));
                node.setScale(size);
                let pos = cc.v2(Number(sizeList[2]) || 0, Number(sizeList[3]) || 0);
                node.setPosition(pos);
        }
        if(modelCfg.ModelLive2d) {
            this.heroImg.node.active = false;
            this.spineParent.active = true;
            let spineUrl: string = resPathUtils.getModelLive2dPath(modelCfg.ModelLive2d);
            this._loadModelSpine(spineUrl, modelCfg);
            return;
        } else if(modelCfg.ModelPhoto) {
            this.heroImg.node.active = true;
            this.spineParent.active = false;
            if(this.heroImg.spriteFrame) {
                this._spriteLoader.deleteSprite(this.heroImg);
            }
            this._releaseSpine();
            let url = resPathUtils.getModelPhotoPath(this._modelId);
            this._spriteLoader.changeSpriteP(this.heroImg, url).then(() => {
                let sizeList = utils.parseStingList(modelCfg.ModelPhotoSize);
                changeSizeCb(this.heroImg.node, sizeList);
            }).catch((err) => {
                logger.error(err);
                this._spriteLoader.deleteSprite(this.heroImg);
            });
            return;
        }
    }

    private _loadModelSpine(url: string, modelCfg: cfg.Model) {
        if(url != this._curSpineName) {
            if(this.spineParent.childrenCount > 0) {
                this._releaseSpine();
            }

            // 加载Skeleton
            skeletonManager.loadSkeleton(url, url)
            .then(skeleton => {
                let spineNode = skeleton.node;
                this._curSpineName = url;
                this.spineParent.addChild(spineNode);
                let modelSizeList = utils.parseStingList(modelCfg.ModelLive2dSize);
                this.spineParent.setScale(cc.v2(Number(modelSizeList[0]) / 10000, Number(modelSizeList[1]) / 10000));
                this.spineParent.setPosition(cc.v2(Number(modelSizeList[2]), Number(modelSizeList[3])));
                skeleton.setAnimation(0, 'animation', true);
            });
        }
    }

    private _releaseSpine() {
        if(this.spineParent.children[0]) {
            skeletonManager.releaseSkeleton(this._curSpineName, this.spineParent.children[0].getComponent(sp.Skeleton), `${HERO_SHOW_TAG}`);
        }
        this._curSpineName = "";
    }

}
