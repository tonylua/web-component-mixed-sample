import { defineComponent as a, openBlock as p, createElementBlock as d, createTextVNode as m, toDisplayString as c, pushScopeId as i, popScopeId as u, createElementVNode as l, defineCustomElement as _ } from "vue";
const h = (e) => (i("data-v-e0606af3"), e = e(), u(), e), f = /* @__PURE__ */ h(() => /* @__PURE__ */ l("h1", { style: { color: "#ddd" } }, "<vue3-weather-consumer/>", -1)), v = /* @__PURE__ */ a({
  __name: "WeatherConsumer.ce",
  props: {
    city: { default: "unknown", type: String },
    temperature: { type: Number }
  },
  emits: ["msg"],
  setup(e, { emit: o }) {
    const t = e, r = o, s = () => r("msg", t.city);
    return (n, b) => (p(), d("div", {
      class: "consumer",
      onClick: s
    }, [
      f,
      m(" " + c(n.city) + ": " + c(n.temperature) + "℃ ", 1)
    ]));
  }
}), y = `:host .consumer[data-v-e0606af3]{border:1px solid var(--vue3-color, #336699);border-radius:10px;width:300px;box-sizing:border-box;padding:20px}
`, g = (e, o) => {
  const t = e.__vccOpts || e;
  for (const [r, s] of o)
    t[r] = s;
  return t;
}, x = /* @__PURE__ */ g(v, [["styles", [y]], ["__scopeId", "data-v-e0606af3"]]), C = _(x);
customElements.define("vue3-weather-consumer", C);
