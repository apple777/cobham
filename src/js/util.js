/**
 * This file is a common library that is used by all the pages.
 * It is important that the libs.js is "included" before this file in every html file.
 * Functions in this file are groups based on their functionality. Between each group there is a separator line
 * like the one below this comment block.
 * If a group of functions have some options to customize them, the options are enclosed in "//{{OPTIONS" and
 * "}}OPTIONS" in the beginning of that group right after the separator line.
 */
define([  '/js/api.js','/js/lib/jquery.js', '/js/lib/underscore.js', '/js/lib/jquery_cookie.js'],
function ( api, $, _ ) {

    //----------------------------------------------------------------------------------------------------------
    //** Evaluates an expression and converts the boolean result to a string true = "1", false = "0"
    window.bool2str = bool2str;
    function bool2str ( expression ) {
        return expression ? "1" : "0";
    }
    //** converts a string to boolean. "1" = true, "0" = false, anything else: assertion error
    window.str2bool = str2bool;
    function str2bool ( zeroOne ) {
        switch ( zeroOne ) {
        case "1":
            return true;
        case "0":
            return false;
        default:
            console.debug( "str2bool() didn't receive '0' or '1' as its parameter: " + quote( zeroOne ) );
            return null;
        }
    }
    //** Represents a boolean value that is stored in sessionStorage
    window.SSbool = SSbool;
    function SSbool ( key, initVal ) {
        this.key = key;
        if ( typeof initVal === "undefined" ) {
            //if initVal is missing, assume false by default
            this.set( false );
        } else {
            //normalize initVal to a boolean value
            this.set( initVal );
        }
    }
    SSbool.prototype.set = function ( val ) {
        sessionStorage[ this.key ] = bool2str( val );
        return sessionStorage[ this.key ]
    };
    SSbool.prototype.get = function () {
        return str2bool(sessionStorage[ this.key ]);
    };
    SSbool.prototype.toggle = function () {
        return this.set(!this.get());
    };
    //----------------------------------------------------------------------------------------------------------
    /**
     * This is a small JQuery extension to let us check if a query has returned any element or not.
     * use it like $(".led.red").exists()
     * @returns {boolean} true if the result set has at least one element. false otherwise.
     */
    $.fn.exists = function () {
        return this.length > 0;
    };
    //----------------------------------------------------------------------------------------------------------
    //** It parses the search string: everything between ? to # in the current page's URL and returns it as an object
    window.getUrlParams = getUrlParams;
    function getUrlParams () {
        //to optimize the algorithm we calculate it only once
        if ( typeof window.urlParams === "undefined" ) {
            window.urlParams = {};
            var sch = window.location.search;
            if ( sch ) {
                //remove the "?" from the beginning of the string
                if ( sch.match( /^\?/ ) ) {
                    sch = sch.substring( 1 );
                }
                if ( sch ) {
                    //key values
                    var kvs = sch.split("&");
                    if ( kvs.length > 0 ) {
                        for ( var i = 0; i < kvs.length; i++ ) {
                            var kv = kvs[i];
                            var firstEqualPos = kv.indexOf( "=" );
                            if ( firstEqualPos !== -1 ) {
                                var k = kv.substring( 0 , firstEqualPos );
                                if ( k ) {
                                    var v = kv.substring( firstEqualPos + 1 );
                                    if ( window.urlParams[k] ) {
                                        console.debug( "The key is repeated: " + k );
                                    }
                                    window.urlParams[ decodeURI( k ) ] = decodeURI( v );
                                } else {
                                    console.debug( "The key in this key value pair is not valid: " + quote( kv ) );
                                }
                            } else {
                                console.debug( "Could not parse this key value pair: " + quote( kv ) );
                            }
                        }
                    }
                }
            }
        }
        return window.urlParams;
    }
    //----------------------------------------------------------------------------------------------------------
    window.objToUrlParams = objToUrlParams;
    //** converts an object with key/value (in string format) to a string that can be used as a URL search parameter
    function objToUrlParams ( obj ) {
        var ret = "?";
        for ( var k in obj ) {
            if ( obj.hasOwnProperty( k ) ) {
                var v = obj[ k ];
                if ( typeof k !== "string" || typeof v !== "string" ) {
                    console.debug( "The key or value are not string: type of key: " + typeof ( k ) + ", type of value: " + typeof ( v ) );
                } else {
                    ret +=  encodeURIComponent( k ) + "=" + encodeURIComponent( v ) + "&";
                }
            }
        }
        if ( ret.length > 1 ) {
            //remove the last "&" sign
            ret = ret.substring( 0 , ret.length - 1 );
            return ret;
        } else {
            //if it is only a question mark, then there are no parameters, so the question mark is not needed
            return "";
        }
    }
    //----------------------------------------------------------------------------------------------------------
    /**
     * Returns aninteger number between 0 (inclusive) to max (exclusive).
     * For example rnd(5) can be 0, 1, 2, 3 or 4
     */
    window.rnd = rnd;
    function rnd ( max ) {
        return Math.floor ( Math.random() * max );
    }
    /**
     * Returns a random number in the range between min (inclusive) and max (exclusive)
     */
    window.rndInRange = rndInRange;
    function rndInRange ( min, max ) {
        return min + ( Math.random() * ( max - min ) );
    }
    /**
     * Rounds a number to have exactly the specified number of decimal digits
     * example:
     *    roundToDigits(12345.12345,1)=12345.1
     *    roundToDigits(12345.12345,2)=12345.12
     *    roundToDigits(12345.12345,3)=12345.123
     *    roundToDigits(12345.12345,4)=12345.124
     * @note it is possible to use toFixed() function from standard Javascript library instead.
     * @param num {number} the number
     * @param dec {number} the number of decimal digits. it should be a positive number bigger than 0.
     */
    window.roundToDigits = roundToDigits;
    function roundToDigits ( num, dec ) {
        var tens = Math.pow( 10, dec );
        return Math.round( num * tens ) / tens;
    }
    /**
     * This is an independent utility function. Its job is to put a number within a limit and return it.
     * The return value is guaranteed to be between minVal and maxVal even if x is out of this range
     * @param x the number (can be any value)
     * @param minVal minimum possible value for the number
     * @param maxVal maximum possible value for the number
     * @return if x is in the range, the function returns x. If x is outside the range, the function returns maxVal or minVal depending on the value of x
     */
    window.putInLimits = putInLimits;
    function putInLimits(x,minVal,maxVal){
        if(x<minVal){
            return minVal;
        }else if(x>maxVal){
            return maxVal;
        }else{
            return x;
        }
    }
    //----------------------------------------------------------------------------------------------------------
    /**
     * converts an axell date and time to the standard date and time format
     */
    window.axellTime = axellTime;
    function axellTime(str){
        var d=str.match(/(\d\d)(\d\d)(\d\d)/);
        if ( d ) {
            return d[1]+":"+d[2]+":"+d[3];
        } else {
            //in case of error return the string itself!
            return d;
        }
    }
    /**
     * converts an axell date and time to the standard date and time format
     */
    window.axellDate = axellDate;
    function axellDate(str){
        var d=str.match(/(\d\d)(\d\d)(\d\d)/);
        if ( d ) {
            return d[1]+"/"+d[2]+"/"+d[3];
        } else {
            //in case of error return the string itself!
            return d;
        }
    }
    /**
     * converts an axell date and time to the standard date and time format
     */
    window.axellTimeDate = axellTimeDate;
    function axellTimeDate(str){
        var d=str.split(" ");
        return axellTime(d[0])+" "+axellDate(d[1]);
    }
    //** Converts epoch to human readable date and time
    window.epochToLocal = epochToLocal;
    function epochToLocal ( secAfterEpoch ) {
        var d = new Date( 0 );
        d.setTime( secAfterEpoch * 1000 );
        return d.toString();
    }
    //----------------------------------------------------------------------------------------------------------
    //** Converts a floating point number of seconds to milli seconds. Example: 1 -> 1000  2.5 -> 2500
    window.sec = sec;
    function sec( s ) {
        return Math.round( s * 1000 );
    }
    //** Converts a floating point number of minutes to milli seconds. Example: 1 -> 60000  2.5 -> 2.5 * 60 * 1000 = 150000
    window.min = min;
    function min( m ) {
        return sec( 60 * m );
    }
    //----------------------------------------------------------------------------------------------------------
    /**
     * this small utility function is used when processing the result of IHU.
     * It removes the elements that the selector is specifying if the presence is "0"
     * @param ihu {string} the string that represents the installed hardware units
     * @param index {number} the index of the desired character in ihu
     * @param $selector the jquery selector for all the UI elements related to that device that should be hidden if device doesn't exist
     * @param name the human readable name of the device. It is used for generating log message (optional: if name is omitted, no log will be printed)
     NOTE: devicePresent can be used to specify the presence of external alarm and door attribute as well
     */
    window.devicePresent = devicePresent;
    function devicePresent ( ihu, index, $selector, name ) {
        if ( index >= ihu.length ) {
            axellPopUp( "There is no character in IHU for " + name + ". See browser logs for more info" );
            console.debug( "The length of IHU is shorter than the expected index: " + quote( ihu ) + ", index=" + index );
            return;
        }
        var presence = ihu.charAt( index );
        switch ( presence ) {
        case "1":
            if ( name ) {
                console.log( "IHU device is present: " + name );
            } else {
                console.log( "IHU device corresponding to index " + index + " (zero based index) is present" );
            }
            //do nothing
            break;
        case "0":
            if ( name ) {
                console.log( "IHU device is not present: " + name );
            } else {
                console.log( "IHU device corresponding to index " + index + " (zero based index) is not present" );
            }
            //hide corresponding elements
            $( $selector ).remove();
            break;
        default:
            console.debug( "An erroneous character appeared in the output of IHU: " + quote( ihu ) + ", position: " + index + " (" + presence + ")." );
            break;
        }
    }
    //----------------------------------------------------------------------------------------------------------
    /**
     * Creates a new icon
     */
    window.makeIcon = makeIcon;
    function makeIcon( id, iconName, tooltip ) {
        var ret = $( document.createElement( "div" ) );
        ret.addClass( "icon" );
        if( id ) {
            ret.attr( "id", id );
        }
        if( iconName ) {
            ret.addClass( iconName );
        }
        if( tooltip ) {
            ret.attr( "title", tooltip );
        }
        return ret;
    }
    //----------------------------------------------------------------------------------------------------------
    /**
     * Sets enable/disable status of our custom-made buttons (which work with <a> tab)
     */
    window.setButtonEnDis = setButtonEnDis;
    function setButtonEnDis ( query, isEnabled ) {
        if ( isEnabled ) {
            $( query ).removeClass( "disabled" );
        } else {
            $( query ).addClass( "disabled" );
        }
    }
    /**
     * This one is a sister function for setButtonEnDis() and is used to get the enabled property of it.
     * It returns the enabled status of the button. If the button has "enabled" class it returns true
     * @return boolean true means it is enabled and false means it is disabled
     */
    window.getButtonEnDis = getButtonEnDis;
    function getButtonEnDis ( selector ) {
        return !$( selector ).hasClass( "disabled" );
    }
    /**
     * Creates a button
     * @param id button id
     * @param extraClasses extra classes (besides "button") to be assigned to the button
     * @param iconName the icon id. It automatically creates the icon using makeIcon function
     * @param text the text to put in the button
     * @param onclickStr the string to assign to its onclick attribute
     * @param tooltip the tooltip that appears when the user hover over the button
     */
    window.makeButton = makeButton;
    function makeButton( id, extraClasses, iconName, text, onclickStr, tooltip ) {
        var ret = $( document.createElement( "a" ) );
        ret.attr( "href", "javascript:void(0)" );
        ret.addClass( "button" );
        if ( extraClasses ) {
            ret.addClass( extraClasses );
        }
        ret.addClass( extraClasses );
        if ( id ) {
            ret.attr( "id", id );
        }
        if ( tooltip ) {
            ret.attr( "title", tooltip );
        }
        if ( onclickStr ) {
            ret.attr( "onclick", onclickStr );
        }
        ret.append( makeIcon( id + "-button", iconName, null), text );
        return ret;
    }
    //----------------------------------------------------------------------------------------------------------
    /**
     * This function is very similar to JavaScript's standard split function with one difference: it doesn't return any empty element.
     * For example if we split "hi bye", the result will be ["hi","bye] just like standard JavaScript's split function but if we
     * split "hi  bye", this function returns ["hi","bye"] but JavaScript's split function returns ["hi","","bye"]
     * @param str the string to split
     * @param token (optional) the pattern to be passed to underlying call to JavaScript's split function. Default is " " (one space character)
     */
    window.split2 = split2;
    function split2(str,token){
        if ( typeof(str) != "string" ) {
            console.error("The str parameter to split2() is not of string type (" + typeof ( str ) + "):" + str);
            return null;
        }
        if( typeof ( token ) == "undefined" ) {
            token = " ";
        }
        var ret=str.split(token);
        for ( var i = ret.length - 1; i >= 0; i-- ) {
            if ( ( ret[i] === "" ) || ( ret[i] == null ) ) {
                ret.splice( i, 1 );
            }
        }
        return ret;
    }
    /**
     * Splits a string from single quotation marks and puts the result in a 0-based array and returns it
     * Example:
     *   var str = "'alice'   'anna marie' 'benjamin' 'christin'     'david' 'muhammad ali'"
     * Result:
     * [
     *   'alice',
     *   'anna marie',
     *   'benjamin',
     *   'christin',
     *   'david',
     *   'muhammad ali'
     * ]
     */
    window.splitSQ = splitSQ;
    function splitSQ( str ) {
        var ret = str.match( /'[^']*'/g );
        if ( ret ) {
            for ( var i = 0, len = ret.length; i < len; i++ ) {
                ret[i] = ret[i].replace( /'/g, '' );
            }
            return ret;
        } else {
            return null;
        }
    }
    /**
     * Same as splitSQ() but for double quotation "" (instead of single quotation '')
     */
    window.splitDQ = splitDQ;
    function splitDQ( str ) {
        var ret = str.match( /"[^"]*"/g );
        if ( ret ) {
            for ( var i = 0, len = ret.length; i < len; i++ ) {
                ret[i] = ret[i].replace( /"/g, '' );
            }
            return ret;
        } else {
            return null;
        }
    }
    /**
     * This function is used for showing a string in quotes. If the string is null, there will be no quote, only NULL
     */
    window.quote = quote;
    function quote ( str ) {
        if ( str === null ) {
            return "NULL";
        } else {
            return "\"" + str + "\"";
        }
    }

    //** represents a printable representation of the value
    window.print = print;
    function print ( value ) {
        switch( typeof value ) {
            case 'number':
            case 'boolean':
                return value.toString();
            case 'string':
                return '"' + value + '"';
            case 'function':
                return 'function ()';
            case 'object':
                if ( value === null ) {
                    return 'null';
                } else {
                    return JSON.stringify( value );
                }
            default:
                return JSON.stringify( value );
        }
    }
    //----------------------------------------------------------------------------------------------------------
    /**
     * Sets the value of the attenuation from the list of items currently in it.
     * it disables the <select> element if value is null or empty string or "-".
     * Otherwise it enables the element and sets the value.
     * @param query the jquery string to be used to find the target <select> element
     * @param value the value to assign to the selected item of this <select> element
     */
    window.setAttSelect = setAttSelect;
    function setAttSelect ( query, value ) {
        if ( ( value === null ) || ( value === "" ) || ( value === "-" ) ) {
            $( query ).prop( "disabled", true );
        } else {
            $( query ).prop( "disabled", false ).val( value );
        }
    }
    //----------------------------------------------------------------------------------------------------------
    /**
     * It is a utility function that takes a JQuery selector and updates it with the commands response.
     * @param $query a valid jquery string. It will be passed to $() function.
     * @param cmd the command string to execute. It will be passed to axshCall() function.
     * @param [what] indicates what should be set in the target elements. It can be "text", "val" (default), "title"
     */
    window.getCmd = getCmd;
    function getCmd($query,cmd,what){
        what=what||"val";
        axshCall(cmd,function(response){
            switch(what){
            case "text":
                $($query).text(response);
                break;
            case "val":
                $($query).val(response);
                break;
            case "title":
                $($query).attr("title",response);
                break;
            default:
                console.error("Could not understand the 'what' parameter");
            }
        });
    }
    //----------------------------------------------------------------------------------------------------------
    /**
     * This is called when the user goes to the advanced mode
     */
    window.advancedMode = advancedMode;
    function advancedMode(){
        $(".advanced").show();
    }

    /**
     * This is called when the user goes to the basic mode
     */
    window.basicMode = basicMode;
    function basicMode(){
        $(".advanced").hide();
    }
    //----------------------------------------------------------------------------------------------------------
    /**
     * This group of functions is used for creating the rack DOM.
     */

    /**
     * This utility function makes a new DOM tag with specified id and classes and returns it
     * @param tag the tag of the element to be created. Example: "tr", "div",...
     * @param id (optional) the id of the element to be created. Example: "basic-mode"
     * @param cls (optional) the class of the element to be created. Example: "icon basic"
     * @param contents (optional) the html contents of the element to be created. Example: "...", "<span id='unit'>dBm</span>"
     * @param tooltip (optional) the title or tooltip for this element that will be shown on mouse hover. Example: "Amplifier Power"
     */
    window.newElement = newElement;
    function newElement(tag,id,cls,contents,tooltip){
        var ret=$(document.createElement(tag));
        if(id)ret.attr("id",id);
        if(cls)ret.addClass(cls);
        if(contents)ret.html(contents);
        if(tooltip)ret.attr("title",tooltip);
        return ret;
    }

    /**
     * This function is called by makeTable()
     * Makes the contents of a cell and returns it. If there is a new type of cell, define it in this function.
     * rowStruct and colStruct are relevant objects from table struct that is passed to makeTable()
     */
    window.makeCellContents = makeCellContents;
    function makeCellContents(rowStruct,colStruct){
        var cellid=rowStruct.id+"-"+colStruct.id;
        switch(rowStruct.ty){
            case "led":
                return newElement("div",cellid+"-led","led grey");
            case "roundled":
                return newElement("div",cellid+"-led","led round grey");
            case "num1":
                var numberField=newElement("div",cellid+"-container","numerical");
                var numVal =newElement("span",cellid+"-val","value","...");
                var numUnit=newElement("span",cellid+"-unit","unit",rowStruct.un);
                numberField.append(numVal,numUnit);
                return numberField;
            case "num2":
                //just like "num1" but without the green background that is created using a div.numerical
                numberField=newElement("div",cellid+"-container");
                numVal =newElement("span",cellid+"-val","value","...");
                numUnit=newElement("span",cellid+"-unit","unit",rowStruct.un);
                numberField.append(numVal,numUnit);
                return numberField;
            case "ledround":
                return newElement("div",cellid+"-led","led round grey");
            case "power":
                return newElement("div",cellid+"-btn","powerbutton");
            case "button":
                return newElement("a",cellid+"-btn","button");
            case "attenuation":
                return newElement("select",cellid+"-att","attenuation");
            case "counter":
                return colStruct.id;
            case "elipsis":
                return "...";
            case "html":
                return rowStruct.ht;
            case "text":
            default:
                return null;
        }
    }

    /**
     * Creates the body of a table based on what is in the structure and "append"s to its end
     * structure object has two elements: rows and cols
     *    rows is an array of objects each of which has these elements:
     *       id id for the <TR>
     *       cl (optional) class for <TR> (multiple classes can be separated by space)
     *       hd (optional) a string of html code that will be put as the header content
     *       ht (optional) header tooltip
     *       ty (optional) a type that will be passed to makeCellContents() to fill inside the <TD> element. If nothing is provided a text element will be created
     *          un (depends) if ty is numerical, the "un" parameter specifies the unit. it can be abandoned which is just like an empty string.
     *          ht (depends) if ty is "html", the "ht" parameter specifies the html code to insert in this node.
     *   cols is also an array of objects each of which has these elements:
     *       id id for the <TD>
     * @param structure table description data structure
     * @param table$ table selector for JQuery
     */
    window.makeTable = makeTable;
    function makeTable(table$,structure){
        //now create all rows
        for(var i=0;i<structure.rows.length;i++){
            var row=newElement("tr",structure.rows[i].id,structure.rows[i].cl);
            //header
            row.append(newElement("th",null,null,structure.rows[i].hd,structure.rows[i].ht));
            //cells
            for(var j=0;j<structure.cols.length;j++){
                var cellid=structure.rows[i].id+"-"+structure.cols[j].id;
                row.append(newElement("td",cellid,structure.cols[j].id,makeCellContents(structure.rows[i],structure.cols[j])));
            }
            table$.append(row);
        }
    }
    //----------------------------------------------------------------------------------------------------------
    /**
     * Sets a power button (<div class="powerbutton"></div>) to a desired state
     * @param query the jquery result that is pointing to one or more power buttons
     * @param state (optional) which state to set to? Can be "on"="1"=true, "off"="0"=false or anything else=null for no state
     * @param neg (optional) if neg is set, the interpretation of "state" parameter will be negative. ie. "1" turns the button off instead of on!
     */
    window.setPwrBtn = setPwrBtn;
    function setPwrBtn(query,state,neg){
        var flag=state;
        if(typeof(state)=="string"){
            switch(state.toLowerCase()){
            case "true":
            case "on":
            case "1":
                flag=true;
                break;
            case "false":
            case "off":
            case "0":
                flag=false;
                break;
            default:
                flag=null;
                break;
            }
        }
        if( neg && flag != null ) {
            flag = !flag;
        }
        switch(flag){
        case true:
            $(query).removeClass("off").addClass("on");
            break;
        case false:
            $(query).removeClass("on").addClass("off");
            break;
        case null:
        default:
            $(query).removeClass("on off");
            break;
        }
    }

    /**
     * returns the value of a power button. If the button has both on and off classes (it's an error but anyway), it returns on
     * @return true if it is on, false if it is off, null if it is not set yet
     */
    window.getPwrBtn = getPwrBtn;
    function getPwrBtn ( query ){
        var $target=$(query);
        if($target.hasClass("on")){
            return true;
        }else if($target.hasClass("off")){
            return false;
        }else{
            return null;
        }
    }
    //----------------------------------------------------------------------------------------------------------
    /**
     * Shows a status message on the small status bar that is located below the index.html. This function can be called
     * both from inside index.html and the files loaded in the <iframe>
     * if msg is empty, it shows the default copyright message with Axell Logo
     * @param msg (optional, default is empty and will show the copyright message from options above) the message to display. The text can also include HTML markup.
     * @param busy (default: false) if busy is true, the logo will show an animation. if busy evaluates to false (0, "", undefined), the animation will stop
     */
    window.setStatus = setStatus;
    function setStatus ( msg, busy ) {
        switch ( typeof msg ) {
        case "undefined":
            msg = "";
            break;
        case "string":
            //if the message string is not empty
            if ( msg ) {
                msg = " | " + msg; //the separator line between page title and the message
            } else {
                msg = "";
            }
            break;
        default:
            if ( msg.toString ) {
                setStatus( msg.toString(), busy );
            } else {
                msg = "";
                console.warn( "The message passed to setStatus() wasn't of string type (" + typeof msg + "). Assuming empty message." );
            }
        }
        if ( typeof busy == "undefined" ) {
            busy = false;
        } else {
            busy = !!busy;
        }
        if ( window.parent.$ ) {
            window.parent.$( "#statusbar-text" ).html( msg ).attr( "title", msg );
            window.parent.$( "#toplogo" ).attr( "src", busy? "/images/logo-animated.gif" : "/images/logo.gif" );
        } else {
            //if the message can't be shown in the title bar
            console.log( "setStatus( \"" + msg + "\", " + busy + " )" );
        }
    }
    /** sets the title of the page that is shown in the header of main index.html
     * @Deprecated. Use titleManager instead
     */
    window.setTitle = setTitle;
    function setTitle( title ){
        title.setTitle( title );
    }
    //----------------------------------------------------------------------------------------------------------
    /**
     * Goes to the specified page.
     * It uses a trick with localStorage mechanism that is used in the index.html file in order to
     * remember the last chosen page.
     */
    window.gotoPage = gotoPage;
    function gotoPage( url ) {
        console.log( "Going to url: " + url );
        if ( window.parent.$ && window.parent.$( "#contents" ).length ) {
            window.parent.$( "#contents" ).attr( "src", url );
        } else {
            console.warn( "Could not load the url in parent contents <iframe>. Opening it in the main browser window: ");
            window.location = url;
        }
    }
    /***
     * This function checks for " and whitespace in an snmp password.
     */
    window.isvalidSNMPText = isvalidSNMPText;
    function isvalidSNMPText(id)
    {
        if($(id).val().indexOf("\"") == -1 && $(id).val().indexOf(" ") == -1)
        {
            //regex passed
            return true;
        }
        return false;
    }
    /***
     * This function is used to validate a community snmp input has a delay and removes invalid char's as they are typed
     */
    window.isSNMPCommunityCharValid = isSNMPCommunityCharValid;
    function isSNMPCommunityCharValid(id)
    {
        setTimeout(function() {
            if(!isvalidSNMPText(id))
            {
                axellPopUp("Invalid Input Character");
                $(id).val(
                    function(index,value){
                        return value.substr(0,value.length-1);
                    })
            }
        }, 1);

    }
    /***
     * This function is used to show technician more options.
     */
    window.techPermissions = techPermissions;
    function techPermissions()
    {

        var map = {17: false, 16: false, 84: false};
        $(document).keydown(function(e) {
            if (e.keyCode in map) {
                map[e.keyCode] = true;
                if (map[17] && map[16] && map[84]) {

                    $(".toggle-keydown").show();

                }
            }
        }).keyup(function(e) {
            if (e.keyCode in map) {
                map[e.keyCode] = false;
            }
        });


    }
    /**
     * Validate IP
     */
    window.VAL_ip_addr = VAL_ip_addr;
    function VAL_ip_addr(ipAddr){
        var pattern = /^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})$/;
        //axellPopUp(pattern.test(ipAddr);
        return pattern.test(ipAddr);
    }
    //----------------------------------------------------------------------------------------------------------
    /**
     * Sets the badge to a number
     * @param id the id of the badge as appears in the index.html
     * @param val the value to set the badge to. It can be an empty string to hide badge (which is the default behavior if val is omitted)
     */
    window.setBadge = setBadge;
    function setBadge( id, val ) {
        var $badge = window.parent.$( ".badge#" + id );
        if ( typeof val == "undefined" ) {
            val = "";
        }
        $badge.text( val );
    }
    //----------------------------------------------------------------------------------------------------------
    /**
     * Gets a byte and expands it into a string. It is usually used for hex-coded entities for RSP for example the CRC part of it.
     * example: binCh2st("0") = "0000" binCh2st("5") = "0101"
     * @param ch one character string that can be from 0 to 8
     * @return a string of 4 bytes if successful and null if there was an error
     */
    window.binCh2st = (function () {
        var hexNibblesToStr = {
            "-":"----",
            "0":"0000",
            "1":"0001",
            "2":"0010",
            "3":"0011",
            "4":"0100",
            "5":"0101",
            "6":"0110",
            "7":"0111",
            "8":"1000",
            "9":"1001",
            "A":"1010",
            "B":"1011",
            "C":"1100",
            "D":"1101",
            "E":"1110",
            "F":"1111",
            "a":"1010",
            "b":"1011",
            "c":"1100",
            "d":"1101",
            "e":"1110",
            "f":"1111"
        };

        function binCh2st ( ch ) {
            if ( ch.length !== 1 ) {
                console.error( 'String length should be exactly 1 character but it is not: ' + quote( ch ) );
                return null;
            }

            var ret = hexNibblesToStr[ ch ];

            if(!ret){
                console.error("Couldn't find a hex value for: "+ch);
                return null;
            }

            return ret;
        }

        return binCh2st;
    })();
    /**
     * This is a string version of binCh2St() that converts a string of characters to their corresponding expanded format.
     * example: binCh2st("0") = "0000" binCh2st("50") = "01010000"
     * @return a string of 4, 8, 16... bytes if successful and null if there was an error
     */
    window.binSt2st = binSt2st;
    function binSt2st(st){
        var ret="";
        for(var i=0;i<st.length;i++){
            var chSt=binCh2st(st.charAt(i));
            if(!chSt){
                console.error("Could not convert one of the characters in this string to its hexadecimal presentation: "+st);
                return null;
            }
            ret+=chSt;
        }
        return ret;
    }
    //----------------------------------------------------------------------------------------------------------
    /**
     * A simple utility function that is used in various pages to translate the "1", "0", and "-" to LED
     * classes that are used in css (respectively "red", "green", "grey").
     * Note that it is not needed for using setLedColor() function anymore because that function will automatically take care of it.
     * @param statusChar can be "1", "0" or "-". Any other value will result to an error log.
     * @param negative (optional) if set to true, "1" will be mapped to "green" and "0" to "red" (default: false)
     */
    window.status2led = status2led;
    function status2led(statusChar,negative){
        switch(statusChar){
            case "1":return negative?"green":"red";
            case "0":return negative?"red":"green";
            case "-":return "grey";
            default:
                console.error("Invalid character was passed to status2led() function: '"+statusChar+"'");
                return "grey";
        }
    }

    /**
     * Gets the color of a LED.
     * @param queryStr a query string to find the LED exactly as it's passed to JQuery()
     * @param [format] {string} can be either one of these strings:
     *                    "number": red="1", green="0", grey="-"
     *                    "boolean": red=false, green=true, grey=null (default)
     *                    "string": red="red", green="green", grey="grey"
     */
    window.getLedColor = getLedColor;
    function getLedColor ( queryStr, format ) {
        if ( typeof format === "undefined" ) {
            format = "boolean";
        }
        var $query = $( queryStr );
        if ( !$query.exists() ) {
            console.warn( "Query string returned no resulting led: " + quote( queryStr ) );
            return;
        }
        if ( $query.hasClass( "red" ) ) {
            switch ( format ) {
                case "number": return "1";
                case "boolean": return false;
                case "string": return "red";
            }
        } else if ( $query.hasClass( "green" ) ) {
            switch ( format ) {
                case "number": return "0";
                case "boolean": return true;
                case "string": return "green";
            }
        } else if ( $query.hasClass( "grey" ) ) {
            switch ( format ) {
                case "number": return "-";
                case "boolean": return null;
                case "string": return "grey";
            }
        } else {
            console.error( "Could not get a meaningful class for the query passed to getLedColor(). Query string: " + quote( queryStr ) );
        }
    }

    /**
     * Sets the color of a LED
     * @param $queryStr a query string to find the LED exactly as it's passed to JQuery()
     * @param color can be "1", "red" (not case sensitive) to make the LED red
     *              can be "0", "green" (not case sensitive) to make the LED green
     *              can be "-", "grey" (not case sensitive) to make the LED grey
     *              can be null or any other character to remove all the color classes from the led
     * @param index (optional) if present, the value of color will be color.charAt(index) instead of the whole string of color
     */
    window.setLedColor = setLedColor;
    function setLedColor ( $queryStr, color, index ) {
        if ( index != null ) {
            color = color.charAt( index );
        } else {
            color = $.trim( color ).toLowerCase();
        }
        switch( color ) {
        case "green":
        case "ok":
        case "0":
        case "false":
        case false:
        case 0:
            $( $queryStr ).removeClass( "grey red orange yellow" ).addClass( "green" );
            break;
        case "red":
        case "error":
        case "1":
        case "true":
        case true:
        case 1:
            $( $queryStr ).removeClass( "grey green orange yellow" ).addClass( "red" );
            break;
        case "orange":
        case "2":
        case 2:
            $( $queryStr ).removeClass( "grey green red yellow" ).addClass( "orange" );
            break;
        case "yellow":
        case "3":
        case 3:
            $( $queryStr ).removeClass( "grey green orange red" ).addClass( "yellow" );
            break;
        case "grey":
        case "-":
        case "null":
        case null:
        case Number.NaN:
            $( $queryStr ).removeClass( "red green" ).addClass( "grey" );
            break;
        case "":
        case "undefined":
        case undefined:
        case 4:
            return
        default:
            $( $queryStr ).removeClass( "red green grey orange yellow" );
            console.warn("Invalid color value passed to setLedColor: " + quote( color ) );
            break;
        }
    }

    /***
     * This function takes care of blinking red LEDs.
     * Just run it once and it will set up a timer to take care of its business.
     * It has a self-protection mechanism that doesn't allow two instances of it run in parallel.
     */
    window.toggleBlinkingLeds = toggleBlinkingLeds;
    function toggleBlinkingLeds () {
        //is this algorithm running already?
        if ( toggleBlinkingLeds.running ) {
            return;
        }
        //**Number of milliseconds for blinking red LED's
        var BLINK_DELAY=300;
        //use the running flag to make sure this function is only run once
        toggleBlinkingLeds.running = true;
        var blinkingLeds = null;
        function onBlink () {
            if ( !blinkingLeds ) {
                //find all the blinkingLeds
                blinkingLeds = $( ".led.blinking" );
                //turn them off
                blinkingLeds.removeClass("green").addClass( "grey" );
            } else {
                //turn the previous leds on again by removing the "off" class
                blinkingLeds.removeClass("grey").addClass( "green" );
                //use the variable as a flag for the next round of execution
                blinkingLeds = null;
            }
            setTimeout( onBlink, BLINK_DELAY );
        }
        //start counting
        setTimeout( onBlink, BLINK_DELAY );
    }

    /**
     * This is a simple utility function that sets the status of one overall LED based on the status of a set of other
     * LEDs. if one of the other LED's is red, the overall status led will also be red. Otherwise it's green (even if all
     * the other LED's are grey)
     * @param status$ the jQuery string to indicate the overall status LED
     * @param led$array (...) an array of JQuery strings that indicates LED's. There can be multiple led$arrays separated by comma
     * @example setOveralLed("rack1_header_led",""
     */
    window.setOveralLed = setOveralLed;
    function setOveralLed(status$,led$array){
        var flag=true;
        for(var  i = 1 ; i < arguments.length ; i++ ) {
            if ( getLedColor( arguments[i], "boolean" ) == false ) {
                flag = false;
                break;
            }
        }
        setLedColor( status$ );
    }

    //repeatedly check and update Overall LEDs and expand erroneous rows
    window.updateOverallLed = updateOverallLed;
    function updateOverallLed() {
        function updateOR () {
            $( '.panel' ).each( function () {
                var $panel = $( this );
                var $overalLed = $panel.find( '.overall-led' );
                var $contents = $panel.children( '.contents' );
                //if this panel has an overall led at the top of it
                if ( $overalLed.length > 0 && $contents.length > 0 ) {
                    if ( $contents.find( '.led.red').length > 0 ) {
                        //if there's at least one red led in the contents
                        $overalLed.led( 'option', 'color', 'red' );
                    } else if ( $contents.find( '.led.green' ).length > 0 ) {
                        //if there is at least one green led in the contents
                        $overalLed.led( 'option', 'color', 'green' );
                    } else {
                        //otherwise leave the led grey
                        $overalLed.led( 'option', 'color', 'grey' );
                    }
                }
            });
            $( 'tr' ).each( function () {
                var $tr = $( this );
                //look for any red led in it
                if ( $tr.find( '.led.red' ).length > 0 ) {
                    $tr.show();
                }
            });
            if($('#node-summary-status') != undefined) {
                if(sessionStorage.getItem( 'header-get-mdl' ) != "DOBR-M"){
                    //set overall status for each module
                    if ($(".overall-led.led.red").length > 0) {
                        setLedColor("#node-summary-status", "red");
                    } else if ($(".overall-led.led.red").length === 0 && $(".overall-led.led.grey").length > 0) {
                        setLedColor("#node-summary-status", "grey");
                    } else {
                        setLedColor("#node-summary-status", "green");
                    }
                }
            }
            //noinspection JSUnresolvedFunction
            setTimeout( updateOR, 2000 );
        }
        updateOR ();
    };

    /**
     * Creates a new led
     * @constructor
     * @param id {string} the id of the element in HTML
     */
    window.Led = Led;
    function Led ( id ) {
        //the id that is referring to the element
        this._id = id;
        //there is a this._element property that holds a reference to the HTML element that this id refers to
        //there is a this._val property that holds the class name of the led color and is initialized in updateFromHtml()
        this.updateFromHtml();
    }
    /**
     * Updates the status of this LED from its HTML element.
     * It comes handy for when the HTML element has been manipulated without using this LED class.
     * "red" has a priority over other colors. That means if an LED contains "red green" as its class name, it will be assumed red and other colors are removed from the class list.
     * "green" has priority over "grey"
     */
    Led.prototype.updateFromHtml = function () {
        var element = this.getElement();
        if ( element ) {
            if ( element.classList.contains( "red" ) ) {
                this._val = "red";
                element.classList.remove( "green" );
                element.classList.remove( "grey" );
            } else if ( element.classList.contains( "green" ) ) {
                this._val = "green";
                //it doesn't contain red at this stage
                element.classList.remove( "grey" );
            } else if ( element.classList.contains( "grey" ) ) {
                //it doesn't contain red and green at this stage
                this._val = "grey";
            } else {
                //there is no color assigned to this LED so it is not initialized
                this._val = null;
            }
            //add the led class just to make sure
            element.classList.add( "led" );
        }
    };
    /**
     * Returns the HTML element that this LED is referring to. If the element doesn't exist, it returns null
     */
    Led.prototype.getElement = function () {
        if ( this._element ) {
            return this._element;
        } else {
            //the element just came to existence
            this._element = document.getElementById( this._id );
            //initialize this._val from it and assing the relevant class names
            this.updateFromHtml();
            return this._element;
        }
    };
    /**
     * Sets the LED based on a string that represents the color
     * @param val {string} is a case sensitive string the indicates the color of the led. For performance reasons we don't do any normalization on this
     */
    Led.prototype.setStr = function ( val ) {
        //if it is the same value, don't do anything
        if ( val === this._val ) {
            return;
        }
        var element = this.getElement();
        if ( element ) {
            if ( val === "red" || val === "green" || val === "grey" ) {
                //remove the old color
                element.classList.remove( this._val );
                //set the new color
                this._val = val;
                element.classList.add( this._val );
            } else {
                //remove the old color
                element.classList.remove( this._val );
                this._val = null;
            }
        }
    };
    /**
     * Sets an LED based on a string that is used in Axell Wireless system for alarms:
     * "1" means red
     * "0" means green
     * "-" means off (grey)
     * anything else means not initialized (...)
     * @param val {string} the value to be set
     */
    Led.prototype.setAxl = function ( val ) {
        switch ( val ) {
            case "1":
                this.setStr( "red" );
                break;
            case "0":
                this.setStr( "green" );
                break;
            case "-":
                this.setStr( "grey" );
                break;
            default:
                this.setStr( null );
                break;
        }
    };
    /**
     * Returns the value of this LED in String format
     * @return "red", "green", "grey" or null (uninitialized)
     */
    Led.prototype.getStr = function () {
        return this._val;
    };
    /**
     * Returns the value of this LED in the format that is used in Axell Wireless system for alarms
     * "1" means red
     * "0" means green
     * "-" means off (grey)
     * null means this led is not initialized yet
     */
    Led.prototype.getAxl = function () {
        switch ( this.getStr() ) {
            case "red":
                return "1";
            case "green":
                return "0";
            case "grey":
                return "-";
            case null:
            default:
                return null;
        }
    };
    window.axellPopUp = axellPopUp;
    function axellPopUp(message_string) {
        $("<p>"+message_string+"</p>").dialog(
            {
                modal: true,
                buttons: {
                    "OK": function () {
                        $(this).dialog("close");
                    }
                }
            }
        );
    }
    window.axellPopUpWithTitle = axellPopUpWithTitle;
    function axellPopUpWithTitle(title_string,message_string) {
        $("<p>"+message_string+"</p>").dialog(
            {
                modal: true,
                title: title_string,
                buttons: {
                    "OK": function () {
                        $(this).dialog("close");
                    }
                }
            }
        );
    }
    window.axellConfirm = axellConfirm;
    function axellConfirm(title_icon, title_string, message_string, ok_callback, cancel_callback) {
        var wrap = $("<p>"+message_string+"</p>").dialog(
            {
                modal: true,
                buttons: {
                    "Cancel": function () {
                        $(this).dialog("close");
                        if(cancel_callback && _.isFunction(cancel_callback)){
                            cancel_callback();
                        };
                    },
                    "OK": function () {
                        $(this).dialog("close");
                        if(ok_callback && _.isFunction(ok_callback)){
                            ok_callback();
                        };
                    }
                }
            }
        );
        // set the title option and icon, after initialization
        wrap.data( "uiDialog" )._title = function(title) {
            title.html( this.options.title );
        };
        wrap.dialog('option', 'title', '<span style="float:left" class="ui-icon ui-icon-'+title_icon+'"></span> '+title_string+'');
    }
    Array.prototype.uniqueObjects = function(){
        function compare(a, b){
            for(var prop in a){
                if(a[prop] != b[prop]){
                    return false;
                }
            }
            return true;
        }
        return this.filter(function(item, index, list){
            for(var i=0; i<index;i++){
                if(compare(item,list[i])){
                    return false;
                }
            }
            return true;
        });
    }
    //----------------------------------------------------------------------------------------------------------
    /***
     * This function takes care of blinking red LEDs.
     * Just run it once and it will set up a timer to take care of its business.
     * It has a self-protection mechanism that doesn't allow two instances of it run in parallel.
     */
    window.toggleRedLeds = toggleRedLeds;
    function toggleRedLeds () {
        //is this algorithm running already?
        if ( toggleRedLeds.running ) {
            return;
        }
        //**Number of milliseconds for blinking red LED's
        var BLINK_DELAY=300;
        //use the running flag to make sure this function is only run once
        toggleRedLeds.running = true;
        var redLeds = null;
        function onTick () {
            if ( !redLeds ) {
                //find all the red leds
                redLeds = $( ".led.red:not(.unblink)" );
                //turn them off
                redLeds.addClass( "off" );
            } else {
                //turn the previous leds on again by removing the "off" class
                redLeds.removeClass( "off" );
                //use the variable as a flag for the next round of execution
                redLeds = null;
            }
            setTimeout( onTick, BLINK_DELAY );
        }
        //start counting
        setTimeout( onTick, BLINK_DELAY );
    }
    /***
     * This function takes care of blinking red LEDs.
     * Just run it once and it will set up a timer to take care of its business.
     * It has a self-protection mechanism that doesn't allow two instances of it run in parallel.
     */
    window.toggleOrangeLeds = toggleOrangeLeds;
    function toggleOrangeLeds () {
        //is this algorithm running already?
        if ( toggleOrangeLeds.running ) {
            return;
        }
        //**Number of milliseconds for blinking red LED's
        var BLINK_DELAY=300;
        //use the running flag to make sure this function is only run once
        toggleOrangeLeds.running = true;
        var orangeLeds = null;
        function onTick () {
            if ( !orangeLeds ) {
                //find all the red leds
                orangeLeds = $( ".led.orange:not(.unblink)" );
                //turn them off
                orangeLeds.addClass( "off" );
            } else {
                //turn the previous leds on again by removing the "off" class
                orangeLeds.removeClass( "off" );
                //use the variable as a flag for the next round of execution
                orangeLeds = null;
            }
            setTimeout( onTick, BLINK_DELAY );
        }
        //start counting
        setTimeout( onTick, BLINK_DELAY );
    }
    /***
     * This function takes care of blinking red LEDs.
     * Just run it once and it will set up a timer to take care of its business.
     * It has a self-protection mechanism that doesn't allow two instances of it run in parallel.
     */
    window.toggleYellowLeds = toggleYellowLeds;
    function toggleYellowLeds () {
        //is this algorithm running already?
        if ( toggleYellowLeds.running ) {
            return;
        }
        //**Number of milliseconds for blinking red LED's
        var BLINK_DELAY=300;
        //use the running flag to make sure this function is only run once
        toggleYellowLeds.running = true;
        var yellowLeds = null;
        function onTick () {
            if ( !yellowLeds ) {
                //find all the red leds
                yellowLeds = $( ".led.yellow:not(.unblink)" );
                //turn them off
                yellowLeds.addClass( "off" );
            } else {
                //turn the previous leds on again by removing the "off" class
                yellowLeds.removeClass( "off" );
                //use the variable as a flag for the next round of execution
                yellowLeds = null;
            }
            setTimeout( onTick, BLINK_DELAY );
        }
        //start counting
        setTimeout( onTick, BLINK_DELAY );
    }
    //----------------------------------------------------------------------------------------------------------
    //------------------------   THIS RUNS EVERY TIME THIS SCRIPT IS INCLUDED  ---------------------------------
    //----------------------------------------------------------------------------------------------------------
    //the following code will run every time a page is loaded and ready
    $(function(){
        //this one will take care of blinking the red LEDs
        toggleRedLeds();
        toggleYellowLeds();
        toggleOrangeLeds();
        //set the status message and icon to their initial values
        setStatus();
        //on unload, check for any unsaved changes
        /* Disable this feature due to bugs in IE
        window.onbeforeunload = function(e) {
            return titleManager.getStarred() ? true : null ;
        };
        */
    });

    /** calls a function every few milliseconds
     * @param ms {number} number of milliseconds between each call. Remember that this function calls callback once immediately
     * @param callback {function} the function to run every few milliseconds
     * @param [_this] {object} the this variable in the context of callback
     */
    function callEvery ( ms, callback, _this ) {
        "use strict";

        _this = _this || this;
        function callHandler () {
            //noinspection JSUnresolvedFunction
            callback.apply( _this );
            //noinspection JSUnresolvedFunction,JSUnresolvedVariable
            window.setTimeout( callHandler, ms );
        }
        callHandler();
    }

    /**
     * Runs fn if it is a function
     * @param fn {*} only if it is a function it will be run
     * @param [_this] {Object} an object that will be used as the 'this' variable inside the fn function
     * @param [argsArr] {Array} an array of items to be passed to the fn function as its arguments
     * @return {*} the result of fn or undefined if fn is not a function
     */
    function runIfFunction ( fn, _this, argsArr ) {
        if ( typeof fn === 'function' ) {
            return fn.apply( _this, argsArr );
        }
        return undefined;
    }

    //** returns unix epoch on the client side (http://en.wikipedia.org/wiki/Unix_time)
    function getEpoch () {
        'use strict';
        //noinspection JSUnresolvedFunction
        return new Date().getTime();
    }

    //force numberic input accept only numeric and .
    function numericInput($element){
        $element.keypress(function(event) {
            // Backspace, tab, enter, end, home, left, right,decimal(.)in number part, decimal(.) in alphabet
            // We don't support the del key in Opera because del == . == 46.
            var controlKeys = [8, 9, 13, 35, 36, 37,190];
            // IE doesn't support indexOf
            var isControlKey = controlKeys.join(",").match(new RegExp(event.which));
            // Some browsers just don't raise events for control keys. Easy.
            // e.g. Safari backspace.
            if (!event.which || // Control keys in most browsers. e.g. Firefox tab is 0
                (48 <= event.which && event.which <= 57) || // Always 0 through 9
                //(96 <= event.which && event.which <= 106) || // Always 1 through 9 from number section
                (46 == event.which) || // .
                //(96 == event.which) || // No 0 first digit from number section
                isControlKey) { // Opera assigns values for control keys.
                return;
            } else {
                event.preventDefault();
            }
        });
    }

    //validate tag field
    function validateTag(str){
        var tagRegex = new RegExp("^[a-zA-Z0-9-\\_ ]{0,50}$");
        return tagRegex.test(str);
    }
    //validate tag field
    function validateShortTag(str){
        var tagRegex = new RegExp("^[a-zA-Z0-9-\\_ ]{0,25}$");
        return tagRegex.test(str);
    }    
    //validate username field
    function validateUser(str){
        var usernameRegex = new RegExp("^[a-z0-9-\\_]{5,10}$");
        return usernameRegex.test(str);
    }
    //validate username field
    function validateLongUser(str){
        var usernameRegex = new RegExp("^[a-z0-9-\\_]{5,25}$");
        return usernameRegex.test(str);
    }
    //validate password field
    function validatePassword(str){
        var passwdRegex = new RegExp("^[a-zA-Z0-9.:;!+()-\\_]{5,25}$");
        return passwdRegex.test(str);
    }
    //validate space at Operator name field - (DOBR)
    function validateSpace(str){
        var spaceRegex = new RegExp("^[a-zA-Z0-9_-]{1,10}$");
        //("^[a-zA-Z0-9_]{5,10}$")
        return spaceRegex.test(str);
    }
    return {
        getEpoch : getEpoch,
        callEvery : callEvery,
        runIfFunction : runIfFunction,
        numericInput: numericInput,
        validateTag: validateTag,
        validateShortTag: validateShortTag,
        validateUser: validateUser,
        validateLongUser: validateLongUser,
        validatePassword: validatePassword,
        //DOBR
        validateSpace: validateSpace
    }
    //----------------------------------------------------//

});
