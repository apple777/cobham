require([ './freqind.js', '/general/general.js', '/js/api.js', '/js/scheduler.js', '/js/convert.js', '/js/assign.js', '/js/util.js', '/js/lib/jquery.js', '/js/lib/underscore.js', '/js/lib/jquery-ui.js', '/js/lib/handlebars.js', '/js/handlebars-helpers.js', '/js/led.js' ],
function ( freqind, general, api, scheduler, convert, assign, util, $, _ ) {

    $(function () {
        //load the general panel
        general.init( '#general-panel-placeholder' );

        //rec display
        var $rec = $( '#rec' );
        api.exe({
            cmd: api.GET('REC'),
            onSuccess: function () {
                $rec.html("("+this.ajaxdata+")");
            }
        });

        //get PDL display

        scheduler.add( sec(3), {
            cmd: api.GET('OPC'),
            parse: 'PDL-downlink PDL-uplink',
            onSuccess:function(){
                for(var k in this.parsedResults){
                    if (this.parsedResults[k]==-100){
                        $("#"+k+'-value').text("-");
                    } else{
                        $("#"+k+'-value').text( this.parsedResults[ k ] );;
                    }
                }
            }
        });
    });

    $( '#basic-btn' ).button().click( function () {
        $( '.advanced' ).hide();
        return false;
    });

    $( '#advanced-btn' ).button().click( function () {
        $( '.advanced' ).show();
        return false;
    });

    //** load the target-specific part of the page (BSR or CSR) based on the model
    api.exe({
        cmd: api.GET( 'MDL' ),
        onSuccess: function () {
            if ( /CSR/i.test( this.ajaxdata ) ) {
                console.log("CSR matches");
                require( ['csr.js'], function ( csr ) {
                    csr.init( '#product-specific-placeholder' );
                });
            } else if ( /BSR/i.test( this.ajaxdata ) ) {
                require( ['bsr.js'], function ( bsr ) {
                    bsr.init( '#product-specific-placeholder' );
                });
            } else {
                axellPopUp( 'Invalid MDL: ' + this.ajaxdata );
                throw new Error( 'startup.mdl.1: Could not match the MDL with any regular expression: ' + this.ajaxdata );
            }
        }
    });

    scheduler.add( sec(8), {
        cmd: api.GET( 'RSP' ),
        parse: 'BAT COM_PSUP,COM_REFGEN,COM_DSPB CRC_DSPB DBS IOD,IOU PDL PSL PTM ' +
            'PW1_PSU PW2_PSU PW3_PSU,PW3_REFGEN,PW3_DSPB PW4_PSU RBT_DSPB TEM EX1,EX2,EX3,EX4 DOO MMT',
        assignElements:{
            type:'led',
            suffix:'-led'
        }
    });

    scheduler.add( sec(20), {
        cmd: 'GET IAT & GET LVM',
        parse:'IAT_DL IAT_UL LVM_DL LVM_UL',
        assignElements:{
            type:'text',
            suffix:'-value'
        }
    });

    scheduler.add( sec(15), {
        cmd: api.GET( 'TEL' ),
        parse:'TEL_CTRL TEL_PSUP TEL_MCPA_DL TEL_MCPA_UL TEL_RFCB TEL_DSPB',
        onSuccess: function () {
            //this one will be updated in general panel: $( '#TEL_CTRL-value').text( this.parsedResults.TEL_CTRL );
            $( '#PTM-led' ).attr( 'title', this.parsedResults[ 'TEL_PSUP' ] + ' C' );
            $( '#TEL_MCPA_DL-value').text( this.parsedResults[ 'TEL_MCPA_DL' ] );
            $( '#TEL_MCPA_UL-value').text( this.parsedResults[ 'TEL_MCPA_UL' ] );
            $( '#RBT_RFCB-led' ).attr( 'title', this.parsedResults[ 'TEL_RFCB' ] + ' C' );
            $( '#RBT_DSPB-led' ).attr( 'title', this.parsedResults[ 'TEL_DSPB' ] + ' C' );
        }
    });

    scheduler.add( sec(8), {
        cmd: api.GET( 'PSD' ),
        parse: 'PW1_PSU PW1_MCPA_DL PW1_MCPA_UL PW2_PSU PW2_MCPA_DL PW2_MCPA_UL PW3_PSU PW3_REFGEN PW3_MCPA_DL PW3_MCPA_UL PW3_RFCB PW3_DSPB PW4_PSU',
        assignElements:{
            type:'title',
            suffix:'-led'
        }
    });

    /**
     * Every few seconds poll the MDL to see if it has changed, then reload the page.
     * The MDL will be affected by the 'personality' command for example when a BSR product converts to a CSR product.
     */
    scheduler.add( sec(10), {
        cmd: api.GET( 'MDL' ),
        callOnDiff: true,
        __calledOnceBefore: false,
        onSuccess: function () {
            if ( this.__calledOnceBefore ) {
                axellPopUp( 'MDL changed. Reloading the page...' );
                window.location.reload();
            } else {
                this.__calledOnceBefore = true;
            }
        }
    });

    //repeatedly check and update Overall LEDs and expand erroneous rows
    (function () {
        function updateOR () {
            $( '.panel' ).each( function () {
                var $panel = $( this );
                var $overalLed = $panel.find( '.overall-led' );
                var $contents = $panel.children( '.contents' );
                //if this panel has an overall led at the top of it
                if ( $overalLed.length > 0 && $contents.length > 0 ) {
                    if ( $contents.find( '.led.red').length > 0 ) {
                        //if there's at least one red led in the contents
                        $overalLed.led( 'option', 'color', 'red' );
                    } else if ( $contents.find( '.led.green' ).length > 0 ) {
                        //if there is at least one green led in the contents
                        $overalLed.led( 'option', 'color', 'green' );
                    } else {
                        //otherwise leave the led grey
                        $overalLed.led( 'option', 'color', 'grey' );
                    }
                }
            });
            $( 'tr' ).each( function () {
                var $tr = $( this );
                //look for any red led in it
                if ( $tr.find( '.led.red' ).length > 0 ) {
                    $tr.show();
                }
            });
            //noinspection JSUnresolvedFunction
            setTimeout( updateOR, 2000 );
        }
        updateOR ();
    })();
});