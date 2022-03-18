

var settingsAddress = 0x1f000;
var statsAddress = 0x1b000;

// GLOBAL VARS
var versionCrc = [-1];
var downloadCRC;
var newData = new Uint8Array(32528);
var gotchaFunction = '';
var websiteAddress = 'https://www.go-tcha.co.uk';

var dontSleep = false;

function insomniaGood(error)
{
    console.log("keepAwakeGood");
}
function insomniaBad(error)
{
    console.log("keepAwakeBad");
}

function onDeviceReady()
{
    var settings = JSON.parse(localStorage.getItem ('Gotcha'));
    if (localStorage.getItem ('Gotcha') === null)
    {
    }
    else
    {
        if (settings.darktheme ==  1)
        {
            toggleButton('darktheme');
        }
    }

    window.plugins.insomnia.keepAwake(insomniaGood,insomniaBad);
    var countryCode;
	var UUID = device.uuid;
	console.log('UUID: ' + UUID);
    function getCountryGood (code)
    {
        console.log('Country code: ' + code);
        countryCode = code;
    }
    function getCountryBad ()
    {
        console.warn('An error occured');
    }
    plugins.country.get(getCountryGood, getCountryBad);

    document.addEventListener("pause", onPauseFired, false);
    document.addEventListener("beforeunload", exitFromApp, false);
    document.addEventListener("resume", onResumeFired, false);


    newData = new Uint8Array(payload);
    downloadCRC = crc32(newData);
    console.log("Download CRC=" + downloadCRC.toString(16));

    versionCrc = new Uint32Array(payloadcrcs);
    // var crcindex;
    // for (crcindex = 0; crcindex < versionCrc.length; crcindex++)
    // {
    //     versionCrc[crcindex] = swap32(versionCrc[crcindex]);
    // }

    console.log("Download CRC=" + versionCrc[0].toString(16) + " " + versionCrc[1].toString(16) + " " + versionCrc[2].toString(16));
    var crcString = "Downloaded CRC=";
    for (loop = 0; loop < versionCrc.length; loop++)
    {
        crcString += versionCrc[loop].toString(16);
        crcString += ",";
    }

    appFirmwareVersionHigh = (versionCrc.length);
    updateFirmwareDisplay();

    console.log(crcString);
    showMessage("Press Go-Tcha button");
    findPokemonGOPlus();

//    initialize_files();
}


function exitFromApp()
{
    leaveGotcha(device);
}
function onPauseFired()
{
    if (dontSleep == true)
    {
        console.log('Still busy updating firmware');
    }
    else
    {
        console.log('application sleeping');
        // window.plugins.insomnia.allowSleepAgain(insomniaGood,insomniaBad);
        disdev();
    }
}

function onResumeFired()
{
    if (dontSleep == true)
    {

    }
    else
    {
    	displayPage('statusPage');

        setTimeout(function() {
                findPokemonGOPlus();
            }, 3000);
    }
}

document.addEventListener("deviceready", onDeviceReady, false);

;(function()
{

function initialize()
{
    stage = 0;
    files = [
        cordova.file.dataDirectory + 'crcs.bin', encodeURI(websiteAddress + '/update/crcs.bin'), 'binary',
        cordova.file.dataDirectory + 'version.txt', encodeURI(websiteAddress + '/update/version.txt'), 'text',
        cordova.file.dataDirectory + 'payload.bin', encodeURI(websiteAddress + '/update/gotcha.bin'), 'binary'
    ];

    fileIndex = 0;
    downloadFilesRetries = 0;
}

function ab2str(buf)
{
    return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function dataToAscii(data)
{
	return String.fromCharCode.apply(null, new Uint8Array(data))
}

function convert3x16bitDataToString(data)
{
	var array = new Int16Array(data)
	return array[0] + ' ' + array[1] + ' ' + array[2]
}

function convertTemperatureDataToString(data)
{
	return (new Int16Array(data)[0]) / 100.0
}

function showSettingsMessage(text)
{
}

function forPingTimer()
{
    var lock =  window.navigator.requestWakeLock('screen');
}

})(); // End of closure.


var lastClick;
function chartsOverlayFunction(event)
{
    event.preventDefault();
    if (event.type == 'mousedown')
    {
        mouseClickedDownFunc(event);
    }
    var pos = getMousePad(event);
    if (pos[0] == -1) return;
    var x = parseInt(pos[0]);
    var y = parseInt(pos[1]);
    var width = event.target.clientWidth;
    var height = event.target.clientHeight;
    var xR = width - x;
    var yR = height - y;

    var percent = parseInt(rescale(x, 0, width, 0, 100));
    if (event.type == 'mousedown')
    {
        lastClick = percent;
    }
    if (lastClick > percent)
    {
        var element = document.getElementById("wrapper0");
        element.style.left = -(lastClick - percent) + "%";
    }
    else
    {
        var element = document.getElementById("wrapper0");
        element.style.left = (percent - lastClick) + "%";
    }

    console.log(percent + " - " + xR + " - " +  x + " - " + percent + " - " + element.style.left);
}
