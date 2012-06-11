/**
These classes convert a C++ class to and from a v8 JavaScript object.

They use Dr. Lawlor's "pup" pattern, so you need to declare your C++
objects with a "pup" function:

	class myClass {
	public:
		std::string name;
		std::vector<float> hatch;
		mySubClass sub;

		template <class PUP_er>
		friend void pup(PUP_er &p,myClass &v) {
			PUPf(name);
			PUPf(hatch);
			PUPf(sub);
		};
	};

Here we're using the "PUPf" helper macros to extract the field name
as a string (used to match the javascript object).

This is handy, for example, inside a node.js C++ plugin:

static Handle<Value> foo(const Arguments& args)
{
	myClass m; pup_object_from_v8(args[0],m); // convert to C++
	doStuff(m); // <- modifies class in C++
	return pup_object_to_v8(m); // back to v8
}

Dr. Orion Lawlor, lawlor@alaska.edu, 2012-06-07 (Public Domain)
*/
#ifndef __OSL_PUP_V8_H
#define __OSL_PUP_V8_H

#include <stdio.h> /* for error printouts */
#include <vector>
#include <string>

#include <v8.h>



/**
  Pup the value v's field x, using the name x, into the pup_er named p.
*/
#define PUPf(x) pup(p,#x,v.x);

/**
  Pup the variable x, using the name x, into the pup_er named p.
*/
#define PUPn(x) pup(p,#x,x);

/**
  Pup the comment c--this shows up as HTML code in the GUI.
*/
#define PUPc(commentString) p.comment(commentString)

/************** PUP a C++ object into a v8 v8::Handle<v8::Object> *************/
class pup_into_v8 {
public:
	typedef pup_into_v8 this_t;
	
	/* This is the current object being created.  It changes as we add fields. */
	v8::Handle<v8::Value> cur;
	pup_into_v8() {
		cur=v8::Object::New();
	}

	/* Default: ignore comments */
	virtual void comment(const std::string &s) { }
	
	/* Define how to pup floats, ints, and strings. */
	void pup(float &value) {
		cur=v8::Number::New(value);
	}
	friend void pup(this_t &p,float &v) {p.pup(v);}
	
	void pup(double &value) {
		cur=v8::Number::New(value);
	}
	friend void pup(this_t &p,double &v) {p.pup(v);}
	
	
	virtual void pup(int &value) {
		cur=v8::Integer::New(value);
	}
	friend void pup(this_t &p,int &v) {p.pup(v);}
	
	virtual void pup(std::string &value) {
		cur=v8::String::New(value.c_str());
	}
	friend void pup(this_t &p,std::string &v) {p.pup(v);}
};
	/* Recurse into a subobject, then add the subobject with this name. */
	template <class T>
	void pup(pup_into_v8 &p,const char *shortname,T &value) {
		v8::Handle<v8::Value> old=p.cur;
		p.cur=v8::Object::New(); /* try to make a new object (might be overwritten with value) */
		pup(p,value); /* overwrites p.cur */
		v8::Handle<v8::Value> sub=p.cur; 
		p.cur=old;
		p.cur->ToObject()->Set(v8::String::New(shortname),sub);
	}
	
	/* Pup's a bare std::vector as a JavaScript array */
	template <class T>
	void pup(pup_into_v8 &p,std::vector<T> &v) {
		int length=v.size();
		p.cur=v8::Array::New(length); /* <- blow away current value (to return bare array) */
		for (int i=0;i<length;i++) {
			char index[100];
			snprintf(index,100,"%d",i);
			pup(p,index,v[i]);
		}
	}

/* Pup an arbitrary C++ object (with pup functions) into a v8 value. */
template <class T>
v8::Handle<v8::Object> pup_object_into_v8(T& v)
{
	v8::HandleScope handle_scope;
	pup_into_v8 p; 
	pup(p,v);
	return handle_scope.Close(p.cur->ToObject());
}


/************ Pup into C++ from v8 **************/

	// This handy utility function stolen from the v8 "process.cc" example:
	// Convert a JavaScript string to a std::string.  To not bother too
	// much with string encodings we just use ascii.
	inline std::string ObjectToString(const v8::Handle<v8::Value> &value) {
	  v8::String::Utf8Value utf8_value(value);
	  return std::string(*utf8_value);
	}

