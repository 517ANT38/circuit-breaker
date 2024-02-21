const http = require('http'); 

const DELAY = 10;
const PORT = 9797;
const ENDPOINT = "/app";
let errorOrSuccess = Math.random();

const server = http.createServer((req, res) => {
    if (req.url == ENDPOINT) {    
  
        if (errorOrSuccess < 0.5) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(`{"message": "Success"}`);
            errorOrSuccess = Math.random();
        } else {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(`{"message":"Error with status code ${res.statusCode}"}`);
            errorOrSuccess = Math.random();
        }
    }
  
});

setTimeout(function change(){
    errorOrSuccess = Math.abs(errorOrSuccess - 1);
    setTimeout(change,Math.random()*DELAY)
},Math.random()*DELAY)



server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}${ENDPOINT}`);
});