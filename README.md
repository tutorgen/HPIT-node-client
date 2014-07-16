node_hpit
=========

node.js library for hpit

How to use:
'''
var node_hpit = require('./node_hpit');

var hpit = new node_hpit;
'''
**Plugin**


  1. get a plugin

    var plugin = hpit.plugin;
  
  2. spin up the plugin
  
    hpit.start(plugin);
  
  3. tear down the plugin
  
    hpit.stop(plugin);
  
  4. check the status of the plugin
  
    hpit.status(plugin);
  
**Tutor**

  1. get a tutor

    var tutor = hpit.tutor;

  2. spin up the tutor

    hpit.start(tutor);

  3. tear down the tutor

    hpit.stop(tutor);

  4. check the status of the tutor

    hpit.status(tutor);
