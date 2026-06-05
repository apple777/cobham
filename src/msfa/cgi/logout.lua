#!/usr/bin/env wsapi.cgi

---This file returns HTTP 401 error in order to logout the user

require "reqres"     -- wsapi lib

module("hello", package.seeall)

function run(wsapi_env)
	local headers = {
		["Content-type"]     = "text/html",
		["WWW-Authenticate"] = "digest",
		["stale"]            = "false",
		["connection"]       = "close",
	}
	local r = wsapi.request.new(wsapi_env or {})
	res=""
	---this function sends the result (res) little by little. it's a paradigm used by WSAPI
	local function send() coroutine.yield(res) end
	res="Please close the browser so that it 'forgets' user name and password"
	return 401, headers, coroutine.wrap(send)
end

return _M
