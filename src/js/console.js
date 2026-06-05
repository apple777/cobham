/**
 * Emulates the console for browsers which don't have it
 * It augment the global console object to include basic functions which are used in this project.
 * For documentation about each individual function see: https://getfirebug.com/wiki/index.php/Console_API
 */
define([ '/js/lib/underscore.js' ], function () {
        //NOTE after a tricky bug fix: in IE we don't have console in non-developer mode.
        //Also it should only be accessed via the window global object (not alone either).
        //See: http://stackoverflow.com/questions/3326650/console-is-undefined-error-for-internet-explorer
        if ( !window.console ) console = {};

        window.console = _.defaults( console || {}, {
        log : function ( msg ) {},
        trace : function () {
            console.log( 'No trace feature' );
        },
        info : function ( msg ) {
            console.log( 'INF --- ' + msg );
        },
        warn : function ( msg ) {
            console.log( 'WAR >>> ' + msg );
        },
        error : function ( msg ) {
            console.log( 'ERR !!! ' + msg );
        },
        debug : function ( msg ) {
            console.log( 'DBG --- ' + msg );
        },
        assert : function ( exp, msg ) {
            if ( !exp ) {
                console.error( 'Assertion failed: ' + msg );
                throw new Error( 'Assertion failed: ' + msg );
            }
        },
        dir : function ( obj ) {
            console.log( JSON.stringify( obj ) );
        }
    });

    return window.console;
});
