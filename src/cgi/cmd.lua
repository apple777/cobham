#!/usr/bin/env wsapi.cgi
---This file contains the run() function which is the main entry point for Ajax calls.
require "reqres"
require "utils"
require "libapplua"
require "libAxshLua"
require "libavilua"
require "socket"
axsh.init()

debug_enabled=avi.fw_read_int("/etc/opt/axell/common/current/system.conf", "DEBUG_web")
function print_execution_log(str)   
   if(debug_enabled==1)then
      os.execute("/usr/sbin/axell/common/current/sys/printlogger /tmp/log/cmd_web.log 0 10000 500 6 \""..str.."\"")
   end
end
function log_execution_line(line)
   EXEC_WEB_LOG="/tmp/run/axell/cmd_web.log"
   file = io.open(EXEC_WEB_LOG, "a+")
   if(file ~= nil)then
      file:write(tostring(line).."\n")
      file:close()
   end
end

---This function prints log to file in order for the back edn to trace the running path.
-- @param log the string to be printed as a line into the log file
function print_log(log)
   file = io.open("/tmp/run/axell/cmd_lua.log", "a+")
   if(file ~= nil)then
      file:write("LINE: "..debug.getinfo(2).currentline.." "..tostring(log).."\n")
      file:close()
   end
end

function username()
    return getEnv("REMOTE_USER")
end


---This function executes an attribute command like "get rsp", "set tag 2", etc.
-- @param node (optional) a number >=0 that indicates the node. it can be nil if there's no node to operate on.
-- @param opr can be either of these three strings
-- @param attr the attribute name
-- @param therest the rest of the arguments that will gollow the command after attribute name
function attrcmd(node,opr,attr,therest)
	if not opr then return nil, "GET, SET, ACT is not specified" end
	opr=opr:lower()
	if not attr then return nil, "No attribute specified" end
	attr=attr:lower()
	if therest and trim(therest)=="" then therest=nil end
	local parameters,err
	if therest then
		parameters,err=splitQ(therest)
		if not parameters then return nil,"Could not parse command parameters. Error: "..err end
	end
	--the axsh.attrib() function is not smart enough so this wrapper checks the node to make sure it's not passed as null

-- TODO:We need a wrapper here and in target where we check a list of attributes, and if these are attempted to be executed
-- we should force parameter --none-interactive as the last parameter
-- Typical example is, someone tries to issue ACT PASSWORD which is interactive. By hardcoding --none-interactive to the end
-- there is no way for the user to lock the web for this attribute.
-- Hence, a function here which checks if attribute is in --none-interactive list, and if it is, add parameter before executing
-- libAxshLua.

	local ret=nil
	if node then
		if therest then
			ret=axsh.attribAs(getEnv("REMOTE_USER"),node,opr,attr,unpack(parameters))
		else
			ret=axsh.attribAs(getEnv("REMOTE_USER"), node,opr,attr)
		end
	else
		if therest then
			ret=axsh.attribAs(getEnv("REMOTE_USER"), opr,attr,unpack(parameters))
		else
			ret=axsh.attribAs(getEnv("REMOTE_USER"), opr,attr)
		end
	end
	return ret
end

validCommands={}
function defineCommand ( command, handler )
	if type(handler)=="function" then
		validCommands[command:lower()]=handler
	end
end


defineCommand('rf_on_off', function (params) 
   return runbin('/usr/sbin/axell/target/current/sys/rf_on_off '..params) 
end)

defineCommand('marvell_port_on_off', function (params) 
   return runbin('/usr/sbin/axell/target/current/sys/hw_init/marvell_port_on_off '..params) 
end)

defineCommand('cpri_force_port', function (params) 
   return runbin('/usr/sbin/axell/common/current/sys/cpri_force_port.sh '..params) 
end)

defineCommand('power_reset',function (params)
   return runbin('/usr/sbin/axell/common/current/cmd/power_reset.sh '..params)
end)

