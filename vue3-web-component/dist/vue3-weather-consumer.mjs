import { defineComponent as c, openBlock as a, createElementBlock as d, createTextVNode as p, toDisplayString as n, pushScopeId as m, popScopeId as u, createElementVNode as i, defineCustomElement as l } from "vue";
const _ = (e) => (m("data-v-e0606af3"), e = e(), u(), e), h = /* @__PURE__ */ _(() => /* @__PURE__ */ i("h1", { style: { color: "#ddd" } }, "<vue3-weather-consumer/>", -1)), f = /* @__PURE__ */ c({
  __name: "WeatherConsumer.ce",
  props: {
    city: { default: "unknown" },
    temperature: {}
  },
  emits: ["msg"],
  setup(e, { emit: r }) {
    const t = e, s = () => r("msg", t.city);
    return (o, g) => (a(), d("div", {
      class: "consumer",
      onClick: s
    }, [
      h,
      p(" " + n(o.city) + ": " + n(o.temperature) + "℃ ", 1)
    ]));
  }
}), v = `:host .consumer[data-v-e0606af3]{border:1px solid var(--vue3-color, #336699);border-radius:10px;width:300px;box-sizing:border-box;padding:20px}
`, y = (e, r) => {
  const t = e.__vccOpts || e;
  for (const [s, o] of r)
    t[s] = o;
  return t;
}, x = /* @__PURE__ */ y(f, [["styles", [v]], ["__scopeId", "data-v-e0606af3"]]), C = l(x);
customElements.define("vue3-weather-consumer", C);
