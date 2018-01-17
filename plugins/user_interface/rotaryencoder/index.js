'use strict';

var libQ = require('kew');
var fs=require('fs-extra');
var config = new (require('v-conf'))();
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var io = require('socket.io-client');
var socket = io.connect('http://localhost:3000');

//const rotaryLogic = Object.freeze({"GRAY": 0, "KY040": 1 });
const detentActionType = Object.freeze({"VOLUME": 0, "PREVNEXT": 1 });
const buttonActionType = Object.freeze({"PLAY": 0, "PAUSE": 1, "PLAYPAUSE": 2, "STOP": 3, "REPEAT": 4, "RANDOM": 5, "STARTAIRPLAY": 6, "STOPAIRPLAY": 7, "CLEARQUEUE": 8, "MUTE": 9, "UNMUTE": 10, "TOGGLEMUTE": 11 });

var rotaryEncoder = require('onoff-rotary');

module.exports = rotaryencoder;
function rotaryencoder(context) {
	var self = this;

	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
	this.configManager = this.context.configManager;
};

rotaryencoder.prototype.onVolumioStart = function()
{
	var self = this;
	var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
	this.config = new (require('v-conf'))();
	this.config.loadFile(configFile);

    return libQ.resolve();
};

rotaryencoder.prototype.onStart = function() {
    var self = this;
	var defer=libQ.defer();
	
	if(self.config.get('first_encoder_CLK') !== 0)
		self.constructFirstEncoder();
	
	if(self.config.get('second_encoder_CLK') != 0)
		self.constructSecondEncoder();

	if(self.config.get('enable_debug_logging'))
		self.logger.info('[Rotary encoder] Loaded configuration: ' + JSON.stringify(self.config.data));
	
	// Once the Plugin has successfully started resolve the promise
	defer.resolve();

    return defer.promise;
};

rotaryencoder.prototype.onStop = function() {
    var self = this;
    var defer=libQ.defer();

    // Once the Plugin has successfully stopped resolve the promise
    defer.resolve();

    return libQ.resolve();
};

rotaryencoder.prototype.onRestart = function() {
    var self = this;
    // Optional, use if you need it
};


// Configuration Methods -----------------------------------------------------------------------------

rotaryencoder.prototype.getUIConfig = function() {
    var defer = libQ.defer();
    var self = this;

    var lang_code = this.commandRouter.sharedVars.get('language_code');
	var encodingOpts = fs.readJsonSync((__dirname + '/options/encodingOptions.json'),  'utf8', {throws: false});
	var detentOpts = fs.readJsonSync((__dirname + '/options/detentOptions.json'),  'utf8', {throws: false});
	var buttonOpts = fs.readJsonSync((__dirname + '/options/buttonOptions.json'),  'utf8', {throws: false});

    self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
        __dirname+'/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then(function(uiconf)
        {
			self.logger.info('Loading settings page...');
			// First encoder
			uiconf.sections[0].content[0].value = self.config.get('first_encoder_CLK');
			uiconf.sections[0].content[1].value = self.config.get('first_encoder_DT');		
			uiconf.sections[0].content[2].value = self.config.get('first_encoder_SW');
		
			for (var n = 0; n < encodingOpts.encodings.length; n++)
			{
				self.configManager.pushUIConfigParam(uiconf, 'sections[0].content[3].options', {
					value: encodingOpts.encodings[n].enc,
					label: encodingOpts.encodings[n].label
				});
				
				if(encodingOpts.encodings[n].enc == parseInt(self.config.get('first_encoder_encoding')))
				{
					uiconf.sections[0].content[3].value.value = encodingOpts.encodings[n].enc;
					uiconf.sections[0].content[3].value.label = encodingOpts.encodings[n].label;
				}
			}
			
			for (var n = 0; n < detentOpts.detentActionTypes.length; n++)
			{
				self.configManager.pushUIConfigParam(uiconf, 'sections[0].content[4].options', {
					value: detentOpts.detentActionTypes[n].type,
					label: detentOpts.detentActionTypes[n].label
				});
				
				if(detentOpts.detentActionTypes[n].type == parseInt(self.config.get('first_encoder_detentActionType')))
				{
					uiconf.sections[0].content[4].value.value = detentOpts.detentActionTypes[n].type;
					uiconf.sections[0].content[4].value.label = detentOpts.detentActionTypes[n].label;
				}
			}
			
			for (var n = 0; n < buttonOpts.buttonActionTypes.length; n++)
			{
				self.configManager.pushUIConfigParam(uiconf, 'sections[0].content[5].options', {
					value: buttonOpts.buttonActionTypes[n].type,
					label: buttonOpts.buttonActionTypes[n].label
				});
				
				if(buttonOpts.buttonActionTypes[n].type == parseInt(self.config.get('first_encoder_buttonActionType')))
				{
					uiconf.sections[0].content[5].value.value = buttonOpts.buttonActionTypes[n].type;
					uiconf.sections[0].content[5].value.label = buttonOpts.buttonActionTypes[n].label;
				}
			}
			self.logger.info("1/3 settings loaded");
			
			// Second encoder
			uiconf.sections[1].content[0].value = self.config.get('second_encoder_CLK');
			uiconf.sections[1].content[1].value = self.config.get('second_encoder_DT');		
			uiconf.sections[1].content[2].value = self.config.get('second_encoder_SW');
		
			for (var n = 0; n < encodingOpts.encodings.length; n++)
			{
				self.configManager.pushUIConfigParam(uiconf, 'sections[1].content[3].options', {
					value: encodingOpts.encodings[n].enc,
					label: encodingOpts.encodings[n].label
				});
				
				if(encodingOpts.encodings[n].enc == parseInt(self.config.get('second_encoder_encoding')))
				{
					uiconf.sections[1].content[3].value.value = encodingOpts.encodings[n].enc;
					uiconf.sections[1].content[3].value.label = encodingOpts.encodings[n].label;
				}
			}
			
			for (var n = 0; n < detentOpts.detentActionTypes.length; n++)
			{
				self.configManager.pushUIConfigParam(uiconf, 'sections[1].content[4].options', {
					value: detentOpts.detentActionTypes[n].type,
					label: detentOpts.detentActionTypes[n].label
				});
				
				if(detentOpts.detentActionTypes[n].type == parseInt(self.config.get('second_encoder_detentActionType')))
				{
					uiconf.sections[1].content[4].value.value = detentOpts.detentActionTypes[n].type;
					uiconf.sections[1].content[4].value.label = detentOpts.detentActionTypes[n].label;
				}
			}
			
			for (var n = 0; n < buttonOpts.buttonActionTypes.length; n++)
			{
				self.configManager.pushUIConfigParam(uiconf, 'sections[1].content[5].options', {
					value: buttonOpts.buttonActionTypes[n].type,
					label: buttonOpts.buttonActionTypes[n].label
				});
				
				if(buttonOpts.buttonActionTypes[n].type == parseInt(self.config.get('second_encoder_buttonActionType')))
				{
					uiconf.sections[1].content[5].value.value = buttonOpts.buttonActionTypes[n].type;
					uiconf.sections[1].content[5].value.label = buttonOpts.buttonActionTypes[n].label;
				}
			}
			self.logger.info("2/3 settings loaded");
			
			uiconf.sections[2].content[0].value = self.config.get('enable_debug_logging');
			self.logger.info("3/3 settings loaded");

            defer.resolve(uiconf);
        })
        .fail(function()
        {
            defer.reject(new Error());
        });

    return defer.promise;
};


