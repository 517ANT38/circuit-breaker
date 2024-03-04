const http = require('http'); 

const DELAY = 10;
const PORT = 9798;
const ENDPOINT = "/app";
const HOST = "localhost";
const ERRS = [500,502,503,504,508]
let errorOrSuccess = Math.random();


function handling(res,resStr){
    if (errorOrSuccess < 0.5) {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(`{"message": "${resStr}"}`);
        errorOrSuccess = Math.random();
    } else {
        res.statusCode = ERRS[Math.floor(Math.random()*(ERRS.length))];
        res.setHeader("Content-Type", "application/json");
        res.end(`{"message":"Error with status code ${res.statusCode}"}`);
        errorOrSuccess = Math.random();
    }
}


const server = http.createServer(async (req, res) => {
    if (req.url == ENDPOINT) {    
        
        if (req.method == "POST") {
            let json = '';
            for await (const chunk of request) {
                json += chunk;
            }
            const obj = JSON.parse(json);
            handling(res,obj.data)
        }
        else handling(res,"GET success");
        
    }
  
});

setTimeout(function change(){
    errorOrSuccess = Math.abs(errorOrSuccess - 1);
    setTimeout(change,Math.random()*DELAY)
},Math.random()*DELAY)



server.listen(PORT, () => {
  console.log(`Server is running on http://${HOST}:${PORT}${ENDPOINT}`);
});