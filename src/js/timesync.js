/** This module keeps a synchronized copy of the time from the controller so that you don't have to poll the time and do the math.
 * It keeps a local copy of the difference between browser epoch and server epoch so every time you ask the server
 * epoch from this module, it gives a pretty accurate number (except when the time of the server is changed via another
 * mechanism). It polls the server time every minute to keep its value up to date
 */
define( [ '/js/scheduler.js', '/js/util.js' ], function ( scheduler, util ) {

    /** how often poll the time from the server */
    var POLL_INTERVAL = 60000;

    /** the difference between server epoch and local epoch. it can be a positive or negative number or even 0. doesn't matter */
    var diff = null;

    //** synchronize with server time every minute
    scheduler.add( POLL_INTERVAL, {
        cmd: 'now',
        onSuccess: function () {
            var serverEpoch = Number( this.ajaxdata );
            //consider the time it took to execute this request for a better resolution
            serverEpoch += ( this.endTimestamp - this.startTimestamp ) / 2;
            var localEpoch = util.getEpoch();
            diff = localEpoch - serverEpoch;
        }
    });

    /**
     * Returns current server Epoch which is used to calculate the age of the current data ser that has come from the server
     * Check the result against null before using it.
     * @returns {number} current server Epoch (in milliseconds) or null if this module is not initialized yet
     */
    function getServerEpoch () {
        if ( diff !== null ) {
            return util.getEpoch() - diff;
        } else {
            return null;
        }
    }

    return {
        getServerEpoch : getServerEpoch
    }
});