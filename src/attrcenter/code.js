require([ '/js/api.js', '/js/util.js'], function ( api, util ) {

    //** the database to cache all attributes, their access method and their one line help
    var db = {};
    //** list of all attributes sorted in alphabetical order
    var attrs = [];
    //** holds the name of the current attribute
    var currAttr;

    //**event listener for GET button
    function onGet () {
        if ( $( "#get-btn" ).hasClass( "disabled" ) ) {
            return;
        }
        var cmd = "get " + currAttr + " " +$( "#get-params" ).val();
        axshCall( cmd, function ( out, err ) {
            if ( err ) {
                $( "#get-results" ).addClass( "error" ).val( cmd + " > " + err );
            } else {
                $( "#get-results" ).removeClass( "error" ).val( out );
            }
        });
    }

    //**event listener for SET button
    function onSet () {
        if ( $( "#set-btn" ).hasClass( "disabled" ) ) {
            return;
        }
        var cmd = "set " + currAttr + " " +$( "#set-params" ).val();
        axshCall( cmd, function ( out, err ) {
            if ( err ) {
                $( "#set-results" ).addClass( "error" ).val( cmd + " > " + err );
            } else {
                $( "#set-results" ).removeClass( "error" ).val( out );
            }
        });
    }

    //**event listener for ACT button
    function onAct () {
        if ( $( "#act-btn" ).hasClass( "disabled" ) ) {
            return;
        }
        var cmd = "act " + currAttr + " " +$( "#act-params" ).val();
        axshCall( cmd, function ( out, err ) {
            if ( err ) {
                $( "#act-results" ).addClass( "error" ).val( cmd + " > " + err );
            } else {
                $( "#act-results" ).removeClass( "error" ).val( out );
            }
        });
    }

    //**Runs whenever the choice of attribute is changed
    function onAttrChange () {
        currAttr = $( "#list-of-attrs" ).val();
        $( ".attr-name" ).text( currAttr );
        //activate/deactivate relevant controls
        if ( db[ currAttr ].r ) {
            $( "#get-params" ).prop( "disabled", false );
            $( "#get-results").prop( "disabled", false );
            setButtonEnDis( "#get-btn", true );
        } else {
            $( "#get-params" ).prop( "disabled", true );
            $( "#get-results").prop( "disabled", true );
            setButtonEnDis( "#get-btn", false );
        }
        if ( db[ currAttr ].w ) {
            $( "#set-params" ).prop( "disabled", false );
            $( "#set-results").prop( "disabled", false );
            setButtonEnDis( "#set-btn", true );
        } else {
            $( "#set-params" ).prop( "disabled", true );
            $( "#set-results").prop( "disabled", true );
            setButtonEnDis( "#set-btn", false );
        }
        if ( db[ currAttr ].x ) {
            $( "#act-params" ).prop( "disabled", false );
            $( "#act-results").prop( "disabled", false );
            setButtonEnDis( "#act-btn", true );
        } else {
            $( "#act-params" ).prop( "disabled", true );
            $( "#act-results").prop( "disabled", true );
            setButtonEnDis( "#act-btn", false );
        }
        $( "input" ).val( "" ).removeClass( "error" );
        //show the one-line description of this attribute on the <select> element
        $( "#list-of-attrs" ).attr( "title", db[ currAttr ].desc );
        //load the inf for this attribute
        loadInf( currAttr );
    }

    //** Loads the inf for a particular attribute
    function loadInf ( attr ) {
        axshCall( "inf " + attr, function ( out, err ) {
            if ( err ) {
                $( "#inf-result" ).text( "Could not load INF for attribute " + quote( attr ) + ": " + err );
            } else {
                $( "#inf-result" ).text( out );
            }
        });
    }

    //** This code runs when the page is loaded
    $(function ( e ) {
        //** bind all the methods
        $( "#list-of-attrs" ).change( onAttrChange );
        $( "#get-btn" ).click( onGet );
        $( "#set-btn" ).click( onSet );
        $( "#act-btn" ).click( onAct );
        //**now load the output of the help for analysis
        setStatus( "Loading attributes", true );
        axshCall( "help", function ( out, err ) {
            setStatus();
            if(err){
                axellPopUp("Could not use the HELP command to get the list of attributes: "+err);
                return;
            }else{
                //parse each line of help to get a list of attributes
                var lines = split2( out, "\n" );
                $( "#list-of-attrs" ).empty();
                for ( var i = 0 ; i < lines.length ; i++ ) {
                    var e = lines[ i ].match( /(\S*)\s\s(...)\s*(.*)/ );
                    /* e will be:
                    [1] = attribute
                    [2] =
                    [3] = one line description
                    */
                    if ( ! e ) {
                        console.warn( "Ignoring an attribute. Could not parse line: " + quote( lines[i] ) );
                        continue;
                    }
                    var attr = e[ 1 ] = e[ 1 ].toUpperCase();
                    attrs.push( attr );
                    //set the data in the cache
                    db[ attr ] = {};
                    db[ attr ].r = e[2].indexOf("r") !== -1;
                    db[ attr ].w = e[2].indexOf("w") !== -1;
                    db[ attr ].x = e[2].indexOf("x") !== -1;
                    db[ attr ].desc = e[ 3 ];
                }
                //sort the attribute list
                attrs.sort();
                for ( var i = 0; i < attrs.length; i++ ) {
                    //make an option
                    var attr = attrs[ i ];
                    var option = newElement( "option", null, null, attr, db[ attr ].desc );
                    $( "#list-of-attrs" ).append( option );
                }
                //now that the attributes are put in the <select> tag, update the inf section based on the current selected attr
                onAttrChange();
            }
        });
    });
});