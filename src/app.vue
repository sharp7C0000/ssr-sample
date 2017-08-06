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
        <a href="/api/login" type="button">Twitter Login</a>
      </section>

      <section>
        <router-link class="button" :to="{name:'p1'}">Link1</router-link>
        <router-link class="button" :to="{name:'p2'}">Link2</router-link>
        <router-link class="button" :to="{name:'p3'}">Link3</router-link>
      </section>
    </nav>
    
    <router-view></router-view>

  </div>

</template>

<script>

  import axios from "axios";

  export default {}

</script>