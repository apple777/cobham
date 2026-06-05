require([ '/js/api.js' ], function ( api ) {
    //{{OPTIONS
    //**Default Network Adapter Name.
    var USERACCESS= $.cookie('userAccess');
    var NIC_NAME="eth0";
    //**it's used when IP address is changed. How long to wait before automatically navigating to the new address?
    var AUTO_NAVIGATE_DELAY=10000;
    //}}OPTIONS
    var ALL_VALID_SUBNET_MASKS=[
        "128.0.0.0", //1
        "192.0.0.0", //2
        "224.0.0.0", //3
        "240.0.0.0", //4
        "248.0.0.0", //5
        "252.0.0.0", //6
        "254.0.0.0", //7
        "255.0.0.0", //8
        "255.128.0.0", //9
        "255.192.0.0", //10
        "255.224.0.0", //11
        "255.240.0.0", //12
        "255.248.0.0", //13
        "255.252.0.0", //14
        "255.254.0.0", //15
        "255.255.0.0", //16
        "255.255.128.0", //17
        "255.255.192.0", //18
        "255.255.224.0", //19
        "255.255.240.0", //20
        "255.255.248.0", //21
        "255.255.252.0", //22
        "255.255.254.0", //23
        "255.255.255.0", //24
        "255.255.255.128", //25
        "255.255.255.192", //26
        "255.255.255.224", //27
        "255.255.255.240", //28
        "255.255.255.248", //29
        "255.255.255.252", //30
        "255.255.255.254"  //31
    ];
    var ethOverCpriOld = 0;

    function configMethodAuto () {
        $(".manualstuff").prop("disabled",true);
        $("#rdDHCP").prop("checked",true);
    }

    function configMethodManual () {
        if(USERACCESS !="superuser"){
            $(".manualstuff").prop("disabled",true);
        }else{
            $(".manualstuff").prop("disabled",false);
        }
        $("#rdManual").prop("checked",true);
    }

    /**
     * This little script is called whenever a radio button is clicked on the interface. it disables/enables the
     * input fields related to manual configuration.
     */
    function configMethod(dhcp){
        switch ( dhcp ) {
        case "auto":
            configMethodAuto();
            break;
        case "manual":
            configMethodManual();
            break;
        default:
            console.error("Invalid argument to configMethod(): "+dhcp);
        }
    }

    /**
     * Called when Apply button is clicked
     */
    function onApplyButtonClick(){
        //if apply button is disabled, don't do anything
        if(!getButtonEnDis("#apply"))return;
        axellConfirm("info","Notice","Changing the IP settings may leave you unable to connect to the new address. Are you sure you want to continue?",function(){
            //disable the button to avoid multiple calls/overloads
            setButtonEnDis("#apply",false);
            if($("#EOCcb").prop("checked")){
                api.exe({
                    cmd: "eth_over_cpri set 25",
                    async: false,
                    onSuccess: function (EOC) {
                        console.log("Eth Over Cpri was changed to 25");
                        if(ethOverCpriOld == 0){
                           api.exe({
                              cmd: "kill_smd",
                              dataType: 'text',
                              async: false,
                              onSuccess: function (o) {
                              }
                           })                
                        }
                    }
                })
            }
            else{
                api.exe({
                    cmd: "eth_over_cpri set 0",
                    async: false,
                    onSuccess: function (EOC) {
                        console.log("Eth Over Cpri was changed to 0");
                        if(ethOverCpriOld != 0){
                           api.exe({
                              cmd: "kill_smd",
                              dataType: 'text',
                              async: false,
                              onSuccess: function (o) {
                              }
                           })                
                        }
                    }
                })
            }

            //External LAN enable 
            if($("#LANtoggle").prop("checked")){
                api.exe({
                    cmd: "marvell_port_on_off 1",
                    async: false,
                    onSuccess: function (EOC) {
                        console.log("External LAN was changed to enable");
                    }
                })
            }
            else{
                api.exe({
                    cmd: "marvell_port_on_off 0",
                    async: false,
                    onSuccess: function (EOC) {
                        console.log("External LAN was changed to disable");
                    }
                })
            }

            //if user has chosen the automatic IP assignment
            if($("#rdDHCP").prop("checked")){
                //dynamic so set controller to dynamic mode.
                var dynamicString = "SET NIC " + NIC_NAME + " DYNAMIC";
                setStatus( "Acquiring automatic IP", true );
                axshCall(dynamicString,function(dynamicResponse,err){
                    if(err){
                        axellPopUp("Setting automatic IP failed. "+err);
                        setButtonEnDis("#apply",true);
                        setStatus("IP assignment failed");
                    }else{
                        setButtonEnDis("#apply",true);
                        setStatus("IP assignment successful");
                    }
                });
            }else{
                //if user has chosen to assign the IP manually
                if(window.VAL_ip_addr($("#edtIP").val()) &&  window.VAL_ip_addr($("#edtSubnet").val()) && window.VAL_ip_addr($("#edtGateway").val()) && validateDNS()){
                    //check the subnet mask
                    if(ALL_VALID_SUBNET_MASKS.indexOf($("#edtSubnet").val())==-1){
                        axellPopUp("Invalid subnet mask");
                        setButtonEnDis("#apply",true);
                        setStatus();
                        return;
                    }
                    else
                    {
                        //axshCall("set dns " + $("#edtDNS1").val() + " " + $("#edtDNS2").val() + " " + $("#edtDNS3").val() , function(out,err)
                        //{
                            /*if(err)
                            {
                                console.error("Could not set the DNS settings: " + err );
                                axellPopUp("Error: Applying DNS Settings Failed.");
                                return;
                            }*/
                            /*
                            The user may mistakenly choose an IP address that is currently being used on another machine.
                            Therefore before setting the new IP address, we ask the controller to ping it. If the controller
                            can connect to that IP address, it means that IP address is being used and if we change to that IP address
                            the user cannot connect to the controller anymore. Therefore we refuse such IP assignment.
                            */
                            axshCall("serverip", function(out,err)
                            {
                                if(err){
                                    console.error("Could not get the current server ip: " + err );
                                    axellPopUp("Could not apply settings: " + err );
                                    setButtonEnDis("#apply",true);
                                    return;
                                }
                                //a flag to indicate if we are setting the same ip address
                                var sameIp = (out==$("#edtIP").val());
                                console.log( "Same IP: " + sameIp );
                                setStatus( "Checking IP address availability", true );
                                axshCall("pingip " + $("#edtIP").val(),function(output,err){
                                    if(err||sameIp){//error actually means that the pingip command failed and therefore it is possible to change the IP to that address
                                        setStatus();
                                        //ping was successful, so the IP is most probably free. Let's set it!
                                        axellPopUp("IP is going to change to: " + $("#edtIP").val() + ".\nThis page will be disconnected from server. Please manually connect to the new address by typing the above IP address in your browser's address bar.");
                                        //change the ip
                                        var ipchangeStr = "SET NIC " + NIC_NAME + " STATIC " + $("#edtIP").val() + " "+ $("#edtSubnet").val() +" 255.255.255.255" ;
                                        var autoChangeTimer=setTimeout("navigateToIP('"+$("#edtIP").val()+"')",AUTO_NAVIGATE_DELAY);
                                        axshCall("set gwy "+$("#edtGateway").val(),function (out,err) {
                                            if(err){axellPopUp("Could not set gateway: " + err );}
                                        });
                                        axshCall(ipchangeStr,function(ipChangeOutput,errorMsg){
                                            if(errorMsg){
                                                axellPopUp("Setting the ip failed. "+errorMsg);
                                                setButtonEnDis("#apply",true);
                                                setStatus( "Setting the ip failed" );
                                                clearTimeout(ipchangeStr);
                                            }else{
                                                //this will never happen because when the ip is set, all pending Ajax calls will be canceled
                                                console.error("Ajax call succeeded after IP change!");
                                                navigateToIP($("#edtIP").val());
                                            }
                                        });
                                    }else{
                                        //ping was successful! It's not good!
                                        axellPopUp("The chosen IP address already exists (controller can ping it).\nPlease try setting to another IP address.");
                                        setButtonEnDis("#apply",true);
                                        setStatus( "Choose another IP address");
                                    }
                                });
                            });
                        //});
                    }

                }
            }
            setButtonEnDis("#apply",true);
        },function(){
            //alert("Cancel")
        })
    }

    /**
     * This function is used to navigate to a new IP when it's changed.
     * @param ip a string representing the new up address example "192.168.1.34"
     */
    function navigateToIP(ip){
        var url="http://"+ip;
        axellConfirm("info","Notice","Do you want to navigate to "+url+" now?",function(){
            window.open(url,"_parent");
        },function () {
        })
    }

    function validateDNS(){
        if($("#edtDNS1").val()){
            if(window.VAL_ip_addr($("#edtDNS1").val())){
                if($("#edtDNS2").val() || $("#edtDNS3").val()){
                    if(validateExtraDNS()){
                        //validated DNS#2 & DNS#3 as ok
                        return true;
                    }
                }else{
                    //validated DNS#1 as ok
                    return true;
                }
            }
        }
        axellPopUp("Error: Applying DNS Settings Aborted.");
        return false;
    }

    /**
     * validate the alternative DNS data
     */
    function validateExtraDNS(){
        var poo = $('#edtDN2').val();
        if($("#edtDNS2").val()){
            if(window.VAL_ip_addr($("#edtDNS2").val())){
                if($("#edtDNS3").val()){
                    return window.VAL_ip_addr($("#edtDNS3").val());
                }
                return true;
            }else{
                return false;
            }
        }else{
            if($('#edtDNS3').val()){
                //axellPopUp("Error: Cannot Set DNS3 Without DNS2");
            }
        }
        axellPopUp("Error: Applying DNS Settings Aborted.");
        return false;
    }

    /**
     * This will run when the page is loaded into the browser
     */
    $(document).ready( function ( e ) {
        api.exe({
            cmd: getAttr( 'mdl' ),
            onSuccess: function ( o ) {
                if(o.ajaxdata.indexOf("RRU") == 0){
                    $('#EOC_panel').show();
                    $('#EOCsettings').show();

                    api.exe({
                        cmd: "eth_over_cpri get",
                        async: false,
                        onSuccess: function (EOC) {
                            if (EOC.ajaxdata == 0){
                                $('#EOCcb').prop('checked', false);
                            }
                            else{
                                $('#EOCcb').prop('checked', true);
                            }
                            ethOverCpriOld = EOC.ajaxdata;
                        }
                    })
                    // get marvell_port_on_off 
                    api.exe({
                        cmd: "marvell_port_on_off 2",
                        async: false,
                        onSuccess: function (EOC) {
                            if (EOC.ajaxdata.charAt(0) == 0){
                                $('#LANtoggle').prop('checked', false);
                            }
                            else{
                                $('#LANtoggle').prop('checked', true);
                            }
                        }
                    })                    
                }
                else{
                    $('#EOC_panel').hide();
                    $('#EOCsettings').hide();
                }
            }
        });
        if(USERACCESS !="superuser"){
            $( '#apply').addClass('disabled');
            $( '#rdDHCP').attr('disabled',true);
            $(".manualstuff").prop("disabled",true);
        }

        $( '#apply' ).click(function(){
            if(!$(this).hasClass('disabled')){
                onApplyButtonClick();
            }
        });
        $( '#rdDHCP' ).click( function () {
            configMethod( $( this ).prop( 'checked' ) ? 'auto' : 'manual' );
        });

        axshCall( "get nic " + NIC_NAME, function ( netResponse, err ) {
            if ( err ) {
                console.log( "Could not get NIC: " + err );
                return;
            }
            var netData = split2( netResponse, " " );
            if ( !netData ) {
                console.debug( "Could not parse the output of the NIC attribute." );
                return;
            }
            switch ( netData[0] ) {
            case "STATIC": configMethod( "manual" ); break;
            case "DYNAMIC": configMethod( "auto" ); break;
            default: console.debug( "Could not recognize the configuration method: " + netData[0] ); break;
            }
            $( "#edtIP" ).val( netData[1] );
            $( "#edtSubnet" ).val( netData[2] );

            axshCall( "get gwy", function ( gwyResponse, err ) {
                if ( err ) {
                    console.error( "Could not read Gateway:" +err );
                    return;
                }
                $( "#edtGateway" ).val( gwyResponse );
            });

            axshCall( "get dns", function ( dnsResponse, err ) {
                if ( err ) {
                    console.error( "Could not read DNS: " + err );
                    return;
                }
                var dnsArr = split2( dnsResponse );
                for ( var i = 1; i <= dnsArr.length; i++ ) {
                    $( "#edtDNS" + i ).val( dnsArr[i-1] );
                }
            });
        });
    });
});
