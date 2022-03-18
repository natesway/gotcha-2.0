


var BATTERY_SERVICE = "180f";
var BATTERY_LEVEL = "2a19";

var CERTIFICATE_SERVICE = "bbe87709-5b89-4433-ab7f-8b8eef0d8e37";
var SIFA_COMMANDS = "bbe87709-5b89-4433-ab7f-8b8eef0d8e39";     //NOTIFY
var CENTRAL_TO_SIFA = "bbe87709-5b89-4433-ab7f-8b8eef0d8e38";   //WRITE
var SIFA_TO_CENTRAL = "bbe87709-5b89-4433-ab7f-8b8eef0d8e3a";   //READ

var CONTROL_SERVICE = "21c50462-67cb-63a3-5c4c-82b5b9939aeb";
var BUTTON = "21c50462-67cb-63a3-5c4c-82b5b9939aed";        //Notify
var FW_REQUEST = "21c50462-67cb-63a3-5c4c-82b5b9939aef";    //WRITE
var FW_VERSION = "21c50462-67cb-63a3-5c4c-82b5b9939af0";    //READ

var SUOTA_SERVICE_UUID = "21c50462-67cb-63a3-5c4c-82b5b9939af1";
var SUOTA_CTRL_UUID = "21c50462-67cb-63a3-5c4c-82b5b9939af2";
var SUOTA_STATUS_NTF_UUID = "21c50462-67cb-63a3-5c4c-82b5b9939af3";
var SUOTA_READ_UUID = "21c50462-67cb-63a3-5c4c-82b5b9939af4";
var SUOTA_WRITE_UUID = "21c50462-67cb-63a3-5c4c-82b5b9939af5";
var SUOTA_ERASE_UUID = "21c50462-67cb-63a3-5c4c-82b5b9939af6";

var productName = 'Go-tcha';
// var productName = 'Brook';
var stage = 0;

// Connected device.
var mDevice = null
var statsBuffer;
var settingsBuffer;
var goBonded = false;
var gotchaBonded = false;
var seenGotcha = false;

function dumpHex(buffer, offset, length)
{
    var value;
    var outloop;
    var inloop;
    var string = "";
    for (outloop = 0; outloop < length / 16; outloop++)
    {
        for (inloop = 0; inloop < 16; inloop++)
        {
            value = ((0xFF + buffer[offset+inloop+(outloop * 16)] +1) & 0x0FF).toString(16);
            value1 = ("00" + value).slice(-2);
            string += value1;
        }
        string += "\n";
    }
    console.log(string);
}

var scanning = false;
var scanningHandle;

function disconnectDevice()
{
    console.log('disconnectDevice');
    scanning = false;
	evothings.ble.stopScan();
	if (mDevice) { evothings.ble.close(mDevice) }
	mDevice = null;
    section = "";
	document.getElementById('selectionBar').style.display = 'none';
	document.getElementById('selectionBarNotConnected').style.display = 'block';
}

function resetGood(error)
{
    console.log("ble reset good");
    setTimeout(findPokemonGOPlus(), 5000);
}
function resetBad(error)
{
    console.log("ble reset bad");
}

// ------------------------------------------------------------------
// ------------------------------------------------------------------
// ------------------------------------------------------------------

function disconnectDeviceManual()
{
    console.log('disconnectDevice: ' + section);
    scanning = false;
	evothings.ble.stopScan();
	if (mDevice) { evothings.ble.close(mDevice) }
	mDevice = null;
    // section = "";
	document.getElementById('selectionBar').style.display = 'none';
	document.getElementById('selectionBarNotConnected').style.display = 'block';
	var element = document.getElementById('outerRingSync1');
	element.style.stroke = '#ffff00';
	element.style.opacity = '0';
    window.plugins.insomnia.allowSleepAgain(insomniaGood,insomniaBad);
	displayPage('statusPage');

    showMessage('Press the Go-tcha button');
}
var wantsToLeave = false;
function disconnectDeviceManualBAD(error)
{
    wantsToLeave = true;
    displayPage('statusPage');
}

