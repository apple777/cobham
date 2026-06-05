//** this is a utility function that is used for assigning the results of a parsed expression to html elements
define( [ '/js/lib/jquery.js', '/js/lib/underscore.js' ], function ( $, _ ) {
    "use strict";

    /**
     * Assigns the values from data to elements that are specified by descriptor
     * @param descriptor an object that has two properties: type and an optional suffix string
     * @param data an object that has properties that will be used to set the values
     */
    function assign ( descriptor, data ) {
        "use strict";

        var suffix = descriptor.suffix || '';

        switch ( descriptor.type ) {
            case 'val':
                _.each( data, function ( value, name ) {
                    if ( name ) {
                        $( '#' + name + suffix ).val( value );
                    }
                });
                break;
            case 'text':
                _.each( data, function ( value, name ) {
                    if ( name ) {
                        $( '#' + name + suffix ).text( value );
                    }
                });
                break;
            case 'led':
                _.each( data, function ( value, name ) {
                    if ( name ) {
                        $( '#' + name + suffix ).led( 'option', 'color', value );
                    }
                });
                break;
            case 'title':
                _.each( data, function ( value, name ) {
                    if ( name ) {
                        $( '#' + name + suffix ).attr( 'title', value );
                    }
                });
                break;
            default:
                console.error( 'Invalid type speficied for assignElements property: ' + descriptor.type );
        }
    }

    return {
        assign: assign
    }
});