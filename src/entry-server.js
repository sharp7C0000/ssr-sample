import { createApp } from './app'

export default context => {
  
  return new Promise((resolve, reject) => {
    const { app, router, store } = createApp()

    // set initial session
    store.commit("setSession", context.session);

    //console.log('str', store.state);

    router.push(context.url);

    router.onReady(() => {
      const matchedComponents = router.getMatchedComponents()
      // no matched routes, reject with 404
      if (!matchedComponents.length) {
        return reject({ code: 404 })
      }
      
      // call `asyncData()` on all matched route components
      Promise.all(matchedComponents.map(Component => {
        if (Component.asyncData) {
          return Component.asyncData({
            store,
            route: router.currentRoute
          })
        }
      })).then(() => {
        // After all preFetch hooks are resolved, our store is now
        // filled with the state needed to render the app.
        // When we attach the state to the context, and the `template` option
        // is used for the renderer, the state will automatically be
        // serialized and injected into the HTML as `window.__INITIAL_STATE__`.
        context.state = store.state

        //console.log('str2', store.state);

        resolve(app)
      }).catch(reject)

      //resolve(app)
    }, reject)
  })
}