require([ '/js/api.js','/js/lib/d3.min.js','/js/lib/jquery.js','/js/convert.js','/js/scheduler.js','/js/util.js','/js/lib/jquery-jsPlumb.js','/js/lib/jquery-ui.js','/js/lib/underscore.js','/js/lib/tipsy.js' ],
    function ( api,d3,$,convert,scheduler,util) {    
    
    var topo=[];
    var topoConn=[];
    var bandles=[];
    var conns=[];
    var distance=[];
    var colorArr = [];
    var tableRows=[];
    var tableRowIP=[];

    var operator_list = $.parseJSON($.cookie('operatorCook'));

    function getTopology(){
        var command = "topology -o " + operator_list[0].SysName + " --json";
        api.exe({
            cmd: command,
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
                    bandles[i] = top;
                })
                $.each(o.ajaxdata.connections, function (i, top) {
                    conns[i] = top;
                })
            }
        })
    }

    function OrderTopoByConn()
    {
        var l = 0;
        topoConn.length = 0;
        for(var k = 0; k < bandles.length; k ++) 
        {
           for(var m = 0; m < bandles[k].nodes.length; m ++) 
           {
              for(var i = 0; i < topo.length; i ++) 
              {
                  if (bandles[k].nodes[m].ID == topo[i]['ID'])
                  {
                     topoConn[l] = topo[i];
                     if(k % 2 == 0)
                        colorArr[l] = '#eeedef';
                     else
                        colorArr[l] = '#f9f8fa';
                     l++;
                     break;
                  }
              }
           }
        }
    }

    function CalcDistance()
    {
        var fromId;
        var toId;
        var msdhId;
        var len;
        var arr;

        for(var k = 0; k < bandles.length; k ++) 
        {
           len = 0;
           for(var m = 0; m < bandles[k].nodes.length; m ++) 
           {
               if(m == 0){
                  for(var l = 0; l < conns.length; l++)
                  {
                     arr = conns[l]['Node Y'].split(":");
                     if (arr[0] == bandles[k].nodes[m].ID)
                     {
                        arr = conns[l]['Node X'].split(":");
                        msdhId = arr[0];
                        break;
                     }
                  }
                  fromId = msdhId;
                  toId = bandles[k].nodes[m].ID;
               }else{
                  fromId = bandles[k].nodes[m-1].ID;
                  toId = bandles[k].nodes[m].ID;
               }
                  
               api.exe({
                  cmd: "get_remote_measurements_sfp " + toId,
                  dataType: 'json',
                  async: false,
                  onSuccess: function (o) {
                    $.each(o.ajaxdata.sfps,function(key, value){
                        if(value.remoteSerial == fromId){
                           var dlink = parseInt(value.cpriDelay);
                           len += dlink;
                           if (len < 1000){
                              distance[toId] = len + " m";
                           }else{
                              distance[toId] = len/1000 + " km";
                           }
                        }
                    })
                  }
               })
           }
        }
    }

    function createInventoryTable() {
        OrderTopoByConn();
        tableRows.splice(0,tableRows.length);
        tableRowIP.splice(0,tableRowIP.length);
        var trCount = 0;
        for(var i = 0; i < topoConn.length; i ++) {
            var row = $("<tr style='background-color: "+colorArr[i]+";'>");
            $('#inventory-table').append(row);
            row.append($("<td style='background-color: transparent;'>" + (trCount + 1) + "</td>"));
            row.append($("<td style='background-color: transparent;'>" + topoConn[i]['Node Type']  + "</td>"));
            row.append($("<td style='background-color: transparent;'>" + topoConn[i]['ID']         + "</td>"));
            row.append($("<td style='background-color: transparent;'>" + topoConn[i]['Tag']        + "</td>"));
            row.append($("<td style='background-color: transparent;'>" + topoConn[i]['Location']   + "</td>"));
            row.append($("<td style='background-color: transparent;'>" + topoConn[i]['IP']         + "</td>"));

            row.append($("<td style='background-color: transparent;'>" + distance[topoConn[i]['ID']] + "</td>"));

            tableRows[trCount] = row;
            tableRowIP[trCount] = topoConn[i]['IP'];
            trCount++;
        }
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
        
      $.blockUI({ 
         fadeIn: 1000, 
         timeout: 60000, 
         onBlock: function() { 
           getTopology();
           getConnections();
           CalcDistance();
           createInventoryTable();
           showInventory();
           $.unblockUI();
         } 
      }) 

      $("#export_button").click(function () {
         var row;
         row = "Node Type,ID,Distance\n";

         for(var i = 0; i < topoConn.length; i ++) {
           row+= topoConn[i]['Node Type']  + ",";
           row+= topoConn[i]['ID']  + ",";
           row+= distance[topoConn[i]['ID']]  + "\n";
         }
         download("Distance.csv",row);
      });

    });
})