rotaryencoder.prototype.setUIConfig = function(data) {
	var self = this;
	//Perform your installation tasks here
};

rotaryencoder.prototype.getConf = function(varName) {
	var self = this;
	//Perform your installation tasks here
};

rotaryencoder.prototype.setConf = function(varName, varValue) {
	var self = this;
	//Perform your installation tasks here
};



// Configuration ---------------------------------------------------------------------------------------
rotaryencoder.prototype.determineAPICommand = function(buttionAction) {
	switch(buttonAction)
	{
		case buttonActionType.PLAY:
			return 'play';
			break;
		case buttonActionType.PAUSE:
			return 'pause';
			break;
		case buttonActionType.PLAYPAUSE:
		case buttonActionType.TOGGLEMUTE:
			return 'toggle';
			break;
		case buttonActionType.STOP:
			return 'stop';
			break;
		case buttonActionType.REPEAT:
			return 'repeat';
			break;
		case buttonActionType.RANDOM:
			return 'random';
			break;
		case buttonActionType.STARTAIRPLAY:
			return 'startAirplay';
			break;
		case buttonActionType.STOPAIRPLAY:
			return 'stopAirplay';
			break;
		case buttonActionType.CLEARQUEUE:
			return 'clearQueue';
			break;
		case buttonActionType.MUTE:
			return 'mute';
			break;
		case buttonActionType.UNMUTE:
			return 'unmute';
			break;
	}
};

rotaryencoder.prototype.constructFirstEncoder = function ()
{
	var self = this;
	var configured_1 = false;
		try
		{
			this.firstEncoder = rotaryEncoder(self.config.get('first_encoder_CLK'), self.config.get('first_encoder_DT'), self.config.get('first_encoder_SW'), self.config.get('first_encoder_encoding'));
			configured_1 = true;
		}
		catch (ex)
		{
			self.logger.info('Could not initiate rotary encoder #1 with error: ' + ex);
		}
		
		this.firstEncoder.on('rotation', direction => {
			if (direction > 0) 
			{
				if(self.config.get('enable_debug_logging'))
					self.logger.info('[Rotary encoder] Encoder #1 rotated right');
								
				if(self.config.get('first_encoder_detentActionType') != detentActionType.VOLUME)
					socket.emit('next');
				else
					socket.emit('volume', '+');				
			}
			else
			{
				if(self.config.get('enable_debug_logging'))
					self.logger.info('[Rotary encoder] Encoder #1 rotated left');
				
				if(self.config.get('first_encoder_detentActionType') != detentActionType.VOLUME)
					socket.emit('prev');
				else
					socket.emit('volume', '-');
			}
		});
		
		if(self.config.get('first_encode_SW') !== 0)
		{
			this.firstEncoder.on('click', pressState => {
				if(self.config.get('enable_debug_logging'))
						self.logger.info('[Rotary encoder] Encoder #1 button pressed; press state = ' + (pressState == 0 ? 'pressed' : 'released'));
					
				if(pressState == 0)
				{
					if(self.config.get('first_encoder_buttonActionType') != buttonActionType.TOGGLEMUTE)
						socket.emit(self.determineAPICommand('first_encoder_buttonActionType'));
					else
						socket.emit('volume', 'toggle');
					
				}
			});
		}
};

