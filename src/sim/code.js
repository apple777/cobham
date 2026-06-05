require([ '/js/lib/handlebars.js', '/js/sim.js'], function ( Handlebars, sim ) {

    //adds a new row to the simulation table
    var addRow = (function () {
        var template = Handlebars.compile( $( '#row-template' ).html() );

        function addRow ( command, result ) {
            $( '#sim-table-body' ).append( template({
                command: command,
                result: result
            })).find( 'tr:last-child .delete-command-btn').click( function () {
                    console.log( 'Removing the row for ' + command );
                    sim.remove( command );
                    $( this ).parents( 'tr').remove();
                });
        }

        return addRow;
    })();

    //saves all the commands
    function saveAll () {
        $( '#sim-table-body tr' ).each( function () {
            var $tr = $( this );
            var oldCommand = $tr.attr( 'data-command' );

            var $commandInput = $tr.find( '.command' );
            var $resultInput = $tr.find( '.result' );

            var command = $commandInput.val();
            var result = $resultInput.val();

            if ( command && result ) {
                try {
                    if ( oldCommand === command ) {
                        sim.add( command, result );
                    } else {
                        sim.update( oldCommand, command, result );
                        $tr.attr( 'data-command', command );
                    }
                } catch ( ex ) {
                    axellPopUp( 'Failed to save ' + command + ': ' + ex );
                }
            }
        });
    }

    //loads all commands and results and draws the screen
    function loadAll () {
        var commands = sim.getCommands();
        $( '#table-caption').text( 'There are ' + commands.length + ' simulated commands.' );
        var layout = [];
        for( var i = 0; i < commands.length; i++ ) {
            var command = commands[ i ];
            addRow( command, sim.getResult( command ) );
        }
    }

    //shows the simulation json in a dialogue ready to be downloaded
    function download () {
        var $code = $( '<textarea style="width: 100%;height: 100%"></textarea>' ).val( sim.download() );
        $( '<div></div>').append( $code ).dialog({
            width : 400,
            height: 400,
            title: 'Copy the settings'
        });
    }

    function upload () {
        var $code = $( '<textarea style="width: 100%;height: 100%"></textarea>' );
        $( '<div></div>').append( $code ).dialog({
            width : 400,
            height: 400,
            title: 'Paste the settings',
            buttons:[{
                text: 'Upload',
                click: function () {
                    try {
                        sim.upload( $code.val() );
                        window.location.reload();
                    } catch ( ex ) {
                        axellPopUp( 'An error happened. The simulation configuration has not changed: ' + ex );
                    }
                }
            }]
        });
    }

    //event handler for the Add button
    $( '#add-btn' ).click( function () {
        addRow( '', '');
    });

    //event handler for the Save button
    $( '#save-btn' ).click( function () {
        saveAll();
    });

    //event handler for the download button
    $( '#download-btn' ).click( function () {
        download();
    });

    //event handler for the download button
    $( '#upload-btn' ).click( function () {
        upload();
    });

    loadAll();

});
