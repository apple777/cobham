//** The filter manager
define([ '/js/api.js', '/js/lib/jquery.js', '/js/lib/underscore.js', '/js/lib/jquery-ui.js' ], function ( api, $, _ ) {

    //** it is called to increase or decrease the number of calls.
    var callCounter;
    //** this is exported. The init function will initialize this and the Library object initializes all the filters in it
    var libraries = [];
    //a flag that indicates if this instance is initialized successfully
    var initialized = false;
    var $dialogText = $( '<div></div>' );
    var $dialog = $( '<div></div>' ).dialog({
        modal:true,
        title:'Reading Filter Libraries',
        autoOpen: false
    }).append( $dialogText );

    //** initializes the filter manager and calls the callback when it's done
    function init ( callback ) {
        if ( initialized ) {
//            console.warn( 'Tried to initialize filtermanager even though it is already initialized. Nothing to do.' );
            return;
        }
        callCounter = (function () {
            var nPendingCalls = 0;
            $dialogText.text( 'Connecting to controller...' );
            $dialog.dialog( 'open' );
            return function ( n ) {
                nPendingCalls += n;
                if ( nPendingCalls === 0 ) {
                    initialized = true;
                    $dialogText.text( 'Done!' );
                    $dialog.dialog( 'close' );
//                    console.info( 'All filters and libraries are loaded.' );
                    callback();
                }
            }
        })();

        api.exe({
            cmd: api.GET( 'FIL', 'count' ),
            onBefore: function () {
                callCounter( +1 );
            },
            onSuccess: function () {
                var libCount = Number( this.ajaxdata );
//                console.info( 'There are ' + libCount + ' libraries in this repeater.' );
                for ( var i = 1; i <= libCount; i++ ) {
                    libraries.push( new Library( i ) );
                }
            },
            onAlways: function () {
                callCounter( -1 );
            }
        });
    }

    //** Finds a library using a search query object
    function getLibrary( searchQuery ) {
        return _.findWhere( libraries, searchQuery );
    }

    //** an object that represents one library
    function Library ( nLib ) {
        $dialogText.text( 'Initializing library#' + nLib );
//        console.log( 'Initializing library#' + nLib );
        var thisLibrary = this;
        thisLibrary.filters = [];
        //get the properties for this library
        api.exe({
            cmd:'get fil ' + nLib + ' details',
            parse:'number:n id:s version:s filterCount:n minBandwidth:s maxBandwidth:s alias:s desc:Q',
            onBefore: function () {
                callCounter( +1 );
                $dialogText.text( 'Receiving details for library ' + nLib  + '...' );
            },
            onSuccess: function () {
                //add all properties from get fil details to this library object
                _.extend( thisLibrary, this.parsedResults );
//                console.log( 'Got library properties. Library id: ' + thisLibrary.id );
            },
            onAlways: function () {
                callCounter( -1 );
            }
        });
        // get the list of all filters
        api.exe({
            cmd:'filterdump filters ' + nLib,
            onBefore: function () {
                callCounter( +1 );
            },
            onSuccess: function () {
                var parts = this.ajaxdata.match( /\d+/gi );
                for ( var p = 0 ; p < parts.length ; p++ ) {
                    if ( parts[p] !== '-' ) {
                        thisLibrary.filters.push( Number( parts[p] ) );
                    } else {
                        //reached the end of the meaningful part of the output!
                        break;
                    }
                }
            },
            onAlways: function () {
                callCounter( -1 );
            }
        });
    }

    return {
        libraries : libraries,
        init : init,
        getLibrary : getLibrary
    };
});
