require([ '/js/api.js','/js/lib/underscore.js', '/js/lib/jquery.js','/js/util.js','/js/scheduler.js'], function ( api,_,$,util,scheduler) {
    //display operator list
    var CURRENTOPERATOR;
    var OPERATORS;
    var USERACCESS = $.cookie('userAccess');
    //get operator and display operator list
    function loadOperator(operator){
        //clear scheduler call operator
        scheduler.remove({cmd:'operators --json'})
        scheduler.add(sec(3),{
            cmd:'operators --json',
            callOnDiff:true,
            onSuccess:function(o){
                $('#operator_list').empty();
                OPERATORS = $.parseJSON(o.ajaxdata).operators;
                //if new operator was added successfully, should update operator cookie for other pages
                $.removeCookie('operatorCook', { path: '/' });
                $.cookie('operatorCook', JSON.stringify(OPERATORS), { expires: 7, path: '/' });
                if(OPERATORS.length>0){
                    var html= '<table class="type1">';
                    html += '<tr><th>Operator Name</th><th>Description</th><th></th></tr>';
                    $.each(OPERATORS,function(i, operator){
                        html += '<tr class="op_row" operator-id="'+operator.SysName+'"><td>'+operator.SysName+'</td><td>'+operator.FullName+'</td>' +
                        '<td><div class="icon error op_del_btn" operator-id="'+operator.SysName+'" title="Delete Operator"></div></td></tr>';
                    })
                    html += '</table>';
                    $('#operator_list').append(html);

                    //get user operator and display
                    if($.cookie('currentOperator') == null || $.cookie('currentOperator') === undefined){
                        console.log("hello")
                        loadUserOperator($('tr.op_row').first().attr('operator-id'));
                        $('tr.op_row').first().addClass('clicked');
                        $('tr.op_row').first().find('.op_edit_btn').removeClass('edit').addClass('editwhite');
                        CURRENTOPERATOR = $('tr.op_row').first().attr('operator-id');
                        console.log($('tr.op_row').first().attr('operator-id'))
                        $.cookie('currentOperator', CURRENTOPERATOR, { expires: 7, path: '/' });
                        $('#useroperator_name').text(_.findWhere(OPERATORS,{"SysName":CURRENTOPERATOR}).FullName);
                    }else{
                        CURRENTOPERATOR = $.cookie('currentOperator');
                        $('tr.op_row[operator-id="'+CURRENTOPERATOR+'"]').addClass('clicked');
                        $('tr.op_row[operator-id="'+CURRENTOPERATOR+'"]').find('.op_edit_btn').removeClass('edit').addClass('editwhite');
                        loadUserOperator(CURRENTOPERATOR);
                    }
                    if(USERACCESS !="superuser"){
                        $('.op_edit_btn').addClass('disabled');
                        $('.op_del_btn').addClass('disabled');
                        $('#add-user-button').addClass('disabled');
                    }else{
                        $('#add-user-button').removeClass('disabled');
                    }
                }else{
                    $('#add-user-button').addClass('disabled');
                    $('#useroperator_name').text("");
                    $('#user_operator_list').empty();
                }
            },
            onError:function(err){
                axellPopUp(err.errorThrown);
            }
        })
    }
    //get user operator and display
    function loadUserOperator(operator){
        $('#useroperator_name').text(_.findWhere(OPERATORS,{"SysName":operator}).FullName);
        scheduler.add(sec(3),{
        //api.exe({
            cmd:'GET USEROPERATOR '+operator +' --json',
            callOnDiff:true,
            onSuccess:function(o){
                $('#user_operator_list').empty();
                var userOperatorList = $.parseJSON(o.ajaxdata).users;
                //update userAccess cookie if new user is added
                /*
                if(USERACCESS != "superuser" ) {
                    var access = _.findWhere(userOperatorList, {"userName": sessionStorage.getItem('username')}).access;
                    $.removeCookie('userAccess', { path: '/' });
                    $.cookie('userAccess', access, { expires: 7, path: '/' });
                }
                */
                if(userOperatorList.length>0) {
                    var html = '<table class="type1">';
                    html += '<tr><th rowspan="2">User Name</th><th colspan="2">Access</th><th></th></tr>';
                    html += '<tr><th>RO</th><th>RW</th><th></th></tr>';
                    $.each(userOperatorList,function(i, user){
                        html+= '<tr><td>'+user.userName+'</td>';
                        if(user.access === "RO"){
                            html+= '<td><input id= "'+user.userName+'_RO" name ="'+user.userName+'_access" data-username="'+user.userName+'" class="access" type="radio" value="RO" checked="checked"></td>'+
                                '<td><input id= "'+user.userName+'_RW" name ="'+user.userName+'_access" data-username="'+user.userName+'" class="access" type="radio" value="RW"></td>';
                        }else if(user.access === "RW"){
                            html+='<td><input id= "'+user.userName+'_RO" name ="'+user.userName+'_access" data-username="'+user.userName+'" class="access" type="radio" value="RO" ></td>'+
                            '<td><input id= "'+user.userName+'_RW" name ="'+user.userName+'_access" data-username="'+user.userName+'" class="access" type="radio" value="RW" checked="checked"></td>';
                        }
                        //if(user.web==="YES"){
                        //    html+='<td><input id= "'+user.userName+'_web" data-username="'+user.userName+'" class ="webaccess" name ="webaccess" type="checkbox" value="webaccess" checked="checked"></td>';
                        //}else{
                        //    html+='<td><input id= "'+user.userName+'_web" data-username="'+user.userName+'" class ="webaccess" name ="webaccess" type="checkbox" value="webaccess"></td>';
                        //}
                        html+= '<td><div class="icon edit user_edit_btn" user-id="'+user.userName+'" title="Reset password"></div>' +
                            '<div class="icon error user_del_btn" user-id="'+user.userName+'" title="Delete user"></div></td></tr>'
                    })
                    html += '</table>';
                    $('#user_operator_list').append(html);
                    if(USERACCESS !="superuser"){
                        $('.user_edit_btn').addClass('disabled');
                        $('.user_del_btn').addClass('disabled');
                        $('input.access').attr("disabled", true);
                        $('#add-user-button').addClass('disabled');
                        $('input[name="webaccess"]').attr("disabled", true);
                    }
                }
            },
            onError:function(err){
                axellPopUp(err.errorThrown);
            }
        })
    }

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

    $(document).ready(function() {
        //highlight wizard steps
        $('#user_web_access').hide();
        $('.wizard-step').removeClass('highlighted');
        $('#wizard-start').addClass('highlighted');
        $('#wizard-operator').addClass('highlighted');
        $('#next').click(function(){
            window.location.href = "/target/rfsettings";
        })
        loadOperator();
        if(USERACCESS != 'superuser'){
            $('#add-op-button').addClass('disabled');
            $('#add-user-button').addClass('disabled');
        }
        // operator table row on click --> display userlist of that operator
        $(document).on('click','tr.op_row',function(){
            $('tr.op_row').removeClass('clicked');
            $('tr.op_row').find('.op_edit_btn').removeClass('editwhite').addClass('edit');
            $(this).addClass('clicked');
            $(this).find('.op_edit_btn').removeClass('edit').addClass('editwhite');
            $.removeCookie('currentOperator',{ path: '/' });
            $.cookie('currentOperator', $(this).attr('operator-id'), { expires: 7, path: '/' });
            CURRENTOPERATOR = $(this).attr('operator-id');
            //clear scheduler polling for user name
            $.each(OPERATORS,function(i, operator){
                scheduler.remove({cmd:'GET USEROPERATOR '+operator.SysName +' --json'});
            })
            //load operator user table
            loadUserOperator( $(this).attr('operator-id'));
        })

        //delete user
        $(document).on('click', '.user_del_btn',function(){
            var $this = $(this);
            if(!$this.hasClass('disabled')) {
                axellConfirm("info","Notice","Are you sure you want to delete user " + $(this).attr('user-id'), function () {
                    api.exe({
                        cmd: 'ACT USEROPERATOR REMOVE ' + $this.attr('user-id') + ' ' + CURRENTOPERATOR,
                        onSuccess: function () {
                            api.exe({
                                cmd: 'act USERDEL ' + $this.attr('user-id'),
                                onSuccess: function () {
                                    loadUserOperator(CURRENTOPERATOR);
                                },
                                onError:function(err){
                                    axellPopUp(err.errorThrown);
                                    //if failed to delete from linux layer, just add the user back in
                                    api.exe({
                                        cmd: 'act USEROPERATOR ADD ' + $this.attr('user-id') + ' ' + CURRENTOPERATOR + ' RO',
                                        onSuccess: function () {
                                            loadUserOperator(CURRENTOPERATOR);
                                        },
                                        onError:function(err){
                                            axellPopUp(err.errorThrown);
                                        }
                                    })
                                }
                            })
                        },
                        onError:function(err){
                            axellPopUp(err.errorThrown);
                        }
                    })
                })
            }
        })

        //update user's access right by clickiong on radio button
        $(document).on('change', '.access',function(){
            var $this = $(this);
            if(!$this.hasClass('disabled')) {
                var username = $this.data('username');
                if ($(this).val() === "RW") {
                    axellConfirm("info","Notice","Are you sure you want to promote user:" + username+" to have read and write access?", function () {
                        api.exe({
                            cmd: 'ACT USEROPERATOR PROMOTE ' + username + ' ' + CURRENTOPERATOR,
                            onSuccess: function () {
                                loadUserOperator(CURRENTOPERATOR);
                            },
                            onError:function(err){
                                axellPopUp(err.errorThrown);
                            }
                        })
                    },function(){
                        //reset checkbox
                        $('input:radio[name='+username+'_access][value=RO]').prop('checked', true);
                    })
                } else if ($(this).val() === "RO") {
                    axellConfirm("info","Notice","Are you sure you want to demote this user: " + username+" to read-only access?", function () {
                        api.exe({
                            cmd: 'ACT USEROPERATOR DEMOTE ' + username + ' ' + CURRENTOPERATOR,
                            onSuccess: function () {
                                loadUserOperator(CURRENTOPERATOR);
                            },
                            onError:function(err){
                                axellPopUp(err.errorThrown);
                            }
                        })
                    },function(){
                        //reset checkbox
                        $('input:radio[name='+username+'_access][value=RW]').prop('checked', true);
                    })
                }
            }
        })



        $('#add_operator_dialog').hide();
        $('#add_user_dialog').hide();
        $('#reset_password_dialog').hide();
        $('#add-op-button').click(function(){
            if(!$(this).hasClass('disabled')) {
                $('#add_operator_dialog').dialog('open');
            }
        })
        $('#add_operator_dialog').dialog({
            width : 500,
            resizable : false,
            autoOpen : false,
            open:function(){
                //refresh dialog when open
                $('#add_operator_dialog input[type="text"]').val("");
            },
            buttons:{
                'Cancel': function () {
                    $('#add_operator_dialog').dialog( 'close' );
                },
                'Add' : function () {
                    if($('#operator_name').val()==="" || !util.validateUser($('#operator_name').val())){
                        axellPopUp("Please fill in a valid operator name");
                    }else if($('#operator_desc').val()===""){
                        axellPopUp("Please fill in new operator description");
                    }else if($('#operator_desc').val().endsWith("_rw") || $('#operator_desc').val().endsWith("_ro")){
                        axellPopUp("Operator Name cannot end with _rw or _ro");
                    }
                    else{
                        api.exe({
                            cmd:'opadd '+$('#operator_name').val() +' "'+$('#operator_desc').val()+'"',
                            onSuccess:function(){
                                $('#add_operator_dialog').dialog( 'close' );
                                CURRENTOPERATOR = $('#operator_name').val();
                                $.removeCookie('currentOperator',{ path: '/' });
                                $.cookie('currentOperator', CURRENTOPERATOR, { expires: 7, path: '/' });
                                loadOperator($('#operator_name').val());
                                //axellPopUp("Operator has been added successfully. Please go to RF Setting and Quota Management page to update RF and quota allocation for that operator");
                            },
                            onError:function(err){
                                axellPopUp(err.errorThrown);
                            }
                        })
                    }
                }
            }
        })
        
        //delete operator
        $(document).on('click', '.op_del_btn',function(){
            var $this = $(this);
            if(!$this.hasClass('disabled')) {
                axellConfirm("alert","Warning","You are about to delete an operator from the system, this is a non-reversible operation, all users " +
                    "that are associated with this operator will also be deleted.<br><br> Do you want to continue to delete operator " + $this.attr('operator-id')+"?", function () {
                    axellConfirm("alert","Warning","Are you really sure that you want to delete operator " + $this.attr('operator-id')+"?", function () {
                        api.exe({
                            cmd: 'opdel ' + $this.attr('operator-id') + ' -f',
                            onSuccess: function () {
                                scheduler.remove({cmd: 'GET USEROPERATOR ' + $this.attr('operator-id') + ' --json'});
                                $.removeCookie('currentOperator', { path: '/' });
                                loadOperator();
                            },
                            onError: function (err) {
                                axellPopUp(err.errorThrown);
                            }
                        })
                    })
                })
            }
        })

        $('#add-user-button').click(function(){
            if(!$(this).hasClass('disabled')) {
                $('#add_user_dialog').dialog('open');
            }
        })
        $('#add_user_dialog').dialog({
            width : 500,
            resizable : false,
            autoOpen : false,
            open:function(){
                //refresh dialog when open
                $('#add_user_dialog input[type="text"],#add_user_dialog input[type="password"]').val("");
                //$('#add_user_dialog input[name="access"]').prop('checked', false);
                //$('#add_user_dialog input[name="webaccess"]').prop('checked', false)
            },
            buttons:{
                'Cancel': function () {
                    $('#add_user_dialog').dialog( 'close' );
                },
                'Add' : function () {
                    if($('#username').val()==="" || !util.validateUser($('#username').val())){
                        axellPopUp("Please fill in a valid username");
                    }else if($('#passwd').val()==="" || !util.validatePassword($('#passwd').val()) || !ValidPassword($('#passwd').val())){
                        axellPopUpWithTitle("Invalid password","Password should be 8-25 characters long, only contain [a-z0-9.:;!+()-_], contain a least 1 cap letter, contain a least 1 digit");
                    }else if($('#passwd').val() != $('#passwd2').val()){
                        axellPopUp('Password and confirmed password do not match');
                    }else if($('input[name="access"]:checked').val() ==""){
                        axellPopUp('Please select the access right for user');
                    }else if(CURRENTOPERATOR ===''||CURRENTOPERATOR ===undefined || CURRENTOPERATOR ===null){
                        axellPopUp('Please select a operator');
                    }else{
                        console.log($('input[name="access"]:checked').val());
                        api.exe({
                            cmd:'act useradd '+$('#username').val(),
                            onSuccess:function(){
                                api.exe({
                                    cmd:'act password '+$('#username').val() +' '+$('#passwd').val(),
                                    onSuccess:function() {
                                        api.exe({
                                            cmd: 'act USEROPERATOR ADD ' + $('#username').val() + ' ' + CURRENTOPERATOR + ' ' + $('input[name="access"]:checked').val(),
                                            onSuccess: function () {
                                                if ($('#user_web_access').is(':checked')) {
                                                    api.exe({
                                                        cmd: 'act userpromote ' + $('#username').val() + ' -web ',
                                                        onSuccess: function () {
                                                            loadUserOperator(CURRENTOPERATOR);
                                                            $('#add_user_dialog').dialog('close');
                                                        },
                                                        onError:function(err){
                                                            axellPopUp(err.errorThrown);
                                                            return false;
                                                        }
                                                    })
                                                } else {
                                                    loadUserOperator(CURRENTOPERATOR);
                                                    $('#add_user_dialog').dialog('close');
                                                }
                                            },
                                            onError:function(err){
                                                axellPopUp(err.errorThrown);
                                                //if fail at this stage, should remove the user from linux layer as well
                                                api.exe({
                                                    cmd: 'act USERDEL ' + $('#username').val(),
                                                    onSuccess: function () {
                                                    },
                                                    onError:function(err){
                                                        axellPopUp(err.errorThrown);
                                                    }
                                                })
                                                return false;
                                            }
                                        })
                                    },
                                    onError:function(err){
                                        axellPopUp(err.errorThrown);
                                        //if fail at this stage, should remove the user from linux layer as well
                                        api.exe({
                                            cmd: 'act USERDEL ' + $('#username').val(),
                                            onSuccess: function () {
                                            },
                                            onError:function(err){
                                                axellPopUp(err.errorThrown);
                                            }
                                        })
                                        return false;
                                    }
                                })
                            },
                            onError:function(err){
                                axellPopUp(err.errorThrown);
                                return false;
                            }
                        })
                    }
                }
            }
        })

        $(document).on('click','.user_edit_btn',function(){
            var username = $(this).attr('user-id');
            if(!$(this).hasClass('disabled')) {
                $('#reset_password_dialog').dialog({
                    width: 500,
                    resizable: false,
                    autoOpen: false,
                    buttons: {
                        'Cancel': function () {
                            $('#reset_password_dialog').dialog('close');
                        },
                        'Change': function () {
                            if ($('#reset_passwd').val() === "" || !util.validatePassword($('#reset_passwd').val()) || !ValidPassword($('#reset_passwd').val())) {
                                axellPopUpWithTitle("Invalid password","Password should be 8-25 characters long, only contain [a-z0-9.:;!+()-_], contain a least 1 cap letter, contain a least 1 digit");
                            } else if ($('#reset_passwd').val() != $('#reset_passwd2').val()) {
                                axellPopUp('Password and confirmed password are not matched');
                            } else {
                                api.exe({
                                    cmd: 'act password ' + username + ' ' + $('#reset_passwd').val(),
                                    onSuccess: function () {
                                        loadUserOperator(CURRENTOPERATOR);
                                        $('#reset_password_dialog').dialog('close');
                                        axellPopUp("Password of " + username + " has been changed");
                                    },
                                    onError: function (err) {
                                        axellPopUp(err.errorThrown);
                                    }
                                })
                            }
                        }
                    }
                })
                $('#reset_password_dialog').dialog('open');
            }
        })
    });
});

