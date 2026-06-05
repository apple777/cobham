require([ '/js/api.js','/js/util.js' ], function ( api,util ) {
    //**This is a global variable for this file that holds the current username. it is assigned at first page load.
    var currUsername=null;

    function ValidPassword(password){
      var validLength = true;
      var validLetter = false;
      var validNumber = false;
      if (password.length < 8)
         validLength = false;
      for(var i = 0; i < password.length; i++){
         if (password[i] >= 'A' && password[i] <= 'Z'){
            validLetter = true;
            break;
         }
      }
      for(var i = 0; i < password.length; i++){
         if (password[i] >= '0' && password[i] <= '9'){
            validNumber = true;
            break;
         }
      }
      return(validLength && validLetter && validNumber);
    }

    /**
     * Called when change password button is pressed
     */
    function onChangePassword(){
        var oldPass=$("input#oldpassword").val();
        var newPass=$("input#newpassword").val();
        var newPassRep=$("input#newpasswordrep").val();
        if(currUsername === "sysadmin"){
            if (newPass != newPassRep) {
                axellPopUp("The passwords don't match. Please make sure you type the same thing in both boxes.");
                return;
            } else if (newPass === "" || !util.validatePassword(newPass) || !ValidPassword(newPass)) {
                axellPopUpWithTitle("Invalid password","Password should be 8-25 characters long, only contain [a-z0-9.:;!+()-_], contain a least 1 cap letter, contain a least 1 digit");
                return;
            } else {
                api.exe({
                    cmd: 'act password ' + currUsername + ' ' + newPass,
                    onSuccess: function () {
                        //axellPopUp("Password changed successfully!");
                    },
                    onError: function (err) {
                        axellPopUp(err.errorThrown);
                    }
                })
            }
        }else {
            if (newPass != newPassRep) {
                axellPopUp("The passwords don't match. Please make sure you type the same thing in both boxes.");
                return;
            } else if (oldPass === "") {
                axellPopUp("Please fill in your old password");
                return;
            } else if (newPass === "" || !util.validatePassword(newPass) || !ValidPassword(newPass)) {
                axellPopUpWithTitle("Invalid password","Password should be 8-25 characters long, only contain [a-z0-9.:;!+()-_], contain a least 1 cap letter, contain a least 1 digit");
                return;
            } else {
                api.exe({
                    cmd: "web_passwd " + oldPass + " " + newPass,
                    onSuccess: function (out) {
                        //axellPopUp("Password changed successfully!");
                        //window.location.href = '/logout';
                    },
                    onError: function (err) {
                        axellPopUp(err.errorThrown);
                    }
                })
            }
        }
        /*
        if(!/^\w*$/.test(newPass)){
            if(!confirm("Password contains non-alphanumerical characters. It may be hard to type this password in certain keyboards. Are you sure you want to continue?"))return;
        }
        */
    }



    /**
     * Runs when the page finished loading and is ready.
     */
    $(document).ready(function(e) {
        axshCall("username",function(out,err){
            if(err){
                axellPopUp("Could not get the name of the current user. Please refresh the page. "+err);
            }else{
                currUsername=out;
                $("span#currentUsername").text(currUsername);
                if(currUsername === "sysadmin") {
                    $('#oldpasswd_field').hide();
                }
            }
        });
        $( '#apply-button' ).click( onChangePassword );
    });
});

