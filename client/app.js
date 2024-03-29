const http = require('http'); 

class CircuitBreaker{
    constructor(){
        this.state = "CLOSED";
        this.lastFailTime = null;
        this.halfOpenTimeout = 100; 
    }

     request(url,callback=(res,err)=>{}){
        
        if (this.state == "OPEN") {
            const now = Date.now();
            if (this.lastFailTime && now - this.lastFailTime >= this.halfOpenTimeout) {
                this._halfOpen();
                this._tryRequest(url,callback);
            } else {
                callback(null,"Circuit breaker is open");
            }
        } else {
            this._tryRequest(url,callback);
        }
    }

    _tryRequest(url,callback){
        let req = http.get(url,res => {
            if(res.statusCode >= 500){
                this._open();
            }
            else if (res.statusCode == 200) {
                this._close();
            }
            
            callback(res,null);
        });
             
        req.on("error",e => {
            callback(null,e.message);
            this._open();
           
        });
        
        req.end();
    }

    _open(){
        this.state = "OPEN";
        this.lastFailTime = Date.now();
    }

    _close(){
        this.state = "CLOSED";
        this.lastFailTime = null;
    }

    _halfOpen(){
        this.state = "HALF-OPEN";
    }

    checkState(interval=10){
        if (this.state == "OPEN" && this.lastFailTime) {
            if(Date.now() - this.lastFailTime >= interval){
                this._close();
            }
        }
    }
}
const cb = new CircuitBreaker();
const DELAY = 3000;
const URL = "http://localhost:9797/app"
let timerId = setTimeout( function tick(){
    cb.checkState();
    
    cb.request(URL,(res,err) => {
        if (res) {
            console.log("Response server:"+res.statusCode);
        }
        if (err) {
            console.log(err);
        }
    });
      
    timerId = setTimeout(tick,DELAY);
},DELAY); 
