const express = require('express')
const app = express();
const port = process.env.port || 5000;

app.get('/', (req, res) =>{
    res.send('Doctor Appoinment server is running')
})
app.listen(port, () =>{
    console.log(`server is running on PORT: ${port}`)
})