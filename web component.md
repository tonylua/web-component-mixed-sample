# Web Component -- 一种原生的 UI 组件化标准

<div style="text-align:center;line-height:300px;background:#5caced;color:#fff;font-size:50px;font-weight:600">
	&lt;web-coponent /&gt;
</div>


## Web Component 概述

Web Component 是一种用于构建*可复用用户界面组件*的技术，开发者可以创建自定义的 HTML 标签，并将其封装为包含逻辑和样式的独立组件，从而在任何 Web 应用中重复使用。

每个 Web Component 都具有自己的 DOM 和样式隔离，避免了全局 CSS 和 JavaScript 的冲突问题。它还支持自定义事件和属性，可以与其他组件进行通信和交互。

不同于 Vue/React 等社区或厂商的组件化开发方案，Web Component 被定义在标准的 HTML 和 DOM 标准中。它由一组相关的 Web 平台 API 组成，也可以与现有的前端框架和库配合使用。

Web Component 的兼容性良好，可以在现代浏览器中直接使用，也可以通过 polyfill 兼容到旧版浏览器*（IE11 理论上可以兼容，出于初步调研的考虑，本文不对[兼容性](https://caniuse.com/)作过多探讨）*。

### 同类组件化方案现状

#### 静态编译类

- npm 库
- Git submodule/subtree

#### 动态解析类

Pros|技术|Cons
---:|:---:|:---
可以异构|**Micro Frontend**|需要主应用、对子应用有侵入、样式统一困难
模块级的多项目在运行时共享|**Module Federation**|主要依赖webpack5，既有项目改造成本未知
约定优于配置、模块级动态共享|**Vue `:is` + 动态`import`**|依赖vue技术栈、全局依赖互相干扰

## Web Component 关键特性

### [Custom Elements（自定义元素）](https://html.spec.whatwg.org/multipage/custom-elements.html#custom-elements)

是 Web 标准中的一项功能，它允许开发者自定义新的 HTML 元素，开发者可以使用 JavaScript 和 DOM API，使新元素具有自定义的行为和功能


> ##### 4.13.1.1 Creating an autonomous custom element[](#custom-elements-autonomous-example)
> 
> _This section is non-normative._
> 
> For the purposes of illustrating how to create an [autonomous custom element](#autonomous-custom-element), let's define a custom element that encapsulates rendering a small icon for a country flag. Our goal is to be able to use it like so:
> 
> ```
> <flag-icon country="nl"></flag-icon>
> ```
> 
> To do this, we first declare a class for the custom element, extending `HTMLElement`:
> 
> ```
> class FlagIcon extends HTMLElement {
>   constructor() {
>     super();
>     this._countryCode = null;
>   }
> 
>   static observedAttributes = ["country"];
> 
>   attributeChangedCallback(name, oldValue, newValue) {
>     // name will always be "country" due to observedAttributes
>     this._countryCode = newValue;
>     this._updateRendering();
>   }
>   connectedCallback() {
>     this._updateRendering();
>   }
> 
>   get country() {
>     return this._countryCode;
>   }
>   set country(v) {
>     this.setAttribute("country", v);
>   }
> 
>   _updateRendering() {
>     ...
>   }
> }
> ```
> 
> We then need to use this class to define the element:
> 
> ```
> customElements.define("flag-icon", FlagIcon);
> ```

- 继承自基类 HTMLElement
- 自定义的元素名称需符合 DOMString 标准，简单来说就是必须带短横线
- 其中 observedAttributes 声明的属性才能被 attributeChangedCallback() 监听 
- 完整生命周期方法说明为:

```
class MyCustomElement extends HTMLElement {
  constructor() {
    super();
    // 在构造函数中进行初始化操作
    // 用 this.appendChild(...) 等挂载到dom中
    // 用 addEventListener() 绑定事件到 this.xxx 上
  }
  connectedCallback() {
    // 元素被插入到文档时触发，等价于 vue 的 mounted
  }
  disconnectedCallback() {
    // 元素从文档中移除时触发，等价于 vue 的 beforeDestory / destoyed
  }
  attributeChangedCallback(attributeName, oldValue, newValue) {
    // 元素的属性被添加、移除或更改时触发，等价于 vue 的 beforeUpdate / updated
  }
}
```

除了继承 HTMLElement，也可以继承其既有子类，并在使用是采用原生标签（被继承类） + [is](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/is) 语法，如：

```
// Create a class for the element
class WordCount extends HTMLParagraphElement {
  constructor() {
    // Always call super first in constructor
    super();

    // Constructor contents omitted for brevity
    // …
  }
}

// Define the new element
customElements.define("word-count", WordCount, { extends: "p" });
```

```
<p is="word-count"></p>
```


### [Shadow DOM](https://www.w3.org/TR/shadow-dom/)

DOM 编程模型令人诟病的一个方面就是缺乏**封装**，不同组件之间的逻辑和样式很容易互相污染。

鉴于这个原因，Web components 的一个重要属性就是**封装**——可以将标记结构、样式和行为隐藏起来，并与页面上的其他代码相隔离。其中，Shadow DOM 接口是关键所在，它可以将一个隐藏的、独立的 DOM 附加到一个元素上

Shadow DOM 是 DOM nodes 的附属树。这种 Shadow DOM 子树可以与某宿主元素相关联，但并不作为该元素的普通子节点，而是会形成其自有的作用域；Shadow DOM 中的根及其子节点也不可见。

相比于以前为了实现封装而只能使用 `<iframe>` 实现的情况，Shadow DOM 无疑是一种更优雅的创建隔离 DOM 树的方法。

> _Shadow_ DOM 允许将隐藏的 DOM 树附加到常规的 DOM 树中——它以 shadow root 节点为起始根节点，在这个根节点的下方，可以是任意元素，和普通的 DOM 元素一样。
> 
> ![](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_components/Using_shadow_DOM/shadowdom.svg)
> 
> 这里，有一些 Shadow DOM 特有的术语需要我们了解：
> 
> * Shadow host：一个常规 DOM 节点，Shadow DOM 会被附加到这个节点上。
> * Shadow tree：Shadow DOM 内部的 DOM 树。
> * Shadow boundary：Shadow DOM 结束的地方，也是常规 DOM 开始的地方。
> * Shadow root: Shadow tree 的根节点。
> 
> 你可以使用同样的方式来操作 Shadow DOM，就和操作常规 DOM 一样——例如添加子节点、设置属性，以及为节点添加自己的样式（例如通过 `element.style` 属性），或者为整个 Shadow DOM 添加样式（例如在 [`<style>`](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/style) 元素内添加样式）。不同的是，Shadow DOM 内部的元素始终不会影响到它外部的元素（除了 [`:focus-within`](https://developer.mozilla.org/zh-CN/docs/Web/CSS/:focus-within)），这为封装提供了便利。
> 
> 注意，不管从哪个方面来看，Shadow DOM 都不是一个新事物——在过去的很长一段时间里，浏览器用它来封装一些元素的内部结构。以一个有着默认播放控制按钮的 [`<video>`](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/video) 元素为例。你所能看到的只是一个 `<video>` 标签，实际上，在它的 Shadow DOM 中，包含了一系列的按钮和其他控制器。Shadow DOM 标准允许你为你自己的元素（custom element）维护一组 Shadow DOM。
> 
> ### 基本用法
> 
> 可以使用 [`Element.attachShadow()`](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/attachShadow) 方法来将一个 shadow root 附加到任何一个元素上。它接受一个配置对象作为参数，该对象有一个 `mode` 属性，值可以是 `open` 或者 `closed`：
> 
> ```
> let shadow = elementRef.attachShadow({ mode: "open" });
> let shadow = elementRef.attachShadow({ mode: "closed" });
> ```
> 
> `open` 表示可以通过页面内的 JavaScript 方法来获取 Shadow DOM，例如使用 [`Element.shadowRoot`](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/shadowRoot) 属性：
> 
> ```
> let myShadowDom = myCustomElem.shadowRoot;
> ```
> 
> 如果你将一个 Shadow root 附加到一个 Custom element 上，并且将 `mode` 设置为 `closed`，那么就不可以从外部获取 Shadow DOM 了——`myCustomElem.shadowRoot` 将会返回 `null`。浏览器中的某些内置元素就是如此，例如`<video>`，包含了不可访问的 Shadow DOM。
> 
> 如果你想将一个 Shadow DOM 附加到 custom element 上，可以在 custom element 的构造函数中添加如下实现（目前，这是 shadow DOM 最实用的用法）：
> 
> ```
> let shadow = this.attachShadow({ mode: "open" });
> ```
> 
> 将 Shadow DOM 附加到一个元素之后，就可以使用 DOM APIs 对它进行操作，就和处理常规 DOM 一样。
> 
> ```
> var para = document.createElement('p');
> shadow.appendChild(para);
> etc.
> ```

**注意：**

- 要使用 Chrome 调试器检查 Shadow DOM，需要选中调试器的 `Preferences` / `Elmenets` 下的 `show user agent shadow DOM` 框*；比如对于上文提到的 `<video>`，在打开该调试选项后，就能在元素面板中看到 `<video>` 下挂载的 shadow tree
- 一些比较旧的资料中会出现 attachShadow() 的前身 createShadowRoot()，语义基本相同；createShadowRoot()已经被废弃，它是在 Shadow DOM v0 规范中引入的。Shadow DOM 的最新版本是 v1，是 Web 标准的一部分。

### [HTML templates](https://html.spec.whatwg.org/multipage/scripting.html#the-template-element) 和 [slot](https://html.spec.whatwg.org/multipage/scripting.html#the-slot-element)

`<template>` 元素允许开发者在 HTML 中定义一个模板，其中可以包含任意的 HTML 结构、文本和变量占位符。此元素及其内容不会在 DOM 中呈现，但仍可使用 JavaScript 去引用它。

> ```
> <template id="my-paragraph">
>   <p>My paragraph</p>
> </template>
> ```
> 
> 上面的代码不会展示在你的页面中，直到你用 JavaScript 获取它的引用，然后添加到 DOM 中，如下面的代码：
> 
> ```
> let template = document.getElementById("my-paragraph");
> let templateContent = template.content;
> document.body.appendChild(templateContent);
> ```
> 
> 模板（Template）本身就是有用的，而与 web 组件（web component）一起使用效果更好。我们定义一个 web 组件使用模板作为阴影（shadow）DOM 的内容，叫它 `<my-paragraph>`：
> 
> ```
> customElements.define(
>   "my-paragraph",
>   class extends HTMLElement {
>     constructor() {
>       super();
>       let template = document.getElementById("my-paragraph");
>       let templateContent = template.content;
> 
>       const shadowRoot = this.attachShadow({ mode: "open" });
>       shadowRoot.appendChild(templateContent.cloneNode(true));
>     }
>   },
> );
> ```

使用 `<slot>` 则能进一步展示不同的自定义内容：

> ```
> <template id="my-paragraph">
>   <p><slot name="my-text">My default text</slot></p>
> </template>
> ```
> 
> ...
> 
> ```
> <my-paragraph>
>   <ul slot="my-text">
>     <li>Let's have some different text!</li>
>     <li>In a list!</li>
>   </ul>
> </my-paragraph>
> ```

### [CSS Scoping（局部作用域的 CSS）](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scoping)

> The **CSS scoping** module defines the CSS scoping and encapsulation mechanisms, focusing on the [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM) [scoping](https://css.oddbird.net/scope/) mechanism.
> 
> 根据 Shadow DOM 作用域机制，**CSS scoping** 模块定义了 CSS 作用域和封装机制
> 
> CSS styles are either global in scope or scoped to a [shadow tree](https://developer.mozilla.org/en-US/docs/Glossary/Shadow_tree). Globally scoped styles apply to all the elements in the node tree that match the selector, including custom elements in that tree, but not to the shadow trees composing each custom element. Selectors and their associated style definitions don't bleed between scopes.
> 
> CSS 样式分为全局和 shadow tree 局部两种。全局样式应用于节点树中与选择器匹配的所有元素，包括该树中的自定义元素，但不应用于组成每个自定义元素的shadow tree。选择器及其关联的样式定义也不会在作用域之间流通。
> 
> Within the CSS of a shadow tree, selectors don't select elements outside the tree, either in the global scope or in other shadow trees. Each custom element has its own shadow tree, which contains all the components that make up the custom element (but not the custom element, or "host", itself).
> 
> 在 shadow tree 的 CSS 中，选择器不会影响树外部的元素 -- 无论是全局作用域还是其他 shadow tree。每个自定义元素都有自己的 shadow tree，它包含组成自定义元素的所有组件（但不包含自定义元素或“宿主”本身）。

#### [`:host`](https://developer.mozilla.org/zh-CN/docs/Web/CSS/:host) 伪类

在 shadow DOM  内部，要想为“宿主” shadow host 本身添加样式，可以用 CSS 选择器 `:host`：

```
:host {
  /* ... */
}
```

`:host` 选择器还有一种[函数式的用法](https://developer.mozilla.org/zh-CN/docs/Web/CSS/:host_function)，接收一个选择器参数，该参数表示 shadow host 本身具备特定的状态或样式时才生效，如：

```
:host(:hover) {
  background-color: #ccc;
}

:host(.active) {
  color: red;
}

:host(.footer) { // 宿主元素包含footer样式名时
  color : red; 
}
```

### [`:host-context`](https://developer.mozilla.org/zh-CN/docs/Web/CSS/:host-context) 伪类

与 `:host(selector)` 用法类似的还有 `:host-context()` 伪类，但所谓 context 的语意指的是，作为其参数的选择器指向的是 shadow host 宿主元素的上下文环境，也就是其作为哪个祖先元素的后代时才生效，如：

```
// 当宿主是 h1 后代时
:host-context(h1) {
  font-weight: bold;
}

// 当 .dark-theme 类应用于主文档 body 时
:host-context(body.dark-theme) p {
  color: #fff;
}
```

#### [`::part`](https://developer.mozilla.org/zh-CN/docs/Web/CSS/::part) 伪元素

用于在父页面指定 shadow DOM 内部使用了对应 `part` 属性元素的样式：

```
<html>
<head>
	<template id="template">
		My host element!
		<span part="sp">xxx</span>
	</template>
	<style>
		#host::part(sp) {
			background-color: aqua;
		}
	</style>
</head>
<body>
	<div id="host"></div>
	<script type="text/javascript">
		var template = document.querySelector('#template')
		var root = document.querySelector('#host').attachShadow({ mode: "open" });
		root.appendChild(template.content);
	</script>
</body>
</html>
```

`::part()` 在遵循 Shadow DOM 封装性的同时，提供了一个**安全指定内部样式**的途径。

 但这不是唯一的手段，**另一种“穿透”方法是通过 CSS 自定义变量**：
 
 ```
<html>
<head>
	<template id="template">
		<style>
			span {
				background-color: var(--sp-color, red);
			}
		</style>
		My host element will have a blue border!
		<span part="sp">xxx</span>
	</template>
	<style>
		#host {
			--sp-color: blue; // 生效
		}
	</style>
</head>
<body>
	<div id="host"></div>
	<script type="text/javascript">
		var template = document.querySelector('#template')
		var root = document.querySelector('#host').attachShadow({ mode: "open" });
		root.appendChild(template.content);
	</script>
</body>
</html>
 ```

#### [`::slotted`](https://developer.mozilla.org/zh-CN/docs/Web/CSS/::slotted) 伪元素

在自定义组件内部指定该样式后，仅有 **被外部成功填充的slot** 才会被匹配到，使用默认值的 slot 上则不会生效。

#### 优先级

- 对于“宿主”元素，外部样式优先级高于内部的 `:host`
-  如果要覆盖父页中设置的样式，则必须在宿主元素上内联完成
-  外部 `::part` 样式优先级高于内部定义

观察以下例子，优先级 blur > green > red:

```html
<head>
	<template id="template">
		<style>
			:host {
				border: 1px solid red;
				padding: 10px;
				line-height: 50px;
			}
		</style>
		My host element will have a blue border!
	</template>
	<style>
		#host {
			border-color: green;
		}
	</style>
</head>
<body>
	<div id="host" style="border-color: blue;"></div>
	<script type="text/javascript">
		var template = document.querySelector('#template')
		var root = document.querySelector('#host').attachShadow({ mode: "open" });
		root.appendChild(template.content);
	</script>
</body>
```

### [Event retargeting（事件的重定向）](http://w3c-html-ig-zh.github.io/webcomponents/spec-zh/shadow/#generatedID-16)

当 shadow DOM 中发生的事件在外部被捕获时，将会以其 host 元素作为目标。

> ```
> <user-card></user-card>
> 
> <script>
> customElements.define('user-card', class extends HTMLElement {
>   connectedCallback() {
>     this.attachShadow({mode: 'open'});
>     this.shadowRoot.innerHTML = `<p>
>       <button>Click me</button>
>     </p>`;
>     this.shadowRoot.firstElementChild.onclick =
>       e => alert("Inner target: " + e.target.tagName);
>   }
> });
> 
> document.onclick =
>   e => alert("Outer target: " + e.target.tagName);
> </script>
> 
> 打印出：
> Inner target: BUTTON
> Outer target: USER-CARD
> ```

外部文档并不需要知道自定义组件的内部情况 -- 从它的角度来看，**事件总是发生在自定义组件上，除非事件发生在 slot 的元素上**。

> ```
> <user-card id="userCard">
> <span slot="username">John Smith</span>
> </user-card>
> 
> <script>
> customElements.define('user-card', class extends HTMLElement {
>   connectedCallback() {
>     this.attachShadow({mode: 'open'});
>     this.shadowRoot.innerHTML = `<div>
>       <b>Name:</b> <slot name="username"></slot>
>     </div>`;
> 
>     this.shadowRoot.firstElementChild.onclick =
>       e => alert("Inner target: " + e.target.tagName);
>   }
> });
> 
> userCard.onclick = e => alert(`Outer target: ${e.target.tagName}`);
> </script>
> 
> 打印出：
> Inner target: BUTTON
> Outer target: SPAN
> ```

#### 从 Shadow DOM 内部触发事件

如果要发送[自定义事件](https://zh.javascript.info/shadow-dom-events)，可以使用 CustomEvent，注意要设置冒泡和 composed

```
this._shadowRoot.dispatchEvent(
  new CustomEvent("weather-fetched", {
    bubbles: true,
    composed: true,
    detail: json,
  })
);
```

### [<del>HTML imports</del>](https://www.w3.org/TR/html-imports/)

Web Component 标准中**被废弃**的一个草案（有[开源替代方案](https://www.zhangxinxu.com/wordpress/2021/07/html-rel-import-include/)），用于引入自定义组件的结构和完整定义，从而可以直接在主页面 html 中引用：

> ```
> <link rel="import" href="module-my-comp.html">
> 
> <my-comp />
> ```

## Web Component 开发框架

除了原生开发方法，社区中大量既有/特有开发语言，都可以转译为 Web Component

### [Polymer](https://polymer-library.polymer-project.org/3.0/docs/devguide/feature-overview)

Google 推出的 Web Components 库，支持数据的单向和双向绑定，兼容性较好，跨浏览器性能也较好；在语法层面，Polymer 也最接近 Web Components 的原生语法。

```js
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import '@polymer/iron-icon/iron-icon.js'; // 一个图标库

class IconToggle extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: inline-block;
        }
        iron-icon {
          fill: var(--icon-toggle-color, rgba(0,0,0,0));
          stroke: var(--icon-toggle-outline-color, currentcolor);
        }
        :host([pressed]) iron-icon {
          fill: var(--icon-toggle-pressed-color, currentcolor);
        }
      </style>
      <!-- shadow DOM goes here -->
      <iron-icon icon="[[toggleIcon]]"></iron-icon>
    `;
  }
  static get properties () {
    return {
      toggleIcon: {
        type: String
      },
      pressed: {
        type: Boolean,
        notify: true,
        reflectToAttribute: true,
        value: false
      }
    };
  }
  constructor() {
    super();
    this.addEventListener('click', this.toggle.bind(this));
  }
  toggle() {
    this.pressed = !this.pressed;
  }
}

customElements.define('icon-toggle', IconToggle);
```

### [Lit](https://lit.dev/)

Google 在 2019 年宣布停止对 Polymer 的进一步开发，转向支持 Web Components 规范更好的 Lit；这也是目前社区中被推荐较多的一个

> The Polymer library is in maintenance mode. For new development, we recommend **Lit**. -- Google

```
import {html, css, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';

@customElement('simple-greeting')
export class SimpleGreeting extends LitElement {
  static styles = css`p { color: blue }`;

  @property()
  name = 'Somebody';

  render() {
    return html`<p>Hello, ${this.name}!</p>`;
  }
}
```

```
<simple-greeting name="World"></simple-greeting>
```

### [React](http://react.dev/)

react 在 v17 版本之后，增加了对于[在 React 组件中使用 web component](https://github.com/facebook/react/pull/22184) 的支持：

> If you render a tag **with a dash**, like <my-element>, React will assume you want to render a custom HTML element. In React, rendering custom elements works differently from rendering built-in browser tags:
> 
> All custom element props are serialized to strings and are always set using attributes.
> Custom elements accept class rather than className, and for rather than htmlFor.
> If you render a built-in browser HTML element with an [is](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/is) attribute, it will also be treated as a custom element.

```
import React, { useState }  from 'react';
import './alert.js';

export default function App() {
  const [show, setShow] = useState(true);

  return (
    <div>
      <button onClick={() => setShow(!show)}>toggle alert</button>

      <x-alert hidden={show} status="success" closable oncloseChange={() => setShow(!show)}>
        This is a Web Component in React
      </x-alert>
    </div>
  );
}
```

而如果想**将标准 react 组件包装为 web component**，可以在 react 工程中直接结合 web component 原生语法、使用 React 完成节点渲染，并导出成独立组件。

比如 [Github上这个例子](https://github.com/dtkelch/react-web-components)：

```
import * as React from "react";
import * as ReactDom from "react-dom";
import { FetchData } from "./fetch-data";

class StandaloneComponent extends HTMLElement {
  mountPoint!: HTMLSpanElement;
  name!: string;

  connectedCallback() {
    const mountPoint = document.createElement("span");
    this.attachShadow({ mode: "open" }).appendChild(mountPoint);

    const name = this.getAttribute("name");
    if (name) {
      ReactDom.render(<FetchData name={name} />, mountPoint);
    } else {
      console.error("You must declare a name!");
    }
  }
}
export default StandaloneComponent;

window.customElements.get("standalone-component") ||
  window.customElements.define("standalone-component", StandaloneComponent);
```

另一种更方便的方式是依靠 react 社区中的工具，常见的如：

- [direflow](https://github.com/Silind-Software/direflow)
- [react-to-web-component](https://github.com/bitovi/react-to-web-component)

> For basic usage, we will use this simple React component:
> 
> ```
> const Greeting = () => {
>   return <h1>Hello, World!</h1>
> }
> ```
> 
> With our React component complete, all we have to do is call `r2wc` and [customElements.define](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/define) to create and define our custom element:
> 
> ```
> import r2wc from "@r2wc/react-to-web-component"
> 
> const WebGreeting = r2wc(Greeting)
> 
> customElements.define("web-greeting", WebGreeting)
> ```
> 
> Now we can use `<web-greeting>` like any other HTML element!
> 
> ```
> <body>
>   <h1>Greeting Demo</h1>
> 
>   <web-greeting></web-greeting>
> </body>
> ```

### [Vue3](https://vuejs.org/)

> Polymer 是另一个由谷歌赞助的项目，事实上也是 Vue 的一个灵感来源。Vue 的组件可以粗略的类比于 Polymer 的自定义元素，并且两者具有相似的开发风格。最大的不同之处在于，Polymer 是基于最新版的 Web Components 标准之上，并且需要重量级的 polyfills 来帮助工作 (性能下降)，浏览器本身并不支持这些功能。相比而言，Vue 在支持到 IE9 的情况下并不需要依赖 polyfills 来工作。
> 
> ...
> 
> Vue implements a content distribution API inspired by the [Web Components spec draft](https://github.com/w3c/webcomponents/blob/gh-pages/proposals/Slots-Proposal.md), using the `<slot>` element to serve as distribution outlets for content.
> 
> -- vue2官方文档

源自 Vue 2.x 时代对  Web Components 的关注，Vue 3 更进一步，**原生支持了将 Vue 3 组件导出为 Web Components**：

> Vue 提供了一个和定义一般 Vue 组件几乎完全一致的 [`defineCustomElement`](https://vuejs.org/api/general.html#definecustomelement) 方法来支持创建自定义元素。这个方法接收的参数和 [`defineComponent`](https://vuejs.org/api/general.html#definecomponent) 完全相同。但它会返回一个继承自 `HTMLElement` 的自定义元素构造器：
>  
> ```
> <my-vue-element></my-vue-element>
> ```
> 
> ```
> import { defineCustomElement } from 'vue'
> 
> const MyVueElement = defineCustomElement({
>   // 这里是同平常一样的 Vue 组件选项
>   props: {},
>   emits: {},
>   template: `...`,
> 
>   // defineCustomElement 特有的：注入进 shadow root 的 CSS
>   styles: [`/* inlined css */`]
> })
> 
> // 注册自定义元素
> // 注册之后，所有此页面中的 `<my-vue-element>` 标签
> // 都会被升级
> customElements.define('my-vue-element', MyVueElement)
> 
> // 你也可以编程式地实例化元素：
> // （必须在注册之后）
> document.body.appendChild(
>   new MyVueElement({
>     // 初始化 props（可选）
>   })
> )
> ```
> 
> ...
> 
> 官方的 SFC 工具链支持以“自定义元素模式”导入 SFC (需要 `@vitejs/plugin-vue@^1.4.0` 或 `vue-loader@^16.5.0`)。一个以自定义元素模式加载的 SFC 将会内联其 `<style>` 标签为 CSS 字符串，并将其暴露为组件的 `styles` 选项。这会被 `defineCustomElement` 提取使用，并在初始化时注入到元素的 shadow root 上。
> 
> 要开启这个模式，只需要将你的组件文件以 `.ce.vue` 结尾即可：
> 
> ```
> import { defineCustomElement } from 'vue'
> import Example from './Example.ce.vue'
> 
> console.log(Example.styles) // ["/* 内联 css */"]
> 
> // 转换为自定义元素构造器
> const ExampleElement = defineCustomElement(Example)
> 
> // 注册
> customElements.define('my-example', ExampleElement)
> ```

在 Vue 3 中使用其他 Web Component 同样简单，根据编译环境是浏览器、vite 或是 vue cli 等，设置其 `isCustomElement` 配置函数为 `(tag) => tag.includes('-')` 后基本就能正常使用了；详见[官方文档](https://cn.vuejs.org/guide/extras/web-components.html#using-custom-elements-in-vue)。

### [Vue 2](https://v2.cn.vuejs.org/)

Vue 2 中并不具备 Vue 3 中 defineCustomElement 那样的方法。

#### webpack

对于大部分基于原生 webpack 的 Vue 2 项目，可以用开源插件 [vue-custom-element](https://github.com/karol-f/vue-custom-element) 达到和 defineCustomElement 类似的效果，如：

```
Vue.customElement('widget-vue', MyVueComponent, {
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
```


#### Vue CLI 

而在由 Vue CLI 构建的 Vue 项目中，可以通过为构建命令指定 [`--target wc`](https://cli.vuejs.org/zh/guide/build-targets.html#web-components-%E7%BB%84%E4%BB%B6) 参数，从而将一个单独的入口构建为一个 Web Components 组件：

```
vue-cli-service build --target wc --name my-element [entry]
```

- `entry` 应该是一个 *.vue 文件。Vue CLI 将会把这个组件自动包裹并注册为 Web Components 组件，无需在 main.js 里自行注册
- 在 Web Components 模式中，Vue 是外置的。这意味着包中不会有 Vue，即便你在代码中导入了 Vue。这里的包会假设在页面中已经有一个可用的全局变量 Vue
- 该构建将会产生一个单独的 JavaScript 文件 (及其压缩后的版本) 将所有的东西都内联起来
- 当这个脚本被引入网页时，会注册自定义组件 <my-element>，其使用 [@vue/web-component-wrapper]() 包裹目标 Vue 组件，并自动代理属性、特性、事件和插槽
- 也可以设置构建命令打包多个组件或异步组件

```
<script src="https://unpkg.com/vue"></script>
<script src="path/to/my-element.js"></script>

<!-- 可在普通 HTML 中或者其它任何框架中使用 -->
<my-element></my-element>
```

## 🌰实例：用异构系统共建 web components

// TODO

## 总结

// TODO

## 参考资料

- http://w3c-html-ig-zh.github.io/webcomponents/spec-zh/shadow/
- https://javascript.info/webcomponents-intro
- https://www.webcomponents.org/introduction
- https://juejin.cn/post/7072715334519619598
- https://juejin.cn/post/7148974524795453476
- https://juejin.cn/post/7107856163361783816
- https://www.zhihu.com/question/321832109
- https://juejin.cn/post/7181088227531915322
- https://www.jitendrazaa.com/blog/salesforce/introduction-to-html-web-components/
- https://juejin.cn/post/7168630364246638606
- https://juejin.cn/post/6976557762377416718
- https://cn.vuejs.org/guide/extras/web-components.html
- https://web.dev/custom-elements-best-practices/
- https://github.com/stcruy/building-a-reusable-vue-web-component
- https://www.oreilly.com/library/view/modern-javascript/9781491971420/ch05.html
- https://developer.mozilla.org/zh-CN/docs/Web/API/Web_components
- https://deepinout.com/css/css-questions/417_css_what_is_the_different_between_host_host_hostcontext_selectors.html
- https://www.zhangxinxu.com/wordpress/2021/02/css-part-shadow-dom/
- https://juejin.cn/post/6923957212075261966
- https://web.dev/custom-elements-best-practices/
- https://www.abeautifulsite.net/tags/web%20components/
- https://juejin.cn/post/7010595352550047752
- https://dev.to/nurlan_tl/tips-to-create-web-components-using-vue-3-ts-vite-3a7a