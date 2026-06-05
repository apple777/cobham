/**
 * JQuery plugin for LEDs
 */

define([ '/js/lib/jquery.js' ], function ( $ ) {

    $.fn.led = function ( options, key, value ) {

        if ( options === 'option' ) {
            if ( key === 'color' ) {
                return this.each( function ( index, element ) {
                    switch( value ) {
                        case 'green':
                        case '0':
                        case 'false':
                        case false:
                        case 0:
                            $( element ).removeClass( 'grey red blue yellow' ).addClass( 'green' );
                            break;
                        case 'red':
                        case '1':
                        case 'true':
                        case true:
                        case 1:
                            $( element ).removeClass( 'grey green blue yellow' ).addClass( 'red' );
                            break;
                        case 'grey':
                        case '-':
                        case 'null':
                        case null:
                        case Number.NaN:
                            $( element ).removeClass( 'red green blue yellow' ).addClass( 'grey' );
                            break;
                        case 'blue':
                            $( element ).removeClass( 'red green grey yellow' ).addClass( 'blue' );
                            break;
                        case 'yellow':
                            $( element ).removeClass( 'red green grey blue' ).addClass( 'yellow' );
                            break;
                        case undefined:
                        case '':
                            $( element ).removeClass( 'red green grey blue yellow' );
                            break;
                        default:
                            $( element ).removeClass( 'red green grey' );
                            console.warn( 'Invalid color value passed to setLedColor: "' + value + '"' );
                            break;
                    }
                });
            } else {
                console.warn( 'Led jquery extension could not understand this key: ' + key );
                return this;
            }

        } else {

            this.each( function ( index, element ) {
                $( element ).addClass( 'led' );
            });

            if ( options ) {
                if ( options.color ) {
                    this.each( function ( index, element ) {
                        $( element ).addClass( options.color );
                    });
                }
                if ( options.type ) {
                    this.each( function ( index, element ) {
                        $( element ).addClass( options.type );
                    });
                }
            }
            return this;
        }
    };
});