chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "open_overlay") {
        createOverlay();
    }
});

function createOverlay() {
    if (document.getElementById('my-extension-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'my-extension-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';

    fetch(chrome.runtime.getURL('popup.html'))
        .then(response => response.text())
        .then(html => {
            const content = document.createElement('div');
            content.style.background = 'white';
            content.style.padding = '20px';
            content.style.borderRadius = '5px';
            content.innerHTML = html;

            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) {
                    document.body.removeChild(overlay);
                }
            });

            overlay.appendChild(content);

            document.body.appendChild(overlay);
        })
        .catch(error => {
            console.error('Error loading popup HTML:', error);
        });
}
