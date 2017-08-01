import Vue from 'vue'
import App from './app.vue'

import { createRouter } from './router'

export function createApp () {
  
  // create router
  const router = createRouter();

  const app = new Vue({
    router,
    render: h => h(App)
  })
  
  return { app, router }
}