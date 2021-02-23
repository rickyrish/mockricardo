require('dotenv').config()
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { generarToken } = require('../providers/auth');
const { validaClienteProvider, validarUsuarioProv, consultaExpediente } = require('../providers/claroProvider');

const app = express();


const publicPath = path.resolve(__dirname, '../public');
const port = process.env.PORT || 80;

app.use(bodyParser.json())
app.use(express.static(publicPath));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type, Origin, X-Requested-With,  Accept");
    next();
});


app.post('/validar/cliente', async (req, res) => {
    const dni = req.body.entities.find( e => e.name === 'CARDINAL').value + '';
    const forDni = req.body.entities.find( e => e.name === 'FORMATO_DNI').position;

    console.log( 'position dni',forDni);
    if(!dni) {
        return res.status(400).send({ option: 'NO_ES_CLIENTE'});
    }


    let nombre = '';

    let option = 'ES_CLIENTE';

    const responseService = await validaClienteProvider('1', dni);
    console.log(responseService);
    if(responseService.codigoRespuesta === '0') {
        option = 'ES_CLIENTE';
        nombre = responseService.listDatosDocumentoClienteResponse[0].descripcion;
    } else {
        option = 'NO_ES_CLIENTE';
    }

    const respuesta = {
        serialVersionUID: 7675675232,
        hiddenContext: {  nombre, dni },
        openContext:{ nombre},
        visibleContext: { nombre},
        option
      };
      console.log(respuesta);
      res.send(respuesta);
});

app.post('/validar/cliente/getname', (req,res) => {
    console.log('valida cliente getname');
    console.log(req.body);
    const {answer, hiddenContext, text, code, info, entities, intents, openContext, visibleContext } = req.body;


    let mensaje =  answer.content.content;
    let nombre = hiddenContext.nombre;

    mensaje = mensaje.replace('[nombre]', nombre);

    const response = { 
        serialVersionUID: 76865634353,
        answer: {
          template: 'TEXT_OPTIONS',
          content: {
            buttons: [],
            type: 'TEXT_OPTIONS',
            description: '',
            content: mensaje
          }
        },
        text,
        code,
        info,
        entities,
        intents,
        hiddenContext,
        openContext,
        visibleContext
    };
    console.log(response);
    res.send( response);


})

app.post('/guardar/reclamo', (req,res) => {
    let {body} = req;

    body.hiddenContext = {...body.hiddenContext, nroReclamo: body.visibleContext.NRO_RECLAMO }
    res.send(body);
});

app.post('/validar/reclamo', async (req,res) => {
    console.log('api /validar/reclamo');
    const { hiddenContext, visibleContext } = req.body
    const tipoDoc  = '1';
    const dni = hiddenContext.dni;
    const reclamo = hiddenContext.nroReclamo;
    const password = visibleContext.password;

    const resultServicio = await validarUsuarioProv(tipoDoc,dni, reclamo, password);
    let option = 'NO_OK';

    if(resultServicio.codigoRespuesta === '0') {
        console.log(resultServicio);
        option = 'OK';
        const respuesta = {
            serialVersionUID: 123123,
            hiddenContext: { ...hiddenContext, loginUsuario: resultServicio.loginUsuario  },
            openContext:{ },
            visibleContext: {...visibleContext },
            option
          };
          return res.send(respuesta); 
    } else {
        const respuesta = {
            serialVersionUID: 123123,
            hiddenContext: {  },
            openContext:{ },
            visibleContext: { },
            option: 'NO_OK'
          };
          console.log('===========================')
          return res.send(respuesta); 
    }
});


app.post('/consulta/expediente', async (req,res) => {
    let {body} = req;
    console.log('====== consulta expediente ======');
    const { hiddenContext} = body;
    const nroReclamo = hiddenContext.nroReclamo;
    const loginUsuario = hiddenContext.loginUsuario;

    const resultServicio = await consultaExpediente(loginUsuario, nroReclamo);
    console.log(resultServicio);
    let content = `Su reclamo ${nroReclamo} esta en estado ${ resultServicio.estado}
            tiene un plazo de atención de ${ resultServicio.plazoAtencion} y un plazo
            de notificación de ${ resultServicio.plazoNotif } 
    `;
    // let quejas= '';
    // if(resultServicio.listaQuejas.length > 0) {
    //     quejas = resultServicio.listaQueja.join(', ');
    //     content = content + quejas;
    // }

    body.answer.content.content = content;

    res.send(body);
});



app.listen(port, (err) => {

    if (err) throw new Error(err);

    console.log(`Servidor corriendo en puerto ${ port }`);

});
