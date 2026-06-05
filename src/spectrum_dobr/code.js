require([ '/general/general.js', '/js/console.js', '/js/api.js', '/js/scheduler.js', '/js/convert.js', '/js/util.js', '/js/lib/jquery.js', '/js/lib/underscore.js', '/js/lib/jquery-ui.js', '/js/lib/handlebars.js', '/js/handlebars-helpers.js', '/js/led.js','/js/lib/tipsy.js','/js/lib/jquery.flot.min.js' ],
    function ( general, console, api, scheduler, convert, util, $, _ ) {
        var OPERATOR = $.parseJSON($.cookie('operatorCook'));
        var MAXWIDTH = 800;
        var MAXHEIGHT = 45;
        var SAFE_MARGIN = 60000;
        var MARGIN = 0;
        var USERNAME = $.cookie('username');
        var bandIndex;
        var uldlIndex;
        var dl_ul_shift;
        var bandsDB=[];
        var bandDuplex=[];
        var bandsSpec=[];
        var bandBandCurrent; 

        var updateInterval = 300;
        var maxPoints = 8192;
        var factorDefault = -195;
        var freqParam = 153.6/2;

        var captureEnable = false;

        var dataFft = [];
        var dataMax = [];
        var dataMin = [];
        var resFilter = [];
        var datas = [];

        var step= freqParam / maxPoints;
        var startFreq;
        var stopFreq;
        var startFreqIn;
        var stopFreqIn;

        var plot;
        var rangesFrom;
        var rangesTo;

        var bandValueByText = [];
        var bandTextByValue = [];

        var fftSource = [[3,2],[1,0],[3+4,2+4],[1+4,0+4]];


        function GetFft(){
        if (!captureEnable)
          return;

        var mirror = 1;
        var sShift = 0;
        for(var i = 0; i < bandsSpec.length; i ++)
        {
            if (bandsSpec[i]['band'] == bandBandCurrent)
            {
               if (uldlIndex == 1)
                  mirror = bandsSpec[i]['dl'];
               else
                  mirror = bandsSpec[i]['ul'];

               sShift = bandsSpec[i]['shift'];
               break;
            }
        }

        api.exe({
          cmd: "fft json " + fftSource[bandIndex-1][uldlIndex-1] + " " + mirror + " 1",
          dataType: 'json',
          async: true,
          onSuccess: function (o) {
             dataFft.length = 0;
             dataFft = o.ajaxdata.data;
             for (var i = 0; i < dataFft.length; i++) {
                dataFft[i] += Number($('#factor').val());
             }
             if (dataMax.length == 0){
                for (var i = 0; i < dataFft.length; i++) {
                    dataMax.push(-128);
                }
             }
             else{
                  for (var i = 0; i < dataFft.length; i++) {
                      if (dataFft[i] > dataMax[i])
                      dataMax[i] = dataFft[i];
                  }
             }
             if (dataMin.length == 0){
                for (var i = 0; i < dataFft.length; i++) {
                    dataMin.push(127);
                }
             }
             else{
                  for (var i = 0; i < dataFft.length; i++) {
                      if (dataFft[i] < dataMin[i])
                      dataMin[i] = dataFft[i];
                  }
             }
             CalcFlot(sShift);
             plot = $.plot("#placeholder", datas, {
                           series: {
                               lines: { lineWidth: 1, show: true },
                               points: { show: false }
                           },
                           grid: {
                               backgroundColor: { colors: [ "#000", "#000" ] },
                               borderWidth: {
                                   top: 1,
                                   right: 1,
                                   bottom: 2,
                                   left: 2
                               },
                               hoverable: true
                           },
                           yaxis:{
                               min:-120,
                               max: 35,
                               tickSize: 10,
                               tickColor: "#999"
                           },
                           xaxis:{
                               tickColor: "#999"
                           },
                           selection: {
				                   mode: "x"
			                  }

                        });
              if (rangesFrom != undefined){
		           $.each(plot.getXAxes(), function(_, axis) {
			            var opts = axis.options;
			            opts.min = rangesFrom;
			            opts.max = rangesTo;
		           });
		           plot.setupGrid();
              }
              plot.draw();
              setTimeout(GetFft, updateInterval);
          },
          onError:function(o){
              console.error("fft error");
              setTimeout(GetFft, updateInterval);
          }
         })
        }

        function CalcFlot(startPointShift){
          var resFft = [];
          var resMin = [];
          var resMax = [];
          var startPoint = ((startFreq + stopFreq) / 2) - (freqParam / 2);
          startPoint += Number(startPointShift);
          datas.length = 0;
          for (var i = 0; i < dataFft.length; i++) {
             if (((startPoint+(i*step))>=startFreqIn) && ((startPoint+(i*step))<=stopFreqIn))
               resFft.push([(startPoint+(i*step)), dataFft[i]]);
          }
          datas.push({ label: "", data: resFft });
          if (document.getElementById("max_hold").checked){
             for (var i = 0; i < dataMax.length; i++) {
               if (((startPoint+(i*step))>=startFreqIn) && ((startPoint+(i*step))<=stopFreqIn))
                  resMax.push([(startPoint+(i*step)), dataMax[i]]);
             }
             datas.push({ label: "", data: resMax, color: "#A0A0FF" });
          }
          if (document.getElementById("min_hold").checked){
             for (var i = 0; i < dataMin.length; i++) {
               if (((startPoint+(i*step))>=startFreqIn) && ((startPoint+(i*step))<=stopFreqIn))
                  resMin.push([(startPoint+(i*step)), dataMin[i]]);
             }
             datas.push({ label: "", data: resMin, color: "#FFA0A0" });
          }
          if (document.getElementById("filters_show").checked)
            datas.push({ label: "", data: resFilter, color: "red", lines: { lineWidth: 2 } });
        }

        function SetFilters(){
          resFilter.length = 0;
          api.exe({
              cmd: "dobr_filters get "+bandIndex+" --json",
              dataType: 'json',
              async: false,
              onSuccess: function (o)
              {
                  var startPoint = ((startFreq + stopFreq) / 2) - (freqParam / 2);
                  var arr = [];
                  for (var i = 0; i < maxPoints; i++) {
                     arr[i] = -130;
                  }
                  for (var i = 0; i < maxPoints; i++) {
                     if (((startPoint+(i*step))>=startFreqIn) && ((startPoint+(i*step))<=stopFreqIn)){
                        $.each(o.ajaxdata['band'+bandBandCurrent], function (j, filter)
                        {
                            if(filter['Enable'] == "1"){
                               var duplex = 0;
                               if (uldlIndex == 2){
                                 duplex = bandDuplex[bandBandCurrent];
                                 if (bandBandCurrent == "800")
                                    duplex = -duplex;
                               }  
                               if (((startPoint+(i*step))>(filter['DL_start_freq']-duplex)/*+step*/) && ((startPoint+(i*step))<(filter['DL_end_freq']-duplex)/*-step*/))
                                 arr[i] = 20;
                            }
                        })
                     }
                  }
                  for (var i = 0; i < maxPoints; i++) {
                     if (((startPoint+(i*step))>=startFreqIn) && ((startPoint+(i*step))<=stopFreqIn)){
                        resFilter.push([(startPoint+(i*step)), arr[i]]);   
                     }
                  }
              }
          })
        }
        /***
         * This function is used to show technician more options.
         * keyCode: ALT+SHIFT+T
         */
        var map = {18: false, 16: false, 84: false};
        window.techPermissions = techPermissions;
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
        function GetFactor(){
          api.exe({
              cmd: "GET FFT " + fftSource[bandIndex-1][uldlIndex-1],
              dataType: 'text',
              async: false,
              onSuccess: function(o){
                 $('#factor').val(o.ajaxdata);
              },
              onError:function(o){
                 $('#factor').val(factorDefault);
              }
          })
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
                              $(".toggle-keydown").show();
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

            api.exe({
               cmd:'bands --json',
               dataType:'json',
               onSuccess:function(o){
                    $.each(o.ajaxdata.bands, function (i, value) {
                        var res = value.FullName;
                        var bandText = res.replace("MHz ", "").replace("Band", "").replace("BAND", "");
                        var bandValue = value.Band;
                        bandValueByText[bandText] = bandValue;
                        bandTextByValue[bandValue] = bandText;
                    })
               }  
            });

            api.exe({
               cmd: 'bands_spec',
               dataType: 'json',
               async: false,
               onSuccess: function (o) {
                   $.each(o.ajaxdata.bands, function (i, value) {
                       bandsSpec[i] = value;
                 })
               }
            })

            $(".toggle-keydown").hide();
            techPermissions();

            $( '#apply-button' ).click(function() {
                api.exe({
                    cmd: "SET FFT " + fftSource[bandIndex-1][uldlIndex-1] + " " + $('#factor').val(),
                    dataType: 'text',
                    async: false,
                    onSuccess: function(o){
                    },
                    onError:function(o){
                    }
                })
            });


            $("<div id='tooltip'></div>").css({
              position: "absolute",
              display: "none",
              border: "1px solid #ddd",
              padding: "2px",
              "background-color": "#ffe",
              opacity: 0.80
            }).appendTo("body");
               

            $("#placeholder").bind("plothover", function (event, pos, item) {
              var str = "(" + pos.x.toFixed(2) + ", " + pos.y.toFixed(2) + ")";
              if (item) {
                  var x = item.datapoint[0].toFixed(2),
                  y = item.datapoint[1].toFixed(2);
                  $("#tooltip").html("<font face=arial size=2>" + x + "MHz : " + Math.round(y) + "dBm")
                  .css({top: item.pageY+5, left: item.pageX+15})
                  .fadeIn(200);
              } else {
                  $("#").hide();
              }
            });

		      $("#placeholder").bind("plotselected", function (event, ranges) {
               rangesFrom = ranges.xaxis.from;
               rangesTo = ranges.xaxis.to;
		         $.each(plot.getXAxes(), function(_, axis) {
			         var opts = axis.options;
			         opts.min = ranges.xaxis.from;
			         opts.max = ranges.xaxis.to;
		         });
		         plot.setupGrid();
		         plot.draw();
		         plot.clearSelection();
		      });

            $("#placeholder").dblclick(function () {
               var axes = plot.getAxes(),
                   xaxis = axes.xaxis.options,
                   yaxis = axes.yaxis.options;
               xaxis.min = null;
               xaxis.max = null;
               yaxis.min = null;
               yaxis.max = null;
               plot.setupGrid();
               plot.draw();
               rangesFrom = undefined;
            });

            $('#stop_cap').addClass('disabled');   

            $("#start_cap").click(function(e){
              $('#start_cap').addClass('disabled');
              $('#stop_cap').removeClass('disabled');
              document.getElementById('bands_name').disabled = true;
              document.getElementById('uldl_name').disabled = true;
              //document.getElementById('factor').disabled = true;
              document.getElementById('start_freq').disabled = true;
              document.getElementById('stop_freq').disabled = true;
              startFreqIn = $('#start_freq').val();
              stopFreqIn = $('#stop_freq').val();
              dataMax.length = 0;
              dataMin.length = 0;
              rangesFrom = undefined;
              SetFilters();
              captureEnable = true; 
              GetFft();
            })
            $("#stop_cap").click(function(e){
              $('#stop_cap').addClass('disabled');
              $('#start_cap').removeClass('disabled');
              document.getElementById('bands_name').disabled = false;
              document.getElementById('uldl_name').disabled = false;
              //document.getElementById('factor').disabled = false;
              document.getElementById('start_freq').disabled = false;
              document.getElementById('stop_freq').disabled = false;
              captureEnable = false;    
            })

            $("#max_hold").click(function(e){
              if (!document.getElementById("max_hold").checked){
                 dataMax.length = 0;
              }
            })
            $("#min_hold").click(function(e){
              if (!document.getElementById("min_hold").checked){
                 dataMin.length = 0;
              }
            })

            $.blockUI({ 
                fadeIn: 1000, 
                timeout:   2000, 
                onBlock: function() { 

                  api.exe({
                      cmd:'dobrstatus --json',
                      //dataType:'json',
                      onSuccess:function(o){
                          var dobrstatus = $.parseJSON(o.ajaxdata);

                          $.each(dobrstatus.Bands, function (key, band) {
                              if (band.Band != "-")
                              {
                                  $('#bands_name').append($('<option>', {
                                      value: band.No,
                                      text : bandTextByValue[band.Band],
                                      id : "band_"+band.No
                                  }));
                                  if (bandIndex == undefined){
                                    bandIndex = band.No;
                                    bandBandCurrent = band.Band;
                                    $('#start_freq').val(bandsDB[band.Band][0]);
                                    $('#stop_freq').val(bandsDB[band.Band][1]);
                                    startFreq = bandsDB[band.Band][0];
                                    stopFreq = bandsDB[band.Band][1];
                                  }
                              }
              
                          }); // eof each 

                          $('#uldl_name').append('<option value="1">Downlink</option><option value="2">Uplink</option>');
                          uldlIndex = 1;

                          GetFactor();
                      }
                  });

                  api.exe({
                      cmd: "bands --json",
                      dataType: 'json',
                      async: false,
                      onSuccess: function (o)
                      {
                          $.each(o.ajaxdata.bands, function (i, band)
                          {

                              freqStartDL = parseFloat(band.LowerDL)/1000000;
                              freqStopDL = parseFloat(band.UpperDL)/1000000;
                              freqStartUL = freqStartDL - band.Duplex/1000000;
                              freqStopUL = freqStopDL - band.Duplex/1000000;
                              //dl_ul_shift = parseFloat(band.Duplex)/1000000;
                              if (band.Band == "800") 
				                  {
                                  freqStartUL = freqStartDL + band.Duplex/1000000;
                                  freqStopUL = freqStopDL + band.Duplex/1000000;
				                  }
                              bandsDB[band.Band] = [freqStartDL,freqStopDL,freqStartUL,freqStopUL];
                              bandDuplex[band.Band] = band.Duplex/1000000;
                          })
                     }
                  })

                } 
            });

            $('#bands_name').change( function (e)
            {
                //var ids = [$("[id^=band_]")];
                bandIndex = parseInt(this.value);
                band = bandValueByText[$("#bands_name :selected").text()];
                bandBandCurrent = band;
                $('#start_freq').val(bandsDB[band][0]);
                $('#stop_freq').val(bandsDB[band][1]);
                startFreq = bandsDB[band][0];
                stopFreq = bandsDB[band][1];
                document.getElementById('uldl_name').value = '1';                
                uldlIndex = 1;
                GetFactor();
            });


            $('#uldl_name').change( function (e)
            {
                uldlIndex = parseInt(this.value);
                band = bandValueByText[$("#bands_name :selected").text()];
                if(uldlIndex == 1){
                    $('#start_freq').val(bandsDB[band][0]);
                    $('#stop_freq').val(bandsDB[band][1]);  
                    startFreq = bandsDB[band][0];
                    stopFreq = bandsDB[band][1];
                }else{
                    $('#start_freq').val(bandsDB[band][2]);
                    $('#stop_freq').val(bandsDB[band][3]);  
                    startFreq = bandsDB[band][2];
                    stopFreq = bandsDB[band][3];
                }                      
                GetFactor();
            });

            $('#start_freq').change( function (e)
            {
                var value = Number($('#start_freq').val());
                $('#start_freq').val(value.toFixed(3));
                
                if (!Number.isInteger(Number.parseInt($('#start_freq').val()))){
                  if(uldlIndex == 1)
                     $('#start_freq').val(bandsDB[bandBandCurrent][0]);
                   else
                     $('#start_freq').val(bandsDB[bandBandCurrent][2]);
                }
                if(uldlIndex == 1){
                  if (($('#start_freq').val() < bandsDB[bandBandCurrent][0]) || ($('#start_freq').val() > bandsDB[bandBandCurrent][1]))
                    $('#start_freq').val(bandsDB[bandBandCurrent][0]);
                }else{
                  if (($('#start_freq').val() < bandsDB[bandBandCurrent][2]) || ($('#start_freq').val() > bandsDB[bandBandCurrent][3]))
                    $('#start_freq').val(bandsDB[bandBandCurrent][2]);
                }
   
            });

            $('#stop_freq').change( function (e)
            {
                var value = Number($('#stop_freq').val());
                $('#stop_freq').val(value.toFixed(3));

                if (!Number.isInteger(Number.parseInt($('#stop_freq').val()))){
                  if(uldlIndex == 1)
                     $('#stop_freq').val(bandsDB[bandBandCurrent][1]);
                   else
                     $('#stop_freq').val(bandsDB[bandBandCurrent][3]);
                }
                if(uldlIndex == 1){
                  if (($('#stop_freq').val() < bandsDB[bandBandCurrent][0]) || ($('#stop_freq').val() > bandsDB[bandBandCurrent][1]))
                    $('#stop_freq').val(bandsDB[bandBandCurrent][1]);
                }else{
                  if (($('#stop_freq').val() < bandsDB[bandBandCurrent][2]) || ($('#stop_freq').val() > bandsDB[bandBandCurrent][3]))
                    $('#stop_freq').val(bandsDB[bandBandCurrent][3]);
                }
   
            });
      })




    }); // eof ready
