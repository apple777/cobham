/**
 * Created by Emerald on 3/12/14.
 */
require([ '/js/api.js', '/js/lib/d3.min.js', '/js/lib/jquery.js', '/js/convert.js', '/js/scheduler.js', '/js/lib/jquery-jsPlumb.js', '/js/lib/jquery-ui.js', '/js/util.js', '/js/lib/underscore.js', '/js/lib/tipsy.js', '/js/lib/jquery_cookie.js', '/js/lib/jquery.blockUI.js'],
    function (api, d3, $, convert, scheduler) {
    var USERNAME = $.cookie('username');
    var OPERATORS;
    var temp = $.cookie('operatorCook');
    if((typeof temp != 'undefined')){
        console.log("=============");
        console.log(temp);
        OPERATORS =$.parseJSON($.cookie('operatorCook'));    
    }
    console.log("---------");
    var scale;
    var zone;
    
    var transponder_units_mode;
    var devicesList;
    
    var TPUnits;
    var SWUnits;
    
    var TPPortsStatus = [ "0", "0", "0", "0", "0", "0", "0", "0" ];
    var SWPortsStatus = [ "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0" ];
    
    var numberOfDevices = 0;
    
    var SWBtsPortsMapping = [ '1', '3', '5', '7', '9', '11', '13', '15', '2', '4', '6', '8', '10', '12', '14'];
    var TPBtsPortsMapping = [ '1', '3', '5', '7', '9', '11', '13', '15'];
    var TPBtsPortsMappingBelow = [ '2', '4', '6', '8', '10', '12', '14', '16'];
    var TPBtsPortsMappingIndex = [ '0', '2', '4', '6', '8', '10', '12', '14' ];

    var SWBtsActualPorts = [ '1', '9', '2', '10', '3', '11', '4', '12', '5', '13', '6', '14', '7', '15', '8'];
    
    var SWBtsActualPortsIndex = [ 0, 0, 2, 4, 6, 8, 10, 12, 14, 1, 3, 5, 7, 9, 11, 13];
    
    var swCpriToPortMapping = [0, 1, 9, 2, 10, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15, 8, 16]
    var tpCpriToPortMapping = [-1, 1, -1, 2, -1, 3, -1, 4, -1, 5, -1, 6, -1, 7, -1, 8, -1]
    
    var SWSniffedPort = 1;
    var selectedPort = 0;
    
    //sort list by NodeOrder
    var acc = 1;
    
    var line_speed = 3;
    
    var speeds = ['0', '2.5', '4.8', '9.8'];

    // global jqueryui settings
    $(".aRack").accordion({ collapsible: true });

    var duration = 300;
    var wMargin = {
        right: 20,
        left:20,
        bottom: 50,
        top:20
    };
    var popupMargin = {
        right: 100,
        left:5,
        bottom: 20,
        top:20
    };


    var wWidth = 0;
    var wHeight = 0;
    var nodeHeight = 0;
    var layerPadding = 0;
    var popupWidth = 0;
    var popupHeight = 0;
    
    var portsAlarms = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    
    //update all dimension data of the screen in case window was resized
    function updateScreenSize(){
        wWidth = $(window).width();
        wHeight = $(window).height() - 98;
        nodeHeight = 30;
        layerPadding =(wHeight - nodeHeight*5)/6;
        popupWidth = wWidth - 20;
        popupHeight = wHeight - (wHeight*0.05);
        $('#topology-container').width(wWidth);
        $('#topology-container').height(wHeight);
        $('#popup').css('width',popupWidth);
        $('#popup').css('height',popupHeight);
    }
    updateScreenSize();


    var zoomListener = d3.behavior.zoom().scaleExtent([0.8, 5]).on("zoom", zoom);
    var popupZoomListener = d3.behavior.zoom().scaleExtent([0.2, 6]).on("zoom", popupZoom);
    var svg = d3.select("#topology-container").append("svg")
        .attr("id","content")
        .attr("class","container")
        .attr("width", $('#topology-container').width())
        .attr("height", $('#topology-container').height())
        .attr("transform", "translate(0,0)")
        .call(zoomListener);

    svg.append("rect")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("fill", "#f5f5f5");

    //red gradient
    var red = svg.append("svg:defs")
        .append("svg:radialGradient")
        .attr("id","red")
        .attr("cx","50%")
        .attr("cy","50%")
        .attr("fx","50%")
        .attr("fy","50%")
        .attr("spreadMethod","pad")
    red.append("svg:stop")
        .attr("offset", "0%")
        .attr("stop-color", "#f58869")
        .attr("stop-opacity", 1);

    red.append("svg:stop")
        .attr("offset", "100%")
        .attr("stop-color", "#fd0303")
        .attr("stop-opacity", 1);
    //red gradient
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

    //shadow
    var shadow = svg.append("svg:defs")
        .append("svg:filter")
        .attr("id","shadow")
        .attr("x",0)
        .attr("y",0)
        .attr("width","200%")
        .attr("height","200%");
    shadow.append("feOffset")
        .attr("result", "offOut")
        .attr("in", "SourceAlpha")
        .attr("dx", 1)
        .attr("dy", 1);
    shadow.append("feGaussianBlur")
        .attr("result", "blurOut")
        .attr("in", "offOut")
        .attr("stdDeviation", 1);
    shadow.append("feBlend")
        .attr("in", "SourceGraphic")
        .attr("in2", "blurOut")
        .attr("mode", "normal");

    var red_shadow = svg.append("svg:defs")
        .append("svg:filter")
        .attr("id","red_shadow")
        .attr("x",0)
        .attr("y",0)
        .attr("width","250%")
        .attr("height","250%");
    red_shadow.append("feOffset")
        .attr("result", "offOut")
        .attr("in", "SourceAlpha")
        .attr("dx",3)
        .attr("dy",3)
    var feColorMatrix = red_shadow.append("feColorMatrix")
        .attr("type", "matrix")
        .attr("in", "offOut")
        .attr("result","matrixOut")
        .attr("values", "1 0 0 0 0.3 0  0 0 0  0 0 0 0 0 0 0  0 0 0.9 0")
    red_shadow.append("feGaussianBlur")
        .attr("result", "coloredBlur")
        .attr("stdDeviation", 5);
    red_shadow.append("feBlend")
        .attr("in", "SourceGraphic")
        .attr("mode", "normal");

    var yellow_shadow = svg.append("svg:defs")
        .append("svg:filter")
        .attr("id","yellow_shadow")
        .attr("x",0)
        .attr("y",0)
        .attr("width","400%")
        .attr("height","400%");
    yellow_shadow.append("feOffset")
        .attr("result", "offOut")
        .attr("in", "SourceAlpha")
        .attr("dx",3)
        .attr("dy",3)
    var feColorMatrix = yellow_shadow.append("feColorMatrix")
        .attr("type", "matrix")
        .attr("in", "offOut")
        .attr("result","matrixOut")
        .attr("values", "2 0 0 0 0  0 2 0 0 0  0 0 0 0.5 0  0 0 0 1 0")
    yellow_shadow.append("feGaussianBlur")
        .attr("result", "coloredBlur")
        .attr("stdDeviation", 5);
    yellow_shadow.append("feBlend")
        .attr("in", "SourceGraphic")
        .attr("mode", "normal");

    var blue_shadow = svg.append("svg:defs")
        .append("svg:filter")
        .attr("id","blue_shadow")
        .attr("x",0)
        .attr("y",0)
        .attr("width","400%")
        .attr("height","400%");
    blue_shadow.append("feOffset")
        .attr("result", "offOut")
        .attr("in", "SourceAlpha")
        .attr("dx",3)
        .attr("dy",3)
    var feColorMatrix = blue_shadow.append("feColorMatrix")
        .attr("type", "matrix")
        .attr("in", "offOut")
        .attr("result","matrixOut")
        .attr("values", "1 0 0 0 0 0  0 0 0  0 0 0 0 0 1 0  0 0 0.9 0")
    blue_shadow.append("feGaussianBlur")
        .attr("result", "coloredBlur")
        .attr("stdDeviation", 5);
    blue_shadow.append("feBlend")
        .attr("in", "SourceGraphic")
        .attr("mode", "normal");

    var purple_shadow = svg.append("svg:defs")
        .append("svg:filter")
        .attr("id","purple_shadow")
        .attr("x",0)
        .attr("y",0)
        .attr("width","400%")
        .attr("height","400%");
    purple_shadow.append("feOffset")
        .attr("result", "offOut")
        .attr("in", "SourceAlpha")
        .attr("dx",3)
        .attr("dy",3)
    var feColorMatrix = purple_shadow.append("feColorMatrix")
        .attr("type", "matrix")
        .attr("in", "offOut")
        .attr("result","matrixOut")
        .attr("values", "0.4 0 0 0 0  0.2 0 0 0 0  0.8 0 0 0 0  0 0 0 0.9 0")
    purple_shadow.append("feGaussianBlur")
        .attr("result", "coloredBlur")
        .attr("stdDeviation", 5);
    purple_shadow.append("feBlend")
        .attr("in", "SourceGraphic")
        .attr("mode", "normal");

    var green_shadow = svg.append("svg:defs")
        .append("svg:filter")
        .attr("id","green_shadow")
        .attr("x",0)
        .attr("y",0)
        .attr("width","400%")
        .attr("height","400%");
    green_shadow.append("feOffset")
        .attr("result", "offOut")
        .attr("in", "SourceAlpha")
        .attr("dx",3)
        .attr("dy",3)
    var feColorMatrix = green_shadow.append("feColorMatrix")
        .attr("type", "matrix")
        .attr("in", "offOut")
        .attr("result","matrixOut")
        .attr("values", "0 0 0 0 0 1 0 0 0  0 0 0 0 0 0 0  0 0 0.9 0")
    green_shadow.append("feGaussianBlur")
        .attr("result", "coloredBlur")
        .attr("stdDeviation", 5);
    green_shadow.append("feBlend")
        .attr("in", "SourceGraphic")
        .attr("mode", "normal");

    var selected_shadow = svg.append("svg:defs")
        .append("svg:filter")
        .attr("id","selected_shadow")
        .attr("x",0)
        .attr("y",0)
        .attr("width","200%")
        .attr("height","200%");
    selected_shadow.append("feOffset")
        .attr("result", "offOut")
        .attr("in", "SourceAlpha")
        .attr("dx",10)
        .attr("dy",10)
    var feColorMatrix = selected_shadow.append("feColorMatrix")
        .attr("type", "matrix")
        .attr("in", "offOut")
        .attr("result","matrixOut")
        .attr("values", "0 0 0 0 0 0 0 0 0.1 0 0 0 0 0.9 0 0 0 0 1 0")
    selected_shadow.append("feGaussianBlur")
        .attr("result", "coloredBlur")
        .attr("stdDeviation", 5);
    selected_shadow.append("feBlend")
        .attr("in", "SourceGraphic")
        .attr("mode", "normal");

    var svgGroup = svg.append("g");

    var svgPopupContainer = d3.select("#popup_content").append("svg")
        .attr("width", "100%")
        .attr("height","100%")
        .attr("transform", "translate(0,0)")
    var svgPopup = svgPopupContainer.append("g").attr('id','g_popup_content');

    function zoom() {
        if(!$('#popup').is(':visible')) {
            svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
            svgGroup.selectAll("circle").attr("r", (7 / d3.event.scale));
            //show sector group and zone label first due to space concern
            if (d3.event.scale > 1.5 && d3.event.scale < 3) {
                svgGroup.selectAll("text.grp_label").style("visibility", "visible");
                svgGroup.selectAll("text.grp_label").attr("font-size", (1 / d3.event.scale) + "em");
            } else if (d3.event.scale > 3) {
                svgGroup.selectAll("text.device_label").style("visibility", "visible");
                svgGroup.selectAll("text.device_label").attr("font-size", (1 / d3.event.scale) + "em");
                svgGroup.selectAll("text.grp_label").attr("font-size", (1 / d3.event.scale) + "em");
            }else {
                svgGroup.selectAll("text.device_label, text.grp_label").style("visibility", "hidden");
            }
        }
    }
    function popupZoom() {
        svgPopup.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
        svgPopup.selectAll("circle").attr("r", 7 / d3.event.scale);
        svgPopup.selectAll("path").style("stroke-width", 5 / d3.event.scale);
    }
    // when window resize, redraw topology

    function resizedw(){
        updateScreenSize();
        $('#popup').hide();
    }
    //make sure to wait till the resize end then update drawing
    var doit;
    window.onresize = function(){
        console.log("am i resizing?")
        clearTimeout(doit);
        doit = setTimeout(resizedw, 500);
    };

    //converts node positions into positions on screen.
    $('#system_configuration_mode').change(function(){
		var modeName = "";
		if($('#system_configuration_mode').val() == '2io14o'){
			modeName = "'1 To 15'";
		} else {
			modeName = "'2x1 To 7'";
		}
        axellConfirm("info","Notice","Are you sure you want to switch the system to " + modeName + " mode?", function () {
            selectedPort = 0;
            if($('#system_configuration_mode').val() == '2io14o'){
                api.exe({
                    cmd:'twoFourteen',
                    onSuccess:function(o){
                    	drawImage(0);
                    }
                })
            }
            else{
                api.exe({
                    cmd:'fourTwelve',
                    onSuccess:function(o){
                    	drawImage(1);
                    }
                })
            }
        },function(){
            if($('#system_configuration_mode').val() == '4io12o'){
                $('#system_configuration_mode option[value=4io12o]').attr("selected", "selected");
            }
            else{
                $('#system_configuration_mode option[value=2io14o]').attr("selected", "selected");
            }
        })
    })

	scheduler.add( sec(3), {    
		cmd:'tapperMon',
		onSuccess:function(tm){
			var tapperStatus;
			tapperStatus = tm.ajaxdata;
			var tapperStatusLines = tapperStatus.split("\n");
			var right_side_bar = $("#right_side_bar");
			var right_side_bar_content = $('#right_side_bar_content');
			var statusLines = "";
			for(var i = 3; i < tapperStatusLines.length; i ++){
				statusLines += "<br>" + tapperStatusLines[i];
			}
			var right_side_bar_content_html = "<div id='right_side_bar_content_node_desc'>"+ statusLines +"</div>";
			right_side_bar.hide();
			right_side_bar_content.empty().append(right_side_bar_content_html);

			right_side_bar.show();
		}
	})
	
	
    function drawImage(mode){
		var imageSource;
		if(mode == 0){
			imageSource = "../images/icons/1to15.png";
		}
		else{
			imageSource = "../images/icons/2x1to7.png";
		}
		
		svgGroup.selectAll("g").remove();
		
        headerLayer = svgGroup.append("g")
            .attr("id","MSFA_overall-status")
            .attr("class","layer_header");
        //append images
        headerLayer.append("svg:image")
            .attr("xlink:href",imageSource)
            .attr("id",'MSFA_img')
            .attr("class", "MSFA_img")
            .attr("data-id", "MSFA")
            .attr("data-node-type", "MSFA")
            .attr("data-location", "Location")
            .attr('x',200)
            .attr('y',250)
            .attr("width",1000)
            .attr("height",400)
            .style("filter", "url(#shadow)")
        //add text when zoom
    }

	
    $(document).ready(function() {
		
        var tapperMode;
		
        updateScreenSize();
		  api.exe({
			   cmd:'tapper_mode',
			   onSuccess:function(mode){
				   tapperMode = mode.ajaxdata;
               if(tapperMode == "")
                  tapperMode = '4io12o';
				   if(tapperMode == '4io12o'){
					   $('#system_configuration_mode option[value=4io12o]').attr("selected", "selected");
					   drawImage(1);
				   }
				   else{
					   $('#system_configuration_mode option[value=2io14o]').attr("selected", "selected");
					   drawImage(0);
				   }


				   //hide popup window
				   $('#popup').hide();
				   $.removeCookie('operator', { path: '/' });
				   $('#username').text($.cookie('username'));
				   $('#operator_name').text(OPERATORS[0].SysName);
				   $("#right_side_bar").show();
			   }
		  })

//		  right_side_bar_show();
    })
})





