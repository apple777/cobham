require([ '/js/api.js','/js/lib/jquery.js','/js/scheduler.js' ], function ( api,$,scheduler ) {
    var USERACCESS = $.cookie('userAccess');
    var swForm = document.getElementById('sw-upgrade-form');
    var swFileInput = document.getElementById('sw-file');
    var swUploadBtn = document.getElementById('upload_sw');
    var interval;
    var file;

    $(document).ready(function(){

        $('#file_upload_msg').hide();
        $('#burn_sw_btn').addClass('disabled');
        swFileInput.disabled = false;
        swUploadBtn.disabled = true;
        if(USERACCESS !='superuser'){
            swFileInput.disabled = true;
            swUploadBtn.disabled = true;
            $('.button').addClass('disabled');
        }
        $('#sw-file').change(function(){
            if(swFileInput.value != "") {
                // file was chosen, enable upload button
                swUploadBtn.disabled = false;
            }
        })

        $('#burn_sw_btn').click(function()
        {
            if(!$(this).hasClass('disabled'))
            {
                axellConfirm("info","Notice","Are you sure you want to install the uploaded pygones file '" + file.name + "'?",function(){
                    swFileInput.disabled = true;
                    swUploadBtn.disabled = true;
                    api.exe({
                        cmd: 'polygon_install ' + file.name,
                        onSuccess: function (o) {
			    $('#sw_log').text("Installed");
			    swFileInput.disabled = false;
                        },
                        onError: function (err) {
                            console.log(err.errorThrown);
			    $('#sw_log').text("Failed to install");
			    swFileInput.disabled = false;
                        }
                    })
                },function(){
                    swFileInput.disabled = false;
                    swUploadBtn.disabled = false;
                })
                $(this).addClass('disabled')
            }
        });
        
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
        file = swFileInput.files[0];
        // Create a new FormData object.
        var formData = new FormData();
        // Add the file to the request.
        formData.append('firmware', file);
        // Set up the request.
        var xhr = new XMLHttpRequest();

        xhr.open('POST', '/cgi/file_upload.lua', true);

        // Set up a handler for when the request finishes.
        xhr.onload = function () {
            if (xhr.status === 200) {
                // File(s) uploaded.
                swUploadBtn.innerHTML = 'Upload';
                $('#file_upload_msg').dialog('close');
                $('#burn_sw_btn').removeClass('disabled');
                $('#sw_log').text("Uploaded successfully");
            } else {
                $('#file_upload_msg').dialog('close');
                $('#sw_log').text("Failed to upload");
            }
        };

        // Send the Data.
        xhr.send(formData);
    }
});