defineCommand('hw_reset',function (params)
   return runbin('/usr/sbin/axell/common/current/cmd/hw_reset.sh '..params)
end)

defineCommand('linkstatus',function (params)
    return runbin('/usr/sbin/axell/target/current/cmd/linkstatus '..params)
end)

defineCommand('set_msdh_mode',function (params)
   return runbin('/usr/sbin/axell/target/current/cmd/set_msdh_mode '..params)
end)

defineCommand('read_mfr_data',function ()
   return runbin('/mnt/axell/sbin/common/current/cmd/read_mfr_data.sh ')
end)

defineCommand('check_cres_tag',function (params)
   return runbin('/mnt/axell/sbin/common/current/cmd/check_cres_tag.sh '..params)
end)

defineCommand('mtdi_mute',function (params)
   return runbin('/mnt/axell/sbin/common/current/cmd/mtdi_mute.sh '..params)
end)

defineCommand('bands_spec',function ()
   return runbin('/mnt/axell/sbin/common/current/cmd/bands_spec.sh ')
end)

defineCommand('inventory_cmd',function ()
   return runbin('/mnt/axell/sbin/common/current/cmd/inventory_cmd.sh ')
end)

defineCommand('kill_smd',function ()
   return runbin('/mnt/axell/sbin/common/current/cmd/kill_smd.sh ')
end)

defineCommand('get_remote_measurements_sfp',function (params)
   return runbin('/mnt/axell/sbin/common/current/cmd/get_remote_measurements_sfp.sh '..params)
end)

defineCommand('write_mfr_data',function (params)
   return runbin('/mnt/axell/sbin/common/current/cmd/write_mfr_data.sh '..params)
end)

defineCommand('set_pim_test',function (params)
   return runbin('/mnt/axell/sbin/common/current/cmd/set_pim_test.sh '..params)
end)

defineCommand('fiber_redundancy',function (params)
   return runbin('/mnt/axell/sbin/common/current/cmd/fiber_redundancy.sh '..params)
end)

defineCommand('imop_control', function (params)                                                               
   return runbin('/mnt/axell/sbin/target/current/sys/imop_control '..params)                                               
end)

defineCommand('dobr_erase_slave_ID', function ()                                                               
   return runbin('/usr/sbin/axell/target/current/sys/dobr_erase_slave_ID ')                                               
end)

defineCommand('dobr_pa_control', function (params)                                                               
   return runbin('/mnt/axell/sbin/target/current/sys/dobr_pa_control '..params)                                               
end)

defineCommand('dobr_dingerd_kick', function (params)                                                               
   return runbin('/mnt/axell/sbin/target/current/sys/dobr_dingerd_kick '..params)                                               
end)

defineCommand('dobr_version', function ()                                                               
   return runbin('/usr/sbin/axell/target/current/sys/dobr_version ')                                               
end)                                                                                                               

defineCommand('eth_over_cpri', function (params)                                                               
   return runbin('/usr/sbin/axell/common/current/cmd/eth_over_cpri '..params)                                               
end)                                                                                                               
         
defineCommand('alarms', function (params)
   return runbin('/usr/sbin/axell/common/current/cmd/alarms '..params)
end)

defineCommand('measurements', function (params)
   return runbin('/usr/sbin/axell/common/current/cmd/measurements '..params)
end)

defineCommand('rfmeasurements', function (params)
   return runbin('/usr/sbin/axell/target/current/cmd/rfmeasurements '..params)
end)

defineCommand('fft', function (params)
   return runbin('/usr/sbin/axell/common/current/cmd/fft.lua '..params)
end)

defineCommand('modem_at', function (params)
   return runbin('/usr/sbin/axell/common/current/cmd/modem_at '..params)
end)

defineCommand('device', function (params)
   return runbin('/usr/sbin/axell/common/current/cmd/device '..params)                       
end)                                   
                                                                        
