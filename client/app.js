const http = require('http'); 

class CircuitBreaker {
    constructor(maxCountFail = 3,maxCountSuccess = 3){
        this.state = "CLOSED";
        this.lastFailTime = null;
        this.failReq = 0;
        this.successReq = 0;
        this.maxCountSuccess = maxCountSuccess;
        this.maxCountFail = maxCountFail;
    }

    request(url,options={method:"GET",headers:null,body:null}) {
        if (this.state == "OPEN") {
            return Promise.reject(new Error('Circuit breaker is open'))
        }
        else {
            return this._helperRequest(url,options);
        }
    }

    _open() {
        this.state = "OPEN";
        this.lastFailTime = Date.now();
    }

    _close() {
        this.failReq = 0;
        this.state = "CLOSED";
        this.lastFailTime = null;
    }

    _halfOpen() {
        this.successReq = 0;
        this.state = "HALF-OPEN";
    }

    _helperRequest(url,options) {
        const {body,...opts} = options;
        return new Promise((resolve,reject)=>{
            let req = http.request(url,opts, res => {
                this._helper(res);
                let resBody = [];
                res.on('data', function(chunk) {
                    resBody.push(chunk);
                });
                res.on('end', function() {
                    try {
                        resBody = JSON.parse(Buffer.concat(resBody).toString());
                    } catch(e) {
                        reject(e);
                    }
                    resolve({
                        body:resBody,
                        headers:res.headers,
                        statusCode:res.statusCode
                    });
                });             
                
            });
            
            req.on("error",e => {
                this.failReq++;
                if (this.state =="HALF-OPEN" || this.failReq >= this.maxCountFail) {                    
                    this._open();
                }
                reject(e);
            });
            if(body) req.write(body);
            req.end();
        });
    }

    _helper(res){
        if(res.statusCode >= 500){
                                    
            this.failReq+=1;
            if (this.state =="HALF-OPEN" || this.failReq >= this.maxCountFail) {                 
                this._open();
            }                   
            
            
        } else if (res.statusCode >= 200 && res.statusCode < 300) {
            
            this.successReq+=1;
            if (this.state == "CLOSED" || this.successReq >= this.maxCountSuccess) {
                this._close();
            }
            
        }   
    }

    checkState(interval = 5000) {
        if (this.state == "OPEN" && this.lastFailTime) {
            if (Date.now() - this.lastFailTime >= interval) {
                this._halfOpen();
            }
        }
    }
}

const cb = new CircuitBreaker();
const DELAY = 3000;
const URL = "http://localhost:9797/app"

const opts ={
    method:"POST",
    headers: {
        'content-type': 'application/json'
    },
    
    body: JSON.stringify({data:"My data"})

}
async function helpRequests() {
    for (let i = 0; i < 100; i++) {
        cb.checkState();
        try {
            const response = await cb.request(URL,opts)
            console.log('Server response:', response.statusCode)
        }
        catch (error) {
            console.log(error.message)
            
        }
        await new Promise(resolve => setTimeout(resolve, DELAY));
    }
}

helpRequests();

