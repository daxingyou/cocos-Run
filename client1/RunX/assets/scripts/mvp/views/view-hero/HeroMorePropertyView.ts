import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import HeroUnit from "../../template/HeroUnit";

const { ccclass, property } = cc._decorator;

@ccclass
export default class HeroMorePropertyView extends ViewBaseComponent {
    @property({ type: cc.Node }) morePropertyParent: cc.Node = null;

    private _heroId: number = null;
    onInit(heroId: number) {
        this._heroId = heroId;
        this.refreshView();
    }

    onRelease() {
        let children = [...this.morePropertyParent.children]
        children.forEach(item => {
            if(item.active) {
                item.removeFromParent(true);
            }
        })
    }

    refreshView() {
        // todo 得到装备附加信息
        let specialAttributes: any = new HeroUnit(this._heroId).getHeroSpecialAttributeProperty();
        for(let i = 0; i < specialAttributes.length; ++i) {
           let property = specialAttributes[i];
           if(property) {
               let propertyNode: cc.Node = cc.instantiate(this.morePropertyParent.children[0]);
               this.morePropertyParent.addChild(propertyNode);
               propertyNode.active = true;
               let nameLb: cc.Label = propertyNode.getComponent(cc.Label);
               let valueLb: cc.Label = propertyNode.getChildByName('valueLb').getComponent(cc.Label);
               nameLb.string = property.name;
               valueLb.string = property.type == 2 ? parseInt(property.value) * 100 /10000 + '%' : property.value;
           }
        }
    }
}
