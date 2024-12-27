const express = require('express')
const app = express()
const port = 5000
var cors = require('cors')
app.use(cors())


app.get('/', (req, res) => {
    res.send('hello')
  })
  
  app.listen(port,()=>{
    console.log(port+"is running")
  })