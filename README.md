# Gang.js

[![Build Status](https://travis-ci.org/xenomuta/gang.png?branch=master)](https://travis-ci.org/xenomuta/gang)

![The Gang](https://github.com/xenomuta/gang/raw/master/static/gang.jpeg "The Gang")

An inter-process communication, PubSub messaging and Web Proxy process collaboration mesh library for Node.js

## Features

- IPC (inter-process communication) using Pub/Sub emitters using ![axon.js](https://github.com/tj/axon)
- Send broadcast messages to all nodes
- HTTP reverse proxy

## Install

```bash
npm install gang
```

## Example

### Setup the alley (Server)

```javascript
/**
 * Alley:
 * - listen for publications from gangsters on subAddress
 * - proxy http connections requests to httpAddress : httpPort
 */
var alley = require('gang').alley({
    subAddress: 'tcp://127.0.0.1:8990',
    httpAddress: '0.0.0.0',
    httpPort: 88888
}).onRegister(function (gangster) {
    console.log('A gangster named %s has joined', gangster.name);
});
```

### Add gangsters (Clients)

```javascript
/* A gangster */
var capone = require('gang').gangster('Capone', {
    subAddress: 'tcp://127.0.0.1:8991',
    http: {
        rules: {
            '^/capone(/.*)': '$1'  /* replaces web requests path with regexp */
        },
        address: '127.0.0.1',
        port: 8992
    }
}).onMessage(function (name, message) {
    console.log('Message from: %s >>> %j', name, message);    
}).connect('tcp://127.0.0.1:8990'); /* connect to alley's subscription socket */

/* Another gangster */
var scarface = require('gang').gangster('Scarface', {
    subAddress: 'tcp://127.0.0.1:8993',
}).onReady(function () {
    setInterval(function () {
        scarface.emit('Capone', { timestamp: new Date, random: Math.random() });
    } , 1000);
}).connect('tcp://127.0.0.1:8990'); /* connect to alley's subscription socket */
```

## Test

```bash
npm test
```

## Methods

`...`

## Events

`...`

