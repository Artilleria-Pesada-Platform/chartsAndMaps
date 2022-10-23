     // See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
     // for Dialogflow fulfillment library docs, samples, and to report issues
     'use strict';

     /* jshint esversion: 8 */
 
 
     const functions = require('firebase-functions');
     const {WebhookClient} = require('dialogflow-fulfillment');
     const {Card, Suggestion} = require('dialogflow-fulfillment');
     const {google} = require('googleapis');
     const BIGQUERY = require('@google-cloud/bigquery');
 
     process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
     exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
       const agent = new WebhookClient({ request, response });
       console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
       console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
       console.log("Parameters", agent.parameters);
 
       function getPair(agent) {
         // Return wines that pair well with the food or meet other user specified params
 
         const results= list_wines(agent);
         agent.add('${results[0].name} is a good choice for ${results[0].food_pairing}. A ${results[1].variety} like ${results[1].name} also works!');
       }
 
       // Run the proper function handler based on the matched Dialogflow intent name
         let intentMap = new Map();
         intentMap.set('findPair', getPair);
         agent.handleRequest(intentMap);
     });
 
     function list_wines(agent) {
       // Search the database for parameters 
       // Actual values have been removed for presentation
 
       const projectId = 'my_project_id';
       const datasetId = "my_dataset_id";
       const tableId = "my_table_id";
 
       const bigquery = new BIGQUERY({
         projectId: projectId
       });
 
       const params= agent.parameters;
       const excluded= agent.excluded;
 
       const name = agent.parameters.label;
       const variety = agent.parameters.variety;
       const food_pairing = agent.parameters.foods;
       const conditions = agent.parameters.conditions;
 
       // Map param columns to those in the BigQuery database
       const SQL_COLUMN_LABELS={label:'name', variety:'variety', foods:'food_pairing', conditions:'food_pairing'};
 
       var txt = "SELECT *, RANK() OVER(PARTITION BY food_pairing ORDER BY variety) as cat_count FROM \'my_project_id.my_dataset_id.my_table_id\'";
 
       var x;
       var filters=[];
 
       // Loop through params to add search params to the SQL query removing blank arrays and empty text
       // Also handles arrays with a single value or multiple values
 
       for (x in params) {
         // Correctly checking for Array
         if(!Array.isArray(params[x]) & params[x].length>1 ){
           // If the value is text we can reference it in the query with @
           filters = filters.concat(SQL_COLUMN_LABELS[x] + "= @" + x);
         } else{
           switch(params[x].length) {
               default:
                 // Array with more than one value
                 filters=filters.concat(SQL_COLUMN_LABELS[x] + " IN UNNEST(@" + x +")");
                 break;
               case 1:
                 // Array with one value - get the actual value
                 filters = filters.concat(SQL_COLUMN_LABELS[x] + "= '" + params[x] +"'");
                 break;
               case 0:
                 // Empty Array
                 break;
           } 
         }
       }
 
       txt += " WHERE " + filters.join(" AND ");
 
       // Prints output(the SQL query) to console
       console.log(txt);
 
       // This async function is supposed to query the database but it doesn't get called. 
       // list_wines completes and returns text without results
 
       async function queryParamsArrays() {
 
         console.log('calling queryParamsArrays');
 
         const sqlQuery = txt +';';
 
         console.log("SQL Query", sqlQuery);
 
         const options = {
           query: sqlQuery,
           // Location must match that of the dataset(s) referenced in the query.
           location: 'US'  //,params: params,
                 };
         try{
            // Run the query returning an array of objects
             const [rows] = await bigquery.query(options);
 
             console.log('Rows:');
             rows.forEach(row => {
               console.log(row)
             });
 
 
             // Pick ten results at random by shuffling rows
             const shuffled = rows.sort(() => 0.5 - Math.random());
 
             // Get sub-array of first 10 elements after shuffled
             let selected = shuffled.slice(0, 10);
 
             // Return selected 
             return selected;
 
         } catch(e) {
           console.log(e);
         }
       }
     }