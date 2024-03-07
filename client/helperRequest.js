const axios = require("axios")

class HelperRequest{

    constructor(defaultConfig={}){
        this.instance = axios.create(defaultConfig);
    }

    addRequestInterceptor(onSuccessHandler=(req)=>{},onErrorHandler=(err)=>{}){
        this.instance.interceptors.request.use(onSuccessHandler,onErrorHandler);
    }

    addResponceInterceptor(onSuccessHandler=(req)=>{},onErrorHandler=(err)=>{}){
        this.instance.interceptors.request.use(onSuccessHandler,onErrorHandler);
    }

    request(url, opts={method:"GET"}){
        return this.instance({
            url:url,
            ...opts
        });
    }
}

module.exports=HelperRequest;