import RichTextEx from "../../../common/components/rich-text/RichTextEx";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemWuDaoProp extends cc.Component {

    @property(RichTextEx) label: RichTextEx = null;
}
