require([ '/js/api.js','/js/lib/jquery.js','/js/scheduler.js' ], function ( api,$,scheduler ) {
    var USERNAME = $.cookie('username');
    var USERACCESS = $.cookie('userAccess');
    var swForm = document.getElementById('sw-banks-form');

    var systemRowGlobal;

     /***
      * This function is used to show technician more options.
      * keyCode: ALT+SHIFT+T
      */
    var map = {18: false, 16: false, 84: false};
    function techPermissions()
    {
         $(document).keydown(function(e) {
             if (e.keyCode in map) {
                 map[e.keyCode] = true;
                 if (map[18] && map[16] && map[84]) {
                     axellInput("");
                     map = {18: false, 16: false, 84: false};
                 }
             }
         }).keyup(function(e) {
             if (e.keyCode in map) {
                 map[e.keyCode] = false;
             }
         });
    }

    function axellInput(message_string) {
       // Dialog here
       $('<form>'+message_string+'<input type="text" style="z-index:10000" name="name" autofocus><br></form>').dialog({
           title: "Technician Password ",
           modal: true,
           buttons: {
               'OK': function () {
                   var name = $('input[name="name"]').val();
                     if(name == "deko"){
                           $('#system_row').show();
                           $('#sw_history').show();                                        
                           $('#sys_history').show();                                        
                           $(this).dialog('close');
                           //alert("ok");
                     }else{
                           $(this).dialog('close');
                           //alert("not ok");
                     }
               },
               'Cancel': function () {
                   $(this).dialog('close');
               }
           }
       });
    };

    $(document).ready(function(){
        $('#swap_sys_sw').addClass('disabled');
        $('#swap_app_sw').addClass('disabled');

        techPermissions();

        api.exe({
                cmd: 'sw_sys_status',
                onSuccess: function (o)
                {
                    var sys_stat_text = o.ajaxdata.split("\n");
                    var text_length = sys_stat_text.length;
                    var otherKernel;
                    var otherCommon;
                    var otherTarget;
                    var bootedKernel;
                    var bootedCommon;
                    var bootedTarget;
                    var tokens;
                    
                    for(var i = 0; i < text_length; i ++){
                        if (sys_stat_text[i].includes("Other kernel") && !sys_stat_text[i].includes("partition")){
                            tokens = sys_stat_text[i].split(" ");
                            otherKernel = tokens[tokens.length - 1];
                        }
                        else if (sys_stat_text[i].includes("Other 'common' version")){
                            tokens = sys_stat_text[i].split(" ");
                            otherCommon = tokens[tokens.length - 1];
                        }
                        else if (sys_stat_text[i].includes("Other 'target' version")){
                            tokens = sys_stat_text[i].split(" ");
                            otherTarget = tokens[tokens.length - 1];
                        }
                        else if (sys_stat_text[i].includes("Booted kernel") && !sys_stat_text[i].includes("partition")){
                            tokens = sys_stat_text[i].split(" ");
                            bootedKernel = tokens[tokens.length - 1];
                        }
                        else if (sys_stat_text[i].includes("Booted 'common' version")){
                            tokens = sys_stat_text[i].split(" ");
                            bootedCommon = tokens[tokens.length - 1];
                        }
                        else if (sys_stat_text[i].includes("Booted 'target' version")){
                            tokens = sys_stat_text[i].split(" ");
                            bootedTarget = tokens[tokens.length - 1];
                         }
                    }
                    
                    
                    
                    var table = document.getElementById("blocksTable");
                    var header = table.createTHead();
                    var row = header.insertRow(0);
                    var cell0 = row.insertCell(0);
                    var cell1 = row.insertCell(1);
                    var cell2 = row.insertCell(2);
                    cell0.innerHTML = "<b>Active</b>";
                    cell1.innerHTML = "<b>Standby</b>";
                    
                    cell0.style.fontSize = "15px";
                    cell1.style.fontSize = "15px";
                    
                    cell0.style.textAlign = 'center';
                    cell1.style.textAlign = 'center';
                    
                    var systemRow = table.insertRow(1);
                    systemRowGlobal = systemRow;
                    systemRow.id = "system_row";
                    var systemCell0 = systemRow.insertCell(0);
                    var systemCell1 = systemRow.insertCell(1);
                    var systemCell2 = systemRow.insertCell(2);
                    
                    systemCell0.innerHTML = bootedKernel;
                    systemCell1.innerHTML = otherKernel;
                    systemCell2.innerHTML = '<a class="button" id ="swap_sys_sw">Swap Sys Software</a>';
                    $('#swap_sys_sw').click(function()
                    {
                       axellConfirm("info","Notice","Are you sure you want to swap sys sw?",function(){
                           $.blockUI({ 
                              fadeIn: 1000, 
                              timeout: 120000, 
                              onBlock: function() { 
                                api.exe({
                                    cmd: 'sw_sys_swap',
                                    onSuccess: function (o)
                                    {
                                      console.log("Swapping Sys SW");
                                    },
                                    onError: function ()
                                    {
                                      console.log(err.errorThrown);
                                    }
                                })
                              } 
                           }) 
                       })
                    });
                    
                    systemCell0.style.fontSize = "15px";
                    systemCell1.style.fontSize = "15px";
                    
                    var versionRow = table.insertRow(2);
                    var versionCell0 = versionRow.insertCell(0);
                    var versionCell1 = versionRow.insertCell(1);
                    var versionCell2 = versionRow.insertCell(2);
                    
                    versionCell0.innerHTML = bootedCommon + " / " + bootedTarget;
                    versionCell1.innerHTML = otherCommon + " / " + otherTarget;
                    versionCell2.innerHTML = '<a class="button" id ="swap_app_sw">Swap App Software</a>';
                    $('#swap_app_sw').click(function()
                    {
                       axellConfirm("info","Notice","Are you sure you want to swap app sw?",function(){
                           $.blockUI({ 
                              fadeIn: 1000, 
                              timeout: 120000, 
                              onBlock: function() { 
                                api.exe({
                                    cmd: 'sw_app_swap',
                                    onSuccess: function (o)
                                    {
                                      console.log("Swapping App SW");
                                    },
                                    onError: function ()
                                    {
                                      console.log(err.errorThrown);
                                    }
                                })
                              } 
                           }) 
                       })
                    });
                    
                    versionCell0.style.fontSize = "15px";
                    versionCell1.style.fontSize = "15px";

                    $('#swap_app_sw').removeClass('disabled');
                    $('#swap_sys_sw').removeClass('disabled');

                    $('#system_row').hide();                                        
                },
                onError: function ()
                {
                    console.log(err.errorThrown);
                }
        });

        api.exe({
                cmd: 'app_files',
                onSuccess: function (o)
                {
                    var appFiles = o.ajaxdata.split(",");
                    var table = document.getElementById("swTable");
                    var versionRow = [];

                    for(i = 0; i < appFiles.length; i++)
                    {
                       versionRow[i] = table.insertRow(i);
                       var versionCell0 = versionRow[i].insertCell(0);
                       var versionCell1 = versionRow[i].insertCell(1);
                       versionCell0.innerHTML = appFiles[i];
                       versionCell1.innerHTML = '<a class="button" id ="burn_app_sw_'+i+'">Burn</a>';
                    }

                    $('#sw_history').hide();                                        

                    $("a[id^=burn_app_sw_]").click(function(e){	
                        var id = this.id;
                        axellConfirm("info","Notice","Are you sure you want to burn this app sw?",function(){
                           $.blockUI({ 
                              fadeIn: 1000, 
                              timeout: 120000, 
                              onBlock: function() { 
                                 id = id.slice(id.indexOf("_")+1);
                                 id = id.slice(id.indexOf("_")+1);
                                 id = id.slice(id.indexOf("_")+1);
                                 api.exe({
                                    cmd: 'app_installer ' + appFiles[id],
                                    onSuccess: function (o)
                                    {
                                      console.log("Burn App SW");
                                    },
                                    onError: function ()
                                    {
                                      console.log(err.errorThrown);
                                    }
                                 })
                              } 
                           }) 
                        })
                    })

                },
                onError: function ()
                {
                    console.log(err.errorThrown);
                }
        });

        api.exe({
                cmd: 'sys_files',
                onSuccess: function (o)
                {
                    var sysFiles = o.ajaxdata.split(",");
                    var table = document.getElementById("sysTable");
                    var versionRow = [];

                    for(i = 0; i < sysFiles.length; i++)
                    {
                       versionRow[i] = table.insertRow(i);
                       var versionCell0 = versionRow[i].insertCell(0);
                       var versionCell1 = versionRow[i].insertCell(1);
                       versionCell0.innerHTML = sysFiles[i];
                       versionCell1.innerHTML = '<a class="button" id ="burn_sys_sw_'+i+'">Burn</a>';
                    }

                    $('#sys_history').hide();                                        

                    $("a[id^=burn_sys_sw_]").click(function(e){	
                        var id = this.id;
                        axellConfirm("info","Notice","Are you sure you want to burn this sys sw?",function(){
                           $.blockUI({ 
                              fadeIn: 1000, 
                              timeout: 120000, 
                              onBlock: function() { 
                                 id = id.slice(id.indexOf("_")+1);
                                 id = id.slice(id.indexOf("_")+1);
                                 id = id.slice(id.indexOf("_")+1);
                                 api.exe({
                                    cmd: 'sys_installer ' + sysFiles[id],
                                    onSuccess: function (o)
                                    {
                                      console.log("Burn Sys SW");
                                    },
                                    onError: function ()
                                    {
                                      console.log(err.errorThrown);
                                    }
                                 })
                              } 
                           }) 
                        })
                    })

                },
                onError: function ()
                {
                    console.log(err.errorThrown);
                }
        });
    });
});