// Utility function to dump an object's type.
inline const char *ObjectTypeString(v8::Handle<v8::Value> v) {
	if (v->IsNull()) return "null";
	if (v->IsUndefined()) return "undefined";
	if (v->IsString()) return "string";
	if (v->IsFunction()) return "function";
	if (v->IsArray()) return "array";
	if (v->IsObject()) return "object";
	if (v->IsBoolean()) return "boolean";
	if (v->IsNumber()) return "number";
	if (v->IsExternal()) return "external";
	if (v->IsInt32()) return "int32";
	if (v->IsUint32()) return "uint32";
	if (v->IsDate()) return "date";
	if (v->IsBooleanObject()) return "booleanObject";
	if (v->IsNumberObject()) return "numberObject";
	if (v->IsNativeError()) return "nativeError";
	if (v->IsRegExp()) return "regExp";
	return "type unknown by ObjectTypeString";
}

/* This exception class is thrown when a conversion fails */
class pup_failure {
public:
	const char *field,*error,*detail;
	v8::Handle<v8::Value> handle;
	pup_failure(const char *field_,const char *error_,const char *detail_,v8::Handle<v8::Value> handle_)
		:field(field_), error(error_), detail(detail_), handle(handle_) {}
	
	void print(void) {
		printf("Field '%s': %s (%s)\n", field,error,detail);
		printf("  v8::Object value: %s\n",ObjectToString(handle).c_str());
		printf("  v8::Object type: %s\n",ObjectTypeString(handle));
	}
};


/* This is the main conversion class */
class pup_from_v8 {
public:
	typedef pup_from_v8 this_t;
	v8::Handle<v8::Value> v; /* <- current value being analyzed.  Swapped at object boundaries. */
	pup_from_v8(v8::Handle<v8::Value> top) {v=top;}
	
	/* Get this field of this object.
	   If no such field exists, throw. */
	v8::Handle<v8::Value> get(const char *shortname)
	{
		if (!v->IsObject())
			throw new pup_failure(shortname,"not an object","",v);
			
		v8::Handle<v8::Value> ret=v->ToObject()->Get(v8::String::New(shortname));
		if (ret->IsUndefined() || ret->IsNull()) 
			throw new pup_failure(shortname,"missing object field","",v);
		return ret;
	}
	

	/* Default: ignore comments */
	virtual void comment(const std::string &s) { }
	
	/* Parse the current value as a double, or throw an error. */
	double double_value(void) {
		if (v->IsNumber()) {
			return v->ToNumber()->Value();
		} 
		else if (v->IsString()) { /* parse as string */
			double ret=0.0;
			std::string s=ObjectToString(v);
			if (1!=sscanf(s.c_str(),"%lg",&ret)) /* <- HACK!  Accepts 4.3abcd */
				throw new pup_failure("","cannot parse as number",s.c_str(),v);
			return ret;
		}
		else { /* what *is* this thing? */
			throw new pup_failure("","expected number or string","",v);
		}
	}

	/* Define how to pup floats, ints, and strings. */
	void pup(float &value) 
		{ value=(float)double_value(); }
	friend void pup(this_t &p,float &v) {p.pup(v);}
	
	void pup(double &value) 
		{ value=(double)double_value(); }
	friend void pup(this_t &p,double &v) {p.pup(v);}
	
	virtual void pup(int &value) 
		{ value=(int)double_value(); /* <- HACK!  Accepts 3.7 as an int. */ }
	friend void pup(this_t &p,int &v) {p.pup(v);}
	
	virtual void pup(std::string &value) {
		if (v->IsString()) { 
			value=ObjectToString(v);
		}
		else { /* what *is* this thing? */
			throw new pup_failure("","expected a string","",v);
		}
	}
	friend void pup(this_t &p,std::string &v) {p.pup(v);}
};

	/* Recurse into any named subfield. */
	template <class T>
	void pup(pup_from_v8 &p,const char *shortname,T &value) {
		v8::Handle<v8::Value> old=p.v;
		p.v=p.get(shortname); /* temporarily switch to sub-field */
		pup(p,value);
		p.v=old; /* back out to top */
	}

	/* Pup a v8 v8::Array into a std::vector */
	template <class T>
	void pup(pup_from_v8 &p,std::vector<T> &v) {
		if (!p.v->IsArray())
			throw new pup_failure("","expected an array","",p.v);
		v8::Handle<v8::Array> arr=p.v.As<v8::Array>();
		int length=arr->Length();
		v.resize(length);
		for (int i=0;i<length;i++) {
			p.v=arr->Get(i);
			pup(p,v[i]);
		}
		p.v=arr;
	}

/* Pup an arbitrary C++ object (with pup functions) out of a v8 value. */
template <class T>
void pup_object_from_v8(v8::Handle<v8::Value> src,T& dest)
{
	pup_from_v8 p(src->ToObject()); 
	pup(p,dest);
}


#endif
