self.addEventListener('push', (event) => {
    const notificationPayload = event.data?.json();

    event.waitUntil(
        self.registration.showNotification(notificationPayload.title, {
            icon: notificationPayload.icon,
            body: notificationPayload.body,
            image: notificationPayload.imageUrl
        }),
    );
});

