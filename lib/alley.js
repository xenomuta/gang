/**
 * Alley (Gang Registry Server)
 * @param {object} config server configuration
 */
var Alley = function (config) {
    /**
     * Config Parameters
     * @param {string} subAddress subscription address. Default: `udp://0.0.0.0:8888`
     * @param {string} httpAddress http pimp (proxy) ip address. Default: `0.0.0.0`
     * @param {number} httpPort http pimp (proxy) port. Default: `8080`
     * @todo SSL management
     */
    var _defaultConfig = {
        subAddress: 'udp://0.0.0.0:8888',
        httpAddress: '0.0.0.0',
        httpPort: 8080
    }

    /**
     * Callbackss for 'register' and 'broadcast' messages
     * @type {Object}
     */
    var registerCallback;

    for (var k in _defaultConfig) {
        config[k] = config[k] || _defaultConfig[k];
    }
    delete _defaultConfig;

    /**
     * Pimp it up! (proxy)
     */
    var pimp = require('./pimp').listen(config.httpPort, config.httpAddress);

    /**
     * Subscription Socket
     */
    var axon = require('axon'),
        subSock = axon.socket('sub-emitter');
    subSock.bind(config.subAddress);

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
            gangsters[gangster].pubSock.emit('gang.broadcast:' + name, message);
        }
    });

    /**
     * Register a subscriptor process
     * @param  {string} name       subscriptor process name
     * @param  {object} gangsterConf gangster configuration `{subAddress:string, `http : { rule:string, address:string, port:number } }`
     */
    subSock.on('gang.register:*', function (name, gangsterConf) {
        // Reserved name
        if (name == 'alley') {
            /**
             * @todo manage this as an error
             */
            return;
        }

        // Close it if it already exists
        if (gangsters[name] && gangsters[name].pubSock) {
            gangsters[name].pubSock.close();
            delete gangsters[name];
        }

        var sock = axon.socket('pub-emitter');
        sock.connect(gangsterConf.subAddress);
        setTimeout(function () {
            gangsters[name] = {
                pubSock: sock,
                conf: gangsterConf
            };

            var oldGangsters;
            var newGangster = {};
            newGangster[name] = gangsterConf.subAddress;

            // Tell the new gangster about old gangsters
            for (var gangster in gangsters) {
                if (!gangster || gangster === name) continue;
                if (!oldGangsters) {
                    oldGangsters = {};
                }
                oldGangsters[gangster] = gangsters[gangster].conf.subAddress;

                gangsters[gangster].pubSock.emit('gang.update', newGangster);
            }

            // Tell old gangsters about the new one
            if (oldGangsters) {
                gangsters[name].pubSock.emit('gang.update', oldGangsters);
            }

            // New gangster ready for hustle...
            setTimeout(function () {
                gangsters[name].pubSock.emit('gang.ready');
            }, 100);

            // Set pimp (proxy) if needed
            if (gangsters[name].conf.http) {
                pimp.addRoute({
                    rules: gangsters[name].conf.http.rules,
                    target: {
                        host: gangsters[name].conf.http.address,
                        port: gangsters[name].conf.http.port
                    }
                });
            }

            if (typeof registerCallback === 'function') {
                registerCallback({
                    name: name,
                    config: gangsterConf
                });
            }
        }, 100);
    });

    var alley = {
        onRegister: function (fn) {
            registerCallback = fn;
            return alley;
        },
        onMessage: function (fn) {
            subSock.on('gang.message:*', fn);
            return alley;
        },
        emit: function GangsterEmit(to, message) {
            if (!gangsters[to] && !gangsters[to].pubSock) {
                return;
            }
            gangsters[to].pubSock.emit('gang.message:Alley', message);
        },
        gangsters: function () {
            return gangsters;
        },
        close: function () {
            subSock.close();
            try {
                pimp.close();
            } catch (e) {}
            for (var _g in gangsters) {
                gangsters[_g].pubSock.close();
            }
        }
    };
    return alley;
};

module.exports = Alley;
