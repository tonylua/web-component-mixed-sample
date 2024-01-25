class WeatherProvider extends HTMLElement {
  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ mode: "open" });
    this._myTitle = null;
    this._clickedCity = null;
    this._myData = [];
  }
  static get observedAttributes() {
    return ["my-title", "clicked-city"];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "my-title") {
      this._myTitle = newValue;
    }
    if (name === "clicked-city") {
      this._clickedCity = newValue;
    }
    this._update();
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
    this._update();
  }
  _update() {
    const template = document.getElementById("provider-template");
    const templateContent = template.content;

    const clone = templateContent.cloneNode(true);
    const pEle = clone.querySelector("p");
    pEle.textContent = this._myData?.length
      ? `${this._myTitle}: ${this._myData.length} ${
          this._clickedCity ? "点击了" + this._clickedCity : ""
        }`
      : "loading...";

    this._shadowRoot.innerHTML = "";
    this._shadowRoot.appendChild(clone);
  }
}

window.customElements.define("weather-provider", WeatherProvider);
