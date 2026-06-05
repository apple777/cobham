define([ './filtermanager.js', './freqind.js', '/js/assign.js', '/js/api.js', '/js/scheduler.js', '/js/lib/jquery.js', '/js/lib/underscore.js', '/js/convert.js', 'bsrFrequencyEditor.js' ],
function ( filterManager, freqind, assign, api, scheduler, $, _, convert, bsrFrequencyEditor ) {

    function init ( insertionPoint ) {

        $.get( 'bsr.html', function ( html ) {
            var template = Handlebars.compile( html );
            $( insertionPoint ).html( template({
                bands: _.range( 1, 5 )
            }));
            freqind.init( '#bsr-freq-indicator' );
            $( '.adjust-button' ).button({
                icons:{primary:'ui-icon-wrench'}
            });
            $( '.advanced' ).hide();
            startUpdating();
        });

    }

    function afterFilterManagerInit () {
        //update libraries and filters
        api.exe({
            cmd:'get fcu --noalias & get fcd --noalias',
            parse:':n FCU1:s :n FCU2:s :n FCU3:s :n FCU4:s :n FCD1:s :n FCD2:s :n FCD3:s :n FCD4:s',
            onSuccess: function () {
                var results = this.parsedResults;
                _.each( [ 'FCU1', 'FCU2', 'FCU3', 'FCU4', 'FCD1', 'FCD2', 'FCD3', 'FCD4' ] , function ( name ) {
                    var libId = results[ name ].match( /(\w+)$/g );
                    if ( libId ) {
                        var library = filterManager.getLibrary({
                            id: libId[0]
                        });
                        if ( library ) {
                            $( '#' + name + '-filter-libraries-select' ).val( library.number ).prop( 'disabled', false).trigger( 'change' );
                        } //else {
                         //   console.error( 'Could not find a library with this id: ' + libId );
                        }
                    //} else {
                        //console.error( 'Could not find the library id for ' + name );
                    //}
                });
            }
        });

        $( '.filter-libraries-select' ).change( function () {
            var nLib = Number( $( this ).val() );
            var library = filterManager.getLibrary({
                number: nLib
            });
            var filters = library.filters;
            var filterOptions = _.reduce( filters, function ( filterOptions, filter ) {
                return filterOptions + '<option>' + filter + '</option>';
            });
            var filterSelectId = $( this).attr( 'data-filter-select-id' );
            $( filterSelectId ).empty().append( filterOptions );
            var attribute = $( this).attr( 'data-attribute' );
            var number = $( this).attr( 'data-number' );
            api.exe({
                cmd:'get ' + attribute + ' ' + number,
                onSuccess: function () {
                    var span = this.ajaxdata.split( ':', 2 )[0];
                    $( filterSelectId).val( span).prop( 'disabled', false );
                }
            })
        });

        $( '.filters-select' ).change( function () {
            var $this = $( this );
            $this.prop( 'disabled', true );
            var attribute = $this.attr( 'data-attribute' );
            var number = $this.attr( 'data-number' );
            api.exe({
                cmd: setAttr( attribute, number, $this.val() ),
                __attribute:attribute,
                __number:number,
                onError: function () {
                    axellPopUp( 'Could not set the value: ' + this.errorThrown );
                    api.exe({
                        cmd:getAttr( attribute, number ),
                        onSuccess: function () {
                            $this.val( this.ajaxdata.split( ':' )[0] );
                        }
                    })
                },
                onAlways: function () {
                    $this.prop( 'disabled', false );
                }
            })
        });
    }

    function startUpdating () {

        filterManager.init( afterFilterManagerInit );

        bsrFrequencyEditor.init ( filterManager );

        $( '.adjust-button' ).click( function () {
            bsrFrequencyEditor.show( Number( $( this ).attr( 'data-number' ) ), $( this ).attr( 'data-link' ) );
        });

        $( '.attenuation-select').add( '.power-level-select').change( function () {
            var $this = $( this );
            $this.prop( 'disabled', true );
            api.exe({
                cmd:api.SET( $this.attr( 'data-attribute' ), $this.attr( 'data-number' ), $this.val() ),
                onError: function () {
                    axellPopUp( 'Failed to set: ' + this.errorThrown );
                    api.exe( updateAttenuations );
                    api.exe( updatePowerLevels );
                },
                onAlways: function () {
                    $this.prop( 'disabled', false );
                }
            });
        });


        var updateFrequencies = scheduler.add( sec(30), {
            cmd: 'get fqu -span & get fqd -span',
            parse: ':n FQU1-start:n FQU1-stop:n :n FQU2-start:n FQU2-stop:n :n FQU3-start:n FQU3-stop:n :n FQU4-start:n FQU4-stop:n ' +
                   ':n FQD1-start:n FQD1-stop:n :n FQD2-start:n FQD2-stop:n :n FQD3-start:n FQD3-stop:n :n FQD4-start:n FQD4-stop:n',
            onSuccess: function () {
                var ids = {};
                var freqRange = new convert.FreqRange();
                var results = this.parsedResults;
                //BSR gives 4 elements while CSR gives 8 elements
                var nElements = 'FQU8-start' in results ? 8 : 4;
                _.each( [ 'FQU', 'FQD' ], function ( attr ) {
                    _.each( _.range( 1, nElements + 1 ), function ( n ) {
                        var attrn = attr + n;
                        freqRange.setStartStop( results[ attrn + '-start' ], results[ attrn + '-stop' ] );
                        ids[ attrn + '-start'  ] = freqRange.start / 1000000;
                        ids[ attrn + '-stop'   ] = freqRange.stop / 1000000;
                        ids[ attrn + '-center' ] = freqRange.center / 1000000;
                        ids[ attrn + '-span'   ] = freqRange.span / 1000;
                    });
                });
                assign.assign({
                    type:'text',
                    suffix:'-value'
                }, ids );
            }
        });

        var updateAttenuations = scheduler.add( sec(30), {
            cmd : 'get atu & get atd',
            parse : ':n ATU1:n :n ATU2:n :n ATU3:n :n ATU4:n :n ATD1:n :n ATD2:n :n ATD3:n :n ATD4:n',
            assignElements:{
                type:'val',
                suffix:'-select'
            }
        });

        scheduler.add( sec(10), {
            cmd: 'get squ & get sqd',
            parse: ':n SQU1:n :n SQU2:n :n SQU3:n :n SQU4:n :n SQD1:n :n SQD2:n :n SQD3:n :n SQD4:n',
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
            parse: ':n LVU1:n :n LVU2:n :n LVU3:n :n LVU4:n :n LVD1:n :n LVD2:n :n LVD3:n :n LVD4:n',
            assignElements:{
                type: 'val',
                suffix: '-select'
            },
            onSuccess:function(){
                for(var k in this.parsedResults){
                    if(this.parsedResults[k]==-100){
                        $("#"+k+"-select").css('color','red');
                    }else{
                        $("#"+k+"-select").css('color','black');
                    }
                }
            }
        });

        scheduler.add( sec(8), {
            cmd : 'GET IPL & GET OPL',
            parse : 'IPL_DL1 IPL_DL2 IPL_DL3 IPL_DL4 IPL_UL1 IPL_UL2 IPL_UL3 IPL_UL4 OPL_DL1 OPL_DL2 OPL_DL3 OPL_DL4 OPL_UL1 OPL_UL2 OPL_UL3 OPL_UL4',
            assignElements:{
                type:'text',
                suffix:'-value'
            }
        });

        scheduler.add( sec(8), {
            cmd : api.GET( 'ALC' ),
            parse : 'ALC_DL1 ALC_DL2 ALC_DL3 ALC_DL4 ALC_UL1 ALC_UL2 ALC_UL3 ALC_UL4',
            assignElements:{
                type:'led',
                suffix:'-led'
            },
            onSuccess: function () {
                for ( var k in this.parsedResults ) {
                    var link = k.substring(k.indexOf("_"), k.length);
                    if(this.parsedResults[k]==1){
                        $('#IPL'+ link +'-value').text("Saturated");
                    }
                }
            }
        });

    }

    return {
        init : init
    }
});
