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