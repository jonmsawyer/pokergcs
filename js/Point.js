/**
 * File: Point.js
 * 
 * Adapted from the original OpenLayers example by Bill Thoen <bthoen@gisnet.com>.
 * Original example is located here: http://206.168.217.244/gallery/lib/Point.js
 */

/**
 * Exports: Node.js Point
 *
 * In node.js:
 * ===========
 * var Point = require("./js/Point.js");
 * var p1 = new Point(-174, 65); // Fairbanks
 * var p2 = new Point(-175, 66); // Northwest of Fairbanks
 * sys.puts(p1.geoDistanceTo(p2, 'nmi')); // 64.9964588315317
 *
 * In browser:
 * ===========
 * <script src="/js/Point.js"></script>
 * var p1 = new Point(-174, 65); // Fairbanks
 * var p2 = new Point(-175, 66); // Northwest of Fairbanks
 * $('someDiv').innerHTML = p1.geoDistanceTo(p1, 'nmi'); // 64.9964588315317
 */
exports = module.exports = Point;

/**
 * Function: Point
 *
 * Parameters:
 * x - {float} X coordinate
 * y - {float} Y coordinate
 */
function Point(x, y) {
    this.x = parseFloat(x);
    this.y = parseFloat(y);
}

/**
 * Method: isValid
 *
 * Return true if the <Point> is valid, false otherwise.
 */
Point.prototype.isValid = function() {
    if (this.x != null &&
        this.y != null && 
        this.x != NaN &&
        this.y != NaN) {
            return true;
    }
    else {
        return false;
    }
}

/**
 * Method: geoIsValid
 *
 * Return true if the <Point> is a valid geographic coordinate, false otherwise.
 */
Point.prototype.geoIsValid = function() {
    if (this.isValid() &&
        this.x >= -180 &&
        this.x <= 180 &&
        this.y >= -90 && 
        this.y <= 90) {
            return true;
    }
    else {
        return false;
    }
}

/**
 * Constants: Geographic Constants
 *
 * EARTH_RADIUS_MI - {float} The radius of the earth in miles.
 * EARTH_RADIUS_KM - {float} The radius of the earth in kilometers.
 * EARTH_RADIUS_NMI - {float} The radius of the earth in nautical miles.
 * EARTH_RADIUS - {float} The default radius of the earth (kilometers).
 * DEG2RAD - {float} The factor to convert degrees to radians (PI/180).
 * RAD2DEG - {float} The factor to convert radians to degrees (180/PI).
 */
Point.EARTH_RADIUS_MI = 3958.761;   // in miles (According to IUGG)
Point.EARTH_RADIUS_KM = 6371.009;   // in kilometers (According to IUGG)
Point.EARTH_RADIUS_NMI = 3440.069;   // in nautical miles (According to IUGG).
Point.EARTH_RADIUS = Point.EARTH_RADIUS_KM // default radius
Point.DEG2RAD =  0.01745329252;  // factor to convert degrees to radians (PI/180)
Point.RAD2DEG = 57.29577951308;

/**
 * Method: geoDistanceTo
 *
 * Parameters:
 * point - {<Point>}
 *
 * Returns:
 * Great Circle distance (in miles) to Point. Coordinates must be in decimal
 * degrees.
 *
 * Reference:
 * Williams, Ed, 2000, "Aviation Formulary V1.43" web page
 * http://williams.best.vwh.net/avform.htm
 */
Point.prototype.geoDistanceTo = function(point, units) {
    var x = [];
    var y = [];
    var radius = 0;
    
    // Calculate the radius of the earth used
    if (units && units.toLowerCase() == 'km') { radius = Point.EARTH_RADIUS_KM; }
    else if (units && units.toLowerCase() == 'mi') { radius = Point.EARTH_RADIUS_MI; }
    else if (units && units.toLowerCase() == 'nmi') { radius = Point.EARTH_RADIUS_NMI; }
    else { radius = Point.EARTH_RADIUS_KM }
    
    if (this.geoIsValid() && point.geoIsValid()) {
        x[0] = this.x * Point.DEG2RAD;     y[0] = this.y * Point.DEG2RAD;
        x[1] = point.x * Point.DEG2RAD;    y[1] = point.y * Point.DEG2RAD;
        
        var a = Math.pow(Math.sin((y[1] - y[0]) / 2.0), 2);
        var b = Math.pow(Math.sin((x[1] - x[0]) / 2.0), 2);
        var c = Math.pow((a + Math.cos(y[1]) * Math.cos(y[0]) * b), 0.5);
        
        return 2 * Math.asin(c) * radius;
    } else {
        return null;
    }
}

