define([ '/js/lib/jquery.js', '/js/lib/underscore.js', '/js/sim.js', '/js/format.js', '/js/assign.js', '/js/console.js', '/js/util.js' ],
function ( $, _, sim, format, assign, console, util ) {

    //** the prefix that will be added to commands if necessary
    //noinspection JSUnresolvedVariable
    var nodePrefix = document.location.toString().match(/nodes\/(\w+)\//);
    if ( nodePrefix ) {
        nodePrefix = '@' + nodePrefix[ 1 ];
        console.log( 'Running in a node-specific directory. Node number prefix is: ' + nodePrefix );
    } else {
        nodePrefix = '';
    }

    //** this flag is set to true whenever there is an ajax call in progress ie. the request is sent but waiting for reply
    var callPending = false;

    //** properties of this object will be augmented into the main settings object
    var settingsAugment = {
        url : '/cgi/cmd.lua',
        beforeSend : beforeSend,
        success : success,
        error : error,
        complete : complete,
        dataType: 'text',
        type : 'POST',
        timeout: 60000,
        onSuccess: function () {
            //some default message in case there is no listener for success (quite ironic ha?)
            //console.log( 'Command executed successfully: ' + this.cmd );
        },
        onError: function () {
            //some default error message in case there is no error listener (it's not necessary to listen to errors all the time but it's good habit)
            console.error( 'The command could not be executed: ' + this.cmd + ': ' + this.textStatus + ': ' + this.errorThrown );
        }
    };

    /**
     * Runs a function specified by fnName if it exist in the obj
     * @param obj {Object} usually the settings object
     * @param fnName {String} the name of the function that is supposed to exist in the object
     * @return {*} the result of running the function or undefined if fnName doesn't represent a function on obj
     */
    function runIf ( obj, fnName ) {
        if ( _.isFunction( obj[ fnName ] ) ) {
            try {
                return obj[ fnName ]( obj );
            } catch ( ex ) {
                console.error( 'Error running ' + fnName + ': ' + ex );
                //rethrow the error
                throw ex;
            }
        }
        return undefined;
    }

    /** runs before making the ajax call
     *  See jquery documentation for more info about this standard callback.
     */
    function beforeSend () {
        'use strict';

        callPending = true;

        var ret = runIf( this, 'onBefore' );

        if ( ret === false ) {
            //if the onBefore callback returns false, we don't continue
            return false;
        }

        this.startTimestamp = util.getEpoch();

        //if it's simulated, don't initiate an actual ajax request. Just get it from the simulator
        if ( sim.isSimulated( this.cmd ) ) {
            var simulatedResult = sim.getResult( this.cmd );
            console.log( 'Command simulated: ' + this.cmd + '. Result: ' + simulatedResult );
            this.success( simulatedResult, 'simulated', null );
            this.complete();
            //cancel sending the request to the server
            return false;
        }

        // ret is not false here and we know that it is not simulated so the command will be sent to the server
        return ret;
    }

    /** the callback for when the jquery ajax call succeeds.
     * See jquery documentation for more info about this standard callback.
     */
    function  success ( ajaxdata, textStatus, jqXHR ) {
        'use strict';

        callPending = false;
        this.endTimestamp = util.getEpoch();
        this.executionTime = this.endTimestamp - this.startTimestamp;

        //if the callOnDiff flag is off or if it is on, the string is changed from the last call (what's stored in 'this.ajaxdata')
        if ( !this.callOnDiff || ( this.callOnDiff && ajaxdata !== this.ajaxdata ) ) {
            /*
             * even if the Ajax call successfully returned, it can indicate an error string.
             * the following line catches strings that start with a word and then the
             * string "Error:" , "System Error:" and "Web Error:" (basically a word and then "Error:")
             */
            if( /^\s*(\w*\s*Error):\s*(.*)/i.test( ajaxdata ) ) {
                console.log( 'The result of executing ' + this.cmd + ' indicated an error. Treating it as an error.' );
                this.error( jqXHR, 'backenderror', ajaxdata );
            } else {
                console.log( 'Command executed successfully: ' + this.cmd );
                delete this.errorThrown;
                this.ajaxdata = ajaxdata;
                this.jqXHR = jqXHR;
                this.textStatus = textStatus;

                //if it is supposed to be parsed
                if ( 'parser' in this ) {
                    try {
                        this.parsedResults = this.parser.parse( ajaxdata );
                        //call the possible assignElements
                        if ( 'parsedResults' in this && 'assignElements' in this ) {
                            assign.assign( this.assignElements, this.parsedResults );
                        }
                    } catch ( ex ) {
                        console.error( 'Failed to parse the result of ' + this.cmd + ' because: ' + ex );
                    }
                }

                //if there's an onSuccess callback, call it
                runIf( this, 'onSuccess' );
            }
        }
    }

    /** the callback for when an error happens in the jquery function call.
     * See jquery documentation for more info about this standard callback.
     */
    function error ( jqXHR, textStatus, errorThrown ) {
        'use strict';

        this.jqXHR = jqXHR;
        this.textStatus = textStatus;
        this.errorThrown = errorThrown;
        delete this.ajaxdata;

        callPending = false;
        this.endTimestamp = util.getEpoch();
        this.executionTime = this.endTimestamp - this.startTimestamp;

        runIf( this, 'onError' );
    }

    /** the callback for when the jquery call completes successfully or with error */
    function complete () {
        'use strict';

        callPending = false;

        runIf( this, 'onAlways' );
    }

    /**
     * prepare the settings object to be used by $.ajax() function.
     * It is possible to prepare a setting object several times with no side effects.
     * For example prepare( prepare( settings ) ) is the same as prepare( settings )
     * @param settings {Object}
     */
     function prepare ( settings ) {
        "use strict";

        _.defaults( settings, settingsAugment );

        //set the context that the functions will be running in (the this keyword in beforeSend, success, error, complete, etc.)
        settings.context = settings;

        //take care of the 'data' property (calculate it based on the contents of the 'cmd' property)
        settings.data = {
            cmd : settings.noNodeNumber ? settings.cmd : nodePrefix + settings.cmd
        };

        //if the result should be parsed but a parser object isn't provided or built yet
        if ( settings.parse && !settings.parser ) {
            //let this throw and interrupt the execution if there is an error in the format string
            settings.parser =  new format.Parser( settings.parse );
        }

        return settings;
    }

    /**
     * Prepares a settings object to be run using the standard JQuery Ajax call.
     * @param {object} settings An object containing the command, callback function, settings, etc
     *        settings object is used as the exe() function input/output. The following properties exist:
     * @param settings.parse {string} the parameter to pass to the Parser() function that will be created internally. The parser object
     *        is stored as a property of settings.
     * @param settings.assignElements {object} assigns the parsed results to html elements. This object should have a 'type' property
     *        that can be 'val', 'text', 'title' or 'led' and it indicates how the value is going to be assigned
     *        to the element. The object can optionally have a 'suffix' property that will be used to
     *        make the element name by adding it at the end of the properties of the parsedResults.
     *        For more information see the assignElements() function above.
     * @param settings.parsedResults {array} the result of the parser in case parse properties were specified in settings.
     * @param settings.onBefore {function} callback to run before the ajax call is sent.
     * @param settings.onSuccess {function} callback to run when the execution was successful. It gets the settings object as argument.
     *        The following elements from the settings can be used: ajaxdata, jqXHT, textStatus
     * @param settings.onError {function} callback to run when the execution had an error. It gets the settings object as argument
     * @param settings.onAlways {function} callback to run when the execution was finished (success or error). It gets the settings
     *        object as argument
     * @param settings.callOnDiff {boolean} call the onSuccess function only if the result is different from the last execution (ajaxdata)
     * @param settings.ajaxdata {string} the result of a successful the call in plain text.
     * @param settings.jqXHR {object} comes from JQuery. See its documentation online.
     * @param settings.textStatus {string} this will be 'simulated' in case of simulated results. Also if the call is successful but it
     *        contains the '...Error:...' string at the beginning, the text status is the '...Error:...'
     *        string itself
     * @param settings.startTimestamp {number} The epoch timestamp (based on the client machine) for when the exe() function was called
     * @param settings.endTimestamp {number} The epoch timestamp (based on the client machine) for when the results came back
     * @param settings.executionTime {number} total number of milliseconds from when the call was made till its reply came back
     * @param settings.noNodeNumber {boolean} by default all commands will have a node prefix based on where they are running from.
     *        with this flag this behavior can be disabled (it comes handy for commands other than GET,
     *        SET, ACT which don't understand @NodeNumber at their start
     * @param settings.nodePrefix {string} the string to be appended at the beginning of the command if it is enabled
     * @param settings.interval {number} number of milliseconds to execute the command after receiving the result.
     *
     * ----------------------------------------
     *
     * by convention all properties of the settings object which start with one underscore '_' are the ones that are used
     * in the exe() function but those which have two underscores can be used freely by the client for whatever purpose.
     *
     * ----------------------------------------
     * if you need to pass any special variable to the handling functions, you can use the settings parameter but all those
     * variables should have a key name starting with double underscore:
     * api.exe({
     *   ...
     *   __myVar:"my value"
     * });
     *
     * The api.exe() function uses the dingle underscore for private variables that are used in the internal algorithms.
     */
    function exe ( settings ) {
        'use strict';

        prepare( settings );

        return $.ajax( settings );
    }

    /**
     * executes an array of commands, and then calls onFinished with the array of result objects.
     * note: because of how this function works, none of the commands can have an onAlways method
     */
    function exeArr ( settingsArr, onFinished ) {

        if ( _.isFunction ( onFinished ) ) {
            //number of executed commands so far
            var nExecuted = 0;
            //number of commands to be executed in the array
            var max = settingsArr.length;
            //this is called when every command execution completes. It checks if the execution of the whole array is done
            function checkIfDone () {
                nExecuted++;
                if ( nExecuted === max ) {
                    util.runIfFunction( onFinished, this, settingsArr );
                }
            }

            _.each( settingsArr, function ( settings ) {
                settings.onAlways = checkIfDone;
                exe( settings );
            });
        } else {
            _.each( settingsArr, function ( settings ) {
                exe( settings );
            });
        }
    }

    function isCallPending () {
        return callPending;
    }

    //noinspection JSUnresolvedVariable
    /**
     * This function is provided for compatibility reasons to support legacy code.
     * It can run ACT, GET, SET commands as well as any other command that is valid for the userproc
     * callbacks gets a string that is the result of that command: either the "output" or the "error" part of it.
     * @param commandString the command to run (it is mandatory)
     * @param data (optional) an optional map that will be passed to the callback function when it is called (pretty much the same
     *                        idea as jquery callback data)
     * @param callback (optional) a call back function that will be called if command executes successfully or with error.
     *                        The function signature is callback(output[,error[,data]]). If an error happens, 'output' is null and
     *                        'error' contains a string that describes the error (it doesn't have the 'ONE_OPTIONAL_WORD Error: '
     *                        at its beginning. Therefore if the returned string is like 'Error: ', 'System Error: ', or 'Error: '
     *                        the callback will be called with an error string.
     *                        Also if the ajax call fails for any other reason, the callback will be called with an error string.
     */
    window.axshCall = function axshCall(commandString,data,callback){
         if ( !callback ) {
             callback = data;
         }
         exe({
             cmd: commandString,
             __fnData: data,
             noNodeNumber: true,
             onSuccess: function ( o ) {
                 callback( o.ajaxdata, null, o.__fnData );
             },
             onError: function ( o ) {
                 callback( null, o.textStatus + ': ' + o.errorThrown, o.__fnData );
             }
         });
     };

    /** builds up the command string for a GET command
     * @return {string} the command that is ready to be passed to api.exe()
     */
    function GET ( attribute ) {
        //noinspection JSUnresolvedFunction
        var ret = 'GET ' + attribute.toUpperCase();
        //noinspection JSUnresolvedVariable
        for (var i = 1; i < arguments.length; i++) {
            ret += ' ' + arguments[i];
        }
        return ret;
    }

    /** builds up the command string for a SET command
     * @return {string} the command that is ready to be passed to api.exe()
     */
    function SET ( attribute ) {
        //noinspection JSUnresolvedFunction
        var ret = 'SET ' + attribute.toUpperCase();
        //noinspection JSUnresolvedVariable
        for (var i = 1; i < arguments.length; i++) {
            ret += ' ' + arguments[i];
        }
        return ret;
    }

    /** builds up the command string for an ACT command
    * @return {string} the command that is ready to be passed to api.exe()
    */
    function ACT ( attribute ) {
        //noinspection JSUnresolvedFunction
        var ret = 'ACT ' + attribute.toUpperCase();
        //noinspection JSUnresolvedVariable
        for (var i = 1; i < arguments.length; i++) {
            ret += ' ' + arguments[i];
        }
        return ret;
    }

    /** builds up the command string for an ACT command
    * @return {string} the command that is ready to be passed to api.exe()
    */
    function RUN ( command ) {
        var ret = command;
        //noinspection JSUnresolvedVariable
        for (var i = 1; i < arguments.length; i++) {
            ret += ' ' + arguments[i];
        }
        return ret;
    }

    //noinspection JSUnresolvedVariable
    window.getAttr = GET;
    //noinspection JSUnresolvedVariable
    window.setAttr = SET;
    //noinspection JSUnresolvedVariable
    window.actAttr = ACT;
    //noinspection JSUnresolvedVariable
    window.actRun = RUN;

    return {
        exe : exe,
        prepare : prepare,
        isCallPending : isCallPending,
        exeArr : exeArr,
        GET : GET,
        SET : SET,
        ACT : ACT,
        RUN : RUN
    }
});