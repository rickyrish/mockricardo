require('dotenv').config()
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { generarToken } = require('../providers/auth');
const { validaClienteProvider, validarUsuarioProv, consultaExpediente } = require('../providers/claroProvider');
const fetch = require('node-fetch');
var cors = require('cors');

const app = express();


const publicPath = path.resolve(__dirname, '../public');
const port = process.env.PORT || 8080;

app.use(bodyParser.json())
app.use(cors());
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
    let content = `Su reclamo ${nroReclamo} esta en estado ${ resultServicio.estado} tiene un plazo de atención de ${ resultServicio.plazoAtencion} días y un plazo de notificación de ${ resultServicio.plazoNotif } días
    `;
    let quejas= '';
    console.log(resultServicio.listaQuejas);
    if(resultServicio.listaQuejas.length > 0) {
        console.log(resultServicio.listaQuejas);
        quejas = resultServicio.listaQuejas.map(p => {
            let queja = p.nroQueja + '';
            if(queja.length === 2) {
                queja = `${nroReclamo}${queja}`;
            }
            return queja
        }).join(', ');
        content = content + 'tus quejas son: \n' + quejas;
    }

    body.answer.content.content = content;

    res.send(body);
});


app.post('/conversations/',  async (req, res) => {
    const { session } = req.params;
    let {body, headers} = req;

    const url = 'http://52.184.198.151:8082/conversations/' + session;

    const service = await fetch(url, {  method: 'POST', 
    body: JSON.stringify(body),
    headers
});

    const datos = await service.json();

    res.json(datos);
});

app.post('/conversations/:session',  async (req, res) => {
    const { session } = req.params;
    let {body, headers} = req;

    const url = 'http://52.184.198.151:8082/conversations/' + session;

    const service = await fetch(url, {  method: 'POST', 
    body: JSON.stringify(body),
    headers
});

    const datos = await service.json();

    res.json(datos);
});



