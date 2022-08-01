
interface Session {
    req: XMLHttpRequest
}

export default class FileHttpRequest {
    private _session: Session = null;
    private _callback: Function = null;

    constructor() {
    }

    setCallback(callback: Function): void {
        this._callback = callback;
    }

    request(url: string, timeout: number, paras: object, post: boolean = false): void {
        if (this._session && this._session.req != null) return;

        let req = new XMLHttpRequest();
        req.setRequestHeader("Accept-Encoding", "gzip")
        req.timeout = timeout;

        let session: Session = {req: req};
        this._session = session;

        let firstPara: boolean = true;
        for (const key in paras) {
            if (firstPara) {
                // @ts-ignore
                url = `${url}?${key}=${paras[key]}`;
                firstPara = false;
            } else {
                // @ts-ignore
                url = `${url}&${key}=${paras[key]}`;
            }
        }

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

            if (req.readyState == 4) {
                session.req = null;
                if (req.status == 200) {
                    if (this._callback) this._callback(true, req.response);
                } else {
                    if (this._callback) this._callback(false, `error(${req.status})`);
                }
            }
        }
        req.open(post ? "POST" : "GET", url, true);
        req.send();
    }
}
