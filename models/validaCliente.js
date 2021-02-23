

class ValidaClienteReq {
    tipoDoc;
    numDoc;
    constructor(tipoDoc, numDoc) {
        this.tipoDoc = tipoDoc;
        this.numDoc = numDoc;
    }

    getObjectRequest() {
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
                     "operation":"validaCliente",
                     "pid":"20210222174149427",
                     "system":"SIACRECLAMOS",
                     "timestamp":"22/02/2021 05:41:83 pm",
                     "userId":"E705659",
                     "wsIp":"172.17.35.33",
                     "VarArg":"VarArg"
                  }
               },
               "Body":{
                  "tipoCodigoDocumento": this.tipoDoc,
                  "numeroDocumento": this.numDoc,
                  "nombresCompletos":""
               }
            }
         }
    }
}

module.exports = ValidaClienteReq;