app.post('/apleacion', (req, res) => {
    console.log('test')
    const obj = JSON.parse(`	
    {
    "MessageResponse": {
        "Header": {
          "HeaderResponse": 
            {
              "consumer":"USRECLAMOS",
              "pid":"20210316121436",									
              "timestamp": "2021-03-16T12:14:49-05:00",
              "VarArg": "",
              "status": {						  					  
                "type": "0",
                "code": "0",
                "message": "EJECUCIÓN CON ÉXITO",
                "msgid": "DPS01-18aa1b7e-c734-4532-afeb-efc974d8f69c"
              }
            }
        },"Body": {"idTransaccion":"20210316121239067","codigoRespuesta":"0","mensajeRespuesta":"Operación Exitosa","numeroQuejaAsociada":"210076362-1","fechaQuejaAsociada":"16/03/2021","horaQuejaAsociada":"12:14","cantidadDias":"3","constanciaQuejaAsociada":"JVBERi0xLjcKJeLjz9MKNiAwIG9iago8PCAvQ3JlYXRvciAoT3BlblRleHQgRXhzdHJlYW0gVmVyc2lvbiAxNi40LjUgNjQtYml0KQovQ3JlYXRpb25EYXRlICgzLzE2LzIwMjEgMTI6MTQ6MzkpCi9BdXRob3IgKFJlZ2lzdGVyZWQgdG86IEFNRVJNT1ZJKQovVGl0bGUgKFBPU1RWRU5UQSkKPj4KZW5kb2JqCjcgMCBvYmoKPDwvTGVuZ3RoIDMwMzcvRmlsdGVyL0ZsYXRlRGVjb2RlPj5zdHJlYW0KeNrtHGtv2zjyu38FcZ+6wDohRT17X85N0j0v0jpN3N3FIcBCsRVXgWy5fmSB/fVHig+LzIiRYneTFkGBgoyG1LxnOEMZ4SPPR5j/U4PJHPUQ+ooQIjis/iJG7H9KEKJeUsEcDwlGpyX6hHqkglrNEMURojTy0JzBxqEYF3LsxQkbVyBi+AXd8rUzRNAvqPdu3Dt+TwgKMBrf9qifsNXER+MpevN+dPnh8/ngcjj6CY3vEA089jr+4PQMffp89uug+nMPs60w36raxydHYRhGfLN+4Meon/DNem9OxR5YbpFWU4/K6aaaEl9OS/E0lNO1WKueTs2nmblVYU630Fb20wDGaiWwiuQ0F1NiIMmpxgbVFHuoH4QV1R9Nqktz/7l4qnC7Ad/uw2RKnngmT6iTJ55JtbmVh+GnqRMryROTQJrETLn4/LfhyXh0if77+RehQ72zcY/rCkF/sRV3KMEYURIQrrlc9fiwEEOP6X4hAMTwiqvaHVLL9VLiMw4GAVplAkRqo1BsQzQkCtgSHFeoCe31Yon5sgUDNZnW1GKCJYvyexJcJAV3Ohz8D12Ofh1cNcsNJ4GSGx8WSoRYyU0MIblx+I5ywwGtMBubBm3RsYR4TwMXs/XTU6exTsSUwMy2TNkS4wL0dt5TkByaa93q436vW20t9ZlKX6iZ9VFg4hP1F8vXrUCXrrY7ElO/Fc1ug3ohgnFz85sLxlcU+l5Ag4T4Drv1sbZbHyu7FSasrVPa7W4py0KoWqu3MRZICGixh71Av1hvZC6RMLvlO5+xW055qtLWZ3hJEkOWbfHXHWgt9bKm1lbXNKSQpEOGtnCsJwN0Mbocj04Gl5dnlyPEaWsUlZfEysVWw6IutZoQABdbwXdzsV7i0xbssqKOpbvuMAMaWMgwFMw5HyCRMQwH0rn4qC8eXZjh2u1d7s2phcTCKWALWFgbYcm3RHH4YeCQF8VaXlSZlhSdlgpsWnKt3sZYICHAxWGoF+82MpdImBgwrd3yMKIddCWOQdOyjGfZJSWxlCM9tCMPPNJKiHGkjY4Pi7o8a+KBjI7DdzS6mKWCQD66bUFQy9zub1PBtY8KE9iiM2jzIIE5XXaJZLdi2mCXliGCcc56ryYBVIcwhvN1sXM/ZGLs+zHEAguzGXhqbCCjk2YK4KghD/rnA1XkTHY0ntbmbnV0o10+FIb78OUm2x2Omsj22qmklRBev3FGoWWXOFM60UqdHLn+SeAVKX2//zLN079X5X9m8zQvjiblvNnbRWxX6e34sFCOz1feTgwhb8fhK2/Hj+Ft3B3bOIwJdFq49kIsaExaZdttXJaWy30XGcMH4wCW6TWNPPMvN05JdVIvK+I91F03XVbt4IUpa6AqDYmPQ5b0J6RZRUPmyKWK8mFR11atiLCKcvgOATlguVAQi/LnmRmQF6ZwJqYCpuZ51lJPS7BwkYc8xcuLtYkzZQpgLG7NcubWpMBtUalZkV2aa9tULjUFrcIlgdk8dVZ7ls5MZWWWfi3yFyaBbopg8q2jv+/0XH4X8i1e+TCwheTPJvAE0lD9dA7Kt11AdovMYrupvyXEKl0qXUM+KfmHUrSW9du0S9puEfRWeMA+CRnj+8xhvdwOQit76IKG9yTRpN3lCAaYgIQqwPChDDBBRFSAEUMowHD4DgEm9ph6R/5324H4wQTvh6r1VA2Lug5o8cKC5/BdBU/i1xbGc7cwghi/Niyev2EBmyPWlTc+LJRl6sqbGILlU7FWb2MskBDQ4qq1oF6sNzKXSJgQN3QmqiXtOxP8kEFDMAZYnLszUpxtl+wPLLU+cmeCHE59gwOo71dnSmdpc+pE0h2JwKpb4gomOjMGK4uPHBv8PaLlIU5NE2et89ES2ZG+92Le9knihJfxHLd9LFWlzts+lhMLYLEXEKX66Scxbbjtk0HGZqUY0PUeypLzqCLTKhFYrnufbEi8nfdmRJVkML+mAVnlkxR94BK6zwsE+1Eas2yNVmlNgMWwkMO4SmsqgBhKa9RSQpOkbQcjYjrJBM9xvDK58a1rcmGkbhmNsyK7LReMQ8GOPc3cIVGouMOHRZ1Rmgcwdzh8V+5Qv13BswQLTKTRLN29gln3LLIp53+uWus+OLsbFO4wBNa63DGrH8a+bl9MuwSqG2esXbTIpOyWmHaGj1RWuT7jiCpT4MOibhVa4WFT4PCVKRDmEFvaAqbyEoRlCwfVbWv6tEbD086/YHGW4FYNbYl25Eun5hGMo5CGnkN6JNbSI7GSnhCkllGD9Bh8N0dGkij89sJ7riPLPp3pp3VaW5IMJ5jq6b/E0y4Zs53vNGin3NmLbXXsN7sTkoTKnVTDoq6bWu1AhazgOygkO0ORxCNQPaFTNdey52UXb+zWZDj3dMoigYXcqo8ROhpCeifrXOAOdAtn32K2R8/jW1hIQwvMqnVaNLnvLVhNEHhn2gpH91HAfcDuclidQ/4yeUqrqXRKcJ9mUtbCLyeuSpK7uGC3z01e2BWBBoXdu8tqn5b7LITyCy7is5APzpTQ0g4w+DT1oUtnG9Pd5HT3sK0mp1XpsG8X/GGeBWXT3wtalU065eMLZ51ktkeNxVTFnZdqYB8cfH24bnTAC1QW1q1CmN/KviyxrKHCH/0GuYduhPLL4Ox/2Qkt0TJbzfNNvkJFiparbJ0tNukk55JZoGlWsMRhUqTz8pgPtqs1G3zdZnfpvxFbWlarFtks3eT3KUoRW7xisxViCyd8j2k+Kxnkx2sv8Nh2SH3epqw2n7Il+W0+gd75s3on26F66RGYJnn8g6WIYJUm8aFIk0hMeNWhAhBDu9Sslno4Dhnv2ly58hLKb/iK+gxj4KRcbLL1jmklY8tmu0jrlDTjzS9qS7z5sKiToLGD8ebwFd6t0juBtvwM8Wq7XmaLdY3l62x1n0/ykglxma2ZBJmwNtkiWykSmGzRZnVNfcLUJXMQhLUg+LCo06bRbiAI464EBYGWQ1Zk92mlkOkyK5Q4jo0nlRY14x74Whh8WNTJ0BjCuHP4rrhjIYzhYrKdL4t8njNbKDnjGabMEstiK4loxthPNLf5sKgjr/GCMebw7TEm3D58L6xFoh7BEXcw3I5Hm1W5ZqjfZpNNNWC6kjJF0VaxRSX7yxrN0022ytmAiYIJarXNbjLuLU7KxTq7K9FpzvSNeZOy0srR1fBifHaOrt+sM7YPSQvuWxZsMS/dPvAmzBTX+ZqprYyNIMtonCiW0erj3Rr3NGNglnH4rp6CygrWRVl5xVXGCF/VZL1MZ4LWecn/IqwtnZawg2WP85u82qlamKLJlnvs2g6csTZjFswINO/bOSYvVoWQaljUOaaZAbOJw7vZZHQ5CIt3hCRRxaaReQS4cX5qDB88Q7hsClcYrOqE9yAzCY0o/0DGVKRjvQfZmlW5z82al7vM4q4Ou4+y7iTBfaSyymdpl2vdt2DyT1t94ORurLrvvs4euz28cB4M4IycPuVefOl80XTvIn6nu8Fa0zp1fDuV+N0ViGkbU/VbHe2zLp84uT9M2+eWogwq+sXW9RXr2oGbO5aluT8HBKvaTZdQ97/j/8iNBq9VARe8rf3gBO95/Icd/KTyoO6aYyf7SVvU85rqv8910eiwFfDv0fs811VHpY0xO9T1CREZ7cXl57N35wN0eXZyPvgweouGH4cnw8F4+NugHyb1T8FrH37yFAnz4ySJIxRFbZKfgKKE0JoHsS/PRXDC8sWs/lj5yz2oxAF8HcR6r/VbMHfgNw1mWuQFHX50xq5J6N/NeXgvJCJMIKFIsI5MCo9MtOCnr8AvEPiVV6/ADdP+rqLfcvd9MHshO/94L3ol4YcmYZfQyAe9N3+akf1Pac1BzKw5qv3JgrCnvvPpPtPvYufvAcm+zzJSJdT3YBKK4X7wHDqhPEiIk1D8ck1PbR46azFWOhy6ul9elKifviHhMabH7PRJGq4k+xjrXxy8cP6MyAE/H7FKCO5yxOIQ50WLQ4G6mvT72Tt18pG/Vmdw5Bnvq1k8mh2uvvNW3g+XLPh85WDAwT8hfSHU+0mjArCz7v8B7N8QhAplbmRzdHJlYW0KZW5kb2JqCjExIDAgb2JqCjw8L0xlbmd0aCAzMy9GaWx0ZXIvRmxhdGVEZWNvZGU+PnN0cmVhbQp42lMw0DMyUTAAQRgjOVeBq1BBP8BIwSVfIZALAG3BBrMKZW5kc3RyZWFtCmVuZG9iagoxMCAwIG9iago8PC9GaWx0ZXIvRmxhdGVEZWNvZGUvRmlyc3QgOS9MZW5ndGggODMvTiAyL1R5cGUvT2JqU3RtPj5zdHJlYW0NCnjaslAwUDA0UjC1AAAAAP//srHRD6ksSNUPSEwHEUWpeSUKlkDJIH3n/LwSIK9YwRzMDUotzi8tSk4tVjAE8e3siNBpaIhdKwAAAP//AwAZ3CU0DWVuZHN0cmVhbQplbmRvYmoKMTkgMCBvYmoKICAgICAgCjw8Ci9GaWx0ZXIgWy9BU0NJSTg1RGVjb2RlIC9GbGF0ZURlY29kZV0KL0xlbmd0aCAzMjEKPj4Kc3RyZWFtCjg7VTwtNGA/IS0lIy90VEt1XjVUIkhKTnEuKzRBWi0mLWxJWyt1bFsuKzQ1RytVbjtHYGRzYDIrZzo3UVowXilECkJzNFg+Km5aNihVLWZIZGRhSSlgPFtTRl9TPFNjcCRyUkNdQTVVPiQ+QD0vOGdENWlrWCUqODdTWnBGOj5lSmhMCmU4PWViRE5GI2FZXWhKQi42WU4zLyxUO1BUTmVQM2lKY0pYJENsYWUwayY9QkRyOkMvNmh0RFQ0P0VgY00yVWEpClxtQS88RmRoaEMnYU43WklrQFluTmFeX2xqKGpuV1A0SlwhJ00kOTs5KjBCdFVHUGFMJEFzYz9gc1tIXWljNTkqCiFuQiN0NWYmWWdgbnMmOExzQycjLFphKVtmNkcySFBEZ3JNcEc2I2BhVG9OPz0rQztPLUBnRCt+PgplbmRzdHJlYW0KZW5kb2JqCjIwIDAgb2JqCjw8L1R5cGUvWE9iamVjdC9TdWJ0eXBlL0ltYWdlL1dpZHRoIDQzL0hlaWdodCA0Mi9CaXRzUGVyQ29tcG9uZW50IDggL0NvbG9yU3BhY2UgL0RldmljZVJHQiAvRGVjb2RlIFswIDEgMCAxIDAgMV0KL0ZpbHRlclsvRmxhdGVEZWNvZGUvRENURGVjb2RlXQovTGVuZ3RoIDQzNjE+PnN0cmVhbQp42qXXWTQbarsH8CiqSqsxz3YHQ1BqJg02KnaomSCmomhinmNud82CXUnMw1aJGKtm2qiKqdRQU40tiaKoEoq0lK/7W+d8N+fmrHP+7837rv/N77l51nrPZs+WAVeMoTAogOkcEwD96wDOTgHcdw317tiYm9+1/i1cSUvhFuBsAWAAOPf/zFkv01MAgImV6d8B/FeYzjGzsJ5nu8B+kYMJwMz03/kf5RXAOSZm5nMszKysLCy/mthfHYAFyMp9VUnvPI+lG9u1IF7lR0/KLlzXb+jmsxrfvaHiHvwn+0V+AUEhYUkpaRmQrKqauoamFtjgjiHU6A+YsbWNLdzO3gHhcd/Ty/sBEhUSGhYegY6MepyQmJSckpqWjcXhc3Lz8guelhOIFaTKqurGpuaW1rb2jheUnt6+/oE3g0MTk1PT72dm5+aptJVPq2vrnzc26Xv73w4OjxjffwB/kc+xsDCzsP1DZjoX8c88QBbWq0rnufUs2dyCeK4pP7rAq/+krKGb/bqK1S6fe/D4Rf4bqlRJ+j/qf6P/d+Y//0/o/5j/Qz57DQBeAMgC5JiZfumBAGYg4GwewMnM9Ovx664L+ElhpNJ5enQ5ISqRtFLej7E5/QtAPRa9+51TAQS4T+xtszb5ktjV/v55YrZMOcxfQTJpXqgia3RE5a646eOqjP6pw9CqDcE6lG3lzltjnEJHtdm8HCE7GIu5DlIkUHV4R9vHwD33tS4LbAkOHRWtSn/ZZUAgora+Lgp1hErq532jAjhuXUsfL2NTZ1WsFWd6YvGz5lSacbpJWzKa+grhojaOtv7wehR8+AP3fH3Vz8gpxTBWfrhjiQ8757B9VfijVYXdyW3wCnldpYiaWCPfxhZeZnJJWngvy8iRRxyRaRogHDfKHx6EdRo73noUl1UEpOBk7Eae49rLwZaYGvcmY6Wqh+XWEaLidjq+qsi+hZwKWc0iA+SoGqgqWvNkPCwiIlrF6eMHpw+LWm/HwiBNo+vPEA4OnzxKgh216jHFiBbJMSvCptnRWhER5PoSVxifepwpwprQbWUfIyWcxJ1gixfVFg4FSfo4WJMEu+WQT2d3yGL0AJrRQwW3UsrHW+9rryfizgDeJpGSX5/IZlapY6P8VY84O5xpHzwNb/RdUxeM6oi/sq5lsyIvrgs0U0IeC41M9Qx9kISS1LSbX6RlO8L8Y+K5GT6vTxygRPmdZOX5A6kC+3lB9L19YdM6SXOJRJsGS+TWW9lsklQnA+asO7k0t3NYPvFKDhLHT1flf8GWWZ5YcsEt3FmuV4mSuJ5rrHL7bUAkJ2pvjDgi/+w3eEdLCU21w9F1jmGH2f2+/RxdacSe369hkR7Xw5tNJuoNdkCDEEOYwphX3yRVCWUnGrT1R3O5yeS5UWtEqx+lqfJvOt9vrzpxowQccmKYT004TGYKa0HMJF0MxEOr4ERoMGHrZ7DcV/Nurn6J+R5a7EzWKxlUFESDM0ZjOTq9mNmkDX5NSE0uAuhTkK4Q3jzp2nsY9Ea5y6OxDdQ8eDV+ffT2KCl/XS3wee6xlAOIWqWnG277dKJ3unG8Te3L5EJ2kR/d+Azw+Wh8/1HgCahbEPKx5cKAFq1AtemuM9JQFrfLZ6dj9xhTQEYOXNKkkQS8DzCmhnLVoVNxbm/E+mJgxyPvmjm/QJiWj7Mk0G97Ti83k5PN2md2THF2bUDI84VbbQXLgzcsG19i9O0uvl59NMoaJQR3lZ9RoqxObUITGmzFNKdwTuXny7Q+9KnOH/mVb4WstQ+kggLjL3ktwhw5rEVMQD0DQMhN2SdEq0Y8KjTSzSoI575jafz1poNahwdFR5CeuOKjA9odPGZx5XoqfLCTsvYy3aRlUkG+govU5xcdOMhb0Lk97COeT4KOBEXqAC0qDsWE4lzzjO2LwtmrlYbs3qPcVy0tEkET+I1+FSxspghfZWWHNyLWHuyjC1MYPlwmctSTQy4hO8z9RrI6zIgLEn6dz0DAPJcP0SqcFgZaZSBUcPS8Oajq7q4Zcv9G1lxXYqlAaIBojPZufVpAffPxJQObSbZDPAFLkBKzGops3r5rxFM8yLw07wTzFbmxQDaS1tJ9l68QkTzcWMuvHoa0rHLJ2JwMMclu0TLG38e2vdx207hMR9Zx7ftktovcouoojKHjkkT4Uns8Z2dExdCTuJ8VHECzEhVWkLHSalhcVcrTGkdDW1MHxMCaRE9ZkOfyUpoEUDXg8sapPCOdyCiFNdurmUrdjD8FZojYYa3bpyHm51ODRHcXP5hWGoiX+JNai32vDCqxi4x10cllZjmuJV6zMZLy4QEGYtCLfJ+NuHfRvgZ1YMYbt08EooalrD+hXPF+vdxCaeFxAOYDpzmQEd8dWRKGoX7kGAg8VeGRbReN2UssXrO/cK9yuRHRkaE1USx8hTKVA7IgIbh4pAUlZdOwyRFPDWp8Dktu0tnSdYQ/f+SZPjCf26fhp8AZeGJSzitQNmXfIG3MRQeYqYrV72rdL+GbhnM8OHiiWPoA0o4+CByvTyNl9Hk0+uowA10TQ/L762Ss/m54hr97jZSK5sX22JKGaTUy3fAu1VCYYvbwes6n2dpkKepXjWF0svzbE8flKOtu92oavXRWqc9tH5GHeQYx+LUaCtzkXhgTdkUPPHNfxA01BRfVtyi+rk/msXfZWDfJNZqBSNPqE6IUWli70sK0XR2yJUTRWbDxsGhX7rLx5d3+wrh7rwo2KYqcKMRjR5wB+l3VncKoIkVsNGjCHmnRu9wwxy9Odsusd3mZ6ZnW866eE3F4pXuikgq3JopKIjLVrYqbrfYfoFsGbOihSq7zNvTvLpF/MR7nezbV/XVP+csLvJng4L7ogGJ99qBH9Tp6WLYmgWjEJ7/DlmAbSRKWJXSsm+S7sp+o7U6d3qZHJJ+IrWT46YighyQAiM8F5piA2rD0YqhJne8H9ILVdGisyvYP9RKP1nToRG3t9fvRCdaRQfJtVnmR13M/5YHW7E+kHPPd+S2zMu04tTljEehUeEhvyBofiroR7aQtB9WMukUoCIZNYXGrb7fHUtp3wEQKWauIrsHhmZWh6R/j7Kg8jI5gS3lbuUw1UEDHCXcvh3Bad69pvkI1DYdwQkH9FiStWJdicCjo+G69KCOaUmC72MV5MJYGJj0ki1QYlqMH9Hdb1h/7k/WqjSrRPSam5hbNdNP+ZKmiI/DoQ5fbtyMP3IKCczQs+5ihVb/FqDgpsHFJY92bXnyHOxtaDFADbZV/5FVvPtPJba0zF4OokMZcL84nSLoWoIom4E1dZd3f266sVA5kKpcAXtMjuD2k83YPfUrdGDlJpg/RLuL9sSZsKW8eeOHoQeW5aw2Yrekk5tnxHKkM2BSmaCWguPYERhNT/uAb2qn/BXm4Z9baL7OaISQeeV+ZZXBu7XZzIrukQ1r2H2p7vA2zixDtTHGiEZS7oGLKk+/GOijEsdDMa7Fu4lDXu++TqG6eHXp4kj0xSacTzN1LIRorF2tV8y5XdewdL/6FuUdozk7Lhqlm2TM6Ceia5fj+LD7pZDVTx56siOiw2s/gTHxY0L0j4csdgUcNC6lXQ48NW2rXnME0kEGfZN9jAQzVNNpJz0isB2KY8QMfxTD3sUIXqRnzSZoXXkrFVpahW0YumBfgyuWeoSJaJrx70AEY6hJvjMobj+LV73EhB/JqnE2q3SvPvzXIJiHx40lC71erhMBqDbzaJQp4Y38VmwYY1HjPZOgZOWLFZNsEPr0TY/vsI6pg7UnI36iZo6iMvr6R09TIpm3w3b3hr0tze9+RhYYL5xKYgL/XX6zwybetc+l08pci+pqyU32mix2Mw25N3xzTN+2i3lYMQoAfZL17EOh9kXrLIc4x8Y0yWZ1ZblhmbS6OP+lyhrCm0+RlQuUaL9VMydUxGbLt4jQtobKGnZjfP3FgFIYE8BHHsiDWIX6cBXfH9UJqnce4zcs+6sUTFi+sPpnZ5tdobZ25NWpUvLbw2nlh6PdOnrH9jv5bJd4ZuOuyPBhpl+C0HGEC6l0xYanLjHBV8y2N7BHxgEDedBEJ5Bev3XpHlc9MROHo30jwzHOJoKFM7+SaxIHxYJJgl0dqj10dlCiJisGjZPohe6/MMla6hNER9lMQvTI0yWkirA5hkhpmCu2xKJlfsczejOhoj14RkV3MV7gf/XhdbjufPD3PcEuSUB9+jk6brVXQ4EnudZcE2dUY15aBG4uKPm06zEdgg4+wTRHwqJIc727yzaLVdtFS1TfBw3EOOZQMSBdbGsWqxoTVLFFznCiqCHGqlBlPQCKKykfMZLnJoVoLx8fbZntbVlM7Cgdi0EPvdnJnZ3vO171NmkFuAY3mFVmBH/xePJefFbVSA2+9Vrv5vgo8XQ0bCpOFjRLWjoJxhdiAl9q14hys+OXPy88FnXTYmBMIVW677QibXYavtszNq8YZMv3FMoahGKvNuIaY334WkG9z9bheKBVAZmcBnTbqKlGWRdDDnWrnxU31Q+x1ECjIGxkWgAwkfDLnfJyJP+7Xo2iCI3XOaf7g2vLPaq599pS2ZRbmcb6OUEUJSujq5I8vKbnGGCh2Ry+kkHpmZwekSJn2ThywUTXkcuC3QFsl3nUhSVn76ilZGki1hQRnqzyJZ/ARTh7sLgbKNyDj5MZ7J9ERiFAp1chz+d8+3IFyZiNziTzDMvVqhA2xRXapubpnsf7S1FrdK8srpu3j/W7fiQm9LbsdkiPGdS2hKIcQxF4Czpt3Pij3DdqaFudBLYmQv3sV4mWUFy3rMOogtPcCtzF4DHEBDu4ZiCRZlzatNctN4iptcTZl8KyV3AwyE20nGdH7QgKjajIiTBfq5TYR8hFh/LWyDfbbY/aL9Z2TID+aLdNxess7RK/fP/TGeQnpXLP3DRcmsld8vz+9YWOybVUjEUyIoX1tzTb7fAYwQtth2gMwe5uRuZfX8mJihaAKLYKDBgKPi/AfRL244fVJ1S3wKlYh4piZdcWKxsBMQezvjKc5SPc/LxAKIgl/lCXxIiVzHC5PZWq+E4gUS7G5w5r3F0Cq+gpuVVBfGfdpAuNeiPWbk+lDLQTcwc8Vo6YCp9YRnYhQmYn0YuMWb+HQDYrsXtG6hiAFCOswNr3R4vvz/M9CXU8xhxZtjYEzAM+395NfaiXTjvV28V+iA/y/rnhmL1nM+OV5Tbyfo7wNqLjLOjK8WRfLyz8uEr30XlP30Ra0RXRSq/zLCqw6z4lzZkfSSoFek/qYcZ3NW1j5aFWR1q+UJX8GyDxB0XdYrVkxVPHzfT+90JVTlLW5U3F4z2TPiCa82zPMjr4JT8eDZzcDZicJi4FNNVaklrIf93/9u1+LsRHjXsULpP8uupT6zVnEeVJB9WcIbFItnS3NKPomnDJj0extE1v7fuaJKYfyGYCD90a42lhaD5Wu6m0C1M+8hjV9EbahX6f+foQShAvY0+asURpWrg3jdHHI7PdsrzSVoQUKVjMgd6xx/uWOXOCwa6U2BKwu3yvpDWGz0hWOGsdLimYNrY6ttm1Nja2tj+yGrz9IEsy+1b7CFJR2Gju6OxullVBmwgXFaZc74Tb0gW3qiw1pro9OMwMVkPk0BiojxsUjq3fmRzW2LqXfXc527RC5D8bLGsfMvD/qHBtfmsNSSgSadwng6fqkbxx+3iPAM4CP4+cfoeDSHA+ngUPGds6W2+BQ5EszMyO1HwNsy4E2z1GdEHH+4liB1iRxnOzcx6156MXwvY6T6BWd+BKa5p/PHFNGm1DfQz3GRFljBoTsWCoqttUSi5EWVnB4NinMs+oAvbLwrb5Rl4//oe7Z3L8A7ZieqgplbmRzdHJlYW0KZW5kb2JqCjIxIDAgb2JqCjw8L1R5cGUvWE9iamVjdC9TdWJ0eXBlL0Zvcm0vRm9ybVR5cGUgMQovQkJveCBbMCAwIDI0ODAgMzUwOF0vTWF0cml4IFsxIDAgMCAxIDAgMF0KL0xlbmd0aCAxNjM3L0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nO1aTW/jNhC961fwmAXWqURJltTbbpEWBVqg7bo3X7Jxkm2QtdNu3W7762tbEtN5Hj6TsvIF7CUwQ4oczuebGabm2qTmO5O8nSVffZtlpshOp9NpZWZXSVZkJrdlYWYLc/L9KzO7MZndrN4Ol7uhnXbDq3a26IYrOftHO9sPP+6GedUNz9vFeTe8kMPf5LnzfJrLzVtK8lrslpfd8E9J2KXcHG4Bsy3ZtmbfunOB7DXdGc4FIoEhX++Gk7KpzaSudv/6SVJ2K3kE3//bDjNdNp8kv0A287zI5G6fqXjgc37WnZw917ifTXW5wizw95McAhnALhDVkfq30AQfSDYczcUaxWquu8AuWHwtd15r13fDhSZTRwYwc6nR7M7lVrGMkRqQAVsBzcBYTjPM8iuoKu1bDDv/JRfDjSaSqp/b2TBndEPVrPU+29iQ/j82TLJq64+arT9KTs6kP+o42J93pxq2xyV3HEz1e67kYthZ9d8+BVqoPiLs244pZ7NkGztz87fZxcp0WpqPprTdz1vzzmwWiACb7gXY1Nrdnt+0N02lzDxXW6qqA+rea/CFGgA8vuCDpmc+6fBzYTZE7nk/Oz+Rq1O5OpfD+SupgCDbeV6WVMnBW37AzzEIvle9Tc+VWznkCv5a9WNUVlzsgQoO/IbFnGZ1sRM7fNtyw5ZxonG7wdHA6mu525rKJcqG4FL8yiDxc2lSx/i/AXaPcCLTuXGPZMATHHPlflYPQB7tutG2crOdgVQ6M3XQWOhUqZrpUw814MJBE5vVmZkUNVF8q2//Wc7ySAaiGEGvPVAIaJ5J5/SLDFFvpNN9J4e/ysUtQpkURbNBDdOxd9cDsq2rfBOQbVO2P4MCsq1ts9vzB00BnFH/Tj1PiIYj/PaIE1TaBSOn1VH+hNMJFqGHd0+QjdJCoHkVszMElDt6hZBcmJ+7VxbpGJ8cQPc8t7uUJyPcAbzhgTuNpLs/ORTuAOS7/9wDdzw5D6Spqv7tWVp3ePLogMeDQ54e8Hi8wWMDnlqniof7rvznYSaIWM0wuA36mLPuo3BlN6GlCXCHQAvM3tHFoQDK45nUDNOXlD9cID7tAnFpHXCB9B2gyYgs49atYhH3LRQVBug2QspCp3lNqYKDVJ/jNEC3mlI/F5jDiygcuwLeACks6AUX8tygWPy8MS7wCmSkl1VpSwBrdB68xLXuoQ2+8LB9RdnuQ5u+WwT5uPtuQmWpHIGfYCBgPpCgAT8B6QHZXOjc1oBINTEMdOvHY1cZ+4Ykx6U+ywHRihLOJQMc4nYfhB3KIUTyg7hlQ4hYSDJGKKHSvs1+RtIuTzARAKCuWoir0RxIQaAA26cgnr7PwIrr46YgPdd4GhGlJ8cAHG5xp7roJ1leFGbzt23EQCSApiAwUU1Yh7UqQR5cWtBXh44a0My7Yld09oKyn18ByOAvBXhjW30NYT0PB/jTCS4UKGfoxR2PkQAZvLbh64L7JM7v+Fq3zy5YJwdgFdgYDzZ6H9wDyEdowYVB0KdN+d2sa/XWpXQxZZm6Vu/cTitdXlXvT8EJwSkb3QHfzt0ix1drel+QAvfsUYWDI0sDepUjLDEEOjnZoGlRHRAgg5dwfVcOjKNAJyDIfTzAwRzPcF0oRT1P06qriQTp+Y+SZl4oGNGJ8TYfHASc4c9IeL3ii/m8FPMB/qwpBwbobaDC8CvzHJwnYON0usN6ATxnVztZPsKiSl6cIVGBnpe8FjGC4GrJk1uuAFGOC/jsc+k23aDh5+vS80Y/6HiXXtDGTVHrbByl/1HQByTu6Kh6ExDGkXlIhaWodc6vqYh5iX4fpXDBqeXNgjbCArn3CF0unwq1yZyvNwrfqu08rj9uGNVz5HIEmtWcoqj1nY9HFwXP158Nutg406Z0PcOovj3IiiNHsKqH6789uQ0F4ll+i6XGgUAPxOWi+qcjr3wwYteVjQnY0AnjT6l4JYWjE5hVD3IyCXkcNqxJDFTxhg8XUVAbeBBEfk+vD32s2GcUvCM7IIv44i1errfISlvGuAvoo/Mnvzy30euSjX7fqGdtPOPiz1OOfyVz4MmXBwaNUCsPewE2fnHnhcAvQKu20r9dUjrhUiC1f6gTC0JeYcoDASIK4kU9rY56TciDaWtZpefpMH8DOk5AfGoDUWOHzAqiXtVeUn7z17xdQDibJf8BfloY8wplbmRzdHJlYW0KZW5kb2JqCjE1IDAgb2JqCjw8L0ZpbHRlci9GbGF0ZURlY29kZS9GaXJzdCAzMS9MZW5ndGggOTEyL04gNS9UeXBlL09ialN0bT4+c3RyZWFtDQp42jI0UTBQMDRTMLdUMDQHMowVDC0UjECUsYKxsTkAAAD//6xUy3IbNxC88yv4A0lHySWpcqmKsumYeZiJJcaRXT5gscNdhFhghYck6us9wJCrVW6pCi/EAN09g0HPvnq1wM1xpCXeepcWuM5NqmHZvFhg7bRvjesK/Pz7bvlhgSsVqVCWeEf2npLRanF5+X/KfXPlbfufNH8sWidV5vidM3xEy4ufXhw857o+Do23L3Kc1RZ4Y/Z7CuQ0xeXn5QWuTTco0BiN9Q66N/CD0YHXLqMlm9SXqlSFJp2abQo+Grdy0UzxLMfnH75fIo5KE+hRWzXgLvtEbWNZf2goRNM5tN5aFTBS0OQS1MCrqFwr4MialjAqlrS0T7IKpusZGhMFEw8YbY7QfuDL9MexJ1fUjG8RrYo9nih4eEdIDx6pD0TY+xywN/eEaB4R6Z45VEWdYaD2pSGRuBt1ZSlG0F1WFl0gxWm5OorJ8JlKWOEKr/EGa7zFz3iHDX7Br/gNv+M9tvgDf+IDrnGDHf7CR/yNW3xCE5Q+UKp3angppZ52z/fTxmgTdB6QXctt0T4QV6C4boUGGi34LujQw+AfHGAxwMFjxB0CIhIy7vGARxzxVNXplDFINMuUjG0J3zqfWtpjnblp5+D5KRp+e+ytD8ZNr1n3yFrDRopoVddxf+SvvLXcYG/psTxL6n2uz3utVXFal42tyrWu7XrK+UnOz+GLUiq2rqT+cyXP+xzIUZN5N4FcW/pLQ/2Tq6agWhpUOCD+qxah+uduPAngtjXs7XLLua1b/8DTU8xbDGnLFOgcygwccWRjNcEfyJWWR9LVM5OM9uPxlCy0e/ZbtV+pw9LgxR3Wd/ztsFzJ2d2BOlNSUYtB1XltqSu2LoPAGjwNbPWY6xQEsfwUKZ0TYchlkhR7aexP01JuUDU1tZxflZGZWFzewC7J9kV9p9JdGY1QpoKXvbJ7SXnajNOs1EatxL8rqWM1c8dKnmU1dWcVSi9Xa7w+l7QW8lrI6xl5PbE2gtkIZjPDbCbMOvV4L+m2At8KfDuDb0+AiTVkm8xoj9jKtO6EuhPqbkbdTZxbObzpfWCDURjY+42NUKcxlmM14ypJqyYJVdug+LN0bgMJmYRMMzJNLCMYIxgzw5gJQ9wGJ+m8wL3A/QzuT4CJ1Zp7UzakCVmIWYh5RswT4yiHqTbheN7+cnn5FQAA//8DAGw80jMNZW5kc3RyZWFtCmVuZG9iagozMSAwIG9iagogICAgICAKPDwKL0ZpbHRlciBbL0FTQ0lJODVEZWNvZGUgL0ZsYXRlRGVjb2RlXQovTGVuZ3RoIDMyMQo+PgpzdHJlYW0KODtVPC00YD8hLSUjL3RUS3VeNVQiSEpOcS4rNEFaLSYtbElbK3VsWy4rNDVHK1VuO0dgZHNgMitnOjdRWjBeKUQKQnM0WD4qblo2KFUtZkhkZGFJKWA8W1NGX1M8U2NwJHJSQ11BNVU+JD5APS84Z0Q1aWtYJSo4N1NacEY6PmVKaEwKZTg9ZWJETkYjYVldaEpCLjZZTjMvLFQ7UFROZVAzaUpjSlgkQ2xhZTBrJj1CRHI6Qy82aHREVDQ/RWBjTTJVYSkKXG1BLzxGZGhoQydhTjdaSWtAWW5OYV5fbGooam5XUDRKXCEnTSQ5OzkqMEJ0VUdQYUwkQXNjP2BzW0hdaWM1OSoKIW5CI3Q1ZiZZZ2BucyY4THNDJyMsWmEpW2Y2RzJIUERnck1wRzYjYGFUb04/PStDO08tQGdEK34+CmVuZHN0cmVhbQplbmRvYmoKMSAwIG9iago8PC9Qcm9jU2V0Wy9QREYvSW1hZ2VCL0ltYWdlQy9UZXh0XS9Gb250PDwvRjEwIDE0IDAgUiAKL0YxMSAxNiAwIFIgL0Y4NSAxNyAwIFIgL0Y5NCAyOSAwIFIgL0YxMTIgMjkgMCBSIC9GMTQ1IDMyIDAgUiAvRjIxMSAzMiAwIFIgL0YyNTQgMzIgMCBSIC9GMjg4IDMyIDAgUiAvRjMwNSAzMiAwIFIgPj4gL1hPYmplY3QgPDwKL0kxMCAyMCAwIFIgL1AyIDIxIDAgUiAKPj4KPj4KZW5kb2JqCjIyIDAgb2JqCjw8L1R5cGUvQ2F0YWxvZy9QYWdlcyA5IDAgUj4+CmVuZG9iagoyNCAwIG9iago8PC9GaWx0ZXIvRmxhdGVEZWNvZGUvRmlyc3QgNTgvTGVuZ3RoIDMwMS9OIDkvVHlwZS9PYmpTdG0+PnN0cmVhbQ0KeNoUyEkRADAIxVArkQCfpdS/sdJT5kWBoWIcNd6LgzLRELHzku6EUT+iprj06QcAAP//tJPBTsMwDIbveYq8wGRaQAJp6qEwhIQQqIVT1UOaeJ2lNB5Ng9jbkxQmxhGp5JI4tj/Hv5X1WsDLYY8S7thNAurQTbOZLjMBG6fZkOtldi6P60xWAkrlMaXESBrQryoelBNFsQDwHu07TqTVwrhVydYszXzqLL0FXAb7JeVfnxnHGjnfxJjDr46iC2Wc/Knjp059GDq2v2ocaQJuabvFEZ1GLxuZQU39oAD3niw70DsCHkiP8ewCGLSTav9jUKfCzhB4Vj16uOEQg3N4IOObq7nBLE9bC49oSJX80SRBLq/jf7jIW6jQcxhTN7McRfEJAAD//wMAxrfpIw1lbmRzdHJlYW0KZW5kb2JqCjMzIDAgb2JqCjw8L1NpemUgMzQvRmlsdGVyL0ZsYXRlRGVjb2RlL0xlbmd0aCAxMDcvVHlwZS9YUmVmL1dbMSAyIDFdCi9JbmZvIDYgMCBSL1Jvb3QgMjIgMCBSCj4+c3RyZWFtCnicFYutDYBAFIPbu+MnBHL2LA4BBIFhBgTzMADzsAIj4JF4ZqCvyZemaQs4cHgAeBFEBhMRxam2EqlkM4P1bZkOMTjru1U5WnbCs3nBeIDtBo6X/eSfuTZJm+SFvikTOfvFuoLTjh9zegoECmVuZHN0cmVhbQplbmRvYmoKc3RhcnR4cmVmCjEyNDA5CiUlRU9GCg=="}
        }
    }									

    `);

    return res.json(obj);
} )



app.listen(port, (err) => {

    if (err) throw new Error(err);

    console.log(`Servidor corriendo en puerto ${ port }`);

});
