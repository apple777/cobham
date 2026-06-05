/**
 * JQuery plugin for Gaiges
 */
;
define( ['/js/lib/jquery.js', '/js/convert.js'], function( $, convert ){
    //** sets the value of a needle
    function setValue ( $gauge, value ) {
        var $needle = $gauge.children( '.gauge-needle' );
        $gauge.children( '.gauge-value').text( value );
        if ( $needle.length <= 0 ) {
            console.error( 'gauge.1', 'This instance of the gauge is not initialized with .gauge(): ' + $gauge );
            return;
        }
        var convertor = $gauge.data( 'rangeConvertor' );
        var rotation = convertor.convert( value );
        $needle.css('transform', 'rotate(' + rotation + 'deg)' );
    }
    $.fn.gauge = function ( options, key, value ) {
        if ( options === 'option' ) {
            if ( key === 'value' ) {
                return this.each( function ( index, element ) {
                    setValue( $( element ), value );
                });
            } else {
                console.warn( 'Gauge jquery plugin could not understand this key: ' + key );
                return this;
            }
        } else {
            //initialization
            options = $.extend({
                min:0,
                max:100,
                minAngle:-140,//this is how the illustrator file is designed. it should change if the template changes
                maxAngle:140,
                title:''
            }, options );

            if ( !( 'value' in options ) ) {
                options.value = options.min;
            }

            return this.each( function ( index, element ) {
                var $element = $( element );
                $element.addClass( 'gauge' ).append( '<div class="gauge-needle"></div>' +
                    '<div class="gauge-value"></div>' +
                    '<div class="gauge-title">' + options.title + '</div>' );
                $element.data( 'rangeConvertor', new convert.RangeConvertion( options.min, options.max, options.minAngle, options.maxAngle ) );
                setValue( $element, options.value );
            });
        }
    };
});