const http = require('http'); 

class CircuitBreaker {
    constructor(maxCountFail = 5){
        this.state = "CLOSED";
        this.lastFailTime = null;
        this.failReq = 0;
        this.maxCountFail = maxCountFail;
    }

    request(url,callback=(res,err)=>{}) {
        if (this.state == "OPEN") {
            callback(null,"Circuit breaker is open");
        }
        else if (this.state == "HALF-OPEN") {
            this._helperRequest(url,1,callback);
        }
        else {
            this._helperRequest(url,this.maxCountFail,callback);
        }
    }

    _open() {
        this.state = "OPEN";
        this.lastFailTime = Date.now();
        this.failReq = 0;
    }

    _close() {
        this.failReq = 0;
        this.state = "CLOSED";
        this.lastFailTime = null;
    }

    _halfOpen() {
        this.state = "HALF-OPEN";
    }

    _helperRequest(url,maxFailReq,callback) {
        let req = http.get(url, res => {
            if(res.statusCode >= 500){
                this.failReq++;
                if (this.failReq >= maxFailReq) {                    
                    this._open();
                }
                
            } else if (res.statusCode == 200) {
                this._close();
            }
            
            callback(res, null);
        });
        
        req.on("error",e => {
            this.failReq++;
            if (this.failReq >= maxFailReq) {                    
                this._open();
            }
            callback(null,e.message);
        });
        
        req.end();
    }

    checkState(interval = 10) {
        if (this.state == "OPEN" && this.lastFailTime) {
            if (Date.now() - this.lastFailTime >= interval) {
                this._halfOpen();
            }
        }
    }
}

const cb = new CircuitBreaker();
const DELAY = 3000;
const URL = "http://localhost:9798/app"
let timerId = setTimeout( function tick(){
    cb.checkState();
    
    cb.request(URL,(res,err) => {
        if (res) {
            console.log("Responce server:"+res.statusCode);
        }
        if (err) {
            console.log(err);
        }
    });
      
    timerId = setTimeout(tick,DELAY);
},DELAY);