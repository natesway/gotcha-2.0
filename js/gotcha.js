


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


function readCharacteristic(device, serviceUUID, characteristicUUID, elementId, dataConversionFunction)
{
	var service = evothings.ble.getService(device, serviceUUID)
	var characteristic = evothings.ble.getCharacteristic(service, characteristicUUID)
	evothings.ble.readCharacteristic(
		device,
		characteristic,
		function(data)
		{
			document.getElementById(elementId).innerHTML =
				dataConversionFunction(data)
		},
		function(errorCode)
		{
			console.log('readCharacteristic error: ' + errorCode)
		})
}

// --------------------------------------------
// --------------------------------------------
// --------------------------------------------
// --------------------------------------------


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
}

/**
 * Search for bonded device with a given name.
 * Useful if the address is not known.
 */
function searchForBondedDeviceOLD(params)
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

function connectToDeviceGO(device)
{
    var section;
	// showMessage('Connecting to device...')
    console.log('Connecting to device...' + device);

	// Save device.
	mDevice = device
    console.log("device- " + JSON.stringify(device));

	// Android connect error 133 might be prevented by waiting a
	// little before connect (to make sure previous BLE operation
	// has completed).
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

        if (device.name == 'Pokemon GO Plus')
        {
            console.log('Connected to Go-Tcha stage 1');


            var service;
            var characteristic;
            var configCharacteristic;
        	service = evothings.ble.getService(device, CERTIFICATE_SERVICE);
            configCharacteristic = evothings.ble.getCharacteristic(service, CENTRAL_TO_SIFA);
            evothings.ble.writeCharacteristic(device, configCharacteristic.handle, new Uint8Array([1]), writeSuccess, readError)
            section = 'stage1';

        	function readError(error)
        	{
        		console.log('Notification services error: ' + error);
                var string = (new Int8Array(error)).toString();
                console.log('Notification services error: ' + JSON.stringify(string));

                var newValue = (new Int32Array(error));
                newValue = newValue[0];
                if ((newValue == 0) | (newValue == 8))
                {
                    showMessage('Please connect Go-tcha to power');
                    findPokemonGOPlus();
                }
        	}

        	// Function called when a connect error or disconnect occurs.
        	function writeSuccess(error)
        	{
        		console.log('Write services success: ' + JSON.stringify(error));
        	    service = evothings.ble.getService(device, CERTIFICATE_SERVICE);
            	configCharacteristic = evothings.ble.getCharacteristic(service, SIFA_COMMANDS);
            	evothings.ble.enableNotification(device, configCharacteristic.handle, goNotifications, readError);
                section = 'stage2';
        	}

            function goNotifications(error)
            {
                var string = (new Int8Array(error)).toString();
        		console.log('Notification services success ---: ' + JSON.stringify(string));

                // if (section == 'stage1')
                {
            	    service = evothings.ble.getService(device, CONTROL_SERVICE);
                	configCharacteristic = evothings.ble.getCharacteristic(service, FW_VERSION);
                	evothings.ble.readCharacteristic(device, configCharacteristic.handle, finalReadSuccess, readError);
                    // section = 'stage2';
                }

            }

        	function readSuccess(error)
        	{
                var string = (new Int8Array(error)).toString();
        		console.log('Notification services success ***: ' + JSON.stringify(string));
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
                    evothings.ble.writeCharacteristic(device, configCharacteristic.handle, new Uint8Array([1]), writeDatelSuccess, readError);
                }
            }

        	function writeDatelSuccess(error)
        	{
                var string = (new Int8Array(error)).toString();
                // showMessage('Press Upgrade if to continue');
                findPokemonGOPlus();
            }
        }
	}

	function onDisconnected(device)
	{
		showMessage('Device disconnected');
    	document.getElementById('upgrade').style.display = 'none';
    	document.getElementById('connect').style.display = '';
	}

	// Function called when a connect error or disconnect occurs.
	function onConnectError(error)
	{
		showMessage('Connect error: ' + error);
        if (error == 19)
        {
            showMessage('Please remove Pokemon GO Plus or ' + productName + ' from the bluetooth paired devices');
        }

		// If we get Android connect error 133, we wait and try to connect again.
		// This can resolve connect problems on Android when error 133 is seen.
		// In a production app you may want to have a function for aborting or
		// maximising the number of connect attempts. Note that attempting reconnect
		// does not block the app however, so you can still do other tasks and
		// update the UI of the app.
		if (error == 133)
		{
			showMessage('Reconnecting...***')
			// setTimeout(function() { connectToDevice(device) }, 1000)
			evothings.ble.stopScan();

            scanForDeviceGO(device);
		}
		if (error == 62)
		{
			showMessage('Reconnecting...***')
			// setTimeout(function() { connectToDevice(device) }, 1000)
			evothings.ble.stopScan();
            scanForDeviceGO(device);
		}
	}
}


