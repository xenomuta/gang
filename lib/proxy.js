var _routes = [],
    _proxy = require('http-proxy').createProxyServer({}),
    _server = require('http').createServer(function (req, res) {
        /**
         * Set ip and x-forwarded-for headers.
         * You must trust proxy in your applications
         */
        req.headers['x-forwarded-for'] = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        for (var route in _routes) {
            route = _routes.rule[route];
            if (route.rule.test(req.url)) {
                return _proxy.web(req, res, {
                    target: route.target
                });
            }
        }
        // websockets
        _proxy.on('upgrade', function (req, socket, head) {
            proxy.ws(req, socket, head);
        });
    });

var Proxy = {
    /**
     * Listens for HTTP/S connections
     * @todo  SSL support
     */
    listen: _server.listen,
    /**
     * Adds a proxy targeting route
     * @param {object} route {rule:regexp/string, target:{host:string,port:number}}
     */
    addRoute: function (route) {
        route.rule = typeof route === 'string' ? new RegExp(route.rule) : route.rule;
        _routes.push(route);
    }
}

module.exports = Proxy;
