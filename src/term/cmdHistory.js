define( function () {
    //** This constructs the history object which is used to store and retrieve the previous commands
    var commandsArr = [];
    var cursor = -1;

    //** returns the current command that is at the position of the cursor
    function getCurrCmd () {
        return commandsArr[ cursor ] || null;
    }

    //** push a command into the history array
    function push ( command ) {
        //avoid adding empty and the same command as the last commands
        if( typeof command === 'string' && command && commandsArr[ commandsArr.length - 1 ] !== command ) {
            commandsArr.push(command);
        }
        cursor = commandsArr.length;
    }

    //** go back in history
    function prev () {
        if ( cursor > 0 ) {
            cursor--;
        }
        return getCurrCmd();
    }

    //** go forward in history
    function next () {
        if ( cursor < commandsArr.length ) {
            cursor++;
        }
        return getCurrCmd();
    }

    return {
        getCurrCmd: getCurrCmd,
        push: push,
        prev: prev,
        next: next
    }
});