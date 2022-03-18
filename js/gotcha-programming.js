

var banks = [0x8000, 0x28000];
var bankCRC = [-1,-1];
var currentVersions = [-1,-1];
var lowestVersion = 0;
var highestVersion = 0;

var updateHeartbeat = false;

var statusPressedCount = 0;
var infoPressedCount = 0;
function statusPressed()
{
	console.log("statusPresses " + statusPressedCount + " infoPresses " + infoPressedCount);
	statusPressedCount++;
	infoPressedCount = 0;
	if (infoPressedCount == 3)
	{
		statusPressedCount+=10;
	}

}
function infoPressed()
{
	console.log("statusPresses " + statusPressedCount + " infoPresses " + infoPressedCount);
	if (statusPressedCount == 308)
	{
		console.log("SPECIAL!!!");
		infoPressedCount++;
	}
	else if (statusPressedCount == 5)
	{
		infoPressedCount++;
	}
	else
	{
		statusPressedCount = 0;
		infoPressedCount = 0;
	}
}



function connectToDeviceGotcha(device)
{
	showMessage('Connecting to device...')
	var element = document.getElementById('outerRingSync1');
	element.style.stroke = '#00ff00';

	// Save device.
	mDevice = device
    console.log("device- " + JSON.stringify(device));

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

    function doInit(device)
    {
		function InitWriteBad (error)
		{
			console.log("Something went wrong in INIT");
		}
		function InitWriteGood (error)
		{
            section = 'doGotchaCRCs';
            bankIndex = 0;
			console.log("INIT posted correctly");
		}
		if (section == "initReturn")
		{
			console.log("All went well in INIT");
		}

        rescaleGauge(0 ,'innerErase');
        rescaleGauge(0 ,'outerProgramming');

		console.log("doing INIT");
        suotaCtrl = new Uint8Array([0]);
    	service = evothings.ble.getService(device, SUOTA_SERVICE_UUID);
        characteristic = evothings.ble.getCharacteristic(service, SUOTA_CTRL_UUID);
        evothings.ble.writeCharacteristic(device, characteristic.handle, suotaCtrl, InitWriteGood, InitWriteBad);
    }


	function UpgradeAnimationWiteGood(error)
	{
        console.log("Animation started");
		return;
    }
	function UpgradeAnimationWiteBad(error)
	{
        console.log("Animation didn't start");
		return;
    }


// -------------------------------------------------------------------------
// -------------------------------------------------------------------------

	function doCRCs(device)
	{
        console.log('getCRCs');
        function notifyCRCGood(report)
        {
            section = 'doingGotchaCRCs';
        }
        function notifyCRCBad(report)
        {
            console.log('notifyCRCBad: ' + JSON.stringify(report));
			getBankCRCs();
        }
        function getCRCsWriteGood(error)
        {
            console.log('getCRCWriteGood: ' + JSON.stringify(error));
        }
        function getCRCsWriteBad(error)
        {
            console.log('getCRCWriteBad: ' + JSON.stringify(error));
			getBankCRCs();
        }
        function getBankCRCs()
        {
            if (bankIndex >= 2)
            {
				currentVersions [0] = versionCrc.indexOf(bankCRC[0]);
				currentVersions [1] = versionCrc.indexOf(bankCRC[1]);
				lowestVersion = currentVersions.indexOf(Math.min(...currentVersions));
				highestVersion = currentVersions.indexOf(Math.max(...currentVersions));
                firmwareVersionHigh = versionCrc.indexOf(bankCRC[highestVersion])+1;
                updateFirmwareDisplay();

                console.log("lowest bank is " + lowestVersion);
                console.log("highest bank is " + highestVersion);
                console.log("highest version is " + versionCrc.indexOf(bankCRC[highestVersion]));
                console.log("current version is " + ((versionCrc.length)-1));
                bankIndex = lowestVersion;
                fwAddrEnd = banks[bankIndex] + 0x7f10;
                fwAddr = banks[bankIndex];
                addr = fwAddr;
                end = 0x800;

				if (versionCrc.indexOf(bankCRC[highestVersion]) == ((versionCrc.length)-1))
				{
					showMessage("Already up-to-date");
					section = 'readingSettings';
					var element = document.getElementById('outerRingSync1');
					element.style.opacity = '0';
					var element = document.getElementById('innerRingPokemonBackground');
					element.style.opacity = '1';
					var element = document.getElementById('innerErase');
					element.style.opacity = '1';
					var element = document.getElementById('outerRingPokemonBackground');
					element.style.opacity = '1';
					var element = document.getElementById('outerProgramming');
					element.style.opacity = '1';

				}
				else
				{
	                section = 'startAnimationErase';
					var element = document.getElementById('outerRingSync1');
					element.style.opacity = '0';
					var element = document.getElementById('innerRingPokemonBackground');
					element.style.opacity = '1';
					var element = document.getElementById('innerErase');
					element.style.opacity = '1';
					var element = document.getElementById('outerRingPokemonBackground');
					element.style.opacity = '1';
					var element = document.getElementById('outerProgramming');
					element.style.opacity = '1';
				}
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
            evothings.ble.writeCharacteristic(device, characteristic.handle, suotaCtrl, notifyCRCGood, getCRCsWriteBad);
        }
        getBankCRCs();
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
		console.log('addr: ' + addr.toString(16) + ' fwAddr: ' + fwAddr.toString(16));
		showMessage('Erasing: ' + rescale(addr, fwAddr, fwAddrEnd-0x800, 0, 99) + "%");

        var newValue = rescale(addr, fwAddr, fwAddrEnd-0x800, 0, 99);
        rescaleGauge(newValue ,'innerErase');

		if (((addr >= 0x8000) && (addr < 0x10000)) || ((addr >= 0x28000) && (addr < 0x30000)))
		{
		    service = evothings.ble.getService(device, SUOTA_SERVICE_UUID);
	        characteristic = evothings.ble.getCharacteristic(service, SUOTA_ERASE_UUID);

	        previousSection = section;

	        suotaCtrl = new Uint8Array([((addr) & 0xff), ((addr >> 8) & 0xff), ((addr >> 16) & 0xff), ((addr >> 24) & 0xff),
	            ((end) & 0xff), ((end >> 8) & 0xff), ((end >> 16) & 0xff), ((end >> 24) & 0xff),
	        ]);
	        evothings.ble.writeCharacteristic(device, characteristic.handle, suotaCtrl, eraseWriteGood, eraseWriteBad);
		}
		else
		{
			console.log("bad erase address");
		}
    }

// -------------------------------------------------------------------------
// -------------------------------------------------------------------------


	function writeWriteGood(error)
	{
		console.log('writeWriteGood');
    }
	function writeWriteBad(error)
	{
		console.log('writeWriteBad');
		doWrite(error);
    }
	function doWrite(error)
	{
        var string = (new Int8Array(error)).toString();
		showMessage('Upgrading: ' + rescale(addr, fwAddr, fwAddrEnd-0x100, 0, 99) + "%");

        var newValue = rescale(addr, fwAddr, fwAddrEnd-0x100, 0, 99);
        rescaleGauge(newValue ,'outerProgramming');

		if (((addr >= 0x8000) && (addr < 0x10000)) || ((addr >= 0x28000) && (addr < 0x30000)))
		{
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
	        evothings.ble.writeCharacteristic(device, characteristic.handle, suotaCtrl, writeWriteGood, writeWriteBad);
		}
		else
		{
			console.log("bad write address");
		}
    }

// -------------------------------------------------------------------------
// -------------------------------------------------------------------------

    // When something has happened it should come into this function
    var beenHereBefore = 0;
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
        console.log("beenHereBefore: " + beenHereBefore);

// Looking for correct value to return from Go-Tcha in upgrade mode...
        if (newValue == 0x12345678)
        {
            doInit(device);
        }
        if ((newValue == 0xa13113) && (beenHereBefore > 5))
        {
            findPokemonGOPlus();
        }
        if ((newValue == 0xe04013) && (beenHereBefore > 5))
        {
            section = 'doGotchaCRCs';
            bankIndex = 0;
            findPokemonGOPlus();
        }
		else if (newValue == 0xe04013)
		{
            section = 'doGotchaCRCs';
            bankIndex = 0;
		}
        if (section == 'doGotchaCRCs')
        {
            doCRCs(device);
        }
        if (section == 'doingGotchaCRCs')
        {
            bankCRC[bankIndex] =  newValue;
            bankIndex++;
            doCRCs(device);
        }
		if (section == 'leaving Gotcha Fin')
		{
			console.log("***Leaving Gotcha FIN");
		}
		if (section == 'leaving Gotcha')
		{
			console.log("***Leaving Gotcha");
			section = "leaving Gotcha Fin";
			leaveGotchaFin(error);
		}
		if (section == 'eraseAnimationStarted')
		{
			console.log('eraseAnimationStarted');
            bankIndex = lowestVersion;
            fwAddrEnd = banks[bankIndex] + 0x7f10;
            fwAddr = banks[bankIndex];
            addr = fwAddr;
            end = 0x800;
			section = "eraseBank";
		}
        if (section == 'startAnimationErase')
        {
	        console.log("Starting animation");
	        var value = 0x4000;
        	service = evothings.ble.getService(device, SUOTA_SERVICE_UUID);
            characteristic = evothings.ble.getCharacteristic(service, SUOTA_CTRL_UUID);
	        suotaCtrl = new Uint8Array([5, 1, (value & 0xff), ((value >> 8) & 0xff), 4]);
	        evothings.ble.writeCharacteristic(device, characteristic.handle, suotaCtrl, UpgradeAnimationWiteGood, UpgradeAnimationWiteBad);
			section = 'eraseAnimationStarted';
        }
	    if (section == "eraseBank")
	    {
			dontSleep = true;

	        if (addr >= fwAddrEnd)
	        {
	            console.log("Erase Done");
	            addr = banks[lowestVersion];
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
	    if (section == "write")
	    {
	        if (addr >= fwAddrEnd)
	        {
				dontSleep = false;
	            console.log("Write Done");
	            addr = fwAddr;
	            end = 0x100;
	            section = "checkWrite";
				var element = document.getElementById('outerRingSync1');
				element.style.opacity = '1';
				var element = document.getElementById('innerRingPokemonBackground');
				element.style.opacity = '0';
				var element = document.getElementById('innerErase');
				element.style.opacity = '0';
				var element = document.getElementById('outerRingPokemonBackground');
				element.style.opacity = '0';
				var element = document.getElementById('outerProgramming');
				element.style.opacity = '0';

				doInit(device);
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

		if (section == "readingStats")
		{
			section = "readingStatsDone"
			console.log('readingStats');
			readData(error, device, statsAddress, section);
		}

		if (section == "readingSettings")
		{
			var element = document.getElementById('outerRingSync1');
			element.style.opacity = '1';
			var element = document.getElementById('innerRingPokemonBackground');
			element.style.opacity = '0';
			var element = document.getElementById('innerErase');
			element.style.opacity = '0';
			var element = document.getElementById('outerRingPokemonBackground');
			element.style.opacity = '0';
			var element = document.getElementById('outerProgramming');
			element.style.opacity = '0';
			section = "readingSettingsDone"
			console.log('readingSettings');
			readData(error, device, settingsAddress, section);
		}

		if (section == "LEAVING DONE")
		{
			section = "ENDLEAVING"
			console.log('Leaving Gotcha');
			disconnectDevice();
		}
		if (section == "READING DONE")
		{
			document.getElementById('selectionBar').style.display = 'block';
			document.getElementById('selectionBarNotConnected').style.display = 'none';
			showMessage("Ready");
			displayPage('settingsPage');
		}
		if (section == 'Erase Settings')
		{
			doEraseSector(settingsAddress);
		}
		if (section == 'Erase Stats')
		{
			doEraseSector(statsAddress);
		}
		if (section == 'Update Settings Part One')
		{
			section = 'Update Settings Part Two';
			updateSettings();
		}
		if (section == 'Update Settings Part Three')
		{
			// showMessage("");
		}
		if (section == 'Update Stats Part One')
		{
			section = 'Update Stats Part Two';
			writeTestStats();
		}
		if (section == 'killFirmwares Part One')
		{
			section = 'killFirmwares Part Two';
			killFirmwares();
		}

        beenHereBefore++;
    }

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

	function onConnectedGotcha(device)
	{

        if (device.name == 'Gotcha-Upgrader')
        {
            evothings.ble.stopScan();
		    clearTimeout(scanningHandle);
            service = evothings.ble.getService(device, SUOTA_SERVICE_UUID);
            characteristic = evothings.ble.getCharacteristic(service, SUOTA_STATUS_NTF_UUID);
            evothings.ble.enableNotification(device, characteristic.handle, notifySuccess, readError);
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
		if (error == 22)
		{

		}
		if (error == 133)
		{
			showMessage('Reconnecting...')
			evothings.ble.stopScan();
			unbondDevice(device, true);
		}
		if (error == 62)
		{
			showMessage('Reconnecting...')
			evothings.ble.stopScan();
			unbondDevice(device, true);
		}
	}
}
