/**
 * This file is entirely responsible for creating the rack DOM. The most important function is makeRack()
 */

/** This utility function makes a new DOM tag with specified id and classes and returns it */
function newElement(tag,id,cls,text,tooltip){
	var ret=$(document.createElement(tag));
	if(id)ret.attr("id",id);
	if(cls)ret.addClass(cls);
	if(text)ret.text(text);
	if(tooltip)ret.attr("title",tooltip);
	return ret;
}
 
/**
 * This structure defines the rows and columns for the point of interface table
 */
var POI_TABLE={
	id:"poi",
	caption:"Point of Interface",
	help:"",
	icon:"pointofinterface",
	cls:"type2 splittercombiners",
	columnCount:4,
	rows:[
		{
			id:"icon",
			title:"",
			help:"",
			icon:"",
			cls:"",
			type:""
		},
		{
			id:"type",
			title:"Type",
			help:"",
			icon:"type",
			cls:"advanced",
			type:""
		},
		{
			id:"overallstatus",
			title:"Overall Status",
			help:"",
			icon:"status",
			type:"overall"
		},
		{
			id:"comm",
			title:"Comm",
			help:"",
			icon:"communication",
			cls:"advanced",
			type:"led"
		},
		{
			id:"firmware",
			title:"Firmware",
			help:"",
			icon:"firmware",
			cls:"advanced",
			type:"led"
		},
		{
			id:"power3",
			title:"Power 3",
			help:"",
			icon:"power3",
			cls:"advanced",
			type:"led"
		},
		{
			id:"uplink",
			title:"Uplink",
			help:"",
			icon:"uplink",
			cls:"separator",
			type:"separator"
		},
		{
			id:"ulatt",
			title:"UL Attenuation",
			help:"dBm",
			icon:"uplink",
			cls:"",
			type:"attenuation"
		},
		{
			id:"ulinputlevel",
			title:"UL Input Level",
			help:"",
			icon:"uplink",
			cls:"advanced",
			type:"dbm"
		},
		{
			id:"",
			title:"Downlink",
			help:"",
			icon:"downlink",
			cls:"separator",
			type:"separator"
		},
		{
			id:"dlatt",
			title:"DL Attenuation",
			help:"dBm",
			icon:"downlink",
			cls:"",
			type:"attenuation"
		},
		{
			id:"dlinputlevel",
			title:"DL Input Level",
			help:"",
			icon:"downlink",
			cls:"advanced",
			type:"dbm"
		},
		{
			id:"inputlevelstatus",
			title:"DL Input Status",
			help:"",
			icon:"downlink",
			cls:"advanced",
			type:"led"
		},
	]
}

/**
 * This structure defines the rows and columns for the fiber optic modules table
 */
FOM_TABLE={
	id:"fom",
	caption:"Fiber Optic Modules",
	help:"",
	icon:"laser",
	cls:"type2 optos",
	columnCount:8,
	rows:[
		{
			id:"pos",
			title:"Position",
			help:"",
			icon:"number",
			cls:"",
			type:"counter"
		},
		{
			id:"overallstatus",
			title:"Overall Status",
			help:"",
			icon:"status",
			cls:"",
			type:"overall"
		},
		{
			id:"comm",
			title:"Comm",
			help:"",
			icon:"communication",
			cls:"advanced",
			type:"led"
		},
		{
			id:"firmware",
			title:"Firmware",
			help:"",
			icon:"firmware",
			cls:"advanced",
			type:"led"
		},
		{
			id:"temperature",
			title:"Temperature",
			help:"",
			icon:"temperature",
			cls:"advanced",
			type:"led"
		},
		{
			id:"rxopto",
			title:"Rx Opto",
			help:"",
			icon:"rxopto",
			cls:"advanced",
			type:"led"
		},
		{
			id:"rxoptolevel",
			title:"Rx Opto ",
			help:"",
			icon:"rxopto",
			cls:"",
			type:"dbm"
		},
		{
			id:"txopto",
			title:"Tx Opto",
			help:"",
			icon:"txopto",
			cls:"advanced",
			type:"led"
		},
		{
			id:"pilotsynth",
			title:"Pilot Synth",
			help:"",
			icon:"pilotsynth",
			cls:"advanced",
			type:"led"
		},
		{
			id:"",
			title:"Nodes",
			help:"",
			icon:"nodes",
			cls:"separator",
			type:"separator"
		},
		{
			id:"nstatus",
			title:"Nodes Status",
			help:"",
			icon:"status",
			cls:"",
			type:"square"
		},
		{
			id:"ncomm",
			title:"Nodes Comm",
			help:"",
			icon:"communication",
			cls:"advanced",
			type:"square"
		},
		{
			id:"ncontrol",
			title:"Node Numbers",
			help:"",
			icon:"nodes",
			cls:"",
			type:""
		},
	]
}

/**
 * This array describes the icons that appear on top of the rack
 */
