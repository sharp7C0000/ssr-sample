const fs         = require('fs');
const path       = require('path');
const Hapi       = require('hapi');
const Vue        = require('vue');
const Wreck      = require('wreck');
const Bell       = require('bell');
const AuthCookie = require('hapi-auth-cookie');
const Inert      = require('inert');

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

  const context = { url: request.params.param, session: request.auth.credentials };

  renderer.renderToString(context, (err, html) => {
    if (err) {
      if (err.code === 404) {
        return reply('Page not found').code(404);
      } else {
        return reply('Internal Server Error').code(500);
      }
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
server.register([AuthCookie, Bell, Inert], (err) => {

  // auth information setting
  server.auth.strategy("session", "cookie", {
    password  : 'a7d5c3c8-7fba-11e7-bb31-be2e44b06b34',
    isSameSite: "Lax",
    isSecure  : false
  });

  server.auth.strategy('twitter', 'bell', {
    provider    : 'twitter',
    password    : 'a7d5c3c8-7fba-11e7-bb31-be2e44b06b34',
    clientId    : 'bGKjn0l5Zu92zTBRruN1U8YCo',
    clientSecret: 'GcdeXsQccarT66eMgVzG9pG8WUPu0XWvHLKw3icyFcd9vpL57G',
    isSecure    : false
  });

  ///////////////// routers /////////////////////////////////
  
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
    config: {
      
      auth: {
        strategy: 'session',
        mode    : 'optional'
      },

      handler: function (request, reply) {
        if(isProd) {
          render(request, reply);
        } else {
          readyPromise.then(() => {
            render(request, reply);
          })
        }
      }
    },
  });

  // twitter auth
  server.route({
    method: 'GET',
    path  : '/auth/twitter',
    config: {
      auth   : 'twitter',
      handler: function(request, reply) {

        if (!request.auth.isAuthenticated) {
          return reply(Boom.unauthorized('Authentication failed: ' + request.auth.error.message));
        }

        const profile = request.auth.credentials.profile;

        request.cookieAuth.set({
          twitterId  : profile.id,
          username   : profile.username,
          displayName: profile.displayName
        });

        return reply.redirect('/');
      }
    }
  });

  // logout
  server.route({
    method : "GET",
    path   : "/logout",
    config: {
      handler: function (request, reply) {
        request.cookieAuth.clear();
        reply.redirect('/');
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

});
