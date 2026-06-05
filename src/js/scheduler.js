/**
 * This module allows repetitive calls.
 * It internally handles two separate but related arrays: one for the settings objects and one for the intervals.
 */
define([ '/js/api.js', '/js/util.js' ],
function ( api, util ) {

    //** number of milliseconds between each check to see if there's a call we can run (calls with interval)
    var DEQUEUE_INTERVAL = 500;

    //** the private set that contains all the settings objects
    var settingsArr = [];
    var intervalsArr = [];

    /**
     * Called on a regular basis and tries to find something to run
     */
    function tryToRunSomething () {
        "use strict";

        if ( api.isCallPending() || settingsArr.length === 0 ) {
            //nothing to run
            return;
        }

        //if no command was found without interval, try to run the intervalled command which is mostly overdue
        var currentTime = util.getEpoch();
        //the overdue of the setting object that is starving the most
        var maxOverdue = 0;
        //the setting object that is starving the most
        var settingsMaxOverdue = null;

        //go through all items in the array
        for ( var i = 0; i < settingsArr.length; i++ ) {
            var settings = settingsArr[ i ];
            var interval = intervalsArr[ i ];
            if ( !settings.endTimestamp ) {
                //it is not run even once. We need to run it because this algorithm needs endTimestamp for calculating overdue
                settingsMaxOverdue = settings;
                break;
            }
            //calculate how much it is overdue
            var overdue = currentTime - ( settings.endTimestamp + interval );
            if ( overdue <= 0 ) {
                continue;
            }
            if ( overdue > maxOverdue ) {
                maxOverdue = overdue;
                settingsMaxOverdue = settings;
                //but keep looking for something that is even more overdue
            }
        }
        //if something is found, run it
        if ( settingsMaxOverdue ) {
            api.exe( settingsMaxOverdue );
        }
    }

    /**
     * Add a settings object to the repetition queue. adding a setting object to the queue will start running it.
     * @param interval {number} minimum number of milliseconds between each execution (the actual number of milliseconds may be much higher than this)
     * @param settings {object} the settings object as passed to api.exe() function
     */
    function add ( interval, settings ) {
        "use strict";
        var notExisted = true;
        for(var i =0; i <settingsArr.length;i++){
            var index = settingsArr[i]['cmd'].indexOf(settings['cmd']);
            if ( index === -1 ) {
                notExisted= true;
            }else{
                notExisted=false;
                return false;
            }
        }
        if ( notExisted) {
            //prepare it for running
            api.prepare( settings );
            //put it in the set of intervalled calls
            settingsArr.push( settings );
            intervalsArr.push( interval );
        }
        return settings;//setting is changed now because it is called by api.prepare.
    }

    /**
     * Removes a settings object from the repetition queue
     * @param settings {object} the setting object that was previously passed to the add() function in this module {cmd: ...}
     */
    function remove ( settings ) {
        "use strict";
        for(var i =0; i <settingsArr.length;i++){
            var index = settingsArr[i]['cmd'].indexOf(settings['cmd']);
            if ( index !== -1 ) {
                //if the settings object is found, remove it and its corresponding index
                settingsArr.splice( i, 1 );
                intervalsArr.splice( i, 1 );
                return false;
            }
        }
    }

    //Finds the next settings object and executes it.
    util.callEvery( DEQUEUE_INTERVAL, tryToRunSomething );

    return {
        add : add,
        remove : remove
    }

});