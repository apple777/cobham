require([ '/general/general.js', '/js/console.js', '/js/api.js', '/js/scheduler.js', '/js/convert.js', '/js/util.js', '/js/lib/jquery.js', '/js/lib/underscore.js', '/js/lib/jquery-ui.js', '/js/lib/handlebars.js', '/js/handlebars-helpers.js', '/js/led.js','/js/lib/tipsy.js','/js/lib/jquery.flot.min.js' ],
    function ( general, console, api, scheduler, convert, util, $, _ ) {
        var OPERATORLIST = $.parseJSON($.cookie('operatorCook'));
        var MAXWIDTH = 800;
        var MAXHEIGHT = 45;
        var SAFE_MARGIN = 60000;
        var MARGIN = 0;
        var USERNAME = $.cookie('username');

        var datas = [];
        var graphExist = [];
        var plot = [];
        var rangesFrom = [];
        var rangesTo = [];

        //var scaleMin = -10;
        //var scaleMax = 100;

        var mdl;

        function GetMeasurements(exist, index){
           api.exe({
             cmd: "measurements sfp report " + (index-1) + " " + $("#days").val() + " all",
             dataType: 'json',
             async: true,
             onSuccess: function (o) {
                datas.length = 0;
                var date;
                var interval;
                $.each(o.ajaxdata.time, function (i, top) {
                  date = new Date(top.date).getTime();
                  interval = top.interval; 
                })
                $.each(o.ajaxdata.measurements, function (i, top) {
                  if ((!exist) || (exist && document.getElementById("id_" + top.label + "_" + index).checked)){
                     var data = [];
                     for(j = 0; j < top.data.length; j++){
                        var newDate = new Date();
                        newDate.setTime(date + ((interval * j) * 60 * 1000));
                        data.push([newDate, top.data[j]]);
                     }
                     datas.push({ label: top.label, data: data });
                  }
                  if(!exist)
                     AddCheckbox(top.label);
                })
                plot[index-1] = $.plot("#placeholder_"+index, datas, {
                              series: {
                                  lines: { lineWidth: 1, show: true },
                                  points: { show: false }
                              },
                              grid: {
                                  backgroundColor: { colors: [ "#FFF", "#FFF" ] },
                                  borderWidth: {
                                      top: 1,
                                      right: 1,
                                      bottom: 2,
                                      left: 2
                                  },
                                  hoverable: true
                              },
                              yaxis:{
                                  //min: scaleMin,
                                  //max: scaleMax,
                                  tickSize: 10,
                                  tickColor: "#999"
                              },
                              xaxis:{
                                 mode: "time",
                                 tickColor: "#999"
                              },
                              selection: {
				                      mode: "x"
			                     }

                           });
                 if (rangesFrom[index-1] != undefined){
		              $.each(plot[index-1].getXAxes(), function(_, axis) {
			               var opts = axis.options;
			               opts.min = rangesFrom[index-1];
			               opts.max = rangesTo[index-1];
		              });
		              plot[index-1].setupGrid();
                 }
                 plot[index-1].draw();
             },
             onError:function(o){
             }
           })
        }

        function AddCheckbox(label){
            $("#choices_"+$("#sfpindex").val()).append("<br/><br/><input type='checkbox' name='" + label +
               "' checked='checked' id='id_" + label + "_" + $("#sfpindex").val() + "'></input>" +
               "<label for='id_" + label + "_" + $("#sfpindex").val() + "'>"
               + label + " " + "</label>");

            $("[id^=id_]").click(function(e){	
               var id = this.id;
               id = id.slice(id.indexOf("_")+1);
               id = id.slice(id.indexOf("_")+1);
               GetMeasurements(true, id);
            })
        }

        $(document).ready(function(){

            $("#generate").click(function(e){
               var exist = false;
               for(var i = 0; i < graphExist.length; i++){
                  if(graphExist[i] == $("#sfpindex").val()){
                     exist = true;
                     break;
                  }
               }
               if(!exist){
                  $("#generalstatus").append('<div class="demo-container"><div><label>SFP '+$("#sfpindex").val()+'</label></div><div id="placeholder_'+$("#sfpindex").val()+'" class="demo-placeholder"></div><p id="choices_'+$("#sfpindex").val()+'" style="float:right;text-align:left;"></p></div>');

                  graphExist.push($("#sfpindex").val());

                  $("<div id='tooltip'></div>").css({
                    position: "absolute",
                    display: "none",
                    border: "1px solid #ddd",
                    padding: "2px",
                    "background-color": "#ffe",
                    opacity: 0.80
                  }).appendTo("body");
               
                  $("[id^=placeholder_]").bind("plothover", function (event, pos, item) {
                    var str = "(" + pos.x.toFixed(2) + ", " + pos.y.toFixed(2) + ")";
                    if (item) {
                        var x = new Date(item.datapoint[0]),
                        y = item.datapoint[1].toFixed(2);
                        var x1 = x.getUTCDate() + "/" + (x.getUTCMonth()+1) + "/" + x.getUTCFullYear() + " " + x.getUTCHours() + ":" + x.getUTCMinutes();
                        $("#tooltip").html("<font face=arial size=2>" + x1 + " : " + Math.round(y) + "dBm")
                        .css({top: item.pageY+5, left: item.pageX+15})
                        .fadeIn(200);
                    } else {
                        $("#").hide();
                    }
                  });

		            $("[id^=placeholder_]").bind("plotselected", function (event, ranges) {
                     var id = this.id;
                     id = id.slice(id.indexOf("_")+1);
                     rangesFrom[id-1] = ranges.xaxis.from;
                     rangesTo[id-1] = ranges.xaxis.to;
		               $.each(plot[id-1].getXAxes(), function(_, axis) {
			               var opts = axis.options;
			               opts.min = ranges.xaxis.from;
			               opts.max = ranges.xaxis.to;
		               });
		               plot[id-1].setupGrid();
		               plot[id-1].draw();
		               plot[id-1].clearSelection();
		            });

                  $("[id^=placeholder_]").dblclick(function () {
                     var id = this.id;
                     id = id.slice(id.indexOf("_")+1);
                     var axes = plot[id-1].getAxes(),
                         xaxis = axes.xaxis.options,
                         yaxis = axes.yaxis.options;
                     xaxis.min = null;
                     xaxis.max = null;
                     yaxis.min = null;
                     yaxis.max = null;
                     plot[id-1].setupGrid();
                     plot[id-1].draw();
                     rangesFrom[id-1] = undefined;
                  });

               }

               GetMeasurements(exist, $("#sfpindex").val());
            })

            $("#clear").click(function(e){
               location.reload();
            })

            api.exe({
               cmd: getAttr('mdl'),
               onSuccess: function (o) {
                  mdl = o.ajaxdata;
                  var maxSfp;
                  if (mdl.indexOf("MSDH") != -1)
                     maxSfp = 16; 
                  else
                     maxSfp = 2; 
                  for(var i = 1; i <= maxSfp; i++){
                     $('#sfpindex').append($('<option>', {
                       value: i,
                       text : i
                     }));
                  }
                  for(var i = 1; i <= 7; i++){
                     $('#days').append($('<option>', {
                       value: i,
                       text : i
                     }));
                  }
               },
               onError: function (err) {
                   console.log(err.errorThrown);
               }
            })

        })

    }); // eof ready