defineCommand('correction_factor', function (params)
   return runbin('/usr/sbin/axell/target/current/cmd/correction_factor '..params)                       
end)                                   
                                                                        
defineCommand('dobrstatus_remote',function (params)
   return runbin('/usr/sbin/axell/common/current/cmd/dobrstatus_remote.sh '..params)
end)

defineCommand('alarms_dump_remote',function (params)
   return runbin('/usr/sbin/axell/common/current/cmd/alarms_dump_remote.sh '..params)
end)

defineCommand('dobr_filters', function (params)
   return runbin('/usr/sbin/axell/target/current/cmd/dobr_filters '..params)
end)

defineCommand('dobr_filters_get_remote',function (params)
   return runbin('/usr/sbin/axell/common/current/cmd/dobr_filters_get_remote.sh '..params)
end)

defineCommand('dobr_filters_set_remote',function (params)
   return runbin('/usr/sbin/axell/common/current/cmd/dobr_filters_set_remote.sh '..params)
end)

defineCommand('filterdump', function (params)
   return runbin('/usr/sbin/axell/target/current/cmd/filterdump '..params)
end)

defineCommand('read_gps_coordinates',function ()
   return runbin('/usr/sbin/axell/common/current/cmd/read_gps_coordinates.sh')
end)

defineCommand('set_ntpd',function ()
   return runbin('/usr/sbin/axell/common/current/cmd/set_ntpd.sh')
end)

defineCommand('app_files',function ()
   return runbin('/usr/sbin/axell/common/current/cmd/app_files.sh')
end)

defineCommand('app_installer',function (params)
   return runbin('/usr/sbin/axell/common/current/cmd/app_installer.sh '..params)
end)

defineCommand('sys_files',function ()
   return runbin('/usr/sbin/axell/common/current/cmd/sys_files.sh')
end)

defineCommand('sys_installer',function (params)
   return runbin('/usr/sbin/axell/common/current/cmd/sys_installer.sh '..params)
end)

defineCommand('swup_swap',function (params)
   return runbin('/usr/sbin/axell/common/current/cmd/swup_swap.sh '..params)
end)

---Receive the available backup files
defineCommand('backup',function ( params )
	return runbin('/usr/sbin/axell/common/current/cmd/config-backup.sh '..params)
end)

defineCommand('sync_ports',function ( params )
	return runbin('/usr/sbin/axell/common/current/cmd/sync_ports.sh '..params)
end)

defineCommand('mng_ports',function ( params )
	return runbin('/usr/sbin/axell/common/current/cmd/mng_ports.sh '..params)
end)

defineCommand('copy_configuration',function ( params )
	return runbin('/usr/sbin/axell/common/current/cmd/copy_configuration.sh '..params)
end)

--roundtrip: just return ASAP in order to calculate the network packet roundtrip time
defineCommand('roundtrip',function ()
	return 'roundtrip'
end)

--special case: see bug#20120248. Martin wants "nodestat" to run without any parameter.
defineCommand('get_alarms_info',function ()
	return runbin('/usr/sbin/axell/common/current/sys/get_open_alarms_info.sh')
end)

--special case: see bug#20120248. Martin wants "nodestat" to run without any parameter.
defineCommand('nodestat',function ()
	return runbin('/usr/sbin/axell/common/current/cmd/nodestat')
end)

---for retrieving log dumps
defineCommand('logdump',function ( params )
	return runbin('/usr/sbin/axell/common/current/cmd/logdump '..params)
end)

defineCommand('hardware',function ( params )
	return runbin('/usr/sbin/axell/common/current/cmd/hardware '..params)
end)

---for retrieving alarmnames
defineCommand('alarmnames',function ()
	return runbin('/usr/sbin/axell/common/current/cmd/alarmnames')
end)

---for retrieving system banks status
defineCommand('sw_sys_status',function ()
	return runbin('/usr/sbin/sw_sys_status.sh')
end)

