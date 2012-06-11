/**
 Communication between Node.js and a set of UAVs.
 This is used by the UAF Ground Station Control Software architecture.
 
 
 
 Dr. Orion Lawlor, lawlor@alaska.edu, 2012-06-10 (Public Domain)
*/

#include <iostream>
#include "pup_v8.h" /* Dr. Lawlor's C++/v8 interop library */
#include <v8.h>
#include <node.h>
#include <map>

using namespace node;
using namespace v8;

#include <stdlib.h> /* for "exit" */

#include "uavlink.h"

/* Generic error handling function.  
   Debug mode: exits on any error.
   Flight mode: continues on any error. 
*/
void bad(const std::string &what) {
	std::cerr<<"Error: "<<what<<"\n";
	exit(1);
}


/*** There's *one* inheritable class here: "virtual_vehicle".
  Various instances include simulated vehicles, 
  vehicles connected via MAVlink, or the net, etc.
*/
class virtual_vehicle : public vehicle {
public:
	virtual_vehicle(); /* constructor initializes everything to unknown. */
	virtual ~virtual_vehicle(); /* disconnect */
	virtual void progress(void); /* update communications, if possible. */
	virtual string set_operator(const string &new_operator, const string &passkey);
	virtual string set_mission(const vehicle_mission &mission);
}
;
/* constructor initializes everything to unknown. */
virtual_vehicle::virtual_vehicle()
{
	id="Uninitialized";
	user="";
	current.time=UAV_UNKNOWN;
	current.roll=current.pitch=current.yaw=UAV_UNKNOWN;
	current.link.percent=UAV_UNKNOWN;
	
	/* No mission yet. */
	mission.waypoints.resize(0);
	
	/* Whole-earth box allowed */
	allowed.min.lat=-90.0;
	allowed.min.lon=-180.0;
	allowed.min.alt=-10000.0;
	allowed.max.lat=+90.0;
	allowed.max.lon=+180.0;
	allowed.max.alt=20000.0;
}
virtual_vehicle::~virtual_vehicle() { /* destructor */ }

void virtual_vehicle::progress(void) /* update communications, if possible. */
{ /* does nothing--all the action is in the subclasses. */ }
string virtual_vehicle::set_operator(const string &new_operator, const string &passkey)
{	return "Operator login("+new_operator+","+passkey+") on invalid vehicle ID."; }
string virtual_vehicle::set_mission(const vehicle_mission &mission)
{	return "Set mission called on invalid vehicle ID."; }


/**************** Ground Station ***************
  These variables represent our knowledge of the world.
  The vision is they're polled by the UI components, and 
  incrementally updated by the MAVlink thread.
*/
class ground_station {
	ground_state ground;
	virtual_vehicle invalid_vehicle;
	typedef std::map<vehicle_id,virtual_vehicle *> vehicles_map;
	vehicles_map vehicles;
#define for_each_vehicle(ptrname,code) \
	for (vehicles_map::iterator vit=vehicles.begin();vit!=vehicles.end();++vit) \
	{\
		virtual_vehicle *ptrname=vit->second; \
		code; \
	}\
	
	
public:
	ground_station() { /* First-time setup. */
		ground.id="Ground Station 1"; /* from a config file?  DB? */
	}
	
	/* Return the current list of visible vehicles. */
	ground_state get_ground(void) {
		ground.vehicles.resize(0);
		for_each_vehicle(v,ground.vehicles.push_back(v->id));
		return ground;
	}
	
	/**
	 Return everything we know about a given vehicle.
	 This call never blocks, it just returns what we currently know.
	*/
	virtual_vehicle &get_vehicle(const vehicle_id &id) {
		virtual_vehicle *v=vehicles[id];
		if (v==NULL) {
			bad("Invalid vehicle ID "+id);
			return invalid_vehicle;
		}
		v->progress();
		return *v;
	}
	
};

ground_station station;


/******************** Interrogation (get) functions *********************/

/**
 Return the ground station's current state, including all visible UAVs.
*/
ground_state ground_get(void) ///< return the ground stations' current state
{
	return station.get_ground();
}

/**
 Return everything we know about a given vehicle.
 This call never blocks, it just returns what we currently know.
*/
vehicle vehicle_get(const vehicle_id &id)
{
	return station.get_vehicle(id);
}


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
string vehicle_set_operator(const vehicle_id &id, const string &new_operator, const string &passkey)
{
	return station.get_vehicle(id).set_operator(new_operator,passkey);
}


/**
 Upload a new mission, which will be fed to the vehicle.  
 
 See http://qgroundcontrol.org/mavlink/waypoint_protocol for upload process.
 
 Returns a string: empty string means success, otherwise it describes the error.
*/
string vehicle_set_mission(const vehicle_id &id, const vehicle_mission &mission)
{
	return station.get_vehicle(id).set_mission(mission);
}



