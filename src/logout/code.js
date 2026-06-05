require(['/js/api.js','/js/lib/jquery.js','/js/lib/jquery_cookie.js'],function (api) {
    if(!localStorage.operatorRegion){
        localStorage.clear();
    }
    
    function logout_event(){
		if($.cookie('currentOperator') != null){
			var event_cmd="alarms eventoper " + $.cookie('currentOperator') + " ULO user " + sessionStorage.getItem( 'username') + " logged out."
			api.exe({
				cmd: event_cmd,
				async: false,
				onSuccess: function (EOC) {
					console.log("user logout");
				}
			})
		}
    }
    
    logout_event();
    sessionStorage.clear();
    $.removeCookie('operator', { path: '/' });
    $.removeCookie('currentOperator', { path: '/' });
    $.removeCookie('username', { path: '/' });
    $.removeCookie('operatorCook', { path: '/' });
    try{
        var agt=navigator.userAgent.toLowerCase();
        if (agt.indexOf("msie") != -1) {
        // IE clear HTTP Authentication
            document.execCommand("ClearAuthenticationCache");
        }else {
            var xmlhttp = createXMLObject();
            xmlhttp.onreadystatechange=function(){
                if(xmlhttp.status ==401){
                    window.open('/target','_parent','');
                }
            }
            xmlhttp.open("POST","/logout",false,"logout","logout");
            xmlhttp.send("");
            xmlhttp.abort();
        }

    } catch(e) {
// There was an error
        alert("there was an error");
    }
    function createXMLObject() {
        try {
            if (window.XMLHttpRequest) {
                xmlhttp = new XMLHttpRequest();
            }
// code for IE
            else if (window.ActiveXObject) {
                xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
            }
        } catch (e) {
            xmlhttp=false
        }
        return xmlhttp;
    }
    //window.open('/cgi/logout.lua','_parent','');
    //window.close();
});