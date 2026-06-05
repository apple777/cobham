define([ './freqind.js', '/js/api.js', '/js/scheduler.js', '/js/convert.js', '/js/assign.js', '/js/lib/jquery.js', '/js/lib/underscore.js' ],
function ( freqind, api, scheduler, convert, assign, $, _ ) {

    function init ( insertionPoint ) {

        $.get( 'csr.html', function ( html ) {
            var template = Handlebars.compile( html );
            $( insertionPoint ).html( template({
                chains: _.range( 1, 9 )
            }));
            freqind.init( '#csr-freq-indicator' );
            $( '.advanced' ).hide();
            startUpdating();
        });

    }

    function startUpdating () {

        var updateFrequencies = scheduler.add( sec(10), {
            cmd: 'get fqu -span & get fqd -span',
            parse: ':n FQU1-start:n FQU1-stop:n :n FQU2-start:n FQU2-stop:n :n FQU3-start:n FQU3-stop:n :n FQU4-start:n FQU4-stop:n :n FQU5-start:n FQU5-stop:n :n FQU6-start:n FQU6-stop:n :n FQU7-start:n FQU7-stop:n :n FQU8-start:n FQU8-stop:n ' +
                   ':n FQD1-start:n FQD1-stop:n :n FQD2-start:n FQD2-stop:n :n FQD3-start:n FQD3-stop:n :n FQD4-start:n FQD4-stop:n :n FQD5-start:n FQD5-stop:n :n FQD6-start:n FQD6-stop:n :n FQD7-start:n FQD7-stop:n :n FQD8-start:n FQD8-stop:n',
            onSuccess: function () {
                var ids = {};
                var freqRange = new convert.FreqRange();
                _.each( [ 'FQU1' ,'FQU2', 'FQU3', 'FQU4', 'FQU5', 'FQU6', 'FQU7', 'FQU8', 'FQD1' ,'FQD2', 'FQD3', 'FQD4', 'FQD5', 'FQD6', 'FQD7', 'FQD8' ], function ( attr ) {
                    freqRange.setStartStop( this.parsedResults[ attr + '-start' ], this.parsedResults[ attr + '-stop' ] );
                    ids[ attr + '-start'  ] = freqRange.start / 1000000;
                    ids[ attr + '-stop'   ] = freqRange.stop / 1000000;
                    ids[ attr + '-center' ] = freqRange.center / 1000000;
                    ids[ attr + '-span'   ] = freqRange.span / 1000;
                }, this );
                assign.assign({
                    type:'text',
                    suffix:'-value'
                }, ids );
            }
        });

        var updateAttenuations = scheduler.add( sec(10), {
            cmd: 'get atu & get atd',
            parse: ':n ATU1:n :n ATU2:n :n ATU3:n :n ATU4:n :n ATU5:n :n ATU6:n :n ATU7:n :n ATU8:n :n ATD1:n :n ATD2:n :n ATD3:n :n ATD4:n :n ATD5:n :n ATD6:n :n ATD7:n :n ATD8:n',
            assignElements:{
                type:'val',
                suffix:'-select'
            }
        });

        var updateSquelch = scheduler.add( sec(10), {
            cmd: 'get squ & get sqd',
            parse: ':n SQU1:n :n SQU2:n :n SQU3:n :n SQU4:n :n SQU5:n :n SQU6:n :n SQU7:n :n SQU8:n :n SQD1:n :n SQD2:n :n SQD3:n :n SQD4:n :n SQD5:n :n SQD6:n :n SQD7:n :n SQD8:n',
            onSuccess: function () {
                for ( var k in this.parsedResults ) {
                    this.parsedResults[k] /= 10;
                }
                assign.assign({
                    type:'text',
                    suffix:'-value'
                },this.parsedResults);
            }
        });

        var updatePowerLevels = scheduler.add( sec(10), {
            cmd: 'get lvu & get lvd',
            parse: ':n LVU1:n :n LVU2:n :n LVU3:n :n LVU4:n :n LVU5:n :n LVU6:n :n LVU7:n :n LVU8:n :n LVD1:n :n LVD2:n :n LVD3:n :n LVD4:n :n LVD5:n :n LVD6:n :n LVD7:n :n LVD8:n',
            assignElements:{
                type: 'val',
                suffix: '-select'
            }
        });

        scheduler.add( sec(8), {
            cmd: api.GET( 'ALC' ),
            parse: 'ALC_DL1 ALC_DL2 ALC_DL3 ALC_DL4 ALC_DL5 ALC_DL6 ALC_DL7 ALC_DL8 ALC_UL1 ALC_UL2 ALC_UL3 ALC_UL4 ALC_UL5 ALC_UL6 ALC_UL7 ALC_UL8',
            assignElements:{
                type:'led',
                suffix:'-led'
            }
        });

        scheduler.add( sec(8), {
            cmd: 'GET IPL & GET OPL',
            parse: 'IPL_DL1 IPL_DL2 IPL_DL3 IPL_DL4 IPL_DL5 IPL_DL6 IPL_DL7 IPL_DL8 IPL_UL1 IPL_UL2 IPL_UL3 IPL_UL4 IPL_UL5 IPL_UL6 IPL_UL7 IPL_UL8 ' +
                   'OPL_DL1 OPL_DL2 OPL_DL3 OPL_DL4 OPL_DL5 OPL_DL6 OPL_DL7 OPL_DL8 OPL_UL1 OPL_UL2 OPL_UL3 OPL_UL4 OPL_UL5 OPL_UL6 OPL_UL7 OPL_UL8',
            assignElements:{
                type:'text',
                suffix:'-value'
            }
        });


        var updateChainChannels = scheduler.add( sec(10), {
            cmd:'get cha',
            parse:':s CHA1:s :s CHA2:s :s CHA3:s :s CHA4:s :s CHA5:s :s CHA6:s :s CHA7:s :s CHA8:s',
            assignElements:{
                type:'val',
                suffix:'-select'
            },
            onSuccess: function () {
                $( '.ch-num-select' ).prop( 'disabled', false );
                api.exe( updateFrequencies );
            }
        });

        var updateFilterConfigs = scheduler.add( sec(10), {
            cmd:'get fcu & get fcd',
            parse:':n FCU1:n :n FCU2:n :n FCU3:n :n FCU4:n :n FCU5:n :n FCU6:n :n FCU7:n :n FCU8:n ' +
                  ':n FCD1:n :n FCD2:n :n FCD3:n :n FCD4:n :n FCD5:n :n FCD6:n :n FCD7:n :n FCD8:n',
            assignElements:{
                type:'val',
                suffix:'-select'
            }
        });

        api.exe({
            cmd:'GET CHL & GET CCP',
            parse: 'minChannel:n maxChannel:n refFreq:n carrierFreqOffset:n duplexSpacing:n revOp:c chRaster:n',
            onSuccess: function () {
                var MIN_CHANNEL = this.parsedResults.minChannel;
                var MAX_CHANNEL = this.parsedResults.maxChannel;
                var refFreq = this.parsedResults.refFreq;
                var chRaster = this.parsedResults.chRaster;
                var carrierFreqOffset = this.parsedResults.carrierFreqOffset;
                var duplexSpacing = this.parsedResults.duplexSpacing;
                var listOfOptions = '';
                //populate the <select> elements that show the list of the channel numbers
                for ( var chNum = MIN_CHANNEL; chNum <= MAX_CHANNEL; chNum++ ) {
                    var dlFreq = ( refFreq * 1000000 ) + ( chNum * chRaster ) + carrierFreqOffset;
                    var ulFreq = dlFreq - duplexSpacing;
                    //var dl = Number( ul ) + Number( duplexSpacing );
                    listOfOptions += '<option value="' + chNum + '" title="UL Center:' + ulFreq + ' Hz, DL Center:' + dlFreq + ' Hz">'
                        + chNum + ' (&uarr;' + ( ulFreq / 1000000 )+ ' &darr;' + ( dlFreq / 1000000 ) + 'MHz)'
                    '</option>\n';
                }
                $( '.ch-num-select' ).append( listOfOptions );
                api.exe( updateChainChannels );
            }
        });

        $( '.attenuation-select' ).add( '.config-select' ).add( '.power-level-select').add( '.ch-num-select' ).change( function () {
            var $this = $( this );
            $this.prop( 'disabled', true );
            api.exe({
                cmd:api.SET( $this.attr( 'data-attribute' ), $this.attr( 'data-number' ), $this.val() ),
                onSuccess: function () {
                    api.exe( updateFrequencies );
                    freqind.update();
                },
                onError: function () {
                    axellPopUp( 'Failed to set: ' + this.errorThrown );
                    api.exe( updateAttenuations );
                    api.exe( updatePowerLevels );
                    api.exe( updateFilterConfigs );
                },
                onAlways: function () {
                    $this.prop( 'disabled', false );
                }
            });
        });

    }

    return {
        init : init
    }

});
