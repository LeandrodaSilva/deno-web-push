import express from "npm:express"
import cors from 'npm:cors';
import WebPush from 'npm:web-push';

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

app.post('/notification/push/register', (request, response) => {
  console.log(request.body);

  return response.sendStatus(201);
});

app.post('/notification/push/send', async (request, response) => {
  const { subscription } = request.body as ISubscription;

  WebPush.sendNotification(
    subscription,
    JSON.stringify({
      icon: 'your-icon-link.png',
      title: 'Your title',
      body: 'Content of your message',
      imageUrl: 'your-image-link.png'
    }),
  );

  return response.sendStatus(201);
});


app.listen(3000);