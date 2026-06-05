define( [ '/js/lib/jquery.js', '/js/lib/underscore.js', '/js/api.js' ], function ( $, _, api ) {
    /**
     * @deprecated
     * A helper function that is used to run a command and quickly load the result to an UI element
     * @param {string} cmd the command to run
     * @param {jquery} $target the result of a jquery selection
     * @param {string|function} [attribute] if present, the attribute of the $target will be set. if it is a function
     *      it will be treated as a callback function and will be passed the success result and a reference to target
     */
    function load ( cmd, $target, attribute ) {
        "use strict";

        api.exe({
            cmd: cmd,
            onSuccess: function ( result ) {
                if ( _.isString( attribute ) ) {
                    $target.attr ( attribute, result );
                } else if (_.isFunction( attribute ) ) {
                    attribute( result, $target );
                } else {
                    $target.text( result );
                }
            }
        });
    }

    return {
        load : load
    }
});