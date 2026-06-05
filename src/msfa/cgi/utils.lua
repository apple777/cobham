--- Returns an environment variable
function getEnv(varName)
	local ret= os.getenv(varName)
	if ret then
		return ret
	else
		return nil,"Error: cannot read parameter: "..varName
	end
end

---Contains all the utility functions that are needed by other algorithms that reply to a command
---Runs a command and returns its output (the text that program writes to stdout)
-- @param binpath the path of the binary program
function runbin(binpath)
	if binpath==nil or binpath:len()==0 then return nil,"Binary path (binpath argument) is nil or empty" end
	local f,err=io.popen(binpath,"r")
	if not f then return nil,"Could not create the process: "..err end
	local result,err=f:read("*all")
	f:close()
	if not result then return nil,"Could not read the output of the process: "..err end
	--if there is \n at the end, remove it
	result=result:gsub("\n*$","")
	return result
end

---Runs a command using the axsh command line application. it probably isn't used so often.
function runaxsh(cmd)
	return runbin("/usr/sbin/axell/common/current/sys/axsh "..cmd)
end

---Reads a text file and returns its entire contents
-- @param filepath the path of the text file
-- @param lines should the format of the reply be a table containing all lines or just one big string
-- @return if lines is false or nil, it returns a big string containing all the contents of the file
--         if lines is true, it returns a table (array) containing all the lines of the file in sequential order
function getfile(filepath,lines)
	if filepath==nil or filepath:len()==0 then return nil,"File path (filepath argument) is nil or empty" end
	local f,err=io.open(filepath,"r")
	if not f then return nil,"Could not open the file: "..err end
	local result,err=nil,nil
	if not lines then
		result,err=f:read("*all")
	else
		result={}
		while true do
			currLine=f:read("*line")
			if not currLine then break end
			table.insert(result,currLine)
		end
	end
	f:close()
	if not result then return nil,"Could not read the file contents: "..err end
	return result
end

---Writes an entire text file.
-- @param filepath the path of the text file
-- @param str the string to write to file.
--            It can be nil in which case an empty string will be written to the file.
--            make sure that it is in string format. For writing numbers and other formats use tonumber() to convert.
-- @return true if the operation was successful, nil+error if it fails
function setfile(filepath,str)
	if filepath==nil or filepath:len()==0 then return nil,"File path (filepath argument) is nil or empty" end
	str=str or ""
	local f,err=io.open(filepath,"w")
	if not f then return nil,"Could not access file to write: "..err end
	f:write(str)
	f:flush()
	f:close()
	return true
end

---reads an inf file and returns a table that contains key values
-- it ignores every line that starts with ";" (also if there are white spaces before ";")
-- the key and value will be trimmed that is: spaces at the start of the line and end of the line
-- and before and after the equal sign "=" will be ignored
function loadinf(fpath)
	local ret={}
	local contents,err=getfile(fpath)
	if not contents then return nil,"Could not open the inf file '"..fpath.."': "..err end
	local lines=split(contents,"\n")

	for _,l in ipairs(lines) do
		if not l:find("^%s*;") then
			key,val=l:match("(.*)=(.*)")
			if key and val then
				key=trim(key)
				val=trim(val)
				ret[key]=val
			end
		end
	end

	return ret
end

----------------------------------------------------------------------------------------------------------------------------
--- Puts a delimiter between all members of an table
--  @param table a table to put the delimiter between its elements
--  @param delimiter a string (can be anything even containing regular expressions) to put between elements
--  @param what (optional) what to use when creating the result? "k"=keys, "v"=values, anything else is both
--                         keys and values separated by an equal sign
function delimitAll(table,delimiter,what)
	local firstIteration=true
	local ret=""
	if what=="k" then
		--only use the keys
		for k,v in pairs(table) do
			if firstIteration then
				ret=k
				firstIteration=false
			else
				ret=ret..delimiter..k
			end
		end
	elseif what=="v" then
		--only use the values
		for k,v in pairs(table) do
			if firstIteration then
				ret=v
				firstIteration=false
			else
				ret=ret..delimiter..v
			end
		end
	else
		--use both keys and values separated by an equal sign "="
		for k,v in pairs(table) do
			if firstIteration then
				ret=k.."="..v
				firstIteration=false
			else
				ret=ret..delimiter..k.."="..v
			end
		end
	end
	return ret
end

