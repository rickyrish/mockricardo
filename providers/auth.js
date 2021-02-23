
const fetch = require('node-fetch');
require('dotenv').config();

const generarToken = async() => {
    const url = process.env.URL_GENERA_TOKEN;
    const client_id = process.env.CLIENT_ID;
    const client_secret = process.env.CLIENT_SECRET;
    const body = {
        client_id,
        client_secret
      }
    const result = await fetch(url, { method: 'POST', 
    body: JSON.stringify(body), 
    headers: { 'Content-Type': 'application/json' },});

    const json = await result.json();
    return json.access_token;
}

const removerToke = async(access_token) => {
    const url = process.env.URL_REMUEVE_TOKEN;
    const body = {
        access_token
    };
    const result = await fetch(url, { method: 'POST', 
    body: JSON.stringify(body), 
    headers: { 'Content-Type': 'application/json' },});

    const json = await result.json();
    return json.result;

}

module.exports = { generarToken, removerToke };
