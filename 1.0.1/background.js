chrome.commands.onCommand.addListener((command) => {
    if (command === "open_kwik") {
        chrome.action.openPopup();
        chrome.tabs.create({ url: "popup.html" });
    }
});
