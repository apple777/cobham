//** Frequency indicator
define( [ '/js/api.js', '/js/scheduler.js', '/js/convert.js', '/js/lib/jquery.js' ], function ( api, scheduler, convert, $ ) {

    var SAFE_MARGIN = 60000;
    var WIDTH = 984;

    var _ulConverter = null;
    var _dlConverter = null;
    var nItems = 0;
    var ulItems = [];
    var dlItems = [];
    var updateFrequencies = null;

    //the empty distance from left and right
    var MARGIN = 40;
    function init ( selector ) {
        var $container = $( selector );
        nItems = $container.attr( 'data-count' );
        console.info( 'Initializing frequency indicator for ' + nItems + ' items.' );
        api.exe({
            cmd:'get bli',
            parse:'dlMin:n dlMax:n ulMin:n ulMax:n',
            onSuccess: function ( o ) {
                //the range numbers at 4 corners of the indicator
                $container.append( '<div class="freq-indicator-range-ul-min freq-indicator-range">' + o.parsedResults[ 'ulMin' ] / 1000000 + 'MHz</div>' );
                $container.append( '<div class="freq-indicator-range-ul-max freq-indicator-range">' + o.parsedResults[ 'ulMax' ] / 1000000 + 'MHz</div>' );
                $container.append( '<div class="freq-indicator-range-dl-min freq-indicator-range">' + o.parsedResults[ 'dlMin' ] / 1000000 + 'MHz</div>' );
                $container.append( '<div class="freq-indicator-range-dl-max freq-indicator-range">' + o.parsedResults[ 'dlMax' ] / 1000000 + 'MHz</div>' );
                //when channels are too close to the start and stop of the range, they are not shown properly. Add a safety margin to solve this issue
                $container.width( WIDTH );

                _ulConverter = new convert.RangeConvertion( o.parsedResults[ 'ulMin' ] - SAFE_MARGIN, o.parsedResults[ 'ulMax' ] + SAFE_MARGIN, MARGIN, WIDTH - MARGIN );
                _dlConverter = new convert.RangeConvertion( o.parsedResults[ 'dlMin' ] - SAFE_MARGIN, o.parsedResults[ 'dlMax' ] + SAFE_MARGIN, MARGIN, WIDTH - MARGIN );

                ulItems = [];
                dlItems = [];
                for( var i = 1; i <= nItems; i++ ) {
                    ulItems.push( $( '<div class="ul-freq-indicator-bar freq-indicator-bar" data-number="' + i + '" data-du="uplink">' + i + '</div>' ) );
                    dlItems.push( $( '<div class="dl-freq-indicator-bar freq-indicator-bar" data-number="' + i + '" data-du="downlink">' + i + '</div>' ) );
                }

                $container.append( ulItems, dlItems );

                setHoverEvents();

                updateFrequencies = scheduler.add( sec( 5 ), {
                    cmd:'get fqu -span & get fqd -span & get lvu & get lvd',
                    onSuccess: function () {
                        var offset, band, start, stop, offset, power;
                        //parse the string into numbers
                        var numbers = _.map( this.ajaxdata.split( /\s+/ ), Number );
                        for ( var i = 0; i < nItems; i++ ) {
                            offset = 0;
                            band = numbers[ offset + i * 3 ];
                            start = numbers[ offset + ( i * 3 ) + 1 ];
                            stop = numbers[ offset + ( i * 3 ) + 2 ];
                            offset = nItems * 6;
                            power = numbers[ offset + ( i * 2 ) + 1 ];
                            setFreqBar( 'u', band, start, stop, power );

                            offset = nItems * 3;
                            band = numbers[ offset + i * 3 ];
                            start = numbers[ offset + ( i * 3 ) + 1 ];
                            stop = numbers[ offset + ( i * 3 ) + 2 ];
                            offset = nItems * 8;
                            power = numbers[ offset + ( i * 2 ) + 1 ];
                            setFreqBar( 'd', band, start, stop, power );
                        }
                    }
                });

                update();
            }
        });
    }
    //** sets the position of a particular frequency bar
    function setFreqBar ( ud, band, startFreq, stopFreq, power ) {
        var converter = ( ud === 'u' ? _ulConverter : _dlConverter );
        var target = ( ud === 'u' ? ulItems[ band - 1 ] : dlItems[ band - 1] );

        var startPx = converter.convert( startFreq );
        var stopPx = converter.convert( stopFreq );

        target.css( 'left', startPx ).width( stopPx - startPx )
            .attr( 'data-start', startFreq)
            .attr( 'data-stop', stopFreq )
            .attr( 'title', startFreq + '-' + stopFreq );

        if ( power === -100 ) {
            target.addClass( 'disabled' );
        } else {
            target.removeClass( 'disabled' );
        }
    }

    //** updates the indicator with the latest information from the controller
    function update () {
        if ( updateFrequencies ) {
            api.exe( updateFrequencies );
        }
    }

    //** sets the hover effect for the little indicator bars
    function setHoverEvents () {
        $( '.freq-indicator-bar').hover( function () {
            var number = $( this ).attr( 'data-number' );
            var du = $( this ).attr( 'data-du' );
            $( '.' + du + '-row .column-' + number ).addClass( 'focused-column' );
        }, function () {
            var number = $( this ).attr( 'data-number' );
            var du = $( this ).attr( 'data-du' );
            $( '.' + du + '-row .column-' + number  ).removeClass( 'focused-column' );
        });
    }

    return {
        init:init,
        update:update
    };
});
