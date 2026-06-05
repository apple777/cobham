requirejs.config({
    waitSeconds: 0,
    shim: {
        '/js/lib/underscore.js': {
            exports: '_'
        },
        '/js/lib/jquery.js': {
            exports: '$'
        },
        '/js/lib/jquery-ui.js': {
            deps: [ '/js/lib/underscore.js', '/js/lib/jquery.js' ],
            exports: '$'
        },
        '/js/lib/knockout': {
            exports: 'ko',
            deps: ['/js/lib/jquery.js']
        },
        '/js/lib/handlebars.js': {
            exports: 'Handlebars'
        },
        '/js/lib/jquery_cookie.js':{
            deps: ['/js/lib/jquery.js']
        },
        '/js/lib/jquery.blockUI.js':{
            deps: ['/js/lib/jquery.js']
        }        
    }
});

/**
 * This is called by every page.
 * It mainly loads the essential modules and then loads the code.js in the root of the html that called
 * it using RequireJS.
 */
require([ '/js/lib/jquery.js', '/js/api.js', '/js/icons.js','/js/scheduler.js','/js/lib/underscore.js', '/js/lib/jquery-ui.js','/js/lib/jquery_cookie.js','/js/lib/jquery.blockUI.js'], function ( $, api, icons,scheduler,_ ) {
    $(function () {

        //a static variable to hold the status of the control key. It will be true when the control key is pressed
        var ctrlKey = false;
        $( document ).on( 'keydown', function ( e ) {
            if ( e.which === 17 ) {
                ctrlKey = true;
            } else if ( e.which === 77 && ctrlKey ) {
                var cmd = prompt( 'Command' );
                if ( cmd ) {
                    api.exe({
                        cmd:cmd,
                        onSuccess: function ( o ) {
                            if(o.ajaxdata!=""){
                                axellPopUp( o.ajaxdata );
                            }
                        },
                        onError: function ( o ) {
                            axellPopUp( 'Could not execute "' + cmd + '": ' + o.errorThrown );
                        }
                    })
                }
            }
        }).on( 'keyup', function ( e ) {
            if ( e.which === 17 ) {
                ctrlKey = false;
            }
        });
        //call operator and user cmd and create cookie to use across web pages
        //get username to display on top panel
        axshCall("username",function(out,err){
            if(err){
                alert("Could not get the name of the current user. Please refresh the page. "+err);
            }else{
                if(out === 'sysroot') out='sysadmin';
                $.cookie('username',out,{ expires: 7, path: '/' });
                sessionStorage.setItem( 'username', out );
            }
        });

        //get tag to display on title page
        axshCall("get tag",function(out,err){
            if(err){
                alert(err);
            }else{
                sessionStorage.setItem( 'tag', out );
            }
        });

        //this is to set cookie for operator acrss system
        api.exe({
            cmd: 'operators --json',
            onSuccess: function (o) {
                //var  OPERATOR = $.parseJSON(o.ajaxdata).operators;
                var OPERATOR=[];
                var ACTIVE_OPERATORS=[];
                try {
                    OPERATOR = $.parseJSON(o.ajaxdata).operators;
                }catch(e){
                    console.log(e);
                }
                
                if(sessionStorage.getItem( 'username') != "sysadmin"){
                    $.each(OPERATOR, function (key, oper) {
                        //get user list of that operator
                        api.exe({
                            cmd:'GET USEROPERATOR '+oper.SysName+' --json',
                            dataType:'json',
                            onSuccess:function(o){
                                var userList = o.ajaxdata.users;
                                $.each(userList, function (key, user) {
                                    if(user.userName == sessionStorage.getItem('username')){
                                        ACTIVE_OPERATORS.push(oper);
                                        $.removeCookie('operatorCook', { path: '/' });
                                        $.cookie('operatorCook', JSON.stringify(ACTIVE_OPERATORS), { expires: 7, path: '/' });
                                        console.log("operator cookie " + JSON.stringify(ACTIVE_OPERATORS));
                                    
                                    }
                                }
                            )},
                            onError:function(err){
                                console.log(err.errorThrown);
                            }
                        })
                    })
                }else{
                    $.removeCookie('operatorCook', { path: '/' });
                    $.cookie('operatorCook', JSON.stringify(OPERATOR), { expires: 7, path: '/' });
                    console.log("operator cookie " + JSON.stringify(OPERATOR));
                }
            }
        })
        //constantly check if there is any operators in the system
        //send user to topology page
        scheduler.add(sec(20),{
            cmd:'operators --json',
            callOnDiff:true,
            //dataType:'json',
            onSuccess:function(o){
                //var operatorList = $.parseJSON(o.ajaxdata);
                var operatorList=[];
                try {
                    operatorList = $.parseJSON(o.ajaxdata).operators;
                }catch(e){
                    console.log(e);
                }
                var OPERATOR=[];
                if(operatorList.length>0) {
                    $.each(operatorList, function (key, value) {
                        OPERATOR.push(value);
                    })
                }
                api.exe({
                    cmd: getAttr( 'mdl' ),
                    onSuccess: function ( o ) {
                        if(o.ajaxdata === "MSDH-M") {
                            if (OPERATOR.length === 0){
                                if (document.URL.indexOf('initial_setup') === -1 && document.URL.indexOf('term') === -1) {
                                    window.location.href = '/target/initial_setup';
                                }
                            }else{
                                if (document.URL.indexOf('initial_setup') != -1) {
                                    window.location.href = '/target';
                                }
                            }
                        }
                    }
                });

                //in case there is only one operator, get operator username to get the access right for user
                //if user is sysadmin
                if(sessionStorage.getItem( 'username') != "sysadmin"){
                    $.each(OPERATOR, function (key, oper) {
                        //get user list of that operator
                        api.exe({
                            cmd:'GET USEROPERATOR '+oper.SysName+' --json',
                            dataType:'json',
                            onSuccess:function(o){
                                var userList = o.ajaxdata.users;
                                $.each(userList, function (key, user) {
                                    if(user.userName == sessionStorage.getItem('username')){
                                        var access = _.findWhere(userList,{"userName":sessionStorage.getItem( 'username')}).access;
                                        $.removeCookie('userAccess', { path: '/' });
                                        $.cookie('userAccess',access,{ expires: 7, path: '/' });
                                        console.log("success");
                                    }
                                }
                            )},
                            onError:function(err){
                                console.log(err.errorThrown);
                            }
                        })
                    })
                }else{
                    $.removeCookie('userAccess', { path: '/' });
                    $.cookie('userAccess','superuser',{ expires: 7, path: '/' });
                }
            }
        })

        //show the jquery dialog instead of the standard axellPopUp() function
        window.alert = function ( msg ) {
            $( '<div></div>').text( msg ).dialog({
                title: 'Axell Wireless',
                modal: true
            });
        };

        icons.addToPage();

        require( [ '/js/header.js' ] );

        //make help, info and warning icons have a tooltip
        $( '.icon.help' ).tooltip({
            content: function(callback) {
                callback($(this).prop('title').replace('|', '<br />'));
            }
        });
        $( '.icon.info' ).tooltip();
        $( '.icon.warning' ).tooltip();

        //load the code.js from the current directory
        require( [ 'code.js' ] );

        //set time out to auto log out after 1min
        var timer1, timer2;
        document.onkeypress=resetTimer;
        document.onmousemove=resetTimer;
        document.onload =resetTimer();
        function resetTimer()
        {
            clearTimeout(timer1);
            clearTimeout(timer2);
            // time out in minutes
            var timeOut=15; // this means 15 minutes
            //only set time out if page is not logout
            if (document.URL.indexOf('logout') === -1){
                // alert user one minute before
                timer1=setTimeout(alertUser, (60000*timeOut) - 60000);

                // logout user
                timer2=setTimeout(logout, 60000*timeOut);
            }
        }

         function alertUser()
         {
         axellPopUp("You will be logged out in 1 minute. Do you want to stay signed in?");
         }

         function logout()
         {
            window.location.href='/logout';
         }
    });



    //to make drag and drop work on ipad
    (function ($) {
        // Detect touch support
        $.support.touch = 'ontouchend' in document;
        // Ignore browsers without touch support
        if (!$.support.touch) {
            return;
        }
        var mouseProto = $.ui.mouse.prototype,
            _mouseInit = mouseProto._mouseInit,
            touchHandled;

        function simulateMouseEvent (event, simulatedType) { //use this function to simulate mouse event
            // Ignore multi-touch events
            if (event.originalEvent.touches.length > 1) {
                return;
            }
            event.preventDefault(); //use this to prevent scrolling during ui use

            var touch = event.originalEvent.changedTouches[0],
                simulatedEvent = document.createEvent('MouseEvents');
            // Initialize the simulated mouse event using the touch event's coordinates
            simulatedEvent.initMouseEvent(
                simulatedType,    // type
                true,             // bubbles
                true,             // cancelable
                window,           // view
                1,                // detail
                touch.screenX,    // screenX
                touch.screenY,    // screenY
                touch.clientX,    // clientX
                touch.clientY,    // clientY
                false,            // ctrlKey
                false,            // altKey
                false,            // shiftKey
                false,            // metaKey
                0,                // button
                null              // relatedTarget
            );

            // Dispatch the simulated event to the target element
            event.target.dispatchEvent(simulatedEvent);
        }
        mouseProto._touchStart = function (event) {
            var self = this;
            // Ignore the event if another widget is already being handled
            if (touchHandled || !self._mouseCapture(event.originalEvent.changedTouches[0])) {
                return;
            }
            // Set the flag to prevent other widgets from inheriting the touch event
            touchHandled = true;
            // Track movement to determine if interaction was a click
            self._touchMoved = false;
            // Simulate the mouseover event
            simulateMouseEvent(event, 'mouseover');
            // Simulate the mousemove event
            simulateMouseEvent(event, 'mousemove');
            // Simulate the mousedown event
            simulateMouseEvent(event, 'mousedown');
        };

        mouseProto._touchMove = function (event) {
            // Ignore event if not handled
            if (!touchHandled) {
                return;
            }
            // Interaction was not a click
            this._touchMoved = true;
            // Simulate the mousemove event
            simulateMouseEvent(event, 'mousemove');
        };
        mouseProto._touchEnd = function (event) {
            // Ignore event if not handled
            if (!touchHandled) {
                return;
            }
            // Simulate the mouseup event
            simulateMouseEvent(event, 'mouseup');
            // Simulate the mouseout event
            simulateMouseEvent(event, 'mouseout');
            // If the touch interaction did not move, it should trigger a click
            if (!this._touchMoved) {
                // Simulate the click event
                simulateMouseEvent(event, 'click');
            }
            // Unset the flag to allow other widgets to inherit the touch event
            touchHandled = false;
        };
        mouseProto._mouseInit = function () {
            var self = this;
            // Delegate the touch handlers to the widget's element
            self.element
                .on('touchstart', $.proxy(self, '_touchStart'))
                .on('touchmove', $.proxy(self, '_touchMove'))
                .on('touchend', $.proxy(self, '_touchEnd'));

            // Call the original $.ui.mouse init method
            _mouseInit.call(self);
        };
    })(jQuery);
});