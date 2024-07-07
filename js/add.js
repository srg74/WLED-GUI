// event listners for dicover light buttons
document.getElementById("discoverLightsButton").addEventListener("click", scanLights);
// event listners for scan select field
document.getElementById("scanMethod").addEventListener("change", checkMethod);

// search for wled devices and add them
function scan(bonjour) {
    if (document.getElementById("scanMethod").value === "bruteforce") {
        log.verbose("Scan method: bruteforce");
        // get IP of device
        let os = require('os');
        var interfaces = os.networkInterfaces();
        var addresses = [];
        log.silly("Interfaces:");
        log.silly(interfaces);
        for (var k in interfaces) {
            for (var k2 in interfaces[k]) {
                var address = interfaces[k][k2];
                if (address.family === 'IPv4' && !address.internal) {
                    addresses.push(address.address);
                }
            }
        }
        log.debug("Subnets:");
        log.debug(addresses);

        // generate array with all possible ips of network
        for (let index = 0; index < addresses.length; index++) {
            const element = addresses[index];
            let subnet = element.slice(0, element.lastIndexOf(".") + 1);
            var ip = [];
            for (let index = 0; index < 255; index++) {
                ip.push(subnet + index);
            }
        }

        log.silly("All possible ips of network:");
        log.silly(ip);

        // checks for each element in an array if its a wled device
        ip.forEach(element => {
            checkWled(element, function (wled) {
                if (wled !== false && wled !== true) {
                    addLight(wled.name, wled.ip);
                }
            });
        });

    }
    if (document.getElementById("scanMethod").value === "bonjour") {
        log.verbose("Scan method: bonjour");

        // browse for all http services
        bonjour.find({ type: "http" }, function (service) {
            let ip = service["addresses"][0];
            log.debug("found IP: " + ip)
            checkWled(ip, function (wled) {
                if (wled !== false && wled !== true) {
                    addLight(wled.name, wled.ip);
                }
            });
        })
    }
}

// checks if a specific device is a wled device
function checkWled(ip, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", 'http://' + ip + '/json/info', true);
    xhr.timeout = 2000; // time in milliseconds
    xhr.onload = function () { // Call a function when the state changes.
        try {
            var json = JSON.parse(xhr.response);
        }
        catch {
            var json = { "brand": null };
        }
        if (json.brand === "WLED") {
            if (checkIP(ip) === false) {
                log.verbose("WLED " + ip + " found!")
                let name = json.name;
                let light = {
                    name: name,
                    ip: ip,
                    online: true
                };
                M.toast({ html: 'Found ' + name });
                callback(light);
            } else {
                callback(true);
            }
        } else {
            callback(false);
        }
    }
    xhr.onerror = function () {
        callback(false);
    };
    xhr.ontimeout = function () {
        callback(false);
    };
    xhr.send();
}

// check if a device with the ip already exists
function checkIP(targetIp) {
    function comparison(device) {
        return device.ip == targetIp;
    }
    let lights = JSON.parse(localStorage.getItem("lights"));
    if (typeof lights.find(comparison) !== "undefined") {
        return true;
    } else {
        return false;
    }
}

// scan for wled devices
function scanLights() {
    if (document.getElementById("scanMethod").value === "bonjour") { // bonjour
        let button = document.getElementById("discoverLightsButton");
        if (button.innerText === "STOP DISCOVERY") {
            bonjour.destroy();
            button.innerText = "Discover lights...";
            // Hide loader
            document.getElementById("loader").style.display = "none";
        } else {
            bonjour = require('bonjour')()
            button.innerText = "Stop discovery";
            // Show loader
            document.getElementById("loader").style.display = "block";
            scan(bonjour);
        }
    }
    if (document.getElementById("scanMethod").value === "bruteforce") { // brute-force
        scan();
    }
}

// if method changes the current scan will abort
function checkMethod() {
    if (typeof bonjour !== 'undefined') {
        bonjour.destroy();
    }
    let button = document.getElementById("discoverLightsButton");
    button.innerText = "Discover lights...";
    document.getElementById("loader").style.display = "none";
}

// adds a light and save it to localstorge
function addLightManually() {
    let ip = document.getElementById("ip").value;
    log.verbose("Add " + ip + " light manually");
    checkWled(ip, function (wled) {
        if (wled !== false && wled !== true) {
            addLight(wled.name, wled.ip);
            location.href = "index.html";
        } else if (wled === true) {
            log.warn("Light hasn't been added, because device already exists.");
            M.toast({ html: 'Error! Device already exists.' });
        } else {
            log.warn("Light hasn't been added, because connect to WLED.");
            M.toast({ html: 'Error! Can\'t connect to WLED.' });
        }
    });

}

// saves a light to local storage
function addLight(name, ip) {
    let light = {
        name: name,
        ip: ip,
        online: true,
        on: false,
        version: "unknown",
        autostart: false
    };
    let lights = JSON.parse(localStorage.getItem("lights"));
    log.verbose("Add light and save to local storage");
    log.debug(light);
    lights.push(light);
    json = JSON.stringify(lights);
    localStorage.setItem("lights", json);
}