/**
 * File: migrate.js
 * Author: Jonathan Sawyer
 * Copyright: 2012, Poker Flat Research Range, University of Alaska Fairbanks
 * License: MIT License
 */

var sqlite3 = require('sqlite3').verbose();
var sys = require('util');
sys.puts("open `pokergcs` database");
var db = new sqlite3.Database('db/pokergcs.db');
var ver = 0;
db.serialize();

var up = [
    /** 0 **/
    ["create table `pokergcs.version`...",
        "CREATE TABLE IF NOT EXISTS version (" +
        "    id INTEGER PRIMARY KEY," +  // 0
        "    app_version TEXT," +        // e.g., 2.1.3
        "    db_version INTEGER)"        // [0, inf)
    ],
    
    /** 1 **/
    ["set initial version...",
        "INSERT INTO version VALUES (0, 0, 0);"
    ],
    
    /** 2 **/
    ["create table `pokergcs.uavs`...",
        "CREATE TABLE IF NOT EXISTS uavs (" +
        "    id TEXT PRIMARY KEY," +     // UUID
        "    tail_number text)"          // varchar
    ],
    
    /** 3 **/
    ["create table `pokergcs.waypoint_tracks`...",
        "CREATE TABLE IF NOT EXISTS waypoint_tracks (" +
        "    id TEXT PRIMARY KEY," +     // UUID
        "    uav_id TEXT," +             // Fkey UUID
        "    time_started TEXT," +       // "YYYY-MM-DD HH:ii:ss"
        "    time_completed TEXT," +     // "YYYY-MM-DD HH:ii:ss"
        "    in_progress INTEGER," +     // 0 | 1
        "    completed INTEGER)"         // 0 | 1
    ],
    
    /** 4 **/
    ["create table `pokergcs.waypoints`...",
        "CREATE TABLE IF NOT EXISTS waypoints (" +
        "    id TEXT PRIMARY KEY," +     // UUID
        "    waypoint_tracks_id TEXT," + // Fkey UUID
        "    sort INTEGER," +            // [1, inf)
        "    longitude NUMERIC," +       // [-180.0, 180.0]
        "    latitude NUMERIC," +        // [-90.0, 90.0]
        "    altitude NUMERIC," +        // [0, inf)
        "    completed INTEGER)"         // 0 | 1
    ],
    
    /** 5 **/
    ["create table `pokergcs.statistics`...",
        "CREATE TABLE IF NOT EXISTS statistics (" +
        "    id TEXT PRIMARY KEY," +     // UUID
        "    uav_id TEXT," +             // Fkey UUID
        "    longitude NUMERIC," +       // [-180.0, 180.0]
        "    latitude NUMERIC," +        // [-90.0, 90.0]
        "    altitude NUMERIC," +        // [0, inf)
        "    state INTEGER," +           // 0 = landed, 1 = flying, ...
        "    battery_level NUMERIC," +   // ?
        "    battery_max NUMERIC," +     // ?
        "    temperature NUMERIC," +     // ?
        "    speed NUMERIC," +           // ?
        "    azimuth NUMERIC," +         // ?
        "    roll NUMERIC," +            // ?
        "    roll_rate NUMERIC," +       // ?
        "    pitch NUMERIC," +           // ?
        "    pitch_rate NUMERIC," +      // ?
        "    yaw NUMERIC," +             // ?
        "    yaw_rate NUMERIC)"          // ?
    ],
];

// if "version" table exists, get the db_version
db.get("SELECT * FROM version WHERE id=0;", function(err, row) {
    db.serialize(function() {
        if (!err) {
            // table "version" has been created, get the db_version
            ver = row['db_version'];
        }
        
        // sequentially bring the database up to date either from version 0 or
        // the latest available version
        sys.puts("loading from db_version "+ver+"...");
        if (ver < up.length) {
            for (var i = ver; i < up.length; i++) {
                sys.puts(i + ": " + up[i][0]);
                db.run(up[i][1]);
            }
            sys.puts("update db version to " + (up.length) + "...");
            db.run("UPDATE version SET db_version="+(up.length)+" WHERE id=0");
        }
        else {
            sys.puts("already current version...");
        }
        
        // close the database
        sys.puts("close `pokergcs` database");
        db.close();
    });
});
