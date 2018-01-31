(function() {
    const tabStorage = {};
    const networkFilters = {
        urls: [
            "*://developer.mozilla.org/*"
        ]
    };

    chrome.webRequest.onBeforeRequest.addListener((details) => {
        const { tabId, requestId, url, timeStamp } = details;
        if (!tabStorage.hasOwnProperty(tabId)) {
            return;
        }

        tabStorage[tabId].requests[requestId] = {
            requestId: requestId,
            url: url,
            startTime: timeStamp,
            status: 'pending'
        };
        console.log(tabStorage[tabId].requests[requestId]);
    }, networkFilters);

    chrome.webRequest.onCompleted.addListener((details) => {
        const { tabId, requestId, timeStamp } = details;
        if (!tabStorage.hasOwnProperty(tabId) || !tabStorage[tabId].requests.hasOwnProperty(requestId)) {
            return;
        }

        const request = tabStorage[tabId].requests[requestId];

        Object.assign(request, {
            endTime: timeStamp,
            requestDuration: timeStamp - request.startTime,
            status: 'complete'
        });
        console.log(tabStorage[tabId].requests[details.requestId]);
    }, networkFilters);

    chrome.webRequest.onErrorOccurred.addListener((details)=> {
        const { tabId, requestId, timeStamp } = details;
        if (!tabStorage.hasOwnProperty(tabId) || !tabStorage[tabId].requests.hasOwnProperty(requestId)) {
            return;
        }

        const request = tabStorage[tabId].requests[requestId];
        Object.assign(request, {
            endTime: timeStamp,
            status: 'error',
        });
        console.log(tabStorage[tabId].requests[requestId]);
    }, networkFilters);

    chrome.tabs.onActivated.addListener((tab) => {
        const tabId = tab ? tab.tabId : chrome.tabs.TAB_ID_NONE;
        if (!tabStorage.hasOwnProperty(tabId)) {
            tabStorage[tabId] = {
                id: tabId,
                requests: {},
                registerTime: new Date().getTime()
            };
        }
    });

    chrome.tabs.onRemoved.addListener((tab) => {
        const tabId = tab.tabId;
        if (!tabStorage.hasOwnProperty(tabId)) {
            return;
        }
        tabStorage[tabId] = null;
    });

    chrome.runtime.onMessage.addListener((msg, sender, response) => {
        switch (msg.type) {
            case 'popupInit':
                response(tabStorage[msg.tabId]);
                break;
            default:
                response('unknown request');
                break;
        }
    });
}());