var RACK_ICONS=[
	{
		id:"rackcomm",
		title:"Rack Communication",
		icon:"rack_communication"
	},
	{
		id:"rackfirmware",
		title:"Rack Communication Board Firmware",
		icon:"rack_firmware"
	},
	{
		id:"racktemp",
		title:"Rack Temperature",
		icon:"rack_temp"
	},
	{
		id:"rackpower1",
		title:"Rack Power 1 (+28 V)",
		icon:"rack_power1"
	},
	{
		id:"rackpower2",
		title:"Rack Power 2 (+15 V)",
		icon:"rack_power2"
	},
	{
		id:"rackpower3",
		title:"Rack Power 3 (+6.45 V)",
		icon:"rack_power3"
	},
	{
		id:"rackpower4",
		title:"Rack Power 4 (+6.45 V)",
		icon:"rack_power4"
	},
	{
		id:"rackpsu1",
		title:"Rack Power Supply Unit 1",
		icon:"rack_psu1"
	},
	{
		id:"rackpsu2",
		title:"Rack Power Supply Unit 2",
		icon:"rack_psu2"
	},
	{
		id:"rackbattery",
		title:"Rack Battery",
		icon:"rack_battery"
	},
]

/**
 * This function makes the rack icons DOM from the RACK_ICONS structure
 */
function makeRackIcons(rackid){
	var ret=newElement("div",rackid+"_iconbar","headericons");
	for(var i=0;i<RACK_ICONS.length;i++){
		var r=RACK_ICONS[i];
		var container=newElement("div",rackid+"_"+r.id+"_container","advanced iconcontainer",null,r.title);
		var icon=newElement("div",rackid+"_"+r.id+"_icon","icon "+r.icon);
		var led=newElement("div",rackid+"_"+r.id+"_led","led grey");
		container.append(icon,led);
		ret.append(container);
	}
	ret.append(newElement("div",rackid+"_overallstatus","led round grey",null,"Rack Overall Status LED"));
	return ret;
}

/**
 * creates a table based on a structure which specifies a table.
 * @param structure table description data structure
 */
function makeTable(rackid,structure){
	var tableid=rackid+"_"+structure.id;
	var ret=newElement("table",tableid,structure.cls);
	if(structure.caption){
		//table caption
		var caption=newElement("caption",tableid+"_caption",null,structure.caption);
		//caption icon (optional)
		if(structure.icon)caption.prepend(newElement("div",null,"icon "+structure.icon));
		//caption help (optional)
		if(structure.help)caption.append(newElement("div",null,"icon help",null,structure.help));
		ret.append(caption);
	}
	//now create all rows
	for(var i=0;i<structure.rows.length;i++){
		var r=structure.rows[i];//just a shorthand for current row in the table description data structure
		var rowid=tableid+"_"+r.id;
		var row=newElement("tr",rowid,r.cls);
		var rowTitle=newElement("th",null,"column_"+j,r.title);
		if(r.icon)rowTitle.prepend(newElement("div",null,"icon "+r.icon));
		if(r.help)rowTitle.append(newElement("div",null,"icon help",null,r.help));
		row.append(rowTitle);
		for(var j=1;j<=structure.columnCount;j++){
			var newTD=newElement("td",rowid+"_"+j,"column_"+j);
			//handle different types of cells
			switch(r.type){
				case "separator":
					newTD.append("");
					break;
				case "led":
					var led=newElement("div",rowid+"_"+j+"_led","led grey");
					newTD.append(led);
					break;
				case "overall":
					var led=newElement("div",rowid+"_"+j+"_led","led round grey");
					newTD.append(led);
					break;
				case "square":
					var led=newElement("div",rowid+"_"+j+"_led","led square grey");
					newTD.append(led);
					break;
				case "dbm":
					var numberField=newElement("div",rowid+"_"+j+"_container","numerical");
					var numVal=newElement("span",rowid+"_"+j+"_val","value","-");
					var numUnit=newElement("span",rowid+"_"+j+"_unit","unit","dBm");
					numberField.append(numVal,numUnit);
					newTD.append(numberField);
					break;
				case "attenuation":
					var attenuation=newElement("select",rowid+"_"+j+"_att","attenuation");
					newTD.append(attenuation);
					break;
				case "counter":
					newTD.text(j);
					break;
				default:
					//do nothing. probably no elements are needed to be in it.
					newTD.text(r.type);
					break;
			}
			row.append(newTD);
		}
		ret.append(row);
	}
	return ret;
}

/**
 * This function is used for layout management. it removes the selected columns from a table.
 */
function removeColumns(tableid,columnArr){
	for(var i=0;i<columnArr.length;i++){
		$("table#"+tableid+" .column_"+columnArr[i]).remove();
	}
}

/**
 * makes a complete rack DOM and returns it.
 * the result can be appended to the web page
 */
function makeRack(n){
	var rackid="rack_"+n;
	var rack=newElement("div",rackid,"panel collapsible");
	var header=newElement("div",rackid+"_header","header","Rack "+n);
	header.append(makeRackIcons(rackid));
	var contents=newElement("div",rackid+"_contents","contents");
	contents.append(makeTable(rackid,POI_TABLE));
	contents.append(makeTable(rackid,FOM_TABLE));
	rack.append(header,contents);	
	return rack;
}