---for swapping application banks
defineCommand('sw_app_swap',function ()
	return runbin('/usr/sbin/sw_app_swap.sh reboot')
end)

---for swapping system banks
defineCommand('sw_sys_swap',function ()
	return runbin('/usr/sbin/sw_sys_swap.sh reboot')
end)

---for retrieving installed patches
defineCommand('get_patches',function ()
	return runbin('/usr/sbin/axell/common/current/cmd/get_patches.sh')
end)

defineCommand('get_patches_all',function ()
	return runbin('/usr/sbin/axell/common/current/cmd/get_patches_all.sh')
end)

---for retrieving alarmnames
defineCommand('masterip',function ( params )
	return runbin('/usr/sbin/axell/common/current/cmd/masterip '..params)
end)

---for retrieving alarmnames
defineCommand('aemdpost',function ( params )
	return runbin('/usr/sbin/axell/common/current/sys/aemdpost '..params)
end)

---for retrieving alarmnames
defineCommand('web_passwd',function ( params )
	return runbin('su ' .. username() .. ' -s /bin/sh /usr/sbin/axell/common/current/sys/web_passwd '..params)
end)

--- the new quick snmp -w
defineCommand('snmp',function (params)
	return runbin('/usr/sbin/axell/common/current/cmd/snmp '..params)
end)

--- indentify command
defineCommand('identify',function (params)
        return runbin('/usr/sbin/axell/common/current/cmd/identify '..params)
end)

--- polygones file install
defineCommand('polygon_install',function (params)
        return runbin('/usr/sbin/axell/target/current/sys/polygon_install '..params)
end)

--- version upgrade
defineCommand('sw_burn',function (params)
        return runbin('/usr/sbin/axell/common/current/cmd/sw_burn burn'..params)
end)

--- version upgrade status
defineCommand('sw_burn_status',function (params)
        return runbin('/usr/sbin/axell/common/current/cmd/sw_burn get_status'..params)
end)

--- software update manager
defineCommand('get_swup_status',function ()
        return runbin('/usr/sbin/axell/common/current/cmd/swup_get_status.sh')
end)

defineCommand('get_swup_files',function ()
        return runbin('/usr/sbin/axell/common/current/cmd/swup_get_files.sh')
end)

defineCommand('swup_apply',function (params)
        return runbin('/usr/sbin/axell/common/current/cmd/swup_apply.sh '..params)
end)

defineCommand('swup_clear',function ()
        return runbin('/usr/sbin/axell/common/current/cmd/swup_clear.sh')
end)

defineCommand('get_date',function ()
        return runbin('/usr/sbin/axell/common/current/cmd/get_date.sh')
end)

defineCommand('swup_cancel',function ()
        return runbin('/usr/sbin/axell/common/current/cmd/swup_cleanall.sh')
end)

defineCommand('clear_sw_folder',function ()
        return runbin('/usr/sbin/axell/common/current/cmd/swup_clear_folder.sh')
end)

defineCommand('copy_sw_file',function (params)
        return runbin('/usr/sbin/axell/common/current/cmd/swup_copy_file.sh '..params)
end)

--- scheduler
defineCommand('calendar_getevents',function (params)
        return runbin('/usr/sbin/axell/common/current/cmd/calendar_getevents.sh '..params)
end)

defineCommand('calendar_saveevents',function (params)
        return runbin('/usr/sbin/axell/common/current/cmd/calendar_saveevents.sh '..params)
end)

defineCommand('getprofileflag',function (params)
        return runbin('/usr/sbin/axell/common/current/cmd/getprofileflag.sh '..params)
end)

defineCommand('saveprofileflag',function (params)
        return runbin('/usr/sbin/axell/common/current/cmd/saveprofileflag.sh '..params)
end)

defineCommand('get_sector_virtual',function ()
        return runbin('/usr/sbin/axell/common/current/cmd/sector_get_virtual.sh')
end)

