

class ExpedienteReq {

    loginUsuario;
    nroReclaQueja;

    constructor(loginUsuario, nroReclaQueja) {
        this.loginUsuario = loginUsuario;
        this.nroReclaQueja = nroReclaQueja;
    }

    getJson() {
        const obj = {
            "MessageRequest":{
               "Header":{
                  "HeaderRequest":{
                     "consumer":"USRECLAMOS",
                     "country":"PE",
                     "dispositivo":"::1",
                     "language":"PE",
                     "modulo":"reclamos",
                     "msgType":"Request",
                     "operation":"validaReclamo",
                     "pid":"20210222174149427",
                     "system":"SIACRECLAMOS",
                     "timestamp":"23/02/2021 10:19:61 am",
                     "userId":"E705659",
                     "wsIp":"172.17.35.33",
                     "VarArg":"VarArg"
                  }
               },
               "Body":{
                  "nroReclaQueja": this.nroReclaQueja,
                  "loginUsuario": this.loginUsuario,
                  "loginOsiptel":null
               }
            }
         };

         return JSON.stringify(obj);
    }
}

module.exports = ExpedienteReq;
