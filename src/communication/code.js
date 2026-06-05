require([ '/js/api.js' ], function ( api ) {
    var USERACCESS = $.cookie("userAccess");
    /**
     * This is a simple utility function that sets the value of an input box to the result of a command
     */
    function getCmd ( $query, cmd ) {
        axshCall( cmd, function ( out, err ) {
            if ( err ) {
                $( $query ).val( "" );
                console.error( "Error trying to run " + quote( cmd ) + ": " + err );
            } else {
                $( $query ).val( out );
                console.log( "Command run successfully: " + quote( cmd ) );
            }
        });
    }

/**
 * This is a simple utility function that sets the value of an input box to the result of a command
 */
function getCmdToken ( $query, cmd, token ) {
    axshCall( cmd, function ( out, err ) {
        if ( err ) {
            $( $query ).val( "" );
            console.error( "Error trying to run " + quote( cmd ) + ": " + err );
        } else {
            var myToken = split2(out);
            $( $query ).val( myToken[token-1] );
            console.log( "Command run successfully: " + quote( cmd ) );
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
                console.error( "Error trying to set " + quote( cmd ) + ": " + err );
            } else {
                console.log( "Command run successfully: " + quote( cmd ) );
            }
        });
    }

    /**
     * Reads the status of the "Communication Device Enabled" from CDE
     * It then accordingly shows or hides parts of the GUI which are relevant to the selected device:method (if any)
     */
    function readCDE(){
        axshCall("GET CDE",function(out,err){
            if(err){
                axellPopUp("Could not get the button value. Please make sure you are connected to the controller.");
                console.error("Failed to get CDE attribute: "+err);
                return;
            }
            var $btn=$("div#remoteComPowerBtn");
            out=$.trim(out);
            if(out.charAt(0)=="1"){
                //it is enabled
                $btn.removeClass("off").addClass("on");
                //show device:method settings
                $("tr.hidewhenoff").show();
                //hide all settings panels
                $("div.settings").hide();
                //now let's see what device:methods are available in the system
                axshCall("GET CSL",function(out,err){
                    if($.trim(out)=="-"){
                        axellPopUp("This device doesn't have any modem supporting data calls");
                        $("div#enableAndDeviceMethod").hide();
                        return;
                    }
                    var deviceMethods=split2(out);
                    var $sel=$("select#deviceMethodSelection");
                    $sel.empty();
/*                    for(var i=0;i<deviceMethods.length;i++){
                        var op=$(document.createElement("option")).text(deviceMethods[i]);
                        $sel.append(op);
                    }*/
                    var op=$(document.createElement("option")).text("ETH:SNMP");
                    $sel.append(op);
                    axshCall("GET DEV",function(out,err){
                        if ( err ) {
                            console.error( "Could not read the DEV attribute: " + err );
                            return;
                        }
                        // Solved it this way for now since GET DEV changed from 1 token to 8 token...
                        firstDevice = split2(out);
                        //special condition (product-specific): if DEV contains Q26CDMA, hide the access point settings otherwise show it
                        if ( /Q26CDMA/i.test( firstDevice[0] ) ) {
                            $("#access-point-name-row").hide();
                        } else {
                            $("#access-point-name-row").show();
                        }
                            $('#deviceMethodSelection').val(firstDevice[0]);
                        //ok now that the list is up to date,
                        //update the description and panel settings for the last item in the list as well
                        onDeviceMethodSelectionChange()
                    });
                });
            }else if(out.charAt(0)=="0"){
                //it is disabled
                $btn.removeClass("on").addClass("off");
                //hide device:method settings
                $("tr.hidewhenoff").hide();
                //hide all settings panels
                $("div.settings").hide();
            }else{
                console.error("Cannot understand the result of GET CDE");
            }
        });
    }

    /**
     * This is called when the power button is clicked
     */
    function onRemoteComBtnClick(){
        var $btn=$("div#remoteComPowerBtn");
        if($btn.hasClass("on")){
            //if it button is already on, turn it off
            axellConfirm("alert","Warning","Turning off the remote communications may disconnect you permanently and unable to change it via the web interface. Are you sure you want to continue?",function(){
                axshCall('SET CDE 1 0',function(out,err){
                    $('#Heartbeat').hide();
                    if(err){
                        console.error("Could not update the CDE attribute");
                    }else{
                        //now read the status from server to show if the set command was successfull
                        readCDE();
                    }
                });
            },function () {
            })
        }else if($btn.hasClass("off")){
            axshCall('SET CDE 1 1',function(out,err){
                //now read the status from server to show if the set command was successfull                  
                if(err){
                    //the button is not initialized
                    console.error("The button is not initialized yet. (GET CDE has failed)"); 
                }else{
                    //now read the status from server to show if the set command was successfull
                    readCDE();
                }
            }); 
        }
    }

    /**
     * is called to set the RCH on the controller.
     */
    function setRCH() {
        var command = null;
        var curr_minutes;
        var minutes =
            parseInt(document.getElementById('interval-minutes-sel').selectedIndex) +
            60*parseInt(document.getElementById('interval-hours-sel').selectedIndex) +
            24*60*parseInt(document.getElementById('interval-days-sel').selectedIndex);
        
        axshCall("GET RCH",function(out,err){
            if(err){
                axellPopUp("Could not get the button value. Please make sure you are connected to the controller.");
                console.error("Failed to get RCH attribute: "+err);
                return;
            }

            curr_minutes=parseInt($.trim(out));
        });
        
        if(curr_minutes != minutes){
            command="SET RCH " + minutes;
            if(minutes > 100000) {
                axellPopUp("Failed to set the RCH attribute, max time is 100000 minutes(69 days, 10 hours and 40 minutes).");
            } else {
                axshCall(command,function(out,err){
                    if(err){
                        console.error("Could not read the CDE attribute");
                    }
                });
            }
        }
    }

    /**
     * Event handler for when the Apply button is clicked
     */
    function onApply(){
        /*
         * This is just a sample code to show how to access the values from device:method for processing
         * @see http://nesta/mediawiki/index.php/Modem_Configurations_Dialog#TCP
         */
        var deviceMethodSt=$("select#deviceMethodSelection").val();
        if(deviceMethodSt==null){
            axellPopUp("Nothing is selected");
            return;
        }
        var e=deviceMethodSt.split(":");
        if(e.length != 0 && e.length == 2){
            switchAndAct(e[1]);
        }

        setRCH();
    }

    /**
     * is called to get the DTC settings on the controller.
     */
    function getDTC()
    {
        getCmd('#aemMainAddressDTC',"GET ASC");
        getCmd('#aemSecondaryAddressDTC',"GET SSC");
        axshCall("GET MIS", function(response,err){
            $('#modemInitializationString').val(response);
        });
    }

    /**
     * is called to set the DTC settings on the controller.
     */
    function setDTC(){
        //set modem string
        if(validateModInitStr()){
            axshCall("SET MIS "+$('#modemInitializationString').val(),function(output,err){
                if($('#aemMainAddressDTC').val() == ""){
                    axellPopUp("ASC is empty. ");
                    return;
                }
                //set ASC
                axshCall("SET ASC "+$('#aemMainAddressDTC').val(),function(output,err){
                    if(err){
                        axellPopUp("Error: Could not set the ASC attribute. "+err);
                    }else{
                        //set SSC
                        if($('#aemSecondaryAddressDTC').val() != "" && $('#aemSecondaryAddressDTC').val() != "-" ){
                            axshCall("SET SSC "+$('#aemSecondaryAddressDTC').val(),function(output,err){
                                if(err){
                                    axellPopUp("Failed to set the SSC attribute: "+err);
                                }else{
                                    Success();
                                }
                            });
                        }else{
                            Success();
                        }
                    }
                });
            });
        }else{
            //ASC is not ok alert user
            axellPopUp("Modem Init Data is invalid (Cannot Contain WhiteSpaces).");
        }
    }



    /**
     * is called to get the TCP settings on the controller.
     */
    function getTCP(){
        getCmd('#aemMainIpAddressTCP',"GET ASC");
        getCmd('#aemMainPortTCP',"GET PPO");
        getCmd('#aemSecondaryIpAddressTCP',"GET SSC");
        getCmd('#aemSecondaryPortTCP',"GET SPO");
    }

    /**
     * is called to set the TCP settings on the controller.
     */
    function setTCP()
    {
        //check submitted data is valid
        if($('#aemMainIpAddressTCP').val() != "" && $('#aemMainPortTCP').val() != ""){
            if(	$('#aemSecondaryIpAddressTCP').val() != "" && $('#aemSecondaryPortTCP').val() != ""){
                setDualIpConfig($('#aemMainIpAddressTCP').val(),$('#aemMainPortTCP').val(),
                $('#aemSecondaryIpAddressTCP').val(), $('#aemSecondaryPortTCP').val());
            }else{
                //only 1 set of ip's to val
                setDualIpConfig($('#aemMainIpAddressTCP').val(),$('#aemMainPortTCP').val());
            }
        }
    }

    /**
     * is called to get SNMP trap version.
     */
    function getSNMPtrapVersion(callback)
    {
        var token; //, done = false;
        axshCall("GET SNMP TRAPVERSION",function(out,err){
            if(err){
                axellPopUp("Could not get SNMP TRAPVERSION values. Please make sure you are connected to the controller.");
                loge("Failed to get SNMP V3 attribute: "+err);
            } else {
                out=$.trim(out);
                for(token=1;token<=4;token++) {
                    $('#snmpTrapVersion-'+token).val(out.split(' ')[token-1]);
                }
                setsnmpTrapVersionInGUI();
                callback();
            }
        });
    }

    /**
     * is called to get getSNMPtrapV2c.
     */
    function getSNMPtrapV2c(token)
    {
        getCmdToken('#snmpTrapCommunity-'+token,'GET SNMP TRAPCOMMUNITY', token);
    }

    /**
     * is called to get getSNMPtrapV3.
     */
    function getSNMPtrapV3(token)
    {
        axshCall("GET SNMP TRAPV3 "+token,function(out,err){
            if(err){
                axellPopUp("Could not get SNMP TRAPV3 values. Please make sure you are connected to the controller.");
                loge("Failed to get SNMP V3 attribute: "+err);
                return;
            } else {
                $('#snmpMyUser-'+token).val((out.split(' ')[0] === '""')? "" : out.split(' ')[0]);
                $('select#authProtocol-'+token).val(out.split(' ')[1]);
                $('#snmpMyPassword-'+token).val((out.split(' ')[2] === '""')? "" : out.split(' ')[2]);
                $('select#privProtocol-'+token).val(out.split(' ')[3]);
                $('#snmpMyOtherPassword-'+token).val((out.split(' ')[4] === '""')? "" : out.split(' ')[4]);
            }
        });
    }

    /**
     * is called to get SNMP.
     */
    function getSNMP()
    {
        var token;
        getSNMPtrapVersion(function(){
            for(token=1;token<=4;token++){
                getCmdToken('#snmpTrapAddress-'+token,'GET RAD', token);
                getCmdToken('#snmpTrapPort-'+token,'GET RPO', token);
                getSNMPtrapV2c(token);
                getSNMPtrapV3(token);
            }
        });
    }

    /**
     * is called to set the SNMPv2c settings on the controller.
     */
    function setSNMPv2c(token){
        if(isvalidSNMPText('#snmpTrapCommunity-'+token)) {
            setCmd('#snmpTrapCommunity-'+token, 'SET SNMP TRAPCOMMUNITY '+token);
            setCmd('#snmpTrapVersion-'+token, 'SET SNMP TRAPVERSION '+token);
        }
    }

    /**
     * is called to set the SNMPv2c settings on the controller.
     */
    function setSNMPv3(token, snmpMyUser, authProtocol, snmpMyPassword, privProtocol, snmpMyOtherPassword){
        if(!snmpMyUser) snmpMyUser = "-";
        if(!snmpMyPassword) snmpMyPassword = "-";
        if(!snmpMyOtherPassword) snmpMyOtherPassword = "-";
        axshCall("SET SNMP TRAPV3 "+token+" "+snmpMyUser+" "+authProtocol+" "+snmpMyPassword+" "+privProtocol+" "+snmpMyOtherPassword,function(output,err){
            if(err){
                axellPopUp("Error: Could not set the SNMP TRAP V3 attribute. "+err);
            }
        });
    }

    /**
     * is called to set the SNMP settings on the controller.
     */
    function setSNMP(){
        // check submitted data is valid
        var token;
        var snmpTrapVersion, snmpTrapAdress, snmpTrapPort;
        var snmpTrapCommunity;
        var snmpMyUser, authProtocol, snmpMyPassword, privProtocol, snmpMyOtherPassword;
        for(token=1;token<=4;token++) {
            snmpTrapVersion = $('#snmpTrapVersion-'+token).val();
            snmpTrapPort = $('#snmpTrapPort-'+token).val();
            snmpTrapAdress = $('#snmpTrapAddress-'+token).val();
            snmpTrapCommunity = $('#snmpTrapAddress-'+token).val();
            snmpMyUser = $('#snmpMyUser-'+token).val();
            authProtocol = $('select#authProtocol-'+token).val();
            snmpMyPassword = $('#snmpMyPassword-'+token).val();
            privProtocol = $('select#privProtocol-'+token).val();
            snmpMyOtherPassword = $('#snmpMyOtherPassword-'+token).val();

            if(
                   snmpTrapAdress == '-' ||
                   snmpTrapPort == '-' ||
                   (snmpTrapVersion == "v2c" && snmpTrapCommunity == '-') ||
                   (snmpTrapVersion == "3" && (snmpMyUser == '-' || snmpMyPassword == '-' || snmpMyOtherPassword == '-'))
                ) continue;

            if(snmpTrapAdress === '') {
                snmpTrapPort = 162;
                snmpTrapAdress = '-';
            }

            if(snmpTrapPort === '') {
                snmpTrapPort = 162;
            }

            // check submitted data is valid
            if(snmpTrapPort >=1 && snmpTrapPort <= 65536 && (snmpTrapAdress === '-' || window.VAL_ip_addr(snmpTrapAdress)))
            {
                setIpConfig(snmpTrapAdress, snmpTrapPort, token);
            }else{
                firstIpError();
            }
            if(snmpTrapVersion == '2') setSNMPv2c(token);
            if(snmpTrapVersion == '3') setSNMPv3(token, snmpMyUser, authProtocol, snmpMyPassword, privProtocol, snmpMyOtherPassword);
        }
        return;
    }

    /**
     * is called to get the GPRS settings on the controller.
     */
    function getGPRS()
    {
        getCmd('#accessPointName',"GET GPR APN");
        getCmd('#aemMainIpAddressGPRS',"GET ASC");
        getCmd('#aemMainPortGPRS',"GET PPO");
        getCmd('#aemSecondaryIpAddressGPRS',"GET SSC");
        getCmd('#aemSecondaryPortGPRS',"GET SPO");
    }
    /**
     * is called to set the GPRS settings on the controller.
     */
    function setGPRS(){
        setCmd( "#accessPointName", "SET GPR APN" );
        //check submitted data is valid
        if($('#aemMainIpAddressGPRS').val() != "" && $('#aemMainPortGPRS').val()){
            if(	$('#aemSecondaryIpAddressGPRS').val() != "" && $('#aemSecondaryPortGPRS').val() != ""){
                setDualIpConfig($('#aemMainIpAddressGPRS').val(),$('#aemMainPortGPRS').val(),
                $('#aemSecondaryIpAddressGPRS').val(), $('#aemSecondaryPortGPRS').val());
            }else{
                //only 1 set of ip's to val
                setDualIpConfig($('#aemMainIpAddressGPRS').val(),$('#aemMainPortGPRS').val());
            }
        }else{
            firstIpError();
        }
    }
    /**
     * is called to get the SMS settings on the controller.
     */
    function getSMS()
    {
        getCmd('#accessPointName',"GET SMC");
    }
    /**
     * is called to set the SMS settings on the controller.
     */
    function setSMS(){
        axellPopUp("To Be Completed");
}
/**
 * Quite clever function, reduces code duplication as it is called to set ASC + SSC params for multiple modes: TCP/GPRS etc..
 */
function setIpConfig(inputAddress, inputPort, manager){
    if(inputAddress&&inputPort){
        //ip + port 1 are ok
        axshCall("SET RAD "+manager+" "+inputAddress,function(output,err){
            if(err){
                axellPopUp("Error: could not set the first IP address. "+err);
                return;
            }
            setTimeout(function(){
                //set ip 1
                axshCall("SET RPO "+manager+" "+inputPort,function(output,err){
                    if(err){
                        //ip1 failed to be set
                        axellPopUp("Error: Could not set the first port number. "+err);
                            return;
                    }
                    Success();
                });
            },1000);
        });
    }
}

    /**
     * Quite clever function, reduces code duplication as it is called to set ASC + SSC params for multiple modes: TCP/GPRS etc..
     */
    function setDualIpConfig(inputAddress, inputPort, secondaryAddress, secondaryPort){
        if(inputAddress&&inputPort){
            //ip + port 1 are ok
            axshCall("SET ASC "+inputAddress,function(output,err){
                if(err){
                    axellPopUp("Error: could not set the first IP address. "+err);
                    return;
                }
                //set ip 1
                axshCall("SET PPO "+inputPort,function(output,err){
                    if(err){
                        //ip1 failed to be set
                        axellPopUp("Error: Could not set the first port number. "+err);
                        return;
                    }
                    //port1 + ip1 = ok... see if we need to set secondary ip+port
                    if(secondaryAddress && secondaryPort){
                        //same as above if both are set without error return success.
                        axshCall("SET SSC "+secondaryAddress,function(output,err){
                            if(err){
                                axellPopUp("Error: could not set the secondary address. "+err);
                                return;
                            }
                            axshCall("SET SPO "+secondaryPort,function(output,err){
                                if(err){
                                    axellPopUp("Error: could not set the secondary port. "+err);
                                }else{
                                    //both ip's + ports set ok
                                    Success();
                                }
                            });
                        });
                    }else{
                        //no need to set secondary ip + port. ip1+port1 are set successfully however
                        Success();
                    }
                });
            });
        }
    }

    /**
     * it is called to perform basic validation on the user submitted Modem Initialisation String
     */
    function validateModInitStr(){
        if($('#modemInitializationString').val()!= ""){
            //string is not empty
            var str = $('#modemInitializationString').val();
            digit = str.split('');
            var nbSpaces = 0;
            for(var i = 0; i < digit.length; i++){
                if(digit[i] == ' ')nbSpaces++
            }
            if(nbSpaces != 0){
                return false;
            }else{
                return true;
            }
        }
    }

    /**
     * it is called when the device:method selection is changed
     */
    function onDeviceMethodSelectionChange(){
        var deviceMethodSt=$("select#deviceMethodSelection").val();
        var e=deviceMethodSt.split(":");
        axshCall("get dds "+e[0],function(out,err){
            $("td#deviceDescription").text(out);
        });
        axshCall("get cmd "+e[1],function(out,err){
            $("td#methodDescription").text(out);
        });
        //show Only one settings panel
        var selectedPanelId=e[1]+"settings";
        $("div.settings").each(function(index, element) {
            //if it's the desired panel, show it otherwise hide it
            if($(this).attr("id")==selectedPanelId){
                $('#Heartbeat').show();
                $('#Heartbeat').removeClass('hidden');
                $(this).show();
                $(this).removeClass('hidden');
                switchAndLoad(e[1]);
            }else{
                $(this).hide();
            }
            $(this).removeClass('hidden');
            return true;//to keep the loop going
        });
    }


    /**
     * Called when properties are successfully sent to the controller
     */
    function Success(logOutRequired){
         var str = "SET DEV " + $('#deviceMethodSelection').val();
         axshCall(str,function(out,err){
            if(err){
                //axellPopUp("Error Setting Device Data, Restoring Previous Settings");
                return;
            }
            var str = "";
            if(logOutRequired){
                str = "Settings Applied, Changes will only take effect when you logout";
                axellPopUp(str);
            }else{
                <!--str = "Settings Applied! The Page Will Now Reload";-->
            }
            <!--axellPopUp(str);-->
            setTimeout(function(){location.reload();},2000)

        });
    }
    /**
     * Simple switch statement to identify configured type and execute resulting action
     */
    function switchAndAct(remoteComms)
    {
        switch(remoteComms)
        {
        case 'DTC':
            //setDTC();
            break;
        case 'TCP':
            //setTCP();
            break;
        case 'SNMP':
            setSNMP();
            break;
        case 'GPRS':
            setGPRS();
            break;
        case 'SMS':
            //setSMS();
            break;
        default:
            axellPopUp("Unknown Configuration Type");
        }
    }
    /**
     * Simple switch statement to identify configured type and execute resulting action
     */
    function switchAndLoad(remoteComms)
    {
        switch(remoteComms)
        {
        case 'DTC':
            //getDTC();
            break;
        case 'TCP':
            //getTCP();
            break;
        case 'SNMP':
            getSNMP();
            break;
        case 'GPRS':
            getGPRS();
            break;
        case 'SMS':
            //getSMS();
            break;
        default:
            axellPopUp("Unknown Configuration Type");
        }
    }

    /**
     * Timer which runs to update the GPRS LED.
     */



    setInterval(function() {
        var checkMe = $('#deviceMethodSelection :selected').text();
        if(checkMe.indexOf("GPRS") != -1){
            getGPRSStatus();
        }
        console.log("LOOP")
    }, 15000);
    /**
     *  Function Which Updates The GPRS LED.
     */
    function getGPRSStatus(){
        axshCall("GET GPR STATUS",function(data,err){
            if(err){
                //error so set red
                setLedColor('#attachmentStatus',"red");
                axellPopUp("Could not read the GPRS status: "+err);
                return;
            }
            //response received
            if(data == "1"){
                setLedColor('#attachmentStatus',"green");
            }
            else if(data == "0"){
                setLedColor('#attachmentStatus',"red");
            }else{
                setLedColor('#attachmentStatus',"grey");
            }
        });
    }

    function firstIpError()
    {
        axellPopUp("Error Ip Address Is Invalid");
    }

    function buildHeartbeat()
    {
        var days = 0;
        var hours = 0;
        var minutes = 0;
        var option = [];
        for(var o=0;o<70;o++) {
            option.push('<option value="'+o+'">'+o+'</option>');
        }
        $('#interval-days-sel').html(option.join(''));

        option = [];
        for(var o=0;o<24;o++) {
            option.push('<option value="'+o+'">'+o+'</option>');
        }
        $('#interval-hours-sel').html(option.join(''));

        option = [];
        for(var o=0;o<60;o++) {
            option.push('<option value="'+o+'">'+o+'</option>');
        }
        $('#interval-minutes-sel').html(option.join(''));

        axshCall("GET RCH",function(out,err){
            if(err){
                axellPopUp("Could not get the button value. Please make sure you are connected to the controller.");
                console.error("Failed to get RCH attribute: "+err);
                return;
            }

            minutes=parseInt($.trim(out));
            if(minutes >= 60) {
                hours = Math.floor(minutes / 60);
                minutes = minutes - 60 * hours;
                if(hours >= 24) {
                    days = Math.floor(hours / 24);
                    hours = hours - 24 * days;
                    document.getElementById('interval-days-sel').selectedIndex = days;
                }
                document.getElementById('interval-hours-sel').selectedIndex = hours;
            }
            document.getElementById('interval-minutes-sel').selectedIndex = minutes;
        });
    }

    /**
     * This is called when the power button is clicked
     */
    function setsnmpTrapVersionInGUI() {
        var manager = 1;
        $("tr.hidealways").hide();
        if($("select#snmpTrapVersion-1").val() === $("select#snmpTrapVersion-2").val() &&
           $("select#snmpTrapVersion-2").val() === $("select#snmpTrapVersion-3").val() &&
           $("select#snmpTrapVersion-2").val() === $("select#snmpTrapVersion-4").val()) {
            $('[class^="snmpv2c-"]').show();
            $('[class^="snmpv3-"]').show();
            var $snmpTrapVersion=$("select#snmpTrapVersion-1");
            if($snmpTrapVersion.val() === "2"){
                $("tr.snmpv2c").show();
                $("tr.snmpv3").hide();
            }else if($snmpTrapVersion.val() === "3"){
                $("tr.snmpv2c").hide();
                $("tr.snmpv3").show();
            }
        } else {
            $("tr.snmpv2c").show();
            $("tr.snmpv3").show();
            for(manager=1;manager<=4;manager++) {
                var $snmpTrapVersion=$("select#snmpTrapVersion-"+manager);
        //        if($("div#remoteEnSNMPbutton").hasClass("on")) {
                    if($snmpTrapVersion.val() === "2") {
                        $("div.snmpv2c-"+manager).show();
                        $("div.snmpv3-"+manager).hide();
                    } else if($snmpTrapVersion.val() === "3") {
                        $("div.snmpv2c-"+manager).hide();
                        $("div.snmpv3-"+manager).show();
                    }
        //        }
            }
        }
    }

    function readsnmpTrapVersion() {
        var manager = 1;
        var managerIdx;
        /*
        axshCall("GET SNMP TRAP VERSION",function(out,err){
            if(err){
                axellPopUp("Could not read SNMP TRAP version. Please make sure you are connected to the controller.");
                loge("Failed to get SNMP VERSION: "+err);
                return;
            }
         */
        /*
        var out=($("select#snmpTrapVersion-1").val() === "v2c")? "2" : "3"+" "+
            ($("select#snmpTrapVersion-2").val() === "v2c")? "2" : "3"+" "+
            ($("select#snmpTrapVersion-3").val() === "v2c")? "2" : "3"+" "+
            ($("select#snmpTrapVersion-4").val() === "v2c")? "2" : "3";
        */
        var out = $("select#snmpTrapVersion-1").val()+" "+$("select#snmpTrapVersion-2").val()+" "+$("select#snmpTrapVersion-3").val()+" "+$("select#snmpTrapVersion-4").val();
            for(managerIdx=0;managerIdx<8;managerIdx+=2) {
                var $snmpTrapVersion=$("select#snmpTrapVersion-"+manager);
                out=$.trim(out);
                if(out.charAt(managerIdx)=="2"){
                    $snmpTrapVersion.val("2");
                }else if(out.charAt(managerIdx)=="3"){
                    $snmpTrapVersion.val("3");
                }else{
                    loge("Cannot understand the result of GET SNMP TRAP VERSION");
                }
                manager++;
            }
        setsnmpTrapVersionInGUI();
 //       });
    }

    /**
     * This runs when the page is loaded and ready
     */
    $(document).ready(function(e) {
        if((sessionStorage.getItem( 'header-get-mdl') != "MSDH-M") && (sessionStorage.getItem( 'header-get-mdl') != "DOBR-M"))
        {
            window.location.href = '/target/';
        }else{
            readCDE();
            buildHeartbeat();
//            readsnmpTrapVersion();
//            readRCH(days, hours, minutes);
            //bind validation for Trap Community inputs
            $( "input[id^=snmpTrapCommunity-]" ).keyup(function() {
                var $th = $(this);
                $th.val( $th.val().replace(/[^a-zA-Z0-9]/g, function(str) {
                 alert('You typed " ' + str + ' ".\n\nPlease use only letters and numbers.'); return ''; 
                }));
            });
            $( '#remoteComPowerBtn' ).click(function(){
                if(!$(this).hasClass('disabled')) {
                    onRemoteComBtnClick();
                }else{
                    axellPopUp("You are not authorized to make change in this page.")
                }
            } );
            $( '#deviceMethodSelection' ).change(onDeviceMethodSelectionChange );
            $( '#apply-button' ).click(function() {
                if(!$(this).hasClass('disabled')){
                    onApply();
                }
            });
            $('[id^="snmpTrapVersion-"]').change(function(){
                if(!$(this).hasClass('disabled')) {
                    setsnmpTrapVersionInGUI();
                }else{
                    axellPopUp("You are not authorized to make change in this page.")
                }
            });
            $('#enableAndDeviceMethod').removeClass('hidden');
            $('#enableAndDeviceMethod').show;
            $('#SNMPsettings').removeClass('hidden');
            $('#SNMPsettings').show;
            if(USERACCESS !='superuser'){
                $('.button').addClass('disabled');
                $( '#remoteComPowerBtn').addClass('disabled');
            }
        }
    });
});
