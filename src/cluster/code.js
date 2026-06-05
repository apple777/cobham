require([ '/js/api.js','/js/convert.js','/js/util.js','/js/lib/jquery_cookie.js','/js/lib/jquery.js','/js/scheduler.js' ], function ( api, convert,util,scheduler) {

   var ip;
   var Devices=[];
   var Alarms=[];
   var disEnState=[];

   function ReadAlarms(){
      api.exe({
         cmd: 'alarms dump --json',
         dataType: 'json',
         //async: false,
         onSuccess: function (o) {
            Alarms = o.ajaxdata.alarms;
            console.log(Alarms);
            //searching / find matching values in two arrays
            for (var k = 0; k < Devices.length; k++)
            {
               // init led
               document.getElementById("ip_"+ Devices[k].IP).style.opacity = "1";
               document.getElementById("ip_"+ Devices[k].IP).style.cursor = "pointer";
               setLedColor('#radio-'+k+'-comm',0); //green
               disEnState[k] = true;
               document.getElementById("ip_"+ Devices[k].IP).childNodes[3].setAttribute("class", "button");
               document.getElementById("ip_"+ Devices[k].IP).childNodes[3].removeAttribute("onclick", "return false;");
               for (var i = 0; i < Alarms.length; i++)
               {
                  if(Devices[k].IP == Alarms[i].IP){
                     setLedColor('#radio-'+k+'-comm',1); //red
                     if(Alarms[i].DESCRIPTION == "Communication With Device Down" && Alarms[i].IP != "" ){
                        setLedColor('#radio-'+k+'-comm',null); //gray
                        // disEnState per index of device[k]
                        disEnState[k] = false;
                        //console.log(Alarms[k].DESCRIPTION , Alarms[k].IP); //gray
                        //console.log($("#ip_"+ Devices[k].IP));
                        document.getElementById("ip_"+ Devices[k].IP).style.opacity = "0.4";
                        document.getElementById("ip_"+ Devices[k].IP).style.cursor = "not-allowed";
                        document.getElementById("ip_"+ Devices[k].IP).childNodes[3].setAttribute("class", "button disabled");
                        document.getElementById("ip_"+ Devices[k].IP).childNodes[3].setAttribute("onclick", "return false;");
                        //document.getElementById("ip_"+ Devices[k].IP)
                     }
                  }
               }               
            }
         }   
      })      
   }

   $(document).ready(function()
   {

      api.exe({
         cmd: 'device getall --json',
         dataType: 'json',
         async: false,
         onSuccess: function (o) {
            Devices = o.ajaxdata.Devices;
            $.each(Devices, function (k, ip) {
            var resp = "\nIP: " + Devices[k].IP +
                     "\nSerial: " + Devices[k].Serial +
                     "\nTag: " + Devices[k].Tag;
            console.log(Devices[k].IP);
            $("#iplist").append('<li class="c" id="ip_'+ Devices[k].IP +'" title="'+resp+'"><span>&nbsp;</span><div id="radio-'+k+'-comm" class="led"></div>'+Devices[k].Tag+'<a class="button" href="http://'+Devices[k].IP+'" target="_blank">Login</a></li><br>');
            
            setLedColor('#radio-'+k+'-comm',0); //green
            })
         }

      });

      $.blockUI({ 
         fadeIn: 100, 
         timeout:   5000, 
         onBlock: function() { 
            setInterval(ReadAlarms,5000);   
         } 
      }); 

      iptxt.value = Devices[0].IP;
      $("#content").html('<object data="/target/filters_remote/" width="1500px" height="950px"/>');

      // controllers
      $("[id^=ip_]").click(function(e){ 
         //find index of device[k].IP that == to ip
         var id = this.id;
         ip = id.slice(id.indexOf("_")+1);
         iptxt.value = ip;
         var k;
         for (k = 0; k < Devices.length; k++)
         {
            if (ip == Devices[k].IP)
               break;
         }
         //if true
         if(disEnState[k]){
            $.blockUI({ 
               fadeIn: 100, 
               timeout:   2100, 
               onBlock: function() { 
                  $("#content").html('<object data="/target/filters_remote/" width="1500px" height="950px"/>');
               } 
            }); 
            //$(this).addClass('active');
            $("li").removeClass("active");
            $(this).toggleClass('active');
         }
      })


      $("#addip").click(function(e){   
         var str = $('#iptxt').val();
         if(str === "" /*|| !util.validateSpace(str)*/){
            axellPopUp("Please fill in a valid IP number. no space is allowed")
         }else{
            $.blockUI({ fadeIn: 1000, timeout: 15000, onBlock: function() { api.exe({ cmd: "device add "+ iptxt.value, onSuccess: function (o) { }, onError: function (e,o) { axellPopUp(o.ajaxdata); } }) } }); 
               setTimeout(function() { 
                  $.unblockUI({ 
                     //todo toggle commit - fit to the requirements 
                     onUnblock: function(){ /*$("#popupfail").dialog("open");*/ location.reload(); } 
                  }); 
               }, 15000); 
            }
      })

      $("#wizard-filtering").click(function(e){  
         $("#content").html('<object data="/target/filters_remote/" width="1500px" height="950px"/>');
      })
      $("#wizard-logs").click(function(e){ 
         $("#content").html('<object data="/target/logs_remote/" width="1500px" height="950px"/>');
      })

      $("#deleteip").click(function(e){
         api.exe({
            cmd: 'device delete '+ iptxt.value,
            //dataType: 'json',
            //async: false,
            onSuccess: function (o) {
                console.log(o);
            }
         })
         $("#ip_"+iptxt.value).empty();   
         $("#ip_"+iptxt.value).remove();

         location.reload();   
      })

      $("#deleteall").click(function(e){
         api.exe({
            cmd: 'device delall',
            //dataType: 'json',
            //async: false,
            onSuccess: function (o) {
                console.log(o);
            }
         })
         $("#ip_"+iptxt.value).empty();   
         $("#ip_"+iptxt.value).remove();

         location.reload();   
      })
   })

    //this runs when the page is loaded and ready
    $( document ).ready( function (e)
    {
        $('#popupfail').dialog({
            width : 250,
            height : 150,
            resizable : false,
            autoOpen : false,
            modal: true,
            title : "",
            buttons:{
                'Ok': function () {
                  $(this).dialog('close');
                  location.reload()                  
                }
            }
        })

    });


})

