/**
 * File: server.js
 * Author: Rayjan Wilson
 * Copyright: 2012, Poker Flat Research Range, University of Alaska Fairbanks
 * License: MIT License
 */

// Include the necessary modules.
var sys = require( "util" );
var http = require( "http" );
var url = require( "url" );
var path = require( "path" );
var fileSystem = require( "fs" );
 
 
// ---------------------------------------------------------- //
// ---------------------------------------------------------- //
 
 
// Create an instance of the HTTP server.
var server = http.createServer(
	function( request, response ){
 
		// Get the requested "script_name". This is the part of the
		// path after the server_name.
		var scriptName = request.url;
 
		// Convert the script name (expand-path) to a physical file
		// on the local file system.
		var requestdFilePath = path.join( process.cwd(), scriptName );
 
		// Read in the requested file. Remember, since all File I/O
		// (input and output) is asynchronous in Node.js, we need to
		// ask for the file to be read and then provide a callback
		// for when that file data is available.
		//
		// NOTE: You can check to see if the file exists *before* you
		// try to read it; but for our demo purposes, I don't see an
		// immediate benefit since the readFile() method provides an
		// error object.
		fileSystem.readFile(
			requestdFilePath,
			"binary",
			function( error, fileBinary ){
 
				// Check to see if there was a problem reading the
				// file. If so, we'll **assume** it is a 404 error.
				if (error){
 
					// Send the file not found header.
					response.writeHead( 404 );
 
					// Close the response.
					response.end();
 
					// Return out of this guard statement.
					return;
 
				}
 
				// If we made it this far then the file was read in
				// without a problem. Set a 200 status response.
				response.writeHead( 200 );
 
				// Serve up the file binary data. When doing this, we
				// have to set the encoding as binary (it defaults to
				// UTF-8).
				response.write( fileBinary, "binary" );
 
				// End the response.
				response.end();
 
			}
		);
 
	}
);
 
// Point the server to listen to the given port for incoming
// requests.
server.listen( 8080 );
 
 
// ---------------------------------------------------------- //
// ---------------------------------------------------------- //
 
 
// Create a local memory space for further now-configuration.
(function(){
 
	// Now that we have our HTTP server initialized, let's configure
	// our NowJS connector.
	var nowjs = require( "now" );
 
 
	// After we have set up our HTTP server to serve up "Static"
	// files, we pass it off to the NowJS connector to have it
	// augment the server object. This will prepare it to serve up
	// the NowJS client module (including the appropriate port
	// number and server name) and basically wire everything together
	// for us.
	//
	// Everyone contains an object called "now" (ie. everyone.now) -
	// this allows variables and functions to be shared between the
	// server and the client.
	var everyone = nowjs.initialize( server );
 
 
	// Create primary key to keep track of all the clients that
	// connect. Each one will be assigned a unique ID.
	var primaryKey = 0;
 
 
	// When a client has connected, assign it a UUID. In the
	// context of this callback, "this" refers to the specific client
	// that is communicating with the server.
	//
	// NOTE: This "uuid" value is NOT synced to the client; however,
	// when the client connects to the server, this UUID will be
	// available in the calling context.
	everyone.connected(
		function(){
			this.now.uuid = ++primaryKey;
		}
	);
 
 
	// Add a broadcast function to *every* client that they can call
	// when they want to sync the position of the draggable target.
	// In the context of this callback, "this" refers to the
	// specific client that is communicating with the server.
	everyone.now.syncPosition = function( position ){
 
		// Now that we have the new position, we want to broadcast
		// this back to every client except the one that sent it in
		// the first place! As such, we want to perform a server-side
		// filtering of the clients. To do this, we will use a filter
		// method which filters on the UUID we assigned at connection
		// time.
		everyone.now.filterUpdateBroadcast( this.now.uuid, position );
 
	};
 
 
	// We want the "update" messages to go to every client except
	// the one that announced it (as it is taking care of that on
	// its own site). As such, we need a way to filter our update
	// broadcasts. By defining this filter method on the server, it
	// allows us to cut down on some server-client communication.
	everyone.now.filterUpdateBroadcast = function( masterUUID, position ){
 
		// Make sure this client is NOT the same client as the one
		// that sent the original position broadcast.
		if (this.now.uuid == masterUUID){
 
			// Return out of guard statement - we don't want to
			// send an update message back to the sender.
			return;
 
		}
 
		// If we've made it this far, then this client is a slave
		// client, not a master client.
		everyone.now.updatePosition( position );
 
	};
 
})();
 
 
// ---------------------------------------------------------- //
// ---------------------------------------------------------- //
 
 
// Write debugging information to the console to indicate that
// the server has been configured and is up and running.
sys.puts( "Server is running on 8080" );
