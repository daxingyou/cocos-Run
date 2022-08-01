
export default class HttpRequest {

    /**
     * http请求
     * @param url 地址
     * @param paras 参数：GET方法将参数拼接在url后；POST方法格式化程字符串放在包体中发送
     * @param timeout 超时：默认10000
     * @param post 是否是POST方法
     * @param headerEncode 是否进行编码压缩
     * @returns promise
     */
    async request(url: string, paras: object, timeout: number, post = false, headerEncode = false) {
        return new Promise<string>((resolve, reject) => {
            paras = paras || {}
            if (!post) {
                let firstPara = true;
                for (const key in paras) {
                    if (firstPara) {
                        // @ts-ignore
                        url = `${url}?${key}=${paras[key]}`;
                        firstPara = false;
                    } else {
                        //@ts-ignore
                        url = `${url}&${key}=${paras[key]}`;
                    }
                }
            }

            let req = new XMLHttpRequest();
            req.open(post ? "POST" : "GET", url, true);
            headerEncode && req.setRequestHeader("Accept-Encoding", "gzip");
            req.timeout = timeout || 10000;

            req.ontimeout = () => reject(`timeout`);
            req.onerror = () => reject(`onerror(${req.status})`);
            req.onabort = () => reject(`abort`);
            req.onreadystatechange = () => {
                if (req.readyState != 4) return;

                if (req.status != 200) {
                    reject(req.responseText || "network error")
                }

                resolve(req.responseText);
            }

            post ? req.send(JSON.stringify(paras)) : req.send();
        });
    }
}
