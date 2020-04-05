/*
    Spotify API Token server
        Esta aplicación únicamente toma el CLIENTID y CLIENTSecret
        que brinda spotify, para obtener el token mediante una petición
        POST desde el front-end. 

*/

const recibos = require('./recibos');
const validaServicio = require('./mocks/validaServicios');

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
  let client_id = '62a3a397-185f-494a-a095-7133d5389293';
  let client_secret = '250f573b-0cf3-4df2-bb3f-b6e5c2612f75';
  let spotifyurl = 'https://negocio.cla.pe/generatoken';

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
  var respuesta = { 
      MessageResponse: {
          Body:{
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
  }
      }
                  };
  resp.json(respuesta);
});

app.post('/validarRespuestas', (req, resp) => {
  var info = req.body.MessageRequest.Body;
  var respuesta = info.respuestValor;
  var idTransaccion = info.idTransaccion
  if (respuesta === 'Jorge') {
    resp.json({ MessageResponse: {
      Body: {
      idTransaccion: idTransaccion,
      codigoRespuesta: 0,
      mensajeRespuesta: 'Respuesta Correcta' 
        }
    }
    });
  } else {
    resp.json(
        { MessageResponse: {
          Body: {
      idTransaccion: idTransaccion,
      codigoRespuesta: 1,
      mensajeRespuesta: 'Respuesta Incorrecta'
    }
    }
    });
  }
});


app.post('/obtenerRecibos', (req, resp) => {
  var respuesta = recibos.listaRecibos();
  console.log(recibos);
  resp.json(respuesta);
});

app.post('/validaServicio', (req, resp) => {
  var respuesta = validaServicio.validarServicio();
  resp.json(respuesta);
});

app.listen(port, err => {
  if (err) throw new Error(err);

  console.log(`Servidor corriendo en puerto ${port}`);
});
