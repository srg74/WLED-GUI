// set version
const wledGuiVersion = require('electron').remote.app.getVersion();

if (sessionStorage.getItem("updateReminder") === null) {
    if (localStorage.getItem("remindLaterTime") === null || (Date.now() - localStorage.getItem("remindLaterTime")) >= 259200000) {  // 3 days
        checkForUpdate();
    }
}

// checks if a update is available
function checkForUpdate() {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://raw.githubusercontent.com/WoodyLetsCode/WLED-GUI/master/VERSION', true);
    xhr.onload = function () {
        if (xhr.response !== wledGuiVersion) {
            log.info("New update avaiable!");
            let instance = M.Modal.getInstance(document.getElementById("updatePopup"));
            document.getElementById("updatePopupText").innerText = "A new update for WLED-GUI is available.\n\nYour version: " + wledGuiVersion + "\nLatest version: " + xhr.response;
            instance.open();
            sessionStorage.setItem("updateReminder", "true");
        }
    };

    xhr.send();
}