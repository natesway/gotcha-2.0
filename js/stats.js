

var togglePage = 0;
var gaugeInitial = 0;
var numberOfPages = 1;
var buttonActive = false;
var gaugePage = 0;
// ---------------------------------------------------------
// ---------------------------------------------------------
// ---------------------------------------------------------

 var url = 'https://stats.go-tcha.co.uk/';
var statsVersion = 2;
var totalKnown = 10;
var deltaSuccessKnownPokemon = 5;
var deltaTotalUnknownPokemon = 10;
var deltaSuccessUnknownPokemon = 6;
var statsGotchaLogo = 0;

// ---------------------------------------------------------
// ---------------------------------------------------------
// ---------------------------------------------------------
var statsAddress = 0x1b000
var statsSize = 36
//uint8
var statsValid = 0
var statsVersion = 0
var statsSync1 = 0
var statsSync2 = 0
//uint32
var statsTotalKnownPokemon = 0
var statsSuccessKnownPokemon = 0
var statsTotalUnknownPokemon = 0
var statsSuccessUnknownPokemon = 0
var statsTotalStops = 0
var statsSuccessStops = 0
var statsTotalNoPokeballs = 0
var statsGotchaLogo = 0
// ---------------------------------------------------------
// ---------------------------------------------------------
// ---------------------------------------------------------

var serverStats;
// ---------------------------------------------------------
// ---------------------------------------------------------
// ---------------------------------------------------------

var stats = {
	countryCode: '  ',
	statsVersion: 0,
	totalKnown: 0,
	SuccessKnownPokemon: 0,
	TotalUnknownPokemon: 0,
	SuccessUnknownPokemon: 0,

	deltaTotalKnownPokemon: 0,
	deltaSuccessKnownPokemon: 0,
	deltaTotalUnknownPokemon: 0,
	deltaSuccessUnknownPokemon: 0,

	statsGotchaLogo: 0
};



function writeStats()
{
	var storedStats = window.localStorage;
	storedStats.setItem('countryCode', stats.countryCode);
	storedStats.setItem('statsVersion', stats.statsVersion);
	storedStats.setItem('totalKnown', stats.totalKnown);
	storedStats.setItem('deltaSuccessKnownPokemon', stats.deltaSuccessKnownPokemon);
	storedStats.setItem('deltaTotalUnknownPokemon', stats.deltaTotalUnknownPokemon);
	storedStats.setItem('deltaSuccessUnknownPokemon', stats.deltaSuccessUnknownPokemon);
	storedStats.setItem('statsGotchaLogo', stats.statsGotchaLogo);

    console.log('STOREDSTATS UPDATED' + stats);
}

function removeStats()
{
	var storedStats = window.localStorage;
	storedStats.removeItem('countryCode');
	storedStats.removeItem('statsVersion');
	storedStats.removeItem('totalKnown');
	storedStats.removeItem('deltaSuccessKnownPokemon');
	storedStats.removeItem('deltaTotalUnknownPokemon');
	storedStats.removeItem('deltaSuccessUnknownPokemon');
	storedStats.removeItem('statsGotchaLogo');

}

function readStats()
{
	var storedStats = window.localStorage;

	if (storedStats.length != 0)
	{
// get the local stored data
		stats.countryCode = storedStats.getItem('countryCode');
		stats.statsVersion = storedStats.getItem('statsVersion');
		stats.totalKnown = storedStats.getItem('totalKnown');
		stats.deltaSuccessKnownPokemon = storedStats.getItem('deltaSuccessKnownPokemon');
		stats.deltaTotalUnknownPokemon = storedStats.getItem('deltaTotalUnknownPokemon');
		stats.deltaSuccessUnknownPokemon = storedStats.getItem('deltaSuccessUnknownPokemon');
		stats.statsGotchaLogo = storedStats.getItem('statsGotchaLogo');
	}
}

function postStats(UUID, countryCode)
{
	// writeStats();
	removeStats();
	readStats();
	writeStats();

	removeStats();

	cordovaHTTP.post(url, {
		secretWord: "[6vuWmyo49MMb66HX[un?rwhv926x)DV",
	    uuid: UUID,
		locale: countryCode,
		version: statsVersion,
		totalKnown: totalKnown,
		successKnown: deltaSuccessKnownPokemon,
		totalUnknown: deltaTotalUnknownPokemon,
		successUnknown: deltaSuccessUnknownPokemon,
		gotchaLogo: statsGotchaLogo
	}, { Authorization: "OAuth2: token" }, function(response) {
	    try {
	        serverStats = JSON.parse(response.data);
	        console.log('JSON ' + response.data);

			if (serverStats.secretWord == "]uGv86jy#Lw7yD8w97ckM26RFcB$)YDr")
			{
				console.log("EXCELLENT");
			}
	    } catch(e) {
	        console.error("JSON parsing error");
	    }
	}, function(response) {
	    console.log('STATUS ' + response.status);

	    console.log('ERROR ' + response.error);
	});

}