/**
 * Method: geoBearingTo
 *
 * Return the bearing from 'this' to the 'point' given. Degrees are off North.
 *
 * Parameters:
 * point - {<Point>} The point to retreive the bearing _to_.
 *
 * Return:
 * {float} Degrees off North.
 */
Point.prototype.geoBearingTo = function(point) {
    var x = new Array(2);
    var y = new Array(2);
    var bearing;
    var adjust;
    
    if (this.geoIsValid() && point.geoIsValid()) {
        x[0] = this.x * Point.DEG2RAD;     y[0] = this.y * Point.DEG2RAD;
        x[1] = point.x * Point.DEG2RAD;    y[1] = point.y * Point.DEG2RAD;
        
        var a = Math.cos(y[1]) * Math.sin(x[1] - x[0]);
        var b = Math.cos(y[0]) * Math.sin(y[1]) - Math.sin(y[0]) 
              * Math.cos(y[1]) * Math.cos(x[1] - x[0]);
        
        if ((a == 0) && (b == 0)) {
            bearing = 0;
            return bearing;
        }
        
        if (b == 0) {
            if (a < 0)  
                bearing = 270;
            else
                bearing = 90;
            return bearing;
        }
         
        if (b < 0) 
            adjust = Math.PI;
        else {
            if (a < 0) 
                adjust = 2 * Math.PI;
            else
                adjust = 0;
        }
        
        bearing = (Math.atan(a/b) + adjust) * Point.RAD2DEG;
        return bearing;
    } else {
        return null;
    }
}


/**
 * Method: geoWaypoint
 *
 * Return the <Point> generated from the given 'distance' and 'bearing'.
 *
 * Parameters:
 * distance - {float} The distance from 'this' <Point>.
 * bearing - {float} The degrees off North from 'this' <Point>.
 * units - {string} One of 'km', 'mi', or 'nmi'. The units to use when calculating
 *         distance. Default is 'km'.
 *
 * Return:
 * {<Point>} The generated point.
 */
Point.prototype.geoWaypoint = function(distance, bearing, units) {
var wp = new Point( 0, 0 );
var radius = 0;
    
    // Calculate the radius of the earth used
    if (units && units.toLowerCase() == 'km') { radius = Point.EARTH_RADIUS_KM; }
    else if (units && units.toLowerCase() == 'mi') { radius = Point.EARTH_RADIUS_MI; }
    else if (units && units.toLowerCase() == 'nmi') { radius = Point.EARTH_RADIUS_NMI; }
    else { radius = Point.EARTH_RADIUS_KM }
    
    // Math.* trig functions require angles to be in radians
    var x = this.x * Point.DEG2RAD;
    var y = this.y * Point.DEG2RAD;
    var radBearing = bearing * Point.DEG2RAD;
    
    // Convert arc distance to radians
    var c = distance / radius;
    
    wp.y = Math.asin(Math.sin(y) * Math.cos(c) + Math.cos(y) * Math.sin(c)
         * Math.cos(radBearing)) * Point.RAD2DEG;
    
    var a = Math.sin(c) * Math.sin(radBearing);
    var b = Math.cos(y) * Math.cos(c) - Math.sin(y) * Math.sin(c)
          * Math.cos(radBearing)
    
    if (b == 0) {
        wp.x = this.x;
    }
    else {
        wp.x = this.x + Math.atan(a/b) * Point.RAD2DEG;
    }
    
    return wp;
}

