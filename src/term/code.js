require([ '/js/lib/jquery.js', '/js/api.js', 'cmdHistory.js', '/js/util.js', '/js/lib/jquery-url.js' ], function ( $, api, cmdHistory, util ) {

    var $dialog = $( '#the-warning-message');
    $dialog.dialog({
        title: 'Warning',
        modal: true,
        minHeight:50,
        autoOpen: false,
        close: function () {
            $( '.after-login' ).show().focus();
        },
        buttons: {
            'I understand': function () {
                iUnderstand( true );
                $dialog.dialog( 'close' );
            },
            'Cancel': function () {
                iUnderstand( false );
            }
        }
    });

    //** user has confirmed understanding of the risks of using terminal
    function iUnderstand ( yes ) {
        if ( yes ) {
            $( '.after-login' ).show().focus();
        } else {
            //if there is another page in the history, go back. Otherwise go to the target page
            if ( window.history.length > 1 ) {
                window.history.back();
            } else {
                window.location.href = '/target/';
            }
        }
    }

    //** Adds an HTML element to the output
    function addToOutput ( element ){
        $( '#cmd' ).before( element );
        scrollToEndOfOutput();
        return element;
    }

    //** This function is called internally in order to smoothly scroll to the bottom of the output
    function scrollToEndOfOutput(){
        //TODO: replace it with JQuery and $("#output").get(0) when you have time
        var output = document.getElementById("output");
        output.scrollTop=output.scrollHeight;
    }

    //**  Run a command that is just entered
    function commandEntered ( cmd ) {
        if(cmd){//ignore empty command string
            cmdHistory.push(cmd);
            setStatus( 'Executing command: "' + cmd + '"', true );
            addToOutput( $( '<pre class="command"><a href="?cmd=' + encodeURIComponent( cmd ) + '">' + cmd + '</a></pre>' ) );
            $("#cmd").val( '' );
            api.exe({
                cmd: cmd,
                onBefore: function ( o ) {
                    o.__resultBox = addToOutput( $( '<pre><div class="icon waiting"></div> Executing...</pre>' ) );
                },
                onSuccess: function ( o ) {
                    o.__resultBox.addClass( 'result' ).text( o.ajaxdata );
                },
                onError: function ( o ) {
                    o.__resultBox.addClass( 'error' ).text( o.errorThrown );
                },
                onAlways: function ( o ) {
                    scrollToEndOfOutput();
                }
            });
        }
    }

    //** This part executes the the document is loaded
    $(document).ready(function(e) {
        //reset whatever stuff the browser may put into the edit box
        $( '#cmd' ).val( '' ).change(function ( e ) {
            commandEntered( $( this ).val() );
        }).keyup( function ( e ) {
            switch( e.which || e.keyCode ) {
                case 13://ENTER key
                    commandEntered( $( this ).val() );
                    return true;
                case 38://UP arrow key
                    focusCmd();
                    $( this ).val( cmdHistory.prev() );
                    return false;
                case 40://DOWN arrow key
                    focusCmd();
                    $( this ).val( cmdHistory.next() );
                    return true;
                default://all other keys
                    return true;//see the function documentation above to know what this return value means
            }
        });

        //** focuses cmd if nothing there is no selected text on the page
        function focusCmd() {
            var selection = '';
            if ( window.getSelection ) {
                selection = window.getSelection().toString();
            } else if ( document.getSelection ) {
                selection = document.getSelection().toString();
            } else if ( document.selection ) {
                selection = document.selection.createRange().text;
            }
            if ( $.trim( selection ) === '' ) {
                $( '#cmd' ).focus();
            }
        }
        $( '#output' ).click( focusCmd ).hover( focusCmd );

        var cmdFromUrl = $.url( '?cmd' );
        if ( cmdFromUrl ) {
            iUnderstand( true );
            commandEntered( decodeURIComponent( cmdFromUrl ) );
        } else {
            $dialog.dialog( 'open' );
        }
    });
});