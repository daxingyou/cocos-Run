interface nodeProp{
    name: string,
    posx: number,
    posy: number,
    index: number,
    hero?: string,
    type?: number,
    reverse: boolean,
}

interface routeProp{
    index: number,
    name: string,
    posx: number,
    posy: number,
    reverse: boolean,
}

interface configItem {
    name: string,
    width: number,
    height: number,
    bgRes: string,
    nodeList: nodeProp[],
    routeList:  nodeProp[]
}
export{
    nodeProp,
    routeProp,
    configItem,
}