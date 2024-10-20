console.log('background script loaded');

export let chromeStorageKeys;

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    switch (request.action) {
      case "signInWithGoogle": {
  
              // remove any old listener if exists
        chrome.tabs.onUpdated.removeListener(setTokens)
        const url = request.payload.url;
  
        // create new tab with that url
        chrome.tabs.create({ url: url, active: true }, (tab) => {
            // add listener to that url and watch for access_token and refresh_token query string params
            chrome.tabs.onUpdated.addListener(setTokens)

            sendResponse(request.action + " executed")
        })
       
        break
      }
  
      default:
        break
    }
  
    return true
  })
  
  
  chromeStorageKeys = {
    gauthAccessToken: "gauthAccessToken",
    gauthRefreshToken: "gauthRefreshToken"
  }
  
  
  const setTokens = async (
    tabId: number,
    changeInfo: chrome.tabs.TabChangeInfo,
    tab: chrome.tabs.Tab
  ) => {
  
    // once the tab is loaded
    if (tab.status === "complete") {
      if (!tab.url) return
      const url = new URL(tab.url)
  
      // at this point user is logged-in to the web app
      // url should look like this: https://my.webapp.com/#access_token=zI1NiIsInR5c&expires_in=3600&provider_token=ya29.a0AVelGEwL6L&refresh_token=GEBzW2vz0q0s2pww&token_type=bearer
      // parse access_token and refresh_token from query string params
    //   if (url.origin === "https://my.webapp.com") {
        const params = new URL(url.href).searchParams;
        const accessToken = params.get("accessToken");
              const refreshToken = params.get("refreshToken");
  
        if (accessToken && refreshToken) {
          if (!tab.id) {
            return
          }
  
          // we can close that tab now
          await chrome.tabs.remove(tab.id)
  
  
          // store access_token and refresh_token in storage as these will be used to authenticate user in chrome extension
          await chrome.storage.sync.set({
            [chromeStorageKeys.gauthAccessToken]: accessToken
          })
          await chrome.storage.sync.set({
            [chromeStorageKeys.gauthRefreshToken]: refreshToken
          })
  
          // remove tab listener as tokens are set
          chrome.tabs.onUpdated.removeListener(setTokens)
        }
    //   }
    }
  }