function connectToDeviceGotcha(device)
{
	showMessage('Connecting to device...')
    console.log();

	// Save device.
	mDevice = device
    console.log("device- " + JSON.stringify(device));

	// Android connect error 133 might be prevented by waiting a
	// little before connect (to make sure previous BLE operation
	// has completed).
	setTimeout(
		function()
		{
			evothings.ble.connectToDevice(
				device,
				onConnectedGotcha,
				onDisconnectedGotcha,
				onConnectErrorGotcha)
		},
	    500)

	function onConnectedGotcha(device)
	{

        if (device.name == 'Gotcha-Upgrader')
        {

            evothings.ble.stopScan();
            // downloadFirmware();


		    clearTimeout(scanningHandle);
		    scanning = false;

            var service;
            var characteristic;
            var configCharacteristic;
            var fwAddr;
            var fwAddrEnd;
            var fwLength;
            var addr;
            var end;
            var section;
            var previousSection;
            var fwIndex;
            var writeLength;
            var bankIndex = 0;
            var usableBank;
            var bankVersion = [-1,-1];
            var bankCRC = [-1,-1];

            var suotaCtrl;
            var banks = [0x8000, 0x28000];

            // service = evothings.ble.getService(device, SUOTA_SERVICE_UUID);
            // characteristic = evothings.ble.getCharacteristic(service, SUOTA_STATUS_NTF_UUID);
            // evothings.ble.enableNotification(device, characteristic.handle, notifySuccess, readError);
            //


            gotchaFunction = 'init';
            doGotchaChat();
            function doGotchaChat()
            {

// -------------------------------------------------------------------------
// -------------------------------------------------------------------------

            function initWriteGood(report)
            {
                console.log('initWriteGood');
                gotchaFunction = 'getCRCs';
                function removeNotifyGood(report)
                {
                    console.log('removeNotifyGood: ' + report);
                    doGotchaChat();
                }
                function removeNotifyBad (error)
                {
                    console.log('removeNotifyBad: ' + error);
                }

                service = evothings.ble.getService(device, SUOTA_SERVICE_UUID);
                characteristic = evothings.ble.getCharacteristic(service, SUOTA_STATUS_NTF_UUID);
                evothings.ble.disableNotification(device, characteristic.handle, removeNotifyGood, removeNotifyBad);
            }
            function initWriteBad(error)
            {
                console.log('initWriteBad');
            }
			if (gotchaFunction == 'init')
			{
				console.log("doing INIT");
                suotaCtrl = new Uint8Array([0]);
            	service = evothings.ble.getService(device, SUOTA_SERVICE_UUID);
                characteristic = evothings.ble.getCharacteristic(service, SUOTA_CTRL_UUID);
                evothings.ble.writeCharacteristic(device, characteristic.handle, suotaCtrl, initWriteGood, initWriteBad);
			}



// -------------------------------------------------------------------------
// -------------------------------------------------------------------------
			if (gotchaFunction == 'stats')
			{

			}
// -------------------------------------------------------------------------
// -------------------------------------------------------------------------
			else if (gotchaFunction == 'settings')
			{

			}


// -------------------------------------------------------------------------
// -------------------------------------------------------------------------
			else if (gotchaFunction == 'getCRCs')
			{
                console.log('getCRCs');
                bankIndex = 0;
                var currentVersions;
                function notifyCRCGood(report)
                {
                    var newValue = (new Int32Array(report));
                    newValue = newValue[0];
                    if (newValue < 0)
                    {
                        newValue = 0xffffffff - ~newValue;
                    }
				    var string = (new Int8Array(newValue)).toString();
					showMessage('notifyCRCGood: ' + string.toString(16));

					// currentVersions [bankIndex] = versionCrc.indexOf(bankCRC[0]);
                    getBankCRCs();
                    bankIndex++;
                }
                function notifyCRCBad(report)
                {
                    console.log('notifyCRCBad: ' + JSON.stringify(report));
                }

                function getCRCsWriteGood(error)
                {
                    console.log('getCRCWriteGood: ' + JSON.stringify(error));
                }
                function getCRCsWriteBad(error)
                {
                    console.log('getCRCWriteBad: ' + JSON.stringify(error));
                }
                function getBankCRCs()
                {
                    if (bankIndex >= 2)
                    {
						var currentVersions = [-1,-1];
						currentVersions [0] = versionCrc.indexOf(bankCRC[0]);
						currentVersions [1] = versionCrc.indexOf(bankCRC[1]);
						var lowestVersion = currentVersions.indexOf(Math.min(...currentVersions));
                        console.log("lowest bank is " + lowestVersion);

                        return;
                    }

            	    service = evothings.ble.getService(device, SUOTA_SERVICE_UUID);
                    characteristic = evothings.ble.getCharacteristic(service, SUOTA_CTRL_UUID);

                    addr = banks[bankIndex];
                    end = 0x7f10;
            		console.log('Doing CRC: ' + addr.toString(16) + " " + end.toString(16));

                    suotaCtrl = new Uint8Array([4, ((addr) & 0xff), ((addr >> 8) & 0xff), ((addr >> 16) & 0xff), ((addr >> 24) & 0xff),
                        ((end) & 0xff), ((end >> 8) & 0xff), ((end >> 16) & 0xff), ((end >> 24) & 0xff),
                    ]);
                    evothings.ble.writeCharacteristic(device, characteristic.handle, suotaCtrl, getCRCsWriteGood, getCRCsWriteBad);
                }

                console.log('getCRCs - setup enableNotification');
                service = evothings.ble.getService(device, SUOTA_SERVICE_UUID);
                characteristic = evothings.ble.getCharacteristic(service, SUOTA_STATUS_NTF_UUID);
                evothings.ble.enableNotification(device, characteristic.handle, notifyCRCGood, notifyCRCBad);

                // getBankCRCs();

//                 if (section == 'checkingCRCs')
//                 {
// 					else if (bankIndex == 2)
// 					{
//                         section = "ready for next section";
// // Check which bank holds the lowest version
// 						var currentVersions = [-1,-1];
// 						currentVersions [0] = versionCrc.indexOf(bankCRC[0]);
// 						currentVersions [1] = versionCrc.indexOf(bankCRC[1]);
// 						var lowestVersion = currentVersions.indexOf(Math.min(...currentVersions));
//                         console.log("lowest bank is " + lowestVersion);
//
//
//                         // var min = bankVersion.indexOf(Math.min(...bankVersion));
//                         // console.log("lowest bank is " + min);
//                         bankIndex = lowestVersion;
//                         fwAddrEnd = banks[bankIndex] + 0x7f10;
//                         section = '';
//                         fwAddr = banks[bankIndex];
//                         addr = fwAddr;
//                         end = 0x800;
//                         console.log("download CRCs=" + JSON.stringify(versionCrc.toString(16)));
//                         console.log("download CRC=" + downloadCRC.toString(16) + " bank 0 CRC=" + bankCRC[0].toString(16) + " bank 1 CRC=" + bankCRC[1].toString(16));
//
// // check if downloaded version is in the CRC list
//                         var crcTest = versionCrc.indexOf(downloadCRC);
//                         if (crcTest == -1)
//                         {
//                             console.log("File not supported");
//                             section = 'wrongVersion';
//                         }
//                          else
//                         {
// // Yep found it in the list of CRC's
// 	                        if ((downloadCRC == bankCRC[0]) || (downloadCRC == bankCRC[1]))
// 	                        {
// 	                            section = 'latestVersion';
// 	                            showMessage("Already on latest version");
// 								section = 'erase';
// 	                            // releaseDevice();
// 	                        }
// 							else
// 							{
//
// 								section = 'erase';
// 							}
//                         }
// 					}
// 				}
			}

// -------------------------------------------------------------------------
// -------------------------------------------------------------------------
			else if (gotchaFunction == 'getLowestBank')
			{

			}

// -------------------------------------------------------------------------
// -------------------------------------------------------------------------
            else if (gotchaFunction == 'remove')
            {
                // function notifyRemoveGood(report)
                // {
                //     console.log('notifyRemoveGood: ' + JSON.stringify(report));
                // }
                // function notifyRemoveBad(report)
                // {
                //     console.log('notifyRemoveBad: ' + JSON.stringify(report));
                // }
                // service = evothings.ble.getService(device, SUOTA_SERVICE_UUID);
                // characteristic = evothings.ble.getCharacteristic(service, SUOTA_STATUS_NTF_UUID);
                // evothings.ble.enableNotification(device, characteristic.handle, notifyRemoveGood, notifyRemoveBad);


            	function UpgradeRebootWriteGood(error)
            	{
                    console.log("UpgradeRebootWriteGood");
                    disconnectDevice();
                    section = "";
                    setTimeout(function(){ unbondDevice() }, 2000);
                }
            	function UpgradeRebootWriteBad(error)
            	{
                    console.log("UpgradeRebootWriteBad");
                    disconnectDevice();
                    section = "";
                    setTimeout(function(){ unbondDevice() }, 2000);
                }
                function UpgradeReboot()
            	{
                    console.log("Doing UpgradeReboot");
                    suotaCtrl = new Uint8Array([6,1]);
                	service = evothings.ble.getService(device, SUOTA_SERVICE_UUID);
                    characteristic = evothings.ble.getCharacteristic(service, SUOTA_CTRL_UUID);
                    evothings.ble.writeCharacteristic(device, characteristic.handle, suotaCtrl, UpgradeRebootWriteGood, UpgradeRebootWriteBad);
                }

                function unbondDone()
                {
                    console.log("Unbond Done");
                    // evothings.ble.disableNotification(device, characteristic.handle, removeNotifyGood, removeNotifyBad);
                }
                function unbondError()
                {
                    console.log("Unbond Failed");
                }
                function unbondDevice()
                {
                    evothings.ble.unbond(device, unbondDone,unbondError);
                    // evothings.ble.unbond(mDevice, unbondDone,unbondError);
                }
                UpgradeReboot();
            }
// -------------------------------------------------------------------------
// -------------------------------------------------------------------------
			else if (gotchaFunction == 'update')
			{
	            document.getElementById('percentageBarOuter').style.display = 'none';
	            // showMessage('Connected to Gotcha-Upgrader')
	            service;
	            characteristic;
	            configCharacteristic;
	            fwAddr = 0x28000;
	            fwAddrEnd = 0x2ff10;
	            fwLength = 0x7f10;
	            addr = fwAddr;
	            end = 0x800;
	            section = "";
	            previousSection = "";
	            fwIndex = 0;
	            writeLength = 0x200;
	            bankIndex = 0;
	            usableBank = -1;
	            bankVersion = [-1,-1];
	            bankCRC = [-1,-1];

	            suotaCtrl = [0];


                function ab2str(buf)
                {
                    return String.fromCharCode.apply(null, new Uint8Array(buf));
                }

    // When something has happened it should come into this function
            	function notifySuccess(error)
            	{

                    // console.log(JSON.stringify(error, null, 2));
                    var newValue = (new Int32Array(error));
                    newValue = newValue[0];
                    if (newValue < 0)
                    {
                        newValue = 0xffffffff - ~newValue;
                    }
                    addr = newValue;

                    console.log("Notification=" + newValue.toString(16));
                    // console.log(JSON.stringify(newValue, null, 2)); //this is correct 32bit value
                    console.log("section " + section);


    // Looking for correct value to return from Go-Tcha in upgrade mode...
                    if (newValue == 0x12345678)
                    {
                        section = 'init';
                    }
                    // if (newValue == 0)
                    // {
                    //     return;
                    // }
                    // if (newValue == 0x00E04013)
                    // {
                    //     showMessage('Notify message: ' + newValue.toString(16));
                    //     section = "getCRCs";
                    // }
                    // if (newValue == 0x00a13113)
                    // {
                    //     showMessage('Notify message: ' + newValue.toString(16));
                    //     section = "getCRCs";
                    // }

    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------

    				function InitWriteBad (error)
    				{
    					console.log("Something went wrong in INIT");
    					return;
    				}
    				function InitWriteGood1 (error)
    				{
    					console.log("INIT posted correctly");
    					return;
    				}
    				if (section == "initReturn")
    				{
    					console.log("All went well in INIT");
    					section = "animation";
    				}
                    if (section == "init")
                    {
    					console.log("doing INIT");
                        suotaCtrl = new Uint8Array([0]);
                    	service = evothings.ble.getService(device, SUOTA_SERVICE_UUID);
                        characteristic = evothings.ble.getCharacteristic(service, SUOTA_CTRL_UUID);
                        evothings.ble.writeCharacteristic(device, characteristic.handle, suotaCtrl, InitWriteGood1, InitWriteBad);
    					section = "initReturn";
                    }
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------

                	function UpgradeAnimationWiteGood(error)
                	{
                        console.log("Animation started");
    					return;
                    }
                	function UpgradeAnimationWiteBad(error)
                	{
                        console.log("Animation started");
    					return;
                    }
    				if (section == "animationReturn")
    				{
    					console.log("All went well in animationReturn");
    					section = "readingSettings";
    				}
                	if (section == "animation")
                	{
                        console.log("Starting animation");
                        // section = "";
                        var string = (new Int8Array(error)).toString();
                        var value = 0x4000;
                        suotaCtrl = new Uint8Array([5, 1, (value & 0xff), ((value >> 8) & 0xff), 4]);
                        evothings.ble.writeCharacteristic(device, characteristic.handle, suotaCtrl, UpgradeAnimationWiteGood, UpgradeAnimationWiteBad);
    					section = "animationReturn"
                    }

    // -------------------------------------------------------------------------
    // CRC functions for below
    // -------------------------------------------------------------------------
    				if (section == 'checkCRCsreturned')
    				{
                        bankCRC[bankIndex] =  newValue;
                        section = previousSection;
    					console.log("checkCRCsreturned " + section + " " + previousSection);
                		showMessage('CRC' + bankIndex + ' Done: ' + newValue);
                        bankIndex++;
    				}
                	function getCRCWriteGood(error)
                	{
    					showMessage('reading CRC value');
                        // var string = (new Int8Array(error)).toString();
                		// showMessage('CRC' + bankIndex + ' Done: ' + error.toString(16));
    					return;
                    }
                	function getCRCWriteBad(error)
                	{
                        var string = (new Int8Array(error)).toString();
                		showMessage('BAD writeCharacteristic - ' + 'CRC' + bankIndex + ' Done: ' + error.toString(16));
    					return;
                    }
                    function getCRC(bank)
                    {
                	    service = evothings.ble.getService(device, SUOTA_SERVICE_UUID);
                        characteristic = evothings.ble.getCharacteristic(service, SUOTA_CTRL_UUID);

    					previousSection = section;
    					section = 'checkCRCsreturned';

                        addr = bank;
                        end = 0x7f10;
                		console.log('Doing CRC: ' + addr.toString(16) + " " + end.toString(16));

                        suotaCtrl = new Uint8Array([4, ((addr) & 0xff), ((addr >> 8) & 0xff), ((addr >> 16) & 0xff), ((addr >> 24) & 0xff),
                            ((end) & 0xff), ((end >> 8) & 0xff), ((end >> 16) & 0xff), ((end >> 24) & 0xff),
                        ]);
                        evothings.ble.writeCharacteristic(device, characteristic.handle, suotaCtrl, getCRCWriteGood, getCRCWriteBad);
                    }

    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------

                    if (section == 'checkingCRCs')
                    {
                        if (bankIndex < 2)
                        {
                        	showMessage("Checking versions");
    						getCRC(banks[bankIndex]);
    					}
    					else if (bankIndex == 2)
    					{
                            section = "ready for next section";
    // Check which bank holds the lowest version
    						var currentVersions = [-1,-1];
    						currentVersions [0] = versionCrc.indexOf(bankCRC[0]);
    						currentVersions [1] = versionCrc.indexOf(bankCRC[1]);
    						var lowestVersion = currentVersions.indexOf(Math.min(...currentVersions));
                            console.log("lowest bank is " + lowestVersion);


                            // var min = bankVersion.indexOf(Math.min(...bankVersion));
                            // console.log("lowest bank is " + min);
                            bankIndex = lowestVersion;
                            fwAddrEnd = banks[bankIndex] + 0x7f10;
                            section = '';
                            fwAddr = banks[bankIndex];
                            addr = fwAddr;
                            end = 0x800;
                            console.log("download CRCs=" + JSON.stringify(versionCrc.toString(16)));
                            console.log("download CRC=" + downloadCRC.toString(16) + " bank 0 CRC=" + bankCRC[0].toString(16) + " bank 1 CRC=" + bankCRC[1].toString(16));

    // check if downloaded version is in the CRC list
                            var crcTest = versionCrc.indexOf(downloadCRC);
                            if (crcTest == -1)
                            {
                                console.log("File not supported");
                                section = 'wrongVersion';
                            }
                             else
                            {
    // Yep found it in the list of CRC's
    	                        if ((downloadCRC == bankCRC[0]) || (downloadCRC == bankCRC[1]))
    	                        {
    	                            section = 'latestVersion';
    	                            showMessage("Already on latest version");
    								section = 'erase';
    	                            // releaseDevice();
    	                        }
    							else
    							{

    								section = 'erase';
    							}
                            }
    					}
    				}
// -------------------------------------------------------------------------
// -------------------------------------------------------------------------

                	function eraseWriteGood(error)
                	{
    					console.log('eraseWriteGood');
                    }
                	function eraseWriteBad(error)
                	{
    					console.log('eraseWriteBad');
                    }
                	function doErase(error)
                	{
                        var string = (new Int8Array(error)).toString();
                		showMessage('Erasing: ' + rescale(addr, fwAddr, fwAddrEnd-0x800, 0, 99) + "%");

                        // document.getElementById("percentageBar").style.width = rescale(addr, fwAddr, fwAddrEnd, 0, 100) + "%";
                        document.getElementById("percentageBarOuter").style.display = 'block';

                        var newValue = rescale(addr, fwAddr, fwAddrEnd-0x800, 0, 99);
                        rescaleGauge(newValue ,'innerErase');

                	    service = evothings.ble.getService(device, SUOTA_SERVICE_UUID);
                        characteristic = evothings.ble.getCharacteristic(service, SUOTA_ERASE_UUID);

                        previousSection = section;

                        suotaCtrl = new Uint8Array([((addr) & 0xff), ((addr >> 8) & 0xff), ((addr >> 16) & 0xff), ((addr >> 24) & 0xff),
                            ((end) & 0xff), ((end >> 8) & 0xff), ((end >> 16) & 0xff), ((end >> 24) & 0xff),
                        ]);
                        evothings.ble.writeCharacteristic(device, characteristic.handle, suotaCtrl, eraseWriteGood, eraseWriteBad);
                    }

                    if (section == "erase")
                    {
                        if (addr >= fwAddrEnd)
                        {
                            console.log("Erase Done");
                            addr = banks[bankIndex];
                            writeLength = 0x100;
                            end = 0x100;
                            fwIndex = 0;
                            section = "write";
                        }
                        else
                        {
                            if ((fwAddr == 0x8000) || (fwAddr == 0x28000))
                            {
                                doErase(error);
                            }
                        }
                    }

    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------

                	function writeWriteGood(error)
                	{
                        // var string = (new Int8Array(error)).toString();
    					console.log('writeWriteGood');
                    }
                	function writeWriteBad(error)
                	{
    					// var string = (new Int8Array(error)).toString();
    					console.log('writeWriteBad');
                    }
                	function doWrite(error)
                	{
                        var string = (new Int8Array(error)).toString();
                		showMessage('Upgrading: ' + rescale(addr, fwAddr, fwAddrEnd-0x100, 0, 99) + "%");

                        // document.getElementById("percentageBar").style.width = rescale(addr, fwAddr, fwAddrEnd, 0, 100) + "%";
                        document.getElementById("percentageBarOuter").style.display = 'block';

                        var newValue = rescale(addr, fwAddr, fwAddrEnd-0x100, 0, 99);
                        rescaleGauge(newValue ,'outerProgramming');

                	    service = evothings.ble.getService(device, SUOTA_SERVICE_UUID);
                        characteristic = evothings.ble.getCharacteristic(service, SUOTA_WRITE_UUID);

                        suotaCtrl = new Uint8Array(writeLength+8);

                        if ((fwAddrEnd - addr) < end) end = (fwAddrEnd - addr);
                        console.log("writing at addr=" + addr.toString(16) + " length=" + end.toString(16));

                        suotaCtrl[0] = ((addr) & 0xff)
                        suotaCtrl[1] = ((addr >> 8) & 0xff)
                        suotaCtrl[2] = ((addr >> 16) & 0xff)
                        suotaCtrl[3] = ((addr >> 24) & 0xff)
                        suotaCtrl[4] = ((end) & 0xff)
                        suotaCtrl[5] = ((end >> 8) & 0xff)
                        suotaCtrl[6] = ((end >> 16) & 0xff)
                        suotaCtrl[7] = ((end >> 24) & 0xff)

                        console.log("Addr=" + addr.toString(16) + " end=" + end.toString(16) + " fwAddr=" + fwAddr.toString(16) + " bufferAddr=" + (addr-fwAddr).toString(16));
                        for (loop = 0; loop < end; loop++)
                        {
                            suotaCtrl[loop+8] = newData[loop+(addr-fwAddr)];
                        }
                        var string = (new Int8Array(suotaCtrl)).toString();
        //        		showMessage('NEW suotaCtrl: ' + JSON.stringify(string));
                        evothings.ble.writeCharacteristic(device, characteristic.handle, suotaCtrl, writeWriteGood, writeWriteBad);
                    }

                    if (section == "write")
                    {
                        if (addr >= fwAddrEnd)
                        {
                            console.log("Write Done");
                            addr = fwAddr;
                            end = 0x100;
                            section = "checkWrite";
                            // section = "";
                            // notifySuccess(error);
                        }
                        else
                        {
                            if ((addr < fwAddr) || (addr > (fwAddr+fwAddrEnd)))
                            {
                                showMessage("Error whilst writing");
                                section = "error";
                            }
                            else
                            {
                                doWrite(error);
                            }
                        }
                    }

    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------

                    if (section == "checkWriteCRC")
                    {
                        console.log("checkWriteCRC - " + newValue);
                        var crcIndex = bankVersion.indexOf(newValue);
                        if (newValue == downloadCRC)
                        {
                            showMessage("Finished!");
                        }
                        else
                        {
                            showMessage("Error - Please try again");
                        }
                        // section = "UpgradeReboot";
                        // notifySuccess(error);
                    }

                    if (section == "checkWrite")
                    {
                        console.log("Checking new CRC...");
                        section = "checkWriteCRC";
                        getCRC(banks[bankIndex]);
                    }

    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------

                    function releaseFlashWriteGood(error)
                    {
                        console.log("releaseFlashWrite Done");
                        // section = "UpgradeReboot";
                        service = evothings.ble.getService(device, SUOTA_SERVICE_UUID);
                        characteristic = evothings.ble.getCharacteristic(service, SUOTA_STATUS_NTF_UUID);
                        evothings.ble.disableNotification(device, characteristic.handle, removeNotifyGood, removeNotifyBad);
                    }
                    function releaseFlashWriteBad(error)
                    {
                        console.log("releaseFlashWrite didn't work");
                    }
                    function releaseDevice(error)
                    {
                        console.log("Doing releaseFlash...");
                        suotaCtrl = new Uint8Array([1]);
                    	service = evothings.ble.getService(device, SUOTA_SERVICE_UUID);
                        characteristic = evothings.ble.getCharacteristic(service, SUOTA_CTRL_UUID);
                        evothings.ble.writeCharacteristic(device, characteristic.handle, suotaCtrl, releaseFlashWriteGood, releaseFlashWriteBad);
                    }


                    var eraseAddr = fwAddr;
                    function newAddr (addressArray)
                    {
                        var add = addressArray[3] | (addressArray[2] << 8) | (addressArray[1] << 16) | (addressArray[0] << 24)
                        console.log("new address = " + add);
                    }

                    function str2ab(str) {
                      var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
                      var bufView = new Uint16Array(buf);
                      for (var i=0, strLen=str.length; i<strLen; i++)
                      {
                        bufView[i] = str.charCodeAt(i);
                      }
                      return buf;
                    }

                	function UpgradeReadSuccess(error)
                	{
                        var string = (new Int8Array(error)).toString();
                		showMessage('Read success: ' + JSON.stringify(string));
                		console.log('Read success: ' + JSON.stringify(error));
                    }

                    function writeUpgradeError(error)
                    {
                		// showMessage('Write Error: ' + JSON.stringify(error));
                		showMessage('Error: ' + error);
                        stage = 0;
            	        // document.getElementById('connect').style.display = 'block';
                    }

    				function doReadWriteGood(error)
    				{
    					showMessage('Read success: ');
    					if (section == "readingStatsDone")
    					{
    					    statsBuffer = (new Int8Array(error));
    				    	dumpHex(settingsBuffer, 4, 0x100);
    						section = "checkingCRCs";
    					}
    					if (section == "readingSettingsDone")
    					{
    					    settingsBuffer = (new Int8Array(error));
    				    	dumpHex(settingsBuffer, 4, 0x100);
    					    section = "readingStats";
    					}
    				}
    				function doReadWriteBad(error)
    				{

    				}
    				function doRead(error)
    				{
    				    var string = (new Int8Array(error)).toString();
    					showMessage('Doing Read: ' + addr.toString(16) + " " + end.toString(16));

    				    service = evothings.ble.getService(device, SUOTA_SERVICE_UUID);
    				    characteristic = evothings.ble.getCharacteristic(service, SUOTA_READ_UUID);
    				    evothings.ble.readCharacteristic(device, characteristic.handle, doReadWriteGood, doReadWriteBad);
    				}
    				function readDataBad()
    				{
    					console.log("readData was BAD");
    				}
    				function readData(error, readAddr)
    				{
    					addr = readAddr;
    					end = readAddr + 0x100;
    				    var string = (new Int8Array(error)).toString();
    					// showMessage('Doing Verify: ' + JSON.stringify(string));
    					showMessage('Setting read address: ' + readAddr.toString(16) + " " + end.toString(16));

    				    service = evothings.ble.getService(device, SUOTA_SERVICE_UUID);
    				    characteristic = evothings.ble.getCharacteristic(service, SUOTA_CTRL_UUID);

    				    suotaCtrl = new Uint8Array([3, ((readAddr) & 0xff), ((readAddr >> 8) & 0xff), ((readAddr >> 16) & 0xff), ((readAddr >> 24) & 0xff),
    				        ((end) & 0xff), ((end >> 8) & 0xff), ((end >> 16) & 0xff), ((end >> 24) & 0xff),
    				    ]);
    				    evothings.ble.writeCharacteristic(device, characteristic.handle, suotaCtrl, doRead, readDataBad);
    				}
    				if (section == "readingStats")
    				{
    					section = "readingStatsDone"
    					readData(error, 0x1b000);
    				}
    				if (section == "readingSettings")
    				{
    					section = "readingSettingsDone"
    					readData(error, 0x1b000);
    				}
                }
            }
        }
        }
    }
	function onDisconnectedGotcha(device)
	{
		showMessage('Device disconnected');
    	document.getElementById('upgrade').style.display = 'none';
    	document.getElementById('connect').style.display = '';
	}

	// Function called when a connect error or disconnect occurs.
	function onConnectErrorGotcha(error)
	{
		showMessage('Connect error: ' + error)
        if (error == 19)
        {
            showMessage('Please remove Pokemon GO Plus or ' + productName + ' from the bluetooth paired devices---');
        }

		// If we get Android connect error 133, we wait and try to connect again.
		// This can resolve connect problems on Android when error 133 is seen.
		// In a production app you may want to have a function for aborting or
		// maximising the number of connect attempts. Note that attempting reconnect
		// does not block the app however, so you can still do other tasks and
		// update the UI of the app.
		if (error == 133)
		{
			showMessage('Reconnecting...---')
			// setTimeout(function() { connectToDevice(device) }, 1000)
		}
		if (error == 62)
		{
			showMessage('Reconnecting...---')
			// setTimeout(function() { connectToDevice(device) }, 1000)
		}
	}
}


