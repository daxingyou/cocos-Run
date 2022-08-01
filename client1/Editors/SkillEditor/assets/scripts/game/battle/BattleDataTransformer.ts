import { BuffData } from "../BattleType";
import { RoleData, TeamData } from "../CSInterface";
import BTBaseRole from "../data-template/BTBaseRole";
import Team from "../data-template/Team";

/**
 * @description 主要用于获取可序列化的battle数据
 * 
 * 获取数据：
 * player
 * monsters
 */
export default class BattleDataTransformer {
    /**
     * 获得玩家队伍信息
     * @param player 
     */
    static getPlayerTeamData (player: Team): TeamData {
        let teamData: TeamData = {
            Roles: this._getRoleList(player.roles),
            TeamType: player.type,
            GroupId: 0,
        }
        return teamData;
    }

    /**
     * 获得怪物队伍信息
     * @param monster 
     */
    static getMonsterTeamData (monster: Team): TeamData {
        let teamData: TeamData = {
            Roles: this._getRoleList(monster.roles),
            GroupId: monster.groupId,
            TeamType: monster.type,
        }
        return teamData;
    }

    /**
     * 获得角色数据
     * @param baseRole 
     * @param index 
     */
    static getRoleData (baseRole: BTBaseRole): RoleData {
        return this._gerRoleData(baseRole);
    }

    /**
     * 角色队伍信息
     * @param roles 
     */
    private static _getRoleList(roles: BTBaseRole[]): RoleData[] {
        let roleDatas: RoleData[] = [];
        roles.forEach(roleData => {
            roleDatas.push(this._gerRoleData(roleData));
        });
        return roleDatas;
    }

    /**
     * 角色信息
     * @param baseRole 
     */
    private static _gerRoleData(baseRole: BTBaseRole): RoleData {
        let roleData: RoleData = {
            Pos: baseRole.pos,
            UID: baseRole.roleUID,
            ID: baseRole.roleID,
            MaxHP: baseRole.maxHp,
            HP: baseRole.hp,
            State: baseRole.state,
            Type: baseRole.roleType,
            Power: baseRole.power,
            
            Buffs: ((): BuffData[] => {
                let buffDatas: BuffData[] = [];
                baseRole.buffList.forEach(buff => {
                    if (buff) {
                        buffDatas.push({
                            buffId: buff.buffId,
                            count: buff.count,
                            // data: buff.data
                        });
                    }
                });
                return buffDatas;
            })(),
        }
        return roleData;
    }
}