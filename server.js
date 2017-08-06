const fs    = require('fs');
const path  = require('path');
const Hapi  = require('hapi');
const Vue   = require('vue');
const Wreck = require('wreck');

const Cryptiles      = require("cryptiles");
const oauthSignature = require("oauth-signature");
const queryString    = require("query-string");

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

  const context = { url: request.params.param };

  renderer.renderToString(context, (err, html) => {
    console.log(err);
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
  path  : "/api/login",
  handler: function (request, reply) {
    
    const url          = "https://api.twitter.com/oauth/request_token";
    const oauthOptions = {
      oauth_callback        : "http://localhost/",
      oauth_consumer_key    : "bGKjn0l5Zu92zTBRruN1U8YCo",
      oauth_nonce           : Cryptiles.randomString(9),
      oauth_timestamp       : Math.floor(Date.now() / 1000).toString(),
      oauth_signature_method: "HMAC-SHA1",
      oauth_version         : "1.0",
    };

    const encodedSignature = oauthSignature.generate("POST", url, oauthOptions, "GcdeXsQccarT66eMgVzG9pG8WUPu0XWvHLKw3icyFcd9vpL57G", null, {
      encodeSignature: false
    });
    
    let finalParam = Object.assign({}, oauthOptions, {
      oauth_signature: encodedSignature
    });

    const paramString = Object.keys(finalParam).map((m) => {
      return `${m}="${encodeURIComponent(finalParam[m])}"`;
    }).join(",");

    Wreck.post(url, {
      headers: {
        "Content-Type" : "application/x-www-form-urlencoded",
        "Authorization": `OAuth ${paramString}`,
      }
    }, (err, res, payload) => {
      if(!err) {
        const oauthResult = queryString.parse(payload.toString());
        // redirect
        const params = {
          oauth_token: oauthResult.oauth_token
        };
        reply.redirect(`https://api.twitter.com/oauth/authenticate?${queryString.stringify(params)}`);
      } else {
        return reply('Internal Server Error').code(500);
      }
    });
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