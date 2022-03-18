

var pageNames = ["statusPage", "infoPage", "settingsPage", "chartsPage", "erasePage"];

function eraseButton()
{
	displayPage('erasePage');
}

function displayPage(page)
{
	for (pages = 0; pages < pageNames.length; pages++)
	{
		if (page == pageNames[pages])
		{
	    	document.getElementById(pageNames[pages]).style.opacity = "1";
	    	document.getElementById(pageNames[pages]).style.zIndex = "1";
		}
		else
		{
	    	document.getElementById(pageNames[pages]).style.opacity = "0";
	    	document.getElementById(pageNames[pages]).style.zIndex = "0";
		}
	}
	if (page == "chartsPage")
	{
		run("stats");
	}
	else
	{
		run("zeros");
	}
	if (page == "chartsPage")
	{
		showMessage("");
	}
}
