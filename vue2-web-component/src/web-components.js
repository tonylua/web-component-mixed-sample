import Vue from "vue";
import vueCustomElement from "vue-custom-element";
import WeatherConsumer from "./components/WeatherConsumer.vue";

Vue.use(vueCustomElement);

Vue.customElement("vue2-weather-consumer", WeatherConsumer, {
  shadow: true,
  beforeCreateVueInstance(root) {
    const rootNode = root.el.getRootNode();

    if (rootNode instanceof ShadowRoot) {
      root.shadowRoot = rootNode;
    } else {
      root.shadowRoot = document.head;
    }
    return root;
  },
});
