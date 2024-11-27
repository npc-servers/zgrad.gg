"use strict";

var isGmod = false;
var isTest = false;
var totalFiles = 50;
var totalCalled = false;
var downloadingFileCalled = false;
var percentage = 0;
var permanent = false;

// Basic utility functions
function fadeIn(element) {
    element.style.opacity = 1;
    element.style.display = "block";
}

function setLoad(percentage) {
    document.querySelector(".overhaul").style.left = percentage + "%";
}

function announce(message, ispermanent) {
    if (!permanent) {
        var announcement = document.getElementById("announcement");
        announcement.style.opacity = '0';
        setTimeout(function() {
            announcement.innerHTML = message;
            announcement.style.opacity = '1';
        }, 500);
    }
    if (ispermanent) {
        permanent = true;
    }
}

function loadAll() {
    fadeIn(document.querySelector("nav"));
    fadeIn(document.querySelector("main"));

    // Initialize first title if rotation is disabled
    if (!Config.enableRotatingTitles && Config.titleMessages && Config.titleMessages.length > 0) {
        var titleMessage = Config.titleMessages[0];
        document.querySelector('.title h2').textContent = titleMessage.heading;
        document.querySelector('.title h1').textContent = titleMessage.subheading;
    }

    setTimeout(function() {
        if (downloadingFileCalled) {
            announce(
                "This is your first time joining, please wait for the files to download. ZGRAD loads faster than other servers!",
                true
            );
        }
    }, 10000);
}

/**
 * Rotation function for all elements
 */

function getRandomIndex(array) {
    return Math.floor(Math.random() * array.length);
}

function rotateElements(index) {
  if (!Config.enableRotatingTitles) {
      return;
  }

  // Rotate title
  if (Config.titleMessages && Config.titleMessages.length > 0) {
      var titleMessage = Config.titleMessages[index % Config.titleMessages.length];
      var h2Element = document.querySelector('.title h2');
      var h1Element = document.querySelector('.title h1');

      h2Element.style.opacity = '0';
      h1Element.style.opacity = '0';

      setTimeout(function() {
          h2Element.textContent = titleMessage.heading;
          h1Element.textContent = titleMessage.subheading;
          h2Element.style.opacity = '1';
          h1Element.style.opacity = '1';
      }, 500);
      if (Config.tipMessages && Config.tipMessages.length > 0) {
        var tipContent = document.getElementById("tip-content");
        tipContent.style.opacity = '0';

        setTimeout(function() {
            tipContent.textContent = Config.tipMessages[getRandomIndex(Config.tipMessages)];
            tipContent.style.opacity = '1';
        }, 500);
    }
}

  // Rotate announcement
  if (Config.enableAnnouncements && Config.announceMessages && Config.announceMessages.length > 0) {
      var announcement = document.getElementById("announcement");
      announcement.style.opacity = '0';

      setTimeout(function() {
          announcement.textContent = Config.announceMessages[index % Config.announceMessages.length];
          announcement.style.opacity = '1';
      }, 500);
  }

  // Rotate custom text
  if (Config.enableCustomText && Config.customTexts && Config.customTexts.length > 0) {
      var steamid = document.getElementById("steamid");
      steamid.style.opacity = '0';

      setTimeout(function() {
          steamid.textContent = Config.customTexts[index % Config.customTexts.length];
          steamid.style.opacity = '1';
      }, 500);
  }
}

function rotateSidePanel() {
    if (Config.sidePanelMessages && Config.sidePanelMessages.length > 0) {
        var header = document.querySelector('.side-header');
        var content = document.querySelector('.side-content');
        var randomIndex = getRandomIndex(Config.sidePanelMessages);
        
        header.style.opacity = '0';
        content.style.opacity = '0';

        setTimeout(function() {
            var message = Config.sidePanelMessages[randomIndex];
            header.textContent = message.header;
            content.textContent = message.content;
            header.style.opacity = '1';
            content.style.opacity = '1';
        }, 500);
    }
}

/**
 * Gmod Called functions
 */
