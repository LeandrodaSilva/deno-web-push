import express, { Request, Response } from "npm:express"
import cors from 'npm:cors';
import WebPush from 'npm:web-push';

const kv = await Deno.openKv();

const app = express();

app.use(express.json());
app.use(cors());
// static files
app.use(express.static('public'));

const keys = await kv.get<{ publicKey: string; privateKey: string }>(['vapidKeys']);

let publicKey = '';

if (keys?.value === undefined) {
  console.log('Generating new VAPID keys...');
  const vapidKeys = WebPush.generateVAPIDKeys();
  await kv.set(['vapidKeys'], {
    publicKey: vapidKeys.publicKey,
    privateKey: vapidKeys.privateKey,
  });
  publicKey = vapidKeys.publicKey;
  WebPush.setVapidDetails('mailto:me@leandrodasilva.dev', vapidKeys.publicKey, vapidKeys.privateKey);
} else {
  publicKey = keys?.value?.publicKey || '';
  WebPush.setVapidDetails('mailto:me@leandrodasilva.dev', keys?.value?.publicKey, keys?.value?.privateKey);
}

interface ISubscription {
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
}

app.get('/notification/push/public_key', (request: Request, response: Response) => {
  return response.json({ publicKey });
});

app.post('/notification/push/register', async (request: Request, response: Response) => {
  console.log(request.body);

  const { subscription } = request.body as ISubscription;

  if (!subscription || !subscription.endpoint) {
    return response.status(400).json({ error: 'Invalid subscription data' });
  }

  await kv.set(['subscriptions', subscription.endpoint], subscription);

  return response.sendStatus(201);
});

interface IDataSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

app.post('/notification/push/send', async (request: Request, response: Response) => {
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
      await kv.delete(sub.key);
    }
  }
  return response.sendStatus(201);
});

app.listen();