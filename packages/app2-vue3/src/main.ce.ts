import { defineCustomElement } from 'vue'
import WeatherConsumerCe from './components/WeatherConsumer.ce.vue'

const WeatherConsumer = defineCustomElement(WeatherConsumerCe)

customElements.define('vue3-weather-consumer', WeatherConsumer)