function leaveGotchaFinGood(error)
{
    console.log("leaveGotchaFinGood");
    // unbondDevice(deviceHandle, false);
    disconnectDeviceManual();
}

function leaveGotchaFin(error)
{
    console.log('leaveGotchaReboot');
    var service;
    var characteristic;
    service = evothings.ble.getService(deviceHandle, SUOTA_SERVICE_UUID);
    characteristic = evothings.ble.getCharacteristic(service, SUOTA_CTRL_UUID);
    var suotaCtrl = new Uint8Array(2);
    suotaCtrl[0] = 6;   //SUOTA_REBOOT
    suotaCtrl[1] = 1;
    evothings.ble.writeCharacteristic(deviceHandle, characteristic.handle, suotaCtrl, leaveGotchaFinGood, disconnectDeviceManualBAD);
	// displayPage('statusPage');
    // disconnectDeviceManual();
}

function leaveGotchaGood(error)
{
    console.log("leaveGotchaGood");
    leaveGotchaFin(error);
}
function leaveGotchaBad(error)
{
    console.log("leaveGotchaBad");
}

function leaveGotcha(error)
{
    console.log('leaving GoTcha');
    section = "leaving Gotcha";
    section = "";
    var service;
    var characteristic;
    service = evothings.ble.getService(deviceHandle, SUOTA_SERVICE_UUID);
    characteristic = evothings.ble.getCharacteristic(service, SUOTA_CTRL_UUID);
    var suotaCtrl = new Uint8Array(1);
    suotaCtrl[0] = 1;   //SUOTA_RELEASE_SPI_FLASH
    evothings.ble.writeCharacteristic(deviceHandle, characteristic.handle, suotaCtrl, leaveGotchaGood, leaveGotchaBad);
}

// ------------------------------------------------------------------
// ------------------------------------------------------------------
// ------------------------------------------------------------------

function unbondDevice(device, recover)
{
	evothings.ble.stopScan();

	// Bond and connect.
	evothings.ble.unbond(
		device,
		function(state)
		{
            console.log("unBonding state: " + state);
			if (state == 'unbonded' || state == 'unknown')
			{
                console.log('unbonded?- ' + state);
                if (recover == true)
                {
                    setTimeout(findPokemonGOPlus(), 2000);
                }
			}
			else if (state == 'bonding')
			{
                console.log('unBonding in progress');
			}
			else if (state == 'unbonded')
			{
                console.log('Bonding aborted');
                if (recover == true)
                {
                    setTimeout(findPokemonGOPlus(), 2000);
                }
			}
		},
		function(error)
		{
            console.log('Bond error: ' + error);
			showMessage('Bond error: ' + error);
		}
    )
}


