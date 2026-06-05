require([ '/general/general.js', '/js/console.js', '/js/api.js', '/js/scheduler.js', '/js/convert.js', '/js/util.js', '/js/lib/jquery.js', '/js/lib/underscore.js', '/js/lib/jquery-ui.js', '/js/lib/handlebars.js', '/js/handlebars-helpers.js', '/js/led.js','/js/lib/tipsy.js','/js/lib/jquery.flot.min.js' ],
    function ( general, console, api, scheduler, convert, util, $, _ ) {
        var OPERATORLIST = $.parseJSON($.cookie('operatorCook'));
        var MAXWIDTH = 800;
        var MAXHEIGHT = 45;
        var SAFE_MARGIN = 60000;
        var MARGIN = 0;
        var USERNAME = $.cookie('username');
        var params = getUrlParams();
        var OPERATOR = params.operator;
        var CRESID = params.cresid;

        var datas = [];
        var graphExist = [];
        var resId = [];
        var resTag = [];
        var plot = [];
        var rangesFrom = [];
        var rangesTo = [];

        //var scaleMin = -10;
        //var scaleMax = 100;

        function download(filename, text) {
           var element = document.createElement('a');
           element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
           element.setAttribute('download', filename);

           element.style.display = 'none';
           document.body.appendChild(element);

           element.click();

           document.body.removeChild(element);
        }

        function GetMeasurements(exist, index){
           api.exe({
             cmd: "rfmeasurements " + $('#operator').val() + " " + resId[index-1] + " --json",
             dataType: 'json',
             async: true,
             onSuccess: function (o) {
                datas.length = 0;
                var uplink = [];
                var downlink = [];
                var date, dateStart, dateStop;
                $.each(o.ajaxdata.rfmeasurements, function (i, val) {
                  date = new Date(val.Date*1000);
                  uplink.push([date, val.Tx]);
                  downlink.push([date, val.Rx]);
                  if (i==0)
                     dateStart = date;
                })
                dateStop = date;
                if ((!exist) || (exist && document.getElementById("id_Uplink_" + index).checked))
                  datas.push({ label: "Uplink", data: uplink });
                if ((!exist) || (exist && document.getElementById("id_Downlink_" + index).checked))
                  datas.push({ label: "Downlink", data: downlink });
                if(!exist){
                  AddCheckbox("Uplink");
                  AddCheckbox("Downlink");
                }
                var dateStartStr = dateStart.getUTCDate() + "/" + (dateStart.getUTCMonth()+1) + "/" + dateStart.getUTCFullYear() + " " + dateStart.getUTCHours() + ":" + dateStart.getUTCMinutes();
                var dateStopStr = dateStop.getUTCDate() + "/" + (dateStop.getUTCMonth()+1) + "/" + dateStop.getUTCFullYear() + " " + dateStop.getUTCHours() + ":" + dateStop.getUTCMinutes();
                $("#label_"+$("#cres").val()).text(dateStartStr+" - "+dateStopStr);
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
            $("#choices_"+$("#cres").val()).append("<br/><br/><input type='checkbox' name='" + label +
               "' checked='checked' id='id_" + label + "_" + $("#cres").val() + "'></input>" +
               "<label for='id_" + label + "_" + $("#cres").val() + "'>"
               + label + " " + "</label>");

            $("[id^=id_]").click(function(e){	
               var id = this.id;
               id = id.slice(id.indexOf("_")+1);
               id = id.slice(id.indexOf("_")+1);
               GetMeasurements(true, id);
            })
        }

        function GetCres(){
            $('#cres').empty();
            resId.length = 0;
            resTag.length = 0;
            api.exe({
                 cmd:'cellres -o ' + $('#operator').val() + ' --json',
                 dataType: 'json',
                 async: false,
                 onSuccess: function (o)
                 {
                     $.each(o.ajaxdata.cellres, function (i, value)
                     {
                         $('#cres').append($('<option>', {
                             value: i+1,
                             text : value.Tag
                         }));
                         resId.push(value.ResID);
                         resTag.push(value.Tag);
                     })
                 }
            })
        }
 
        $(document).ready(function(){

            $("#generate").click(function(e){
               var exist = false;
               for(var i = 0; i < graphExist.length; i++){
                  if(graphExist[i] == $("#cres").val()){
                     exist = true;
                     break;
                  }
               }
               if(!exist){
                  $("#generalstatus").append('<div class="demo-container"><div><label>'+resTag[$("#cres").val()-1]+'</label><br/><label id="label_'+$("#cres").val()+'"></label></div><div id="placeholder_'+$("#cres").val()+'" class="demo-placeholder"></div><p id="choices_'+$("#cres").val()+'" style="float:right;text-align:left;"></p></div>');

                  graphExist.push($("#cres").val());

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

               GetMeasurements(exist, $("#cres").val());
            })

            $("#clear").click(function(e){
               location.reload();
            })

            $('#export').click(function() {
              api.exe({
                cmd: "rfmeasurements " + $('#operator').val() + " " + resId[$("#cres").val()-1],
                dataType: 'text',
                async: true,
                onSuccess: function (o) {
                   download(resId[$("#cres").val()-1]+".csv", o.ajaxdata);
                },
                onError:function(o){
                }
              })
            })

            $.each(OPERATORLIST, function (key, value) {
                $('#operator').append($('<option>', {
                    value: value.SysName,
                    text : value.FullName
                }));
            });

            $('#operator').change(function(e){
               GetCres();
            })

            $('#operator').val(OPERATOR);
            GetCres();
            for(var i = 0; i < resId.length; i++){
               if(resId[i] == CRESID){
                  $("#cres").val(i+1);   
                  break;
               }
            }

            $("#generate").click();
        })

    }); // eof ready

