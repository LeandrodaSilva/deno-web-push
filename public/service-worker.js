self.addEventListener('push', (event) => {
    const notificationPayload = event.data?.json();

    event.waitUntil(
        self.registration.showNotification(notificationPayload.title, {
            icon: notificationPayload.icon,
            body: notificationPayload.body,
            image: notificationPayload.imageUrl
        }),
    );

    // Enviar mensagem para todas as abas abertas
    event.waitUntil(
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'SHOW_SWEET_ALERT',
                    payload: notificationPayload
                });
            });
        })
    );
});

