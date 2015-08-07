#convert_planets.py

INFILE = "planets.tsv"
OUTFILE = "solar_system.tsv"

from math import pi

def toRadiansFromDegrees(deg):
	return (deg / 180.0) * pi

def toRadiansFromArcSec(asec):
	return (asec / 3600.0 / 360.0) * 2 * pi

def convert_line(planet):
	items = planet.split('\t')

	result = []		
	##Planet name, a and e do not need to be fixed
	result.append(items[0])
	result.append(items[1])
	result.append(items[2])

	#i, O, w, and L need to be converted from degrees
	result.append(str(toRadiansFromDegrees(float(items[3]))))
	result.append(str(toRadiansFromDegrees(float(items[4]))))
	result.append(str(toRadiansFromDegrees(float(items[5]))))
	result.append(str(toRadiansFromDegrees(float(items[6]))))

	#da and de do not need to be changed
	result.append(items[7])
	result.append(items[8])

	#Convert di, dO, dw and dL from arcseconds
	result.append(str(toRadiansFromArcSec(float(items[9]))))
	result.append(str(toRadiansFromArcSec(float(items[10]))))
	result.append(str(toRadiansFromArcSec(float(items[11]))))
	result.append(str(toRadiansFromArcSec(float(items[12]))))

	return "\t".join(result)

inf = open(INFILE, "r")
outf = open(OUTFILE, "w")

lines = inf.readlines()

outf.write(lines[0])
for line in lines[1:]:
	outf.write(convert_line(line)+'\n')

inf.close()
outf.close()