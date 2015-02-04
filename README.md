# HPIT (Hyper-Personalized Intelligent Tutor) Nodejs  Client Libraries

## What is HPIT?

HPIT is a collection of machine learning and data management plugins for Intelligent Tutoring Systems. It
is being developed between a partnership with Carnegie Learning and TutorGen, Inc and is based on the most 
recent research available. The goal of HPIT is to provide a scalable platform for the future development 
of cognitive and intelligent tutoring systems. HPIT by default consists of several different plugins
which users can store, track and query for information. As of today we support Bayesian Knowledge Tracing, 
Model Tracing, Adaptive Hint Generation, and data storage and retrieval. HPIT is in active development 
and should be considered unstable for everyday use.

## Installing the client libraries

1. Install nodejs: http://nodejs.org/download/
2. Install the HPIT client libraries: `npm install hpitclient`

You're all set to start using the libraries.

## Registering with HPIT

Go to https://www.hpit-project.org/user/register and create a new account.

## Settings

There are various settings which change the behavior of the client side libraries.

| name               | default                        | description                                |
|--------------------|--------------------------------|--------------------------------------------|
| HPIT_URL_ROOT      | 'https://www.hpit-project.org' | The URL of the HPIT server.                |

To override the clientside settings in your app do the following. You will need to override the HPIT
URL if you are doing any local testing.

```javascript
    (function(exports) {
        exports.HPIT_URL_ROOT = 'https://www.hpit-project.org/';
    })(typeof exports === 'undefined' ? this._ = this._ || {}: exports);
```

## Plugins

### Tutorial: Creating a Plugin

To create a new plugin, first go https://www.hpit-project.org and log in. Then
click on "My Plugins" and add a new plugin. Give it a brief name and a description. Click
Submit. The next page will generate for you two items you'll need to us to connect to the
centralized HPIT router. An Entity ID and an API Key. We do not store API Keys on the server
so if you lose it you'll need to generate a new one. Copy the Entity ID and API Key.

To create a new plugin you'll need to derive from the Plugin class.

```javascript
var hpit = require('../index');
function student_activity_logging_plugin(entity_id, api_key, err_cb, options) {
    hpit.plugin.call(this, entity_id, api_key, err_cb, options);
}

student_activity_logging_plugin.prototype = Object.create(hpit.plugin.prototype);
```

Calling the start method on the plugin will connect it to the server.

```javascript

my_plugin = new student_activity_logging_plugin();
my_plugin.start();
```

Plugins are event driven. The start method connects to the server then starts an endless loop. There are
several hooks that can get called in this process. One of these hooks is the `post_connect` hook and will
get called after successfully connecting to the server. Here is where you can register the messages you want
your plugin to listen to and the callback functions to call when your plugin recieves a message of that type.

Let's define one now:

```javascript
student_activity_logging_plugin.prototype.post_connect = function(next) {
    var self = this;
    self.subscribe({
        activity_logging: self.log_student_activity_callback
    }, next);
};
student_activity_logging_plugin.prototype.log_student_activity_callback = function(message, next) {
    console.log(message);
    if (next) next();	
};
```

The `self.subscribe` method takes a message name and a callable. In this case `activity_logging` is the message name and
`self.log_student_activity_callback` is the callback that will be called when a message of that name is sent to the plugin. It then contacts the HPIT central router and tells it to start storing messages with that name of `activity_logging` so this plugin can listen to and respond to those messages.

A message in HPIT consists of a message name, in this case `activity_logging` and a payload. The payload can
have any arbitrary data in it that a tutor wishes to send. HPIT doesn't care about the kind of data
it sends to plugins. It's the plugin operator's responsibility to do what it wants with the data
that comes from the tutor.

So now if a tutor sends a message like `"activity_logging" -> {'text' : "Hello World!"}` through HPIT this plugin
will recieve that message and print it to the console.

In the inner loop of the start method a few things happen. The plugin asks the HPIT router server if any messages
that it wants to listen to are queued to be sent to the plugin. Then if it recieves new messages it dispatches them
to the assigned callbacks that were specified in your calls to `self.subscribe`

Plugins can also send responses back to the original sender of messages. To do so the plugin needs to call the
`self.send_response` function. All payloads come with the `message_id` specified so we can route responses appropriately.
To send a response we'll need to slightly modify our code a bit.

```javascript
student_activity_logging_plugin.prototype.log_student_activity_callback = function(message, next) {
    console.log(message);
    var my_response = {
        'echo_response': message['text'];
    };
    send_response(message['message_id'], my_response, next);
};
```