rotaryencoder.prototype.constructSecondEncoder = function ()
{
	var self = this;
	var configured_2 = false;
		try
		{
			this.secondEncoder = rotaryEncoder(self.config.get('second_encoder_CLK'), self.config.get('second_encoder_DT'), self.config.get('second_encoder_SW'), self.config.get('second_encoder_encoding'));
			configured_2 = true;
		}
		catch (ex)
		{
			self.logger.info('Could not initiate rotary encoder #2 with error: ' + ex);
		}
		
		this.firstEncoder.on('rotation', direction => {
			if (direction > 0) 
			{
				if(self.config.get('enable_debug_logging'))
					self.logger.info('[Rotary encoder] Encoder #2 rotated right');
								
				if(self.config.get('second_encoder_detentActionType') != detentActionType.VOLUME)
					socket.emit('next');
				else
					socket.emit('volume', '+');				
			}
			else
			{
				if(self.config.get('enable_debug_logging'))
					self.logger.info('[Rotary encoder] Encoder #2 rotated left');
				
				if(self.config.get('second_encoder_detentActionType') != detentActionType.VOLUME)
					socket.emit('prev');
				else
					socket.emit('volume', '-');
			}
		});
		
		if(self.config.get('second_encode_SW') !== 0)
		{
			this.firstEncoder.on('click', pressState => {
				if(self.config.get('enable_debug_logging'))
						self.logger.info('[Rotary encoder] Encoder #2 button pressed; press state = ' + (pressState == 0 ? 'pressed' : 'released'));
					
				if(pressState == 0)
				{					
					if(self.config.get('second_encoder_buttonActionType') != buttonActionType.TOGGLEMUTE)
						socket.emit(self.determineAPICommand('second_encoder_buttonActionType'));
					else
						socket.emit('volume', 'toggle');
					
				}
			});
		}
};

rotaryencoder.prototype.updateFirstEncoder = function (data)
{
	var self = this;
	var defer=libQ.defer();

	self.config.set('first_encoder_CLK', data['first_encoder_CLK'].value);
	self.config.set('first_encoder_DT', data['first_encoder_DT']);
	self.config.set('first_encoder_SW', data['first_encoder_SW']);
	self.config.set('first_encoder_encoding', data['first_encoder_encoding']);
	self.config.set('first_encoder_detentActionType', data['first_encoder_detentActionType']);
	self.config.set('first_encoder_buttonActionType', data['first_encoder_buttonActionType']);
	
	self.constructFirstEncoder();
	defer.resolve();
	
	if(self.config.get('enable_debug_logging'))
		self.logger.info('[Rotary encoder] Saved configuration for encoder #1, data: ' + JSON.stringify(data));
	self.commandRouter.pushToastMessage('success', "Saved settings", "Successfully saved first encoder settings.");

	return defer.promise;
};

rotaryencoder.prototype.updateSecondEncoder = function (data)
{
	var self = this;
	var defer=libQ.defer();

	self.config.set('second_encoder_CLK', data['second_encoder_CLK'].value);
	self.config.set('second_encoder_DT', data['second_encoder_DT']);
	self.config.set('second_encoder_SW', data['second_encoder_SW']);
	self.config.set('second_encoder_encoding', data['second_encoder_encoding']);
	self.config.set('second_encoder_detentActionType', data['second_encoder_detentActionType']);
	self.config.set('second_encoder_buttonActionType', data['second_encoder_buttonActionType']);
	
	self.constructSecondEncoder();
	defer.resolve();
	
	if(self.config.get('enable_debug_logging'))
		self.logger.info('[Rotary encoder] Saved configuration for encoder #2, data: ' + JSON.stringify(data));
	self.commandRouter.pushToastMessage('success', "Saved settings", "Successfully saved second encoder settings.");

	return defer.promise;
};

rotaryencoder.prototype.updateDebugSettings = function (data)
{
	var self = this;
	var defer=libQ.defer();

	self.config.set('enable_debug_logging', data['enable_debug_logging'].value);
	defer.resolve();
	
	self.commandRouter.pushToastMessage('success', "Saved settings", "Successfully saved debug settings.");

	return defer.promise;
};