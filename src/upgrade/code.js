require([ '/js/api.js','/js/lib/jquery.js','/js/scheduler.js' ], function ( api,$,scheduler ) {
    var USERACCESS = $.cookie('userAccess');
    var swForm = document.getElementById('sw-upgrade-form');
    var swFileInput = document.getElementById('sw-file');
    var swUploadBtn = document.getElementById('upload_sw');
    var sysForm = document.getElementById('sys-upgrade-form');
    var sysFileInput = document.getElementById('sys-file');
    var sysUploadBtn = document.getElementById('upload_system');
    var interval;

    $(document).ready(function(){


        //  set System Update section close
        $('.advanced').hide();
        // toggle System Update section
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
    
        $('#file_upload_msg').hide();
        $('#burn_sys_btn').addClass('disabled');
        $('#burn_sw_btn').addClass('disabled');
        swFileInput.disabled = false;
        sysFileInput.disabled = false;
        swUploadBtn.disabled = true;
        sysUploadBtn.disabled = true;
        if(USERACCESS !='superuser'){
            swFileInput.disabled = true;
            swUploadBtn.disabled = true;
            sysFileInput.disabled = true;
            sysUploadBtn.disabled = true;
            $('.button').addClass('disabled');
        }
        $('#sw-file').change(function(){
            if(swFileInput.value != "") {
                // file was chosen, enable upload button
                swUploadBtn.disabled = false;
            }
        })
        $('#sys-file').change(function(){
            if(sysFileInput.value != "") {
                // file was chosen, enable upload button
                sysUploadBtn.disabled = false;
            }
        })

        if(sessionStorage.getItem('header-get-mdl') === "MSDH-M" || sessionStorage.getItem('header-get-mdl') === "MSDH-S"){
            if(USERACCESS =='superuser') {
                $('#factory_reset_panel').show();
                $('#reset_btn').append('<a class="button" id ="factory_reset">Factory Reset</a>');
            }else{
                $('#factory_reset_panel').hide();
            }
        }else{
            $('#factory_reset_panel').hide();
        }
        $(document).on('click','#factory_reset',function(){
            if(!$(this).hasClass('disabled')) {
                axellConfirm("info","Notice","Are you sure you want to reset the system to factory default configuration?",function(){
                    $.blockUI({ 
                        fadeIn: 1000, 
                        timeout: 300000, 
                        onBlock: function() { 
                          api.exe({
                              cmd: 'factory_reset_msdh',
                              onSuccess: function (o) {
                                  swFileInput.disabled = false;
                                  swUploadBtn.disabled = false;
                                  sysFileInput.disabled = false;
                                  sysUploadBtn.disabled = false;
                                  //axellPopUp("System is resetting. You can access it again in the few minutes");
                              },
                              onError:function(err){
                                  axellPopUp(err.errorThrown);
                              }
                          })
                        } 
                    })
                    interval = setInterval(CheckResetFinished, 60000);  

//

                    setInterval(function()
                    {
                        api.exe(
                            {
                            cmd: 'sw_burn_status',
                                onSuccess: function (o)
                                {
                                    $('#reset_log').text(o.ajaxdata);
                                    if(o.ajaxdata.indexOf("System Going Down Now") > -1)
                                    {
                                        setTimeout(function() { window.location.href = '/logout/'; }, 2000);
                                    }

                                },
                                onError: function ()
                                {
                                    console.log(err.errorThrown);
                                }
                            });
                            }, 1000);


//
                })
            }
        })

        function CheckResetFinished() 
        {
         api.exe({
          cmd: 'get mdl',
          dataType: 'text',
          async: false,
          onSuccess: function () {
            $.unblockUI();
            clearInterval(interval);
            location.reload();
          }
         })
        }

        $('#burn_sw_btn').click(function()
        {
            if(!$(this).hasClass('disabled'))
            {
                axellConfirm("info","Notice","Are you sure you want to upgrade the system with uploaded version?",function(){
                    swFileInput.disabled = true;
                    swUploadBtn.disabled = true;
                    sysFileInput.disabled = true;
                    sysUploadBtn.disabled = true;
                    api.exe({
                        cmd: 'sw_burn',
                        onSuccess: function (o) {
                            console.log("processing burn");

                        },
                        onError: function () {
                            console.log(err.errorThrown);
                        }
                    })
                    setInterval(function()
                    {
                        api.exe(
                            {
                            cmd: 'sw_burn_status',
                                onSuccess: function (o)
                                {
                                    $('#sw_log').text(o.ajaxdata);
                                    if(o.ajaxdata.indexOf("System Going Down Now") > -1)
                                    {
                                        setTimeout(function() { window.location.href = '/logout/'; }, 2000);
                                    }

                                },
                                onError: function ()
                                {
                                    console.log(err.errorThrown);
                                }
                            });
                            }, 1000);
                },function(){
                    swFileInput.disabled = false;
                    swUploadBtn.disabled = false;
                    sysFileInput.disabled = false;
                    sysUploadBtn.disabled = false;
                })
                $(this).addClass('disabled')
                $('#factory_reset').addClass('disabled');
            }
        });
        //burn system
        $('#burn_sys_btn').click(function()
        {
            if(!$(this).hasClass('disabled'))
            {
                axellConfirm("info","Notice","Are you sure you want to upgrade the system with uploaded version?",function(){
                    swFileInput.disabled = true;
                    swUploadBtn.disabled = true;
                    sysFileInput.disabled = true;
                    sysUploadBtn.disabled = true;
                    api.exe({
                        cmd: 'sw_burn',
                        onSuccess: function (o) {
                            console.log("processing burn");
                        },
                        onError: function () {
                            console.log(err.errorThrown);
                        }
                    })
                    setInterval(function()
                    {
                        api.exe(
                            {
                                cmd: 'sw_burn_status',
                                onSuccess: function (o)
                                {
                                    $('#sys_log').text(o.ajaxdata);
                                    if(o.ajaxdata.indexOf("System Going Down Now") > -1)
                                    {
                                        setTimeout(function() { window.location.href = '/logout/'; }, 2000);
                                    }

                                },
                                onError: function ()
                                {
                                    console.log(err.errorThrown);
                                }
                            });
                    }, 1000);
                    },function(){
                        swFileInput.disabled = false;
                        swUploadBtn.disabled = false;
                        sysFileInput.disabled = false;
                        sysUploadBtn.disabled = false;
                    })
                $(this).addClass('disabled')
                $('#factory_reset').addClass('disabled');
            }
        });
        
        api.exe({
            cmd: 'get_patches',
            onSuccess: function (o) {
                if((o.ajaxdata != '-') && (o.ajaxdata != '')){
                    $('#patches_panel').show();
                    
                    $('#patches_log').text(o.ajaxdata);
                }
            },
            onError:function(){
            }
        })

    });
    //upload software file
    swForm.onsubmit = function(event) {
        event.preventDefault();

        // Update button text.
        swUploadBtn.innerHTML = 'Uploading...';
        $('#file_upload_msg').dialog({
            width: 300,
            resizable: false,
            autoOpen: false
        })
        $('#file_upload_msg').dialog('open');
        // event handler
        // Get the selected file
        var file = swFileInput.files[0];
        // Create a new FormData object.
        var formData = new FormData();
        // Add the file to the request.
        formData.append('firmware', file);
        // Set up the request.
        var xhr = new XMLHttpRequest();

        xhr.open('POST', '../cgi/file_upload.lua', true);

        // Set up a handler for when the request finishes.
        xhr.onload = function () {
            if (xhr.status === 200) {
                // File(s) uploaded.
                swUploadBtn.innerHTML = 'Upload';
                $('#file_upload_msg').dialog('close');
                $('#burn_sw_btn').removeClass('disabled');
                //$('#factory_reset').removeClass('disabled');
                $('#sw_log').text("Uploaded successfully");
            } else {
                $('#file_upload_msg').dialog('close');
                $('#sw_log').text("Failed to upload");
            }
        };

        // Send the Data.
        xhr.send(formData);
    }

    //upload system file
    sysForm.onsubmit = function(event) {
        event.preventDefault();

        // Update button text.
        sysUploadBtn.innerHTML = 'Uploading...';
        $('#file_upload_msg').dialog({
            width: 300,
            resizable: false,
            autoOpen: false
        })
        $('#file_upload_msg').dialog('open');
        // event handler
        // Get the selected file
        var file = sysFileInput.files[0];
        // Create a new FormData object.
        var formData = new FormData();
        // Add the file to the request.
        formData.append('firmware', file);
        // Set up the request.
        var xhr = new XMLHttpRequest();

        xhr.open('POST', '../cgi/file_upload.lua', true);

        // Set up a handler for when the request finishes.
        xhr.onload = function () {
            if (xhr.status === 200) {
                // File(s) uploaded.
                sysUploadBtn.innerHTML = 'Upload';
                $('#file_upload_msg').dialog('close');
                $('#burn_sys_btn').removeClass('disabled');
                //$('#factory_reset').removeClass('disabled');
                $('#sys_log').text("Uploaded successfully");
            } else {
                $('#file_upload_msg').dialog('close');
                $('#sys_log').text("Failed to upload");
            }
        };

        // Send the Data.
        xhr.send(formData);
    }

});
