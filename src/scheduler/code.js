require([ '/js/api.js','/js/convert.js','/js/util.js','/js/lib/jquery_cookie.js','/js/lib/jquery.js','/js/lib/moment.min.js','/js/lib/fullcalendar.min.js' ], function ( api, convert,util) {

      var calendarEvents=[];
      var OPERATORLIST = $.parseJSON($.cookie('operatorCook'));
      var event_id = 1;
      var selectedColor = "rgb(220,33,39)";


      function setSaveEvents(str){
       var operator = $('#operatorname').val();
       var command = "calendar_saveevents -o " + operator + " '" + str+"'";
       api.exe({
         cmd: command,
         dataType: 'text',
         async: false,
         onSuccess: function (o) {
            console.log(o.ajaxdata);
         }
        })
      }

      function getSavedEvents(){
        calendarEvents.length = 0;
        var operator = $('#operatorname').val();
        var command = "calendar_getevents -o " + operator;
        api.exe({
            cmd: command,
            dataType: 'json',
            async: false,
            onSuccess: function (o) {
                $.each(o.ajaxdata.nodes, function (i, top) {
                    calendarEvents[i] = top;
              })
            }
        })
      }

      function getProfileList(){
       var operator = $('#operatorname').val();
       var command = "RFROUTE -o "+operator+" PROFILES --json";
       api.exe({
         cmd: command,
         //dataType: 'json',
         async:false, 
         onSuccess:function(o){
            var rfrouteProfileList = $.parseJSON(o.ajaxdata).Profiles;
            var selectorInput = document.getElementById("profile");
            for(var i = 0; i < rfrouteProfileList.length; i ++) 
            {
                var option = document.createElement("option");
                option.text = rfrouteProfileList[i]['Name'];
                selectorInput.add(option);
            }
         }
       })
      }


      function ShowEvents()
      {
         for(var i = 0; i < calendarEvents.length; i ++) 
         {
            var start = new Date(calendarEvents[i]['year_start'], calendarEvents[i]['month_start'], calendarEvents[i]['date_start'], calendarEvents[i]['hour_start'], calendarEvents[i]['minute_start']);
            var end = new Date(calendarEvents[i]['year_end'], calendarEvents[i]['month_end'], calendarEvents[i]['date_end'], calendarEvents[i]['hour_end'], calendarEvents[i]['minute_end']);

	         $('#calendar').fullCalendar('renderEvent',
		         {
			         title: calendarEvents[i]['title'],
                  id: calendarEvents[i]['id'],
			         start: start,
			         end: end,
			         color: calendarEvents[i]['color'],
			         overlap: false,
			         allDay: calendarEvents[i]['allDay']
		         },

		         true // make the event "stick"
	         );

            if (calendarEvents[i]['id'] > event_id)
               event_id = calendarEvents[i]['id'];
         }
         
         event_id++;
      }

      function ClearEvents()
      {
         var array = $('#calendar').fullCalendar('clientEvents');
         for(var i = 0; i < array.length; i++)
         {
	         $('#calendar').fullCalendar('removeEvents', array[i].id) ;
         }
      }


		/*
			jQuery document ready
		*/
		$(document).ready(function()
		{

       $.each(OPERATORLIST, function (key, value) {
          $('#operatorname').append($('<option>', {
              value: value.SysName,
              text : value.FullName
          }));
       });

       getSavedEvents();

       $('#operatorname').change(function(e){
         ClearEvents();
         getSavedEvents();
         ShowEvents();  
       })

       $("#divred").click(function(e){	
         selectedColor = "rgb(220,33,39)";
       })
       $("#divgreen").click(function(e){	
         selectedColor = "rgb(81,183,73)";
       })
       $("#divblue").click(function(e){	
         selectedColor = "rgb(84,132,237)";
       })
       $("#divorange").click(function(e){	
         selectedColor = "rgb(255,184,120)";
       })
       $("#divyellow").click(function(e){	
         selectedColor = "rgb(251,215,91)";
       })


       $("#deleteevents").click(function(e){	
         ClearEvents();
       })


       $("#saveevents").click(function(e){	
         var obj=[];

         var array = calendar.fullCalendar('clientEvents');
         for(var i = 0; i < array.length; i++)
         {
            var y_start=0;
            var mo_start=0;
            var d_start=0;
            var h_start=0;
            var mi_start=0;
            var y_end=0;
            var mo_end=0;
            var d_end=0;
            var h_end=0;
            var mi_end=0;

            y_start=array[i].start._i.getFullYear();
            mo_start=array[i].start._i.getMonth();
            d_start=array[i].start._i.getDate();
            h_start=array[i].start._i.getHours();
            mi_start=array[i].start._i.getMinutes();

            if (!array[i].allDay)
            {
               y_end=array[i].end._i.getFullYear();
               mo_end=array[i].end._i.getMonth();
               d_end=array[i].end._i.getDate();
               h_end=array[i].end._i.getHours();
               mi_end=array[i].end._i.getMinutes();
            }

            obj[i]={
                    title:array[i].title,
                    id:array[i].id,
                    allDay:array[i].allDay,
                    color:array[i].color,
                    year_start:y_start,
                    month_start:mo_start,
                    date_start:d_start,
                    hour_start:h_start,
                    minute_start:mi_start,
                    year_end:y_end,
                    month_end:mo_end,
                    date_end:d_end,
                    hour_end:h_end,
                    minute_end:mi_end
                 };
         }

         var str = JSON.stringify(obj);
         setSaveEvents(str);
       })

        $("#checkrecurrence").click(function(e){	
            if (document.getElementById("checkrecurrence").checked)
            {
					$("#formrecurrence").css("display","inline-block");
               if (document.getElementById("radioweekly").checked)
               {
				      $("#formweekly").css("display","inline-block");
               }
            }
            else
            {
					$("#formrecurrence").css("display","none");
			      $("#formweekly").css("display","none");
            }
        })
        $("#radiodaily").click(function(e){	
			   $("#formweekly").css("display","none");
        })
        $("#radioweekly").click(function(e){	
				$("#formweekly").css("display","inline-block");
        })


			var select_start; 
			var select_end; 
			var select_allDay;
         var select_id;

         var days_in_week = [false,false,false,false,false,false,false];
         

        $('#popup').dialog({
            width : 450,
            height : 350,
            resizable : false,
            autoOpen : false,
            title : "Add Event",
            buttons:{
                'Cancel': function () {
                    $(this).dialog('close');
                },
                'Save' : function () {
                  var title = $('#profile').val();

                  var y_start = select_start._i[0];
                  var mo_start = select_start._i[1];
                  var d_start = select_start._i[2];
                  var h_start = select_start._i[3];
                  var mi_start = select_start._i[4];
                  var y_end = select_end._i[0];
                  var mo_end = select_end._i[1];
                  var d_end = select_end._i[2];
                  var h_end = select_end._i[3];
                  var mi_end = select_end._i[4];

                  var date_end;

                  for(var i = 0; i < 7; i++)
                     days_in_week[i] = true;

                  if (document.getElementById("checkrecurrence").checked)
                  {
                     date_end = new Date(document.getElementById("setdate").value);

                     if (document.getElementById("radioweekly").checked)
                     {
                        for(var i = 0; i < 7; i++)
                           days_in_week[i] = false;

                        if (document.getElementById("checksun").checked)
                           days_in_week[0] = true;   
                        if (document.getElementById("checkmon").checked)
                           days_in_week[1] = true;   
                        if (document.getElementById("checktue").checked)
                           days_in_week[2] = true;   
                        if (document.getElementById("checkwed").checked)
                           days_in_week[3] = true;   
                        if (document.getElementById("checkthu").checked)
                           days_in_week[4] = true;   
                        if (document.getElementById("checkfri").checked)
                           days_in_week[5] = true;   
                        if (document.getElementById("checksat").checked)
                           days_in_week[6] = true;   
                     }

                  }
                  else
                  {
                     var date_end = new Date(y_start, mo_start, d_start, h_start, mi_start);
                  }

                  
                  for(var cur_day = d_start; true; cur_day++)
                  {
                     if (document.getElementById("checkrecurrence").checked)
                        d_end = cur_day;
                     var start = new Date(y_start, mo_start, cur_day, h_start, mi_start);
                     var end = new Date(y_end, mo_end, d_end, h_end, mi_end);
                     if (start > date_end)
                        break;

                     if (!days_in_week[start.getDay()])
                        continue;

				         var array = calendar.fullCalendar('clientEvents');
                     for(var i = 0; i < array.length; i++)
                     {
                        if(array[i].end <= start){}
                        else if (array[i].start >= end && array[i].end >= start){}
                        else
                        {
                          calendar.fullCalendar('unselect');
                          alert("Can not set overlapping Profiles")
                          return;
                        }
                     }

				         calendar.fullCalendar('renderEvent',
					         {
						         title: title,
                           id: event_id,
						         start: start,
						         end: end,
						         color: selectedColor,
						         overlap: false,
						         allDay: document.getElementById("checkallday").checked
					         },

					         true // make the event "stick"
				         );
                  }
                    
                  event_id++;
                  $(this).dialog('close');
                }
            }
        })


        $('#delete').dialog({
            width : 250,
            height : 150,
            resizable : false,
            autoOpen : false,
            title : "Delete Occurrences",
            buttons:{
                'Cancel': function () {
                    $(this).dialog('close');
                },
                'Delete' : function () {
				      calendar.fullCalendar('removeEvents', select_id) ;
                  $(this).dialog('close');
                }
            }
        })



			/*
				date store today date.
				d store today date.
				m store current month.
				y store current year.
			*/
			var date = new Date();
			var d = date.getDate();
         if (d<10) d="0"+d;
			var m = date.getMonth()+1;
         if (m<10) m="0"+m;
			var y = date.getFullYear();
         $('#setdate').val(y+"-"+m+"-"+d);

			/*
				Initialize fullCalendar and store into variable.
				Why in variable?
				Because doing so we can use it inside other function.
				In order to modify its option later.
			*/

			var calendar = $('#calendar').fullCalendar(
			{
				/*
					header option will define our calendar header.
					left define what will be at left position in calendar
					center define what will be at center position in calendar
					right define what will be at right position in calendar
				*/
				header:
				{
					left: 'prev,next today',
					center: 'title',
					//right: 'month,agendaWeek,agendaDay'
					right: 'month,agendaWeek'
				},
				/*
					defaultView option used to define which view to show by default,
					for example we have used agendaWeek.
				*/
				defaultView: 'agendaWeek',
				/*
					selectable:true will enable user to select datetime slot
					selectHelper will add helpers for selectable.
				*/
				selectable: true,
				selectHelper: true,
				slotDuration: '00:15:00',
				slotLabelFormat:"HH:mm",
				titleFormat: {
				   month: 'MMMM YYYY',
				   week:  'YYYY',
				   day: 'dddd, d.MM.yyyy'
				},
				views: {
    month: {
        displayEventEnd: true
    }
},

				/*
					when user select timeslot this option code will execute.
					It has three arguments. Start,end and allDay.
					Start means starting time of event.
					End means ending time of event.
					allDay means if events is for entire day or not.
				*/

            eventResize: function (event, dayDelta, minuteDelta) {
               var mi_diff = dayDelta._milliseconds / 1000 / 60;

               var array = calendar.fullCalendar('clientEvents', event.id);
		         calendar.fullCalendar('removeEvents', event.id) ;

               for(var i = 0; i < array.length; i++)
               {
                  var y_end = array[i].end._i.getFullYear();
                  var mo_end = array[i].end._i.getMonth();
                  var d_end = array[i].end._i.getDate();
                  var h_end = array[i].end._i.getHours();
                  var mi_end = array[i].end._i.getMinutes();
                  var end = new Date(y_end, mo_end, d_end, h_end, mi_end + mi_diff);

		            calendar.fullCalendar('renderEvent',
			            {
				            title: array[i].title,
                        id: event.id,
				            start: array[i].start,
				            end: end,
				            color: array[i].color,
				            overlap: false,
				            allDay: array[i].allDay
			            },

			            true // make the event "stick"
		            );
               }
             },


				eventClick: function (event) {

				      select_id = event._id;

					   $("#delete").dialog("open");

                 },

				select: function(start, end, allDay)
				{

				select_start = start; 
				select_end = end; 
				select_allDay = allDay;

				var view = $('#calendar').fullCalendar('getView');
                if (view.name == 'month') {
				    // return;
                }

					$("#popup").dialog("open");

               $("#spanstart").html((start._i[1]+1)+"/"+start._i[2]+"/"+start._i[0]+" "+start._i[3]+":"+start._i[4]);
               $("#spanend").html((end._i[1]+1)+"/"+end._i[2]+"/"+end._i[0]+" "+end._i[3]+":"+end._i[4]);

               $("#profile").empty();
               getProfileList();

					calendar.fullCalendar('unselect');
				},
				/*
					editable: true allow user to edit events.
				*/
				editable: true,
				/*
					events is the main option for calendar.
					for demo we have added predefined events in json object.
				*/
			});

         ShowEvents();  

		});

});

