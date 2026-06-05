require([ '/js/api.js','/js/lib/underscore.js', '/js/lib/jquery.js' ], function ( api,_,$) {
    $(document).ready(function() {
        var USERNAME = $.cookie('username');
        $('#reset_password_dialog').hide();
        if(USERNAME != undefined || USERNAME !="") {
            $('#username').text(USERNAME);
        }else{
            api.exe({
                cmd:username,
                onSuccess:function(o){
                    $('#username').text(o.ajaxdata);
                }
            })
        }
        $('#passwd-button').click(function(){
            $('#reset_password_dialog').dialog('open');
        })
        $('#reset_password_dialog').dialog({
            width : 500,
            resizable : false,
            autoOpen : false,
            buttons:{
                'Cancel': function () {
                    $('#reset_password_dialog').dialog( 'close' );
                },
                'Reset' : function () {
                    if($('#reset_passwd').val()==="" || $('#reset_passwd').val().length<5){
                        axellPopUp("Please fill in valid password");
                    }else if($('#reset_passwd').val() != $('#reset_passwd2').val()) {
                        axellPopUp('Password and confirmed password are not matched');
                    }else{
                        api.exe({
                            cmd:'act password '+USERNAME +' '+$('#reset_passwd').val(),
                            onSuccess:function() {
                                $('#reset_password_dialog').dialog('close');
                                axellPopUp("Password of "+username+" has been changed" );
                            },
                            onError:function(err){
                                axellPopUp(err.errorThrown);
                            }
                        })
                    }
                }
            }
        })

    });
});

