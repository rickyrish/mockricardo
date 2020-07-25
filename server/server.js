
const express = require('express');
const request = require('request');
const path = require('path');

const app = express();


const publicPath = path.resolve(__dirname, '../public');
const port = process.env.PORT || 80;

app.use(express.static(publicPath));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With,  Accept"); // Content-Type,
    next();
});


app.post('/test', (req, res) => {
    res.json({ok: true});
});

app.listen(port, (err) => {

    if (err) throw new Error(err);

    console.log(`Servidor corriendo en puerto ${ port }`);

});
