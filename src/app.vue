<style lang="scss">

  @import "styles/app.scss";

  body {
    background-color: #EAEAEA;
  }

  .body-wrapper {
    background-color: #fff;
    max-width: 1024px;
    margin   : auto;
    padding: 20px;

    nav {
      text-align: center;
    }
  }

</style>

<template>

  <div id="app" class="body-wrapper">
  
    <nav>
      <h1>SSR Sample App1</h1>

      <section>
        <router-link class="button" :to="{name:'p1'}">Link1</router-link>
        <router-link class="button" :to="{name:'p2'}">Link2</router-link>
        <router-link class="button" :to="{name:'p3'}">Link3</router-link>
      </section>
    </nav>

    {{sessionInfo}}

    <router-view v-if="sessionInfo"></router-view>

    <div v-else>
      <a class="button" href="/auth/twitter" type="button">Twitter Login</a>
    </div>


  </div>

</template>

<script>

  import axios from "axios";

  import { mapState } from 'vuex';

  export default {


    computed: {
      ...mapState({
        sessionInfo: (state) => state.session
      })
    },

    asyncData ({ store, route }) {
     // console.log("!!!!", store, route);
      // return the Promise from the action
      //return store.dispatch('fetchItem', route.params.id)
    },

  }

</script>