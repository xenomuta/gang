/**
 * Gangster (client)
 * @param {object} config server configuration
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
        alleySock = axon.socket('sub-emitter'),
        subSock = axon.socket('sub-emitter').bind(config.subAddress);

    /**
     * Gangsters (other clients)
     */
    var gangsters = {};


    /**
     * Update new subscriptor's sockets
     * @param  {string} name       subscriptor process name
     * @param  {object} gangsterConf gangster configuration `{subAddress:string, `http : { route:regexp, webSockets:boolean, address:string, port:number } }`
     */
    subSock.on('gang.update', function (newGangster) {
        for (var _g in newGangsters) {
            if (gangsters[_g]) {
                try {
                    // Close it if it already exists
                    gangsters[_g].close();
                } catch (e) {}
            }
            gangsters[_g] = axon.socket('pub-emitter').connect(newGangsters[_g]);
        }
    });

    var gangster = {
        /**
         * On event registration/dispatcher.
         * @param  {string} event event name
         * @param  {function} callback callback function
         */
        on: subSock.on,
        /**
         * Connects to Alley (server) socket
         * @param  {string} socket address
         */
        connect: function (pubAddress) {
            alleySock.connect(pubAddress);
            return self.gangster;
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
            gangsters[to].emit('gang.message:' + self.name, message);
        }
    };

    return gangster;
};

module.exports = Gangster;
