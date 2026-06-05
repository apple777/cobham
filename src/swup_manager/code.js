require([ '/js/api.js','/js/lib/d3.min.js','/js/lib/jquery.js','/js/convert.js','/js/scheduler.js','/js/util.js','/js/lib/jquery-jsPlumb.js','/js/lib/jquery-ui.js','/js/lib/underscore.js','/js/lib/tipsy.js' ],
    function ( api,d3,$,convert,scheduler,util) {    
    
    var upgradeDate;
    var upgradeTime;
    var upgradeFiles=[];
    var deviceType=["MSDH","MTDI","RRU40","RRU"];
    var topo=[];
    var topoConn=[];
    var msdhdate=[];
    var conn=[];
    var swupStatus=[];
    var swupFiles=[];
    var tableRows=[];
    var tableRowIP=[];
    var typeTrue = 1;
    var idTrue = 1;
    var statusTrue = 1;
    var comTrue = 1;
    var tagTrue = 1;
    var locationTrue = 1;
    var systemTrue = 1;
    var commonTrue = 1;
    var targetTrue = 1;
    var ipTrue = 1;
    var interval;
    var cancelButtonCreated = false;
    var swapButtonCreated = false;

    var selectedRowID;
    var selectedRow;
    var msdhRow = -1;

    var operator_list = $.parseJSON($.cookie('operatorCook'));

    function makeRow ( line ) {
        var tr = document.createElement( "tr" );
        var td = document.createElement( "td" );
        td.innerHTML = line;
        tr.appendChild( td );
        return tr;
    }

    function getTopology(){
        var command = "topology -o " + operator_list[0].SysName + " --json";
        api.exe({
            cmd: command, //'topology --json',
            dataType: 'json',
            async: false,
            onSuccess: function (o) {
                $.each(o.ajaxdata.nodes, function (i, top) {
                    topo[i] = top;
              })
            }
        })
    }

    function getConnections(){
        var command = "connections -o " + operator_list[0].SysName + " --json";
        api.exe({
            cmd: command,
            dataType: 'json',
            async: false,
            onSuccess: function (o) {
                $.each(o.ajaxdata.BUNDLEGROUP, function (i, top) {
                    conn[i] = top;
              })
            }
        })
    }

    function getSwupStatus(){
        var command = "get_swup_status";
        api.exe({
            cmd: command,
            dataType: 'json',
            async: false,
            onSuccess: function (o) {
                $.each(o.ajaxdata.nodes, function (i, top) {
                    swupStatus[i] = top;
              })
            }
        })
    }

    function getSwupFiles(){
        var command = "get_swup_files";
        api.exe({
            cmd: command,
            dataType: 'json',
            async: false,
            onSuccess: function (o) {
                $.each(o.ajaxdata.nodes, function (i, top) {
                    swupFiles[i] = top;
              })
            }
        })
    }

    function setSwupApply(str){
       var command = "swup_apply " + str;
       api.exe({
         cmd: command,
         dataType: 'text',
         async: false,
         onSuccess: function (o) {
            console.log(o.ajaxdata);
         }
        })
    }

    function setSwupAcknowledge(str){
       var command = "swup_acknowledge " + str;
       api.exe({
         cmd: command,
         dataType: 'text',
         async: false,
         onSuccess: function (o) {
            console.log(o.ajaxdata);
         }
        })
    }

    function setSwupClear(){
       var command = "swup_clear";
       api.exe({
         cmd: command,
         dataType: 'text',
         async: false,
         onSuccess: function (o) {
            console.log(o.ajaxdata);
         }
        })
    }

    function setSwupCancel(){
       var command = "swup_cancel";
       api.exe({
         cmd: command,
         dataType: 'text',
         async: false,
         onSuccess: function (o) {
            console.log(o.ajaxdata);
         }
        })
    }

    function getMsdhDate(){
        var command = "get_date";
        api.exe({
            cmd: command,
            dataType: 'json',
            async: false,
            onSuccess: function (o) {
                $.each(o.ajaxdata.msdh_date, function (i, top) {
                    msdhdate[i] = top;
              })
            }
        })
    }

    function OrderTopoByConn()
    {
        var l = 0;
        topoConn.length = 0;
        for(var k = 0; k < conn.length; k ++) 
        {
           for(var m = 0; m < conn[k].nodes.length; m ++) 
           {
              for(var i = 0; i < topo.length; i ++) 
              {
                  if (conn[k].nodes[conn[k].nodes.length-m-1].ID == topo[i]['ID'])
                  {
                     topoConn[l] = topo[i];
                     l++;
                     break;
                  }
              }
           }
        }

        for(var i = 0; i < topo.length; i ++) 
        {
           var found = false;
           for(var j = 0; j < topoConn.length; j ++) 
           {
               if (topo[i]['ID'] == topoConn[j]['ID'])
               {
                  found = true;
                  break;
               }
           }
           if ((!found) && (topo[i]['Node Type'] != 'MSDH-M') && (topo[i]['Node Type'] != 'MSDH-R'))
             topoConn[topoConn.length] = topo[i];
        }

        for(var i = 0; i < topo.length; i ++) 
        {
           var found = false;
           for(var j = 0; j < topoConn.length; j ++) 
           {
               if (topo[i]['ID'] == topoConn[j]['ID'])
               {
                  found = true;
                  break;
               }
           }
           if ((!found) && (topo[i]['Node Type'] == 'MSDH-M'))
             topoConn[topoConn.length] = topo[i];
        }
    }


    function createInventoryTable() {
        OrderTopoByConn();
        tableRows.splice(0,tableRows.length);
        tableRowIP.splice(0,tableRowIP.length);
        var trCount = 0;
        var createClearButton = true;
        var createSwapButton = true;
        var createCancelButton = false;
        var finish = true;
        var showFailPopup = false;
        var failCounter = 0;
        for(var i = 0; i < topoConn.length; i ++) {

            var deviceSkip = true;
            var statusStr;               
            if(swupStatus.length == 0)
            {
               for(var j = 0; j < deviceType.length; j ++) 
               {
                  if (topoConn[i]['Node Type'].indexOf(deviceType[j]) != -1)
                  {
                     deviceSkip = false;
                     break;
                  }
               }
            }
            else
            {
               for(var j = 0; j < swupStatus.length; j ++)
               {
                  if (swupStatus[j]['sn'] == topoConn[i]['ID'])
                  {
                     deviceSkip = false;
                     statusStr = swupStatus[j]['status'];
                     break;
                  }
               }
            }
            if(deviceSkip)
                continue;

            var row = $("<tr />");
            $('#inventory-table').append(row);

            if(swupStatus.length == 0)
            {
               row.append($("<td>" + '<input type="checkbox" id=devicechoose_' + topoConn[i]['ID'] + ' checked/>' + "</td>"));
            }
            else
            {
               row.append($("<td>" + (trCount + 1) + "</td>"));
            }
            row.append($("<td>" + topoConn[i]['Node Type']  + "</td>"));
            row.append($("<td>" + topoConn[i]['ID']         + "</td>"));

            if(topoConn[i]['Node Type'].indexOf('MSDH-M') == -1){
                if(topoConn[i]['Comm'] == 1) {
                    row.append($("<td> <div class='icon error'></div></td>"));    
                }
                else if(topoConn[i]['Comm'] == 0) {
                    row.append($("<td> <div class='icon ok'></div></td>"));    
                }
                else {
                    row.append($("<td> <div class='icon ok_disabled'></div></td>"));    
                }
            } else {
                row.append($("<td> <div class='icon ok'></div></td>"));
                msdhRow = trCount;
            }
            row.append($("<td>" + topoConn[i]['Tag']        + "</td>"));
            row.append($("<td>" + topoConn[i]['Location']   + "</td>"));
            row.append($("<td>" + topoConn[i]['System']     + "</td>"));
            row.append($("<td>" + topoConn[i]['Common']     + "</td>"));
            row.append($("<td>" + topoConn[i]['Target']     + "</td>"));
            row.append($("<td>" + topoConn[i]['IP']         + "</td>"));

            
            if(swupStatus.length == 0)
            {
               createClearButton = false;
               createSwapButton = false;
               createCancelButton = false;
               finish = false;
               showFailPopup = false;
            }
            else
            {            

               if(statusStr.indexOf("fail") != -1)
               {
                  row.append($("<td>" + statusStr.fontcolor("red") + "</td>"));

                  //row.append($("<td>" + '<button type="button" class="button" id=confirmfail_' + topoConn[i]['ID'] + '>Acknowledge</button>' + "</td>"));
                  failCounter++;
               }
               else if(statusStr.indexOf("complete") != -1)
               {
                  row.append($("<td>" + statusStr.fontcolor("green") + "</td>"));

                  //createClearButton = false;
               }
               else
               {
                  row.append($("<td>" + statusStr + "</td>"));
               }

               if(statusStr.indexOf("complete") == -1 && statusStr.indexOf("fail") == -1)
               {
                  createClearButton = false;
                  createCancelButton = true;
                  //showFailPopup = true;
                  finish = false;
               }

               if(statusStr.indexOf("swap") == -1 && statusStr.indexOf("Swap") == -1)
               {
                  createSwapButton = false;
               }
            }

            tableRows[trCount] = row;
            tableRowIP[trCount] = topoConn[i]['IP'];
            trCount++;
        }

        if (createClearButton)
        {
            $("#control_buttons").append('<button type="button" class="button" style="float:right" id="clearstatus">Clear Status</button>');
            $("#clearstatus").click(function(e){	
               $.blockUI({ 
                  fadeIn: 1000, 
                  timeout: 300000, 
                  onBlock: function() { 
                     setSwupClear();
                     setInterval(RelodPage, 10000);        
                  } 
               }) 
            })
        }

        if (createSwapButton && !swapButtonCreated)
        {
            swapButtonCreated = true;

            $("#control_buttons").append('<button type="button" class="button" style="float:right" id="swapproccess">Swap Now</button>');
            $("#swapproccess").click(function(e){	
               axellConfirm("info","Notice","The swap will be performed in 20 minutes. Do you want to continue?",function(){
                  var x = new Date(msdhdate[0].date+" "+msdhdate[0].time);
                  x.setMinutes(x.getMinutes() + 20);
                  var y = x.getFullYear();
                  var m = x.getMonth()+1;
                  if(m < 10)
                     m = "0"+m;
                  var d = x.getDate();
                  if(d < 10)
                     d = "0"+d;
                  var h = x.getHours(); 
                  if(h < 10)
                     h = "0"+h;
                  var mi = x.getMinutes(); 
                  if(mi < 10)
                     mi = "0"+mi;
                  upgradeDate = y + "-" + m + "-" + d;
                  upgradeTime = h + ":" + mi;
                  api.exe({
                     cmd: 'swup_swap ' + upgradeDate + ' ' + upgradeTime,
                     onSuccess: function (o)
                     {
                       console.log("New swap date set");
                     },
                     onError: function ()
                     {
                       console.log(err.errorThrown);
                     }
                  });
               })
            })
        }

        if (createCancelButton && !cancelButtonCreated)
        {
            cancelButtonCreated = true;

            $("#control_buttons").append('<button type="button" class="button" style="float:right" id="cancelproccess">Cancel</button>');
            $("#cancelproccess").click(function(e){	
               axellConfirm("info","Notice","Are you sure you want to cancel the process?",function(){
                  $.blockUI({ 
                     fadeIn: 1000, 
                     timeout: 300000, 
                     onBlock: function() { 
                        setSwupCancel();
                        setInterval(RelodPage, 30000);        
                     } 
                  }) 
               })
            })
        }

        if (finish)
        {
            clearInterval(interval);
        }

        if (showFailPopup && failCounter > 0)
        {
	         $("#popupfail").dialog("open");
        }

        /*$("button[id^=confirmfail_]").click(function(e){	
            var id = this.id;
            id = id.slice(id.indexOf("_")+1);
     
            var obj={sn:id};
            var str = JSON.stringify(obj);
            setSwupAcknowledge(str);
        })*/

        $("#checkall").click(function(e){	
            for(var i = 0; i < topoConn.length; i ++) 
            {
               for(var j = 0; j < deviceType.length; j ++) 
               {
                  if (topoConn[i]['Node Type'].indexOf(deviceType[j]) != -1)
                  {
                     document.getElementById("devicechoose_" + topoConn[i]['ID']).checked = document.getElementById("checkall").checked;
                     break;
                  }
               }
            }
        })
    }

    var sort_by = function(field, reverse, primer){
        var key = function (x) {return primer ? primer(x[field]) : x[field]};

        return function (a,b) {
            var A = key(a), B = key(b);
            return ( (A < B) ? -1 : ((A > B) ? 1 : 0) ) * [-1,1][+!!reverse];                  
        }
    }
    
    function hideInventory() {
        var inventoryTableContent = document.getElementById('inventory-table');
        var rows = inventoryTableContent.getElementsByTagName('tr');
        var rowsCount = rows.length;
        for(var x=rowsCount - 1; x > 0; x--){
            inventoryTableContent.deleteRow(x);
        }
    }

    function showInventory() {
        hideInventory();
        for(var rowsCount = 0; rowsCount < topo.length; rowsCount++){
            $('#inventory-table').append(tableRows[rowsCount]);
        }
        $('#inventory-table tr').click( function ( e ) {
            if(e.currentTarget.rowIndex == 0)
                return;
            $( this ).toggleClass( "active" );
            if(selectedRow != null){
                selectedRow.toggleClass( "active" );
            }
            selectedRow = $(this);
            if(e.currentTarget.rowIndex) {
                $("#login_button").removeClass("disabled");
                selectedRowID = e.currentTarget.rowIndex;
            }
            else {
                $('#login_button').addClass('disabled');
                selectedRowID = 0;
            }
        })
    }
    
    function CreateSwupSettings()
    {
   	 $("#control_buttons").append('<a style="float:left;font-size:17px;padding-right:10px;" target="_blank" href="/upload_file/">Upload Firmware</a>');
   	 $("#control_buttons").append('<span style="float:left;font-size:17px;padding-right:10px;" id="spanfile">Set Firmware:</span>');
       var selectorInput = document.createElement("select");
       selectorInput.setAttribute("style","visibility:visible;float: left;min-width: 180px;");
       selectorInput.setAttribute("id", "selecttype");
       for(var i = 0; i < deviceType.length; i ++) 
       {
          var option = document.createElement("option");
          option.text = deviceType[i];
          selectorInput.add(option);
       }
       $(selectorInput).insertAfter("#spanfile");
       selectorInput = document.createElement("select");
       selectorInput.setAttribute("style","visibility:visible;float: left;min-width: 180px;");
       selectorInput.setAttribute("id", "selectfile");
       for(var i = 0; i < swupFiles.length; i ++)
       {
         if ((swupFiles[i]['file'].indexOf(deviceType[0]+"-") != -1) || (swupFiles[i]['file'].indexOf("System") != -1))
         {
            var fileOption = document.createElement("option");
            fileOption.text = swupFiles[i]['file'];
            selectorInput.add(fileOption);
         }
       }
       $(selectorInput).insertAfter("#selecttype");
       $("#control_buttons").append('<button type="button" class="button" style="float:left" id="setversion">Set</button>');

   	 $("#control_buttons").append('<span style="float:left;font-size:17px;padding-right:10px;margin-left:30px" id="spantime">Set Date and Time:</span>');
       $("#control_buttons").append('<input type="date" style="float:left" id="setdate" value="2000-01-01" onChange="SetDate()"/>');
       $("#control_buttons").append('<input type="time" style="float:left" id="settime" value="00:00" onChange="SetTime()"/>');
       $("#control_buttons").append('<button type="button" class="button" style="float:left" id="settimedate">Set</button>');

       $("#control_buttons").append('<button type="button" class="button" style="float:right" id="applyupgrade">Apply</button>');

       if(msdhdate.length == 1)
       {
          $('#setdate').val(msdhdate[0].date);
          $('#settime').val(msdhdate[0].time);
       }
       else
       {
          $('#setdate').val("9999-12-31");
          $('#settime').val("00:00:00");
       }

       $("#setversion").click(function(e){	
         upgradeFiles[document.getElementById("selecttype").value] = document.getElementById("selectfile").value;
       })

       $("#settimedate").click(function(e){	
         upgradeDate = document.getElementById("setdate").value;
         upgradeTime = document.getElementById("settime").value;
       })

       $("#applyupgrade").click(function(e){
         var str = "";	
         for(var i = 0; i < deviceType.length; i ++) 
         {
            str += deviceType[i] + " : " + upgradeFiles[deviceType[i]] + "<br>";
         }
         str += "<br>Swap Date: " + upgradeDate + " " + upgradeTime; 
         document.getElementById("popupapply").innerHTML = str;
         
         $("#popupapply").dialog("open");
       })

       $("#selecttype").change(function(){
         $("#selectfile").empty();
         var selectorInput = document.getElementById("selectfile");
         for(var i = 0; i < swupFiles.length; i ++)
         {
            if ((swupFiles[i]['file'].indexOf(selecttype.value+"-") != -1) || (swupFiles[i]['file'].indexOf("System") != -1))
            {
               var fileOption = document.createElement("option");
               fileOption.text = swupFiles[i]['file'];
               selectorInput.add(fileOption);
            }
         }
       });
    }
    
    function ApplyUpgrade()
    {
      var obj=[];
      var fileName;

      var o = 0;
      for(var i = 0; i < topoConn.length; i ++) 
      {
         var deviceSkip = true;
         for(var j = 0; j < deviceType.length; j ++) 
         {
            if (topoConn[i]['Node Type'].indexOf(deviceType[j]) != -1)
            {
               fileName = upgradeFiles[deviceType[j]];
               deviceSkip = false;
               break;
            }
         }
         if (deviceSkip)
             continue;

         if (document.getElementById("devicechoose_" + topoConn[i]['ID']).checked)
         {
            obj[o]={sn:topoConn[i]['ID'],
                    filename:fileName,
                    date:upgradeDate,            
                    time:upgradeTime            
                   };

            o++;
         }
      }

      var str = JSON.stringify(obj);
      setSwupApply(str);

      setInterval(RelodPage, 10000);        
    }

    function CreateSwupStatus(update)
    {
       if(!update)
   	   $("#control_buttons").append('<span style="float:left;font-size:17px;padding-right:10px;" id="spandate"></span>');
       document.getElementById("spandate").innerHTML = "Swap Date: " + swupStatus[0]['date'];

       if(!update)
         document.getElementById("checkall").hidden = true;
    }

    $( document ).ready(function(e) {
        
        $('#popupfail').dialog({
            width : 250,
            height : 150,
            resizable : false,
            autoOpen : false,
            title : "Upgrade failed",
            buttons:{
                'Continue': function () {
                  $(this).dialog('close');
                },
                'Cancel' : function () {
                  setSwupCancel();
                  setInterval(RelodPage, 120000);        
                  $(this).dialog('close');
                }
            }
        })

        $('#popupapply').dialog({
            width : 350,
            height : 200,
            resizable : false,
            autoOpen : false,
            title : "Upgrade apply",
            buttons:{
                'Continue': function () {
                  $(this).dialog('close');
                  $.blockUI({ 
                     fadeIn: 1000, 
                     timeout: 300000, 
                     onBlock: function() { 
                        ApplyUpgrade();
                     } 
                  }) 
                },
                'Cancel' : function () {
                  $(this).dialog('close');
                }
            }
        })

        document.getElementById("Node Type").onclick = function(e){
            topo.sort(sort_by('Node Type',typeTrue,function(ee){return ee.toUpperCase()}))
            typeTrue = (typeTrue == 0) ? 1 : 0;
            createInventoryTable();
            showInventory();
        };
        document.getElementById("ID").onclick = function(e){
            topo.sort(sort_by('ID',idTrue,function(ee){return ee.toUpperCase()}))
            idTrue = (idTrue == 0) ? 1 : 0;
            createInventoryTable();
            showInventory();
        };
        document.getElementById("Comm").onclick = function(e){
            topo.sort(sort_by('Comm',comTrue,function(ee){return ee.toUpperCase()}))
            comTrue = (comTrue == 0) ? 1 : 0;
            createInventoryTable();
            showInventory();
        };
        document.getElementById("Tag").onclick = function(e){
            topo.sort(sort_by('Tag',tagTrue,function(ee){return ee.toUpperCase()}))
            tagTrue = (tagTrue == 0) ? 1 : 0;
            createInventoryTable();
            showInventory();
        };
        document.getElementById("Location").onclick = function(e){
            topo.sort(sort_by('Location',locationTrue,function(ee){return ee.toUpperCase()}))
            locationTrue = (locationTrue == 0) ? 1 : 0;
            createInventoryTable();
            showInventory();
        };
        document.getElementById("System").onclick = function(e){
            topo.sort(sort_by('System',systemTrue,function(ee){return ee.toUpperCase()}))
            systemTrue = (systemTrue == 0) ? 1 : 0;
            createInventoryTable();
            showInventory();
        };
        document.getElementById("Common").onclick = function(e){
            topo.sort(sort_by('Common',commonTrue,function(ee){return ee.toUpperCase()}))
            commonTrue = (commonTrue == 0) ? 1 : 0;
            createInventoryTable();
            showInventory();
        };
        document.getElementById("Target").onclick = function(e){
            topo.sort(sort_by('Target',targetTrue,function(ee){return ee.toUpperCase()}))
            targetTrue = (targetTrue == 0) ? 1 : 0;
            createInventoryTable();
            showInventory();
        };
        document.getElementById("IP").onclick = function(e){
            topo.sort(sort_by('IP',ipTrue,function(ee){return ee.toUpperCase()}))
            ipTrue = (ipTrue == 0) ? 1 : 0;
            createInventoryTable();
            showInventory();
        };
        document.getElementById("Status").onclick = function(e){
            topo.sort(sort_by('Status',statusTrue,function(ee){return ee.toUpperCase()}))
            statusTrue = (statusTrue == 0) ? 1 : 0;
            createInventoryTable();
            showInventory();
        };

        getMsdhDate();
        getTopology();
        getConnections();
        topo.sort(sort_by('Tag', true, function(a){return a.toUpperCase()}));
        getSwupStatus(); 
        getSwupFiles();
        
        if(swupStatus.length == 0)
        {
            CreateSwupSettings();        
        }
        else
        {
            CreateSwupStatus(false);
            interval = setInterval(RefreshPage, 10000);        
        }
        
        createInventoryTable();
        showInventory();
    });

    function RelodPage()
    {
      location.reload();
    }

    function RefreshPage()
    {
        getMsdhDate();
        topo.sort(sort_by('Tag', true, function(a){return a.toUpperCase()}));
        getSwupStatus(); 
        CreateSwupStatus(true);
        createInventoryTable();
        showInventory();
    }
})


function SetDate()
{
}
function SetTime()
{
}











