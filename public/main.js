function notifyMe() {
    if (!('Notification' in window)) {
        alert('This browser does not support desktop notification');
    } else if (Notification.permission === 'granted') {
        handleServiceWorker();
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
                handleServiceWorker();
            }
        });
    }
}

async function handleServiceWorker() {
    navigator.serviceWorker
        .register('service-worker.js')
        .then(async (serviceWorker) => {
            serviceWorker.update();

            let subscription = await serviceWorker.pushManager.getSubscription();

            if (!subscription) {
                const publicKeyResponse = await fetch(
                    '/notification/push/public_key',
                );
                if (!publicKeyResponse.ok) {
                    throw new Error('Failed to fetch public key');
                }
                const publicKeyData = await publicKeyResponse.json();

                await serviceWorker.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: publicKeyData.publicKey,
                });

                subscription = await serviceWorker.pushManager.getSubscription();
            }

            await fetch('https://leandrodasi-deno-web-pu-32.deno.dev/notification/push/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscription,
                }),
            });
        });
}

function handleProtocolParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const protocol = urlParams.get('protocol');
    
    if (!protocol) return;
    
    switch (protocol) {
        case 'webpush':
            const action = urlParams.get('action');
            if (action) {
                handleWebPushAction(decodeURIComponent(action));
            }
            break;
            
        case 'notify':
            const message = urlParams.get('message');
            if (message) {
                handleNotifyAction(decodeURIComponent(message));
            }
            break;
            
        case 'pushnotification':
            const data = urlParams.get('data');
            if (data) {
                handlePushNotificationAction(decodeURIComponent(data));
            }
            break;
    }
}

function handleWebPushAction(action) {
    console.log('Handling web push action:', action);
    
    // Show notification about the protocol action
    Swal.fire({
        title: 'Web Push Protocol',
        text: `Action received: ${action}`,
        icon: 'info',
        confirmButtonText: 'OK'
    });
    
    // Automatically trigger notification setup if not already done
    if (Notification.permission !== 'granted') {
        notifyMe();
    }
}

function handleNotifyAction(message) {
    console.log('Handling notify action:', message);
    
    // Fill the notification text field if it exists
    const notifyText = document.getElementById('notify-text');
    if (notifyText) {
        notifyText.value = message;
    }
    
    // Show notification about the protocol action
    Swal.fire({
        title: 'Notify Protocol',
        text: `Message received: ${message}`,
        icon: 'info',
        confirmButtonText: 'Send Notification',
        showCancelButton: true,
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            // Trigger notification sending
            const notifyButtonSend = document.getElementById('notify-button-send');
            if (notifyButtonSend) {
                notifyButtonSend.click();
            }
        }
    });
}

function handlePushNotificationAction(data) {
    console.log('Handling push notification action:', data);
    
    try {
        const notificationData = JSON.parse(data);
        
        // Show notification about the protocol action
        Swal.fire({
            title: 'Push Notification Protocol',
            html: `
                <div style="text-align: left;">
                    <p><strong>Title:</strong> ${notificationData.title || 'N/A'}</p>
                    <p><strong>Body:</strong> ${notificationData.body || 'N/A'}</p>
                </div>
            `,
            icon: 'info',
            confirmButtonText: 'Send Notification',
            showCancelButton: true,
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                // Send the notification with the provided data
                fetch('https://leandrodasi-deno-web-pu-32.deno.dev/notification/push/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: notificationData.title || 'Protocol Notification',
                        body: notificationData.body || 'Notification triggered via protocol'
                    }),
                });
            }
        });
    } catch (error) {
        console.error('Error parsing notification data:', error);
        Swal.fire({
            title: 'Error',
            text: 'Invalid notification data received',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // Handle protocol handlers
    handleProtocolParameters();
    
    const notifyButton = document.getElementById('notify-button');
    const notifyButtonSend = document.getElementById('notify-button-send');
    const notifyText = document.getElementById('notify-text');
    if (notifyButtonSend) {
        notifyButtonSend.addEventListener('click', () => {
            fetch('https://leandrodasi-deno-web-pu-32.deno.dev/notification/push/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "title": "Notificação",
                    "body": notifyText.value || "This is a test notification",
                }),
            });
        });
    }
    if (notifyButton) {
        notifyButton.addEventListener('click', notifyMe);
    } else {
        console.error('Notify button not found');
    }

    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SHOW_SWEET_ALERT') {
            const { payload } = event.data;

            Swal.fire({
                title: payload.title,
                position: "top-end",
                text: payload.body,
                icon: 'info',
                showConfirmButton: false,
                timer: 2000
            });
        }
    });

    // Window Controls Overlay functionality
    initializeWindowControlsOverlay();
})

function initializeWindowControlsOverlay() {
    // Handle title bar buttons
    const refreshButton = document.getElementById('refresh-button');
    const settingsButton = document.getElementById('settings-button');

    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            window.location.reload();
        });
    }

    if (settingsButton) {
        settingsButton.addEventListener('click', () => {
            Swal.fire({
                title: 'Settings',
                html: `
                    <div style="text-align: left;">
                        <p><strong>App:</strong> Web Push Demo</p>
                        <p><strong>Version:</strong> 1.0.0</p>
                        <p><strong>Mode:</strong> ${getDisplayMode()}</p>
                        <p><strong>Notifications:</strong> ${Notification.permission}</p>
                    </div>
                `,
                icon: 'info',
                confirmButtonText: 'Close'
            });
        });
    }

    // Handle Window Controls Overlay geometry changes
    if ('windowControlsOverlay' in navigator) {
        navigator.windowControlsOverlay.addEventListener('geometrychange', (event) => {
            updateTitleBarGeometry(event.titlebarAreaRect);
        });

        // Initial geometry setup
        if (navigator.windowControlsOverlay.visible) {
            updateTitleBarGeometry(navigator.windowControlsOverlay.getTitlebarAreaRect());
        }
    }

    // Handle display mode changes
    window.addEventListener('resize', () => {
        updateTitleBarVisibility();
    });

    // Initial setup
    updateTitleBarVisibility();
}

function getDisplayMode() {
    if ('windowControlsOverlay' in navigator && navigator.windowControlsOverlay.visible) {
        return 'Window Controls Overlay';
    }
    if (window.matchMedia('(display-mode: standalone)').matches) {
        return 'Standalone';
    }
    if (window.matchMedia('(display-mode: minimal-ui)').matches) {
        return 'Minimal UI';
    }
    if (window.matchMedia('(display-mode: fullscreen)').matches) {
        return 'Fullscreen';
    }
    return 'Browser';
}

function updateTitleBarGeometry(titlebarAreaRect) {
    const titleBar = document.querySelector('.title-bar');
    if (titleBar && titlebarAreaRect) {
        titleBar.style.left = `${titlebarAreaRect.x}px`;
        titleBar.style.top = `${titlebarAreaRect.y}px`;
        titleBar.style.width = `${titlebarAreaRect.width}px`;
        titleBar.style.height = `${titlebarAreaRect.height}px`;
    }
}

function updateTitleBarVisibility() {
    const titleBar = document.querySelector('.title-bar');
    const body = document.body;
    
    if ('windowControlsOverlay' in navigator && navigator.windowControlsOverlay.visible) {
        titleBar.style.display = 'flex';
        body.style.paddingTop = `${navigator.windowControlsOverlay.getTitlebarAreaRect().height}px`;
    } else if (window.matchMedia('(display-mode: standalone)').matches) {
        titleBar.style.display = 'none';
        body.style.paddingTop = '0';
    } else {
        titleBar.style.display = 'none';
        body.style.paddingTop = '0';
    }
}