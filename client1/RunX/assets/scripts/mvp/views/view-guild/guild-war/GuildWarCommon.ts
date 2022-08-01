/**
 * 地图上的坑位个数，使用layout直接创捷且布局
 */
const WAR_HOLE = [1, 2, 3, 3, 2, 1];
 //左侧方顺位编号 -分为三个档位
const WAR_HOLE_INDEX = [[1], [2, 3], [5, 4, 6]];
const HOLE_TAG = "HOLE_TAG";
//战场建筑数量 
const HOLE_COUNT = 12;

/**地图层级关系-暂且就两-后续需要再扩充*/
enum MAPLAYER{
     LINE = 1,
     HOLE
}
 /**建筑归属*/
enum BUILD_OWNER{
    SELF = 1,
    ENEMY
}

/**营地状态*/
enum BUILD_STATE{
/**无驻守*/    EMPTY = 1,
/**英雄驻守*/  DEFEND,
/**被摧毁*/    DESTROY
}

enum WARSTATE{
    PREPARE = 1,
    WAR
}

/**建筑属性*/
interface BUILD_CFG{
    /**序列号*/ Idx:number,
    /**敌友标记*/OwnTag:BUILD_OWNER,
    /**集火标记*/FireTag:boolean
}

/**营地属性*/
interface CAMP_CFG{
    /**敌友标记*/OwnTag: BUILD_OWNER,
    /**营地状态*/BuildState: BUILD_STATE,
    /**序列号*/ Idx:number,
}

export {
    WARSTATE,
    BUILD_STATE,
    BUILD_OWNER,
    MAPLAYER,
    HOLE_COUNT,
    HOLE_TAG,
    WAR_HOLE_INDEX,
    WAR_HOLE,
    BUILD_CFG,
    CAMP_CFG
}