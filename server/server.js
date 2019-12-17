/*
    Spotify API Token server
        Esta aplicación únicamente toma el CLIENTID y CLIENTSecret
        que brinda spotify, para obtener el token mediante una petición
        POST desde el front-end. 

*/

const recibos = require('./recibos');

const express = require('express');
const request = require('request');
const path = require('path');
var bodyParser = require('body-parser');

const app = express();

const publicPath = path.resolve(__dirname, '../public');
const port = process.env.PORT || 8080;

app.use(express.static(publicPath));
app.use(bodyParser.json());

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, access_token, idtransaccion, msgid, timestamp, userid');
  next();
});

app.post('/generatoken', (req, resp) => {
  console.log(req.body);
  let client_id = '868b1a78-24b5-4bcc-865a-f8389956cb7f';
  let client_secret = '663ce94d-7836-4514-bf8b-97237eb8bf9c';
  let spotifyurl = 'https://negocio-dev.cla.pe/generatoken';

  var authoptions = {
    url: spotifyurl,
    headers: {},
    json: {
      client_id: client_id,
      client_secret: client_secret
    }
  };

  console.log(authoptions);

  request.post(authoptions, (err, httpresponse, body) => {
    if (err) {
      return resp.status(400).json({
        ok: false,
        mensaje: 'no se pudo obtener el token',
        err
      });
    }

    resp.json(body);
  });
});

app.post('/obtenerPreguntas', (req, resp) => {
  var info = req.body;
  // console.log(info);
  var respuesta = MessageResponse: { Body:{
    idTransaccion: '231341',
    codigoRespuesta: '0',
    mensajeRespuesta: 'correcto',
    datosCliente: {
      tipoDocumento: '2',
      numeroDocumento: '10493729'
    },
    preguntasCliente: [
      { preguntas: '¿Cual es el nombre de mamá?' },
      { preguntas: '¿Cual es el nombre de tu papá?' },
      { preguntas: '¿Cual es tu lugar de nacimiento?' }
    ]
  }};
  resp.json(respuesta);
});

app.post('/validarRespuestas', (req, resp) => {
  var info = req.body;
  var respuesta = info.respuestValor;
  if (respuesta === 'Jorge') {
    resp.json({
      idTransaccion: '231341',
      codigoRespuesta: 0,
      mensajeRespuesta: 'Respuesta Correcta'
    });
  } else {
    resp.json({
      idTransaccion: '231341',
      codigoRespuesta: 1,
      mensajeRespuesta: 'Respuesta Incorrecta'
    });
  }
});


app.post('/obtenerRecibos', (req, resp) => {
  var respuesta = recibos.listaRecibos();
  console.log(recibos);
  resp.json(respuesta);
});

app.listen(port, err => {
  if (err) throw new Error(err);

  console.log(`Servidor corriendo en puerto ${port}`);
});