defineCommand('get_internal_ip',function ()
        return runbin('/usr/sbin/axell/common/current/cmd/get_internal_ip.sh')
end)

defineCommand('get_rrc_message',function (params)
        return runbin('/usr/sbin/axell/common/current/cmd/get_rrc_message.sh '..params)
end)

defineCommand('msdhr', function (params)
   return runbin('/usr/sbin/axell/target/current/cmd/msdhr '..params)
end)


--defineCommand('change_serials_opers',function (params)
--        return runbin('/usr/sbin/axell/common/current/cmd/change_serials_opers.sh '..params)
--end)

--defineCommand('delete_serials_opers',function (params)
--        return runbin('/usr/sbin/axell/common/current/cmd/delete_serials_opers.sh '..params)
--end)

--- version upgrade
defineCommand('get_serial',function ()
        return runbin('/usr/sbin/axell/common/current/cmd/get_serial')
end)

defineCommand('batch_command',function (params)
        return runbin('/usr/sbin/axell/common/current/cmd/batch_command '..params)
end)

--- remote devmem 
--- defineCommand('devmem',function (params)
---        return runbin('/sbin/devmem'..params)
--- end)


--returns the current epoch (in int milliseconds)
defineCommand('now',function ()
	return math.floor( socket.gettime() * 1000 )
end)

--- This function ping the specified address and returns "ok" if it can ping,
--  nil plus an error if there is an error (bad ip, unreachable destination)
--  @return "ok" or nil plus an error value
defineCommand('pingip',function (ip)
	if not isIpAddress(ip) then return nil,"Invalid IP address: "..ip end
	--sends strictly one packet because of timing and also the 100% in the regular expression on the next line.
	local pingOutput,err=runbin("ping -c 1 "..ip)
	if not pingOutput then
		return nil,"Could not run ping: "..err
	end
	if pingOutput:find("100%% packet loss$") then
		return nil,"Destination unreachable: "..ip
	else
		return "ok"
	end
end)

--a cashed version of the help command
local HELP_CACHE="/tmp/commandcache_help.cashe"
defineCommand('help',function ()
	--try to return the help from the cache file
	local ret=getfile(HELP_CACHE)
	if not ret then
		ret=runaxsh("help")
		--cache the result
		setfile(HELP_CACHE,ret)
	end
	return ret
end)

---reboots the operating system or the web server
defineCommand('reboot',function (param)
	if param==nil or param=="" then
		return runbin("(sleep 1 && /sbin/reboot )&")
	elseif param=="force" then
		--the sleep is for having enough time to respond to client
		return runbin("(sleep 1 && /sbin/reboot -f )&")
	elseif param=="server" then
		return runbin('/etc/opt/axell/common/current/init.d/webmc restart')
	else
		return nil, "Invalid parameter for reboot: "..param
	end
end)

