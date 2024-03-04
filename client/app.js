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

    request(url,options={method:"GET",headers:null,data:null},callback=(res,err)=>{}) {
        if (this.state == "OPEN") {
            callback(null,"Circuit breaker is open");
        }
        else if(this.state == "HALF-OPEN") {
            this._helperRequest(url,options,callback,0,this.maxCountSuccess);
        }
        else {
            this._helperRequest(url,options,callback,this.maxCountFail,0);
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

    _helperRequest(url,options,callback,maxCountFail,maxCountSuccess) {

        let req = http.request(url,options, res => {
            if(res.statusCode >= 500){
                this.failReq+=1;
                if (this.failReq >= maxCountFail) {                 
                    this._open();
                }
                
            } else if (res.statusCode >= 200 && res.statusCode < 300) {
                this.successReq+=1;
                if (this.successReq >= maxCountSuccess) {
                    this._close();
                }
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
        req.write(options.body)
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
const URL = "http://localhost:9799/app"

const opts ={
    method:"POST",
    headers: {
        'content-type': 'application/json'
    },
    
    body: JSON.stringify({data:"My data"})

}
let timerId = setTimeout( function tick(){
    cb.checkState();
    
    // cb.request(URL,(res,err) => {
    //     if (res) {
    //         console.log("Responce GET request from server:"+res.statusCode);
    //     }
    //     if (err) {
    //         console.log(err);
    //     }
    // });
    
    cb.request(URL,opts,(res,err) => {
        if (res) {
            console.log("Responce POST request from server:"+res.statusCode);
        }
        if (err) {
            console.log(err);
        }
    })
    
    timerId = setTimeout(tick,DELAY);
},DELAY);

