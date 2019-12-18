module.exports = {
    validarServicio: function() {
        return {
            MessageResponse : {
            Header: { HeaderResponse:    {
               consumer: "USRECLAMOS",
               pid: "20180517000000001",
               timestamp: "2019-11-28T14:57:47-06:00",
               VarArg: "",
               status:       {
                  type: "0",
                  code: "0",
                  message: "EJECUCIÓN CON ÉXITO",
                  msgid: "DPS01-8fe2c97a-08ac-42de-b0f3-efc974d8bb34"
               }
            }},
            Body:    {
               idTransaccion: "33333333",
               codigoRespuesta: "0",
               mensajeRespuesta : "Operacion Exitosa",
               datosCliente: {
          
                   customerIdCodCliente: "5855472",
         
                   cuenta: "7.2398938.00.00.100000",
         
                   lineaNroServicioCodRecarga: "987132291",
         
                   contrato: "5300745",
         
                   objId: null,
                    tipoProducto: "POSTPAGO"
         
               }
            }
         }}
    }
}
