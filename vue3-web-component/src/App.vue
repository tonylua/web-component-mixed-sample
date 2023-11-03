<script setup lang="ts">
import * as Vue from "vue";
import { defineCustomElement, onMounted } from "vue";
import WeatherConsumer from "./components/WeatherConsumer.ce.vue";
import HelloWorld from "./components/HelloWorld.vue";
import TheWelcome from "./components/TheWelcome.vue";

window.Vue3 = Vue;
onMounted(() => {
  const s = document.createElement("script");
  // cp /dist file to /public
  s.src = "/comp.umd.js";
  document.body.appendChild(s);
});
// console.log(WeatherConsumer.styles);

const ExampleElement = defineCustomElement(WeatherConsumer);
customElements.define("my-example", ExampleElement);

const onMsg = (e: CustomEvent) => alert(e.detail);
</script>

<template>
  <header>
    <my-example id="my-example" city="海参崴" :temperature="10" @msg="onMsg" />
    <vue3-weather-consumer
      id="my-example"
      city="庙街"
      :temperature="1024"
      @msg="onMsg"
    />
  </header>

  <main>
    <HelloWorld msg="You did it!" />
    <TheWelcome />
  </main>
</template>

<style scoped>
#my-example {
  --vue3-color: red;
}

header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
