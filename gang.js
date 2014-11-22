/**
 * gang.js
 */
module.exports = {
    /**
     * a gangnster (client) in the alley (gang convergence server)
     */
    gangster: require('./lib/gangster'),
    /**
     * the alley (gang convergence server)
     */
    alley: require('./lib/alley'),
    /**
     * the pimp (gang proxy server)
     */
    pimp: require('./lib/pimp')
};
