/**
 * File: server.js
 * Author: Rayjan Wilson
 * Copyright: 2012, Poker Flat Research Range, University of Alaska Fairbanks
 * License: MIT License
 */

// Requires
var sys = require("util");
var http = require("http");
var url = require("url");
var path = require("path");
var fileSystem = require("fs");
//var uuid = require("node-uuid");
var nowjs = require("now");

var port = 8000;

var server = http.createServer(function(request, response){
    var scriptName = request.url;

    // Convert the script name (expand-path) to a physical file
    // on the local file system.
    var requestdFilePath = path.join(process.cwd(), scriptName);

    // Read in the requested file. Remember, since all File I/O
    // (input and output) is asynchronous in Node.js, we need to
    // ask for the file to be read and then provide a callback
    // for when that file data is available.
    //
    // NOTE: You can check to see if the file exists *before* you
    // try to read it; but for our demo purposes, I don't see an
    // immediate benefit since the readFile() method provides an
    // error object.
    fileSystem.readFile(requestdFilePath, "binary",
        function(error, fileBinary){
            // Check to see if there was a problem reading the
            // file. If so, we'll **assume** it is a 404 error.
            if (error){
                response.writeHead(404);
                response.end();
                return;
            }

            response.writeHead(200);
            response.write(fileBinary, "binary");
            response.end();
        }
    );
});
 
server.listen(port);

// "everyone" contains an object called "now" (ie. everyone.now).
// This allows variables and functions to be shared between the
// server and the client.
var everyone = nowjs.initialize(server);

// Create the master group
var master = nowjs.getGroup('master');

master.on('join', function(user) {
    sys.puts(this.user.clientId + " joined master group");
});

master.on('leave', function(user) {
    sys.puts(this.user.clientId + " left master group");
});

// Create the client group
var client = nowjs.getGroup('client');

client.on('join', function(user) {
    sys.puts(this.user.clientId + " joined client group");
});

client.on('leave', function(user) {
    sys.puts(this.user.clientId + " left client group");
});

everyone.on('connect', function() {
    var self = this;
    nowjs.getGroup("master").count(function(count) {
        if (count == 0) {
            self.user.group = "master";
            nowjs.getGroup("master").addUser(self.user.clientId);
        }
        else {
            self.user.group = "client";
            nowjs.getGroup("client").addUser(self.user.clientId);
        }
    });
});

everyone.on('disconnect', function() {
    nowjs.getGroup(this.user.group).removeUser(this.user.clientId);
    if (this.user.group == "master") {
        nowjs.getGroup("client").getUsers(function(users) {
            if (users.length > 0) {
                nowjs.getGroup("client").removeUser(users[0]);
                nowjs.getGroup("master").addUser(users[0]);
            }
        });
    }
});

everyone.now.addWaypoints = function(waypoints) {
    sys.puts(waypoints + " from " + this.user.clientId);
    everyone.now.filterAddWaypoints(this.user.clientId, waypoints);
};

everyone.now.filterAddWaypoints = function(masterUUID, waypoints) {
    sys.puts("Master UUID: "+masterUUID);
    sys.puts("this.user.clientId: "+this.user.clientId);
    if (this.user.clientId != masterUUID) {
        everyone.now.updateWaypoints(waypoints);
    }
};
 
sys.puts("Server is running on " + port);
