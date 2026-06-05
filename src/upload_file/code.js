require([ '/js/api.js','/js/lib/jquery.js','/js/scheduler.js' ], function ( api,$,scheduler ) {
    var USERACCESS = $.cookie('userAccess');
    var swForm = document.getElementById('sw-upgrade-form');
    var swFileInput = document.getElementById('sw-file');
    var swUploadBtn = document.getElementById('upload_sw');

    function ClearSwFolder(){
       var command = "clear_sw_folder";
       api.exe({
         cmd: command,
         dataType: 'text',
         async: false,
         onSuccess: function (o) {
            console.log(o.ajaxdata);
         }
        })
    }

    function CopySwFile(){
       var fileName;
       if(swFileInput.value.indexOf("fakepath") != -1)
         fileName = swFileInput.value.substring(12);
       else  
         fileName = swFileInput.value;
       var command = "copy_sw_file " + fileName;
       api.exe({
         cmd: command,
         dataType: 'text',
         async: false,
         onSuccess: function (o) {
            console.log(o.ajaxdata);
         }
        })
    }

    $(document).ready(function(){

        $('#file_upload_msg').hide();
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
        $('#clear_sw').click(function(){
            ClearSwFolder();
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
                CopySwFile();
            } else {
                $('#file_upload_msg').dialog('close');
                $('#sw_log').text("Failed to upload");
            }
        };

        // Send the Data.
        xhr.send(formData);
    }

});
