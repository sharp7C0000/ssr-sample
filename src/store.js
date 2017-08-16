import Vue from 'vue';
import Vuex from 'vuex';

import axios from "axios";

Vue.use(Vuex);

export function createStore () {
  return new Vuex.Store({
    
    state: {
      session: null
    },

    actions: {
      sessionInfo ({ commit }, id) {
        
        axios.get('/api/current')
        .then(function (response) {
          commit("setSession", response);
        })
        .catch(function (error) {
          console.log(error);
        });

        // return the Promise via `store.dispatch()` so that we know
        // when the data has been fetched
        // return fetchItem(id).then(item => {
        //   commit('setItem', { id, item })
        // })
      }
    },

    mutations: {
      setSession (state, sessionData) {
        //console.log("sdt", sessionData);
        state.session = sessionData;
       // console.log("!!!!", state);
        Vue.set(state, "session", sessionData);
      }
    }

  })
}