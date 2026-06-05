/**
 * JQuery-ui compatible power button plugin.
 *
 * Please not that the DOM tag should not have the "powerbutton" class otherwise it will not handle events correctly
 * because the event handling mechanism is only set when the object is assigned the "powerbutton" class.
 *
 * Also keep in mind that at each time only one event handler can be assigned to each of the events "on" or "off". So
 * if you re-assign an event handler, it will override the previous event handler.
 */

define([ '/js/lib/jquery.js', '/js/lib/underscore.js' ], function ( $, _ ) {

    //translates all possible values for the power button to truthy values that are understandable by underlying functions
    function translateValue ( value ) {
        //normalize the string values
        if ( _.isString( value ) ) {
            value = $.trim( value.toLowerCase() );
        }
        switch ( value ) {
            case 'true':
            case 'yes':
            case 'on':
            case '1':
            case 1:
            case true:
                return true;
            case 'false':
            case 'no':
            case 'off':
            case '0':
            case 0:
            case false:
                return false;
            case '-':
            case null:
                return null;
            default:
                console.error( 'Invalid value for setting a power button: ' + value );
                return null;
        }
    }

    //sets the state of power button(s)
    function setState ( $element, value ) {
        switch ( value ) {
            case true:
                $element.removeClass( 'off' ).addClass( 'on');
                break;
            case false:
                $element.removeClass( 'on' ).addClass( 'off');
                break;
            default:
                $element.removeClass( 'on off' );
                break;
        }
    }

    //returns the state of power button(s)
    function getState ( $element ) {
        if ( $element.hasClass( 'on' ) ) {
            return true;
        } else if ( $element.hasClass( 'off' ) ) {
            return false;
        } else {
            return null;
        }
    }

    //the event listener for when the button is clicked
    function onClick ( e ) {
        var $this = $( this );
        switch ( getState( $this ) ) {
            case true:
                //it is on. Turn it off if the off() callback doesn't return false
                var off = $this.data( 'off' );
                if ( _.isFunction( off ) ) {
                    if ( off.call( this, e ) !== false ) {
                        setState( $this, false );
                    }
                }
                break;
            case false:
                //it is off. Turn it on if the on() callback doesn't return false
                var on = $this.data( 'on' );
                if ( _.isFunction ( on ) ) {
                    if ( on.call( this, e ) !== false ) {
                        setState( $this, true );
                    }
                }
                break;
            default:
                console.warn( 'An uninitialized power button was clicked' );
        }
    }

    $.fn.powerbutton = function ( option, key, value ) {

        if ( option === 'option' ) {
            if ( key === 'state' ) {
                if ( value === undefined ) {
                    //Return the value for the last element. If the selector specifies no element, return null
                    var $elements = $( this );
                    return $elements.length > 0 ? getState( $elements ) : null;
                } else {
                    value = translateValue ( value );
                    return this.each( function ( index, element ) {
                        setState( $( element ), value );
                    });
                }
            } else {
                console.warn( 'An unexpected key was passed to the power button as an option: ' + key );
            }
        } else {
            //allow calling the plugin like this: $(...).powerbutton( 'on', function () { /*handler for when turning on */} )
            if ( option === 'on' ) {
                option = {
                    on: key
                }
            } else if ( option === 'off' ) {
                option = {
                    off: key
                }
            } else if ( !_.isObject( option ) ) {
                option = {};
            }
            return this.each( function ( index, element ) {
                var $element = $( element );
                if ( !$element.hasClass( 'powerbutton' ) ) {
                    $element.addClass( 'powerbutton' );
                    $element.on( 'click.powerbutton', onClick );
                }
                if ( _.isFunction ( option.on ) ) {
                    $element.data( 'on', option.on );
                }
                if ( _.isFunction( option.off ) ) {
                    $element.data( 'off', option.off );
                }
                if ( option.state ) {
                    setState( $element, translateValue( option.state ) );
                }
            });
        }
    };
});