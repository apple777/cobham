require([ '/js/api.js', '/js/convert.js', '/js/console.js', './draw.js', './spectrumdata.js', '/js/lib/underscore.js', '/js/lib/jquery.js' ],
function ( api, convert, console, draw, spectrumdata, _, $ ) {

    var $spectrumAnalyzer = $( '#spectrum-analyzer' );
    var $canvasContainer = $( '#canvas-container' );

    draw.init( $spectrumAnalyzer[0] );

    var rid = '';
    api.exe({
        cmd: api.GET( 'RID' ),
        onSuccess : function () {
            rid = this.ajaxdata || '';
        }
    });

    $( window ).resize( function () {
        $spectrumAnalyzer.attr( 'width', $canvasContainer.width() );
        $spectrumAnalyzer.attr( 'height', $canvasContainer.height() );
        draw.resize();
    });

    $( window ).resize();

    $( '#zoom-in-btn' ).button().click( function () {
        spectrumdata.getFrequencyRange().zoom( +50 );
    });

    $( '#zoom-out-btn' ).button().click( function () {
        spectrumdata.getFrequencyRange().zoom( -50 );
    });

    $( '#reset-zoom-btn' ).button().click( function () {
        spectrumdata.getFrequencyRange().reset();
    });

    $( '#go-right-btn' ).button().click( function () {
        spectrumdata.getFrequencyRange().move( +10 );
    });

    $( '#go-left-btn' ).button().click( function () {
        spectrumdata.getFrequencyRange().move( -10 );
    });

    $( '#show-uplink-btn').button().click( function () {
        spectrumdata.setLink( 'UL' );
    });

    $( '#show-downlink-btn' ).button().click( function () {
        spectrumdata.setLink( 'DL' );
    });

    $( '#save-btn' ).button().click( function () {
        draw.save( rid );
    });

    /**
     * Gets a number with adjustable prompt, min and max checking
     * @param caption {Number} caption
     * @param curr {Number} current value
     * @param min {Number} minimum possible value
     * @param max {Number} maximum possible value
     * @returns {Number} Returns a positive number if successful or null if it fails (and it shows the alert explaining the error)
     */
    var $dialog;
    var valueStored = false;
    function getNumber ( caption, curr, min, max, freqRange ) {
        //var ret = prompt( caption + ' [' + (min/1000000).toFixed(6) + ' - ' + (max/1000000).toFixed(6) + '] MHz', (curr/1000000).toFixed(6) );
        var title =  caption + ' [' + (min/1000000).toFixed(6) + ' - ' + (max/1000000).toFixed(6) + '] MHz';

        var txtBox = "<input type = 'text' id = 'curr' class='text ui-widget-content ui-corner-all' value=" + (curr/1000000).toFixed(6) + ">";
        $dialog = $( '<div>'+title+'<br /><br />'+txtBox+'</div>' ).appendTo( 'body' ).dialog({
                title : '',
                modal:true,
                autoOpen : true,
                buttons : [
                    {
                        text:'Cancel',
                        click: function () {
                            $( this ).dialog( 'close' );
                        }
                    },
                    {
                        text: 'OK',
                        click : function () {
                            var ret=$('#curr.text.ui-widget-content.ui-corner-all').val();
                            console.log("current value after ok "+ $('#curr').val());

                            //if ( ret) {
                                ret = Number( ret )*1000000;
                                if ( _.isFinite( ret ) ) {
                                    if ( min <= ret && ret <= max ) {
                                        console.log("before switch");
                                        switch(caption){
                                            case 'Start':
                                                freqRange.setStart(ret);
                                                break;
                                            case 'Stop':
                                                freqRange.setStop(ret);
                                                break;
                                            case 'Center':
                                                freqRange.setCenter(ret);
                                                break;
                                            case 'Span':
                                                freqRange.setSpan(ret);
                                                break;
                                            default:
                                                console.log("default");
                                        }
                                    } else {
                                        axellPopUp( 'Out of range' );
                                    }
                                } else {
                                    axellPopUp( 'Could not convert to number' );
                                }
                            $( this ).dialog('close');
                        }
                    }
                ],
            close:function(){
                $dialog.remove();
            }
        });
    }

    $( '#edit-start-btn' ).button().click( function () {
        var freqRange = spectrumdata.getFrequencyRange();
        getNumber( 'Start', freqRange.getStart(), freqRange.getMin(), freqRange.getMax(),freqRange );
    });

    $( '#edit-stop-btn' ).button().click( function () {
        var freqRange = spectrumdata.getFrequencyRange();
        getNumber( 'Stop', freqRange.getStop(), freqRange.getMin(), freqRange.getMax(), freqRange );
    });

    $( '#edit-center-btn' ).button().click( function () {
        var freqRange = spectrumdata.getFrequencyRange();
        getNumber( 'Center', freqRange.getCenter(), freqRange.getMin(), freqRange.getMax(), freqRange );
    });

    $( '#edit-span-btn' ).button().click( function () {
        var freqRange = spectrumdata.getFrequencyRange();
        getNumber( 'Span', freqRange.getSpan(), freqRange.getMinSpan(), freqRange.getMaxSpan(), freqRange );
    });

    $( '#clear-peak-hold-btn' ).button().click( function () {
        if ( confirm( 'Are you sure you want to clear all peak hold data?') ) {
            api.exe({
                cmd: api.ACT( 'CPH' ),
                onError : function () {
                    axellPopUp( 'Could not clear peak hold data: ' + this.errorThrown );
                }
            })
        }
    });

    $( '#raster-btn' ).button().click( function () {
        require( ['./raster.js'], function ( raster ) {
            raster.show();
        });
    });

    $( '#save-peaks-btn' ).button().click( function () {
        spectrumdata.savePeaks();
    });



    //canvas context
    $spectrumAnalyzer.mousemove( function ( e ) {
        //noinspection JSUnresolvedVariable
        draw.setCursor( e.pageX - this.offsetLeft );
    }).mouseout( function () {
        draw.setCursor();
    });

});
