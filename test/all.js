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
        it('should send/receive private messages from/to gangsters', function (done) {
            var number = Math.random(),
                capone = gang.gangster('Capone', {
                    subAddress: 'tcp://127.0.0.1:8991'
                }).onMessage(function (name, message) {
                    name.should.be.exactly('Alley');
                    capone.emit('Alley', {
                        number: message.number + 1
                    });
                }).connect(alleyConf.subAddress);

            alley.onRegister(function (gangster) {
                gangster.name.should.be.exactly('Capone');
                alley.emit('Capone', {
                    number: number
                });
            }).onMessage(function (name, message) {
                name.should.be.exactly('Capone');
                message.number.should.be.exactly(number + 1);
                capone.close();
                done();
            });
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
        it('should proxy web requests according to routing rules', function (done) {
            var http = require('http'),
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
                cleo = gang.gangster('Cleo', cleoConf).onReady(function () {
                    server.listen(cleoConf.http.port, cleoConf.http.address, function () {
                        var request = http.request({
                            host: alleyConf.httpAddress,
                            port: alleyConf.httpPort,
                            path: '/api/cleo',
                            method: 'GET'
                        }, function (res) {
                            res.on('data', function (data) {
                                data.toString().should.be.exactly('Do you want a piece of me?');
                                done();
                            });
                        });
                        request.end();
                    });
                }).connect(alleyConf.subAddress),
                server = http.createServer(function (req, res) {
                    req.method.should.be.exactly('GET');
                    req.url.should.be.exactly('/cleo');
                    res.write('Do you want a piece of me?');
                    res.end();
                });
        });
    });
});
