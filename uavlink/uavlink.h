


#ifndef __UAF_UAVLINK_H
#define __UAF_UAVLINK_H

#include <vector>
#include <string>
using std::vector;
using std::string;

/***** These classes are shared with JavaScript via the pup_v8 magic.
   Any time you update these classes, you NEED to update the pup functions! */
#define UAV_UNKNOWN -999

typedef string vehicle_id; ///< unique identifier for this vehicle (a tail number).

/// This represents a geodetic location in 3D.
class geo_location {
public:
	double lat, lon; ///< In decimal degrees.  Negative means degrees south or west.
	float alt; ///< Altitude, in meters above sea level
	
	geo_location() {lat=lon=UAV_UNKNOWN; alt=(float)UAV_UNKNOWN;}
};

/// This represents a cube of allowed locations in 3D.
class geo_area {
public:
	geo_location min,max; ///< Corners of 3D cube.  Anything between min and max is inside the area.
};

/// This represents the state of one battery, either on the ground station or vehicle.
class battery_state {
public:
	float percent; ///< percent state-of-charge, 0-100.  -999 if unknown.
	float voltage; ///< raw battery voltage, in volts.  -999 if unknown.
	float current; ///< electrical current flowing into battery, in amperes.  Negative indicates discharging; positive indicates charging.  -999 if unknown.
	
	battery_state() {percent=voltage=current=(float)UAV_UNKNOWN;}
};

/// This represents the state of one RF communications link.
class link_state {
public:
	float percent; ///< percent link quality, from 100% (no drops) to 0% (no carrier).  -999 if unknown.
};

/// This class summarizes the state of one ground station.
class ground_state {
public:
	string id; ///< Name of this ground station.

	vector<vehicle_id> vehicles; ///< list of all vehicles currently connected to base station.
	
	geo_location location; ///< Last known GPS fix on ground station (or -999 if unknown)
	
	battery_state ground_battery; ///< state of ground station's battery.
};



/// This summarizes the curent state of a vehicle.
class vehicle_state : public geo_location {
public:
	double time; ///< Measurement time, in seconds since January 1, 1970
	float roll, pitch, yaw; ///< in degrees. 0 0 0 is level, while headed due north
	
	link_state link; ///< Current communication link quality
	battery_state battery; ///< Current battery state
};

/// A waypoint is one location to reach during a mission.
class vehicle_waypoint : public geo_location {
public:
	float radius; ///< accuracy when the waypoint counts as 'reached', in meters.
	float loiter; ///< time to loiter at this waypoint, in seconds.  0 means no loiter.
	
	/**
	  Action describes what to do when this waypoint is reached.
	  This is translated to the MAVLINK MAV_CMD parameter.
	  Options include:
		- "go" or empty string: continue to next waypoint, or return to base if at end.
		- "stop": loiter here indefinitely.
		- "land": execute landing procedure.
		- "takeoff": execute takeoff procedure.
		- "payload": activate the payload sensor.
	*/
	string action;
};

/// A mission is just a series of waypoints.
class vehicle_mission {
public:
	std::vector<vehicle_waypoint> waypoints;
};

/// This summarizes the state and mission of a vehicle.
class vehicle {
public:
	vehicle_id id;
	string user; ///< Current vehicle operator, or empty string if no operator.
	
	vehicle_state current; ///< last known state of vehicle (you can accumulate these to track history)
	
	vehicle_mission mission; ///< Current mission.
	geo_area allowed; ///< Current safe zone (bounding box for all missions)
};


/******************** Interrogation (get) functions *********************/

/**
 Return the ground station's current state, including all visible UAVs.
*/
ground_state ground_get(void); ///< return the ground stations' current state

/**
 Return everything we know about a given vehicle.
 This call never blocks, it just returns what we currently know.
*/
vehicle vehicle_get(const vehicle_id &id); 

/******************** Communication (set) functions **********************/

/**
 Upload a new operator to the vehicle.
 Sends a MAVLINK CHANGE_OPERATOR_CONTROL (#5), and waits for
 a MAVLINK CHANGE_OPERATOR_CONTROL_ACK (#6) message back.
 
 Return values: empty string for success, or MAVlink errors:
   -1: lost communication.
    1: NACK: Wrong passkey. 
    2: NACK: Unsupported passkey encryption method.
 
 Note we don't do anything fancy with this--you need to do authentication
 and access control checks at a higher level before calling this.
*/
string vehicle_set_operator(const vehicle_id &id, const string &new_operator, const string &passkey); 


/**
 Upload a new mission, which will be fed to the vehicle.  
 
 See http://qgroundcontrol.org/mavlink/waypoint_protocol for upload process.
 
 Returns a string: empty string means success, otherwise it describes the error.
*/
string vehicle_set_mission(const vehicle_id &id, const vehicle_mission &mission); 




#endif