Now the original tutor or plugin who sent this message to your MyPlugin will get a response back
with the `echo_response` parameter sent back.

Just like tutors, plugins can also send messages to other messages over HPIT. It is possible to
"daisy chain" plugins together this way where you have a tutor send a message, which gets sent 
to a plugin (A), which queries another plugin for information (B), which does the same for another plugin (C), 
which sends back a response to plugin B, which responds to plugin A, which responds to the original Tutor.

The goal with this is that each plugin can handle a very small task, like storing information, do some logging,
update a decision tree, or a knowledge graph, or etc, etc. The possibilities are endless.

Our plugin all put together now looks like:

```javascript
var hpit = require('../hpitclient');

function student_activity_logging_plugin(entity_id, api_key, err_cb, options) {
    hpit.plugin.call(this, entity_id, api_key, err_cb, options);
}
student_activity_logging_plugin.prototype = Object.create(hpit.plugin.prototype);
student_activity_logging_plugin.prototype.post_connect = function(next) {
    var self = this;
    self.subscribe({
        activity_logging: self.log_student_activity_callback
    }, next);
};
student_activity_logging_plugin.prototype.log_student_activity_callback = function(message, next) {
    console.log(message);
    if (next) next();	
};

my_plugin = new student_activity_logging_plugin();
my_plugin.start();
```

### Plugin Hooks

There are several hooks throughout the main event loop, where you can handle some special cases. The only hook
that MUST be defined in a plugin is the `post_connect` hook. It is where you should define the messages and handlers
that the plugin to listen and possibly respond to. 

Disconnecting from the HPIT server will not cause HPIT to forget about you, it will continue storing messages for you, which you can recieve the next time you run your plugin. Isn't that nice. :)

If you want HPIT to stop storing and routing messages to you, you can call the handy, dandy 'self.unsubscribe' method after connecting to HPIT. A good place to do this is in the `pre_disconnect` hook.

```javascript
var hpit = require('../hpitclient');

function student_activity_logging_plugin(entity_id, api_key, err_cb, options) {
    hpit.plugin.call(this, entity_id, api_key, err_cb, options);
}
student_activity_logging_plugin.prototype = Object.create(hpit.plugin.prototype);
student_activity_logging_plugin.prototype.post_connect = function(next) {
    var self = this;
    self.subscribe({
        activity_logging: self.log_student_activity_callback
    }, next);
};
student_activity_logging_plugin.prototype.pre_connect = function(next) {
    var self = this;
    self.unsubscribe(['activity_logging'], next);
};
```
**About next
The reason that a next callback is passed to almost all the functions defined is because of unpredictability of nodejs' event loop. Passing next callback gaurantees that all the hooks will be executed and finished in pre-defined order. 

Here are some other places you can hook into the event loop.

Hook Name                   | Called When:
--------------------------- | --------------------------------------------------------------------------
pre_connect                 | Before the plugin connects and authenticates with the server.
post_connect                | After the plugin connects and authenticates with the server.
pre_disconnect              | Before the plugin disconnects from the server.
post_disconnect             | After the plugin disconnects from the server. (Right before exit)
pre_poll_messages           | Before the plugin polls the server for new messages.
post_poll_messages          | After the plugin polls the server for new messages but before dispatch.
pre_dispatch_messages       | Before the messages are dispatched to their callbacks.
post_dispatch_messages      | After the messages are dispatched to their callbacks.
pre_handle_transactions     | Before the plugin polls the server for new PSLC Datashop transactions.
post_handle_transcations    | After the plugin polls the server for new PSLC Datashop transactions.
pre_poll_responses          | Before the plugin polls the server for new responses to it's messages.
post_poll_responses         | After the plugin polls the server for new responses but before dispatch.
pre_dispatch_responses      | Before the plugin dispatches it's responses to response callbacks.
post_dispatch_responses     | After the plugin dispatches it's responses to response callbacks.


## Tutors

### Tutorial: Creating a Tutor

To create a new tutor, first go https://www.hpit-project.org and log in. Then
click on "My Tutors" and add a new tutor. Give it a brief name and a description. Click
Submit. The next page will generate for you two items you'll need to us to connect to the
centralized HPIT router. An Entity ID and an API Key. We do not store API Keys on the server
so if you lose it you'll need to generate a new one. Copy the Entity ID and API Key.

To create a new tutor you'll need to derive from the Tutor class.

