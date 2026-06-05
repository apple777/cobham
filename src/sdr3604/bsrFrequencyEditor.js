define( ['/js/lib/jquery.js', '/js/api.js', '/js/convert.js' ], function ( $, api, convert ) {

    var filterManager;

    //** a string that can be either 'u' or 'd' and is passed to the show() function
    var currLink = null;
    //** a number between 1 and 4 (inclusive)
    var currBandNumber = null;

    var $start;
    var $stop;
    var $center;
    var $span;
    var $library;
    var $dialog;

    //** the ranges for the uplink and downlink. It is updated using 'get bli' command.
    var range;

    api.exe({
        cmd:api.GET( 'bli' ),
        parse:'dlMin:n dlMax:n ulMin:n ulMax:n',
        onSuccess: function () {
            range = {
                u:{
                    min : this.parsedResults[ 'ulMin' ],
                    max : this.parsedResults[ 'ulMax' ]
                },
                d:{
                    min : this.parsedResults[ 'dlMin' ],
                    max : this.parsedResults[ 'dlMax' ]
                }
            };
        }
    });

    function init ( filterMan ) {

        filterManager = filterMan;

        $.get( 'bsrFrequencyEditor.html', function ( html ) {

            $( 'body' ).append( html );

            $start = $( '#bsr-edit-start' );
            $stop = $( '#bsr-edit-stop' );
            $center = $( '#bsr-edit-center' );
            $span = $( '#bsr-edit-span' );
            $library = $( '#bsr-library-select' );
            $start.keyup( function () {
                $stop.val( Number( $start.val() ) + Number( $span.val() ) );
                $center.val( ( Number( $start.val() ) + Number( $stop.val() ) ) / 2 );
                validateAll();
            });
            $stop.keyup( function () {
                $start.val( Number( $stop.val() ) - Number( $span.val() ) );
                $center.val( ( Number( $start.val() ) + Number( $stop.val() ) ) / 2 );
                validateAll();
            });
            $center.keyup( function () {
                $stop.val( Number( $center.val() ) + Number( $span.val() / 2 ) );
                $start.val( Number( $center.val() ) - Number( $span.val() / 2 ) );
                validateAll();
            });
            $span.change( function () {
                $stop.val( Number( $center.val() ) + Number( $span.val() / 2 ) );
                $start.val( Number( $center.val() ) - Number( $span.val() / 2 ) );
                validateAll();
            });

            $library.change( updateSpanList );

            $dialog = $( '#bsr-frequency-editor-contents' ).dialog({
                width : 450,
                //height: 380,
                resizable : false,
                autoOpen : false,
                buttons:{
                    'Cancel': function () {
                        $dialog.dialog( 'close' );
                    },
                    'OK' : function () {
                        if(currLink=='u'){
                            api.exe({
                                cmd:api.GET ('DUP'),
                                onSuccess:function() {
                                    api.exe({
                                        cmd:api.SET( 'FRQ', currBandNumber, parseInt($center.val())+parseInt(this.ajaxdata) ),
                                        onSuccess: function () {
                                            api.exe({
                                                cmd: api.SET( 'FC' + currLink, currBandNumber, $span.val() + ':' + $library.val() ),
                                                onSuccess: function () {
                                                    $dialog.dialog( 'close' );
                                                },
                                                onError: function () {
                                                    axellPopUp( 'Failed to set the library and span: ' + this.errorThrown );
                                                }
                                            });
                                        },
                                        onError: function () {
                                            axellPopUp( 'Failed to set the center frequency: ' + this.errorThrown );
                                        }
                                    });
                                },
                                onError: function () {
                                    axellPopUp( 'Failed to get duplex spacing: ' + this.errorThrown );
                                }
                            });
                        }else{
                        //first set the center frequency and then set the span:library
                            api.exe({
                                cmd:api.SET( 'FRQ', currBandNumber, $center.val() ),
                                onSuccess: function () {
                                    api.exe({
                                        cmd: api.SET( 'FC' + currLink, currBandNumber, $span.val() + ':' + $library.val() ),
                                        onSuccess: function () {
                                            $dialog.dialog( 'close' );
                                        },
                                        onError: function () {
                                            axellPopUp( 'Failed to set the library and span: ' + this.errorThrown );
                                        }
                                    });
                                },
                                onError: function () {
                                    axellPopUp( 'Failed to set the center frequency: ' + this.errorThrown );
                                }
                            });
                        }
                    }
                }
            });

        });
    }

    /**
     * shows the dialog on screen
     * @param bandNumber a numerical value from 1 to 4 (inclusive)
     * @param link 'u' for uplink or 'd' for downlink
     */
    function show ( bandNumber, link ) {
        $library.empty().append(_.reduce( filterManager.libraries, function ( memo, library ) {
            return memo + '<option value="' + library.id + '">' +  library[ 'alias' ] + '</option>';
        }, ''));
        if ( !_.isFinite( bandNumber ) || bandNumber < 1 || bandNumber > 4 || ( link !== 'u' && link !== 'd' ) ) {
            throw new Error( 'show.bsr.dialog.1: Something wrong with the parameters passed to the show() function: ' + bandNumber + ', ' + link );
        }
        currBandNumber = bandNumber;
        currLink = link;

        $dialog.find( '.bsr-range-hint' ).text( range[link].min + '-' + range[link].max );
        $dialog.find( '.validation-range' ).attr( 'min', range[link].min ).attr( 'max', range[link].max );

        $dialog.dialog( 'option', 'title', 'Editing band ' + bandNumber + ' ' + ( link === 'u' ? 'uplink' : 'downlink' ) );
        $dialog.dialog( 'open' );

        api.exe({
            cmd: api.GET( 'fq' + link),
            onBefore: function () {
                $start.prop( 'disabled', true );
                $stop.prop( 'disabled', true );
                $center.prop( 'disabled', true );
            },
            onSuccess: function () {
                var index = this.ajaxdata.indexOf(bandNumber+ " ");
                var centerFreq = this.ajaxdata.substring(index+2,index+11);
                //var stopFreq = this.ajaxdata.substring(index+12,index+21);
                var freqConv = new convert.FreqRange( centerFreq,$span.val() );
                $center.val( freqConv.center ).prop( 'disabled', false );
                $center.val(centerFreq);
                $start.val( freqConv.start ).prop( 'disabled', false );
                $start.val(Number(centerFreq)- Number($span.val()/2));
                $stop.val( freqConv.stop ).prop( 'disabled', false );
                $stop.val(Number(centerFreq)+Number($span.val())/2);
            }
        });

        api.exe({
            cmd: api.GET( 'fc'+ link, bandNumber ),
            onBefore: function () {
                $library.prop( 'disabled', true );
                $span.prop( 'disabled', true );
            },
            onSuccess: function () {
                //the result is something like 90000:00010100
                var spanLib = this.ajaxdata.match( /(\w+):(\w+)/ );
                if ( !spanLib ) {
                    axellPopUp( 'Could not parse the span and lib from ' + this.ajaxdata );
                    return;
                }
                $library.val( spanLib[ 2 ] ).prop( 'disabled', false );
                updateSpanList();
                $span.val( spanLib[ 1 ] ).prop( 'disabled', false );
            }
        });
    }

    //** loads the list of filters relevant to the current library
    function updateSpanList () {
        var library = filterManager.getLibrary({ id: $library.val() });
        if ( !library ) {
            axellPopUp( 'Could not find a library with this id: ' + $library.val() );
            return;
        }
        $span.empty().append( _.reduce( library.filters, function ( memo, span ) {
            return memo + '<option>' + span + '</option>';
        }, '' ));
    }

    //** validates a numerical edit box to see if it actually contains a number and is within the range
    function validate ( $element ) {
        //check to see if it's possible to convert it to a number
        var num = Number( $element.val() );
        if ( !_.isFinite( num ) ) {
            $element.addClass( 'erroneous').attr( 'title', 'Could not convert ' + $element.val() + ' to number.' );
            return false;
        }
        //check if it is within the range it's supposed to be
        var min = Number( $element.attr( 'min' ) );
        var max = Number( $element.attr( 'max' ) );
        if ( num < min || max < num ) {
            $element.addClass( 'erroneous').attr( 'title', 'Out of range. It should be between ' + min + ' to ' + max );
            return false;
        }
        //otherwise no error has been found
        $element.removeClass( 'erroneous').attr( 'title', '' );
        return true;
    }

    //** validate all numerical edit boxes
    function validateAll () {
//        console.log( 'validating all' );
        validate( $start );
        validate( $stop );
        validate( $center );
    }

    return {
        init : init,
        show: show
    }
});
