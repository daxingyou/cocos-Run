import { eventCenter } from "../../../common/event/EventCenter";
import { cfg } from "../../../config/config";
import ItemTask from "../view-task/ItemTask";

const {ccclass, property} = cc._decorator;
@ccclass
export default class ItemMainTask extends ItemTask {
   
   onInit(cfg: cfg.TaskTarget, root?: cc.Node): void {
      super.onInit(cfg, root, true);
   }

   /**item释放清理*/
   deInit() {
      eventCenter.unregisterAll(this);
   }

   private _registerEvent() {

   }

   itemClick() {

   }
}