
var deviceHandle;
var nextSection;
var settingsRetries;
function returnToMain(error)
{
    service = evothings.ble.getService(deviceHandle, SUOTA_SERVICE_UUID);
    characteristic = evothings.ble.getCharacteristic(service, SUOTA_CTRL_UUID);
    var value = 0x4000;
    suotaCtrl = new Uint8Array([5, 1, (value & 0xff), ((value >> 8) & 0xff), 4]);
    evothings.ble.writeCharacteristic(deviceHandle, characteristic.handle, suotaCtrl, doReadWriteBad, doReadWriteBad);
}
function doReadWriteGood(error)
{
	console.log('Read success: ' + section);
	if (section == "readingStatsDone")
	{
        dontSleep = false;
	    statsBuffer = (new Int8Array(error));
    	dumpHex(statsBuffer, 4, 0x100);
		section = "READING DONE";
        var base = 4;
        if (statsBuffer[4] == -86)
        {
        	stats.countryCode = 'GB';
        	stats.statsVersion = statsBuffer[base+1];
        	stats.totalKnown = statsBuffer[base+8];
        	stats.deltaSuccessKnownPokemon = statsBuffer[base+12];
        	stats.deltaTotalUnknownPokemon = statsBuffer[base+16];
        	stats.deltaSuccessUnknownPokemon = statsBuffer[base+20];
        	stats.statsGotchaLogo = statsBuffer[base+36];
        }
        returnToMain(error);
	}
	if (section == "readingSettingsDone")
	{
	    settingsBuffer = (new Int8Array(error));
    	dumpHex(settingsBuffer, 4, 0x100);
		section = "readingStats";

        if (settingsBuffer[4] == -86)
        {
            setButton('stops',(settingsBuffer[5] & 0x01))
            setButton('known',(settingsBuffer[5] & 0x02))
            setButton('unknown',(settingsBuffer[5] & 0x04))
            setButton('vibrate',(settingsBuffer[5] & 0x08))
            setButton('animations',(settingsBuffer[5] & 0x10))
		}
		else
		{
			settingsRetries++;
			if (settingsRetries < 3)
			{
				section = "readingSettings";
			}
			else
			{
				settingsBuffer[4] = -86;
				settingsBuffer[5] = 0;
			}
		}
        returnToMain(error);
	}
}
function doReadWriteBad(error)
{

}
function doRead(error)
{
    var string = (new Int8Array(error)).toString();
	console.log('Doing Read: ' + addr.toString(16) + " " + end.toString(16));

    service = evothings.ble.getService(deviceHandle, SUOTA_SERVICE_UUID);
    characteristic = evothings.ble.getCharacteristic(service, SUOTA_READ_UUID);
    evothings.ble.readCharacteristic(deviceHandle, characteristic.handle, doReadWriteGood, doReadWriteBad);
}
function readDataBad()
{
	console.log("readData was BAD");
    unbondDevice(deviceHandle, true);
}
function readData(error, device, readAddr, section)
{
    deviceHandle = device;
    nextSection = section;
	addr = readAddr;
	end = readAddr + 0x100;
    var string = (new Int8Array(error)).toString();
	// showMessage('Doing Verify: ' + JSON.stringify(string));
	console.log('Setting read address: ' + readAddr.toString(16) + " " + end.toString(16));

    service = evothings.ble.getService(device, SUOTA_SERVICE_UUID);
    characteristic = evothings.ble.getCharacteristic(service, SUOTA_CTRL_UUID);

    suotaCtrl = new Uint8Array([3, ((readAddr) & 0xff), ((readAddr >> 8) & 0xff), ((readAddr >> 16) & 0xff), ((readAddr >> 24) & 0xff),
        ((end) & 0xff), ((end >> 8) & 0xff), ((end >> 16) & 0xff), ((end >> 24) & 0xff),
	]);
	setTimeout(() => {
		evothings.ble.writeCharacteristic(device, characteristic.handle, suotaCtrl, doRead, readDataBad);
	}, 500);
}
function writeWriteGood(error)
{
	showMessage('');
}
function writeWriteBad(error)
{

}
function writeSettingsSector()
{
	showMessage('Updating settings');
    service = evothings.ble.getService(deviceHandle, SUOTA_SERVICE_UUID);
    characteristic = evothings.ble.getCharacteristic(service, SUOTA_WRITE_UUID);
    var addr = settingsAddress;
    var end = 0x100;
    var  writeLength = 0x100;
    suotaCtrl = new Uint8Array(writeLength+8);
    suotaCtrl[0] = ((addr) & 0xff)
    suotaCtrl[1] = ((addr >> 8) & 0xff)
    suotaCtrl[2] = ((addr >> 16) & 0xff)
    suotaCtrl[3] = ((addr >> 24) & 0xff)
    suotaCtrl[4] = ((end) & 0xff)
    suotaCtrl[5] = ((end >> 8) & 0xff)
    suotaCtrl[6] = ((end >> 16) & 0xff)
    suotaCtrl[7] = ((end >> 24) & 0xff)

    console.log("Addr=" + addr.toString(16) + " end=" + end.toString(16));
    for (loop = 0; loop < end; loop++)
    {
        suotaCtrl[loop+8] = settingsBuffer[loop+4];
    }
	var string = (new Int8Array(suotaCtrl)).toString();
	setTimeout(() => {
		evothings.ble.writeCharacteristic(deviceHandle, characteristic.handle, suotaCtrl, writeWriteGood, writeWriteBad);
	}, 100);
}
function writeStatsSector()
{
    service = evothings.ble.getService(deviceHandle, SUOTA_SERVICE_UUID);
    characteristic = evothings.ble.getCharacteristic(service, SUOTA_WRITE_UUID);
    var addr = statsAddress;
    var end = 0x100;
    var  writeLength = 0x100;
    suotaCtrl = new Uint8Array(writeLength+8);
    suotaCtrl[0] = ((addr) & 0xff)
    suotaCtrl[1] = ((addr >> 8) & 0xff)
    suotaCtrl[2] = ((addr >> 16) & 0xff)
    suotaCtrl[3] = ((addr >> 24) & 0xff)
    suotaCtrl[4] = ((end) & 0xff)
    suotaCtrl[5] = ((end >> 8) & 0xff)
    suotaCtrl[6] = ((end >> 16) & 0xff)
    suotaCtrl[7] = ((end >> 24) & 0xff)

    console.log("Addr=" + addr.toString(16) + " end=" + end.toString(16));
    for (loop = 0; loop < end; loop++)
    {
        suotaCtrl[loop+8] = statsBuffer[loop+4];
    }
	var string = (new Int8Array(suotaCtrl)).toString();
	setTimeout(() => {
		evothings.ble.writeCharacteristic(deviceHandle, characteristic.handle, suotaCtrl, writeWriteGood, writeWriteBad);
	}, 100);
}
var erasingSettings;
function eraseSectorGood(error)
{
	console.log('eraseSectorGood');
	erasingSettings = false;

    if (section == 'Erase Settings')
    {
		section = "LEAVING DONE";
    }
    if (section == 'Erase Stats')
    {
        section = "LEAVING DONE";
        // section = 'Erase Settings';
    }
}
function eraseSectorBad(error)
{
	console.log('eraseSectorBad');
}
function doEraseSector(startAddr)
{
    var endAddr = 0x1000;
	// showMessage('Erasing sector: ' + startAddr.toString(16));
	showMessage('Updating settings');

    service = evothings.ble.getService(deviceHandle, SUOTA_SERVICE_UUID);
    characteristic = evothings.ble.getCharacteristic(service, SUOTA_ERASE_UUID);

    suotaCtrl = new Uint8Array([((startAddr) & 0xff), ((startAddr >> 8) & 0xff), ((startAddr >> 16) & 0xff), ((startAddr >> 24) & 0xff),
        ((endAddr) & 0xff), ((endAddr >> 8) & 0xff), ((endAddr >> 16) & 0xff), ((endAddr >> 24) & 0xff),
	]);
	if (erasingSettings == false)
	{
		erasingSettings = true;
		evothings.ble.writeCharacteristic(deviceHandle, characteristic.handle, suotaCtrl, eraseSectorGood, eraseSectorBad);
	}
}

