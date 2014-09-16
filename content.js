var utmKillerCache = window.localStorage;

function randomString() {
    var length = Math.round(Math.random() * 15 + 5),
        result = '',
        chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (var i = length; i > 0; --i) {
        result += chars[Math.round(Math.random() * (chars.length - 1))];
    }
    return result;
}

function replaceUTM(url) {
    if (url.indexOf('?') == -1) {
        console.log("no ?");
        return url;
    }
    var pairs = url.substring(url.indexOf('?') + 1).split('&'),
        host = url.substring(0, (url.indexOf('?'))),
        array = [],
        i = 0,
        params = "";

    for (i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        array[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
    pairs = [];
    for (var key in array) {
        if (array.hasOwnProperty(key)) {
            if (key.toLowerCase().substr(0, 4) == "utm_") {
                array[key] = randomString();
            }
            pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(array[key]));
        }
    }
    params = pairs.join('&');
    return host + "?" + params;
}

/**
 * The whole utmKillerCache concept is not to make things faster, but to stop recurrent runs
 * @param url
 * @returns {*}
 */
function getUTM(url) {
    var result;
    if (typeof url != "string") {
        return "";
    }

    //just cover the http. https schemas
    if (url.toLowerCase().substr(0, 7) !== "http://" &&
        url.toLowerCase().substr(0, 8) !== "https://") {
        console.log("schema not covered");
        return url;
    }

    if (utmKillerCache.getItem(url) === null) {
        console.log("not in cache");
        result = replaceUTM(url);
        utmKillerCache.setItem(result, new Date().getTime());
        return result;
    } else {
        console.log("in cache");
        if (utmKillerCache.getItem(url) - new Date().getTime() < 20000) // 20 seconds - this is huge for a redirect anyway
        {
            return url;
        }
        else {
            console.log("cache expired");
            delete utmKillerCache.getItem(url);
            return getUTM(url);
        }
    }
}

if (typeof Storage !== "undefined") {
    newurl = getUTM(window.location.href);
    if (newurl !== window.location.href) {
        console.log(newurl);
        //alert(newurl);
        chrome.extension.sendRequest({redirect: newurl}); // send message to redirect
    }
}
