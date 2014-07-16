node_hpit
=========

node.js library for hpit

How to use:

var node_hpit = require('./node_hpit');
var hpit = new node_hpit;

//get a plugin
var plugin = hpit.plugin;

//spin up the plugin
hpit.start(plugin);

//tear down the plugin
hpit.stop(plugin);

//check the status of the plugin
hpit.status(plugin);

//get a tutor
var tutor = hpit.tutor;

//spin up the tutor
hpit.start(tutor);

//tear down the tutor
hpit.stop(tutor);

//check the status of the tutor
hpit.status(tutor);
