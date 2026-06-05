define([ '/js/lib/jquery.js', '/js/api.js', '/js/led.js' ], function ( $, api ) {
    var USERACCESS = $.cookie('userAccess');
    function initialize () {
        var isiPad = navigator.userAgent.match(/iPad/i) != null;
        var delay=500, setDelayTime;
        if(!isiPad){
            $( '#header' ).hover(function(){
                setDelayTime = setTimeout(function(){
                    $('#header-link-list').css("display","block");
                }, delay);
            },function(){
                $('#header-link-list').css("display","none");
                clearTimeout(setDelayTime );
            });
        }else{
            $( '#header' ).click(function(){
                $('#header-link-list').css("display","block");
            });
            $(document).on('touchstart',function(event){
                var container = $('#header');
                if (!container.is(event.target) // if the target of the click isn't the container...
                    && container.has(event.target).length === 0) // ... nor a descendant of the container
                {
                    $('#header-link-list').css("display","none");
                }
            });
        }



        //setup the ajax activity led
        var $headerAjaxLed = $( '#header-ajax-led' );
        $( document ).ajaxStart( function () {
            $headerAjaxLed.led( 'option', 'color', 'blue' );
        }).ajaxStop( function () {
            $headerAjaxLed.led( 'option', 'color', 'grey' );
        }).ajaxError( function () {
            $headerAjaxLed.led( 'option', 'color', 'red' );
        });
        
        api.exe({
            cmd: getAttr( 'mdl' ),
            onSuccess: function ( o ) {
                sessionStorage.setItem( 'header-get-mdl', o.ajaxdata );
                $( '#header-text-model' ).text( o.ajaxdata );
                if($( 'title' ).text() ==="idRemote" || $( 'title' ).text() ==="MTDI" || $( 'title' ).text() ==="MSDH" || $( 'title' ).text() ==="DOBR"){
                    if(sessionStorage.getItem( 'header-get-mdl').indexOf("RRU") !=-1) {
                        $('#header-text-title').text("idRemote - "+ sessionStorage.getItem( 'tag' ));
                    }else if(sessionStorage.getItem( 'header-get-mdl').indexOf("MSDH") !=-1) {
                        $('#header-text-title').text("MSDH - "+ sessionStorage.getItem( 'tag' ));
                    }else if(sessionStorage.getItem( 'header-get-mdl').indexOf("MTDI") !=-1) {
                        $('#header-text-title').text("MTDI - "+ sessionStorage.getItem( 'tag' ));
                    }else if(sessionStorage.getItem( 'header-get-mdl').indexOf("DOBR") !=-1) {
                        $('#header-text-title').text("DOBR - "+ sessionStorage.getItem( 'tag' ));
                    }
                }else{
                    $( '#header-text-title' ).text( $( 'title' ).text() );
                }
                
                if((sessionStorage.getItem( 'header-get-mdl') === "MSDH-M" || sessionStorage.getItem( 'header-get-mdl') === "DOBR-M") && sessionStorage.getItem( 'username') === "sysadmin") {
                console.log("We do nothing here!");
                // We do nothing here!
                } else {
                    $('#comm').hide();
                    $('#snmp').hide();
                }


                if((sessionStorage.getItem( 'header-get-mdl') === "DOBR-M") || (sessionStorage.getItem( 'header-get-mdl') === "DOBR-S")) {
                    //console.log("We do nothing here!");
                    $('#comm').hide();
                    $('#dobr-comm').show();
                    $('#cluster').hide();
                    $("#zoom_button").hide();
                    $("#export_button").hide();                    
                }else{
                    $('#dobr-comm').hide();
                    $('#cluster').hide();
                    $("#zoom_button").show();
                    $("#export_button").show();                    
                }

                console.log(sessionStorage.getItem( 'header-get-mdl'))
                console.log(sessionStorage.getItem( 'header-get-mdl').indexOf("MTDI") != -1 ||sessionStorage.getItem( 'header-get-mdl').indexOf("MSDH") != -1)
                if(sessionStorage.getItem( 'header-get-mdl').indexOf("RRU") === -1 ){
                    $('#ext-header-menu').hide();
                }
                
                //if mdl exists in sessionstorage show it and then query it from the server and update it if neccesary
                if ( sessionStorage.getItem( 'header-get-mdl' ) != undefined || sessionStorage.getItem( 'header-get-mdl' ) != null) {
                    $( '#header-text-model' ).text( sessionStorage.getItem( 'header-get-mdl' ) );
                    if($( 'title' ).text() ==="Home"){
                        if(sessionStorage.getItem( 'header-get-mdl').indexOf("RRU") !=-1) {
                            $('#header-text-title').text("idRemote - "+ sessionStorage.getItem( 'tag' ));
                        }else if(sessionStorage.getItem( 'header-get-mdl').indexOf("MSDH") !=-1) {
                            $('#header-text-title').text("MSDH - "+ sessionStorage.getItem( 'tag' ));
                        }else if(sessionStorage.getItem( 'header-get-mdl').indexOf("MTDI") !=-1) {
                            $('#header-text-title').text("MTDI - "+ sessionStorage.getItem( 'tag' ));
                        }else if(sessionStorage.getItem( 'header-get-mdl').indexOf("DOBR") !=-1) {
                            $('#header-text-title').text("DOBR - "+ sessionStorage.getItem( 'tag' ));
                        }
                    }else{
                        $( '#header-text-title' ).text( $( 'title' ).text() );
                    }


                    if((sessionStorage.getItem( 'header-get-mdl') === "MSDH-M" || sessionStorage.getItem( 'header-get-mdl') === "DOBR-M") && sessionStorage.getItem( 'username') === "sysadmin") {
                        //console.log("We do nothing here!");
                    } else {
                        $('#comm').hide();
                        $('#snmp').hide();
                        $('#confBckUp').hide();
                    }

                    if(sessionStorage.getItem( 'header-get-mdl').indexOf("RRU") === -1){
                        $('#ext-header-menu').hide();
                    }

                    if((sessionStorage.getItem( 'header-get-mdl') === "DOBR-M") || (sessionStorage.getItem( 'header-get-mdl') === "DOBR-S") && sessionStorage.getItem( 'username') === "sysadmin") {
                        //console.log("We do nothing here!");
                        $('#comm').hide();
                        $('#dobr-comm').show();
                        $('#cluster').hide();
                        $('#ext-header-menu').show();
                    }else{
                        $('#dobr-comm').hide();
                        $('#cluster').hide();
                    }
                }
                
            }
        });
        
        //$( '#header').css( 'transition', 'height 0.3s ease-in-out' );

        if ( sessionStorage.getItem( 'header-get-swv' ) ) {
            $( '#header-text-version-number' ).text( sessionStorage.getItem( 'header-get-swv' ) );
        }
        api.exe({
            cmd: getAttr( 'swv' ),
            onSuccess: function ( o ) {
                sessionStorage.setItem( 'header-get-swv', o.ajaxdata );
                $( '#header-text-version-number' ).text( o.ajaxdata );
            }
        });
        if ( sessionStorage.getItem( 'username' ) ) {
            $( '#header-text-username' ).text( sessionStorage.getItem( 'username' ) );
        }
        /*
        axshCall("username",function(out,err){
            if(err){
                alert("Could not get the name of the current user. Please refresh the page. "+err);
            }else{
                sessionStorage.setItem( 'username', out );
                $( '#header-text-username' ).text( out );
            }
        });*/
        //if there is a help.txt file in the current directory, show the help button as well
        var helpPagePath = window.location.pathname + '/help.txt';
        $.get( helpPagePath , function () {
            var href = '/help/index.html?page=' + encodeURIComponent( helpPagePath );
            $( '#header-help-link' ).attr( 'href', href ).show();
        });

        if(sessionStorage.getItem( 'username') != "sysadmin")
        {
            $('#swUpdateLi').hide();
            $('#term').hide();
        }
    }

    $.ajax({
        url: '/header.html',
        dataType: 'html',
        cache: true,
        success: function ( data ) {
            $( 'body' ).prepend( data );
            api.exe({
                cmd: getAttr( 'mdl' ),
                onSuccess: function ( o ) {
                    if((o.ajaxdata ==="MSDH-M") || (o.ajaxdata ==="MSFA-M") || (o.ajaxdata ==="DOBR-M") || (o.ajaxdata ==="DOBR-S")) {
                        $.get('/target/header.html', function (data) {
                            $('#header-link-list').prepend(data);
                            if(sessionStorage.getItem( 'username') != "sysadmin")
                            {
                                 $('#wizards').hide();
                                 $('#rack_setup').hide();
                                 $('#operator_setup').hide();
                                 $('#bts_port_setup').hide();
                                 $('#zone_management').hide();
                                 $('#apoi_management').hide();
                                 $('#msdhr_management').hide();
                                 $('#quota_manage').hide();
                                 $('#device_quota_manage').hide();
                                 $('#swup_manager').hide();
                                 $('#sw_banks').hide();
                                 $('#config_backup').hide();
                            }
                            if(USERACCESS == "RO")
                            {
                                 $('#system_log').hide();
                                 $('#password').hide();
                            }
                        });

                        axshCall( "get prm", function ( out, err ) {
                           if ( err ) {
                               console.error( "Could not read prm attribute: " + err );
                               return;
                           }
                           if (out == 0)
                              $('#msdhr_management').hide();
                        });
                    }
                    if((o.ajaxdata.indexOf("MTDI") !=-1) || (o.ajaxdata.indexOf("RRU") !=-1)) {
                        $.get('/target/header.html', function (data) {
                            $('#header-link-list').append(data);
                            if(sessionStorage.getItem( 'username') != "sysadmin")
                            {
                                 $('#rfs').hide();
                                 $('#system_administrations').hide();
                            }
                        });
                    }
                }
            });
            initialize();
        }
    });
});
