require([ '/js/lib/jquery.js', '/js/api.js',  '/js/util.js', '/js/lib/jquery-url.js' ], function ( $, api, util ) {
    var USERACCESS = $.cookie("userAccess");
        function getCmd ( $query, cmd ) {
        axshCall( cmd, function ( out, err ) {
            if ( err ) {
                $( $query ).val( "" );
                loge( "Error trying to run " + quote( cmd ) + ": " + err );
            } else {
                $( $query ).val( out );
                logi( "Command run successfully: " + quote( cmd ) );
            }
        });
    }

    /**
     * This is a utility function that uses the value of an edit box to set an atteibute. It automatically appends a space
     * at the end of the command and then adds the value of the edit box
     */
    function setCmd ( $query, cmd ) {
        cmd += " " + $( $query ).val();
        axshCall( cmd, function ( out, err ) {
            if ( err ) {
                console.debug ("Error trying to set " + quote( cmd ) + ": " + err );
            } else {
                console.debug ("Command run successfully: " + quote( cmd ) );
            }
        });
    }

    /**
     * Reads the status of the "Communication Device Enabled" from CDE
     * It then accordingly shows or hides parts of the GUI which are relevant to the selected device:method (if any)
     */
    function readSrvSNMP(){
        axshCall("GET SRV snmp",function(out,err){
            if(err){
                axellPopUp("Could not get the button value. Please make sure you are connected to the controller.");
                loge("Failed to get CDE attribute: "+err);
                return;
            }
            var $btn=$("div#remoteEnSNMPbutton");
            out=$.trim(out);
            if(out.charAt(0)=="1"){
                //it is enabled
                $btn.removeClass("off").addClass("on");
                //show device:method settings
                setSNMPversionInGUI();
                $("tr.showwhenon").show();
                //hide all settings panels
                $("div.settings").hide();
                $('#snmpPort').val(out.split(' ')[1]);

            }else if(out.charAt(0)=="0"){
                //it is disabled
                $btn.removeClass("on").addClass("off");
                //hide device:method settings
                $("tr.hidewhenoff").hide();
                //hide all settings panels
                $("div.settings").hide();
                $('#snmpPort').val(out.split(' ')[1]);
            }else{
                loge("Cannot understand the result of GET snmp");
            }
        });
    }

    function readAgentMibSNMP(){
        axshCall("snmp -w",function(out,err){
            if(err){
                axellPopUp("Could not get the SNMP button value. Please make sure you are connected to the controller.");
                console.debug("Failed to get SNMP attribute: "+err);
                return;
            }
            out=$.trim(out);
            var num = out.charAt(0);

            var aStr = out.match(/\w+|"[^"]+"/g), i = aStr.length;
            while(i--){
                aStr[i] = aStr[i].replace(/"/g,"");
            }
            if(aStr.length === 3)
            {
                $('#snmpAgent').text(aStr[1]);
                $('#snmpMIB').text(aStr[2]);
            }
            else
            {
                axellPopUp("Failed to get valid SNMP Agent/MIB data");
                console.debug("Failed to get valid SNMP Agent/MIB data: "+err);
            }
        });
    }

    /*function readSNMPCommunityRW(){
        axshCall("get SNMP rwcommunity",function(out,err){
            if(err){
                axellPopUp("Could not get the SNMP community-rw value. Please make sure you are connected to the controller.");
                console.debug"Failed to get SNMP community-rw attribute: "+err);
                return;
            }
            $('#snmpReadWrite').val(out.trim());
        });
    }*/

    function readSNMPCommunityRO(){
        axshCall("get SNMP rocommunity",function(out,err){
            if(err){
                axellPopUp("Could not get the SNMP community-ro value. Please make sure you are connected to the controller.");
                console.debug("Failed to get SNMP community-ro attribute: "+err);
                return;
            }
            $('#snmpReadOnly').val(out.trim());
        });
    }

    /**
     * This is called when the power button is clicked
     */
    function onSNMPEnableBtnClick(){
        var $btn=$("div#remoteEnSNMPbutton");
        if($btn.hasClass("on")){
            //if it button is already on, turn it off
            axellConfirm("alert","Warning","Turning off the SNMP Agent Configuration may disconnect you permanently. Are you sure you want to continue?",function(){
                axshCall("SET SRV SNMP 0 " + $('#snmpPort').val(),function(out,err){
                    if(err){
                        console.debug("Could not update the SNMP attribute");
                    }else{
                        //now read the status from server to show if the set command was successfull
                        UpdateGUI();
                        axellPopUp("Please reboot the device for the action to take place.");
                    }
                });
            },function () {
            })
        }else if($btn.hasClass("off")){
            //if it button is already off, turn it on
            axellConfirm("alert","Warning","Turning on the SNMP Agent Configuration. Are you sure you want to continue?",function(){
                axshCall("SET SRV SNMP 1 " + $('#snmpPort').val(),function(out,err){
                    if(err){
                        console.debug("The button is not initialized yet. (GET SNMP has failed)");
                    }else{
                        //now read the status from server to show if the set command was successfull
                        UpdateGUI();
                        axellPopUp("Please reboot the device for the action to take place.");
                    }
                });
            },function () {
            }) 
        }
    }

    /**
     * This is called when the power button is clicked
     */
    function setSNMPversionInGUI() {
        var $snmpVersion=$("select#snmpVersion");
        $("tr.hidealways").hide();
        if($("div#remoteEnSNMPbutton").hasClass("on")) {
            if($snmpVersion.val() === "v2c"){
                $("tr.snmpv2c").show();
                $("tr.snmpv3").hide();
            }else if($snmpVersion.val() === "v3"){
                $("tr.snmpv2c").hide();
                $("tr.snmpv3").show();
            }
        }
    }

    function readSNMPversion() {
        axshCall("GET SNMP VERSION",function(out,err){
            if(err){
                axellPopUp("Could not read SNMP version. Please make sure you are connected to the controller.");
                loge("Failed to get SNMP VERSION: "+err);
                return;
            }
            var $snmpVersion=$("select#snmpVersion");
            out=$.trim(out);
            if(out.charAt(0)=="2"){
                $snmpVersion.val("v2c");
            }else if(out.charAt(0)=="3"){
                $snmpVersion.val("v3");
            }else{
                loge("Cannot understand the result of GET SNMP VERSION");
            }
            setSNMPversionInGUI();
        });
    }

    function readSNMPv3() {
        axshCall("GET SNMP V3",function(out,err){
            if(err){
                axellPopUp("Could not get SNMP V3 values. Please make sure you are connected to the controller.");
                loge("Failed to get SNMP V3 attribute: "+err);
                return;
            }

            out=$.trim(out);
            /*
            $('#securityName').val((out.split(' ')[0] === "-")? "" : out.split(' ')[0]);
            $('select#authProtocol').val(out.split(' ')[1]);
            $('#authKey').val((out.split(' ')[2] === "-")? "" : out.split(' ')[2]);
            $('select#privProtocol').val(out.split(' ')[3]);
            $('#privKey').val((out.split(' ')[4] === "-")? "" : out.split(' ')[4]);
            */
            $('#securityName').val((out.split(' ')[0] === '""')? "" : out.split(' ')[0]);
            $('select#authProtocol').val(out.split(' ')[1]);
            $('#authKey').val((out.split(' ')[2] === '""')? "" : out.split(' ')[2]);
            $('select#privProtocol').val(out.split(' ')[3]);
            $('#privKey').val((out.split(' ')[4] === '""')? "" : out.split(' ')[4]);
        });
    }

    function UpdateGUI()
    {
        readSrvSNMP();
        readSNMPversion();
//        var $snmpVersion=$("select#snmpVersion");
//        if($snmpVersion.val() === "v2c"){
            readAgentMibSNMP();
            readSNMPCommunityRO();
            //readSNMPCommunityRW();
//        }else if($snmpVersion.val() === "v3"){
            readSNMPv3();
//        }
    }

    function onApplyV2c(){
        //now read the status from server to show if the set command was successfull
        if(isvalidSNMPText('#snmpReadOnly'))
        {
            axshCall("SET SNMP VERSION 2",function(out,err){
                if(err)
                {
                    console.debug("Could not set the SNMP VERSION attribute");
                }
            });

            axshCall("SET SNMP rocommunity "+$('#snmpReadOnly').val(),function(out,err){
                if(err)
                {
                    console.debug("Could not set the SNMP Community attribute");
                }
                else
                {
                    /*if(isvalidSNMPText('#snmpReadWrite'))
                     {
                     axshCall("SET SNMP rwcommunity "+$('#snmpReadWrite').val(),function(out,err){
                     if(err)
                     {
                     console.console.debug"Could not set the SNMP Community attribute");
                     }
                     else
                     {
                     axellPopUp("All Changes Saved.");
                     UpdateGUI();
                     }
                     });
                     }*/
                    // axellPopUp("All Changes Saved.");
                    UpdateGUI();
                }
            });

        }
    }

    function onApplyV3(){
        var securityName = $('#securityName').val();
        if(!securityName) securityName = "-";
//        if(!securityName) securityName = '""';
        var authProtocol = $('select#authProtocol').val();
        var authKey = $('#authKey').val();
        if(!authKey) authKey = "-";
//        if(!authKey) authKey = '""';
        var privProtocol = $('select#privProtocol').val();
        var privKey = $('#privKey').val();
        if(!privKey) privKey = "-";
//        if(!privKey) privKey = '""';

        axshCall("SET SNMP V3 "+securityName+" "+authProtocol+" "+authKey+" "+privProtocol+" "+privKey,function(out,err){
            if(err)
            {
                console.debug("Could not set the SNMP Community attribute");
            }
            else
            {
                /*if(isvalidSNMPText('#snmpReadWrite'))
                 {
                 axshCall("SET SNMP rwcommunity "+$('#snmpReadWrite').val(),function(out,err){
                 if(err)
                 {
                 console.console.debug"Could not set the SNMP Community attribute");
                 }
                 else
                 {
                 axellPopUp("All Changes Saved.");
                 UpdateGUI();
                 }
                 });
                 }*/
//                axellPopUp("All Changes Saved.");
                UpdateGUI();
            }
        });
    }

    function isPortNum()
    {
        if($.isNumeric($('#snmpPort').val()))
        {
            return true;
        }
        axellPopUp("Port must be a valid number");
        return false;
    }

    /**
     * Event handler for when the Apply button is clicked
     */
    function onApply(){
        var enabled = 0;
        var $snmpVersion=$("select#snmpVersion");

        if($("div#remoteEnSNMPbutton").hasClass("on")) {
            enabled = 1;
        }

        if(isPortNum()) {
           if($snmpVersion.val() === "v2c") {
               onApplyV2c();
           }else if($snmpVersion.val() === "v3") {
               onApplyV3();
           }

           axshCall("SET SRV SNMP "+enabled+" "+$('#snmpPort').val(),function(out,err) {
                if(err){
                    console.debug("Could not set the SNMP attribute");
                }
            });
        }
    }



    /**
     * This runs when the page is loaded and ready
     */
    $(document).ready(function(e) {
        if((sessionStorage.getItem( 'header-get-mdl') != "MSDH-M") && (sessionStorage.getItem( 'header-get-mdl') != "DOBR-M"))
        {
            window.location.href = '/target/';
        }else {
            UpdateGUI();
            $('#remoteEnSNMPbutton').click(function(){
                if(!$(this).hasClass('disabled')) {
                    onSNMPEnableBtnClick();
                }else{
                    axellPopUp("You are not authorized to make change in this page.")
                }
            });
            $('#snmpVersion').change(function(){
                if(!$(this).hasClass('disabled')) {
                    setSNMPversionInGUI();
                }else{
                    axellPopUp("You are not authorized to make change in this page.")
                }
            });
            $('#apply').click(function () {
                if(!$(this).hasClass('disabled')) {
                    onApply();
                }
            });
            $('#snmpReadOnly').keydown(function () {
                isSNMPCommunityCharValid('#snmpReadOnly');
            });
            $('#snmpReadOnly').keypress(function () {
                isPortNum();
            });
            if(USERACCESS !='superuser'){
                $('.button').addClass('disabled');
                $( '#remoteEnSNMPbutton').addClass('disabled');
            }
            $(".pagecontainer").removeClass('hidden');
        }
    });
});
