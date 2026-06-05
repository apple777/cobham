assert(delimitAll({},",","k")=="")
assert(delimitAll({},",","v")=="")
assert(delimitAll({},",")=="")
assert(delimitAll({1,2},",","v")=="1,2")
assert(delimitAll({10,20,30},",","v")=="10,20,30")
assert(delimitAll({10,20,30},",","k")=="1,2,3")
assert(delimitAll({10,20,30}," , ","v")=="10 , 20 , 30")
assert(delimitAll({a=10,b=20,c=30},",","k")=="a,c,b")--note: pairs function may randomize this order
assert(delimitAll({a=10,b=20,c=30},",","v")=="10,30,20")--note: pairs function may randomize this order
assert(delimitAll({a=10,b=20,c=30},",")=="a=10,c=30,b=20")--note: pairs function may randomize this order

splitted=split("hi man"," ")
for i=1,#splitted do
	print("splitted["..i.."]='"..splitted[i].."'")
end

print(tab2str(splitQ(theRest)))

function printstr(str) if str then print('"'..str..'"') else print "nil" end end
printstr(trim("  hello   "))
printstr(trim("hello     "))
printstr(trim("     hello"))
printstr(trim(" hello "))
printstr(trim("  hello kitty  "))
printstr(trim("hello     kitty"))
printstr(trim("     hellokitty    "))
printstr(trim(" hello    kitty"))
printstr(trim(""))
printstr(trim("     "))
printstr(trim("\t        \t"))

print(quote(12))
print(quote(true))
print(quote("hi"))
print(quote(""))
print(quote(nil))
--add an extra [ and ] to the following string for this test to work
print(quote([line1
line2
line3]))
print(quote("hello\nman"))
print(quote("hi\tbabe"))
print(quote('he said: "hi"'))

print(repquote(""))
print(repquote("hi\""))
print(repquote("hi\nhow are you?"))
print(repquote('he said: "hi"'))
print(repquote([=[This displays the value of the system event counter.

For each report or alarm being transmitted to the Avitec Element Manager, a]=]))
print(repquote("one tab\\tdistance"))
print(repquote([=[hello "kitty"!]=]))
print(repquote('"'))

assert(isIpAddress("1.1.1.1"))
assert(isIpAddress("255.1.1.1"))
assert(isIpAddress("255.255.0.0"))
assert(isIpAddress("1.0.0.0"))
assert(isIpAddress("255.255.255.255"))
assert(isIpAddress("1.0.0.1"))
assert(isIpAddress("1.0.1.1"))
assert(isIpAddress("1.1.1.1"))
assert(isIpAddress("1.2.3.4"))
assert(isIpAddress(nil)==nil)
assert(isIpAddress("")==nil)
assert(isIpAddress("1")==nil)
assert(isIpAddress("1.2")==nil)
assert(isIpAddress("1.2.3")==nil)
assert(isIpAddress("1.2.3.4.")==nil)
assert(isIpAddress(".1.2.3.4")==nil)
assert(isIpAddress("0")==nil)
assert(isIpAddress("-1")==nil)
assert(isIpAddress("256")==nil)
assert(isIpAddress("-1.2.3.4")==nil)
assert(isIpAddress("1.-2.3.4")==nil)
assert(isIpAddress("1.2.-3.4")==nil)
assert(isIpAddress("1.2.3.-4")==nil)
assert(isIpAddress("256.2.3.4")==nil)
assert(isIpAddress("1.256.3.4")==nil)
assert(isIpAddress("1.2.256.4")==nil)
assert(isIpAddress("1.2.3.256")==nil)
assert(isIpAddress("256.256.256.256")==nil)
assert(isIpAddress("1000.0.0.0")==nil)
assert(isIpAddress("a.b.c.d")==nil)
assert(isIpAddress("a.2.c.d")==nil)
assert(isIpAddress("a.b.3.d")==nil)
assert(isIpAddress("a.b.c.4")==nil)

print(getfirstword("  hi1 man2 how3 are4 you5 today6? 7"))
print(getfirstword("hi1"))
print(getfirstword(""))
print(getfirstword("123456789"))
print(getfirstword(" 1 2 3 4 5 6 7 8 9"))
