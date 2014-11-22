/**
 * Gangster (client)
 * @param {object} config gangster (client) configuration `{subAddress:string, http:{rule:regexp/string,address:string,port:nunmber}}`
 */
var Gangster = function (name, config) {
    if (!config || !config.subAddress) {
        throw new Error('Invalid config');
    }

    var self = this;

    /**
     * Subscription Socket
     */
    var axon = require('axon'),
        alleySock = axon.socket('pub-emitter'),
        subSock = axon.socket('sub-emitter');
    subSock.bind(config.subAddress);

    /**
     * Gangsters (other clients)
     */
    var gangsters = {};

    /**
     * Update new subscriptor's sockets
     * @param  {string} name       subscriptor process name
     * @param  {object} gangsterConf gangster configuration `{subAddress:string, `http : { route:regexp, webSockets:boolean, address:string, port:number } }`
     */
    subSock.on('gang.update', function (newGangsters) {
        for (var _g in newGangsters) {
            if (gangsters[_g]) {
                try {
                    // Close it if it already exists
                    gangsters[_g].close();
                } catch (e) {}
            }
            gangsters[_g] = axon.socket('pub-emitter');
            gangsters[_g].connect(newGangsters[_g]);
        }
    });

    subSock.on('test', function (_name) {
        console.log('\x1b[01;32m Test msg from "%s" to "%s"\x1b[0m', _name, name);
    });
    /*
    setInterval(function () {
        for (var i in gangsters) {
            gangsters[i].emit('test', name);
        }
    }, 250);*/
    var gangster = {
        /**
         * Dispatches when ready
         * @param  {function} callback callback function
         */
        onReady: function (fn) {
            subSock.on('gang.ready', fn);
            return gangster;
        },
        /**
         * Gangster list update events registration/dispatcher.
         * @param  {function} callback callback function with `from` and `message` params
         */
        onUpdate: function (fn) {
            subSock.on('gang.update', fn);
            return gangster;
        },
        /**
         * Message events registration/dispatcher.
         * @param  {function} callback callback function with `from` and `message` params
         */
        onMessage: function (fn) {
            subSock.on('gang.message:*', fn);
            return gangster;
        },
        /**
         * onMessage events registration/dispatcher.
         * @param  {function} callback callback function with `from` and `message` params
         */
        onBroadcast: function (fn) {
            subSock.on('gang.broadcast:*', fn);
            return gangster;
        },
        /**
         * Custom `on` events registration/dispatcher.
         * @param  {string} event event name
         * @param  {function} callback callback function
         */
        on: function (event, fn) {
            subSock.on(event, fn);
            return gangster;
        },
        /**
         * Connects to Alley (server) socket
         * @param  {string} socket address
         */
        connect: function (alleyAddress) {
            alleySock.connect(alleyAddress);
            setTimeout(function () {
                alleySock.emit('gang.register:' + name, config);
            }, 100);
            return gangster;
        },
        /**
         * Broadcast message to subscriptors
         * @param  {object} message anything
         */
        broadcast: function GangsterBroadcast(message) {
            alleySock.emit('gang.broadcast:' + name, message);
        },
        /**
         * Emit message to subscriptors
         * @param  {object} message anything
         */
        emit: function GangsterEmit(to, message) {
            if (!gangsters[to]) {
                return;
            }
            gangsters[to].emit('gang.message:' + name, message);
        },
        /**
         * Close connections
         */
        close: function () {
            subSock.close();
            alleySock.close();
            for (var _g in gangsters) {
                gangsters[_g].close();
            }
        }
    };

    return gangster;
};

module.exports = Gangster;
