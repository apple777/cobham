/**
 * Created by Michael on 7/9/19.
 */
require([ '/js/api.js','/js/lib/d3.min.js','/js/lib/jquery.js','/js/convert.js','/js/scheduler.js','/js/lib/jquery-jsPlumb.js','/js/lib/jquery-ui.js','/js/util.js','/js/lib/underscore.js','/js/lib/tipsy.js','/js/lib/jquery_cookie.js','/js/lib/jquery.blockUI.js'],
    function (api,d3,$,convert,scheduler ) {
    var USERNAME = $.cookie('username');
    var USERACCESS = $.cookie('userAccess');
    var OPERATORS;
    console.log("---------");
    var temp = $.cookie('operatorCook');
    if((typeof temp != 'undefined')){
        console.log("=============");
        console.log(temp);
        OPERATORS =$.parseJSON($.cookie('operatorCook'));
    }
    console.log("---------");
    var layerCount;
    var unfilteredConnectionList;
    var totalNodeList;
    var nodeAPOIList;
    var nodeMTDIList;
    var nodeMSDHList;
    var nodeSectorList;
    var nodeRemoteList;
    var sectgrpList;
    var zoneList;
    var sectorWidth = 30;
    var sectorHeight = 30;
    var fixedWidth = 100;
    var fixedPopupWidth = 500;
    var APOIHeight = 27;
    var APOIPopupHeight = 138;
    var MTDIHeight = 10;
    var MTDIPopupHeight = 48;
    var MSDHHeight = 9;
    var MSDHPopupHeight = 51;
    var remoteWidth = 25;
    var remoteHeight = 37;
    var zoneWidth = 25;
    var zoneHeight = 37;
    var sectorLayer = 1;
    var APOILayer = 2;
    var MTDILayer = 3;
    var MSDHLayer = 4;
    var remoteLayer =5;
    var rackList;
    var imgMap ={"APOI":"/images/icons/APOI_bigicon.png","MTDI":"/images/icons/MTDI_bigicon.png","MSDH":"/images/icons/MSDH_bigicon.png"};
    var nodeSizeMap = {"APOI":3,"MTDI":1,"MSDH":1}
    //var viewMode = $.cookie('viewMode');
    var totalOtherNodeList;
    var displayedNode;
    var topologyList = [];
    //var svgNode = $.parseXML("http://192.168.171.35/images/icons/APOI_bigicon.svg/");
    //get data
    var nodeOrder = {};
    var rackIDgeneral;
    var scale;
    var zone;
    var msdhX=[];
    var mtdiX=[];
    var apoiX=[];
    var screenResStatus;
    var sectRed = false;
    var alarmsList = []
    var sectorsAlarm = [];
    var cellsAlarm = [];
    var cellresList;
    var rfrangesList;
    var rfConns=[];
    var conns=[];
    var bundles=[];
    var sectorList=[];
    var bandList=[];
    var maxChain ={};

// MSDH // MSDH // MSDH 
// MSDH // MSDH // MSDH 
// MSDH // MSDH // MSDH 


    var params = getUrlParams ();
    var PROFILENAME = params.profile;
    var MODE = $.cookie('mode');
    var OPERATOR = $.cookie('currentOperator');
    var lowCapacityConnectionColor ="#00b300";
    var mediumCapacityConnectionColor ="#e6e600";
    var highCapacityConnectionColor ="#cc0000";
    var user_last_active = new Date();
    var filtered_cellresList = [];
    var filtered_rru_cellres = [];
    var original_cres_list = [];
    var original_rru_cellres = [];
    var original_bands = [];
    var routeList=[];
    var zoneList = [];
    var conflicting_cell_res = [];
    var timeoutTime = 5000;
    var expand_all = false;
    var registeredRfrangeList=[];
    var isChanged = false;
    var rfquotaList=[];
    var rfNominalList=[];
    var originalRFOffset =[];
    var rfCellresLevelPerRemote = [];
    var default_operator_rf_quotas =[];
    var rruMinPowerLevel=0;
    var rruMaxPowerLevel = 100;
    var rruMinALCNominalPowerLevel=-10;
    var rruMaxALCNominalPowerLevel = 10;
    var rruMinGainNominalPowerLevel=-20;
    var rruMaxGainNominalPowerLevel = 10;
    var cellresMinALCPowerLevel = 0;
    var cellresMaxALCPowerLevel =100;
    var cellresMinGainPowerLevel = -10;
    var cellresMaxGainPowerLevel =0;
    var cellresDefaultALCPowerLevel = -15;
    var cellresDefaultGainPowerLevel = 0;
    var sectorList = [];
    var bundleList = [];
    var showGainMgmtBtn = true;
    var rfrangePowerList=[];
    var rfrangeSlotList=[];
    var rruBundleList = [];
    var rruSelectorsValues = [];
    var conf_error_occured = false;
    var conf_error_message = "";
    var sectorToMTDIList = {};

// ROUTING // ROUTING // ROUTING 
// ROUTING // ROUTING // ROUTING 
// ROUTING // ROUTING // ROUTING 


$( document ).ready(function() {
    $("body").append('<input id="operator_list" type="text" value="text">');
    $("#operator_list").val("oper1");
});


/*

*/

    api.exe({
        cmd:'bands --json',
        dataType:'json',
        onSuccess:function(o){
            bandList = o.ajaxdata.bands;
            console.log(o.ajaxdata)             
        }
    });


    api.exe({
        cmd: 'connections -o oper1 --json',
        dataType:'json',
        onSuccess: function (o) {
            rfConns = o.ajaxdata.rf_connections;
            conns = o.ajaxdata.connections;
            bundles = o.ajaxdata.BUNDLEGROUP;
            console.log(o.ajaxdata.rf_connections)
            console.log(o.ajaxdata.connections)
            console.log(o.ajaxdata.BUNDLEGROUP)
        }
    });    


    api.exe({
//      cmd:'SECTGRP -o oper1 list --sectors && sector -o oper1 --json',
        cmd:'SECTGRP -o '+$("#operator_list").val()+' list --sectors && sector -o '+$("#operator_list").val()+' --json',
        dataType:'text',
        callOnDiff:true,
        onSuccess:function(o){
            sectorList = o.ajaxdata;
            console.log(o) 
        }
    });



    api.exe({
        cmd:'zone -o '+$("#operator_list").val()+' list --nodes && topology -o '+$("#operator_list").val()+' --json && rack topology --json',
        callOnDiff:true,
        onSuccess:function(o){
            //bandList = o.ajaxdata.bands;
        }
    });

/*

    api.exe({
        // obj is null
        //cmd:'RFROUTE PROFILES -o '+$("#operator_list").val()+' --json',
        cmd:'RFROUTE PROFILES -o oper1 --json',
        //callOnDiff:true,
        dataType:'json',
        onSuccess:function(o){
            var rfrouteList = $.parseJSON(o.ajaxdata);
            console.log(rfrouteList) 
            //bandList = o.ajaxdata.bands;
        }
    });

*/

    api.exe({
        //cmd:'RFROUTE -o '+ OPERATOR +' '+PROFILENAME+' --json',
        cmd:'RFROUTE -o '+ OPERATOR +' oper1 --json',
        async:false, // need to get this done before other things below
        dataType:'json',
        onSuccess:function(e){
            //get the original rfoffset
            originalRFOffset = e.ajaxdata.RFOffsets;
            originalRoutes = e.ajaxdata.Routes;
            rfCellresLevelPerRemote = [];
            console.log(e) 


        }
    })


    api.exe({
        cmd: 'get_rrc_message ' + $("#operator_list").val(),
        dataType: 'text',
        async: false,
        onSuccess: function (e) {
            //bandList = o.ajaxdata.bands;
        }
    });



    api.exe({
        cmd: getAttr('mdl'),
        onSuccess: function (o) {
            var mdl = o.ajaxdata;
        }
    });


/*
    api.exe({
        cmd: 'clear_routing_alarm ' + $("#operator_list").val(),
        onSuccess: function () {
            //bandList = o.ajaxdata.bands;
        }
    });

*/

    api.exe({
        cmd: 'SECTOR -o oper1 --json',
        //cmd: "SECTOR -o " + $("#operator_list").val() + " DELETE " + $this.attr("data-sector-id"),
        dataType:'json', 
        onSuccess: function (o) {  
            sectorList = o.ajaxdata.sector;
        }
    });


/*
    api.exe({
        cmd:'SECTGRP -o '+$("#operator_list").val()+' MOVE '+$this.attr("data-sector-id")+' "'+$this.val()+'"',
        onSuccess:function(){
            //bandList = o.ajaxdata.bands;
        }
    });


    api.exe({
        cmd:'ZONE -o '+$("#operator_list").val()+' MOVE '+bundles[kMove].nodes[m].ID+' "'+$this.val()+'"',
        onSuccess:function(){
        }
    });    



    api.exe({
        cmd: 'connections -o ' + $("#operator_list").val() + ' DEL ' + $this.attr("data-conn-id"),
        onSuccess: function () {
        }
    });    
*/

    api.exe({
        //cmd:'topology -o '+$("#operator_list").val()+' --order '+$this.data('node-serial') +' '+$this.val(),
        cmd:'topology -o '+$("#operator_list").val()+' --json ',
        dataType:'json', 
        onSuccess:function(o){
            topologyList = o.ajaxdata.nodes;
            console.log(o.ajaxdata);
        }
    });    

    api.exe({
        //cmd:'topology -o '+$("#operator_list").val()+' --order '+$this.data('node-serial') +' '+$this.val(),
        cmd:'topology --ip --json ',
        dataType:'json', 
        onSuccess:function(o){
            topologyList = o.ajaxdata.nodes;
            console.log(o.ajaxdata);
        }
    });    


/*
    api.exe({
        cmd: 'NODE CHECK ' + $this.attr("data-node-id"),
        onSuccess: function () {
        }
    });    


    api.exe({
        cmd: "delete_serials_opers " + $this.attr("data-node-id"),
        dataType: 'text',
        async: false,
        onSuccess: function (o) {
            console.log(o.ajaxdata);
        }
    });   


    api.exe({
        cmd: "change_serials_opers " + $('#selCloneConf').val() + " " + node.ID,
        dataType: 'text',
        async: false,
        onSuccess: function (o) {
            console.log(o.ajaxdata);
        }
    });    

    api.exe({
        cmd: 'NODE DELETE ' + $this.attr("data-node-id"),
        onSuccess: function () {
        }
    });   


    api.exe({
        cmd: 'connections -o ' + $("#operator_list").val() + ' DISABLE ' + $this.attr("data-port-id") +' '+timeout,
        onSuccess: function () {
        }
    }); 



    api.exe({
        cmd:"refresh_connections "+ipadd,
        onSuccess:function(){
           //axellPopUp("Refreshing all connections...");
        },
        onError:function(err){
           //axellPopUp(err.errorThrown);
        }
    })  


    api.exe({
        cmd:"copy_configuration "+ip+" 1",
        onSuccess:function(){
        }
    });


    api.exe({
        cmd: 'identify ' + identify_id + ' 30',
        onSuccess: function () {
            console.log("Executing identify on node with id: " + identify_id);

        },
        onError: function (err) {
            console.log(err.errorThrown);
        }
    })

*/

    api.exe({
        cmd: 'alarms dump --json',
        dataType: 'json',
        async: false,
        onSuccess: function (o) {
            alarmsList = o.ajaxdata.alarms;
            console.log(o.ajaxdata); 
        }
    })


    api.exe({
        cmd:'alarms dump --oper ' + $.cookie('currentOperator') + ' --json',
        dataType:'json',
        async: false,
        onSuccess:function(e){    
        }
    })

// cmd:'CELLRES -o '+operator+' --CLEAR_DB '+cresID,

    api.exe({
          cmd:'cellres -o '+$('#operator_list').val()+' --json',
          dataType:'json',
          async: false,
          onSuccess:function(o){
            cellresList = o.ajaxdata.cellres;
            console.log(o.ajaxdata); 
          }
    });

    api.exe({
          cmd:'rfranges --json',
          dataType:'json',
          async: false,
          onSuccess:function(o){
            rfrangesList = o.ajaxdata.nodes;
            console.log(o.ajaxdata); 
          }
    });

    api.exe({
         cmd: "connections -o " + $("#operator_list").val() + " --json",
         dataType: 'json',
         async: false,
         onSuccess: function (o) {
             $.each(o.ajaxdata.BUNDLEGROUP, function (i, top) {
                 bundles[i] = top;
             })
             $.each(o.ajaxdata.connections, function (i, top) {
                 conns[i] = top;
             })
             $.each(o.ajaxdata.rf_connections, function (i, top) {
                 rfConns[i] = top;
             })
         }
    })

    api.exe({
          cmd:'linkstatus --json',
          dataType:'json',
          async: false,
          onSuccess:function(o){
            console.log(o.ajaxdata); 
          }
    });


// MSDH // MSDH // MSDH 
// MSDH // MSDH // MSDH 
// MSDH // MSDH // MSDH 


// ROUTING // ROUTING // ROUTING 
// ROUTING // ROUTING // ROUTING 
// ROUTING // ROUTING // ROUTING 

    api.exe({
        cmd: 'rfmeasurement -o ' + OPERATOR + ' --json',
        dataType: 'json',
        onSuccess: function (e) {
            console.log(e.ajaxdata.Nodes); 
            console.log(e.ajaxdata.OverallResource); 
        }
    });

    api.exe({
        cmd: 'TECHNOLOGIES --json',
        dataType: 'json',
        onSuccess: function (e) {
            console.log(e.ajaxdata.technologies); 
        }
    });



    api.exe({
        cmd:'rf_quota -o '+OPERATOR +' --json',
        dataType:'json',
        onSuccess:function(o){
            rfquotaList = o.ajaxdata.RFQUOTA;
            console.log(o.ajaxdata);
        },
        onError:function(err){
            console.log(err.errorThrown);
        }
    })

    

    api.exe({
        cmd:'rfnominal -o '+OPERATOR +' --json',
        dataType:'json',
        onSuccess:function(o){
            rfNominalList = o.ajaxdata.RRU;
            console.log(o.ajaxdata);            
        },
        onError:function(err){
            console.log(err.errorThrown);
        }
    })


    api.exe({
          cmd:'alarms logs --json --page 0 --filter 1 1 1 1 1 1 "All" "All"',
          dataType:'json',
          async: false,
          onSuccess:function(o){
            console.log(o.ajaxdata); 
          }
    });




    // 4 more 
// eof require
})
