import UIBTRoleCtrl from "./UIBTRoleCtrl";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BattleCtrl extends cc.Component {
    @property(UIBTRoleCtrl)     heroCtrl: UIBTRoleCtrl = null;
    @property(UIBTRoleCtrl)     monsterCtrl: UIBTRoleCtrl = null;


    init () {

    }

    deInit () {
        
    }

}