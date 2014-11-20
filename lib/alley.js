/**
 * Alley (Gang Registry Server)
 * @param {object} config server configuration
 */
var Alley = function (config) {
    /**
     * Config Parameters
     * @param {string} subAddress subscription address. Default: `udp://0.0.0.0:8888`
     * @param {string} httpAddress http proxy ip address. Default: `0.0.0.0`
     * @param {number} httpPort http proxy port. Default: `8080`
     * @todo SSL management
     */
    var _defaultConfig = {
        subAddress: 'udp://0.0.0.0:8888'
        httpAddress: '0.0.0.0',
        httpPort: 8080
    }
    for (var k in defaultConfig) {
        config[k] = config[k] || _defaultConfig[k];
    }
    delete _defaultConfig;

    /**
     * Proxy
     */
    var proxy = require('./proxy').listen(config.httpAddress, config.httpPort);

    /**
     * Subscription Socket
     */
    var axon = require('axon'),
        subSock = axon.socket('sub-emitter').bind(config.subAddress);

    /**
     * Gangsters (clients)
     */
    var gangsters = {};

    /**
     * Broadcast message to subscriptors
     * @param  {string} name    source subscriptor process name
     * @param  {object} message anything
     */
    subSock.on('gang.broadcast:*', function (name, message) {
        for (var gangster in gangsters) {
            if (gangster === name) continue;
            gangsters[gangster].emit('gang.message:' + name + ':public', message);
        }
    });

    /**
     * Register a subscriptor process
     * @param  {string} name       subscriptor process name
     * @param  {object} gangsterConf gangster configuration `{subAddress:string, `http : { rule:string, address:string, port:number } }`
     */
    subSock.on('gang.register:*', function (name, gangsterConf) {
        if (name === 'public') {
            /**
             * @todo Manage this with an error emition.
             */
            return;
        }

        // Close it if it already exists
        if (gangsters[name] && gangsters[name].pubSock) {
            gangsters[name].pubSock.close();
            delete gangsters[name];
        }

        var sock = axon.socket('pub-emitter')
            .on('error', function () {
                /**
                 * @todo Manage not available PubSock on subscriptor.
                 * @return {[type]} [description]
                 */
            })
            .on('connect', function () {
                clients[name] = {
                    pubSock: sock,
                    conf: clientConf
                };

                var oldGangsters = {};
                var newGangster = {};
                newGangster[name] = gangsterConf.subAddress;

                // Tell the new gangster about old gangsters
                for (var gangster in gangsters) {
                    if (gangster === name) continue;
                    oldGangsters[gangster] = gangsters[gangster].conf.subAddress;

                    gangsters[gangster].emit('gang.update', newGangster);
                }

                // Tell old gangsters about the new one
                gangsters[name].emit('gang.update', oldGangsters);

                // Set proxy if needed
                if (gangsters[name].conf.http) {
                    proxy.addRoute({
                        rule: gangsters[name].conf.http.rule,
                        target: {
                            host: gangsters[name].conf.http.address,
                            port: gangsters[name].conf.http.port
                        }
                    });
                }
            });
        sock.connect(gangsterConf.subAddress);
    });
};

module.exports = Alley;
