require([ '/js/api.js' ], function ( api ) {
	
	var envDB=[];
	var sfpsDB=[];
	var slavesDB=[];
	
    function getSlaves(){
        var command;
        
        command = "topology --json";
        
        var length = slavesDB.length;
        for(var x=0; x < length; x++){
            slavesDB.pop();
        }
        
        api.exe({
            cmd: command,
            dataType: 'json',
            async: false,
            onSuccess: function (o) {
                $.each(o.ajaxdata.nodes, function (i, node) {
                    slavesDB[i] = node;
              })
            }
        })
	}
	
    function getMeasurements(deviceId){
        var sfpCommand;
        var envCommand;
		
		for(var i = 0; i < slavesDB.length; i ++){
			if(slavesDB[i]['ID'] == deviceId){
				if(slavesDB[i]['TYPE'] == 'MSDH-M'){
					sfpCommand = "measurements dump sfp --json";
					envCommand = "measurements dump env --json";
				}
				else{
					sfpCommand = "measurements remote sfp --json " + slavesDB[i]['IP'];
					envCommand = "measurements remote env --json " + slavesDB[i]['IP'];
				}
			}
		}
        
        var length = sfpsDB.length;
        for(var x=0; x < length; x++){
            sfpsDB.pop();
        }
        
        api.exe({
            cmd: sfpCommand,
            dataType: 'json',
            async: false,
            onSuccess: function (o) {
                $.each(o.ajaxdata.sfps, function (i, measurement) {
                    sfpsDB[i] = measurement;
              })
            }
        })
        
        var length = envDB.length;
        for(var x=0; x < length; x++){
            envDB.pop();
        }
        
        api.exe({
            cmd: envCommand,
            dataType: 'json',
            async: false,
            onSuccess: function (o) {
                $.each(o.ajaxdata.env, function (i, measurement) {
                    envDB[i] = measurement;
              })
            }
        })
    }
	
	function buildSfpTable(){
		var venRow8  = $("<tr />");
		var partRow8 = $("<tr />");
		var waveRow8 = $("<tr />");
		var tempRow8 = $("<tr />");
		var rxRow8   = $("<tr />");
		var txRow8   = $("<tr />");
		var vccRow8  = $("<tr />");
		var biasRow8 = $("<tr />");

		var venRow16  = $("<tr />");
		var partRow16 = $("<tr />");
		var waveRow16 = $("<tr />");
		var tempRow16 = $("<tr />");
		var rxRow16   = $("<tr />");
		var txRow16   = $("<tr />");
		var vccRow16  = $("<tr />");
		var biasRow16 = $("<tr />");
		
		$( "#sfps8-table" ).append( venRow8 );			
		$( "#sfps8-table" ).append( partRow8 );			
		$( "#sfps8-table" ).append( waveRow8 );			
		$( "#sfps8-table" ).append( tempRow8 );			
		$( "#sfps8-table" ).append( rxRow8 );			
		$( "#sfps8-table" ).append( txRow8 );			
		$( "#sfps8-table" ).append( vccRow8 );			
		$( "#sfps8-table" ).append( biasRow8 );			

		$( "#sfps16-table" ).append( venRow16 );			
		$( "#sfps16-table" ).append( partRow16 );			
		$( "#sfps16-table" ).append( waveRow16 );			
		$( "#sfps16-table" ).append( tempRow16 );			
		$( "#sfps16-table" ).append( rxRow16 );			
		$( "#sfps16-table" ).append( txRow16 );			
		$( "#sfps16-table" ).append( vccRow16 );			
		$( "#sfps16-table" ).append( biasRow16 );			

		venRow8.append($	("<td style='background-color: black; color:cyan; text-align:center;font-weight:bold;'>vendor</td>"));
		partRow8.append($	("<td style='background-color: black; color:cyan; text-align:center;font-weight:bold;'>part</td>"));
		waveRow8.append($	("<td style='background-color: black; color:cyan; text-align:center;font-weight:bold;'>wave</td>"));
		tempRow8.append($	("<td style='background-color: black; color:cyan; text-align:center;font-weight:bold;'>Temp</td>"));
		rxRow8.append($		("<td style='background-color: black; color:cyan; text-align:center;font-weight:bold;'>Rx</td>"));
		txRow8.append($		("<td style='background-color: black; color:cyan; text-align:center;font-weight:bold;'>Tx</td>"));
		vccRow8.append($	("<td style='background-color: black; color:cyan; text-align:center;font-weight:bold;'>Vcc</td>"));
		biasRow8.append($	("<td style='background-color: black; color:cyan; text-align:center;font-weight:bold;'>Bias</td>"));
		venRow16.append($	("<td style='background-color: black; color:cyan; text-align:center;font-weight:bold;'>vendor</td>"));
		partRow16.append($	("<td style='background-color: black; color:cyan; text-align:center;font-weight:bold;'>part</td>"));
		waveRow16.append($	("<td style='background-color: black; color:cyan; text-align:center;font-weight:bold;'>wave</td>"));
		tempRow16.append($	("<td style='background-color: black; color:cyan; text-align:center;font-weight:bold;'>Temp</td>"));
		rxRow16.append($	("<td style='background-color: black; color:cyan; text-align:center;font-weight:bold;'>Rx</td>"));
		txRow16.append($	("<td style='background-color: black; color:cyan; text-align:center;font-weight:bold;'>Tx</td>"));
		vccRow16.append($	("<td style='background-color: black; color:cyan; text-align:center;font-weight:bold;'>Vcc</td>"));
		biasRow16.append($	("<td style='background-color: black; color:cyan; text-align:center;font-weight:bold;'>Bias</td>"));

		for(var i = 0; i < 16 ; i += 2){
			if(sfpsDB.length > i){
				if(sfpsDB[i].abs == 1){
					venRow8.append($("<td> - </td>"));
					partRow8.append($("<td> - </td>"));
					waveRow8.append($("<td> - </td>"));
					tempRow8.append($("<td> - </td>"));
					rxRow8.append($("<td> - </td>"));
					txRow8.append($("<td> - </td>"));
					vccRow8.append($("<td> - </td>"));
					biasRow8.append($("<td> - </td>"));
				}
				else{
					venRow8.append($("<td>" + sfpsDB[i].vendor + "</td>"));
					partRow8.append($("<td>" + sfpsDB[i].part + "</td>"));
					waveRow8.append($("<td>" + sfpsDB[i].wave + "</td>"));
					tempRow8.append($("<td>" + sfpsDB[i].Temp + "</td>"));
					rxRow8.append($("<td>" + sfpsDB[i].Rx + "</td>"));
					txRow8.append($("<td>" + sfpsDB[i].Tx + "</td>"));
					vccRow8.append($("<td>" + sfpsDB[i].Vcc + "</td>"));
					biasRow8.append($("<td>" + sfpsDB[i].Bias + "</td>"));
				}
			}
		}
		for(var i = 1; i < 16 ; i += 2){
			if(sfpsDB.length > i){
				if(sfpsDB[i].abs == 1){
					venRow16.append($("<td> - </td>"));
					partRow16.append($("<td> - </td>"));
					waveRow16.append($("<td> - </td>"));
					tempRow16.append($("<td> - </td>"));
					rxRow16.append($("<td> - </td>"));
					txRow16.append($("<td> - </td>"));
					vccRow16.append($("<td> - </td>"));
					biasRow16.append($("<td> - </td>"));
				}
				else{
					venRow16.append($("<td>" + sfpsDB[i].vendor + "</td>"));
					partRow16.append($("<td>" + sfpsDB[i].part + "</td>"));
					waveRow16.append($("<td>" + sfpsDB[i].wave + "</td>"));
					tempRow16.append($("<td>" + sfpsDB[i].Temp + "</td>"));
					rxRow16.append($("<td>" + sfpsDB[i].Rx + "</td>"));
					txRow16.append($("<td>" + sfpsDB[i].Tx + "</td>"));
					vccRow16.append($("<td>" + sfpsDB[i].Vcc + "</td>"));
					biasRow16.append($("<td>" + sfpsDB[i].Bias + "</td>"));
				}
			}
		}
	}

	function buildEnvTable(){
		for(var i = 0; i < envDB.length; i ++){
			var row  = $("<tr />");
			$( "#measurements-table" ).append( row );			
			row.append($("<td>" + envDB[i].att  + "</td>"));
			row.append($("<td>" + envDB[i].hw  + "</td>"));
			row.append($("<td>" + envDB[i].pos  + "</td>"));
			row.append($("<td>" + envDB[i].desc  + "</td>"));
			row.append($("<td>" + envDB[i].min  + "</td>"));
			row.append($("<td>" + envDB[i].val  + "</td>"));
			row.append($("<td>" + envDB[i].max  + "</td>"));
			row.append($("<td>" + envDB[i].unit  + "</td>"));
		}
	}
	
	function setDevicesFilter(){
		var deviceList = document.getElementById('device_colomn');
        var length = deviceList.length;
        for(var x=0; x < length; x++){
            deviceList[0] = null;
        }
		getSlaves();
        for(var x=0; x < slavesDB.length; x++){
			var option = $("<option>" + slavesDB[x]['ID'] + "</option>");
			$("#device_colomn").append(option);
        }
	}


	function create_tables(){
		var sfp8Table = document.getElementById('sfps8-table');
		var sfp16Table = document.getElementById('sfps16-table');
		var envTable = document.getElementById('measurements-table');
		
        var rows = sfp8Table.getElementsByTagName('tr');
        var rowsCount = rows.length;
		
		if(rowsCount > 0){
			for(var x=rowsCount - 1; x > 0; x--){
				sfp8Table.deleteRow(x);
			}
		}

        rows = sfp16Table.getElementsByTagName('tr');
        rowsCount = rows.length;
		
		if(rowsCount > 0){
			for(var x=rowsCount - 1; x > 0; x--){
				sfp16Table.deleteRow(x);
			}
		}
		
        rows = envTable.getElementsByTagName('tr');
        rowsCount = rows.length;
		
		if(rowsCount > 0){
			for(var x=rowsCount - 1; x > 0; x--){
				envTable.deleteRow(x);
			}
		}
		
		var deviceId = document.getElementById("device_colomn").value;
		
		getMeasurements(deviceId);
		buildSfpTable();
		buildEnvTable();
	}
	
    $( document ).ready( function (e) {
		setDevicesFilter();
		create_tables();
		setInterval( create_tables, 10000 );
    });
});
