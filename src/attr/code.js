$(document).ready(function(e) {
    getAttributes();
});

/**
 * Downloads the list of all attributes from the server
 */
function getAttributes(){
	setStatus( "Loading attributes", true );
	$("#infcommand").text("Loading list of attributes...");
	axshCall("help",function(out,err){
		setStatus();
		if(err){
			axellPopUp("Could not use the HELP command to get the list of attributes: "+err);
			return;
		}else{
			$("#infcommand").text("Help:");
			$("pre#description").text(out);
			//parse each line of help to get a list of attributes
			var lines=split2(out,"\n");
			for(var i=0;i<lines.length;i++){
				var e=lines[i].match(/(\S*)\s\s(...)\s*(.*)/);
				if(!e){
					console.error("Could not parse line: '"+lines[i]+"'");
					continue;
				}
				//create one list item for each attribute
				var listItem=$(document.createElement('li'));
				//put a link inside the list item with a javascript code to load the contents of inf when needed
				var a=$(document.createElement('a'));
				var attrUPCASE=e[1].toUpperCase();
				a.attr("href","javascript:loadinf('"+e[1]+"')").text(attrUPCASE).attr("title",e[3]);
				listItem.append(a);
				//add the operations
				if(e[2].indexOf("r")!=-1)listItem.append($(document.createElement("div")).addClass("icon attribute_r").attr("title","You can get this attribute using GET "+attrUPCASE));
				if(e[2].indexOf("w")!=-1)listItem.append($(document.createElement("div")).addClass("icon attribute_w").attr("title","You can set value of this attribute using SET "+attrUPCASE));
				if(e[2].indexOf("x")!=-1)listItem.append($(document.createElement("div")).addClass("icon attribute_x").attr("title","You can perform actions using this attribute using ACT "+attrUPCASE));
				$("ul#attrlist").append(listItem);
			}
		}
	});
}

/**
 * Loads the output of the help
 */
function loadHelp(){
	setStatus( "Loading attributes", true );
	axshCall("help",function(out,err){
		setStatus();
		if(err){
			axellPopUp("Could not get the output of the help command: "+err);
		}else{
			$("#infcommand").text("Help:");
			$("pre#description").text(out);
		}
	});
}

/**
 * Loads the relevant inf output from the server¨
 */
function loadinf(attr){
	axshCall("inf "+attr,function (out,err){
		if(err){
			console.error("INF command failed: "+err);
		}else{
			$("#infcommand").text("INF "+attr.toUpperCase());
			$("pre#description").text(out);
		}
	});
}