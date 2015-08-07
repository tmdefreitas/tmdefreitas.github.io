"use strict";
//planets.js
console.log("Planets visualization");

//Epoch Info, J2000
var EPOCH_D0 = 2451545;

//Gravitational constant of the sun src: http://ssd.jpl.nasa.gov/?constants
var GM_SUN = 1.32712440018e20;
//Astronomical unit to meters
var AU = 149597870700;

//Visualization parameters
var svgWidth = 800;
var svgHeight = 800;
var Background = "#000";



//See http://www.stjarnhimlen.se/comp/tutorial.html for an explanation of parameters

class Orbit {
    constructor(a,e,i,O,w,L,Da,De,Di,DO,Dw,DL) {
        this.a = a; //Semi-major axis, in AU
        this.e = e; //eccentricity, unitless
        this.i = i; //inclination, radians
        this.O = O; //Omega, longitude of ascending node, radians
        this.w = w; //small omega, longitude of periapsis, radians
        this.L = L; //Mean longitude, radians
        
        //Centenial rates, how quickly planets change parameters
        this.Da = Da; //Cy^-1
        this.De = De; // "  "
        this.Di = Di; // rad/Cy
        this.DO = DO; // " "
        this.Dw = Dw; // " "
        this.DL = DL; // " "
        
        
    }
    //Orbital Period, in days
    orbital_period(){
        return 2*Math.PI*Math.sqrt(Math.pow(this.a*AU, 3)/GM_SUN)/86400;
    }
    
    //Rate of change of the mean_anomaly, in radians/day
    mean_motion(){
        return Math.PI*2 / this.orbital_period();        
    }
    
    //Returns a copy of this orbit with the new parameters, with updated mean anomaly.
    project_orbit(days){
        var Cy = getCyRelative(days);
        
        //Update changes based on centennial rates
        var aNew, eNew, iNew, ONew, wNew, LNew;
        aNew = this.a + Cy*this.Da;
        eNew = this.e + Cy*this.De;
        iNew = this.i + Cy*this.Di;
        ONew = this.O + Cy*this.DO;
        wNew = this.w + Cy*this.Dw;
        LNew = zeroTo2PI(this.L + Cy*this.DL +this.mean_motion()*days);
        
        //Return the new orbit
        return new Orbit(aNew, eNew, iNew, ONew, wNew, LNew,
                        this.Da, this.De, this.Di, this.DO, this.Dw, this.DL);
    }
    
    //Project the orbit on a given date by adding difference between epoch start
    project_orbit_on_date(year, month, day, hour, minute, second) {
        return project_orbit(getJulianDay(year, month, day, hour, minute, second) - EPOCH_D0);     
    }
      
    //Mean anomaly, does not change unless perturbed
    mean_anomaly(){
        var M = this.L - this.w;
        return zeroTo2PI(M);
    }
    
    //Calculated from mean anomaly
    eccentric_anomaly(){
        var EPSILON = 1e-5; //TODO: change this?
        var M = this.mean_anomaly();
        var E = M; // + this.e*Math.sin(M)*(1.0 + this.e*Math.cos(M));
        var Ep;
               
        do {
            Ep = E;
            E = M + this.e*Math.sin(Ep);//(Ep - this.e*Math.sin(Ep) - M)/(1 - this.e*Math.cos(Ep))
            
        } while ( Math.abs(E - Ep) > EPSILON);        
        return E;
    }
    
    //Calculate true anomaly from mean anomaly
    true_anomaly(){
        var E = this.eccentric_anomaly();
        var V = 2*Math.atan2(Math.sqrt(1+this.e)*Math.sin(E/2),Math.sqrt(1-this.e)*Math.cos(E/2));
        return zeroTo2PI(V);
    }
    
    //Calculates current orbital radius in terms of V above
    orbital_radius(){
        return this.a*(1 - Math.pow(this.e,2))/( 1 + this.e*Math.cos(this.eccentric_anomaly()));
    }
    
    //Returns an array of the cartesian coordinates, relative to the sun
    heliocentric_XYZ(){
        var R = this.orbital_radius();
        var V = this.true_anomaly();
        
        var X =  R * (Math.cos(this.O)*Math.cos(V + this.w - this.O) 
                    - Math.sin(this.O)*Math.sin(V + this.w - this.O)*Math.cos(this.i));
        
        var Y =  R * (Math.sin(this.O)*Math.cos(V + this.w - this.O) 
                    + Math.cos(this.O)*Math.sin(V + this.w - this.O)*Math.cos(this.i));
        
        var Z = R * (Math.sin(V + this.w - this.O)*Math.sin(this.i));
        
        return [X,Y,Z];
        
    }
    
       
}
//Convert a gregorian day into an integer Julian Date for the purposes of epochs
//https://en.wikipedia.org/wiki/Julian_day
function getJulianDay(year, month, day, hour, minute, second) {

    var a = Math.floor((14-month)/12);
    var y = year + 4800 - a;
    var m = month + 12*a - 3;
    var JDN = day + Math.floor((153*m + 2)/5) + 365*y + Math.floor(y/4) 
                    - Math.floor(y/100) + Math.floor(y/400) - 32045;
    
    var JD = JDN + (hour -12)/24 + minute/1440 + second/86400;
    
    return JD;
    
}

//Get the number of centuries since the beginning of the epoch, from an absolute time
function getCy(year, month, day, hour, minute, second){
    return (getJulianDay(year, month, day, hour, minute, second) - EPOCH_D0)/36525.0;
}

//Get the number of centuries, relative to the start of the epoch
function getCyRelative(days){
    return (days / 36525.0);
}

//Convert to/from radians
function toRadians(degrees){
    return degrees * (Math.PI/180);
}

function toDegrees(radians){
    return radians * (180 / Math.PI);
}

//Gives equivalent angle in the range 0-2pi
function zeroTo2PI(angle){
    var a = ((angle/(Math.PI*2)) % 1.0)*2*Math.PI;
    return (a >= 0) ? a : a + Math.PI *2;
    
}

var solar_system;

d3.tsv("/solar_system.tsv", function(d){
    return { Planet : d.Planet,
             orbit  : new Orbit(+d.a, +d.e, +d.i, +d.O, +d.w, +d.L, +d.da, +d.de, +d.di, +d.dO, +d.dw, +d.dL)};
    }, function(data){
        solar_system = data;
});

var svg = d3.select("#universe")
            .append("svg")
            .attr("height", svgHeight)
            .attr("width", svgWidth);

svg.append("rect")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("fill", "black");
    
        