var devicesCount = 0;
function scanForDeviceGO()
{
    if (seenGotcha != true)
    {
	       showMessage('Press the Go-tcha button');
    }

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
            // showMessage('Remove Pokemon Go Plus or Gotcha from bluetooth device list');
            devicesCount = 0;
        }
		console.log('Found device: ' + device.name)
        // var string = (new Int8Array(device)).toString();
		// console.log(JSON.stringify(device));

		// if (device.advertisementData.kCBAdvDataLocalName == 'Gotcha-Upgrader')
		if (device.name == 'Gotcha-Upgrader')
		{
			showMessage('Found Gotcha-Upgrader')
			evothings.ble.stopScan();

			connectToDeviceGotcha(device);
			// connectToDevice(device);
        }

		// if ((device.advertisementData.kCBAdvDataLocalName == 'Pokemon GO Plus') || (device.name == 'Gotcha-Upgrader'))
		if (device.name == 'Pokemon GO Plus')
		{
            if (seenGotcha != true)
            {
    			showMessage('Found Pokemon Go Plus')
            }
            seenGotcha = true;
			// Stop scanning.
			evothings.ble.stopScan();

			// Bond and connect.
			evothings.ble.bond(
				device,
				function(state)
				{
					// Android returns 'bonded' when bonding is complete.
					// iOS will return 'unknown' and show paring dialog
					// when connecting.
					if (state == 'bonded' || state == 'unknown')
					{
                        console.log('bonded?- ' + state);
						connectToDeviceGO(device)
					}
					else if (state == 'bonding')
					{
                        console.log('Bonding in progress');
						showMessage('Bonding in progress');
					}
					else if (state == 'unbonded')
					{
                        console.log('Bonding aborted');
						showMessage('Bonding aborted');
					}
				},
				function(error)
				{
                    console.log('Bond error: ' + error);
					showMessage('Bond error: ' + error);
				})
		}
	}

	// Function called when a scan error occurs.
	function onScanError(error)
	{
		showMessage('Scan error: ' + error)
	}
}

function findPokemonGOPlus()
{
	disconnectDevice()

	searchForBondedDeviceOLD({
		// name: 'Pokemon GO Plus',
		name: '',
		serviceUUIDs: [CONTROL_SERVICE],
		onFound: connectToDeviceGO,
		onNotFound: scanForDeviceGO,
		})

}
