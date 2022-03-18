
var appVersionHigh = 0;
var appVersionLow = 16;
var appFirmwareVersionHigh = 0;
var appFirmwareVersionLow = 0;
var firmwareVersionHigh = 0;
var firmwareVersionLow = 0;

function updateFirmwareDisplay()
{
    var versionString =
        "App version: " + appVersionHigh + "." + appVersionLow +
    	"<BR>" +
        "App firmware version: " + appFirmwareVersionHigh + "." + appFirmwareVersionLow +
    	"<BR>" +
    	"Go-tcha firmware version: " + firmwareVersionHigh + "." + firmwareVersionLow +
    	"<BR>";

    var element = document.getElementById("versionMarker");
    element.innerHTML = versionString;
}

var files = [];
var fileIndex = 0;

function fail(e)
{
	console.log("FileSystem Error");
	console.dir(e);
}

var fileType;
var newVersion;

function gotFile(fileEntry)
{
	fileEntry.file(function(file)
    {
		var reader = new FileReader();

		reader.onloadend = function(e)
        {
            console.log("Load finished: "+ JSON.stringify(this));

            var fileDetails = JSON.stringify(this._result);
            var currentName = this._localURL;
            if (currentName.toLowerCase().indexOf("version") >= 0)
            {
                function ab2str(buf)
                {
                    return String.fromCharCode.apply(null, new Uint8Array(buf));
                }
                console.log("VERSION FILE");
                newVersion = ab2str(this._result);
            	// showSettingsMessage('Version - ' + newVersion);
            }
            if (currentName.toLowerCase().indexOf("payload") >= 0)
            {
                console.log("FIRMWARE FILE");
                newData = new Uint8Array(this._result);
                downloadCRC = crc32(newData);
                console.log("Download CRC=" + downloadCRC.toString(16));
                var crcTest = versionCrc.indexOf(downloadCRC);
                if (crcTest != -1)
                {
                    // document.getElementById('versionDownloaded').innerHTML = "Ver." + (crcTest+1);
                }
                else
                {
                    // document.getElementById('versionDownloaded').innerHTML = "Ver.??";
                }
            }
            if (currentName.toLowerCase().indexOf("crcs") >= 0)
            {
                versionCrc = new Uint32Array(this._result);
                var crcindex;
                for (crcindex = 0; crcindex < versionCrc.length; crcindex++)
                {
                    versionCrc[crcindex] = swap32(versionCrc[crcindex]);
                }

                // console.log("Download CRC=" + versionCrc[0].toString(16) + " " + versionCrc[1].toString(16) + " " + versionCrc[2].toString(16));
                var crcString = "Downloaded CRC=";
                for (loop = 0; loop < versionCrc.length; loop++)
                {
                    crcString += versionCrc[loop].toString(16);
                    crcString += ",";
                }

                appFirmwareVersionHigh = (versionCrc.length);
                updateFirmwareDisplay();

                console.log(crcString);
                // console.log("Download CRC=" + versionCrc[0].toString(16) + " " + versionCrc[1].toString(16) + " " + versionCrc[2].toString(16));
            }
            downloadFiles();

		}
        reader.readAsArrayBuffer(file);
	});

}

function downloadFiles()
{
    if (fileIndex >= files.length)
    {
        // disconnectDeviceManual();
        showMessage("Press Go-tcha button");
        findPokemonGOPlus();
        return;
    }

    var fileTransfer = new FileTransfer();
    var fileURL = files[fileIndex];
    var uri = files[fileIndex+1];
    fileType = files[fileIndex+2];

    fileTransfer.download(
        uri,
        fileURL,
        function(entry)
        {
            console.log("download complete: " + entry.toURL());
            //readBinaryFile(entry);
            window.resolveLocalFileSystemURL(fileURL, gotFile, fail);
            fileIndex += 3;
            downloadFilesRetries = 0;
            // downloadFiles();
        },
        function(error)
        {
            downloadFilesRetries++;
            if (downloadFilesRetries < 2)
            {
                showMessage("Restart app with data enabled");
                document.getElementById('percentageBarOuter').style.display = 'none';
                return;
            }
            downloadFiles();
            console.log("download error source " + error.source);
            console.log("download error target " + error.target);

            // 1 = FileTransferError.FILE_NOT_FOUND_ERR
            // 2 = FileTransferError.INVALID_URL_ERR
            // 3 = FileTransferError.CONNECTION_ERR
            // 4 = FileTransferError.ABORT_ERR
            // 5 = FileTransferError.NOT_MODIFIED_ERR
            console.log("upload error code " + error.code);
        },
        false,
        {
            headers: {
                // add custom headers if needed
            }
        }
    );
}

function initialize_files()
{
    stage = 0;
    files = [
        cordova.file.dataDirectory + 'version.txt', encodeURI(websiteAddress + '/update/version.txt'), 'text',
        cordova.file.dataDirectory + 'crcs.bin', encodeURI(websiteAddress + '/update/crcs.bin'), 'binary',
        cordova.file.dataDirectory + 'payload.bin', encodeURI(websiteAddress + '/update/gotcha.bin'), 'binary'
    ];

    fileIndex = 0;
    downloadFilesRetries = 0;
    downloadFiles();
}
