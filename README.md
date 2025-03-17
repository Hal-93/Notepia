# Welcome to Remix!

- 📖 [Remix docs](https://remix.run/docs)

## 開発サーバーの起動

Run the dev server:

```shellscript
npm run dev
```

## Prisma
マイグレーションの実行

```shellscript
npx prisma migrate dev --name init
```

Prisma Clientの生成

```shellscript
npx prisma generate
```


## Deployment

First, build your app for production:

```sh
npm run build
```

Then run the app in production mode:

```sh
npm start
```

Now you'll need to pick a host to deploy it to.

### DIY

If you're familiar with deploying Node applications, the built-in Remix app server is production-ready.

Make sure to deploy the output of `npm run build`

- `build/server`
- `build/client`

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever css framework you prefer. See the [Vite docs on css](https://vitejs.dev/guide/features.html#css) for more information.
