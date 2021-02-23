const { generarToken, removerToke } = require("./auth")
const fetch = require('node-fetch');
const ValidaClienteReq = require("../models/validaCliente");
const UsuarioReq = require("../models/usuarios");
const ExpedienteReq = require("../models/expediente");

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

    await removerToke(token);

    return json.MessageResponse.Body;

}

const validarUsuarioProv =  async(tipodoc, nroDoc, nroQueja, password)  => {
    const token = await generarToken();
    const url = 'https://clientes-dev.cla.pe/api/v1/gestionreclamos/usuarios';
    const body = new UsuarioReq(tipodoc, nroDoc, nroQueja, password);
    const result = await fetch(url, { method: 'POST', 
    body: body.getRequestJson(), 
    headers: { 'Content-Type': 'application/json',
                'access_token': token,
                ...headersClaro
    },});

    const json = await result.json();

    return json.MessageResponse.Body;
}

const consultaExpediente = async( loginUsuario, nroReclaQueja) => {
    const token = await generarToken();
    const url = 'https://clientes-dev.cla.pe/api/v1/gestionreclamos/expedientes';
    const body = new ExpedienteReq(loginUsuario, nroReclaQueja);
    const result = await fetch(url, { method: 'POST', 
    body: body.getJson(), 
    headers: { 'Content-Type': 'application/json',
                'access_token': token,
                ...headersClaro
    },});

    const json = await result.json();

    return json.MessageResponse.Body;
}

module.exports = { validaClienteProvider, validarUsuarioProv, consultaExpediente }