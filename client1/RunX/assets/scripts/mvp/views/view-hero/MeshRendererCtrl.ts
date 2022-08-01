
const {ccclass, property} = cc._decorator;

const gfx = cc.gfx;

@ccclass
export default class MeshRendererCtrl extends cc.Component {

    @property(cc.SpriteFrame)
    spriteFrame: cc.SpriteFrame = null;

    private _renderer: cc.MeshRenderer = null;
    private _mesh: cc.Mesh = null;
    private _meshCache: { [k: number]: cc.Mesh} = {};
    private _vertexes: cc.Vec2[] = [];
    private texture: cc.Texture2D = null;
    onLoad() {
        this._renderer = this.node.getComponent(cc.MeshRenderer) || this.node.addComponent(cc.MeshRenderer);
        this._renderer.mesh = null;
        let materual = cc.Material.getBuiltinMaterial("unlit");
        this._renderer.setMaterial(0, materual);
    }

    start () {
    }

    setData(vertexes: cc.Vec2[]) {
        this._vertexes = vertexes;
        this._refreshAll();
    }

    private _refreshAll() {
        this._updateMesh();
        this._applySpriteFrame();
        this._applyVertexes();
    }

    private _updateMesh() {
        let mesh = this._meshCache[this._vertexes.length];
        if (!mesh) {
            mesh = new cc.Mesh();
            mesh.init(new gfx.VertexFormat([
                { name: gfx.ATTR_POSITION, type: gfx.ATTR_TYPE_FLOAT32, num: 2 },
                { name: gfx.ATTR_UV0, type: gfx.ATTR_TYPE_FLOAT32, num: 2 },
            ]), this._vertexes.length, true);
            this._meshCache[this._vertexes.length] = mesh;
        }
        cc.log(mesh.nativeUrl)
        this._mesh = mesh;
    }

    private _lerp(a: number, b: number, w: number) {
        return a + w * (b - a);
    }


    // 更新顶点
    private _applyVertexes() {
        // cc.log('_applyVertexes');

        // 设置坐标
        const mesh = this._mesh;
        mesh.setVertices(gfx.ATTR_POSITION, this._vertexes);

        if (this.texture) { 
            let uvs = [];
            // 计算uv
            for (const pt of this._vertexes) {
                const vx = (pt.x + this.texture.width / 2 + this.offset.x) / this.texture.width;
                const vy = 1.0 - (pt.y + this.texture.height / 2 + this.offset.y) / this.texture.height;
                uvs.push(cc.v2(vx, vy));
            }
            mesh.setVertices(gfx.ATTR_UV0, uvs);
        }

        if (this._vertexes.length >= 3) {
            // 计算顶点索引 
            let ids = [];
            const vertexes = [].concat(this._vertexes);

            // 多边形切割，未实现相交的复杂多边形，确保顶点按顺序且围成的线不相交
            let index = 0, rootIndex = -1;
            while (vertexes.length > 3) {
                const p1 = vertexes[index];
                const p2 = vertexes[(index + 1) % vertexes.length];
                const p3 = vertexes[(index + 2) % vertexes.length];

                const v1 = p2.sub(p1);
                const v2 = p3.sub(p2);
                if (v1.cross(v2) >= 0) {
                    // 是凸点
                    let isIn = false;
                    for (const p_t of vertexes) {
                        if (p_t !== p1 && p_t !== p2 && p_t !== p3 && this._testInTriangle(p_t, p1, p2, p3)) {
                            // 其他点在三角形内
                            isIn = true;
                            break;
                        }
                    }
                    if (!isIn) {
                        // 切耳朵，是凸点，且没有其他点在三角形内
                        ids = ids.concat([this._vertexes.indexOf(p1), this._vertexes.indexOf(p2), this._vertexes.indexOf(p3)]);
                        vertexes.splice(vertexes.indexOf(p2), 1);
                        rootIndex = index;
                    } else {
                        index = (index + 1) % vertexes.length;
                        if (index === rootIndex) {
                            cc.log('循环一圈未发现');
                            break;
                        }
                    }
                } else {
                    index = (index + 1) % vertexes.length;
                    if (index === rootIndex) {
                        cc.log('循环一圈未发现');
                        break;
                    }
                }
                // 感谢 @可有 修复
                if (index > (vertexes.length - 1)) index = (vertexes.length - 1);
            }
            ids = ids.concat(vertexes.map(v => { return this._vertexes.indexOf(v) }));
            mesh.setIndices(ids);

            if (this._renderer.mesh != mesh) {
                // mesh 完成后再赋值给 MeshRenderer , 否则模拟器(mac)会跳出
                this._renderer.mesh = mesh;
            }
        } else {

        }
    }

    // 判断一个点是否在三角形内
    _testInTriangle(point: cc.Vec2, triA: cc.Vec2, triB: cc.Vec2, triC: cc.Vec2) {
        let AB = triB.sub(triA), AC = triC.sub(triA), BC = triC.sub(triB), AD = point.sub(triA), BD = point.sub(triB);
        return (AB.cross(AC) >= 0 ^ AB.cross(AD) < 0)  // D,C 在AB同同方向
            && (AB.cross(AC) >= 0 ^ AC.cross(AD) >= 0) // D,B 在AC同同方向
            && (BC.cross(AB) > 0 ^ BC.cross(BD) >= 0); // D,A 在BC同同方向
    }

    // 更新图片
    _applySpriteFrame() {
        // cc.log('_applySpriteFrame');
        if (this.spriteFrame) {
            const renderer = this._renderer;
            let material = renderer.getMaterials()[0];
            // Reset material
            let texture = this.spriteFrame.getTexture();
            material.define("USE_DIFFUSE_TEXTURE", true);
            material.setProperty('diffuseTexture', texture);
            this.texture = texture;
        }
    }

    private _calculateUV() {
        const mesh = this._mesh;
        if (this.spriteFrame) {
            // cc.log('_calculateUV')
            const uv = this.spriteFrame.uv;
            const texture = this.spriteFrame.getTexture();
            /**
             *    t
             * l     r
             *    b
             */
            const uv_l = uv[0];
            const uv_r = uv[6];
            const uv_b = uv[3];
            const uv_t = uv[5];

            // cc.log('uv', uv)

            // 计算uv
            const uvs = [];
            for (const pt of this._vertexes) {
                const u = this._lerp(uv_l, uv_r, (pt.x + texture.width / 2 + this.offset.x) / texture.width);
                const v = this._lerp(uv_b, uv_t, (pt.y + texture.height / 2 - this.offset.y) / texture.height);
                uvs.push(cc.v2(u, v));
            }
            mesh.setVertices(gfx.ATTR_UV0, uvs);
        }
    }
    private offset: cc.Vec2 = cc.v2(0, 0);
}