---Separates a string str where the separator appears.
-- @param str the string to split. It can't be null
-- @param separator (OPTIONAL) the string that appears between the splitted elements. The default value is " " (one space)
--                  note: it shouldn't contain any regular expression (@see http://www.lua.org/pil/20.2.html).
-- @return an array of strings.
--Notes:
-- * the separator should not include any patterns meaningful for Lua. If for example you want to split
--   strings between "*" character, you should use "%*" as separator parameter
-- * if there are two or more consecutive occurances of separator, there will be empty strings between them
-- * if the string already ends with separator, there will be an empty string as the last returned element
-- * input strings (str and separator parameters) shouldn't be null
-- * if the input string is empty (not null, but the length is zero), the result will be one empty string
-- @param separator (OPTIONAL) the string that appears between the splitted elements. The default value is " " (one space)
--                  note: it shouldn't contain any regular expression (@see http://www.lua.org/pil/20.2.html).
function split(str,separator)
	local ret={}
	if str==nil or str=="" then --nothing to do!
		return ret
	elseif type(str)~="string" then --can't parse it!
		table.insert(ret,tostring(str))
		return ret
	end

	if not separator then separator=" " end
	local s=str..separator
	for m in s:gmatch("(.-)"..separator) do
		table.insert(ret,m)
	end
	return ret
end

---This is a special split function that treats the part inside quotation mark as one element.
-- For example, split('hello "beautiful world"') will return 'hello', '"beautiful' and 'world"'.
-- But this function returns 'hello' and 'beautiful world'. notice how it removed the double-quotes
-- from the results as well
-- @return a table containing all the split elements. The table can be empty if the string doesn't have any
--         elements but it will not be null
function splitQ(str)
	local ret={}
	if str==nil or str=="" then --nothing to do!
		return ret
	elseif type(str)~="string" then --can't parse it!
		table.insert(ret,tostring(str))
		return ret
	end

	local currPos=1
	local parameter

	repeat
		--look for the first non-space character after currPos
		local paramStart,paramEnd=str:find('%S+',currPos)
		if not paramStart then break end
		--if the first character is a quote, look for the end quote
		if str:sub(paramStart,paramStart)=='"' then
			paramStart,paramEnd=str:find('"[^"]+"',currPos)
			if not paramStart then return nil,"Quotation mark opened but isn't closed" end
			--to remove the begining and trailing quotation marks!
			parameter=str:sub(paramStart+1,paramEnd-1)
		else
			parameter=str:sub(paramStart,paramEnd)
		end
		--now increase currPos to point to the next character ready to be parsed
		currPos=paramEnd+1
		table.insert(ret,parameter)
	until false
	return ret
end

---removes any leading or trailing space characters (all the things recognizable with %s in Lua)
-- Notes:
-- * if the str is nil, it will be treated as empty string.
function trim(str)
	if not str then return "" end
	if type(str)~="string" then return str end
	return str:match("^%s*(.-)%s*$")
end

---Surrounds a string with quotation marks and returns it.
-- Note: If the string is null, it returns the word nil without quotations
function quote(str)
	if type(str)~="string" then return tostring(str) end
	if not str then return "nil" end
	str=str:gsub(".",{
		["\""]='\\"',
		["\a"]="\\a",
		["\b"]="\\b",
		["\f"]="\\f",
		["\n"]="\\n",
		["\r"]="\\r",
		["\t"]="\\t",
		["\v"]="\\v",
	})
	return '"'..str..'"'
end

---replaces quotation marks (") with (\") so that the string can be saved as a Lua string in code files
function repquote(str)
	if not str then return "nil" end
	--replace \ with \\
	str=str:gsub('\\','\\\\')
	return '[['..str..']]'
end

---checks if a string represents an ip address
-- an IP address is in the form of A.B.C.D (there can be spaces between number and dots)
-- 0<A<=255, 0<=B<=255, 0<=C<=255, 0<=D<=255
-- @return nil if it is not an IP address, or returns 4 numbers which represent the pars of the IP address
function isIpAddress(ip)
	if not ip then return nil end
	local a,b,c,d=ip:match("^%s*(%d%d?%d?)%s*%.%s*(%d%d?%d?)%s*%.%s*(%d%d?%d?)%s*%.%s*(%d%d?%d?)%s*$")
	a,b,c,d=tonumber(a),tonumber(b),tonumber(c),tonumber(d)
	if not a or not b or not c or not d then return nil end
	if a<=0 or 255<a then return nil end
	if b<0 or 255<b then return nil end
	if c<0 or 255<c then return nil end
	if d<0 or 255<d then return nil end
	return a,b,c,d
end

---Returns the first word of a string. It also returns the rest of the string as the second return value
function getfirstword(str)
	if type(str)~="string" then return "","" end
	firstword,therest=str:match("%s*(%S*)%s*(.-)%s*$")
	if not firstword then
		return ""
	else
		return firstword,therest
	end
end