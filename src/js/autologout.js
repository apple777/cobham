define([ '/js/lib/jquery.js', '/js/api.js', '/js/util.js' ], function ( $, api, util ) {

    /** the value of the LMT attribute in milliseconds */
    var lmtValueMs = null;
    /** the timestamp for the last time the user showed some activity (mouse/keyboard) on the page */
    var lastActivityTimestamp = null;

    api.exe({
        cmd: api.GET( 'LMT' ),
        onSuccess : function () {
            lmtValueMs = Number( this.ajaxdata ) * 60 * 1000;
        }
    });

    $( window ).bind( 'mousemove keypress', function ( e ) {
        lastActivityTimestamp = e.timeStamp;
    });

    util.callEvery( 30000, function () {
        if ( lmtValueMs && lastActivityTimestamp ) {
            if ( lastActivityTimestamp + lmtValueMs < util.getEpoch() ) {
                //user hasn't been active for more than the duration that was specified by LMT. log out.
                window.location.href = '/logout/';
            }
        }
    });
});