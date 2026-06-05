//**runs when the page is ready
define([ '/js/lib/jquery.js', '/js/api.js', '/js/scheduler.js', '/js/console.js','/js/util.js','/js/lib/jquery_cookie.js'],
function ( $, api, scheduler, console,util ) {
    var USERNAME = $.cookie('username');
    var USERACCESS = $.cookie('userAccess');

    function init ( insertionPoint ) {
        $.get( '/general/general.html', function ( html ) {
            $( insertionPoint ).html( html );
            startUpdating();
        });
    }

    function logEvent(atrr, text){
      if((sessionStorage.getItem('header-get-mdl') == "MSDH-M") || (sessionStorage.getItem('header-get-mdl') == "MSDH-S")){
		   var event_cmd="alarms eventoper " + $.cookie('currentOperator') + " " + atrr + " " + text;
		   api.exe({
			   cmd: event_cmd,
			   async: false,
			   onSuccess: function (EOC) {
			   }
		   })
      }
    }

    function startUpdating () {
        //cache the reference to the lock tag button
        var $tagVal = $( '#tag-val' );
        var $locTagVal = $( '#loc-tag-val' );
        var $ltgBtn = $( '#lock-tag-btn' );
        var $editTagBtn = $( '#edit-tag-btn' );
        var $editLocTagBtn = $( '#edit-loc-tag-btn' );
        if(USERACCESS == "RO"){
           $ltgBtn.hide();
        }else{
           $ltgBtn.button({
               icons: { primary: "ui-icon-locked" },
               text: false,
               disabled: true
           });
        }
        if(USERACCESS == "RO"){
           $editTagBtn.hide();
        }else{
           $editTagBtn.button({
               icons: { primary: "ui-icon-pencil" },
               text: false,
               disabled: true
           });
        }
        if(USERNAME !='sysadmin'){
            $editLocTagBtn.hide();
        }else{
            $editLocTagBtn.button({
                icons: { primary: "ui-icon-pencil" },
                text: false
            });
        }

        $ltgBtn.change(function () {
            var desiredLtg;
            if ( $ltgBtn.prop( 'checked' ) ) {
                //user has checked the checkbox it means the tag lock should be set
                desiredLtg = '1';
            } else {
                // todo: Overriding Javascript confirm() while preserving the callback
                axellConfirm("info","Notice","Unlock editing TAG?",function(){
                    api.exe({
                        cmd: 'set ltg ' + 0, // cmd unlock
                        onAlways: function () {
                            api.exe( updateLtg );
                        }
                    });
                },function () {
                    $ltgBtn.prop( 'checked', true ).button( 'refresh' );
                    api.exe({
                        cmd: 'set ltg ' + 1, // cmd lock
                        onAlways: function () {
                            api.exe( updateLtg );
                        }
                    });
                })
                desiredLtg = '0';
            }

            //now send the command to set the lock status
            api.exe({
                cmd: 'set ltg ' + desiredLtg,
                __desiredLtg: desiredLtg,
                onBefore: function () {
                    $ltgBtn.button( 'disable' );
                },
                onAlways: function () {
                    $ltgBtn.button( 'enable' );
                    api.exe( updateLtg );
                }
            });
        });

        //** event handler for TAG lock button
        $editTagBtn.click( function () {
            if(!$(this).hasClass('disabled')) {
                var oldTag = $tagVal.text();
                $('#dialogdivEditTag').remove();
                var newDiv = $(document.createElement('div'));
                newDiv.attr("id", "dialogdivEditTag");
                var html = "";
                html += "<span></span><input id='editTag' value='"+oldTag+"'/>"
                newDiv.html(html);
                newDiv.dialog({modal: true,title: "Edit tag",buttons: {
                    Ok: function () {
                        newTag = $('input[id="editTag"]').val();
                        //did the user press cancel on the prompt dialogue?
                        if ( newTag === null ) {
                            return;
                        }
                        //trim the tag
                        if ( newTag === oldTag ) {
                            console.log( 'Same tag. Nothing to do.' );
                            return;
                        }
                        if (!util.validateTag( newTag )) {
                            axellPopUp( 'Please enter a valid tag [AZaz09-_ ]' );
                            return;
                        }
                        //ok now the checks are passed
                        api.exe(
                            {
                                cmd: 'set tag "' + newTag + '"',
                                onSuccess: function (o) {
                                    newDiv.dialog("close");
                                    $tagVal.text(newTag);
                                },
                                onError: function (o) {
                                    newDiv.dialog("close");
                                    axellPopUp(o.errorThrown);
                                }
                            });
                    },
                    Cancel: function () {
                        $(this).dialog("close");
                    }
                }});
            }
        });

        //** event handler for TAG lock button
        $editLocTagBtn.click( function () {
            if(!$(this).hasClass('disabled')) {
                var oldTag = $locTagVal.text();
                $('#dialogdivLocEditTag').remove();
                var newDiv = $(document.createElement('div'));
                newDiv.attr("id", "dialogdivLocEditTag");
                var html = "";
                html += "<span></span><input id='editLocTag' value='"+oldTag+"'/>"
                newDiv.html(html);
                newDiv.dialog({modal: true,title: "Edit tag",buttons: {
                    Ok: function () {
                        newTag = $('input[id="editLocTag"]').val();
                        //did the user press cancel on the prompt dialogue?
                        if ( newTag === null ) {
                            return;
                        }
                        //trim the tag
                        if ( newTag === oldTag ) {
                            console.log( 'Same tag. Nothing to do.' );
                            return;
                        }
                        if (!util.validateTag( newTag )) {
                            axellPopUp( 'Please enter a valid tag [AZaz09-_ ]' );
                            return;
                        }
                        //ok now the checks are passed
                        api.exe(
                            {
                                cmd: 'set loc "' + newTag + '"',
                                onSuccess: function (o) {
                                    newDiv.dialog("close");
                                    $locTagVal.text(newTag);
                                },
                                onError: function (o) {
                                    newDiv.dialog("close");
                                    axellPopUp(o.errorThrown);
                                }
                            });
                    },
                    Cancel: function () {
                        $(this).dialog("close");
                    }
                }});
            }
        });

        var updateLtg = scheduler.add( sec( 20 ), {
            cmd: 'get ltg',
            callOnDiff:true,
            onSuccess: function () {
                $ltgBtn.button( 'enable' );
                switch ( this.ajaxdata ) {
                    case '0':
                        //tag is unlocked
                        $ltgBtn.button( "option", "icons", { primary: 'ui-icon-unlocked'} )
                            .prop( 'checked', false ).button( 'refresh' );
                        $editTagBtn.button( 'enable' );
                        break;
                    case '1':
                        //tag is locked
                        $ltgBtn.button( "option", "icons", { primary: 'ui-icon-locked'} )
                            .prop( 'checked', true ).button( 'refresh' );
                        $editTagBtn.button( 'disable' );
                        break;
                    default:
                        break;
                }

            }
        });

        scheduler.add( sec( 20 ), {
            cmd: 'get tag',
            callOnDiff:true,
            onSuccess: function () {
                $tagVal.text( this.ajaxdata );
            }
        });

        scheduler.add( sec( 20 ), {
            cmd: 'get loc',
            callOnDiff:true,
            onSuccess: function () {
                $locTagVal.text( this.ajaxdata );
            }
        });


        var cardType = "";
        api.exe({
          cmd: 'get mdl',
          dataType: 'text',
          async: false,
          onSuccess: function () {
             cardType = this.ajaxdata;
          }
        })
        if (cardType.indexOf("DOBR") != -1)
        {
            $("#doo").remove();
            scheduler.add( sec( 15 ), {
                cmd: 'measurements get tem',
                callOnDiff:true,
                __target: $( '#system-temp-val' ),
                onSuccess: function () {
                    if( this.ajaxdata < 0 || this.ajaxdata > 130 ){
                        this.__target.text("0");
                    }else{
                        this.__target.text(this.ajaxdata);
                    }
                }
            });
        }
        else
        {
            scheduler.add( sec( 15 ), {
                cmd: 'measurements get tem',
                dataType: 'text',
                async: false,
                __target: $( '#system-temp-val' ),
                onSuccess: function () {
                    if( this.ajaxdata < 0 || this.ajaxdata > 130 ){
                        this.__target.text("0");
                    }else{
                        this.__target.text(this.ajaxdata);
                    }
                }
            });
        }


        scheduler.add( sec( 30 ), {
            cmd : 'get mdl',
            parse : 'mdl',
            callOnDiff : true,
            assignElements : {
                type : 'text',
                suffix : '-text'
            }
        });
        
        api.exe({
            cmd: 'get_serial',
            onAlways: function (o) {
                $('#serial-number').text(o.ajaxdata);
            }
        });

        if(USERNAME != 'sysadmin'){
            $("select#mode").attr("disabled", true); 
            $("select#redundancy").attr("disabled", true); 
            $("select#fiber_redundancy").attr("disabled", true); 
        }

        if((sessionStorage.getItem( 'header-get-mdl') == "DOBR-M") || (sessionStorage.getItem( 'header-get-mdl') == "DOBR-S")){
            $(".redundancy").hide();
        }else{
            $(".redundancy").show();
        }

        if(sessionStorage.getItem( 'header-get-mdl') != "MTDI-S"){
            $(".fiber_redundancy").hide();
        }else{
            $(".fiber_redundancy").show();
        }

        if(sessionStorage.getItem( 'header-get-mdl') != "MSDH-M"){
            $(".sync_port").hide();
            $(".mng_port").hide();
            $(".redundancy_mode").hide();
            $(".redundancy_interface").hide();
            $(".redundancy_primary_ip").hide();
            $(".redundancy_secondary_ip").hide();
        }else{
            $(".sync_port").show();
            $(".mng_port").show();
            $(".redundancy_mode").show();
            $(".redundancy_interface").hide();
            $(".redundancy_primary_ip").show();
            $(".redundancy_secondary_ip").show();
        }

        if((sessionStorage.getItem( 'header-get-mdl') == "MSDH-M") || (sessionStorage.getItem( 'header-get-mdl') == "MSDH-S")){
            $(".simple_mode").hide();
            $(".mode").show();
        }else{
            $(".simple_mode").show();
            $(".mode").hide();
            $("select#mode").attr("disabled", true); 
        }

        if((sessionStorage.getItem( 'header-get-mdl') == "MSDH-M") || (sessionStorage.getItem( 'header-get-mdl') == "MSDH-S") || (sessionStorage.getItem( 'header-get-mdl') == "MTDI-S")){
            $("select#redundancy > option[value$='3']").hide();   
        }else{
            $("select#redundancy > option[value$='3']").show();            
        }

        $('#mode').change(function () {
            var modeval = $("select#mode").val();
            axellConfirm("info","Notice","System will reboot after this change.\nAfter please do Factory reset",function(){
                logEvent("MOD", "Set mode: "+modeval);
                api.exe({
                    cmd: "set_msdh_mode "+modeval,
                    dataType: 'text',
                    async: false,
                    onSuccess: function (o)
                    {
                    }
                });
            },function () {
                $("select#mode").val(cardType);
                //$("select#mode").val(out);
            })
        });

        if(cardType == 'MSDH-S'){
            $("select#mode").val('slave')
        }else{
            $("select#mode").val('master')
        }

        $('#redundancy').change(function () {
            axellConfirm("alert","Warning","Are you sure you want to change setting?",function(){
                var redundancyval = $("select#redundancy").val();
                // if redundancy not both
                if ((redundancyval == 0) || (redundancyval == 1) || (redundancyval == 2)){
                    axshCall( "set red active 1" ,function(out,err){});
                }
                logEvent("RED", "Set redundancy: "+redundancyval);
                axshCall( "set prm "+redundancyval, function ( out, err ) {
                  if ( err ) {
                      console.error( "Could not read prm attribute: " + err );
                      return;
                  }
                  api.exe({
                     cmd: "kill_smd",
                     dataType: 'text',
                     async: false,
                     onSuccess: function (o) {
                     }
                  })                
                  setTimeout(function(){location.reload();},2000)                  
                });                
            },function () {
                setTimeout(function(){location.reload();},2000)                  
            })
        });

        $('#fiber_redundancy').change(function () {
            axellConfirm("alert","Warning","Are you sure you want to change setting?",function(){
                var redundancyval = $("select#fiber_redundancy").val();
                var command = "fiber_redundancy set " + redundancyval;
                api.exe({
                     cmd: command,
                     dataType: 'text',
                     async: false,
                     onSuccess: function (o) {
                        setTimeout(function(){location.reload();},2000)                  
                     }
                });                
            },function () {
                setTimeout(function(){location.reload();},2000)                  
            })
        });

        $('#sync_port_set').button({
            icons: { primary: "ui-icon-pencil" },
            text: false
        });
        $('#sync_port_clear').button({
            icons: { primary: "ui-icon-close" },
            text: false
        });
        $('#sync_port').change(function () {
            if($("select#sync_port").val() != 0){
               var str = $('#span_sync_port').text();
               if(str.length > 0)
                  str += ",";
               str += $("select#sync_port").val();
               $('#span_sync_port').text(str);
            }
        });
        $('#sync_port_set').click(function() {
            $.blockUI({ 
               fadeIn: 1000, 
               timeout: 30000, 
               onBlock: function() { 
                 api.exe({
                     cmd: "sync_ports set " + $('#span_sync_port').text(),
                     dataType: 'text',
                     async: false,
                     onSuccess: function (o) {
                        setTimeout(function(){location.reload();},2000)                  
                        $.unblockUI();
                     }
                 });                
               } 
            }) 
        });
        $('#sync_port_clear').click(function() {
            $('#span_sync_port').text("");
            $("select#sync_port").val(0);
        });

        $('#mng_port_set').button({
            icons: { primary: "ui-icon-pencil" },
            text: false
        });
        $('#mng_port_clear').button({
            icons: { primary: "ui-icon-close" },
            text: false
        });
        $('#mng_port').change(function () {
            if($("select#mng_port").val() != 0){
               var str = $('#span_mng_port').text();
               if(str.length > 0)
                  str += ",";
               str += $("select#mng_port").val();
               $('#span_mng_port').text(str);
            }
        });
        $('#mng_port_set').click(function() {
            $.blockUI({ 
               fadeIn: 1000, 
               timeout: 30000, 
               onBlock: function() { 
                 api.exe({
                     cmd: "mng_ports set " + $('#span_mng_port').text(),
                     dataType: 'text',
                     async: false,
                     onSuccess: function (o) {
                        setTimeout(function(){location.reload();},2000)                  
                        $.unblockUI();
                     }
                 });                
               } 
            }) 
        });
        $('#mng_port_clear').click(function() {
            $('#span_mng_port').text("");
            $("select#mng_port").val(0);
        });

        $('#edit-prim-ip-btn').button({
            icons: { primary: "ui-icon-pencil" },
            text: false
        });
        $('#edit-sec-ip-btn').button({
            icons: { primary: "ui-icon-pencil" },
            text: false
        });
        //** event handler for red ip button
        $('#edit-prim-ip-btn').click( function () {
            if(!$(this).hasClass('disabled')) {
                var oldIp = $('#prim-ip-val').text();
                $('#dialogdivPrimIpEdit').remove();
                var newDiv = $(document.createElement('div'));
                newDiv.attr("id", "dialogdivPrimIpEdit");
                var html = "";
                html += "<span></span><input id='editPrimIp' value='"+oldIp+"'/>"
                newDiv.html(html);
                newDiv.dialog({modal: true,title: "Edit Ip",buttons: {
                    Ok: function () {
                        var newIp = $('input[id="editPrimIp"]').val();
                        //did the user press cancel on the prompt dialogue?
                        if ( newIp === null ) {
                            return;
                        }
                        //trim the tag
                        /*if ( newIp === oldIp ) {
                            console.log( 'Same ip. Nothing to do.' );
                            return;
                        }
                        if (!util.validateTag( newIp )) {
                            axellPopUp( 'Please enter a valid ip [AZaz09-_ ]' );
                            return;
                        }*/
                        //ok now the checks are passed
                        axshCall( "set redPrimaryIp "+newIp, function ( out, err ) {
                           if ( err ) {
                               console.error( "Could not set redPrimaryIp attribute: " + err );
                               return;
                           }
                           newDiv.dialog("close");
                           $('#prim-ip-val').text(newIp);
                        });
                    },
                    Cancel: function () {
                        $(this).dialog("close");
                    }
                }});
            }
        });
        $('#edit-sec-ip-btn').click( function () {
            if(!$(this).hasClass('disabled')) {
                var oldIp = $('#sec-ip-val').text();
                $('#dialogdivSecIpEdit').remove();
                var newDiv = $(document.createElement('div'));
                newDiv.attr("id", "dialogdivSecIpEdit");
                var html = "";
                html += "<span></span><input id='editSecIp' value='"+oldIp+"'/>"
                newDiv.html(html);
                newDiv.dialog({modal: true,title: "Edit Ip",buttons: {
                    Ok: function () {
                        var newIp = $('input[id="editSecIp"]').val();
                        //did the user press cancel on the prompt dialogue?
                        if ( newIp === null ) {
                            return;
                        }
                        //trim the tag
                        /*if ( newIp === oldIp ) {
                            console.log( 'Same ip. Nothing to do.' );
                            return;
                        }
                        if (!util.validateTag( newIp )) {
                            axellPopUp( 'Please enter a valid ip [AZaz09-_ ]' );
                            return;
                        }*/
                        //ok now the checks are passed
                        axshCall( "set redSecondaryIp "+newIp, function ( out, err ) {
                           if ( err ) {
                               console.error( "Could not set redSecondaryIp attribute: " + err );
                               return;
                           }
                           newDiv.dialog("close");
                           $('#sec-ip-val').text(newIp);
                        });
                    },
                    Cancel: function () {
                        $(this).dialog("close");
                    }
                }});
            }
        });


        axshCall( "get prm", function ( out, err ) {
            if ( err ) {
                console.error( "Could not read prm attribute: " + err );
                return;
            }        

            // set power button for gps mode
            if((sessionStorage.getItem( 'header-get-mdl') === "MSDH-M") && (out != 0)){
                // append gps option on/off 
                $('.gps').hide();
            }else{
                $('.gps').hide();
            } 
            // set active mode
            if(((sessionStorage.getItem( 'header-get-mdl') === "RRU-S") || (sessionStorage.getItem( 'header-get-mdl') === "RRU40-S")) && (out == 3)){
                // append red active option Primary/Secondary
                $('#active').show();
                $('#generalstatus-table').width(410)
                $('#ext').width(570)
            }else{
                $('#active').hide();
                $('#generalstatus-table').width(370)
                $('#ext').width(610)
            }
            $("select#redundancy").val(out);

            if(sessionStorage.getItem( 'header-get-mdl') == "MSDH-M"){
               if (($("select#redundancy").val() != 1) && ($("select#redundancy").val() != 2)){
                   $(".sync_port").hide();
                   $(".mng_port").hide();
               }else{
                   $(".sync_port").show();
                   $(".mng_port").show();
               }
               if (($("select#redundancy").val() != 11) && ($("select#redundancy").val() != 22)){
                   $(".redundancy_mode").hide();
                   $(".redundancy_interface").hide();
                   $(".redundancy_primary_ip").hide();
                   $(".redundancy_secondary_ip").hide();
               }else{
                   $(".redundancy_mode").show();
                   $(".redundancy_interface").hide();
                   $(".redundancy_primary_ip").show();
                   $(".redundancy_secondary_ip").show();
               }
            }
        });

        axshCall( "get red active", function ( out, err ) {
            if ( err ) {
                console.error( "Could not read red active attribute: " + err );
                return;
            } 
            $("select#red_active").val(out);
        });

        if(sessionStorage.getItem( 'header-get-mdl') == "MSDH-M"){
           axshCall( "get redMode", function ( out, err ) {
               if ( err ) {
                   console.error( "Could not read redMode attribute: " + err );
                   return;
               } 
               $("select#redundancy_mode").val(out);
           });
           axshCall( "get redInterFace", function ( out, err ) {
               if ( err ) {
                   console.error( "Could not read redInterFace attribute: " + err );
                   return;
               } 
               $("select#redundancy_interface").val(out);
           });
           axshCall( "get redPrimaryIp", function ( out, err ) {
               if ( err ) {
                   console.error( "Could not read redPrimaryIp attribute: " + err );
                   return;
               } 
               $('#prim-ip-val').text(out);
           });
           axshCall( "get redSecondaryIp", function ( out, err ) {
               if ( err ) {
                   console.error( "Could not read redSecondaryIp attribute: " + err );
                   return;
               } 
               $('#sec-ip-val').text(out);
           });
        }

        api.exe({
            cmd: "fiber_redundancy get",
            dataType: 'text',
            async: false,
            onSuccess: function (o) {
               $("select#fiber_redundancy").val(o.ajaxdata);
            }
        });                

        api.exe({
            cmd: "sync_ports get",
            dataType: 'text',
            async: false,
            onSuccess: function (o) {
               $('#span_sync_port').text(o.ajaxdata);
            }
        });                
        api.exe({
            cmd: "mng_ports get",
            dataType: 'text',
            async: false,
            onSuccess: function (o) {
               $('#span_mng_port').text(o.ajaxdata);
            }
        });                

        $('select#red_active').change(function () {
            axellConfirm("info","Notice","Are you sure you want to change setting?",function(){
                var activeval = $("select#red_active").val();
                axshCall( "set red active "+activeval, function ( out, err ) {
                  if ( err ) {
                      console.error( "Could not read red attribute: " + err );
                      return;
                  }
                  //setTimeout(function(){location.reload();},2000)                  
                });
            },function () {
                //else if not change 
            })
        });

        $('select#redundancy_mode').change(function () {
            axellConfirm("info","Notice","Are you sure you want to change setting?",function(){
                var activeval = $("select#redundancy_mode").val();
                axshCall( "set redMode "+activeval, function ( out, err ) {
                  if ( err ) {
                      console.error( "Could not read red attribute: " + err );
                      return;
                  }
                  setTimeout(function(){location.reload();},2000)                  
                });
            },function () {
               setTimeout(function(){location.reload();},2000)                  
            })
        });
        $('select#redundancy_interface').change(function () {
            axellConfirm("info","Notice","Are you sure you want to change setting?",function(){
                var activeval = $("select#redundancy_interface").val();
                axshCall( "set redInterFace "+activeval, function ( out, err ) {
                  if ( err ) {
                      console.error( "Could not read red attribute: " + err );
                      return;
                  }
                  setTimeout(function(){location.reload();},2000)                  
                });
            },function () {
               setTimeout(function(){location.reload();},2000)                  
            })
        });

        $( '#gpsPowerBtn' ).click(function(){
            if(!$(this).hasClass('disabled')) {
                onGpsPowerBtn();
            }else{
                axellPopUp("You are not authorized to make change in this page.")
            }
        });

        function onGpsPowerBtn(){
            var $btn=$("div#gpsPowerBtn");
            if($btn.hasClass("on")){
                //if it button is already on, turn it off
                axellConfirm("alert","Warning","Are you sure you want to continue?",function(){
                    logEvent("GPS", "GPS Disable");
                    axshCall('SET GPS enable 0',function(out,err){
                        if(err){
                            console.error("Could not update the GPS attribute");
                        }else{
                            //now read the status from server to show if the set command was successfull
                            readGPS();
                        }
                    });
                },function () {
                })
            }else if($btn.hasClass("off")){
                //if it button is already off, turn it on 
                logEvent("GPS", "GPS Enable");
                axshCall('SET GPS enable 1',function(out,err){
                    //now read the status from server to show if the set command was successfull                  
                    if(err){
                        //the button is not initialized
                        console.error("The button is not initialized yet. (GET GPS has failed)"); 
                    }else{
                        //now read the status from server to show if the set command was successfull
                        readGPS();
                    }
                }); 
            }
        }

        function readGPS(){
            axshCall("GET GPS enable",function(out,err){
                if(err){
                    axellPopUp("Could not get the button value. Please make sure you are connected to the controller.");
                    console.error("Failed to get GPS attribute: "+err);
                    return;
                }
                var $btn=$("div#gpsPowerBtn");
                if(out == "1"){
                    //it is enabled
                    $btn.removeClass("off").addClass("on");
                }else{
                    //it is disabled
                    $btn.removeClass("on").addClass("off");
                }
            });
        }
        readGPS()

		// Checking if RF Master Mute is available before adding commands to scheduler.
		axshCall("get rmm", function(output, err) {
            var command = 'get tem';
            var commandParse = 'tem:l';
            //get ex1 & get ex2 & get ex3 & get ex4 & get doo &
            //ex1:l ex2:l ex3:l ex4:l doo:l
            //check if device has external alarm and door
            axshCall("get shw",function(out,err){
                if(err) {
                    console.error( 'Could not execute GET SHW: ' + err );
                }else {
                    for(var i=1; i<=4; i++){
                        if(out[i] !="0"){
                            command = command +  ' & get ex'+i;
                            commandParse = commandParse +  ' ex'+i+':l';
                        }
                    }
                    if(out[4] != "0"){
                        command = command +  ' & get doo';
                        commandParse = commandParse +  ' doo:l';
                    }
                    //in case there are no external alarm available, hide the whole table and expand the overall status table to fill the space
                    if(out[0]==="0" && out[1]==="0" && out[2]==="0" && out[3]==="0"){
                        $('#ext').remove();
                        $('#generalstatus-table').css('width','100%');
                    }else{
                        scheduler.add( sec( 20 ), {
                            cmd: 'measurements get exd',
                            callOnDiff:true,
                            parse: 'ead1:Q ead2:Q ead3:Q ead4:Q',
                            assignElements:{
                                type: 'text',
                                suffix: '-text'
                            }
                        });
                    }
                    devicePresent(out, 0, "#ex1", "External Alarm 1");
                    devicePresent(out, 1, "#ex2", "External Alarm 2");
                    devicePresent(out, 2, "#ex3", "External Alarm 3");
                    devicePresent(out, 3, "#ex4", "External Alarm 4");
                    devicePresent(out, 4, "#doo", "Door Alarm");
                }
            })

			if(err) {
				console.error( 'Could not execute GET RMM: ' + err );
				$( 'tr#master-mute' ).remove();
			} else {
				switch ( output ) {
					case '0':
					case '1':
						// Seem like RF Master Mute is available, let's add MMT(Master Mute) to command list.
						command = command +  ' & get mmt';
						commandParse = commandParse +  ' mmt:l';
						break
					case '2':
					default:
						// Master Mute not available
						$( 'tr#master-mute' ).remove();
						break;
				}
			}
			scheduler.add( sec( 8 ), {
				cmd : command,
				parse : commandParse,
				callOnDiff : true,
				__$overalLed : $( '#generaloverallstatusled' ),
				assignElements : {
					type : 'led',
					suffix : '-led'
				},
				onSuccess : function () {
					var atLeastOneGreen = false;
					for ( var led in this.parsedResults ) {
						var ledColor = this.parsedResults[ led ];
						if ( ledColor === 'red' ) {
							this.__$overalLed.led( 'option', 'color', 'red' );
							return;
						} else if ( ledColor === 'green' ) {
							atLeastOneGreen = true;
						}
					}
					this.__$overalLed.led( 'option', 'color', atLeastOneGreen ? 'green' : 'grey' );
				}
			});
		});

    }

    return {
        init : init
    }

});

