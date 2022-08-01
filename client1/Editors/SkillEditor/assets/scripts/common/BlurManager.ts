
// import guiManager from "./GUIManager"

const CAMERA_NAME = "UISnapCamera"
const AFTER_CAMERA_NAME = "UIAfterCamera"

class BlurManager {
    private _camera: cc.Camera = null
    private _additionalCamera: cc.Camera = null

    private _material: cc.Material = null
    private _afterCamera: cc.Camera = null
    private _spriteFrame: cc.SpriteFrame = null

    private _createSnapCamera () {
        let node = new cc.Node()
		node.name = CAMERA_NAME
		node.group = "default"

		let texture = new cc.RenderTexture()
		// @ts-ignore 原生下采用RB_FMT_D24S8和浏览器下表现不一致，先采用RB_FMT_S8
        // 此问题已经修复，可以使用RB_FMT_D24S8了，不过等下一个整包出来后，再修改，并且删除这两行注释
		texture.initWithSize(cc.winSize.width * 0.5, cc.winSize.height * 0.5, cc.RenderTexture.DepthStencilFormat.RB_FMT_S8)

		let camera = node.addComponent(cc.Camera)
		camera.cullingMask = (1 << node.groupIndex)
        camera.targetTexture = texture
        camera.enabled = false
        camera.depth = 1
        camera.clearFlags = cc.Camera.ClearFlags.COLOR | cc.Camera.ClearFlags.DEPTH | cc.Camera.ClearFlags.STENCIL

        return camera
    }

    private _createAfterCamera () {
        let node = new cc.Node()
        node.name = AFTER_CAMERA_NAME
        node.group = "snap"
        node.width = cc.winSize.width
        node.height = cc.winSize.height

        let spr = node.addComponent(cc.Sprite)
        spr.sizeMode = cc.Sprite.SizeMode.CUSTOM
        spr.trim = false
        let sf = new cc.SpriteFrame()
        sf.setTexture(this._camera.targetTexture)
        spr.spriteFrame = sf
        spr.setMaterial(0, this._material)

        let texture = new cc.RenderTexture()
        // @ts-ignore
        texture.initWithSize(cc.winSize.width * 0.5, cc.winSize.height * 0.5, cc.RenderTexture.DepthStencilFormat.RB_FMT_S8)

        let camera = node.addComponent(cc.Camera)
        camera.cullingMask = (1 << node.groupIndex)
        camera.targetTexture = texture
        camera.depth = 2
        camera.clearFlags = cc.Camera.ClearFlags.COLOR | cc.Camera.ClearFlags.DEPTH | cc.Camera.ClearFlags.STENCIL

        node.active = false
        return camera
    }

    init (material: cc.Material) {
        this._camera = this._createSnapCamera()
        // guiManager.sceneNode.addChild(this._camera.node)

        this._material = material
        this._material.setProperty('bightness', 0.35);
		this._material.setProperty('renderWidth', cc.winSize.width);
        this._material.setProperty('renderHeight', cc.winSize.height);

        this._afterCamera = this._createAfterCamera()
        // guiManager.sceneNode.addChild(this._afterCamera.node)

        this._spriteFrame = new cc.SpriteFrame()
        this._spriteFrame.setTexture(this._afterCamera.targetTexture)
    }

    setAdditionalCamera (camera: cc.Camera) {
        if (this._additionalCamera == camera) return

        if (this._additionalCamera != null) {
            this._additionalCamera.enabled = false
            this._additionalCamera = null
        }

        if (camera == null) {
            this._camera.clearFlags = cc.Camera.ClearFlags.COLOR | cc.Camera.ClearFlags.DEPTH | cc.Camera.ClearFlags.STENCIL
        } else {
            this._camera.clearFlags = 0

            this._additionalCamera = camera
            camera.targetTexture = this._camera.targetTexture
            camera.depth = 0
        }
    }

    asBlurContainer (container: cc.Node) {
        container.group = "blur"

        let sprite = container.getComponent(cc.Sprite)
        if (sprite == null) {
            sprite = container.addComponent(cc.Sprite)
            sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM
            sprite.trim = false
            sprite.spriteFrame = this._spriteFrame;
        }
    }

    snap () {
        this._camera.enabled = true
        if (this._additionalCamera) this._additionalCamera.enabled = true
        this._afterCamera.node.active = true

        this._camera.scheduleOnce(()=>{
            this._camera.enabled = false
            if (this._additionalCamera) this._additionalCamera.enabled = false
            this._afterCamera.node.active = false
        }, 0)
    }
}

const blurManager = new BlurManager()
export default blurManager

/*
这个方案在某些情况下会有问题：
1. 如果之前scheduleOnce的那个snap函数中的让camera失效的匿名函数，在下一帧的调用snap之后才被调到，那么相当于下一帧截图失败了，残留的还是上一帧的截图。
2. 在调用完snap后，才通过setAdditionalCamera设置一个额外摄像头，模糊出来的图片将看不到这个额外摄像头所看到的内容
*/