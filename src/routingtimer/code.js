require([ '/js/api.js','/js/lib/jquery.js','/js/lib/jquery-ui.js'], function ( api,$ ) {

    var OPERATOR = $.cookie('operator');
    var routing_profile_schedules = [
        {Routing_Profile_Name:'TestProfile',Routing_Profile_DateTime:new Date(2014,6,23,11,33,30,0)},
        {Routing_Profile_Name:'TestProfile1',Routing_Profile_DateTime:new Date(2014,6,24,11,33,30,0)},
        {Routing_Profile_Name:'TestProfile2',Routing_Profile_DateTime:new Date(2014,6,25,11,33,30,0)},
        {Routing_Profile_Name:'TestProfile3',Routing_Profile_DateTime:new Date(2014,6,26,11,33,30,0)},
    ];

    $(document).ready(function()
    {
        api.exe(
            {
                cmd:'operators --json',
                dataType:'json',
                async:true,
                onSuccess:function(o)
                {
                    var topology_command = '';
                    operator_list = o.ajaxdata.operators;
                    for(var i=0; i< o.ajaxdata.operators.length; i++)
                    {

                    }
                    var d = new Date();
                    //var array =  getDaysArray(2014,7);
                    var array_of_times = ['12am','1am','2am','3am','4am','5am','6am','7am','8am','9am','10am','11am',
                        '12pm','1pm','2pm','3pm','4pm','5pm','6pm','7pm','8pm','9pm','10pm','11pm'
                    ]
                    var html = '<table id="calendar_table" class="type1">';
                    for(var l=0; l < 24; l++ )
                    {
                        html += "<tr>";
                        html += "<td rowspan='2'>"+array_of_times[l]+"</td>";
                        html += "<td class='selectable_cell' id='mon_"+l+"'></td>";
                        html += "<td class='selectable_cell' id='tue_"+l+"'></td>";
                        html += "<td class='selectable_cell' id='wed_"+l+"'></td>";
                        html += "<td class='selectable_cell' id='thur_"+l+"'></td>";
                        html += "<td class='selectable_cell' id='fri_"+l+"'></td>";
                        html += "<td class='selectable_cell' id='sat_"+l+"'></td>";
                        html += "<td class='selectable_cell' id='sun_"+l+"'></td>";
                        html += "</tr>";
                        html += "<tr>";
                        html += "<td class='selectable_cell' id='mon_"+l+"_30'></td>";
                        html += "<td class='selectable_cell' id='tue_"+l+"_30'></td>";
                        html += "<td class='selectable_cell' id='wed_"+l+"_30'></td>";
                        html += "<td class='selectable_cell' id='thur_"+l+"_30'></td>";
                        html += "<td class='selectable_cell' id='fri_"+l+"_30'></td>";
                        html += "<td class='selectable_cell' id='sat_"+l+"_30'></td>";
                        html += "<td class='selectable_cell' id='sun_"+l+"_30'></td>";
                        html += "</tr>";
                    }
                    html += "</table>"










                    /*if(array.length > 0)
                    {
                        var counter = 0;
                        var i =0;
                        for(i=0; i< array.length; i++)
                        {
                            if(counter == 6)
                            {
                                html+="</tr><tr id='counter_row'>"
                                counter = 1;
                            }
                            else
                            {
                                counter++;
                            }


                            var filtered_day_routing_profiles = _.filter(routing_profile_schedules,function(profile_date_time){
                                if(profile_date_time.Routing_Profile_DateTime.getDate() == i+1 )
                                {
                                    return profile_date_time;
                                }
                            });
                            html+="<td><div class='date_box' id='date_"+(i+1)+"'><span class='date_header'>"+array[i].split(' ')[1]+' - '+getdatestr(i+1)+"</span><div>";
                            for(var l=0; l < filtered_day_routing_profiles.length; l++)
                            {
                                var hour = filtered_day_routing_profiles[l].Routing_Profile_DateTime.getHours();
                                var minutes  = filtered_day_routing_profiles[l].Routing_Profile_DateTime.getMinutes();
                                html+="<div class='routing_event'><span>"+hour+":"+minutes+" - "+filtered_day_routing_profiles[l].Routing_Profile_Name+"</span></div>";
                            }
                            html+="</div></div></td>";
                        }
                    }
                    html+="</tr></table>";
                    */
                    $('#calendar_place_holder').html(html);
                    $('#mon_1_30').remove();
                    $('#mon_2').remove();
                    $('#mon_2_30').remove();
                    $('#mon_1').attr('rowspan','4');
                    $('#mon_1').addClass('routing_1');
                    $('#mon_1').text('Routing 1');

                    $('#tue_4_30').remove();
                    $('#tue_5').remove();
                    $('#tue_5_30').remove();
                    $('#tue_6').remove();
                    $('#tue_6_30').remove();
                    $('#tue_4').attr('rowspan','6');
                    $('#tue_4').addClass('routing_2');
                    $('#tue_4').text('Routing 2');


                    $('#wed_0_30').remove();
                    $('#wed_1').remove();
                    $('#wed_1_30').remove();
                    $('#wed_2').remove();
                    $('#wed_2_30').remove();
                    $('#wed_3').remove();
                    $('#wed_3_30').remove();
                    $('#wed_0').attr('rowspan','8');
                    $('#wed_0').addClass('routing_3');
                    $('#wed_0').text('Routing 3');

                    $('#thur_1').addClass('routing_1');
                    $('#thur_1').text('Routing 1');

                    $('#fri_1').addClass('routing_2');
                    $('#fri_1').text('Routing 2');

                    $('#sat_2').addClass('routing_3');
                    $('#sat_2').text('Routing 3');
                }
            });
        $( document ).on( 'click', '.routing_event', function () {
            //axellPopUp(  );
            $('#routing_dialog #title_text').text($( this ).text());

            $('#routing_dialog').dialog();
        });
        $(document).on("mouseover", ".selectable_cell", function() {
            //alert('mouseover works!!!!!!!!!');
            if(!$(this).hasClass('routing_1')&& !$(this).hasClass('routing_2')&& !$(this).hasClass('routing_3'))
            {
                $(this).addClass('hovered_tr');
            }

        });
        $(document).on("mouseout", ".selectable_cell", function() {
            //alert('mouseover works!!!!!!!!!');
            $(this).removeClass('hovered_tr');
        });



        $( document ).on( 'click', '.routing_1', function () {
            //axellPopUp(  );
            $('#routing_dialog #title_text').text($( this ).text());

            $('#routing_dialog').dialog();
        });

        $( document ).on( 'click', '.routing_2', function () {
            //axellPopUp(  );
            $('#routing_dialog #title_text').text($( this ).text());

            $('#routing_dialog').dialog();
        });

        $( document ).on( 'click', '.routing_3', function () {
            //axellPopUp(  );
            $('#routing_dialog #title_text').text($( this ).text());

            $('#routing_dialog').dialog();
        });

    });

    function getDaysArray(year, month) {
        var numDaysInMonth, daysInWeek, daysIndex, index, i, l, daysArray;

        numDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        daysInWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        daysIndex = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
        index = daysIndex[(new Date(year, month - 1, 1)).toString().split(' ')[0]];
        daysArray = [];

        for (i = 0, l = numDaysInMonth[month - 1]; i < l; i++) {
            daysArray.push((i + 1) + '. ' + daysInWeek[index++]);
            if (index == 7) index = 0;
        }

        return daysArray;
    }

    function getdatestr(date_num)
    {
        switch(date_num)
        {
            case 1:{
                return date_num+'st';
            }
            case 2:{
                return date_num+'nd';
            }
            case 3:{
                return date_num+'rd';
            }
            case 21:{
                return date_num+'st';
            }
            case 22:{
                return date_num+'nd';
            }
            case 23:{
                return date_num+'rd';
            }
            case 31:{
                return date_num+'st';
            }
            default:{
                return date_num+'th';
            }
        }
    }

});

