var _routes = [],
    _proxy = require('http-proxy').createProxyServer({}),
    processRequests = function processRequests(req, res) {
        /**
         * Set ip and x-forwarded-for headers.
         * You must trust proxy in your applications
         */
        req.headers['x-forwarded-for'] = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        for (var i in _routes) {
            for (var rx in _routes[i].rules) {
                var url = _routes[i].rules[rx];
                rx = new RegExp(rx);
                if (rx.test(req.url)) {
                    req.url = req.url.replace(rx, url);
                    return _proxy.web(req, res, {
                        target: _routes[i].target
                    });
                }
            }
        }
        // websockets
        _proxy.on('upgrade', function (req, socket, head) {
            proxy.ws(req, socket, head);
        });
    },
    _server = require('http').createServer(processRequests);

var Pimp = {
    /**
     * Listens for HTTP/S connections
     * @todo  SSL support
     */
    listen: function () {
        var args = [];
        for (var i in arguments) {
            args.push(arguments[i]);
        }
        _server.listen.apply(_server, args);
        return Pimp;
    },
    on: function (event, fn) {
        _server.on(event, fn);
        return Pimp;
    },
    close: _server.close,
    /**
     * Adds a proxy targeting route
     * @param {object} route {rules:{regexp:replaceString}, target:{host:string,port:number}}
     */
    addRoute: function (route) {
        _routes.push(route);
        return Pimp;
    }
};

module.exports = Pimp;