function connectToDeviceGO(device)
{
    var section;
	// Save device.
	mDevice = device
    console.log("device- " + JSON.stringify(device));

	setTimeout(
		function()
		{
			evothings.ble.connectToDevice(
				device,
				onConnectedGo,
				onDisconnected,
				onConnectError)
		},
	    500);

	function onConnectedGo(device)
	{
                console.log(device);

        if (device.name == 'Pokemon GO Plus')
        {
            console.log('Connected to Go-Tcha stage 1');

            var service;
            var characteristic;
            var configCharacteristic;
        	service = evothings.ble.getService(device, CERTIFICATE_SERVICE);
            configCharacteristic = evothings.ble.getCharacteristic(service, CENTRAL_TO_SIFA);
            suotaInit = new Uint8Array([0x00]);
            evothings.ble.writeCharacteristic(device, configCharacteristic.handle, suotaInit, stage1Success, stage1Error)
            section = 'stage1';

        	function stage1Error(error)
        	{
        		console.log('Stage 1 error: ' + error);
                var newValue = (new Int32Array(error));
                newValue = newValue[0];
                if ((newValue == 0) | (newValue == 8))
                {
                    forceUpdate(error);
                }
        	}

        	// Function called when a connect error or disconnect occurs.
        	function stage1Success(error)
        	{
        		console.log('Write services success: ' + JSON.stringify(error));
        	    service = evothings.ble.getService(device, CERTIFICATE_SERVICE);
				configCharacteristic = evothings.ble.getCharacteristic(service, SIFA_COMMANDS);
				setTimeout(function(){
					evothings.ble.enableNotification(device, configCharacteristic.handle, goNotifications, goNotificationsError);
				}, 3000);
            	// evothings.ble.enableNotification(device, configCharacteristic.handle, goNotifications, goNotificationsError);
                section = 'stage2';
        	}
        	function goNotificationsError(error)
        	{
        		console.log('goNotifications error: ' + JSON.stringify(error));
        	}

        	function forceUpdateError(error)
        	{
                // showMessage('Please connect Go-tcha to power');
            	showMessage('Connecting to device...')

        		console.log('forceUpdate error: ' + JSON.stringify(error));
                if (error == 8)
                {
        			evothings.ble.stopScan();
                    unbondDevice(device, true);
                    findPokemonGOPlus();
                }
        	}

        	function forceUpdateSuccess(error)
        	{
        		console.log('forceUpdate success: ' + JSON.stringify(error));
        	}
        	function forceUpdate(error)
        	{
        		console.log('Forcing update: ' + JSON.stringify(error));
            	service = evothings.ble.getService(device, CERTIFICATE_SERVICE);
                configCharacteristic = evothings.ble.getCharacteristic(service, CENTRAL_TO_SIFA);

                suotaInit = new Uint8Array([0xfe, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
                evothings.ble.writeCharacteristic(device, configCharacteristic.handle, suotaInit, forceUpdateSuccess, forceUpdateError)

                section = 'stage2';
        	}

        	function notificationError(error)
        	{
        		console.log('Notification services error: ' + error);
                var newValue = (new Int32Array(error));
                newValue = newValue[0];
                if ((newValue == 0) | (newValue == 8))
                {
                    forceUpdate(error);
                }
        	}
            function goNotifications(error)
            {

                var newValue = (new Int32Array(error));
                newValue = newValue[0];
                if (newValue < 0)
                {
                    newValue = 0xffffffff - ~newValue;
                }
                addr = newValue;
                console.log("Notification services success ---: " + newValue.toString(16));

        	    service = evothings.ble.getService(device, CONTROL_SERVICE);
            	configCharacteristic = evothings.ble.getCharacteristic(service, FW_VERSION);
            	evothings.ble.readCharacteristic(device, configCharacteristic.handle, finalReadSuccess, notificationError);
            }

        	function readSuccess(error)
        	{
                var newValue = (new Int32Array(error));
                newValue = newValue[0];
                if (newValue < 0)
                {
                    newValue = 0xffffffff - ~newValue;
                }
                addr = newValue;
                console.log("Notification services success ***: " + newValue.toString(16));

        	}

            function finalReadError(error)
            {
        		console.log('finalRead error: ' + JSON.stringify(error));
            }

        	function finalReadSuccess(error)
        	{
                function ab2str(buf) {
                  return String.fromCharCode.apply(null, new Uint8Array(buf));
                }
                function str2ab(str) {
                  var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
                  var bufView = new Uint16Array(buf);
                  for (var i=0, strLen=str.length; i<strLen; i++) {
                    bufView[i] = str.charCodeAt(i);
                  }
                  return buf;
                }
                var string = (new Int8Array(error)).toString();
        		console.log('Read services success: ' + JSON.stringify(string));
                var stringReceived = ab2str(error);
                console.log(stringReceived);

            	service = evothings.ble.getService(device, CONTROL_SERVICE);
                configCharacteristic = evothings.ble.getCharacteristic(service, FW_REQUEST);
                console.log(JSON.stringify(service) + " " + JSON.stringify(configCharacteristic));
                if (~stringReceived.indexOf("Datel"))
                {
                    evothings.ble.writeCharacteristic(device, configCharacteristic.handle, new Uint8Array([1]), writeDatelSuccess, finalReadError);
                }
            }

        	function writeDatelSuccess(error)
        	{
                findPokemonGOPlus();
            }
        }
	}

	function onDisconnected(device)
	{
		showMessage('Device disconnected');
    	document.getElementById('upgrade').style.display = 'none';
    	document.getElementById('connect').style.display = '';
    	document.getElementById('selectionBar').style.display = 'none';
    	document.getElementById('selectionBarNotConnected').style.display = 'block';
	}

	// Function called when a connect error or disconnect occurs.
	function onConnectError(error)
	{
        if (error == 19)
        {
            showMessage('Removing ' + productName + ' from paired devices');

            unbondDevice(device, true);
        }
        if (error == 22)
        {
			evothings.ble.stopScan();
            scanForDeviceGO(device);
        }
		if (error == 133)
		{
			showMessage('Reconnecting...')
			evothings.ble.stopScan();
            scanForDeviceGO(device);
		}
		if (error == 62)
		{
			showMessage('Reconnecting...')
			evothings.ble.stopScan();
            scanForDeviceGO(device);
		}
	}
}

var devicesCount = 0;
var undefinedCount = 0;
function scanForDeviceGO()
{
	// Start scanning. Two callback functions are specified.
	evothings.ble.startScan(
		onDeviceFound,
		onScanError);

	// This function is called when a device is detected, here
	// we check if we found the device we are looking for.
	function onDeviceFound(device)
	{
        if (devicesCount++ > 30)
        {
            devicesCount = 0;
        }
		if (device.name == 'Gotcha-Upgrader')
		{
			showMessage('Found Gotcha-Upgrader')
			evothings.ble.stopScan();

			connectToDeviceGotcha(device);
        }
		if (device.name == 'Pokemon GO Plus')
		{
            if (seenGotcha != true)
            {
    			showMessage('Found ' + productName + ' device')
            }
            else
            {
                showMessage('Please connect Go-tcha to power');
            }

            seenGotcha = true;
			// Stop scanning.
			evothings.ble.stopScan();

			// Bond and connect.
			evothings.ble.bond(
				device,
				function(state)
				{
					if (state == 'bonded' || state == 'unknown')
					{
                        console.log('bonded?- ' + state);
						connectToDeviceGO(device);
					}
					else if (state == 'bonding')
					{
                        console.log('Bonding in progress');
					}
					else if (state == 'unbonded')
					{
                        console.log('Bonding aborted');
                        setTimeout(findPokemonGOPlus(), 2000);
					}
				},
				function(error)
				{
                    console.log('Bond error: ' + error);
                    setTimeout(findPokemonGOPlus(), 2000);
				})
		}
	}

	// Function called when a scan error occurs.
	function onScanError(error)
	{
		showMessage('Scan error: ' + error);
        evothings.ble.stopScan();
        setTimeout(findPokemonGOPlus(), 2000);
	}
}


function disdev()
{
    console.log("disconnecting from Gotcha");
    leaveGotcha();
}


/**
 * Search for bonded device with a given name.
 * Useful if the address is not known.
 */
function searchForBondedDevice(params)
{
	console.log('Searching for bonded device')
	evothings.ble.getBondedDevices(
		// Success function.
		function(devices)
		{
			for (var i in devices)
			{
				var device = devices[i]
			}
			params.onNotFound()
		},
		// Error function.
		function(error)
		{
			params.onNotFound();
		},
		{ serviceUUIDs: params.serviceUUIDs })
}

function findPokemonGOPlus()
{
	settingsRetries = 0;
	erasingSettings = false;
    dontSleep = true;
    seenGotcha = false;
	var element = document.getElementById('outerRingSync1');
	element.style.stroke = '#ffff00';
	element.style.opacity = '1';

	disconnectDevice()
	searchForBondedDevice({
		// name: 'Pokemon GO Plus',
		name: '',
		serviceUUIDs: [CONTROL_SERVICE],
		onFound: connectToDeviceGO,
		onNotFound: scanForDeviceGO,
		})

}
