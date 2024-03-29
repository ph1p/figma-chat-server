# moved to the monorepo https://github.com/ph1p/figma-chat



## figma-chat-server

The websocket server for [https://github.com/ph1p/figma-chat](https://github.com/ph1p/figma-chat)

## How to start your own server?

Clone the repository:

```bash
git clone https://github.com/ph1p/figma-chat-server.git
```

and nstall all the dependencies.

```bash
npm install
```

run the server:

```bash
npm start
```

If you want to set another port, you can set the `PORT` environment variable.

### Traefik

The simplest way to start your server, is to run it with [traefik](https://traefik.io/).
You can find a `docker-compose.yml` inside this repository.
The only thing you have to change is the URL and run:

```bash
docker-compose up -d
```

or if you want to rebuild it:

```bash
docker-compose build
```

## Development

```bash
npm run dev # starts a server on port 3000
```

Set the server URL to `http://127.0.0.1:3000/` inside your plugin.
