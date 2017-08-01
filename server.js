const fs   = require('fs');
const path = require('path');
const Hapi = require('hapi');
const Vue  = require('vue');

const isProd = process.env.NODE_ENV === 'production';

const resolve  = file => path.resolve(__dirname, file);
const template = fs.readFileSync(resolve('./src/index.template.html'), 'utf-8');

const { createBundleRenderer } = require('vue-server-renderer');

const server = new Hapi.Server();

let isServerStarted = false;
let renderer        = null;
let readyPromise    = null;

server.connection({ 
  host: '0.0.0.0', 
  port: 8080 
});

function createRenderer (bundle, options) {
  return createBundleRenderer(bundle, Object.assign(options, {
   template,
    basedir: resolve('./dist'),
    runInNewContext: false
  }))
}

function render (request, reply) {
  renderer.renderToString((err, html) => {
    if (err) {
      return reply('Internal Server Error').code(500);
    }
    reply(html);
    if (!isProd) {
      console.log(`whole request: ${Date.now()}ms`)
    }
  })
}

function startServer () {
  // Start the server
  if(!isServerStarted) {
    server.start((err) => {
      if (err) {
        throw err;
      }
      console.log('Server running at:', server.info.uri);
    });

    isServerStarted = true;
  }
}

// register plugin
server.register(require('inert'));

// Add the route

server.route({
  method: 'GET',
  path: '/dist/{param*}',
  handler: {
    directory: {
      path: './dist'
    }
  }
});

server.route({
  method : 'GET',
  path   : '/manifest.json',
  handler: {
    file: function (request) {
      return "./manifest.json";
    }
  }
});

server.route({
  method: "GET",
  path  : "/{param*}",
  handler: function (request, reply) {
    if(isProd) {
      render(request, reply);
    } else {
      readyPromise.then(() => {
        render(request, reply);
      })
    }
  }
});

// start server

if (isProd) {

  const bundle         = require('./dist/vue-ssr-server-bundle.json');
  const clientManifest = require('./dist/vue-ssr-client-manifest.json');

  renderer = createRenderer(bundle, { clientManifest });
  startServer();
 
} else {
  readyPromise = require('./build/setup-dev-server')(server, (bundle, options) => {
    renderer = createRenderer(bundle, options);
    startServer();
  })
}