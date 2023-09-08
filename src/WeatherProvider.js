class WeatherProvider extends HTMLElement {
  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ mode: "open" });
    this._myTitle = null;
    this._myData = [];
  }
  static get observedAttributes() {
    return ["my-title"];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "my-title") {
      this._myTitle = newValue;
      this._update();
    }
  }
  async connectedCallback() {
    const json = await fetch("./weather-data.json").then((res) => res.json());

    this._shadowRoot.dispatchEvent(
      new CustomEvent("weather-fetched", {
        bubbles: true,
        composed: true,
        detail: json,
      })
    );

    this._myData = json;
    this._update(json.length);
  }
  _update(content = "") {
    const template = document.getElementById("provider-template");
    const templateContent = template.content;

    const clone = templateContent.cloneNode(true);
    const pEle = clone.querySelector("p");
    pEle.textContent = content ? `${this._myTitle}: ${content}` : "loading...";

    this._shadowRoot.innerHTML = "";
    this._shadowRoot.appendChild(clone);
  }
}

window.customElements.define("weather-provider", WeatherProvider);