var toggleRegionWorld = 0;
function run(values)
{
	if (!statsBuffer) return;
	if ((statsBuffer[4] == 0xaa) || (statsBuffer[4] == -86))
	{
		if (values == "zeros")
		{
			stats.totalKnown = 0;
			stats.SuccessKnownPokemon = 0;
			stats.TotalUnknownPokemon = 0;
			stats.SuccessUnknownPokemon = 0;

			rescaleGauge(0, 'outerRingUnknownPokemonCaught');
			rescaleGauge(0, 'outerRingUnknownPokemonMissed');
			rescaleGauge(0, 'outerRingKnownPokemonCaught');
			rescaleGauge(0, 'outerRingKnownPokemonMissed');

		}
		else
		{
			stats.totalKnown = swap32(get32Bit(statsBuffer, 8));
			stats.SuccessKnownPokemon = swap32(get32Bit(statsBuffer, 12));
			stats.TotalUnknownPokemon = swap32(get32Bit(statsBuffer, 16));
			stats.SuccessUnknownPokemon = swap32(get32Bit(statsBuffer, 20));

		// get percentage for gauge
			var newValue = rescale(stats.SuccessKnownPokemon, 0, stats.totalKnown, 0, 100);
			var newValueKnown = 100;
			if (stats.totalKnown == 0)
			{
				newValue = 0;
				newValueKnown = 0;
			}

			rescaleGauge(newValue, 'outerRingKnownPokemonCaught');
			rescaleGauge(newValueKnown, 'outerRingKnownPokemonMissed');

		// get percentage for gauge
			newValue = rescale(stats.SuccessUnknownPokemon, 0, stats.TotalUnknownPokemon, 0, 100);
			var newValueUnknown = 100;
			if (stats.TotalUnknownPokemon == 0)
			{
				newValue = 0;
				newValueUnknown = 0;
			}

			rescaleGauge(newValue, 'outerRingUnknownPokemonCaught');
			rescaleGauge(newValueUnknown, 'outerRingUnknownPokemonMissed');
		}

		var textelement = document.getElementById("statsValuesLocal");
		textelement.innerHTML = stats.SuccessKnownPokemon + "/" + stats.totalKnown;
		var textelement = document.getElementById("statsValuesWorld");
		textelement.innerHTML = stats.SuccessUnknownPokemon + "/" + stats.TotalUnknownPokemon;
	}
}

function rescaleGauge(val, name)
{
	var element = document.getElementById(name);
	var r = element.getAttribute('r');
	var c = Math.PI*(r*2);

	var out_min = c;
	var out_max = 0;
	var in_min = 0;
	var in_max = 100;

    var newValue = Math.round(out_min + (val - in_min) * ((out_max - out_min) / (in_max - in_min)));
	element.style.strokeDashoffset = newValue;

}

function initStats()
{
    rescaleGauge(0, 'outerRingKnownPokemonCaught');
    rescaleGauge(0, 'outerRingKnownPokemonMissed');
    rescaleGauge(0, 'outerRingUnknownPokemonCaught');
    rescaleGauge(0, 'outerRingUnknownPokemonMissed');
}


function toggleButtonsUp()
{
	if (numberOfPages == 0) return;
	var element = document.getElementById('wrapper'+gaugePage);
	element.className = "toLeft";
	gaugePage++;
	if (gaugePage > numberOfPages)
	{
		gaugePage = 0;
	}
	var element = document.getElementById('wrapper'+gaugePage);
	element.className = "fromRight";
}
function toggleButtonsDown()
{
	if (numberOfPages == 0) return;
	var element = document.getElementById('wrapper'+gaugePage);
	element.className = "toRight";
	gaugePage--;
	if (gaugePage < 0)
	{
		gaugePage = numberOfPages;
	}
	var element = document.getElementById('wrapper'+gaugePage);
	element.className = "fromLeft";
}
