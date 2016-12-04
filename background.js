var utmKillerCache = window.localStorage;

function randomString(minLength, maxLength) {
    console.log("here");
    if (minLength > maxLength) {
        var temp = minLength;
        minLength = maxLength;
        maxLength = temp;
    }
    var length = Math.round(Math.random() * (maxLength - minLength) + minLength),
        result = '',
        chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    console.log(length);
    for (var i = length; i > 0; --i) {
        result += chars[Math.round(Math.random() * (chars.length - 1))];
    }
    console.log(result);
    return result;
}

function replaceUTM(url) {
    if (url.indexOf('?') == -1) {
        // console.log("no ?");
        return url;
    }
    var pairs = url.substring(url.indexOf('?') + 1).split('#')[0].split('&'),
        host = url.substring(0, (url.indexOf('?'))),
        array = [],
        i,
        params;

    for (i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        array[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
    pairs = [];
    for (var key in array) {
        if (array.hasOwnProperty(key)) {
            if (key.toLowerCase().substr(0, 4) == "utm_") {
                array[key] = randomString(1,20);
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
        return url;
    }

    //just cover the http. https schemas
    if (url.toLowerCase().substr(0, 7) !== "http://" &&
        url.toLowerCase().substr(0, 8) !== "https://") {
        // console.log("schema not implemented");
        return url;
    }

    if (utmKillerCache.getItem(url) === null) {
        // console.log("not in cache");
        result = replaceUTM(url);
        utmKillerCache.setItem(result, new Date().getTime());
        return result;
    } else {
        // console.log("in cache");
        if (utmKillerCache.getItem(url) - new Date().getTime() < 20000) // 20 seconds - this is huge for a redirect anyway
        {
            return url;
        }
        else {
            // console.log("cache expired");
            delete utmKillerCache.getItem(url);
            return getUTM(url);
        }
    }
}

chrome.webRequest.onBeforeRequest.addListener(
    function (info) {
        var url = info.url;
        var newUrl = getUTM(url);
        if (newUrl != url) {
            return {redirectUrl: newUrl};
        }
    },
    // filters
    {
        urls: [
            "*://*/*"
        ]
    },
    // extraInfoSpec
    ["blocking"]);