function GameDetails(servername, serverurl, mapname, maxplayers, steamid, gamemode) {
    isGmod = true;
    if (!isTest) {
        loadAll();
    }

    if (Config.enableMap) {
        // Build map line
        var mapLine = document.querySelector(".mapline");
        mapLine.textContent = Config.mapPrefix;
        
        var mapSpan = document.createElement("span");
        mapSpan.id = "map";
        mapSpan.textContent = mapname;
        mapLine.appendChild(mapSpan);
        
        // Add player count
        var playerCountDiv = document.querySelector(".player-count");
        playerCountDiv.textContent = maxplayers + Config.playerCountSuffix;
        
        // Show the entire mapinfo section
        fadeIn(document.getElementById("mapinfo"));
    } else {
        document.getElementById("mapinfo").style.display = "none";
    }

    if (Config.enableCustomText) {
        fadeIn(document.getElementById("steamid"));
    } else {
        document.getElementById("steamid").style.display = "none";
    }
}

function SetFilesTotal(total) {
    totalCalled = true;
    totalFiles = total;
}

function SetFilesNeeded(needed) {
    if (totalCalled) {
        var sPercentage = 100 - Math.round((needed / totalFiles) * 100);
        percentage = sPercentage;
        setLoad(sPercentage);
    }
}

function DownloadingFile(filename) {
    filename = filename.replace("'", "").replace("?", "");
    downloadingFileCalled = true;
    var history = document.getElementById("history");
    if (history) {
        var newItem = document.createElement("div");
        newItem.className = "history-item";
        newItem.appendChild(document.createTextNode(filename));
        history.insertBefore(newItem, history.firstChild);

        var items = document.getElementsByClassName("history-item");
        for (var i = 0; i < items.length; i++) {
            if (i > 10) {
                items[i].parentNode.removeChild(items[i]);
            } else {
                items[i].style.opacity = (1 - i * 0.1).toString();
            }
        }
    }
}

var allow_increment = true;
function SetStatusChanged(status) {
    var history = document.getElementById("history");
    if (history) {
        var newItem = document.createElement("div");
        newItem.className = "history-item";
        newItem.appendChild(document.createTextNode(status));
        history.insertBefore(newItem, history.firstChild);

        var items = document.getElementsByClassName("history-item");
        for (var i = 0; i < items.length; i++) {
            if (i > 10) {
                items[i].parentNode.removeChild(items[i]);
            } else {
                items[i].style.opacity = (1 - i * 0.1).toString();
            }
        }
    }

    if (status === "Workshop Complete") {
        allow_increment = false;
        setLoad(80);
    } else if (status === "Client info sent!") {
        allow_increment = false;
        setLoad(95);
    } else if (status === "Starting Lua...") {
        setLoad(100);
    } else {
        if (allow_increment) {
            percentage = percentage + 0.1;
            setLoad(percentage);
        }
    }
}

/**
 * Initial function
 */
document.addEventListener("DOMContentLoaded", function() {
  // Initialize rotation for all elements
  var hasRotatingContent = (
      (Config.enableRotatingTitles && Config.titleMessages && Config.titleMessages.length > 0) ||
      (Config.enableAnnouncements && Config.announceMessages && Config.announceMessages.length > 0) ||
      (Config.enableCustomText && Config.customTexts && Config.customTexts.length > 0)
  );

  if (Config.sidePanelMessages && Config.sidePanelMessages.length > 0) {
    var sidePanelIndex = 0;
    rotateSidePanel(sidePanelIndex);
    
    setInterval(function() {
        sidePanelIndex++;
        rotateSidePanel(sidePanelIndex);
    }, Config.sidePanelRotationLength);
}

  if (hasRotatingContent) {
      var rotationIndex = 0;
      rotateElements(rotationIndex); // Show first set immediately
      
      setInterval(function() {
          rotationIndex++;
          rotateElements(rotationIndex);
      }, Config.rotationLength);
  } else if (Config.titleMessages && Config.titleMessages.length > 0) {
      // If rotation is disabled, just show the first title
      var titleMessage = Config.titleMessages[0];
      document.querySelector('.title h2').textContent = titleMessage.heading;
      document.querySelector('.title h1').textContent = titleMessage.subheading;
  }

  // if it isn't loaded by gmod load manually
  setTimeout(function() {
      if (!isGmod) {
          isTest = true;
          loadAll();

          GameDetails(
              "Servername",
              "Serverurl",
              "Mapname",
              "Maxplayers",
              "SteamID",
              "Gamemode"
          );

          var totalTestFiles = 100;
          SetFilesTotal(totalTestFiles);

          var needed = totalTestFiles;
          setInterval(function() {
              if (needed > 0) {
                  needed = needed - 1;
                  SetFilesNeeded(needed);
                  DownloadingFile("Filename " + needed);
              }
          }, 500);

          SetStatusChanged("Testing..");
      }
  }, 1000);
});