const http = require('http'); 

const DELAY = 10;
const PORT = 9797;
const ENDPOINT = "/app";
const HOST = "localhost";
const ERRS = [500,502,503,504,508]
let errorOrSuccess = Math.random();

const halding = (res,s="Success req")=>{
    if (errorOrSuccess < 0.5) {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({msg:s}));
        errorOrSuccess = Math.random();
    } else {
        res.statusCode = ERRS[Math.floor(Math.random()*(ERRS.length))];
        res.setHeader("Content-Type", "application/json");
        res.end(`{"message":"Error with status code ${res.statusCode}"}`);
        errorOrSuccess = Math.random();
    }
}
const server = http.createServer((req, res) => {
    if (req.url == ENDPOINT) {    
        if (req.method=="GET") {
            halding(res);
        }
        else {
            let resBody = [];
            req.on("data",(chunk) =>{
                resBody.push(chunk);
            });
            req.on("end",()=>{
                try {
                    resBody = JSON.parse(Buffer.concat(resBody).toString());
                } catch(e) {
                    console.log(e);
                }
                halding(res,resBody);
            });
        }
    }
  
});

setTimeout(function change(){
    errorOrSuccess = Math.abs(errorOrSuccess - 1);
    setTimeout(change,Math.random()*DELAY)
},Math.random()*DELAY)



server.listen(PORT, () => {
  console.log(`Server is running on http://${HOST}:${PORT}${ENDPOINT}`);
});