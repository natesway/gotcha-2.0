
var buttonColours = ["rgba(255,255,255,0.5)", "yellowgreen"];
var buttonFrameColours = ["rgba(255,255,255,0.0)", "green"];
var buttonToggles = {unknown: 0, known: 0, stops: 0, vibrate: 0, animations: 0, darktheme: 0, community: 0};
var bitToggles = {unknown: 4, known: 2, stops: 1, vibrate: 8, animations: 0x10, darktheme: 0, community: 0};

var settingsAutoCaptureUnknown = false;
var settingsAutoCaptureKnown = false;
var settingsAutoCollectStops = false;
var settingsVibrate = false;
var settingsDisableAnimations = false;

var settings;

function writeSettings()
{
	var storedSettings = window.localStorage;
	storedSettings.setItem('settingsAutoCaptureUnknown', settingsAutoCaptureUnknown);
	storedSettings.setItem('settingsAutoCaptureKnown', settingsAutoCaptureKnown);
	storedSettings.setItem('settingsAutoCollectStops', settingsAutoCollectStops);
	storedSettings.setItem('settingsVibrate', settingsVibrate);
	storedSettings.setItem('settingsDisableAnimations', settingsDisableAnimations);
}

function setDarkTheme(delay)
{
	var element = document.getElementById("logoDarkImage");
	// element.src="img/Dark Gotcha Logo.png";
	element.style.opacity = "1.0";
	var element = document.getElementById("logoImage");
	element.style.opacity = "0.0";

	element = document.getElementById("versionMarker");
	element.style.color = "white";
	element = document.getElementById("erasePageFrame");
	element.style.opacity = 1.0;
    element.style.color = "white";
    element.style.borderColor = "#bbb";
	element = document.getElementById("buttonEraseYes");
    element.style.borderColor = "#bbb";
	element = document.getElementById("buttonEraseNo");
    element.style.borderColor = "#bbb";

	element = document.getElementById('backgroundDarkImage');
	element.style.opacity = "1.0";
	elements = document.getElementsByClassName('infoPageTextColour');
	for (var i = 0; i < elements.length; i++)
	{
		elements[i].style.color="white";
	}
	elements = document.getElementsByClassName('infoPageText');
	for (var i = 0; i < elements.length; i++)
	{
		elements[i].style.color="yellow";
	}
	element = document.getElementById('selectionBar');
	element.style.filter = "invert(100%)";
	element = document.getElementById('buttonFrame');
    element.style.color = "#bbb";
}

function setLightTheme()
{
	var element = document.getElementById("logoDarkImage");
	element.style.opacity = "0.0";
	var element = document.getElementById("logoImage");
	element.style.opacity = "1.0";

	element = document.getElementById('backgroundDarkImage');
	element.style.opacity = "0.0";
	elements = document.getElementsByClassName('infoPageTextColour');
	for (var i = 0; i < elements.length; i++)
	{
		elements[i].style.color="black";
	}
	element = document.getElementById("versionMarker");
	element.style.color = "black";
	element = document.getElementById("erasePageFrame");
	element.style.opacity = 0.7;
    element.style.color = "#000000";
    element.style.borderColor = "#000000";
	element = document.getElementById("buttonEraseYes");
    element.style.borderColor = "#000";
	element = document.getElementById("buttonEraseNo");
    element.style.borderColor = "#000";

	elements = document.getElementsByClassName('infoPageText');
	for (var i = 0; i < elements.length; i++)
	{
		elements[i].style.color="red";
	}
	element = document.getElementById('selectionBar');
	element.style.filter = "invert(0%)";
	element = document.getElementById('buttonFrame');
    element.style.color = "#000000";
}

function doButtonFunction(buttonName)
{
	if (buttonName == "darktheme")
	{
		if (buttonToggles.darktheme == 1)
		{
			setDarkTheme();
		}
		else
		{
			setLightTheme();
		}
	}
}

function setButton(buttonName, value)
{
	if (value != 0) value = 1;
	buttonToggles[buttonName] = value;
	var element = document.getElementById(buttonName+'Button');
	var element = document.getElementById(buttonName+'ButtonSlider');
	element.style.left = (((buttonToggles[buttonName]*5)*10)+10) + '%';
	var element = document.getElementById(buttonName+'ButtonFrame');
	element.style.backgroundColor = buttonFrameColours[buttonToggles[buttonName]];
	doButtonFunction(buttonName);
}

function updateSettingsData(buttonName)
{
		var currentSettings = settingsBuffer[5];
		currentSettings ^= bitToggles[buttonName];
		settingsBuffer[5] = currentSettings;

		section = 'Update Settings Part One';
		updateSettings();
}

function toggleButton(buttonName)
{
	buttonToggles[buttonName] ^= 1;
	var element = document.getElementById(buttonName+'Button');
	var element = document.getElementById(buttonName+'ButtonSlider');
	element.style.left = (((buttonToggles[buttonName]*5)*10)+10) + '%';
	var element = document.getElementById(buttonName+'ButtonFrame');
	element.style.backgroundColor = buttonFrameColours[buttonToggles[buttonName]];
	doButtonFunction(buttonName);
	if (buttonName == "darktheme")
	{
		localStorage.setItem ( 'Gotcha', JSON.stringify( { darktheme: buttonToggles.darktheme} ) );
	}
	else
	{
		updateSettingsData(buttonName);
	}
}
