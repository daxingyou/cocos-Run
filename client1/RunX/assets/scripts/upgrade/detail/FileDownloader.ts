
declare var require: any;

interface Session {
    req: XMLHttpRequest
}

export default class FileDownloader {
    private _session: Session = null;
    private _callback: Function = null;

    constructor() {
    }

    start(url: string, path: string, md5: string, callback: Function): void {
        if (this._session && this._session.req != null) return;

        this._callback = callback;
        try {
            let req = new XMLHttpRequest();
            req.setRequestHeader("Accept-Encoding", "gzip")
            req.responseType = "arraybuffer";

            let session: Session = {req: req};
            this._session = session;

            req.ontimeout = () => {
                if (session.req == null) return;
                session.req = null;
                if (this._callback) this._callback(false, "timeout");
            }

            req.onerror = () => {
                if (session.req == null) return;
                session.req = null;
                if (this._callback) this._callback(false, `onerror(${req.status})`);
            }

            req.onreadystatechange = () => {
                if (session.req == null) return;
                if (req.readyState != 4) return;

                if (req.status != 200) {
                    session.req = null;
                    if (this._callback) this._callback(false, `onerror(${req.status})`);
                    return;
                }

                if (path == null) {
                    session.req = null;
                    if (this._callback) this._callback(true);
                    return;
                }

                let buffer = req.response;
                if (!(buffer instanceof ArrayBuffer)) {
                    buffer = req.responseText;
                }

                let index = path.lastIndexOf("/");
                let ret1;
                if (index != null) {
                    let dirPath = path.substr(0, index);
                    ret1 = jsb.fileUtils.createDirectory(dirPath);
                }

                if (!ret1) {
                    session.req = null;
                    if (this._callback) this._callback(false, "create dir failed");
                    return;
                }

                let ret2 = false;
                try {
                    ret2 = jsb.fileUtils.writeStringToFile(buffer, path);
                } catch (e) {
                    session.req = null;
                    if (this._callback) this._callback(false, "start write to file failed("+e+")");
                    return;
                }

                if (ret2 == false) {
                    session.req = null;
                    if (this._callback) this._callback(false, "write to file failed");
                    return;
                }

                if (md5 != null) {
                    let hash = require("UpgradeMD5").create();
                    hash.update(buffer)

                    if (md5 != hash.hex().toLowerCase()) {
                        session.req = null;
                        if (this._callback) this._callback(false, "md5err "+md5+" ,"+hash.hex()+" ");
                        return;
                    } 
                }

                session.req = null;
                if (this._callback) this._callback(true);
            }
            req.open("GET", url, true);
            req.send();
        } catch (error) {
            this._session.req = null;
            if (this._callback) this._callback(false, `start download failed(${error})`);
        }
    }

    abort () {
        if (this._session && this._session.req) {
            let req = this._session.req;
            this._session.req = null;
            req.abort();
        }
    }
}

