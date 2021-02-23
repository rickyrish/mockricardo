

class UsuarioReq {
    tipoDoc;
    nroDoc;
    nroRecQueja;
    password;
    constructor(tipoDoc, nroDoc, nroRecQueja, password) {
        this.tipoDoc = tipoDoc;
        this.nroDoc = nroDoc;
        this.nroRecQueja = nroRecQueja;
        this.password = password;
    }

    generateRequest() {

        return {
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
                     "timestamp":"23/02/2021 10:18:63 am",
                     "userId":"E705659",
                     "wsIp":"172.17.35.33",
                     "VarArg":"VarArg"
                  }
               },
               "Body":{
                  "usuario":"",
                  "tipoDoc": this.tipoDoc,
                  "nroDoc": this.nroDoc,
                  "nroRecQueja":this.nroRecQueja,
                  "password": this.password
               }
            }
         }
    }

    getRequestJson() {
        return JSON.stringify(this.generateRequest());
    }

}

module.exports = UsuarioReq;