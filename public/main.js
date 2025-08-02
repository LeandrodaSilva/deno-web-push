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


document.addEventListener('DOMContentLoaded', () => {
    const notifyButton = document.getElementById('notify-button');
    const notifyButtonSend = document.getElementById('notify-button-send');
    if (notifyButtonSend) {
        notifyButtonSend.addEventListener('click', () => {
            fetch('https://leandrodasi-deno-web-pu-32.deno.dev/notification/push/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "title": "Test Notification",
                    "body": "This is a test notification",
                }),
            });
        });
    }
    if (notifyButton) {
        notifyButton.addEventListener('click', notifyMe);
    } else {
        console.error('Notify button not found');
    }
})