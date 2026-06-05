define([ '/js/api.js', '/js/lib/jquery.js', '/js/lib/jquery-ui.js' ], function ( api, $ ) {

    //** the raster table from the wiki http://nesta/mediawiki/index.php/FFT_Daemon_Specification#Raster_Details
    var RASTER_TABLE = [
        {
            sampleLength: 512,
            raster: 122070,
            rounded: 120,
            error: 1.7
        },
        {
            sampleLength: 1024,
            raster: 61035,
            rounded: 60,
            error: 1.7
        },
        {
            sampleLength: 2048,
            raster: 30518,
            rounded: 30,
            error: 1.7
        },
        {
            sampleLength: 4096,
            raster: 15259,
            rounded: 15,
            error: 1.7
        },
        {
            sampleLength: 8192,
            raster: 7629,
            rounded: 7.5,
            error: 1.7
        },
        {
            sampleLength: 16384,
            raster: 3815,
            rounded: 3.75,
            error: 1.7
        },
        {
            sampleLength: 32768,
            raster: 1907,
            rounded: 2,
            error: -4.86
        },
        {
            sampleLength: 65536,
            raster: 954,
            rounded: 1,
            error: -4.86
        }
    ];

    function showData ( event, ui ) {
        var r = RASTER_TABLE[ Number( ui.value ) ];
        $( '#raster-sample-length' ).text( r.sampleLength );
        $( '#raster-hz' ).text( r.raster );
        $( '#raster-rounded' ).text( r.rounded );
        $( '#raster-error' ).text( r.error );
    }

    var $slider;
    var $dialog = $( '<div></div>' ).appendTo( 'body' ).load( 'raster.html', function () {
        $slider = $( '#raster-slider' ).slider({
            min : 0,
            max : RASTER_TABLE.length - 1,
            change : showData,
            slide : showData
        });
    }).dialog({
            title : 'Resolution',
            modal:true,
            autoOpen : false,
            buttons : [
                {
                    text:'Cancel',
                    click: function () {
                        $( this ).dialog( 'close' );
                    }
                },
                {
                    text: 'Set',
                    click : function () {
                        api.exe({
                            cmd: api.GET( 'SRA' ),
                            onSuccess : function () {
                                var oldVal = getRasterIndex( this.ajaxdata );
                                var newVal = $slider.slider( 'option', 'value' );
                                if ( oldVal !== newVal && confirm ( 'Saving raster clears peak hold data.' ) ) {
                                    api.exe({
                                        cmd : api.SET( 'SRA', RASTER_TABLE[ newVal ].rounded ),
                                        onSuccess : function () {
                                            $dialog.dialog( 'close' );
                                        },
                                        onError : function () {
                                            axellPopUp( 'Could not save the raster settings: ' + this.errorThrown );
                                        }
                                    });
                                } else {
                                    //just close it, no change
                                    $dialog.dialog( 'close' );
                                }
                            }
                        });
                    }
                }
            ]
        });

    function getRasterIndex ( val ) {
        val = Number( val );
        for ( var i = 0; i < RASTER_TABLE.length; i++ ) {
            if ( RASTER_TABLE[i].rounded === val ) {
                return i;
            }
        }
        console.error( 'Invalid value for SRA: ' + val );
        return -1;
    }
    function show () {
        api.exe({
            cmd: api.GET( 'SRA' ),
            onSuccess : function () {
                var i = getRasterIndex( this.ajaxdata );
                if ( i !== -1 ) {
                    $slider.slider( 'option', 'value', i );
                    $slider.trigger( 'slide' );
                    $dialog.dialog( 'open' );
                }
            }
        });
    }

    return {
        show : show
    }
});