require([ '/js/api.js','/js/lib/d3.min.js','/js/lib/jquery.js','/js/convert.js','/js/scheduler.js','/js/util.js','/js/lib/jquery-jsPlumb.js','/js/lib/jquery-ui.js','/js/lib/underscore.js','/js/lib/tipsy.js' ],
    function ( api,d3,$,convert,scheduler,util) {
    var USERNAME = $.cookie('username');
    var USERACCESS = $.cookie('userAccess');
    var topo=[];
    var topoRow=[];
    var conn=[];
    var topoConn=[];
    var patches=[];
    var updateTimes=[];
    var rf=[];
    var bandList=[];
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
    var prmTrue = 1;
    var prmToggle;

    var selectedRowID;
    var selectedRow;
    var selectedRowSerial;
    var msdhRow = -1;
    
    var checkedRows=[];
    
    var operator_list = $.parseJSON($.cookie('operatorCook'));

    axshCall( "get prm", function ( out, err ) {
        if (out == 0){
            prmToggle = false;
            document.getElementById("PRM").style.display = "none";
            document.getElementById("filterPRM").style.visibility = "hidden";
        }else{
            prmToggle = true;
            document.getElementById("PRM").style.display = "table-cell";
            document.getElementById("filterPRM").style.visibility = "visible";
        }              
    });

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
                    checkedRows[i] = 0;
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

    function getPatches(){
        var command = "get_patches_all";
        api.exe({
            cmd: command,
            dataType: 'text',
            async: false,
            onSuccess: function (o) {
               var tmp = o.ajaxdata.split(String.fromCharCode(10));
               for (i = 0; i < tmp.length; i++)
               {
                  patches[i] = tmp[i].split(": ");
               }
            }
        })
    }

    function getUpdateTimes(){
        var command = "alarms updatetime --json";
        api.exe({
            cmd: command, //'topology --json',
            dataType: 'json',
            async: false,
            onSuccess: function (o) {
                $.each(o.ajaxdata.updatetime, function (i, time) {
                    updateTimes[i] = time;
                })
            }
        })
    }

    function getRfranges(){
        var command = "rfranges --json";
        api.exe({
            cmd: command,
            dataType: 'json',
            async: false,
            onSuccess: function (o) {
                $.each(o.ajaxdata.nodes, function (i, top) {
                    rf[i] = top;
                })
            }
        })
    }

    function getBandList(){
        var command = "bands --json";
        api.exe({
            cmd: command,
            dataType: 'json',
            async: false,
            onSuccess: function (o) {
               bandList = o.ajaxdata.bands;
            }
        })
    }

    function getCommands(){
        var command = "inventory_cmd";
        api.exe({
            cmd: command,
            dataType: 'json',
            async: false,
            onSuccess: function (o) {
                $.each(o.ajaxdata.cmds, function (i, top) {
                   $('#batch_commands').append($('<option>', {
                       value: top.cmd.split(":")[1],
                       text: top.cmd.split(":")[0]
                   }));
                })
            }
        })
    }

    function createInventoryTable() {
        tableRows.splice(0,tableRows.length);
        tableRowIP.splice(0,tableRowIP.length);
        var trCount = 0;
        var inventoryTableContent = document.getElementById('inventory-table');
        var rows = inventoryTableContent.getElementsByTagName('tr');
        var rowsCount = rows.length;
        for(var x=rowsCount - 1; x > 0; x--){
            inventoryTableContent.deleteRow(x);
        }

        var StatusRow = document.getElementById('Status');
        var CommRow = document.getElementById('Comm');
        var IDRow = document.getElementById('ID');
        var NodeTypeRow = document.getElementById('Node Type');
        var CommonRow = document.getElementById('Common');
        var TargetRow = document.getElementById('Target');
        var SystemRow = document.getElementById('System');
        var IPRow = document.getElementById('IP');
        var TimeRow = document.getElementById('QueryTime');
        var BandsRow = document.getElementById('Bands');
        if(prmToggle){
            var RedundancyRow = document.getElementById('PRM');
        }
        var IndexRow = document.getElementById('Index');
        
        TargetRow.setAttribute("style","width: 75px;");
        SystemRow.setAttribute("style","width: 75px;");
        
        StatusRow.setAttribute("style","width: 50px;");
        CommRow.setAttribute("style","width: 50px;");
        
        IDRow.setAttribute("style","width: 75px;");
        NodeTypeRow.setAttribute("style","width: 75px;");
        CommonRow.setAttribute("style","width: 75px;");
        IPRow.setAttribute("style","width: 75px;");
        TimeRow.setAttribute("style","width: 120px;");
        BandsRow.setAttribute("style","width: 120px;");
        if(prmToggle){
            RedundancyRow.setAttribute("style","width: 120px;");
        }
        IndexRow.setAttribute("style","width: 104px; text-align:center");

        for(var i = 0; i < topo.length; i ++) {
            if(topo[i]['Node Type'].indexOf("VIRT") != -1)
                continue;
            
            var row;
            
            if(selectedRowSerial == topo[i]['ID'])
                row = $('<tr class="active" id="' + topo[i]['ID'] + '"/>');
            else
                row = $('<tr id="' + topo[i]['ID'] + '"/>');
            $('#inventory-table').append(row);
            var cb_line = "<td><div style='float:left;padding-left:15px'>" + (trCount + 1) + "</div><div style='float:right;padding-right:45px'> <input type='checkbox' class='select-unit' title='Select this unit for send command' id='cb_" + i + "' " + (checkedRows[i] == 1 ? "checked" : "") + " /></div></td>"; 
            row.append($(cb_line));
            row.append($("<td>" + topo[i]['Node Type']  + "</td>"));
            row.append($("<td class='ID'>" + topo[i]['ID']         + "</td>"));
            if(topo[i]['Status'] < 4) {
                row.append($("<td> <div class='icon error'></div></td>"));    
            }
            else if(topo[i]['Status'] == 4) {
                row.append($("<td> <div class='icon ok'></div></td>"));    
            }
            else {
                row.append($("<td> <div class='icon ok_disabled'></div></td>"));    
            }

            if(topo[i]['Node Type'].indexOf('MSDH-M') == -1){
                if(topo[i]['Comm'] == 1) {
                    row.append($("<td> <div class='icon error'></div></td>"));    
                }
                else if(topo[i]['Comm'] == 0) {
                    row.append($("<td> <div class='icon ok'></div></td>"));    
                }
                else {
                    row.append($("<td> <div class='icon ok_disabled'></div></td>"));    
                }
            } else {
                row.append($("<td> <div class='icon ok'></div></td>"));
                msdhRow = trCount;
            }
            row.append($("<td>" + topo[i]['Tag']        + "</td>"));
            row.append($("<td>" + topo[i]['Location']   + "</td>"));
            row.append($("<td>" + topo[i]['System']     + "</td>"));
            row.append($("<td>" + topo[i]['Common']     + "</td>"));
            row.append($("<td>" + topo[i]['Target']     + "</td>"));
            row.append($("<td>" + topo[i]['IP']         + "</td>"));
            if(topo[i]['Node Type'].indexOf('APOI-S') == -1){
                row.append($("<td>" + topo[i]['Patch']      + "</td>"));
            }
            else{
                row.append($("<td> - </td>"));
            }
            if(prmToggle){
                switch(topo[i]['PRM']) {
                    case '0':
                        row.append($("<td> - </td>"));            
                        break;
                    case '1':
                        row.append($("<td> Primary </td>"));            
                        break;                
                    case '2':
                        row.append($("<td> Secondary </td>"));            
                        break;
                    case '3':
                        if(topo[i]['Active'] == 2) {
                            row.append($("<td> Main : Secondary </td>")); 
                            break;
                        }else{
                            row.append($("<td> Main : Primary </td>")); 
                            break;
                        }
                    case '11':
                        row.append($("<td> Active </td>"));            
                        break;
                    case '22':
                        row.append($("<td> Standby </td>"));            
                        break;
                    default:
                        row.append($("<td> - </td>"));
                }
            }
//            var found = 0;
//            for (j = 0; j < patches.length; j++)
//            {
//               if (patches[j][0] == topo[i]['ID'])
//               {
//                  var str = patches[j][1];
//                  if (str.indexOf('Error') != -1)
//                     str = "";
//                  row.append($("<td>" + str + "</td>"));
//                  found = 1;
//                  break;
//               }
//            }
//            if(found == 0){
//                row.append($("<td> </td>"));
//            }
            
            var found = 0;
            for (var j = 0; j < updateTimes.length; j++)
            {
               if (updateTimes[j]['ID'] == topo[i]['ID'])
               {
                  row.append($("<td>" + updateTimes[j]['TIME'] + "</td>"));
                  found = 1;
                  break;
               }
            }
            if(found == 0){
                row.append($("<td> </td>"));
            }

            found = 0;
            for (var j = 0; j < rf.length; j++)
            {
               if (rf[j]['ID'] == topo[i]['ID'])
               {
                  var str = "";
                  for (var k = 0; k < rf[j]['Ranges'].length; k++)
                  {
                     if (rf[j]['Ranges'][k]['Band'] != undefined){
                        $.each(bandList, function (i, value) {
                           if(value.Band == rf[j]['Ranges'][k]['Type']){
                              str+= value.FullName.replace("MHz ", "").replace("Band", "").replace("BAND", "") + ", ";
                           }
                        })
                     }
                  }
                  str = str.substring(0, str.length - 2);
                  row.append($("<td>" + str + "</td>"));
                  found = 1;
                  break;
               }
            }
            if(found == 0){
                row.append($("<td> </td>"));
            }

            tableRows[trCount] = row;
            tableRowIP[trCount] = topo[i]['IP'];
            topoRow[trCount] = topo[i];
            trCount++;
        }
        $(".select-unit").click(function(){
            if($(".select-unit").length == $(".select-unit:checked").length) {
                $("#select-all").prop("checked", true);
            } else {
                $("#select-all").prop("checked", false);
            }
            if(this.checked == true){
                checkedRows[this.id.split('_')[1]] = 1;
            }
            else {
                checkedRows[this.id.split('_')[1]] = 0;
            }
            
        });
        
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
                $("#zoom_button").removeClass("disabled");
                $("#delete_button").removeClass("disabled");
                selectedRowID = e.currentTarget.rowIndex;
                selectedRowSerial = e.currentTarget.id;
            }
            else {
                $('#login_button').addClass('disabled');
                $('#zoom_button').addClass('disabled');
                $('#delete_button').addClass('disabled');
                selectedRowID = 0;
            }
            createInventoryTable();
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
                $("#zoom_button").removeClass("disabled");
                $("#delete_button").removeClass("disabled");
                selectedRowID = e.currentTarget.rowIndex;
            }
            else {
                $('#login_button').addClass('disabled');
                $('#zoom_button').addClass('disabled');
                $('#delete_button').addClass('disabled');
                selectedRowID = 0;
            }
        })
    }
    
    function searchByTag(text, colomn) {
        for(var i = topo.length; i > 0 ; i --) {
            // no PRM at VIRT.
            if(topo[i-1]['Node Type'].indexOf("VIRT") == -1) {
                var value = topo[i-1][colomn];
                if(value.toLowerCase().indexOf(text.toLowerCase()) == -1){
                    topo.splice(i-1, 1);
                } 
            }
        }
    }

    function updateSearchWordsInput() {
        var searchColomn = document.getElementById("filter_colomn").value;
        var elementParent = document.getElementById("control_buttons");
        
        if(document.getElementById("filterText") != null) {
            elementParent.removeChild(document.getElementById("filterText"));
        }
        if(document.getElementById("filterSelect") != null) {
            elementParent.removeChild(document.getElementById("filterSelect"));
        }

        switch(searchColomn)
        {
            case 'Node Type':
                var apoiOption = document.createElement("option");
                var msdhOption = document.createElement("option");
                var mtdiOption = document.createElement("option");
                var rruOption = document.createElement("option");
                apoiOption.text = "APOI";
                mtdiOption.text = "MTDI";
                msdhOption.text = "MSDH";
                rruOption.text = "RRU";
                
                var selectorInput = document.createElement("select");
                selectorInput.setAttribute("style","visibility:visible;float: left;min-width: 180px;");
                selectorInput.setAttribute("id", "filterSelect");

                selectorInput.add(apoiOption);
                selectorInput.add(msdhOption);
                selectorInput.add(mtdiOption);
                selectorInput.add(rruOption);
                
                $(selectorInput).insertAfter("select");
                
                break;
            case 'Status':
                var okOption = document.createElement("option");
                var errorOption = document.createElement("option");
                var unAvailableOption = document.createElement("option");
                okOption.text = "OK";
                errorOption.text = "ERROR";
                unAvailableOption.text = "UN-AVAILABLE";

                var selectorInput = document.createElement("select");
                selectorInput.setAttribute("style","visibility:visible;float: left;min-width: 180px;");
                selectorInput.setAttribute("id", "filterSelect");

                selectorInput.add(okOption);
                selectorInput.add(errorOption);
                selectorInput.add(unAvailableOption);

                $(selectorInput).insertAfter("select");

                break;            
            case 'Comm':
                var okOption = document.createElement("option");
                var errorOption = document.createElement("option");
                var unAvailableOption = document.createElement("option");
                okOption.text = "OK";
                errorOption.text = "ERROR";
                unAvailableOption.text = "UN-AVAILABLE";

                var selectorInput = document.createElement("select");
                selectorInput.setAttribute("style","visibility:visible;float: left;min-width: 180px;");
                selectorInput.setAttribute("id", "filterSelect");

                selectorInput.add(okOption);
                selectorInput.add(errorOption);
                selectorInput.add(unAvailableOption);

                $(selectorInput).insertAfter("select");

                break;
            case 'PRM':
                var noneOption = document.createElement("option");
                var primaryOption = document.createElement("option");
                var secondaryOption = document.createElement("option");
                var bothOption = document.createElement("option");
                var activeOption = document.createElement("option");
                var standbyOption = document.createElement("option");
                noneOption.text = "NONE";
                primaryOption.text = "PRIMARY";
                secondaryOption.text = "SECONDARY";
                bothOption.text = "BOTH";
                activeOption.text = "ACTIVE";
                standbyOption.text = "STANDBY";

                var selectorInput = document.createElement("select");
                selectorInput.setAttribute("style","visibility:visible;float: left;min-width: 180px;");
                selectorInput.setAttribute("id", "filterSelect");

                selectorInput.add(noneOption);
                selectorInput.add(primaryOption);
                selectorInput.add(secondaryOption);
                selectorInput.add(bothOption);
                selectorInput.add(activeOption);
                selectorInput.add(standbyOption);

                $(selectorInput).insertAfter("select");

                break;                
            default:
                var textInput = document.createElement("input");
                textInput.setAttribute("style","visibility:visible;float: left;height: 20px;min-width: 180px;");
                textInput.setAttribute("id", "filterText");
        

                
                $(textInput).insertAfter("select");
                
                break;
        }
    }

    function refreshPage(){
        getUpdateTimes();
        createInventoryTable();
        setTimeout(refreshPage, 20000);
    }
    
    function download(filename, text) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    $( document ).ready(function(e) {
        
//        getPatches();
        
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
        document.getElementById("Status").onclick = function(e){
            topo.sort(sort_by('Status',statusTrue,function(ee){return ee.toUpperCase()}))
            statusTrue = (statusTrue == 0) ? 1 : 0;
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
        document.getElementById("PRM").onclick = function(e){
            topo.sort(sort_by('PRM',prmTrue,function(ee){return ee}))
            prmTrue = (prmTrue == 0) ? 1 : 0;
            createInventoryTable();
            showInventory();
        };

        document.getElementById("inventory_filter").onclick = function(e){
            getTopology();
            getConnections();
            var searchColomn = document.getElementById("filter_colomn").value;
            switch(searchColomn)
            {
                case 'Node Type':
                    var text = document.getElementById("filterSelect").value;
                    break;
                case 'Status':
                    var text = document.getElementById("filterSelect").value;
                    if (text == 'OK')
                        text = "4";
                    else if (text == 'ERROR')
                        text = '0';
                    else 
                        text = '-';
                    break;                
                case 'Comm':
                    var text = document.getElementById("filterSelect").value;
                    if (text == 'OK')
                        text = "0";
                    else if (text == 'ERROR')
                        text = '1';
                    else 
                        text = '-';
                    break;
                case 'PRM':
                    var text = document.getElementById("filterSelect").value;
                    if (text == 'NONE')
                        text = "0";
                    else if (text == 'PRIMARY')
                        text = '1';                    
                    else if (text == 'SECONDARY')
                        text = '2';
                    else if (text == 'BOTH')
                        text = '3';
                    else if (text == 'ACTIVE')
                        text = '11';                    
                    else if (text == 'STANDBY')
                        text = '22';
                    else 
                        text = '-';
                    break;
                default:
                    var text = document.getElementById("filterText").value;
                    if (text == "") {
                        axellPopUp("Enter A Name To Search By.");
                        return;
                    }
                    break;
            }

            var colomn = document.getElementById("filter_colomn").value;
            
            $('#login_button').addClass('disabled');
            $('#zoom_button').addClass('disabled');
            $('#delete_button').addClass('disabled');
            $('#inventory_filter_clear').removeClass('disabled');
            
            searchByTag(text, colomn);
            createInventoryTable();
            showInventory();
        }
        
        document.getElementById("inventory_filter_clear").onclick = function(e){
            getTopology();
            getConnections();
            topo.sort(sort_by('Tag', true, function(a){return a.toUpperCase()}));
            createInventoryTable();
            showInventory();
            $('#inventory_filter_clear').addClass('disabled');
        }

        document.getElementById("filter_colomn").onchange = function(e) {
            updateSearchWordsInput();
        }
        
        getUpdateTimes();
        
        getTopology();
        getConnections();
        topo.sort(sort_by('Node Type', true, function(a){return a.toUpperCase()}));
        createInventoryTable();
        showInventory();
        updateSearchWordsInput();
        getRfranges();
        getBandList();
        getCommands();
        
        $('#login_button').addClass('disabled');
        $('#zoom_button').addClass('disabled');
        $('#delete_button').addClass('disabled');
        $('#inventory_filter_clear').addClass('disabled');

        if(USERACCESS != "superuser"){
             $('#send_batch_command').hide();
             $('#batch_command').hide();
        }
        
        document.getElementById("login_button").onclick = function (e) {
            if(selectedRowID == 0)
                return;
            if(selectedRowID - 1 == msdhRow){
                window.location.href = '/target/status';
                return;
            }
            var split = tableRowIP[selectedRowID-1].split('.');
            var k = parseInt(split[2]);
            var s = parseInt(split[3]);
            var port = 10000 + ((k-2)*256) + s;
            window.open("http://" + window.location.hostname + ":" + port, "_blank");
        }

        document.getElementById("zoom_button").onclick = function (e) {
            if(selectedRowID == 0)
                return;
            window.open("/target/index.html?Node Type="+topoRow[selectedRowID-1]['Node Type']+
                                                 "&ID="+topoRow[selectedRowID-1]['ID']+
                                                 "&Status="+topoRow[selectedRowID-1]['Status']+
                                                 "&Comm="+topoRow[selectedRowID-1]['Comm']+
                                                 "&Tag="+topoRow[selectedRowID-1]['Tag']+
                                                 "&Location="+topoRow[selectedRowID-1]['Location']+
                                                 "&System="+topoRow[selectedRowID-1]['System']+
                                                 "&Common="+topoRow[selectedRowID-1]['Common']+
                                                 "&Target="+topoRow[selectedRowID-1]['Target']+
                                                 "&IP="+topoRow[selectedRowID-1]['IP'], "_blank");
        }

        document.getElementById("delete_button").onclick = function (e) {
          if(selectedRowID == 0)
             return;
          axellConfirm("alert","Warning","Do you really want to delete this node?", function () {
              $.blockUI({
                  fadeIn: 1000,
                  timeout: 10000,
                  onBlock: function() {
                    api.exe({
                        cmd: 'NODE CHECK ' + topoRow[selectedRowID-1]['ID'],
                        onSuccess: function () {
                            axellPopUp("Node " + topoRow[selectedRowID-1]['ID'] + " has been deleted successfully");
                            $('#popup').hide();
                            location.reload();
                            api.exe({
                              cmd: "delete_serials_opers " + topoRow[selectedRowID-1]['ID'],
                              dataType: 'text',
                              async: false,
                              onSuccess: function (o) {
                                 console.log(o.ajaxdata);
                              }
                            })
                        },
                        onError: function (err) {
                           $.unblockUI();
                           //axellPopUp(err.errorThrown);
                           axellConfirm("alert","Warning","There are some configurations for this node. Do you really want to delete this node and it's configurations?", function () {
                                $.blockUI({
                                    fadeIn: 1000,
                                    timeout: 10000,
                                    onBlock: function() {
                                      api.exe({
                                          cmd: 'NODE DELETE ' + topoRow[selectedRowID-1]['ID'],
                                          onSuccess: function () {
                                              axellPopUp("Node " + topoRow[selectedRowID-1]['ID'] + " has been deleted successfully");
                                              $('#popup').hide();
                                              location.reload();
                                              api.exe({
                                                cmd: "delete_serials_opers " + topoRow[selectedRowID-1]['ID'],
                                                dataType: 'text',
                                                async: false,
                                                onSuccess: function (o) {
                                                   console.log(o.ajaxdata);
                                                }
                                              })
                                          },
                                          onError: function (err) {
                                             axellPopUp(err.errorThrown);
                                          }
                                      })
                                    }
                                })
                           })
                        }
                    })
                  }
              })
          })
        }

        document.getElementById("export_button").onclick = function (e) {
            axellConfirm("info","Notice","Do you want to download a .csv file describing the system inventory?", function () {
                var row;
                if(prmToggle)
                  row = "Node Type,ID,Status,Comm,Tag,Location,System,Common,Target,IP,Patches,Redundancy,Last Update Time,Bands\n";
                else
                  row = "Node Type,ID,Status,Comm,Tag,Location,System,Common,Target,IP,Patches,Last Update Time,Bands\n";

                for(var i = 0; i < topo.length; i ++) {
                    if(topo[i]['Node Type'].indexOf("VIRT") != -1)
                        continue;
                    row+= topo[i]['Node Type']  + ",";
                    row+= topo[i]['ID']  + ",";

                    
                    if(topo[i]['Status'] == 0) {
                        row+= "Critical,";
                    }
                    else if(topo[i]['Status'] == 1) {
                        row+= "Major,";
                    }
                    else if(topo[i]['Status'] == 2) {
                        row+= "Minor,";
                    }
                    else if(topo[i]['Status'] == 3) {
                        row+= "Critical,";
                    }
                    else {
                        row+= "OK,";
                    }

                    if(topo[i]['Comm'] == 1) {
                        row+= "Error,";
                    }
                    else if(topo[i]['Comm'] == 0) {
                        row+= "OK,";
                    }
                    else {
                        row+= "Disabled,";
                    }
                    row+= topo[i]['Tag']  + ",";
                    row+= topo[i]['Location']  + ",";
                    row+= topo[i]['System']    + ",";
                    row+= topo[i]['Common']    + ",";
                    row+= topo[i]['Target']    + ",";
                    row+= topo[i]['IP']        + ",";
                    row+= topo[i]['Patch']     + ",";

                    if(prmToggle){
                       if(topo[i]['PRM'] == 0) {
                           row+= "none,";
                       }
                       else if(topo[i]['PRM'] == 1) {
                           row+= "Primary,";
                       }
                       else if(topo[i]['PRM'] == 2) {
                           row+= "Secondary,";
                       }
                       else if(topo[i]['PRM'] == 3) {
                           if(topo[i]['Active'] == 2) {
                              row+= "Main:Secondary,";
                           }else{
                              row+= "Main:Primary,";
                           }
                       }
                       else if(topo[i]['PRM'] == 11) {
                           row+= "Active,";
                       }
                       else if(topo[i]['PRM'] == 22) {
                           row+= "Standby,";
                       }
                       else {
                           row+= "-,";
                       }
                    }

                    var found = 0;
                    for (var j = 0; j < updateTimes.length; j++)
                    {
                        if (updateTimes[j]['ID'] == topo[i]['ID'])
                        {
                           row+= updateTimes[j]['TIME'] + ",";
                           found = 1;
                           break;
                        }
                    }
                    if(found == 0){
                        row+= ",";
                    }

                    found = 0;
                    for (var j = 0; j < rf.length; j++)
                    {
                        if (rf[j]['ID'] == topo[i]['ID'])
                        {
                           for (var k = 0; k < rf[j]['Ranges'].length; k++)
                           {
                              if (rf[j]['Ranges'][k]['Band'] != undefined)
                                 row+= rf[j]['Ranges'][k]['Band'].replace("1:","") + ":" + rf[j]['Ranges'][k]['Type'] + " ";
                           }
                           row+= "\n";
                           found = 1;
                           break;
                        }
                    }
                    if(found == 0){
                        row+= "\n";
                    }
                }
                download("Inventory.csv",row);
            })
        }

        $("#select-all").click(function () {
            $('.select-unit').prop('checked', this.checked);
            for(var i = 0; i < topo.length; i ++){
                checkedRows[i] = (this.checked == true ? 1 : 0);
            }
        });

        if(USERNAME === 'sysadmin') {
            $(".bc").show();
        } else {
            $(".bc").hide();
        }

        $('#send_batch_command').click(function() {
            if("" != $('#batch_command').val()) {
                var first = true;
                var batch_command = "";
                //if(true == $('#select-all').prop('checked')) {
                //    batch_command = "ALL"
                //} else {
                    var l = 0;
                    topoConn.length = 0;
                    for(var k = 0; k < conn.length; k ++) {
                       for(var m = 0; m < conn[k].nodes.length; m ++) {
                          $(".select-unit").each(function() {
                              if(true == $(this).prop('checked')) {
                                  if (conn[k].nodes[conn[k].nodes.length-m-1].ID == $(this).closest('td').siblings('.ID').text()) {
                                     topoConn[l++] = $(this).closest('td').siblings('.ID').text();
                                     if(false == first) batch_command+=' ';
                                     batch_command += $(this).closest('td').siblings('.ID').text();
                                     first = false;
                                  }
                              }
                          })
                       }
                    }
                    $(".select-unit").each(function() {
                        if(true == $(this).prop('checked')) {
                           var found = false;
                           for(var i = 0; i < topoConn.length; i ++) 
                           {
                              if (topoConn[i] == $(this).closest('td').siblings('.ID').text())
                              {
                                 found = true;
                                 break;
                              }
                           }
                           if (!found) {
                              if(false == first) batch_command+=' ';
                              batch_command += $(this).closest('td').siblings('.ID').text();
                              first = false;
                           }
                        }
                    })
                //}
                batch_command = ' "'+batch_command+'" ';
                batch_command += '"'+$('#batch_command').val()+'"';
                if("" != batch_command) {
                    console.log("We will send batch command:" + batch_command);
                    api.exe({
                        cmd: "batch_command"+batch_command,
                        dataType: 'text',
                        async: true,
                        onSuccess: function (reply) {
                            var utdata="";
                            var svar = reply.ajaxdata.split('\n');
                            var batch_reply = window.open('url','Batch result', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes');
                            for (var element = 0; element < svar.length; element++) {
                                utdata += svar[element]+'<br>';
                            }
                            batch_reply.document.write('<html><head><title>' + $('#batch_command').val() + '</title></head></html>');
                            batch_reply.document.write(utdata);
                        }
                    });
                } else {
                    console.log("Noone to talk to, nothing to do...")
                }
            } else {
                console.log("Nothing to say, nothing to do...")
            }
        });
        if(prmToggle == undefined){
            setTimeout(refreshPage, 20);    
        }else{
            setTimeout(refreshPage, 20000);                
        }
        
    });


})
