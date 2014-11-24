var _routes = [],
    _requestHandler,
    _proxy,
    _domain,
    _server;

_requestHandler = function requestHandler(req, res) {
    /**
     * Set ip and x-forwarded-for headers.
     * You must trust proxy in your applications
     */
    _domain.add(req);
    _domain.add(res);
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
    })
};
/**
 * manage errors
 */
var errorManagement = function __DefaultErrorManagement(e) {
    if (res && res.close) {
        console.log('e:', e);
        console.log('req:', req);
        console.log('res:', res);
        res.close();
    }
    console.error(e.name, e.message);
};
var _domain = require('domain').create('gang');
_domain.on('error', errorManagement).run(function () {
    _proxy = require('http-proxy').createProxyServer({});
    _server = require('http').createServer(_requestHandler);
});

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
    onError: function (fn) {
        errorManagement = fn;
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