---Returns the current user name from the environment variable that is passed to CGI script
-- @return username or empty string (if it can't be looked up in the environment variable)
defineCommand('username',function ()
	return getEnv("REMOTE_USER")
end)

---Returns the IP address of the client
defineCommand('myip',function ()
	return getEnv("REMOTE_ADDR")
end)

---Returns the IP address of the server
defineCommand('clientip',function ()
	return getEnv("HTTP_HOST")
end)

---Returns the IP address of the server
defineCommand ('serverip', function ()
	return getEnv("HTTP_HOST")
end)

---GET command
--todo: deal with node number (pass @n as the second parameter to get). do the same with set and act
defineCommand('get',function (params, nodeNumber)
	local firstWord,therest=getfirstword(params)
	return attrcmd(nodeNumber,"get",firstWord,therest)
end)

---SET command
defineCommand('set',function (params, nodeNumber)
	local firstWord,therest=getfirstword(params)
	return attrcmd(nodeNumber,"set",firstWord,therest)
end)

---ACT command
defineCommand('act',function (params, nodeNumber)
	local firstWord,therest=getfirstword(params)
	return attrcmd(nodeNumber,"act",firstWord,therest)
end)

---Returns the output of the inf command for a certain attribute. Currently it uses the cache mechanism
-- set up using cacheinfo.lua script.
defineCommand('inf',function (attr)
	if attr==nil or trim(attr)=="" then return nil,"No attributes passed to inf command. Please use 'inf ATTR'" end
	local ret,err=runaxsh("inf "..attr:lower());
	if not ret then
		return nil,"Could not run the inf command: "..err
	else
		return ret
	end
end)


defineCommand('memutility',function (params)
	return app.memutility(params)
end)

--This is the faster version of alarmconfig --weblayout
defineCommand('alarmconfig',function (params)
	if params == nil or params == '' then
		return app.alarmconfig()
	elseif params == "--weblayout" then
		return app.alarmconfig("--weblayout")
	else
		return nil,"Invalid parameter: '"..params.."'"
	end
end)

defineCommand('runmulti',function ( params )
	local ret = ''
	for _,v in ipairs( splitQ( params ) ) do
		result = v
		ret = ret..' '..result
	end
	return ret
end)

--returning the list of all commands
defineCommand('commands', function ()
	res=""
	for validCommand in pairs(validCommands) do
		res=res..validCommand.." "
	end
	return res
end)

---returns cpu and memory usage information. It returns 3 numbers:
-- * total cpu utilization percentage
-- * percentage of used ram
-- * current system temperature in centigrade degrees
defineCommand('getsysstat', function ()
	--cpu usage
	local iostatOutput, err = runbin( 'iostat -c' )
	if not iostatOutput then
		return nil, 'Could not run the command to get CPU usage: '..err
	end
	local user,nice,system,iowait,steal,idle=iostatOutput:match( '(%d+%.%d+)%s+(%d+%.%d+)%s+(%d+%.%d+)%s+(%d+%.%d+)%s+(%d+%.%d+)%s+(%d+%.%d+)' )
	if not user then
		return nil, 'Could not parse the output of CPU usage command: '..err
	end
	local cpuUsage = user + nice + system + iowait + steal
	--memory usage
	local meminfo,err = getfile( '/proc/meminfo', false )
	if not meminfo then
		return nil, 'Could not read memory utilization: '..err
	end
	local totalMem,freeMem = meminfo:match( 'MemTotal:%s+(%d+).-MemFree:%s+(%d+)' )
	if not totalMem then
		return nil, 'Could not parse the output of Memory usage file: '..err
	end
	local memUsage = freeMem / totalMem*100
	--temperature
	local temps = attrcmd(nil,'get','tel',nil)
	if not temps then
		return nil, 'Could not read the temperature'
	end
	local temp = temps:match( '%S+')
	if not temp then
		return nil, 'Could not parse the temperature from the TEL attribute'
	end
	return string.format('%.1f %.1f %.1f',cpuUsage,memUsage,temp)
end)


targetlib = loadfile('/usr/sbin/axell/common/current/web/target/cgi/cmd.lua')
if targetlib ~= nil then
	targetlib()
end

t6lib = loadfile('/usr/sbin/axell/common/current/web/t6/cmd.lua')
if t6lib ~= nil then
	t6lib()
end

--runs one command and returns the result (or error)
function runCommand ( wholecmd )
	local res, err = '', nil
	--is this command allowed to run in web? (interactive commands and dangerous ones are not allowed)
	---What characters are not valid in the command string
	
   if( (wholecmd:match("^pictalk")==nil) and wholecmd:find("[;`|></\\&]")) then
		return nil,"Command includes invalid characters"
	end
	--is it a node command (commans with @N at the beginning)?
	local nodeNumber,cmd,params=wholecmd:match("^%s*(@%w+)%s+(%S+)%s*(.*)")
	--if it's not a node command, it is an ordinary command then!
	if nodeNumber==nil then
		cmd,params=wholecmd:match("%s*(%S+)%s*(.*)")
	end
	--those regular expressions will fail if the command is actually empty!
	if cmd==nil then
		return nil, "Command is empty (after looking up the node number)"
	end
	--Check if it's a valid command
	local cmdLower = cmd:lower()
	local cmdExecution=validCommands[cmdLower]
	if not cmdExecution then
		return nil, "Not a valid command: "..quote(cmdLower)
	end
	--if it is a function call it. Since the function may cause some unhandled error, the call is wrapped in a pcall()
	local pcallret,cmdresult,cmderr=pcall(cmdExecution,params,nodeNumber)
	if pcallret==false then--it was not a successfull pcall. An unhandled error happend.
		return nil,cmdresult--if pcall failes, the second return value contains error string
	elseif not cmdresult then--it is one of those nil,"error descriotion" errors coming from the code
		return nil,(cmderr or "unknown error when running the function wrapper")
	else
		return cmdresult--function executed with no error
	end
end
--parses the command string to find the commands that are separated by a '&' sign
function parseCommands( commands )
	local separator = '&'
	local ret = {}
	function add ( command )
		command = trim( command )
		if command ~="" then
			table.insert( ret, command )
		end
	end
	local start, stop = 1, commands:find( separator )
	while stop do
		add( commands:sub( start, stop - 1 ) )
		start = stop + 1
		stop = commands:find( separator, start )
	end
	--add the rest of the string
	add( commands:sub(start ) )
	return ret
end
module("cmd", package.seeall)
---this function will be called by WSAPI to send the response
-- it allows CORS requests for RESTful API access
local headers = {
	["Content-type"] = "text/plain",
	["Access-Control-Allow-Origin"] = "*"
}
local responseText = ""
local function send()
	coroutine.yield( responseText )
end
function successResponse( result )
	responseText = result
	return 200, headers, coroutine.wrap( send )
end
function errorResponse( errorMessage )
	responseText = "Web Error: "..errorMessage
	return 200, headers, coroutine.wrap( send )
end
---Receives the ajax request and replies it
function run(wsapi_env)
	---save the epoc time whenever a new command is received, a C program will read it and optimize the response time for remote nodes
	setfile('/tmp/run/axell/webepoc',"epocsec="..tostring(os.time()))
	--reset these values not to remember them between calls (it's going to run as FASTCGI so the variables hold their values)
	local res,err="",nil
	---the command and its parameters (including possible node number at the beginning)
	local wholecmd=nil
	local r = wsapi.request.new(wsapi_env or {})
   --check if the request object is valid
	if r==nil or (r.POST==nil and r.GET==nil) then
		return errorResponse( "Bad request" )
	end
      
	--the web interface works either if cmd parameter is passed as GET or POST parameter
	wholecmd=r.GET.cmd or r.POST.cmd
	--is cmd parameter is missing?
	if wholecmd==nil or wholecmd=="" then
		return errorResponse("cmd is missing from the request")
	end
	--is the cmd parameter empty?
	if wholecmd==nil or wholecmd=="" then
		return errorResponse("cmd is empty")
	end
	local results = nil
   local log_text=""
	for _,command in ipairs( parseCommands( wholecmd ) ) do
      log_text="#< " .. socket.gettime() .. "\n" .. command .. "\n"
      log_text = log_text .. "#user " .. username() .. "\n"
		local cmdRes, cmdErr = runCommand( command )
      log_text = log_text .. "#repl: " .. (cmdRes and cmdRes:match("Error:") and "Error" or "") .. "\n"
      log_text = log_text .. "#> " .. socket.gettime()
      print_execution_log(log_text)
		if cmdErr then
			return errorResponse(cmdErr)
		else
			if results then
				results = results..' '..cmdRes
			else
				results = cmdRes
			end
		end
	end
	return successResponse( results )
end

return _M