```javascript
var hpit = require('../hpitclient');
function student_activity_logging_tutor(entity_id, api_key, callback, err_cb, options) {
    hpit.tutor.call(this, entity_id, api_key, callback, err_cb, options);
}
student_activity_logging_tutor.prototype = Object.create(hpit.tutor.prototype);
student_activity_logging_tutor.prototype.work = function() {
    var activity = {subject: "I", verb: "made", object: "it"};
    this.send(
        message_name = "activity_logging",
        payload = activity
    );
};
```

Tutors differ from plugins in one major way, in their main event loop they call a callback function
which will be called during each iteration of the main event loop. This callback is specified in a 
parameter in the init function. After calling the main callback function, the main event loop then
polls HPIT for responses from plugins which you have sent messages to earlier.

To send a message to HPIT and have that message routed to a specific plugin you can call the `this.send`
method as we do above. Messages sent this way consist of an event name (in this case 'activity_logging') and a dictionary of data. Optionally you can specify a response callback as we do below. All messages sent through HPIT are 
multicast and every plugin which 'subscribes' to those messages will recieve them, including the student_activity_logging plugin you created and registered with HPIT in the last tutorial.

When you send a message to HPIT you can specify a response callback to the send method. After the message is
recieved and processed by a plugin, it may optionally send a response back. If it does the response will travel
back through HPIT, where when polled by this library, will route that response to the callback you specified. You can
then process the response however you would like in your Tutor. Here, we are just echoing the response back to the
console. Responses you recive will be a dictionary consisting of the following key-value pairs.

Key (. denotes sub-dictionary)  | Value
------------------------------- | --------------------------------------------------------------------------
message_id                      | The ID generated to track the message.
message.sender_entity_id        | Your Entity ID.
message.receiver_entity_id      | The Plugin's Entity ID that is responding to your message.
message.time_created            | The time HPIT first recieved your message.
message.time_received           | The time HPIT queued the message for the plugin to consume.
message.time_responded          | The time HPIT recieved a response from the plugin.
message.time_response_received  | The time HPIT sent the response back to your tutor.
message.payload                 | What you originally sent to HPIT.
message.message_name            | What you named the message.
response                        | A dictionary of values the Plugin responded to the message with.

Since multiply plugins may respond to the same message that you sent out, you may wish to check the contents
of the response payload, as well as the message.reciever_entity_id to help filter the responses you actually
want to handle. You can specify different callbacks for the same message, as well as a "global" callback for 
one message. For example both:
```javascript
var hpit = require('../hpitclient');
function student_activity_logging_tutor(entity_id, api_key, callback, err_cb, options) {
    hpit.tutor.call(this, entity_id, api_key, callback, err_cb, options);
}
student_activity_logging_tutor.prototype = Object.create(hpit.tutor.prototype);
student_activity_logging_tutor.prototype.work = function() {
    var activity = {subject: "I", verb: "made", object: "it"};
    var self = this;
    this.send(
        message_name = "activity_logging",
        payload = activity,
        callback = self.response_callback
    );
};
student_activity_logging_tutor.prototype.response_callback = function() {
    console.log(response);
};
```

AND

```javascript
var hpit = require('../hpitclient');
function student_activity_logging_tutor(entity_id, api_key, callback, err_cb, options) {
    hpit.tutor.call(this, entity_id, api_key, callback, err_cb, options);
}
student_activity_logging_tutor.prototype = Object.create(hpit.tutor.prototype);
student_activity_logging_tutor.prototype.work = function() {
    var activity = {subject: "I", verb: "made", object: "it"};
    var self = this;
    this.send(
        message_name = "activity_logging",
        payload = activity,
        callback = self.response_callback
    );
    this.send(
        message_name = "activity_logging",
        payload = activity,
        callback = self.response_callback_two
    );
};
student_activity_logging_tutor.prototype.response_callback = function() {
    console.log(response);
};
student_activity_logging_tutor.prototype.response_callback_two = function() {
    console.log(response);
};
```
are valid ways to handle responses from plugins. 

That's really all there is to writing a tutor.

## Active Plugins in Production

Currently, there are  3 plugins active on HPIT's production servers which can be queried for information.
These are: knowledge tracing plugin; hint factory plugin; boredom detector plugin. The knowledge tracing plugin is responsible for handling bayesian knowledge tracing, the hint factory handle domain model generation and hint generation, and the boredom detctor plugin provides either a boredom indicator (true/false) or boredom percentage indicator. 

Documentation on these plugins are available from https://www.hpit-project.org/docs
