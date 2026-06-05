require([ '/js/api.js', '/js/scheduler.js', '/js/gauge.js', '/js/loadAxsh.js' ], function ( api, scheduler ) {
    var USERNAME = $.cookie('username');

    /**
     * This code runs when the DOM is ready
     */
    
    /***
     * This function is used to show technician more options.
     * keyCode: ALT+SHIFT+T
     */
    var map = {18: false, 16: false, 84: false};
    function techPermissions()
    {
        $(document).keydown(function(e) {
            if (e.keyCode in map) {
                map[e.keyCode] = true;
                if (map[18] && map[16] && map[84]) {
                    axellInput("");
                    map = {18: false, 16: false, 84: false};
                }
            }
        }).keyup(function(e) {
            if (e.keyCode in map) {
                map[e.keyCode] = false;
            }
        });
    }

    function getMfr(){
        axshCall( "get mfr", function ( out, err ) {
            if ( err ) {
                console.error( "Could not read MFR attribute: " + err );
                return;
            }
            var mfr = out.match( /(\S*) (\S*) (\S*) (\S*)/ );
            if (mfr[1]=="" || mfr[2]=="" || mfr[3]=="" || mfr[4]==""){
               $( "#hw_informaton" ).hide();
            }else{
               $( "#config_mfr_revision" ).text( mfr[1] );
               $( "#config_mfr_model" ).text( mfr[2] );
               $( "#config_mfr_serial" ).text( mfr[3] );
               $( "#config_mfr_date" ).text( mfr[4] );
            }
        });
    }

    axshCall( "get prm", function ( out, err ) {
      if ( err ) {
          console.error( "Could not read prm attribute: " + err );
          return;
      }        
        switch(out) {
            case '0':
                $("#config_prm_type").text("-");
                break;
            case '1':
                $("#config_prm_type").text("Primary");
                break;                
            case '2':
                $("#config_prm_type").text("Secondary");
                break;
            case '3':
                $("#config_prm_type").text("Both");
                break;
            default:
                $("#config_prm_type").text("Primary");
        }
    });

    function axellInput(message_string) {
      // Dialog here
      $('<form>'+message_string+'<input type="text" style="z-index:10000" name="name" autofocus><br></form>').dialog({
          title: "Technician Password ",
          modal: true,
          buttons: {
              'OK': function () {
                  var name = $('input[name="name"]').val();
                    if(name == "deko"){
                          $(".toggle-keydown").show();
                          $(this).dialog('close');
                          //alert("ok");
                            setInterval(function(){ 
                                getMfr();
                            },3000);
                    }else{
                          $(this).dialog('close');
                          //alert("not ok");
                    }
              },
              'Cancel': function () {
                  $(this).dialog('close');
              }
          }
      });
    };

    $( document ).ready( function () {
        // -r with param - change revision to sequencer (RAM)
        $('#set').click(function(){
            api.exe({
                cmd: "write_mfr_data -d -r "+$("select#sequencer").val(),
                dataType: 'text',
                async: false,
                onSuccess: function (o)
                {
                    api.exe({
                        cmd: "read_mfr_data",
                        dataType: 'text',
                        async: false,
                        onSuccess: function (o)
                        {

                        } 
                    });
                }
            });
        });
        // -f without param - save to flash (saved after reboot)
        $('#save').click(function(){
            api.exe({
                cmd: "write_mfr_data -d -f",
                dataType: 'text',
                async: false,
                onSuccess: function (o)
                {

                }
            });
        });

        if(USERNAME === 'sysadmin') {
            techPermissions();
        }
        /*var $cpuGauge = $( '#cpu-gauge').gauge({
            min:0,
            max:30,
            title:'cpu'
        });
        var $memGauge = $( '#mem-gauge').gauge({
            title:'mem'
        });
        var $sysDiskGauge = $( '#sys-disk-gauge').gauge({
            title:'sys dsk'
        });
        var $fwDiskGauge = $( '#fw-disk-gauge').gauge({
            title:'fw dsk'
        });
        var $tmpDiskGauge = $( '#tmp-disk-gauge').gauge({
            title:'tmp dsk'
        });
        var $spdGauge = $( '#spd-gauge').gauge({
            min:0,
            max:sec( 10 ),
            title:'net ms'
        });

        scheduler.add(sec( 1 ), {
            cmd:'get spc',
            parse:'loadNow:n load5min:n load15min:n mem:n sysDisk:n fwDisk:n tmpDisk:n ...',
            onSuccess: function ( o ) {
                $cpuGauge.gauge( 'option', 'value', o.parsedResults[ 'loadNow' ] );
                $memGauge.gauge( 'option', 'value', o.parsedResults[ 'mem' ] );
                $sysDiskGauge.gauge( 'option', 'value', o.parsedResults[ 'sysDisk' ] );
                $fwDiskGauge.gauge( 'option', 'value', o.parsedResults[ 'fwDisk' ] );
                $tmpDiskGauge.gauge( 'option', 'value', o.parsedResults[ 'tmpDisk' ] );

                $spdGauge.gauge( 'option', 'value', o.executionTime );
            }
        });*/

        $( '#config_model' ).loadAxsh( 'get mdl' );

        $( '#config_tag' ).loadAxsh( 'get tag' );
        //$( '#config_id' ).loadAxsh( 'get rid' );

        axshCall( "get sis", function ( out, err ) {
            if ( err ) {
                console.error( "Could not read SIS attribute: " + err );
                return;
            }
            var sis = out.match( /"(.*?)" (\S*) (\S*) (\S*) (\S*) (\S*) (\S*) (\S*) (\S*) "(.*?)"/ );
            $( "#config_bootversion" ).text( sis[1] );
            $( "#config_ctrlserial" ).text( sis[2] );
            //$( "#config_hwversion" ).text( sis[3] );
            $( "#config_serial" ).text( sis[4] );
            //$( "#config_artno" ).text( sis[5] );
        });
        
        axshCall( "get mfr", function ( out, err ) {
            if ( err ) {
                console.error( "Could not read MFR attribute: " + err );
                return;
            }
            var mfr = out.match( /(\S*) (\S*) (\S*) (\S*)/ );
            if (mfr[1]=="" || mfr[2]=="" || mfr[3]=="" || mfr[4]==""){
               $( "#hw_informaton" ).hide();
            }else{
               $( "#config_mfr_revision" ).text( mfr[1] );
               $( "#config_mfr_model" ).text( mfr[2] );
               $( "#config_mfr_serial" ).text( mfr[3] );
               $( "#config_mfr_date" ).text( mfr[4] );
            }
        });

        api.exe({
            cmd: getAttr( 'mdl' ),
            onSuccess: function (o) {
                 if(o.ajaxdata.indexOf("DOBR") != -1){
                    api.exe({
                        cmd: "dobr_version",
                        dataType: 'text',
                        async: false,
                        onSuccess: function (o)
                        {
                            swv=o.ajaxdata.match(/"(.*?)" "(.*?)" "(.*?)"/);
                            $( "#config_targetversion" ).text( swv[3] );
                            $( "#config_commonversion" ).text( swv[2] );
                            $( "#config_systemversion" ).text( swv[1] );
                        }
                    })
                 }else{
                    axshCall("get swv", function ( out, err ) {
                        if ( err ) {
                            console.error( "Could not read software version (SWV): " + err );
                            return;
                        }
                        swv=out.match(/"(.*?)" "(.*?)" "(.*?)"/);
                        //note: swv[0] contains the whole string. it's "group zero"
                        $( "#config_targetversion" ).text( swv[3] );
                        $( "#config_commonversion" ).text( swv[2] );
                        $( "#config_systemversion" ).text( swv[1] );
                    });
                 }
            }
        });

        if((sessionStorage.getItem( 'header-get-mdl') == "DOBR-M") || (sessionStorage.getItem( 'header-get-mdl') == "DOBR-S")){
            $("tr.redundancy").hide();
        }else{
            $("tr.redundancy").show();
        }

    });
});
