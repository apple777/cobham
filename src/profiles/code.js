require([ '/js/api.js', '/js/convert.js', '/js/console.js', '/js/lib/underscore.js', '/js/lib/jquery.js','/js/convert.js','/js/util.js','/js/lib/d3.min.js','/js/scheduler.js','/js/lib/jquery-ui.js','/js/lib/jquery_cookie.js'],
    function (api, convert, console, _, $,convert,util,d3,scheduler) {
        var profileNameList =[];
        var rfrouteProfileList;
        var OPERATORLIST = $.parseJSON($.cookie('operatorCook'));
        var user_name = $.cookie('username');
        var ACTIVEPROFILE =[];
        var USERACCESS = $.cookie('userAccess');
        var scheduleList =[];
        var profileFlag=[];

         function setSaveProfileFlag(str){
          var operator = $('#operator_name').val();
          var command = "saveprofileflag -o " + operator + " '" + str+"'";
          api.exe({
            cmd: command,
            dataType: 'text',
            async: false,
            onSuccess: function (o) {
               console.log(o.ajaxdata);
            }
           })
         }

         function getSavedProfileFlag(){
           profileFlag.length = 0;
           var operator = $('#operator_name').val();
           if (operator == "all")
               return;
           var command = "getprofileflag -o " + operator;
           api.exe({
               cmd: command,
               dataType: 'json',
               async: false,
               onSuccess: function (o) {
                   $.each(o.ajaxdata.nodes, function (i, top) {
                       profileFlag[i] = top;
                 })
               }
           })
         }

         function ReloadProfileFlag(){
            $('#advanced-btn').hide();
            $('.advanced').hide();
            /*if ($('#operator_name').val() == "all"){
               $('#advanced-btn').hide();
               $('.advanced').hide();
            }else{
               $('#advanced-btn').show();
               if($('#advanced-btn').attr('flag') === "false")
                  $('.advanced').show();
            }*/
            getSavedProfileFlag();
            if (profileFlag.length == 0)            
               document.getElementById("checkroutingscheduler").checked = false;
            else
               document.getElementById("checkroutingscheduler").checked = profileFlag[0]['checked'];
            if (document.getElementById("checkroutingscheduler").checked)
               $('.ok_disabled').attr('disabled', true);
            else
               $('.ok_disabled').attr('disabled', false);
         }


        //this is to get current date for profile schedule
        Date.prototype.getWeek = function(start)
        {
            //Calcing the starting point
            start = start || 0;
            var today = new Date();
            today.setHours(0, 0, 0, 0);
            var day = today.getDay() - start;
            var date = today.getDate() - day;
            console.log("today is "+today);
            // Grabbing Start/End Dates
            var StartDate = new Date(today.setDate(date));
            var dayOfWeek = new Array(14);
            dayOfWeek[0]=  StartDate;
            dayOfWeek[1] = new Date();
            dayOfWeek[1].setDate(date + 1);
            dayOfWeek[2] = new Date();
            dayOfWeek[2].setDate(date + 2);
            dayOfWeek[3] = new Date();
            dayOfWeek[3].setDate(date + 3);
            dayOfWeek[4] = new Date();
            dayOfWeek[4].setDate(date + 4);
            dayOfWeek[5] = new Date();
            dayOfWeek[5].setDate(date + 5);
            dayOfWeek[6] = new Date();
            dayOfWeek[6].setDate(date + 6);
            dayOfWeek[7] = new Date();
            dayOfWeek[7].setDate(date + 7);
            dayOfWeek[8] = new Date();
            dayOfWeek[8].setDate(date + 8);
            dayOfWeek[9] = new Date();
            dayOfWeek[9].setDate(date + 9);
            dayOfWeek[10] = new Date();
            dayOfWeek[10].setDate(date + 10);
            dayOfWeek[11] = new Date();
            dayOfWeek[11].setDate(date + 11);
            dayOfWeek[12] = new Date();
            dayOfWeek[12].setDate(date + 12);
            dayOfWeek[13] = new Date();
            dayOfWeek[13].setDate(date + 13);
            console.log(dayOfWeek);
            return dayOfWeek;

        }
        var Dates = new Date().getWeek();

        //turn off for: Continue to remember from profiles to routing.
        //$.removeCookie('currentOperator');
        //refresh operator cookie
        //$.removeCookie('currentOperator', { path: '/' });
        $.removeCookie('mode', { path: '/' });
        $(document).ready(function(){

            $("#checkroutingscheduler").click(function(e){	
               if (document.getElementById("checkroutingscheduler").checked)
                  $('.ok_disabled').attr('disabled', true);
               else
                  $('.ok_disabled').attr('disabled', false);
               var obj=[];
               obj[0]={checked:document.getElementById("checkroutingscheduler").checked};
               var str = JSON.stringify(obj);
               setSaveProfileFlag(str);
            })

            $( '#new_profile_dialog').hide();
            $( '#copyToNew_profile_dialog').hide();
            $('#add_schedule_dialog').hide();
            $('#activate_profile').hide();
            $('#error_activate_profile').hide();
            // TODO: This should only be done for user that is sysadmin...
            //if neutral hsot then display all
            if(OPERATORLIST.length >1){
                $('#operator_name').append($('<option>', {
                    value: 'all',
                    text : 'All'
                }));
            }
            $.each(OPERATORLIST, function (key, value) {
                $('#operator_name').append($('<option>', {
                    value: value.SysName,
                    text : value.FullName
                }));
            });

            setTimeout(function(){ReloadProfileFlag();}, 1000);            

            //if there is current operator found in cookie, update operator select to be current operator
            if($.cookie('currentOperator') !=null) {
                $('#operator_name option[value=' + $.cookie('currentOperator') + ']').attr("selected", "selected");
            }else{
                $('#operator_name option[value=' + OPERATORLIST[0].SysName + ']').attr("selected", "selected");
                $.cookie('currentOperator', $('#operator_name').val(), { expires: 7, path: '/' });
            }

            //if user is read only, disabled all functionalities
            $.each(OPERATORLIST, function(key, value){
                if(value.SysName === $('#operator_name').val() && USERACCESS ==="RO"){
                    $('#newRouteBtn').addClass('disabled');
                    $('#add_schedule').addClass('disabled');
                }else if($('#operator_name option:selected').val() === 'all'){
                    $('#newRouteBtn').addClass('disabled');
                    $('#newRouteBtn').attr('title', "Please choose the operator");
                }
            })

            // Build table at startup
            buildProfileTable($('#operator_name > option:selected'));
            //buildScheduleTable($('#operator_name > option:selected'));

            $('#operator_name').change(function(){

               ReloadProfileFlag();

                $('#newRouteBtn').removeClass('disabled');
                $('.editBtn').removeClass('disabled');
                $('.copyToNewBtn').removeClass('disabled');
                $('.edit')
                $('#routing_content').empty();
                $('.svg').empty();
                $('#tag').empty();

                if($('#operator_name').val() != 'all') {
                    $('#operator_name > option').each(function() {
                        if($(this).val() != 'all') {
                            scheduler.remove({cmd: "rfschedule -o " + $(this).val() + " --json"});
                            scheduler.remove({cmd: "RFROUTE -o " + $(this).val() + " PROFILES --json"});
                        }
                    })
                    buildProfileTable($('#operator_name option:selected'));
                    //buildScheduleTable($('#operator_name option:selected'));
                    $.removeCookie('currentOperator',{ path: '/' });
                    $.cookie('currentOperator', $('#operator_name').val() , { expires: 7, path: '/' });
                    $.each(OPERATORLIST, function(key, value){
                        if(value.SysName === $('#operator_name').val() && USERACCESS==="RO"){
                            $('#newRouteBtn').addClass('disabled');
                        }
                    })
                } else {
                    $('#operator_name > option').each(function() {
                        if($(this).val() != 'all') {
                            scheduler.remove({cmd: "rfschedule -o " + $(this).val() + " --json"});
                            scheduler.remove({cmd: "RFROUTE -o " + $(this).val()+ " PROFILES --json"});
                            buildProfileTable($(this));
                            //buildScheduleTable($(this));
                        }
                    });
                    $.each(OPERATORLIST, function(key, value){
                        if(value.SysName === $('#operator_name').val() && USERACCESS ==="RO"){
                            $('#newRouteBtn').addClass('disabled');
                        }
                    })
                    $('#newRouteBtn').removeClass('enabled').addClass('disabled');
                }
            });

            $('#advanced-btn').click(function(){
                if($(this).attr('flag') === "true") {
                    $(this).attr('flag', false);
                    $('.advanced').show();
                    $(this).text("Hide advanced settings");
                }else{
                    $(this).attr('flag', true);
                    $('.advanced').hide();
                    $(this).text("Show advanced settings");
                }
            })

            $('#reActivateBtn').click(function(){
               $('.ok').click();
            })

            //click on icon ok --> activate same route
            $(document).on('click','.ok',function(){
                if(!$(this).hasClass('disabled')) {
                    var $this = $(this);
                    var profileName = $(this).parent().parent().find("td:nth-child(2)").text();
                    if(profileName == 'disabled'){
                        warning = "Are you sure you want to disable routing profile?";
                    }else{
                        warning = "Are you sure you want to enable same routing profile?";
                    }
                    axellConfirm("alert","Warning",warning, function () {
                        var activateProfileDialog = $('#activate_profile').dialog({
                            width: 300,
                            resizable: false,
                            autoOpen: false,
                            modal:true,
                            open:function(event, ui){
                                $(".ui-dialog-titlebar-close").hide();
                            }
                        })
                        activateProfileDialog.dialog('open');
                        api.exe({
                           cmd: "mtdi_mute 3",
                           dataType: 'text',
                           async: false,
                              onSuccess: function (o) {
                                 console.log(o.ajaxdata);
                              }
                        })
                        api.exe({
                            cmd: 'RFROUTE -o ' + $this.attr('operator-id') + ' ' + profileName + ' ACTIVATE',
                            //cmd: 'add_route_to_rcd_queue ' + $this.attr('operator-id') + ' ' + profileName + " --json",
                            onSuccess: function (o) {
                                if (o.ajaxdata.substring(o.ajaxdata.indexOf("Result Code:") + 13, o.ajaxdata.indexOf("Result Code:") + 14) == "0") {
                                    //make this update wait for 3 secons
                                    setTimeout(function () {
                                        //all and rebuild profile table
                                        $('#routing_content').empty();
                                        if ($('#operator_name').val() != 'all') {
                                            $('#operator_name > option').each(function () {
                                                if ($(this).val() != 'all') {
                                                    scheduler.remove({cmd: "rfschedule -o " + $(this).val() + " --json"});
                                                    scheduler.remove({cmd: "RFROUTE -o " + $(this).val() + " PROFILES --json"});
                                                }
                                            })
                                            //buildScheduleTable($('#operator_name option:selected'));
                                            buildProfileTable($('#operator_name option:selected'));
                                            $.each(OPERATORLIST, function (key, value) {
                                                if (value.SysName === $('#operator_name').val() && USERACCESS === "RO") {
                                                    $('#newRouteBtn').addClass('disabled');
                                                }
                                            })
                                        } else {
                                            $('#operator_name option').each(function () {
                                                if ($(this).val() != 'all') {
                                                    scheduler.remove({cmd: "rfschedule -o " + $(this).val() + " --json"});
                                                    scheduler.remove({cmd: "RFROUTE -o " + $(this).val() + " PROFILES --json"});
                                                    buildProfileTable($(this));
                                                    //buildScheduleTable($(this));
                                                }
                                            });
                                            $.each(OPERATORLIST, function (key, value) {
                                                if (value.SysName === $('#operator_name').val() && USERACCESS === "RO") {
                                                    $('#newRouteBtn').addClass('disabled');
                                                }
                                            })
                                            $('#newRouteBtn').removeClass('enabled').addClass('disabled');
                                        }
                                        api.exe({
                                          cmd: "mtdi_mute 1",
                                          dataType: 'text',
                                          async: false,
                                             onSuccess: function (o) {
                                                console.log(o.ajaxdata);
                                             }
                                        })
                                        activateProfileDialog.dialog('close');
                                    }, 20000)
                                } else {
                                    activateProfileDialog.dialog('close');
                                    $('#error_activate_profile').dialog({
                                        width: 450,
                                        resizable: false,
                                        autoOpen: false,
                                        buttons: {
                                            'Close': function () {
                                                $('#error_activate_profile').dialog('close');
                                            }
                                        },
                                        open: function () {
                                            $('#more').click(function () {
                                                $('#detailed').empty();
                                                var details = o.ajaxdata.split(new RegExp(/\#/g));
                                                var html = '<ul>';
                                                $.each(details, function (i, detail) {
                                                    if (detail != "") {
                                                        html += '<li>' + detail + '</li>';
                                                    }
                                                })
                                                html += '</ul>'
                                                $('#detailed').append(html);
                                            })
                                        }
                                    })
                                    api.exe({
                                       cmd: "mtdi_mute 1",
                                       dataType: 'text',
                                       async: false,
                                          onSuccess: function (o) {
                                             console.log(o.ajaxdata);
                                          }
                                    })
                                    $('#error_activate_profile').dialog('open');
                                }
                            },
                            onError: function (err) {
                                activateProfileDialog.dialog('close');
                                axellPopUp(err.errorThrown);
                            },
                            //timeout to 2 minute in case that large system
                            timeout: 120000
                        })
                    },function(){
                        $( "input[class$='ok']" ).prop('checked', true);
                        $( "input" ).css('outline', 'none');
                    })
                }
            })

            //click on icon ok_disabled --> activate that route
            $(document).on('click','.ok_disabled',function(){
                if(!$(this).hasClass('disabled')) {
                    var $this = $(this);
                    var profileName = $(this).parent().parent().find("td:nth-child(2)").text();
                    if(profileName == 'disabled'){
                        warning = "Are you sure you want to disable routing profile?";
                    }else{
                        warning = "Are you sure you want to enable new routing profile?";
                    }
                    axellConfirm("alert","Warning",warning, function () {
                        var activateProfileDialog = $('#activate_profile').dialog({
                            width: 300,
                            resizable: false,
                            autoOpen: false,
                            modal:true,
                            open:function(event, ui){
                                $(".ui-dialog-titlebar-close").hide();
                            }
                        })
                        activateProfileDialog.dialog('open');
                        api.exe({
                           cmd: "mtdi_mute 3",
                           dataType: 'text',
                           async: false,
                              onSuccess: function (o) {
                                 console.log(o.ajaxdata);
                              }
                        })
                        api.exe({
                            cmd: 'RFROUTE -o ' + $this.attr('operator-id') + ' ' + profileName + ' ACTIVATE',
                            //cmd: 'add_route_to_rcd_queue ' + $this.attr('operator-id') + ' ' + profileName + " --json",
                            onSuccess: function (o) {
                                if (o.ajaxdata.substring(o.ajaxdata.indexOf("Result Code:") + 13, o.ajaxdata.indexOf("Result Code:") + 14) == "0") {
                                    //make this update wait for 3 secons
                                    setTimeout(function () {
                                        //all and rebuild profile table
                                        $('#routing_content').empty();
                                        if ($('#operator_name').val() != 'all') {
                                            $('#operator_name > option').each(function () {
                                                if ($(this).val() != 'all') {
                                                    scheduler.remove({cmd: "rfschedule -o " + $(this).val() + " --json"});
                                                    scheduler.remove({cmd: "RFROUTE -o " + $(this).val() + " PROFILES --json"});
                                                }
                                            })
                                            //buildScheduleTable($('#operator_name option:selected'));
                                            buildProfileTable($('#operator_name option:selected'));
                                            $.each(OPERATORLIST, function (key, value) {
                                                if (value.SysName === $('#operator_name').val() && USERACCESS === "RO") {
                                                    $('#newRouteBtn').addClass('disabled');
                                                }
                                            })
                                        } else {
                                            $('#operator_name option').each(function () {
                                                if ($(this).val() != 'all') {
                                                    scheduler.remove({cmd: "rfschedule -o " + $(this).val() + " --json"});
                                                    scheduler.remove({cmd: "RFROUTE -o " + $(this).val() + " PROFILES --json"});
                                                    buildProfileTable($(this));
                                                    //buildScheduleTable($(this));
                                                }
                                            });
                                            $.each(OPERATORLIST, function (key, value) {
                                                if (value.SysName === $('#operator_name').val() && USERACCESS === "RO") {
                                                    $('#newRouteBtn').addClass('disabled');
                                                }
                                            })
                                            $('#newRouteBtn').removeClass('enabled').addClass('disabled');
                                        }
                                        api.exe({
                                          cmd: "mtdi_mute 1",
                                          dataType: 'text',
                                          async: false,
                                             onSuccess: function (o) {
                                                console.log(o.ajaxdata);
                                             }
                                        })
                                        activateProfileDialog.dialog('close');
                                    }, 20000)
                                } else {
                                    activateProfileDialog.dialog('close');
                                    $('#error_activate_profile').dialog({
                                        width: 450,
                                        resizable: false,
                                        autoOpen: false,
                                        buttons: {
                                            'Close': function () {
                                                $('#error_activate_profile').dialog('close');
                                            }
                                        },
                                        open: function () {
                                            $('#more').click(function () {
                                                $('#detailed').empty();
                                                var details = o.ajaxdata.split(new RegExp(/\#/g));
                                                var html = '<ul>';
                                                $.each(details, function (i, detail) {
                                                    if (detail != "") {
                                                        html += '<li>' + detail + '</li>';
                                                    }
                                                })
                                                html += '</ul>'
                                                $('#detailed').append(html);
                                            })
                                        }
                                    })
                                    api.exe({
                                       cmd: "mtdi_mute 1",
                                       dataType: 'text',
                                       async: false,
                                          onSuccess: function (o) {
                                             console.log(o.ajaxdata);
                                          }
                                    })
                                    $('#error_activate_profile').dialog('open');
                                }
                            },
                            onError: function (err) {
                                activateProfileDialog.dialog('close');
                                axellPopUp(err.errorThrown);
                            },
                            //timeout to 2 minute in case that large system
                            timeout: 120000
                        })
                    },function(){
                        $( "input[class$='ok']" ).prop('checked', true);
                        $( "input" ).css('outline', 'none');
                    })
                }
            })

            $(document).on("click",'.editBtn',function(){
                if(!$(this).hasClass('disabled')){
                    var profileName = $(this).attr('id').substring(0, $(this).attr('id').indexOf("editBtn")-1);
                    $.cookie('currentOperator', $(this).closest('table').attr('operator-id'), { expires: 7, path: '/' });
                    $.cookie('mode', 'edit', { expires: 7, path: '/' });
                    window.location = '/target/routing/index.html?profile=' + profileName;
                }
            })
            $(document).on("click",'.viewBtn',function(){
                var profileName = $(this).attr('id').substring(0, $(this).attr('id').indexOf("editBtn")-1);
                $.cookie('currentOperator', $(this).closest('table').attr('operator-id'), { expires: 7, path: '/' });
                $.cookie('mode', 'view', { expires: 7, path: '/' });
                window.location = '/target/routing/index.html?profile=' + profileName;
            })
            $(document).on('click','.copyToNewBtn',function(){
                if(!$(this).hasClass('disabled')){
                    var $this = $(this);
                    var profileName = $(this).attr('id').substring(0, $(this).attr('id').indexOf("copyToNewBtn")-1);
                    var $copyToNewProfileDialog = $( '#copyToNew_profile_dialog' ).dialog({
                        width : 300,
                        resizable : false,
                        autoOpen : false,
                        modal: true,
                        buttons:{
                            'Cancel': function () {
                                $copyToNewProfileDialog.dialog( 'close' );
                            },
                            'OK' : function () {
                                var isDuplicated = false;
                                var newProfile = $('#copyToNew_profile_name').val();
                                var newTag = $('#copyToNew_tag').val();
                                $.each(profileNameList,function(key,value){
                                    if(newProfile ===value){
                                        isDuplicated=true;
                                    }
                                })
                                if(newProfile == "" || !util.validateUser(newProfile)){
                                    axellPopUp("Please fill in a valid profile name. Profile name should be 5-25 characters long and only contain [a-z0-9-_], no space and uppercase is allowed")
                                }else if (newTag == "" || !util.validateTag(newTag)){
                                    axellPopUp("Please fill in a valid profile tag. Profile name should be 0-50 characters long and only contain [a-z0-9-_], space is allowed")
                                }else {
                                    if(!isDuplicated){
                                        api.exe({
                                            cmd:'RFROUTE -o '+$this.closest('table').attr('operator-id')+' '+profileName+' COPY '+newProfile +' "'+newTag+'"',
                                            onSuccess:function(){
                                                $.cookie('currentOperator', $this.closest('table').attr('operator-id'), { expires: 7, path: '/' });
                                                $.cookie('mode', 'edit', { expires: 7, path: '/' });
                                                window.location = '/target/routing/index.html?profile='+newProfile;
                                            },
                                            onError:function(){
                                                axellPopUp('Error executing command RFROUTE COPY '+ this.errorThrown);
                                            }
                                        })
                                    }else{
                                        axellPopUp('Profile name exists, please input another name');
                                    }
                                }
                            }
                        }
                    })
                }
                $copyToNewProfileDialog.dialog( 'option', 'title', 'Copy to New Profile');
                $copyToNewProfileDialog.dialog( 'open' );
            })
            
            $(document).on("click",'.deleteBtn',function(){
               var $this = $(this);
               //var operator = $this.closest('table').attr('operator-id')
               var operator = $this.closest('table').attr('operator-id');
               var profileName = $(this).attr('id').substring(0, $(this).attr('id').indexOf("deleteBtn")-1);
               axellConfirm("alert","Warning","Do you really want to delete profile " + profileName + "?<br /><br />" +
                            "After successfully deleting profile " + profileName + " the routing profiles page will be reloaded.", function () {
                  api.exe({
                     cmd:'RFROUTE -o '+operator+' '+ profileName + ' LOCK',
                     dataType:'text',
                     onSuccess:function(o){
                        api.exe({
                           cmd: "RFROUTE -o " + operator + ' ' + profileName + " DELETE",
                           onSuccess: function () {
                              api.exe({
                                  cmd:'RFROUTE -o '+operator+' '+ profileName + ' UNLOCK',
                                  dataType:'text',
                                  async: false,
                                  onSuccess:function(o){
                                      window.location = '/target/profiles/';
                                  },
                                  onError:function(o)
                                  {
                                      window.location = '/target/profiles/';
                                  }
                              })
                           },
                           onError: function (err) {
                              axellPopUp(err.errorThrown);
                           }
                        })
                     },
                     onError:function(o)
                     {
                        displayFailedToLock();
                     }
                  })
               })
            })
            
            //tag of profile schedule
            $(document).on('mouseover','.tag',function(){
                $(this).show();
            })
            $(document).on('mouseout','.tag',function(){
                    $(this).hide();
            })
            //click on edit or delete profile schedule
            $(document).on('click','.editwhite',function(){
                //edit profile schedule
            })
            $(document).on('click','.error',function(){
                var $this = $(this);
                axellConfirm("info","Notice","Are you sure you want to delete this profile schedule? ", function(){
                    api.exe({
                        cmd:'RFSCHEDULE -o '+ $this.data('op')+' REMOVE EVENT_'+$this.data('eventid'),
                        onSuccess:function(){
                            $('#operator_name > option').each(function() {
                                if($(this).val() != 'all') {
                                    scheduler.remove({cmd: "rfschedule -o " + $(this).val() + " --json"});
                                }
                            })
                            if($('#operator_name').val() != 'all') {
                                $('#operator_name > option').each(function() {
                                    if($(this).val() != 'all') {
                                        scheduler.remove({cmd: "rfschedule -o " + $(this).val() + " --json"});
                                    }
                                })
                                buildScheduleTable($('#operator_name option:selected'));
                            } else {
                                $('#operator_name > option').each(function() {
                                    if($(this).val() != 'all') {
                                        scheduler.remove({cmd: "rfschedule -o " + $(this).val() + " --json"});
                                        buildScheduleTable($(this));
                                    }
                                });
                            }
                        },
                        onError:function(err){
                            axellPopUp(err.errorThrown);
                        }
                    })
                })
            })

            $('#newRouteBtn').on("dblclick", function(){
                if($(this).hasClass("disabled")) {
                    //axellPopUp("Hey stoopid, can't you see that this button is disabled!?");
                }
            })

            $('#newRouteBtn').on("click", function(){
                if(!$(this).hasClass("disabled")) {
                    var $newProfileDialog = $( '#new_profile_dialog' ).dialog({
                        width : 300,
                        resizable : false,
                        autoOpen : false,
                        modal: true,                        
                        buttons:{
                            'Cancel': function () {
                                $newProfileDialog.dialog( 'close' );
                            },
                            'OK' : function () {
                                var isDuplicated = false;
                                var newProfile = $('#new_profile_name').val();
                                var newTag = $('#new_tag').val();
                                var allowedChars = new RegExp("^[a-zA-Z0-9\-\_]+$");
                                $.each(profileNameList,function(key,value){
                                    if(newProfile ===value){
                                        isDuplicated=true;
                                    }
                                })
                                if(newProfile === "" || !util.validateLongUser(newProfile)){
                                    axellPopUp("Please fill in a valid profile name. Profile name should be 5-25 characters long and only contain [a-z0-9-_], no space and uppercase is allowed")
                                }else if (newTag === "" || !util.validateTag(newTag)){
                                    axellPopUp("Please fill in a valid profile tag. Profile name should be 0-50 characters long and only contain [a-z0-9-_], space is allowed")
                                }else {
                                    if(!isDuplicated){
                                        api.exe({
                                            cmd:'RFROUTE -o ' + $('#operator_name option:selected').val() + ' ' + newProfile + ' CREATE & RFROUTE -o ' + $('#operator_name option:selected').val()+' ' + newProfile +' LOCK & RFROUTE -o ' + $('#operator_name option:selected').val() + ' ' + newProfile + ' TAG "'+ newTag+'"',
                                            onSuccess:function(){
                                                $.cookie('currentOperator', $('#operator_name option:selected').val(), { expires: 7, path: '/' });
                                                $.cookie('mode', 'edit', { expires: 7, path: '/' });
                                                window.location = '/target/routing/index.html?profile=' + newProfile;
                                            },
                                            onError:function(){
                                                axellPopUp('Error executing command RFROUTE TAG '+ this.errorThrown);
                                            }
                                        })
                                    }else{
                                        axellPopUp('Profile name exists, please input another name');
                                    }
                                }
                            }
                        }
                    })
                    $newProfileDialog.dialog( 'option', 'title', 'Create New Profile');
                    $newProfileDialog.dialog( 'open' );
                }
            })

            //disable all rfschedule
            $(document).on('click','.deactivateAllSchedule',function(){
                var $this = $(this);
                var action = "";
                var cmd="";
                if($(this).attr("state") ==="active"){
                    action = "deactivate";
                }else{
                    action = "activate";
                }
                $.each(scheduleList,function(i, schedule){
                    console.log(schedule);
                    if(i != schedule.length-1) {
                        cmd += "rfschedule -o " + $this.data('operatorid') + " " + action + " EVENT_" + schedule.Event +" & ";
                    }else{
                        cmd += "rfschedule -o " + $this.data('operatorid') + " " + action + " EVENT_" + schedule.Event;
                    }
                })
                api.exe({
                    cmd:cmd,
                    onSuccess:function(){
                        if($this.attr("state") ==="active"){
                            $this.text("Activate all schedules");
                            $this.attr("state","inactive");
                            d3.selectAll('.rect_'+$this.data('operatorid')).style('fill','#7a7a7a');
                        }else{
                            $this.attr("state","active");
                            $this.text("Deactivate all schedules");
                            d3.selectAll('.rect_'+$this.data('operatorid')).style('fill','#006700');
                        }

                    },
                    onError:function(err){
                        axellPopUp(err.errorThrown);
                    }
                })
            })

            //click on add schedule btn
            $('#add_schedule_dialog').dialog({
                width : 700,
                resizable : false,
                autoOpen : false,
                buttons:{
                    'Cancel': function () {
                        $('#add_schedule_dialog').dialog( 'close' );
                    },
                    'Add' : function () {
                        //add schedule
                        if($('#schedule_profile_name').val() ==""){
                            axellPopUp("Please fill in the profile name");
                        }else if($('input[name="date"]:checked').length===0){
                            axellPopUp("Please select the date and time to schedule a profile");
                        }else if($('#schedule_profile_desc').val() ==""){
                            axellPopUp("Please fill in the profile description");
                        }else{
                            var cmd='';
                            for (var i =0; i<$('input[name="date"]:checked').length;i++){
                                if(i< $('input[name="date"]:checked').length -1) {
                                    cmd += 'RFSCHEDULE -o ' + $('#schedule_operator_name').val() + ' ADD ' + $('#time').val() + ':' + $('#minute').val() + ' ' + $('input[name="date"]:checked')[i].value + ' ' + $('#schedule_profile_name').val() + ' "' + $('#schedule_profile_desc').val() + '" 1 &&';
                                }else{
                                    cmd += 'RFSCHEDULE -o ' + $('#schedule_operator_name').val() + ' ADD ' + $('#time').val() + ':' + $('#minute').val() + ' ' + $('input[name="date"]:checked')[i].value + ' ' + $('#schedule_profile_name').val() + ' "' + $('#schedule_profile_desc').val() + '" 1';
                                }
                            }
                            api.exe({
                                cmd:cmd,
                                onSuccess:function(){
                                    $('#add_schedule_dialog').dialog( 'close' );
                                },
                                onError:function(err){
                                    axellPopUp(err.errorThrown);
                                }
                            })
                            $('#operator_name > option').each(function() {
                                if($(this).val() != 'all') {
                                    scheduler.remove({cmd: "rfschedule -o " + $(this).val() + " --json"});
                                }
                            })
                            setTimeout(function(){
                                if($('#operator_name').val() != 'all') {
                                    $('#operator_name > option').each(function() {
                                        if($(this).val() != 'all') {
                                            scheduler.remove({cmd: "rfschedule -o " + $(this).val() + " --json"});
                                        }
                                    })
                                    buildScheduleTable($('#operator_name option:selected'));
                                } else {
                                    $('#operator_name > option').each(function() {
                                        if($(this).val() != 'all') {
                                            scheduler.remove({cmd: "rfschedule -o " + $(this).val() + " --json"});
                                            buildScheduleTable($(this));
                                        }
                                    });
                                }
                            },500)
                        }
                    }
                },
                open:function(){
                    //append operator list according to the chosen operator in main screen
                    if($('#operator_name option:selected').val() === 'all'){
                        $.each(OPERATORLIST, function (key, value) {
                            $('#add_schedule_dialog #schedule_operator_name').append($('<option>', {
                                value: value.SysName,
                                text : value.FullName
                            }));
                        });
                    }else{
                        $.each(OPERATORLIST, function (key, value) {
                            if ($('#operator_name option:selected').val() === value.SysName){
                                $('#add_schedule_dialog #schedule_operator_name').append($('<option>', {
                                    value: value.SysName,
                                    text: value.FullName
                                }));
                            }
                        });
                    }
                    //update autocomplete list of profile name when update operator list
                    populateSelectProfileList();
                    $('#add_schedule_dialog #schedule_operator_name').change(function(){
                        populateSelectProfileList();
                    })
                    function populateSelectProfileList(){
                        $('#add_schedule_dialog #schedule_profile_name').val("");
                        var operatorProfileName =[];
                        api.exe({
                            cmd: "RFROUTE -o " + $('#add_schedule_dialog #schedule_operator_name option:selected').val()+ " PROFILES --json",
                            dataType: "json",
                            async: false, //quick way to make sure everything display in order
                            onSuccess: function (o) {
                                $('#add_schedule_dialog #schedule_profile_name').empty();
                                $('#add_schedule_dialog #schedule_profile_name').append($('<option>', {
                                    value: '',
                                    text: 'Select'
                                }));
                                $.each(o.ajaxdata.Profiles,function(i,profile){
                                    console.log(profile.Name);
                                    $('#add_schedule_dialog #schedule_profile_name').append($('<option>', {
                                        value: profile.Name,
                                        text: profile.Name
                                    }));
                                })
                            }
                        })
                    }


                }
            })
            $('#add_schedule').click(function(){
                if(!$(this).hasClass('disabled')) {
                    $('#add_schedule_dialog #schedule_operator_name').empty();
                    $('#add_schedule_dialog').dialog('option', 'title', 'Add New Profile Schedule');
                    $('#add_schedule_dialog').dialog('open');
                }
            })
        })

        function displayFailedToLock()
        {
            $("#dialog_del").dialog('option', 'buttons', {
                "Ok": function () {
                    window.location = '/target/profiles/';

                }
            });
            $("#dialog_del").dialog("open");
        }

        function buildScheduleTable(selOp) {
            //$('#schedule_content').empty();
            var operatorName = selOp.val();
            //console.log(operatorName);
            var weekday = new Array(7);
            weekday[0] = "sun";
            weekday[1] = "mon";
            weekday[2] = "tue";
            weekday[3] = "wed";
            weekday[4] = "thu";
            weekday[5] = "fri";
            weekday[6] = "sat";
            //display schedule of particular op
            scheduler.add(sec(10),{
                cmd: "rfschedule -o " + operatorName + " --json",
                callOnDiff: true,
                //dataType: 'json',
                onSuccess: function (o) {
                    $('#schedule_content_'+operatorName).remove();
                    $('#schedule_content').append("<div id='schedule_content_"+operatorName+"'></div>");
                    scheduleList =[];
                    scheduleList = $.parseJSON(o.ajaxdata).RfSchedule;
                    //rearrange schedule list
                    //sort schedule based on day and time
                    if (scheduleList.length > 0) {
                        $('#schedule_content_'+operatorName).append("<div id='deactivate_btn_holder'><a id= 'deactivate_all_schedule_"+operatorName+"' class='button deactivateAllSchedule' data-operatorid= '"+operatorName+"' state= 'active'>Deactivate all schedules</a></div>");
                        scheduleList.sort(compareEvent);
                        //get the very end date, if schedule was repetitive
                        var endDate;
                        //parse info into schedule list for further process in gantchart
                        for (var i = 0; i < scheduleList.length; i++) {
                            var d = Dates[weekday.indexOf(scheduleList[i].Weekday)];
                            d.setHours(parseInt(scheduleList[i].Time.substring(0, scheduleList[i].Time.indexOf(":"))));
                            d.setMinutes(parseInt(scheduleList[i].Time.substring(scheduleList[i].Time.indexOf(":") + 1, scheduleList[i].Time.length)));
                            scheduleList[i].startTime = new Date(d);
                            scheduleList[i].displayStartTime = new Date(d);
                        }
                        for (var i = 0; i < scheduleList.length; i++) {
                            if (i >= 0 && i < scheduleList.length - 1) {
                                scheduleList[i].endTime = scheduleList[i + 1].startTime;
                                scheduleList[i].displayEndTime = scheduleList[i + 1].startTime;
                            } else {
                                scheduleList[i].endTime = Dates[7];
                                endDate = Dates[weekday.indexOf(scheduleList[0].Weekday) +7];
                                endDate.setHours(parseInt(scheduleList[0].Time.substring(0, scheduleList[0].Time.indexOf(":"))));
                                endDate.setMinutes(parseInt(scheduleList[0].Time.substring(scheduleList[0].Time.indexOf(":") + 1, scheduleList[0].Time.length)));
                                scheduleList[i].displayEndTime = endDate;
                            }
                        }
                        //spit out the last event of the week to 2 pieces
                        //one end at end of week
                        //one start at the start of new week
                        if(scheduleList[0].Weekday != "sun") {
                            scheduleList.push({"Event": scheduleList[scheduleList.length - 1].Event, "Profile": scheduleList[scheduleList.length - 1].Profile,
                                "Weekday": scheduleList[scheduleList.length - 1].Weekday, "Time": scheduleList[scheduleList.length - 1].Time,
                                "Description": scheduleList[scheduleList.length - 1].Description, "startTime": Dates[0], "endTime": scheduleList[0].startTime,
                                "displayStartTime": scheduleList[scheduleList.length - 1].startTime, "displayEndTime": endDate});
                        }else {
                            if (scheduleList[0].Time !="00:00"){
                                scheduleList.push({"Event": scheduleList[scheduleList.length - 1].Event, "Profile": scheduleList[scheduleList.length - 1].Profile,
                                    "Weekday": scheduleList[scheduleList.length - 1].Weekday, "Time": scheduleList[scheduleList.length - 1].Time,
                                    "Description": scheduleList[scheduleList.length - 1].Description, "startTime": Dates[0], "endTime": scheduleList[0].startTime,
                                    "displayStartTime": scheduleList[scheduleList.length - 1].startTime, "displayEndTime": endDate});
                            }
                        }
                        //console.log(scheduleList);
                        //create place holder for schedule
                        $('#schedule_content_'+operatorName).append('<div class = "svg svg_'+operatorName+'"></div><div id = "tag_'+operatorName+'" class="tag"></div>');
                        drawScheduleTimeline(scheduleList, operatorName);
                    }
                }
            })
        }

        function drawScheduleTimeline(scheduleList,op){
            //console.log("start drawing");
            var profiles = new Array();

            for (var i = 0; i < scheduleList.length; i++){
                profiles.push(scheduleList[i].Profile);
            }
            var profsUnfiltered = profiles; //for vert labels

            profiles = checkUnique(profiles);
            scheduleList = _.sortBy(scheduleList,'Profile');
            //to display date
            var options = {
                hour12:false, weekday: "long", year: "numeric", month: "short",
                day: "numeric", hour: "2-digit", minute: "2-digit"
            };
            var rowHeight = 50;
            var barHeight = 30;
            var w = 980;
            var h = (rowHeight+10) * profiles.length +150;
            var svg = d3.selectAll(".svg_"+op+"")
                .append("svg")
                .attr("width", w)
                .attr("height", h)
                .attr("class", "svg_"+op+"");

            //led indicate active profile
            var green = svg.append("svg:defs")
                .append("svg:radialGradient")
                .attr("id","green")
                .attr("cx","50%")
                .attr("cy","50%")
                .attr("fx","50%")
                .attr("fy","50%")
                .attr("spreadMethod","pad");
            green.append("svg:stop")
                .attr("offset", "0%")
                .attr("stop-color", "#9ecd5e")
                .attr("stop-opacity", 1);

            green.append("svg:stop")
                .attr("offset", "100%")
                .attr("stop-color", "#5ca301")
                .attr("stop-opacity", 1);
            //grey gradient
            var grey = svg.append("svg:defs")
                .append("svg:radialGradient")
                .attr("id","grey")
                .attr("cx","50%")
                .attr("cy","50%")
                .attr("fx","50%")
                .attr("fy","50%")
                .attr("spreadMethod","pad");
            grey.append("svg:stop")
                .attr("offset", "0%")
                .attr("stop-color", "#c3c3c3")
                .attr("stop-opacity", 1);

            grey.append("svg:stop")
                .attr("offset", "100%")
                .attr("stop-color", "#8f8f8f")
                .attr("stop-opacity", 1);
            var timeScale = d3.time.scale()
                .domain([Dates[0].setHours(0),Dates[7].setHours(0)])
                .range([0,w-230-4*scheduleList.length]);

            makeGant(scheduleList, w);

            var title = svg.append("text")
                .text(function(){
                    return _.findWhere(OPERATORLIST,{"SysName":op}).FullName;
                })
                .attr("x", w/2)
                .attr("y", 30)
                .attr("text-anchor", "middle")
                .attr("font-size", 18)
                .attr("font-weight", "bold")
                .attr("fill", "#702C91");

            function makeGant(schedule, pageWidth){
                var gap = rowHeight;
                var topPadding = 60;
                var sidePadding = 150;
                var scheduleGap = 4;

                var colorScale = d3.scale.linear()
                    .domain([0, profiles.length])
                    .range(["#702c91", "#ff0000"])
                    .interpolate(d3.interpolateHcl);

                makeGrid(sidePadding, topPadding);
                drawRects(schedule, gap, scheduleGap, topPadding, sidePadding, barHeight, colorScale, pageWidth);
                vertLabels(gap, topPadding, colorScale);
                drawLines(schedule,op);
            }

            function drawLines(scheduleArray,operator){
                var orderedList = _.sortBy(scheduleArray,'startTime');
                var rects = svg.selectAll('.rect_'+operator);
                if(orderedList.length>2) {
                    for (var i = 0; i < orderedList.length - 1; i++) {
                        //find end coordinate of rect
                        //draw line
                        var sourceXCoor = svg.selectAll('.rect_' + operator + '[data-starttime="' + orderedList[i].startTime + '"]')[0][0].x.animVal.value;
                        var sourceYCoor = svg.selectAll('.rect_' + operator + '[data-starttime="' + orderedList[i].startTime + '"]')[0][0].y.animVal.value;
                        var sourceWidth = svg.selectAll('.rect_' + operator + '[data-starttime="' + orderedList[i].startTime + '"]')[0][0].width.animVal.value;
                        var sourceHeight = svg.selectAll('.rect_' + operator + '[data-starttime="' + orderedList[i].startTime + '"]')[0][0].height.animVal.value;
                        var targetXCoor = svg.selectAll('.rect_' + operator + '[data-starttime="' + orderedList[i + 1].startTime + '"]')[0][0].x.animVal.value;
                        var targetYCoor = svg.selectAll('.rect_' + operator + '[data-starttime="' + orderedList[i + 1].startTime + '"]')[0][0].y.animVal.value;
                        var targetWidth = svg.selectAll('.rect_' + operator + '[data-starttime="' + orderedList[i + 1].startTime + '"]')[0][0].width.animVal.value;
                        var targetHeight = svg.selectAll('.rect_' + operator + '[data-starttime="' + orderedList[i + 1].startTime + '"]')[0][0].height.animVal.value;
                        svg.append("svg:path")
                            .attr('class', 'connection')
                            .style("stroke", "#5c5c5c")
                            .style("stroke-linecap", "round")
                            .style("stroke-width", 2)
                            .style("fill", "none")
                            .style("cursor", "pointer")
                            .attr("d", function () {
                                return "M" + Number(sourceXCoor + sourceWidth) + " " + Number(sourceYCoor + sourceHeight / 2)
                                    + " H" + Number(targetXCoor - 2)
                                    + " V" + Number(targetYCoor + targetHeight / 2)
                                    + " H" + Number(targetXCoor)
                            })
                    }
                }
            }

            function drawRects(scheduleArray, theGap,theRectGap, theTopPad, theSidePad, theBarHeight, theColorScale, w){
                //console.log("draw rect");
                console.log(scheduleArray);
                var bigRects = svg.append("g")
                    .selectAll("rect")
                    .data(scheduleArray)
                    .enter()
                    .append("rect")
                    .attr("x", 0)
                    .attr("y", function(d, i){
                        //return i*theGap + theTopPad - 2;
                        for (var i = 0; i < profiles.length; i++){
                            if (d.Profile == profiles[i]){
                                return i*theGap + theTopPad -2;
                            }
                        }
                    })
                    .attr("width", function(d){
                        return w-theSidePad/2;
                    })
                    .attr("height", theGap)
                    .attr("stroke", "none")
                    .attr("fill", function(d){
                        for (var i = 0; i < profiles.length; i++){
                            if (d.Profile == profiles[i]){
                                return d3.rgb(theColorScale(i));
                            }
                        }
                    })
                    .attr("opacity", 0.1);


                var rectangles = svg.append('g')
                    .selectAll("rect")
                    .data(scheduleArray)
                    .enter();

                var innerRects = rectangles.append("rect")
                    .attr('class','rect_'+op)
                    .attr('data-eventid',function(d){
                        return d.Event;
                    })
                    .attr('data-starttime',function(d){
                        return d.startTime;
                    })
                    .attr("rx", 3)
                    .attr("ry", 3)
                    .attr("x", function(d){
                        return timeScale(d.startTime) + theSidePad + theRectGap;
                    })
                    .attr("y", function(d, i){
                        for (var i = 0; i < profiles.length; i++){
                            if (d.Profile == profiles[i]){
                                return i*theGap + theTopPad +10;
                            }
                        }
                    })
                    .attr("width", function(d){
                        //in case resolution of time is too small, draw width as 2 px
                        if(timeScale(d.endTime)-timeScale(d.startTime) > 6){
                            return (timeScale(d.endTime)-timeScale(d.startTime)) - theRectGap;
                        }else{
                            return 2;
                        }
                    })
                    .attr("height", theBarHeight)
                    .attr("stroke", "none")
                    .attr("fill",'#006700' /*function(d){
                        for (var i = 0; i < profiles.length; i++){
                            if (d.Profile == profiles[i]){
                                return d3.rgb(theColorScale(i));
                            }
                        }
                    }*/)

                innerRects.on('mouseover', function(e) {
                    var tag = "<b>Profile:</b> " + d3.select(this).data()[0].Profile + "<br/>" +
                            "<b>Start Time:</b> " + d3.select(this).data()[0].displayStartTime.toLocaleTimeString("en-us", options) + "<br/>" +
                            "<b>End Time: </b>" + d3.select(this).data()[0].displayEndTime.toLocaleTimeString("en-us", options) + "<br/>" +
                            "<b>Description: </b>" + d3.select(this).data()[0].Description +"<br>";
                             if(USERACCESS !="RO") {
                                 tag += "<div id='tag-btn-panel'><div data-op='" + op + "' data-eventid='" + d3.select(this).data()[0].Event + "' class='icon error' title='Delete schedule'></div></div>";
                             }
                    var output = document.getElementById("tag_" + op);
                    var x = (this.x.animVal.value + this.width.animVal.value/2) + "px";
                    var y = $('.svg_'+op).position().top + this.y.animVal.value + 25 + "px";


                    output.innerHTML = tag;
                    output.style.top = y;
                    output.style.left = x;
                    output.style.display = "block";
                }).on('mouseout', function() {
                    var output = document.getElementById("tag_" + op);
                    output.style.display = "none";
                });
            }

            function makeGrid(theSidePad, theTopPad){
                //console.log("make grid");
                var xAxis = d3.svg.axis()
                    .scale(timeScale)
                    .orient('bottom')
                    .ticks(d3.time.hour,12)
                    .tickSize(profiles.length*theTopPad,0,0)
                    .tickFormat(d3.time.format('%a %H:%M'));

                var grid = svg.append('g')
                    .attr('class', 'grid')
                    .attr('transform', 'translate(' +theSidePad + ', ' + (theTopPad) + ')')
                    .call(xAxis)
                    .selectAll("text")
                    .style("text-anchor", "middle")
                    .attr("fill", "#000")
                    .attr("stroke", "none")
                    .attr("font-size", 9)
                    .attr("dy", "1em");
            }

            function vertLabels(theGap, theTopPad,theColorScale){
                //console.log("add vert label");
                var numOccurances = new Array();

                for (var i = 0; i < profiles.length; i++){
                    numOccurances[i] = [profiles[i], getCount(profiles[i], profsUnfiltered)];
                }
                var axisText = svg.append("g") //without doing this, impossible to put grid lines behind text
                    .selectAll("text")
                    .data(numOccurances)
                    .enter()
                    .append("text")
                    .text(function(d){
                        return d[0];
                    })
                    .attr("x", 30)
                    .attr("y", function(d,j){
                        for (var i = 0; i < profiles.length; i++){
                            if (j > 0) {
                                if (d[0] == profiles[i]) {
                                    return i * theGap + theTopPad +30;
                                }
                            }else{
                                if (d[0] == profiles[i]) {
                                    return i*theGap + theTopPad +30
                                }
                            }
                        }
                    })
                    .attr("font-size", 11)
                    .attr("font-weight", 'bold')
                    .attr("text-anchor", "start")
                    .attr("text-height", 14)
                    .attr("fill", function(d){
                        for (var i = 0; i < profiles.length; i++){
                            if (d[0] == profiles[i]){
                                return d3.rgb(theColorScale(i)).darker();
                            }
                        }
                    });
                var prev = ACTIVEPROFILE;
                ACTIVEPROFILE= ACTIVEPROFILE.uniqueObjects();
                var activeProfile= svg.selectAll('circle')
                    .data(numOccurances)
                    .enter()
                    .append('svg:circle')
                    .attr("r",7)
                    .attr("cx", 15)
                    .attr("cy", function(d,j){
                        for (var i = 0; i < profiles.length; i++){
                            if (j > 0) {
                                if (d[0] == profiles[i]) {
                                    return i * theGap + theTopPad +25;
                                }
                            }else{
                                if (d[0] == profiles[i]) {
                                    return i*theGap + theTopPad +25;
                                }
                            }
                        }
                    })
                    .attr('width',20)
                    .attr('height',20)
                    .attr('id',function(d){
                        return d[0]
                    })
                    .style("fill", function(d){
                        var active_class='';
                        $.each(ACTIVEPROFILE,function(i,opProfile){
                            if(op ===opProfile.Operator && d[0] === opProfile.active_profile){
                                active_class= "url(#green)";
                            }else if(op === opProfile.Operator && d[0] != opProfile.active_profile){
                                active_class= "url(#grey)";
                            }
                        })
                        return active_class;
                    })
                }

                function checkUnique(arr) {
                    var hash = {}, result = [];
                    for ( var i = 0, l = arr.length; i < l; ++i ) {
                        if ( !hash.hasOwnProperty(arr[i]) ) { //it works with objects! in FF, at least
                            hash[ arr[i] ] = true;
                            result.push(arr[i]);
                        }
                    }
                    return result;
                }

                function getCounts(arr) {
                    var i = arr.length, // var to loop over
                        obj = {}; // obj to store results
                    while (i) obj[arr[--i]] = (obj[arr[i]] || 0) + 1; // count occurrences
                    return obj;
                }

                function getCount(word, arr) {
                    return getCounts(arr)[word] || 0;
                }
            }


        function buildProfileTable(selOp) {
            //get active profile list
            scheduler.add(sec(10),{
                cmd:"RFROUTE -o "+selOp.val()+" PROFILES --json",
                callOnDiff:true,
                async:false, //quick way to make sure everything display in order
                onSuccess:function(o){
                    if($('#profile_table_'+selOp.val()).length>0){
                        $('#profile_table_'+selOp.val()).remove();
                    }
                    rfrouteProfileList = $.parseJSON(o.ajaxdata).Profiles;
                    var data = $.parseJSON(o.ajaxdata);
                    ACTIVEPROFILE = [];
                    ACTIVEPROFILE.push({"Operator":selOp.val(),"active_profile":data.Active});
                    // Operator header
                    var profileTable =
                        '<table id="profile_table_'+selOp.val()+'"'+' '+'class="profile_table" operator-id='+selOp.val()+'>'+
                            '<caption id="profile_name"> <div class=""></div> '+selOp.text()+'</caption>'+
                            '<tr>'+
                            '<th>'+"Active"+'</th>'+
                            '<th><div class="icon logs_indeterminate"></div> '+"Profile"+'</th>'+
                            '<th>'+"Description"+'</th>'+
                            '<th><div class="icon lock"></div> '+"Lock by"+'</th>'+
                            '<th><div class="icon scheduler"></div> '+"Lock at"+'</th>'+
                            '<th><div class="icon used"></div> '+"Last activated"+'</th>'+
                            '<th>'+""+'</th>'+
                            '<th>'+""+'</th>'+
                            '<th>'+""+'</th>'+
                            '</tr>';

                    // Operator profiles
                    $.each(data.Profiles, function(key, value){
                        profileTable +='<tr><td></td><td>'+value.Name+'</td><td>'+value.Tag+'</td><td>'+value.LockedBy+
                            '</td>';
                        if(value.LockedAt !=0){
                            profileTable += '<td>'+convert.epoch2slashedDDMMYYYY(value.LockedAt)+'</td>';
                        }else{
                            profileTable += '<td>-</td>';
                        }
                        if(value.LastActivated !=0){
                            profileTable += '<td>'+convert.epoch2slashedDDMMYYYY(value.LastActivated)+'</td>';
                        }else{
                            profileTable += '<td>-</td>';
                        }
                        if(value.Name !="disabled") {
                            profileTable += '<td><a class="button editBtn" id="' +
                                value.Name + '_editBtn">Edit</a></td>';
                        }else{
                            profileTable += '<td></td>';
                        }
                        profileTable +='<td><a class="button copyToNewBtn" id="'+
                            value.Name+'_copyToNewBtn" operator-id="'+selOp.val()+'">Copy to new</a></td>';
                        if(value.Name !="disabled") {
                            profileTable += '<td><a class="button deleteBtn" id="' +
                                value.Name + '_deleteBtn" operator-id="' + selOp.val() + '">Delete</a></td></tr>';
                        }else{
                            profileTable += '<td></td>';
                        }
                        profileNameList.push(value.Name);
                    })
                    profileTable += '</table>';

                    $('#routing_content').append(profileTable);
                    $('#profile_table_'+selOp.val()+' '+'tr').each(function(){
                        if($(this).find("td:eq(1)").text() === data.Active){
                            $(this).find('td:nth-child(1)').append('<input type="radio" checked="checked" name='+selOp.val()+' class="icon ok" title="Active route" operator-id='+selOp.val()+'>');
                            $(this).find('.editBtn').text('View');
                            $(this).find('.editBtn').removeClass('editBtn').addClass('viewBtn');
                            $(this).find('.deleteBtn').addClass('disabled').addClass('hidden');
                        }else{
                            $(this).find('td:nth-child(1)').append('<input type="radio" name='+selOp.val()+' class="icon ok_disabled" title="Click me to activate route" operator-id='+selOp.val()+'>');
                            if (document.getElementById("checkroutingscheduler").checked)
                              $('.ok_disabled').attr('disabled', true);
                            else
                              $('.ok_disabled').attr('disabled', false);
                        }
                        if($(this).find("td:eq(3)").text() != "-" && $(this).find("td:eq(3)").text() != user_name ){
                            $(this).find('.editBtn').text('View');
                            $(this).find('.editBtn').removeClass('editBtn').addClass('viewBtn');
                        }
                    })
                    //if user is read only, disabled all functionalities
                    $.each(OPERATORLIST, function(key, value){
                        if(value.SysName === selOp.val() && USERACCESS ==="RO"){
                            $('.editBtn').addClass('disabled');
                            $('.copyToNewBtn').addClass('disabled')
                            $('.deleteBtn').addClass('disabled');
                            $('.ok_disabled').addClass('disabled');
                        }
                    })
                    //refresh schedule as well
                    scheduler.remove({cmd: "rfschedule -o " + selOp.val() + " --json"});

                    buildScheduleTable(selOp);
                }
            })
        }
        //to sort the scheduler list
        function compareEvent(a,b) {
            var weekday = new Array(7);
            weekday[0] = "sun";
            weekday[1] = "mon";
            weekday[2] = "tue";
            weekday[3] = "wed";
            weekday[4] = "thu";
            weekday[5] = "fri";
            weekday[6] = "sat";
            var aTime = a.Time.substring(0,a.Time.indexOf(":"));
            var aMinute = a.Time.substring(a.Time.indexOf(":")+1,a.Time.length);
            var bTime= b.Time.substring(0,b.Time.indexOf(":"));
            var bMinute = b.Time.substring(b.Time.indexOf(":")+1,b.Time.length);
            if (weekday.indexOf(a.Weekday) < weekday.indexOf(b.Weekday)) {
                return -1;
            }else if(weekday.indexOf(a.Weekday) === weekday.indexOf(b.Weekday)){
                if(aTime < bTime){
                    return -1;
                }else if(aTime === bTime) {
                    if(aMinute < bMinute){
                        return -1;
                    }else if(aMinute > bMinute){
                        return 1;
                    }
                }else{
                    return 1;
                }
            }else{
                return 1;
            }
            return 0;
        }

    })
