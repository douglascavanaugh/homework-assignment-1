// index.js
// First Node Application

// API
// Dependencies:
const http = require('http');
const https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./lib/config');
var fs = require('fs');
var _data = require('./lib/data');
var handlers = require('./lib/handlers');
var helpers = require('./lib/helpers');


// TESTING
// @TODO delete this
// _data.delete('test','newFile',function(err){
//     console.log('this was the error: ', err);
// });



// Instanciating the HTTP server
const httpServer = http.createServer(function(req,res) {
    unifiedServer(req,res);
});

// Start the HTTP server
httpServer.listen(config.httpPort, function(){
    console.log('The HTTP server is listening on port: '+config.httpPort)
});

// Instanciating the HTTPS server
var httpsServerOptions = {
    'key' : fs.readFileSync('./https/key.pem'),
    'cert' : fs.readFileSync('./https/cert.pem')
}

const httpsServer = https.createServer(httpsServerOptions,function(req,res) {
    unifiedServer(req,res);
});

// Start the HTTPS server
httpsServer.listen(config.httpsPort, function(){
    console.log('The HTTPS server is listening on port: '+config.httpsPort)
});

// Unified server for all logic pertaining to http and https
var unifiedServer = function(req,res){
    // Get url and parse it
    var parsedUrl = url.parse(req.url,true);

    // Get the Path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g,'');

    // Get Query String as Object
    var queryStringObject = parsedUrl.query;

    // Get HTTP Method
    var method = req.method.toLowerCase();

    // Get the headers as an Object
    var headers = req.headers;

    // Get Payload Streams
    var decoder = new StringDecoder('utf-8')
    var buffer = '';

    // Bind the Data
    req.on('data',function(data){
        buffer += decoder.write(data);
    });
    // Bind the End
    req.on('end',function(){
        buffer += decoder.end();

        // Choose Handler
        var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        // Construct the data object to send to the handler
        var data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : helpers.parseJsonToObject(buffer)
        };

        //Route the request to the handler specified in the router
        chosenHandler(data,function(statusCode,payload){
            // Use the status code called back by the handler or default to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            // Use the payload called back by the handler, or default to an empty object
            payload = typeof(payload) == 'object' ? payload : {};

            // Convert the payload to a string
            var payloadString = JSON.stringify(payload);

            // Return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);


            console.log('Returning this response: ', statusCode,payloadString)
        });
        
        // Send the Response
        
        
        // Log the request Path
        // console.log('Request received on path: '+trimmedPath+' with this Method: '+method+' with these Query String Params: ',queryStringObject)
        
    });
};

// Define a Request Router
var router = {
    'ping' : handlers.ping,
    'hello' : handlers.hello,
    'users' : handlers.users,
    'tokens' : handlers.tokens,
    'checks' : handlers.checks
}
