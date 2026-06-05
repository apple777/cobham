require([ '/js/api.js' ], function ( api ) {
    var USERACCESS= $.cookie('userAccess');
    //** get the date and time from the controller
    function reloadFromController() {
        //get the date and fill in the form
        axshCall("get dat",function(datOut,err) {
            if(err) {
                axellPopUp("Could not get the date from controller: " + err);
                return;
            }
            //get the time and fill in the form
            axshCall("get tim",function(timOut,err) {
                if(err) {
                    axellPopUp("Could not get the time from controller: " + err);
                    return;
                }
                $("#dayField").val(datOut.substr(0,2));
                $("#monthField").val(datOut.substr(2,2));
                $("#yearField").val(datOut.substr(4,2));

                $("#hourField").val(timOut.substr(0,2));
                $("#minuteField").val(timOut.substr(2,2));
                $("#secondField").val(timOut.substr(4,2));
            });
        });
    }


    /**
     * Fills the date and time fields using the current local time from the computer running the browser at the client side. It doesn't set anything.
     */
    function fillDateAndTimeFromClient() {
        //** simply gets a number and make sure that the output is exactly two digits
        function twoDigit(n) {
            n = n.toString();
            switch ( n.length ) {
                case 0:return "??";//invalid. Empty String should never be passed to this function.
                case 1:return "0" + n;//add 0 to its left to becoem two digits
                case 2:return n;//it's already two digits
                default:return n.substr(-2);//return the last two characters from the right
            }
        }
        var d = new Date();//now
        $( "#dayField"    ).val( twoDigit( d.getDate() ) );
        $( "#monthField"  ).val( twoDigit( d.getMonth() + 1 ) );
        $( "#yearField"   ).val( twoDigit( d.getUTCFullYear() ) );
        $( "#hourField"   ).val( twoDigit( d.getHours() ) );
        $( "#minuteField" ).val( twoDigit( d.getMinutes() ) );
        $( "#secondField" ).val( twoDigit( d.getSeconds() ) );
    }

    /**
     * This function checks the format of the input fields and shows proper error messages if something is wrong. Otherwise it sets the date and time
     */
    function setDateAndTime() {
        /**this is a utility function that checks the format of the argument to make sure it is a number within a range*/
        function check( name, str, min, max ) {
            n = parseInt( str, 10 );
            if ( typeof n != "number" || isNaN(n) ) {
                axellPopUp("Check Error: could not convert '" + str + "' to a number. Please edit the value of " + name + " and try again." );
                return "??";
            } else if ( ( n < min ) || ( n > max) ) {
                axellPopUp("Check Error: " + name + " should be between " + min + " to " + max + ". Please edit the value and try again. (" + str + ", " + n + ")" );
                return "??";
            } else {
                if ( n < 10 ) {
                    return "0" + n;
                } else {//it is going to be maximum two digits anyway
                    return n.toString();
                }
            }
        }
        //now make the parameters for SET DAT and SET TIM
        var dat=check("day",$("#dayField").val(),1,31) + check("month",$("#monthField").val(),1,12) + check("year",$("#yearField").val(),0,100);
        console.log( "DAT is:" + dat );
        var tim=check("hour",$("#hourField").val(),0,24) + check("minute",$("#minuteField").val(),0,59) + check("second",$("#secondField").val(),0,59);
        console.log( "TIM is:" + tim );
        //if everything is alright, set both of them
        if ( ( dat.indexOf( "?" ) == -1 ) && (tim.indexOf( "?" ) == -1 ) ){
            //set the date
            axshCall( "set DAT " + dat, function( out, err ) {
                if(err) {
                    axellPopUp("Could not set the date: " + err);
                    return;
                }
            });
            //set the time
            axshCall( "set TIM " + tim, function( out, err ) {
                if(err) {
                    axellPopUp("Could not set the time: " + err);
                    return;
                }
            });
        }
    }

    function disableDateTime(dis){
      $('#dayField').attr('disabled',dis);
      $('#monthField').attr('disabled',dis);
      $('#yearField').attr('disabled',dis);
      $('#hourField').attr('disabled',dis);
      $('#minuteField').attr('disabled',dis);
      $('#secondField').attr('disabled',dis);
    }

    $( '#reload-button' ).click( reloadFromController );
    $( '#local-time-button' ).click(function(){
        if(!$(this).hasClass('disabled')){
            fillDateAndTimeFromClient();
        }
    });
    $( '#apply-button' ).click(function(){
        if(!$(this).hasClass('disabled')){
            setDateAndTime();
            if($("#checkNtp").prop("checked")){
              //if(!window.VAL_ip_addr($("#editNtp").val())){
              if($("#editNtp").val() == ""){
                  axellPopUp("Wrong IP Address");
                  return;
              }
              axshCall( "set ntp enable 1", function ( out, err ) {
                 if ( err ) {
                      console.error( "Could not set ntp attribute: " + err );
                      return;
                 }        
                 axshCall( "set ntp server " + $('#editNtp').val(), function ( out, err ) {
                    if ( err ) {
                         console.error( "Could not set ntp attribute: " + err );
                         return;
                    }        
                    api.exe({
                       cmd:"set_ntpd",
                       onSuccess:function(){
                       },
                       onError:function(err){
                        axellPopUp("IP Address not in use");
                       }
                    })
                 });
              });
            }else{
              axshCall( "set ntp enable 0", function ( out, err ) {
                 if ( err ) {
                      console.error( "Could not set ntp attribute: " + err );
                      return;
                 }        
                 api.exe({
                    cmd:"set_ntpd",
                    onSuccess:function(){
                    },
                    onError:function(err){
                    }
                 })
              });
            }
        }
    });

    $( '#checkNtp' ).click( function () {
        if($("#checkNtp").prop("checked")){
            $('#editNtp').attr('disabled',false);
            disableDateTime(true);
        }else{
            $('#editNtp').attr('disabled',true);
            disableDateTime(false);
        }
    });

    /**
     * This piece of code runs when the page loads
     */
    $(document).ready( function() {
        console.log(USERACCESS);
        if(USERACCESS !="superuser"){
            $( '#local-time-button').addClass('disabled');
            $( '#apply-button' ).addClass('disabled');
            $( '.two-digit-number').prop('disabled',true);
            $('#checkNtp').attr('disabled',true);
        }
        reloadFromController();

        axshCall( "get ntp enable", function ( out, err ) {
           if ( err ) {
                console.error( "Could not read ntp attribute: " + err );
                return;
           }        
           if (out == 0){
               $("#checkNtp").attr("checked",false);
               $('#editNtp').attr('disabled',true);
               disableDateTime(false);
           }else{
               $("#checkNtp").attr("checked",true);
               $('#editNtp').attr('disabled',false);
               disableDateTime(true);
           }              
        });
        axshCall( "get ntp server", function ( out, err ) {
           if ( err ) {
                console.error( "Could not read ntp attribute: " + err );
                return;
           }        
           $('#editNtp').val(out);
        });
    });
});
