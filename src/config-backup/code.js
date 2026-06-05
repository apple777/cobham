require(['/js/api.js'], function (api) {

    var swFileInput = document.getElementById('backup_file');
    var USERACCESS = $.cookie('userAccess');
    var interval;

    // create and manage the configurations backup list
    function createBackupList() {
        // clear list
        $("#generalbackuplist").empty();
        $("#systembackuplist").empty();
        // get the configuration backups list
        axshCall("backup list", function (out, err) {
            if (err) {
                axellPopUp("ERROR!!! " + err + "\nPlease fix the error and refresh this page.");
                console.error("Could not find any backup files ");
                return;
            } else {
                var lines = split2(out, "\n");
                var system_lines = new Array();
                var general_lines = new Array();
                var system_index = 0;
                var general_index = 0;
                // split configuration backups to system & general
                for (var i = 0; i < lines.length; i++) {
                    if(lines[i].indexOf("SYSTEM_last.tar.gz") != -1)
                        continue;
                    if(lines[i].indexOf("GENERAL_last.tar.gz") != -1)
                        continue;
                    if(lines[i].indexOf("GENERAL_") != -1){
                        general_lines[general_index] = lines[i];
                        general_index++;
                        continue;
                    }
                    if(lines[i].indexOf("SYSTEM_") != -1){
                        system_lines[system_index] = lines[i];
                        system_index++;
                        continue;
                    }
                }
                
                // handle system list
                for (var i = 0; i < system_index; i++) {
                    // create row for each backup item
                    var tRow = $(document.createElement("TR"));
                    // the row contains the backup name and delete, download and load buttons
                    var tName = $(document.createElement("TD"));
                    var tDelete = $(document.createElement("a"));
                    var tDownload = $(document.createElement("a"));
                    var tLoad = $(document.createElement("a"));

                    var tDeleteText = $(document.createElement("div"));
                    var tDownloadText = $(document.createElement("div"));
                    var tLoadText = $(document.createElement("div"));

                    tDeleteText.addClass("icon error");
                    tDownloadText.addClass("icon downlink");
                    tLoadText.addClass("icon apply");

                    // get backup name
                    tName.html(system_lines[i]);

                    tDelete.addClass("class button");
                    tDownload.addClass("class button");
                    tLoad.addClass("class button");

                    tDelete.html("Delete");
                    tDownload.html("Download");
                    tLoad.html("Load");
                    
                    if((USERACCESS !="RW")&&(USERACCESS !="superuser")){
                        tDelete.addClass('disabled');
                        tDownload.addClass('disabled');
                        tLoad.addClass('disabled');
                    }
                    
                    // handle the delete button
                    tDelete.click(function () {
                        // get row index
                        var rowIndex = $(this).parent().index();

                        // confirm delete
                        axellConfirm("info","Notice","Are you sure you want to permanently delete " + system_lines[rowIndex] + "?", function () {
                            api.exe({
                                // delete command
                                cmd: "backup delete " + system_lines[rowIndex],
                                onSuccess: function (o) {
                                    // update list
                                    createBackupList();
                                },
                                onError: function (err) {
                                    // notify error
                                    axellPopUp(err.errorThrown);
                                }
                            })
                        }, function () {
                            return;
                        });
                    });

                    // handle the download button
                    tDownload.click(function () {
                        // get row index
                        var rowIndex = $(this).parent().index();
                        // confirm download
                        axellConfirm("info","Notice","Download " + system_lines[rowIndex] + "?", function () {
                            // download command
                            axshCall("backup download " + system_lines[rowIndex], function (out, err) {
                                if (err) {
                                    // notify error
                                    axellPopUp("ERROR!!! " + err + "\nPlease fix the error and refresh this page.");
                                    console.error("Could not find any backup files ");
                                    return;
                                } else {
                                    // download file
                                    window.location = out;
                                }
                            });


                        }, function () {
                            return;
                        });
                    });

                    // handle the load button
                    tLoad.click(function () {
                        // get row index
                        var rowIndex = $(this).parent().index();
                        var USERNAME = $.cookie('username');
                        if (USERNAME != 'sysadmin') {
                            axellPopUp("Configuration can be loaded only by system administrator.");
                        }

                        //confirm load
                        axellConfirm("info","Notice","Are you sure you want to load " + system_lines[rowIndex] + "?", function () {
                          $.blockUI({ 
                              message:  '<h1>Loading System Configuration. The System Will Reboot...</h1>',
                              fadeIn: 1000, 
                              timeout: 300000, 
                              onBlock: function() { 
                               api.exe({
                                   // load command
                                   cmd: "backup load " + system_lines[rowIndex],
                                   onSuccess: function (o) {
                                       // refresh list
                                       createBackupList();
                                   },
                                   onError: function (err) {
                                       // notify error
                                       axellPopUp(err.errorThrown);
                                   }
                               })
                              } 
                          })
                          interval = setInterval(CheckLoadFinished, 60000);  
                        }, function () {
                            return;
                        });
                    });

                    // create backup row
                    tRow.append(tName, tDelete, tDownload, tLoad);

                    // append backup row to list
                    $("#systembackuplist").append(tRow);

                }
                for (var i = 0; i < general_index; i++) {
                    // create row for each backup item
                    var tRow = $(document.createElement("TR"));
                    // the row contains the backup name and delete, download and load buttons
                    var tName = $(document.createElement("TD"));
                    var tDelete = $(document.createElement("a"));
                    var tDownload = $(document.createElement("a"));
                    var tLoad = $(document.createElement("a"));

                    var tDeleteText = $(document.createElement("div"));
                    var tDownloadText = $(document.createElement("div"));
                    var tLoadText = $(document.createElement("div"));

                    tDeleteText.addClass("icon error");
                    tDownloadText.addClass("icon downlink");
                    tLoadText.addClass("icon apply");

                    // get backup name
                    tName.html(general_lines[i]);
                    
                    tDelete.addClass("class button");
                    tDownload.addClass("class button");
                    tLoad.addClass("class button");

                    tDelete.html("Delete");
                    tDownload.html("Download");
                    tLoad.html("Load");
                    
                    if((USERACCESS !="RW")&&(USERACCESS !="superuser")){
                        tDelete.addClass('disabled');
                        tDownload.addClass('disabled');
                        tLoad.addClass('disabled');
                    }
                    // handle the delete button
                    tDelete.click(function () {
                        // get row index
                        var rowIndex = $(this).parent().index();

                        // confirm delete
                        axellConfirm("info","Notice","Are you sure you want to permanently delete " + general_lines[rowIndex] + "?", function () {
                            api.exe({
                                // delete command
                                cmd: "backup delete " + general_lines[rowIndex],
                                onSuccess: function (o) {
                                    // update list
                                    createBackupList();
                                },
                                onError: function (err) {
                                    // notify error
                                    axellPopUp(err.errorThrown);
                                }
                            })
                        }, function () {
                            return;
                        });
                    });

                    // handle the download button
                    tDownload.click(function () {
                        // get row index
                        var rowIndex = $(this).parent().index();
                        // confirm download
                        axellConfirm("info","Notice","Download " + general_lines[rowIndex] + "?", function () {
                            // download command
                            axshCall("backup download " + general_lines[rowIndex], function (out, err) {
                                if (err) {
                                    // notify error
                                    axellPopUp("ERROR!!! " + err + "\nPlease fix the error and refresh this page.");
                                    console.error("Could not find any backup files ");
                                    return;
                                } else {
                                    // download file
                                    window.location = out;
                                }
                            });


                        }, function () {
                            return;
                        });
                    });

                    // handle the load button
                    tLoad.click(function () {
                        // get row index
                        var rowIndex = $(this).parent().index();
                        var USERNAME = $.cookie('username');
                        if (USERNAME != 'sysadmin') {
                            axellPopUp("Configuration can be loaded only by system administrator.");
                        }


                        //confirm load
                        axellConfirm("info","Notice","Are you sure you want to load " + general_lines[rowIndex] + "?", function () {
                          $.blockUI({ 
                              //message:  '<h1>Loading General Configuration. The System Will Reboot...</h1>',
                              fadeIn: 1000, 
                              timeout: 300000, 
                              onBlock: function() { 
                               api.exe({
                                   // load command
                                   cmd: "backup generalload " + general_lines[rowIndex],
                                   onSuccess: function (o) {
                                       // refresh list
                                       createBackupList();
                                   },
                                   onError: function (err) {
                                       // notify error
                                       axellPopUp(err.errorThrown);
                                   }
                               })
                              } 
                          }) 
                          interval = setInterval(CheckLoadFinished, 10000);  
                        }, function () {
                            return;
                        });
                    });

                    // create backup row
                    tRow.append(tName, tDelete, tDownload, tLoad);

                    // append backup row to list
                    $("#generalbackuplist").append(tRow);

                }
            }
        });
    }

    function CheckLoadFinished() 
    {
      api.exe({
       cmd: 'get mdl',
       dataType: 'text',
       async: false,
       onSuccess: function () {
         $.unblockUI();
         clearInterval(interval);
         $("#popupsuccess").dialog("open");
       }
      })
    }

    $(document).ready(function () {

        if (sessionStorage.getItem('header-get-mdl').indexOf("DOBR") != -1)
        {
            $('#general_backup_files').remove();
            $('#but_general_save').remove();
        }

        $('#popupsuccess').dialog({
            width : 250,
            height : 150,
            resizable : false,
            autoOpen : false,
            title : "Configuration loading",
            buttons:{
                'Ok': function () {
                  $(this).dialog('close');
                  location.reload();
                }
            }
        })

        // refresh the list
        createBackupList();
        
        if((USERACCESS !="RW")&&(USERACCESS !="superuser")){
            $('#but_clear').addClass('disabled');
            $('#but_select').addClass('disabled');
        }

        
        // save current configuration button
        $('#but_system_save').click(function () {
            if (!$(this).hasClass('disabled')) {
              $.blockUI({ 
                  fadeIn: 1000, 
                  timeout: 300000, 
                  onBlock: function() { 
                   api.exe({
                       // save configuration command
                       cmd: "backup save",
                       onSuccess: function (o) {
                           // refresh list
                           createBackupList();
                           $.unblockUI();
                       },
                       onError: function (err) {
                           // notify error
                           axellPopUp(err.errorThrown);
                           $.unblockUI();
                       }
                   })
                  } 
              }) 
            }
        });
        // save current configuration button
        $('#but_general_save').click(function () {
            if (!$(this).hasClass('disabled')) {
              $.blockUI({ 
                  fadeIn: 1000, 
                  timeout: 300000, 
                  onBlock: function() { 
                   api.exe({
                       // save configuration command
                       cmd: "backup generalsave",
                       onSuccess: function (o) {
                           // refresh list
                           createBackupList();
                           $.unblockUI();
                       },
                       onError: function (err) {
                           // notify error
                           axellPopUp(err.errorThrown);
                           $.unblockUI();
                       }
                   })
                  } 
              }) 
            }
        });
        // delete all configuration backups button
        $('#but_clear').click(function () {

            //confirm delete of all files
            axellConfirm("info","Notice","Are you sure you want to permanently delete all configuration backups?", function () {
                api.exe({
                    // delete all command
                    cmd: "backup deleteall",
                    onSuccess: function (o) {
                        // refresh list
                        createBackupList();
                    },
                    onError: function (err) {
                        axellPopUp(err.errorThrown);
                    }
                })
            }, function () {
                return;
            });
        });

        // upload configuration button
        $('#backup_file').change(function () {
            if (swFileInput.value != "") {
                // get the requested file
                var file = swFileInput.files[0];
                // confirm uploading the file
                axellConfirm("info","Notice","upload file " + file.name + "?", function () {
                    // Get the selected file
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
                            api.exe({
                                cmd: "backup upload " + file.name,
                                onSuccess: function (o) {
                                    // refresh list
                                    createBackupList();
                                    swFileInput.value = "";
                                },
                                onError: function (err) {
                                    // notify error
                                    axellPopUp(err.errorThrown);
                                }
                            })
                        } else {
                            // notify error
                            axellPopUp("file upload failed");
                        }
                    };
                    // Send the Data.
                    xhr.send(formData);
                }, function () {
                    return;
                });
            }
        })
    });
});
