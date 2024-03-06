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

    request(url,callback=(res,err)=>{},options={method:"GET",headers:null,body:null}) {
        if (this.state == "OPEN") {
            callback(null,"Circuit breaker is open");
        }
        else {
            this._helperRequest(url,options,callback);
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

    _helperRequest(url,options,callback) {
        const {body,...opts} = options
        let req = http.request(url,opts, res => {
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
            
            callback(res, null);
        });
        
        req.on("error",e => {
            this.failReq++;
            if (this.state =="HALF-OPEN" || this.failReq >= this.maxCountFail) {                    
                this._open();
            }
            callback(null,e.message);
        });
        if(body) req.write(body);
        req.end();
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
let timerId = setTimeout( function tick(){
    cb.checkState();
    
    cb.request(URL,(res,err) => {
        if (res) {
            console.log("Responce GET request from server:"+res.statusCode);
        }
        if (err) {
            console.log(err);
        }
    });
    
    cb.request(URL,(res,err) => {
        if (res) {
            console.log("Responce POST request from server:"+res.statusCode);
        }
        if (err) {
            console.log(err);
        }
    },opts);
    
    timerId = setTimeout(tick,DELAY);
},DELAY);

