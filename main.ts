import express from "npm:express"
import cors from 'npm:cors';
import WebPush from 'npm:web-push';

const kv = await Deno.openKv();

const app = express();

app.use(express.json());
app.use(cors());
// static files
app.use(express.static('public'));

const publicKey = 'BMODaWYT3dMP3lgZrMPqICBBxS-iEOUUFnmOmwk9x8au2FAmVP5yPRTgFTW0pfgDQ25IKl5BSrJHO5l7cT59UO0';
const privateKey = 'R1O8Et-7g2DgJBFSfCFNeXjig2_Or5mmRZVwUXl3j2w';

WebPush.setVapidDetails('https://tidy-cobra-84.deno.dev', publicKey, privateKey);

interface ISubscription {
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
}

app.get('/notification/push/public_key', (request, response) => {
  return response.json({ publicKey });
});

app.post('/notification/push/register', async (request, response) => {
  console.log(request.body);

  const { subscription } = request.body as ISubscription;

  if (!subscription || !subscription.endpoint) {
    return response.status(400).json({ error: 'Invalid subscription data' });
  }

  const iter = kv.list<IDataSubscription>({ prefix: ["subscriptions"] });

  for await (const res of iter) {
    await kv.delete(res.key);
  }

  await kv.set(['subscriptions', subscription.endpoint], {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth
    }
  });

  return response.sendStatus(201);
});

interface IDataSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

app.post('/notification/push/send', async (request, response) => {
  const { title, body } = request.body as {
    title: string;
    body: string;
  };

  const subscriptions = [];

  const iter = kv.list<IDataSubscription>({ prefix: ["subscriptions"] });

  for await (const res of iter) subscriptions.push(res);

  if (!subscriptions.length) {
    return response.status(404).json({ error: 'No subscriptions found' });
  }

  // Send notification to all subscriptions
  for (const sub of subscriptions) {
    try {
      await WebPush.sendNotification(
        sub.value,
        JSON.stringify({
          icon: 'your-icon-link.png',
          title,
          body,
          imageUrl: 'your-image-link.png'
        }),
      );
    } catch (error) {
      console.error(`Failed to send notification to ${sub.value.endpoint}:`, error);
    }
  }
  return response.sendStatus(201);
});


app.listen(3000);