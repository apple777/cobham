require([ '/general/general.js', '/js/console.js', '/js/api.js', '/js/scheduler.js', '/js/convert.js', '/js/util.js', '/js/lib/jquery.js', '/js/lib/underscore.js', '/js/lib/jquery-ui.js', '/js/lib/handlebars.js', '/js/handlebars-helpers.js', '/js/led.js','/js/lib/tipsy.js','/js/lib/jquery.flot.min.js' ],
    function ( general, console, api, scheduler, convert, util, $, _ ) {
        var OPERATORLIST = $.parseJSON($.cookie('operatorCook'));
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
        var freqParam = 153.6/2;

        var captureEnable = false;

        var dataFft = [];
        var dataMax = [];
        var dataMin = [];
        var resFilter = [];
        var resPim = [];
        var datas = [];

        var step= freqParam / maxPoints;
        var startFreq;
        var stopFreq;
        var startFreqIn;
        var stopFreqIn;

        var plot;
        var rangesFrom;
        var rangesTo;

        var mdl;

        var scaleMinRRU = -120;
        var scaleMaxRRU = 35;
        var scaleMinMTDI = -65;
        var scaleMaxMTDI = 90;
        var scaleFilterMinRRU = -130;
        var scaleFilterMaxRRU = 20;
        var scaleFilterMinMTDI = -75;
        var scaleFilterMaxMTDI = 75;

        var factorDefaultRRU = -195;
        var factorDefaultMTDI = -125;
        
        var scaleMin;
        var scaleMax;
        var scaleFilterMin;
        var scaleFilterMax;
        var factorDefault;

        var pimFreq;
        var pimInProgress = false;

        var bandValueByText = [];
        var bandTextByValue = [];

        var fftSource = [2,3,0,1];


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

        var dir = 1;
        if (uldlIndex == 1)
            dir = 2;     

        api.exe({
          cmd: "fft json " + fftSource[bandIndex-1] + " " + mirror + " " + dir,
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
                               min: scaleMin,
                               max: scaleMax,
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
          if (pimInProgress)
            datas.push({ label: "", data: resPim, color: "red", lines: { lineWidth: 2 } });
        }

        function SetFilters(){
          resFilter.length = 0;
          api.exe({
              cmd:'cellres -o ' + $('#operatorname').val() + ' --json',
              dataType: 'json',
              async: false,
              onSuccess: function (o)
              {
                  var startPoint = ((startFreq + stopFreq) / 2) - (freqParam / 2);
                  var arr = [];
                  for (var i = 0; i < maxPoints; i++) {
                     arr[i] = scaleFilterMin;
                  }
                  for (var i = 0; i < maxPoints; i++) {
                     if (((startPoint+(i*step))>=startFreqIn) && ((startPoint+(i*step))<=stopFreqIn)){
                        $.each(o.ajaxdata.cellres, function (j, filter)
                        {
                            if(filter['Band'] == bandBandCurrent){
                               var duplex = 0;
                               if (((uldlIndex == 1) && (mdl.indexOf("MTDI") != -1)) || ((uldlIndex == 2) && (mdl.indexOf("RRU") != -1))){
                                 duplex = bandDuplex[bandBandCurrent];
                                 if ((bandBandCurrent == "800") || (bandBandCurrent == "801"))
                                    duplex = -duplex;
                               }  
                               if (((startPoint+(i*step))>(filter['StartDL']/1000000-duplex)/*+step*/) && ((startPoint+(i*step))<(filter['StopDL']/1000000-duplex)/*-step*/))
                                 arr[i] = scaleFilterMax;
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

        function SetPim(){
          resPim.length = 0;
          var width = 250000;
          var startPoint = ((startFreq + stopFreq) / 2) - (freqParam / 2);
          var startPointPim = (Number(pimFreq) - width) / 1000000;
          var stopPointPim = (Number(pimFreq) + width) / 1000000;
          var arr = [];
          for (var i = 0; i < maxPoints; i++) {
            arr[i] = scaleFilterMin;
          }
          for (var i = 0; i < maxPoints; i++) {
            if (((startPoint+(i*step))>=startPointPim) && ((startPoint+(i*step))<=stopPointPim))
               arr[i] = scaleFilterMax;
          }
          for (var i = 0; i < maxPoints; i++) {
            if (((startPoint+(i*step))>=startFreqIn) && ((startPoint+(i*step))<=stopFreqIn)){
               resPim.push([(startPoint+(i*step)), arr[i]]);   
            }
          }
        }

        function CheckPim(){
           var command = "set_pim_test STATUS";
           api.exe({
               cmd: command,
               dataType: 'json',
               async: false,
               onSuccess: function (o) {
                   $.each(o.ajaxdata.PIM_STATUS, function (i, data) {
                       if (data.status == "ON"){
                          $('#start_cap').addClass('disabled');
                          $('#stop_cap').removeClass('disabled');
                          $('#pim_test').addClass('disabled');
                          document.getElementById('operatorname').disabled = true;
                          document.getElementById('bands_name').disabled = true;
                          document.getElementById('uldl_name').disabled = true;
                          //document.getElementById('factor').disabled = true;
                          document.getElementById('start_freq').disabled = true;
                          document.getElementById('stop_freq').disabled = true;
                          document.getElementById('min_hold').checked = false;
                          document.getElementById('min_hold').disabled = true;
                          document.getElementById('max_hold').checked = false;
                          document.getElementById('max_hold').disabled = true;
                          document.getElementById('filters_show').checked = false;
                          document.getElementById('filters_show').disabled = true;
                          startFreqIn = $('#start_freq').val();
                          stopFreqIn = $('#stop_freq').val();
                          SetPim();
                          pimInProgress = true;
                          captureEnable = true; 
                          GetFft();
                       }
                 })
               }
           })
        }

        function getPimFreq(freq){
           var command = "set_pim_test GET " + freq;
           api.exe({
               cmd: command,
               dataType: 'json',
               async: false,
               onSuccess: function (o) {
                   $.each(o.ajaxdata.PIM_GET, function (i, data) {
                       pimFreq = data.freq;
                       console.log(pimFreq);
                       if (pimFreq != "")
                           $('#pim_test').removeClass('hidden');
                       else
                           $('#pim_test').addClass('hidden');
                 })
               }
           })
        }

        function setPimOnOff(status){
          var command = "set_pim_test SET " + status;
          var timeOut = 1000;
          if (status == "ON")
            timeOut = 10000;
          $.blockUI({ 
             fadeIn: 1000, 
             timeout: timeOut, 
             onBlock: function() { 
                api.exe({
                  cmd: command,
                  dataType: 'text',
                  async: false,
                  onSuccess: function (o) {
                     console.log(o.ajaxdata);
                  }
                })
             } 
          });
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
              cmd: "GET FFT " + fftSource[bandIndex-1],
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

        function GetBands(){
            $.blockUI({ 
                fadeIn: 1000, 
                timeout:   2000, 
                onBlock: function() { 

                  api.exe({
                      cmd:'rflevels -o ' + $('#operatorname').val() + ' --json',
                      dataType:'json',
                      onSuccess:function(o){
                          bandIndex = undefined;
                          $('#bands_name').empty();
                          $.each(o.ajaxdata.Composite, function (key, band) {
                              if (band.Band != "-")
                              {
                                  $('#bands_name').append($('<option>', {
                                      value: band.Chain,
                                      text : bandTextByValue[band.Band],
                                      id : "band_"+band.Chain
                                  }));
                                  if (bandIndex == undefined){
                                    bandIndex = band.Chain;
                                    bandBandCurrent = band.Band;
                                    getPimFreq(bandBandCurrent);
                                    if (mdl.indexOf("MTDI") != -1){
                                       startFreq = bandsDB[band.Band][0];
                                       stopFreq = bandsDB[band.Band][1];
                                    }else{
                                       startFreq = bandsDB[band.Band][2];
                                       stopFreq = bandsDB[band.Band][3];
                                    }
                                    /*if (band.Band == "801")
                                       stopFreq = 821;*/
                                    $('#start_freq').val(startFreq);
                                    $('#stop_freq').val(stopFreq);
                                  }
                              }
              
                          }); // eof each 

                          $('#uldl_name').append('<option value="1">Tx</option><option value="2">Rx</option>');
                          document.getElementById('uldl_name').value = '2';                
                          uldlIndex = 2;

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
                              if ((band.Band == "800") || (band.Band == "801")) 
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

            setTimeout(CheckPim, 2000);        

            api.exe({
               cmd: getAttr('mdl'),
               onSuccess: function (o) {
                   mdl = o.ajaxdata;
                   if (mdl.indexOf("MTDI") != -1){
                     scaleMin = scaleMinMTDI;
                     scaleMax = scaleMaxMTDI;
                     scaleFilterMin = scaleFilterMinMTDI;
                     scaleFilterMax = scaleFilterMaxMTDI;
                     factorDefault = factorDefaultMTDI;
                   }else{
                     scaleMin = scaleMinRRU;
                     scaleMax = scaleMaxRRU;
                     scaleFilterMin = scaleFilterMinRRU;
                     scaleFilterMax = scaleFilterMaxRRU;
                     factorDefault = factorDefaultRRU;
                   }
               },
               onError: function (err) {
                   console.log(err.errorThrown);
               }
            })

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
                    cmd: "SET FFT " + fftSource[bandIndex-1] + " " + $('#factor').val(),
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
              $('#pim_test').addClass('disabled');
              document.getElementById('operatorname').disabled = true;
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
              $('#pim_test').removeClass('disabled');
              document.getElementById('operatorname').disabled = false;
              document.getElementById('bands_name').disabled = false;
              document.getElementById('uldl_name').disabled = false;
              //document.getElementById('factor').disabled = false;
              document.getElementById('start_freq').disabled = false;
              document.getElementById('stop_freq').disabled = false;
              if (pimInProgress){
                  document.getElementById('min_hold').disabled = false;
                  document.getElementById('max_hold').disabled = false;
                  document.getElementById('filters_show').disabled = false;
                  setPimOnOff("OFF");
                  pimInProgress = false; 
              }
              captureEnable = false;    
            })
            $("#pim_test").click(function(e){
              axellConfirm("alert","Warning","1.Please verify no routing profiles are activated.\n2.During PIM testing the system will transmit 2xCW tone full power, please make sure a LOW PIM Attenuator is connected.\nDo you really want to continue?", function () {
                 $('#start_cap').addClass('disabled');
                 $('#stop_cap').removeClass('disabled');
                 $('#pim_test').addClass('disabled');
                 document.getElementById('operatorname').disabled = true;
                 document.getElementById('bands_name').disabled = true;
                 document.getElementById('uldl_name').disabled = true;
                 //document.getElementById('factor').disabled = true;
                 document.getElementById('start_freq').disabled = true;
                 document.getElementById('stop_freq').disabled = true;
                 document.getElementById('min_hold').checked = false;
                 document.getElementById('min_hold').disabled = true;
                 document.getElementById('max_hold').checked = false;
                 document.getElementById('max_hold').disabled = true;
                 document.getElementById('filters_show').checked = false;
                 document.getElementById('filters_show').disabled = true;
                 startFreqIn = $('#start_freq').val();
                 stopFreqIn = $('#stop_freq').val();
                 SetPim();
                 pimInProgress = true;
                 setPimOnOff("ON"); 
                 captureEnable = true; 
                 GetFft();
              })
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

            $.each(OPERATORLIST, function (key, value) {
                $('#operatorname').append($('<option>', {
                    value: value.SysName,
                    text : value.FullName
                }));
            });

            $('#operatorname').change(function(e){
               GetBands();
            })

            GetBands();

            $('#bands_name').change( function (e)
            {
                bandIndex = parseInt(this.value);
                band = bandValueByText[$("#bands_name :selected").text()];
                bandBandCurrent = band;
                getPimFreq(bandBandCurrent);
                if (mdl.indexOf("MTDI") != -1){
                   startFreq = bandsDB[band][0];
                   stopFreq = bandsDB[band][1];
                }else{
                   startFreq = bandsDB[band][2];
                   stopFreq = bandsDB[band][3];
                }
                /*if (band == "801")
                   stopFreq = 821;*/
                $('#start_freq').val(startFreq);
                $('#stop_freq').val(stopFreq);
                document.getElementById('uldl_name').value = '2';                
                uldlIndex = 2;
                GetFactor();
            });


            $('#uldl_name').change( function (e)
            {
                uldlIndex = parseInt(this.value);
                band = bandValueByText[$("#bands_name :selected").text()];
                if(uldlIndex == 1){
                    if (mdl.indexOf("MTDI") != -1){
                       startFreq = bandsDB[band][2];
                       stopFreq = bandsDB[band][3];
                    }else{
                       startFreq = bandsDB[band][0];
                       stopFreq = bandsDB[band][1];
                    }
                }else{
                    if (mdl.indexOf("MTDI") != -1){
                       startFreq = bandsDB[band][0];
                       stopFreq = bandsDB[band][1];
                    }else{
                       startFreq = bandsDB[band][2];
                       stopFreq = bandsDB[band][3];
                    }
                }                      
                /*if (band == "801")
                   stopFreq = 821;*/
                $('#start_freq').val(startFreq);
                $('#stop_freq').val(stopFreq);
                GetFactor();
            });

            $('#start_freq').change( function (e)
            {
                var minBandDB;
                var maxBandDB;

                var value = Number($('#start_freq').val());
                $('#start_freq').val(value.toFixed(3));
                
                if (!Number.isInteger(Number.parseInt($('#start_freq').val()))){
                  if(uldlIndex == 1){
                     if (mdl.indexOf("MTDI") != -1)
                        minBandDB = bandsDB[bandBandCurrent][2];
                     else
                        minBandDB = bandsDB[bandBandCurrent][0];
                   }else{
                     if (mdl.indexOf("MTDI") != -1)
                        minBandDB = bandsDB[bandBandCurrent][0];
                     else
                        minBandDB = bandsDB[bandBandCurrent][2];
                   }
                   $('#start_freq').val(minBandDB);
                }
                if(uldlIndex == 1){
                  if (mdl.indexOf("MTDI") != -1){
                     minBandDB = bandsDB[bandBandCurrent][2];
                     maxBandDB = bandsDB[bandBandCurrent][3];
                  }else{
                     minBandDB = bandsDB[bandBandCurrent][0];
                     maxBandDB = bandsDB[bandBandCurrent][1];
                  }
                }else{
                  if (mdl.indexOf("MTDI") != -1){
                     minBandDB = bandsDB[bandBandCurrent][0];
                     maxBandDB = bandsDB[bandBandCurrent][1];
                  }else{
                     minBandDB = bandsDB[bandBandCurrent][2];
                     maxBandDB = bandsDB[bandBandCurrent][3];
                  }
                }
                if (($('#start_freq').val() < minBandDB) || ($('#start_freq').val() > maxBandDB))
                  $('#start_freq').val(minBandDB);
   
            });

            $('#stop_freq').change( function (e)
            {
                var minBandDB;
                var maxBandDB;
                 
                var value = Number($('#stop_freq').val());
                $('#stop_freq').val(value.toFixed(3));

                if (!Number.isInteger(Number.parseInt($('#stop_freq').val()))){
                  if(uldlIndex == 1){
                     if (mdl.indexOf("MTDI") != -1)
                        maxBandDB = bandsDB[bandBandCurrent][3];
                     else
                        maxBandDB = bandsDB[bandBandCurrent][1];
                   }else{
                     if (mdl.indexOf("MTDI") != -1)
                        maxBandDB = bandsDB[bandBandCurrent][1];
                     else
                        maxBandDB = bandsDB[bandBandCurrent][3];
                   }
                   /*if (bandBandCurrent == "801")
                     maxBandDB = 821;*/
                   $('#stop_freq').val(maxBandDB);
                }
                if(uldlIndex == 1){
                  if (mdl.indexOf("MTDI") != -1){
                     minBandDB = bandsDB[bandBandCurrent][2];
                     maxBandDB = bandsDB[bandBandCurrent][3];
                  }else{
                     minBandDB = bandsDB[bandBandCurrent][0];
                     maxBandDB = bandsDB[bandBandCurrent][1];
                  }
                }else{
                  if (mdl.indexOf("MTDI") != -1){
                     minBandDB = bandsDB[bandBandCurrent][0];
                     maxBandDB = bandsDB[bandBandCurrent][1];
                  }else{
                     minBandDB = bandsDB[bandBandCurrent][2];
                     maxBandDB = bandsDB[bandBandCurrent][3];
                  }
                }
                /*if (bandBandCurrent == "801")
                  maxBandDB = 821;*/
                if (($('#stop_freq').val() < minBandDB) || ($('#stop_freq').val() > maxBandDB))
                  $('#stop_freq').val(maxBandDB);
   
            });
      })




    }); // eof ready
