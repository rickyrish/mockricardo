const { generarToken, removerToke } = require("./auth")
const fetch = require('node-fetch');
const ValidaClienteReq = require("../models/validaCliente");

const headersClaro = {
    'idTransaccion': '20210222174149427',
                'msgid': 'webreclamos',
                'timestamp': '2021-02-22T17:41:58Z',
                'userId': 'webreclamos'
};

const validaClienteProvider = async (tipoDoc, nroDoc,) => {
    const token = await generarToken();
    const url = 'https://clientes-dev.cla.pe/api/v2/datoscliente/clientes';
    const body = new ValidaClienteReq(tipoDoc, nroDoc);
    console.log(token);
    const result = await fetch(url, { method: 'POST', 
    body: JSON.stringify(body.getObjectRequest()), 
    headers: { 'Content-Type': 'application/json',
                'access_token': token,
                ...headersClaro
    },});

    const json = await result.json();
    console.log(json);

    await removerToke(token);

    return json.MessageResponse.Body.listDatosDocumentoClienteResponse[0].descripcion;

}

module.exports = { validaClienteProvider }