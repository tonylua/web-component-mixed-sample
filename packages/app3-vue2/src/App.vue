<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png" />
    <weather-consumer city="北京" :temperature="29" />
    <HelloWorld msg="Welcome to Your Vue.js App" />
  </div>
</template>

<script>
import HelloWorld from "./components/HelloWorld.vue";
import WeatherConsumer from "./components/WeatherConsumer.vue";

export default {
  name: "App",
  components: {
    HelloWorld,
    WeatherConsumer,
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
