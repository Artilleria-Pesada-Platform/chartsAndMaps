'use strict';

const functions = require('firebase-functions');
const {google} = require('googleapis');
const {WebhookClient} = require('dialogflow-fulfillment');
const BIGQUERY = require('@google-cloud/bigquery');

process.env.DEBUG = 'dialogflow:*'; // enables lib debugging statements
/************************ */
//NOTA
/************************ */
/* En el archivo de pacakege no vienen estos dos en scripts
    //"start": "firebase serve --only functions:dialogflowFirebaseFulfillment",
    //"deploy": "firebase deploy --only functions:dialogflowFirebaseFulfillment"
Y en dependencies estas
   // "actions-on-google": "^2.2.0",
   // "dialogflow": "^0.6.0",
*/

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log("Parameters", agent.parameters);
  // TODO ver si es necesario mandat algo de aqui 
  //const appointment_type = agent.parameters.AppointmentType;

// Function to create appointment in calendar  
/***********
 * *************
       getEstatusCajero(IdCajero);
    }).catch(() => {
      agent.add(`I'm sorry, there are no slots available for ${appointmentTimeString}.`);
    });
**************************
 */

//Add data to BigQuery
function getEstatusCajero() {
    const projectId = 'bbva-latam-hack22mex-5001'; 
    const datasetId = "ATM";
    const tableId = "TABLA_ATM";

    const bigquery = new BIGQUERY({
      projectId: projectId
    });

   //const IdAtm = IdCajero;
   const sqlQuery = "Select * from TABLA_ATM where ATM = 3343";   
   const options = {
    query: sqlQuery,
    // Location must match that of the dataset(s) referenced in the query.
    location: 'US' //,params: params,
          };

//LLAMADA

const [rows] = await bigquery.query(options);
 
console.log('Rows:');
rows.forEach(row => {
  console.log(row)
});

 /*  bigquery
  .dataset(datasetId)
  .table(tableId)
  .insert(rows)
  .then(() => {
    console.log("Exito");
    //Obtener la informacion
    //obj_respuesta = ""
  })
  .catch(err => {
      console.error('ERROR:', err);
  });
  */
  //agent.add("obj_respuesta");
}
})

