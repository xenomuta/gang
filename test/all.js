require('should');

var gang = require('../'),
    alleyConf = {
        subAddress: 'tcp://127.0.0.1:8990',
        httpAddress: '0.0.0.0',
        httpPort: 8989
    },
    alley;


describe('Gang\'s', function () {
    beforeEach(function (done) {
        setTimeout(function () {
            alley = gang.alley(alleyConf);
            done();
        }, 100);
    });
    afterEach(function (done) {
        alley.close();
        done();
    });

    describe('alley', function () {
        it('should accept new gangsters', function (done) {
            alley.onRegister(function (gangster) {
                gangster.name.should.be.exactly('Capone');
                capone.close();
                done();
            });
            var capone = gang.gangster('Capone', {
                subAddress: 'tcp://127.0.0.1:8991'
            }).connect(alleyConf.subAddress);
        });
        it('should tell old gangsters about new gangsters and vice-versa', function (done) {
            var scarface, capone = gang.gangster('Capone', {
                subAddress: 'tcp://127.0.0.1:8991'
            }).onReady(function () {
                scarface = gang.gangster('Scarface', {
                    subAddress: 'tcp://127.0.0.1:8992'
                }).onUpdate(function (update) {
                    update.should.have.property('Capone');
                    capone.close();
                    scarface.close();
                    done();
                }).connect(alleyConf.subAddress);
            }).onUpdate(function (update) {
                update.should.have.property('Scarface');
            }).connect(alleyConf.subAddress);
        });
        it('should broadcast messages to all gangsters', function (done) {
            var messages = 0,
                getBroadcast = function (name, message) {
                    name.should.be.exactly('Scarface');
                    message.should.be.exactly('Say hello to my little friend!');

                    if (++messages === 2) {
                        scarface.close();
                        capone.close();
                        cleo.close();
                        done();
                    }
                },
                capone, scarface, cleo = gang.gangster('Cleo', {
                    subAddress: 'tcp://127.0.0.1:8991'
                }).connect(alleyConf.subAddress).onReady(function () {
                    capone = gang.gangster('Capone', {
                        subAddress: 'tcp://127.0.0.1:8992'
                    }).connect(alleyConf.subAddress).onReady(function () {
                        scarface = gang.gangster('Scarface', {
                            subAddress: 'tcp://127.0.0.1:8993'
                        }).connect(alleyConf.subAddress).onReady(function () {
                            scarface.broadcast('Say hello to my little friend!');
                        });
                    }).onBroadcast(getBroadcast);
                }).onBroadcast(getBroadcast);
        });
    });
    describe('gangster', function () {
        it('should send/receive messages from/to other gangsters', function (done) {
            var scarface, capone = gang.gangster('Capone', {
                subAddress: 'tcp://127.0.0.1:8991'
            }).onReady(function () {
                scarface = gang.gangster('Scarface', {
                    subAddress: 'tcp://127.0.0.1:8992'
                }).onReady(function () {
                    scarface.emit('Capone', 'Hi, boss!');
                }).connect(alleyConf.subAddress);
            }).onMessage(function (from, message) {
                from.should.be.exactly('Scarface');
                message.should.be.exactly('Hi, boss!');
                scarface.close();
                capone.close();
                done();
            }).connect(alleyConf.subAddress);
        });
    });
    describe('pimp', function () {
        it.only('should proxy web requests according to routing rules', function (done) {
            var http = require('http'),
                server = http.createServer(function (req, res) {
                    req.method.should.be.exactly('GET');
                    req.url.should.be.exactly('/api/cleo');
                    res.write('Do you want a piece of me?');
                    res.end();
                }),
                cleoConf = {
                    subAddress: 'tcp://127.0.0.1:8991',
                    http: {
                        rules: {
                            '^/api(/.*)': '$1'
                        },
                        address: '127.0.0.1',
                        port: 8992
                    }
                },
                cleo = gang.gangster('Cleo', cleoConf);
            var _domain = require('domain').create();
            _domain.on('error', function (e) {
                console.error('ERROR >>>', e);
            });
            _domain.run(function () {
                cleo.onReady(function () {
                    var request = http.request({
                        baseurl: cleoConf.http.address,
                        port: cleoConf.http.port,
                        path: '/api/cleo',
                        method: 'GET'
                    }, function (res) {
                        res.on('data', function (data) {
                            console.log('\x1b[01;43;30m%j\x1b[0m', data);
                        });
                    });
                    request.end();
                }).connect(alleyConf.subAddress);
            });

        });
    });
});
