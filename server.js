const fs            = require('fs');
const path          = require('path');
const Hapi          = require('hapi');
const Vue           = require('vue');

const resolve  = file => path.resolve(__dirname, file);

const isProd = process.env.NODE_ENV === 'production';

const { createBundleRenderer } = require('vue-server-renderer');

const template = fs.readFileSync(resolve('./src/index.template.html'), 'utf-8');

const server = new Hapi.Server();
server.connection({ 
  host: '0.0.0.0', 
  port: 8080 
});

server.register(require('inert'));

const app = new Vue({
  data: {
    url: "some url"
  },
  template: `<div>The visited URL is: {{ url }}</div>`
});

function createRenderer (bundle, options) {
  return createBundleRenderer(bundle, Object.assign(options, {
   template,
    // this is only needed when vue-server-renderer is npm-linked
    basedir: resolve('./dist'),
    // recommended for performance
    runInNewContext: false
  }))
}

let renderer;
let readyPromise;

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

    // const renderResult = renderer.renderToString(app, (err, html) => {
    //   if (err) {
    //     return reply('Internal Server Error').code(201);
    //   }

    //   reply(`
    //     <!DOCTYPE html>
    //     <html lang="en">
    //       <head><title>Hello</title></head>
    //       <body>${html}</body>
    //     </html>
    //   `);
    // });
  }
});

server.route({
  method: 'GET',
  path:'/hello', 
  handler: function (request, reply) {
    return reply('hello world');
  }
});

if (isProd) {
  const bundle         = require('./dist/vue-ssr-server-bundle.json')
  const clientManifest = require('./dist/vue-ssr-client-manifest.json')
  renderer = createRenderer(bundle, {
    clientManifest
  });

  // Start the server
  server.start((err) => {
    console.log('start');
    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
  });

} else {
  readyPromise = require('./build/setup-dev-server')(server, (bundle, options) => {
    
    renderer = createRenderer(bundle, options);
    
    // Start the server
    server.start((err) => {
      console.log('start');
      if (err) {
          throw err;
      }
      console.log('Server running at:', server.info.uri);
    });

  })
}