/*********** PUP functions for uavlink classes *********
 CAUTION: whenever you update the uavlink.h classes, these
 need to be updated too!
*/

template <class PUP_er>
void pup(PUP_er &p,geo_location &v) {
	PUPf(lat);PUPf(lon);PUPf(alt);
}
template <class PUP_er>
void pup(PUP_er &p,geo_area &v) {
	PUPf(min);PUPf(max);
}
template <class PUP_er>
void pup(PUP_er &p,battery_state &v) {
	PUPf(percent);PUPf(voltage);PUPf(current);
}
template <class PUP_er>
void pup(PUP_er &p,link_state &v) {
	PUPf(percent);
}
template <class PUP_er>
void pup(PUP_er &p,ground_state &v) {
	PUPf(id);PUPf(vehicles);PUPf(location); PUPf(ground_battery);
}
template <class PUP_er>
void pup(PUP_er &p,vehicle_state &v) {
	PUPf(lat);PUPf(lon);PUPf(alt);
	PUPf(roll);PUPf(pitch);PUPf(yaw);
	PUPf(link);
	PUPf(battery);
}
template <class PUP_er>
void pup(PUP_er &p,vehicle_waypoint &v) {
	PUPf(lat);PUPf(lon);PUPf(alt);
	PUPf(radius);
	PUPf(loiter);
	PUPf(action);
}
template <class PUP_er>
void pup(PUP_er &p,vehicle_mission &v) {
	PUPf(waypoints);
}
template <class PUP_er>
void pup(PUP_er &p,vehicle &v) {
	PUPf(id);
	PUPf(user);
	PUPf(current);
	PUPf(mission);
	PUPf(allowed);
}


/* Adapt functions from C++ to v8 syntax. */
void arg_failure(pup_failure *p) { 
	p->print();
	bad("Unexpected object passed in from v8 to C++.");
}

template <class Tret> // taking no arguments
inline Handle<Value> cpp_to_v8(Tret (*fn)(void),const Arguments& args) 
{
	Tret r=fn();
	return pup_object_into_v8(r);
}
template <class Tret,class T0> // taking 1 argument
inline Handle<Value> cpp_to_v8(Tret (*fn)(const T0 &a0),const Arguments& args) 
{
	T0 a0;
	try {
		pup_object_from_v8(args[0],a0);
		Tret r=fn(a0);
		return pup_object_into_v8(r);
	}
	catch (pup_failure *p) { arg_failure(p); }
	return v8::Null();
}
template <class Tret,class T0,class T1> // taking 2 arguments
inline Handle<Value> cpp_to_v8(Tret (*fn)(const T0 &a0,const T1 &a1),const Arguments& args) 
{
	T0 a0;
	T1 a1;
	try {
		pup_object_from_v8(args[0],a0);
		pup_object_from_v8(args[1],a1);
		Tret r=fn(a0,a1);
		return pup_object_into_v8(r);
	}
	catch (pup_failure *p) { arg_failure(p); }
	return v8::Null();
}
template <class Tret,class T0,class T1,class T2> // taking 3 arguments
inline Handle<Value> cpp_to_v8(Tret (*fn)(const T0 &a0,const T1 &a1,const T2 &a2),const Arguments& args) 
{
	T0 a0;
	T1 a1;
	T2 a2;
	try {
		pup_object_from_v8(args[0],a0);
		pup_object_from_v8(args[1],a1);
		pup_object_from_v8(args[2],a2);
		Tret r=fn(a0,a1,a2);
		return pup_object_into_v8(r);
	}
	catch (pup_failure *p) { arg_failure(p); }
	return v8::Null();
}



/*********** v8 callable Functions *****************/

static Handle<Value> v8_ground_get(const Arguments& args)
	{	return cpp_to_v8(ground_get,args);	}
static Handle<Value> v8_vehicle_get(const Arguments& args)
	{	return cpp_to_v8(vehicle_get,args);	}

static Handle<Value> v8_vehicle_set_operator(const Arguments& args)
	{	return cpp_to_v8(vehicle_set_operator,args);	}
static Handle<Value> v8_vehicle_set_mission(const Arguments& args)
	{	return cpp_to_v8(vehicle_set_mission,args);	}

extern "C" void init(Handle<Object> target)
{
	NODE_SET_METHOD(target, "ground_get", v8_ground_get);
	NODE_SET_METHOD(target, "vehicle_get", v8_vehicle_get);
	NODE_SET_METHOD(target, "vehicle_set_operator", v8_vehicle_set_operator);
	NODE_SET_METHOD(target, "vehicle_set_mission", v8_vehicle_set_mission);
}