function doStatsErase()
{
    section = 'Erase Stats';
    returnToMain()
}
function cancelStatsErase()
{
    displayPage('settingsPage');
}

function updateSettings()
{
    if (section == 'Update Settings Part One')
    {
        doEraseSector(settingsAddress);
    }
    if (section == 'Update Settings Part Two')
    {
        section = 'Update Settings Part Three';
        writeSettingsSector();
    }
}

function killFirmwaresInit()
{
		section = 'killFirmwares Part One';
		killFirmwares();
}
function killFirmwares()
{
    if (section == 'killFirmwares Part One')
    {
        doEraseSector(0x8000);
    }
    if (section == 'killFirmwares Part Two')
    {
        section = 'killFirmwares Part Three';
        doEraseSector(0x28000);
    }
}

function writeTestStats()
{
    if (section == 'Update Stats Part One')
    {
        doEraseSector(statsAddress);
    }
    if (section == 'Update Stats Part Two')
    {
        section = 'Update Stats Part Three';
        var base = 4;
            statsBuffer[base+1] = 2;
            var f = new Uint32Array(0x100/4);
            f = statsBuffer;
        	statsBuffer[base+8] = 40;
        	statsBuffer[base+12] = 30;
        	statsBuffer[base+16] = 20;
        	statsBuffer[base+20] = 10;
        	statsBuffer[base+36] = 0;
        writeStatsSector();
    }
}
