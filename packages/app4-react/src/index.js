import r2wc from "@r2wc/react-to-web-component";
import WC from "./components/WeatherConsumer";

const ReactWeatherConsumer = r2wc(WC, {
  props: { city: "string", temperature: "number" },
  shadow: "open",
});

customElements.define("react-weather-consumer", ReactWeatherConsumer);
