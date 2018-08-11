const env = require('dotenv').config()
const socket = require('socket.io')();
const port = 8000;

// create poloniex
var autobahn = require('autobahn');
var wsuri = "wss://api.poloniex.com";
var connection = new autobahn.Connection({
    url: wsuri,
    realm: "realm1"
});

// create bittrex conection
var bittrex = require('node-bittrex-api');

// configure bittex
bittrex.options({
    'apikey': env.BITTREX_KEY,
    'apisecret': env.BITTREX_SECRET,
    'verbose': true,
    'cleartext': false
});

socket.on('connection', (client) => {
    console.log('socket server connected');
    client.on('getPoloniex', (data) => {
         // new connection to poloniex
         connection.open();
        
         connection.onopen = function (session) {
             function marketEvent(args, kwargs) {
                 client.emit('poloniexData', args);
             }
             function tickerEvent(args, kwargs) {
                client.emit('poloniexData', args);
             }
             function trollboxEvent(args, kwargs) {
                 console.log(args);
             }
             session.subscribe('BTC_XMR', marketEvent);
             session.subscribe('ticker', tickerEvent);
             session.subscribe('trollbox', trollboxEvent);
         }
         
         connection.onclose = function () {
             console.log("Websocket connection closed");
         }
    })

    client.on('getOrderBooks', (data) => {

        // conect to some CRYPTOS
        bittrex.websockets.client(function () {
            // console.log('Websocket connected');
            bittrex.websockets.subscribe(['BTC-ETH'], function (data) {
                if (data.M === 'updateExchangeState') {
                    client.emit('orderBookData', data);

                    data.A.forEach(function (data_for) {
                        console.log('Market Update for '+ data_for.MarketName, data_for);
                    });
                }
            });
        });

       

        console.log('recieved client message', data);
    });
})
socket.listen(port);
console.log('listening on port', port); 