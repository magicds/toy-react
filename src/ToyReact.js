const RENDER_TO_DOM = Symbol('render to dom');

const hasKey = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const isString = (s) => Object.prototype.toString.call(s) === '[object String]';
const isObject = (s) => Object.prototype.toString.call(s) === '[object Object]';

/**
 * 简单的 merge 函数
 * 但参数仅支持对象 且仅简单做了对象的深入递归
 * @param {object} target 操作目标对象
 * @param  {...object} objArr 其他对象
 */
function merge(target, ...objArr) {
  for (const obj of objArr) {
    for (const key in obj) {
      if (hasKey(obj, key)) {
        if (isObject(obj[key])) {
          if (!isObject(target[key])) {
            target[key] = {};
          }
          console.log(target[key], obj[key]);
          merge(target[key], obj[key]);
        } else {
          target[key] = obj[key];
        }
      }
    }
  }
  return target;
}
// const a = merge({ a: [1] }, { a: 1, c: [] }, { b: 2 });
// console.log(a);

class ElementWrap {
  constructor(type) {
    /**@type HTMLElement */
    this.root = document.createElement(type);
  }
  setAttribute(k, v) {
    if (k[0] === 'o' && k[1] === 'n') {
      const eventName = k.replace(/^on(\w)/, (m, g) => g.toLowerCase());
      this.root.addEventListener(eventName, v);
      return;
    }
    if (k === 'className') {
      this.root.setAttribute('class', v);
    } else {
      this.root.setAttribute(k, v);
    }
  }
  appendChild(component) {
    const range = document.createRange();
    range.setStart(this.root, this.root.childNodes.length);
    range.setEnd(this.root, this.root.childNodes.length);
    component[RENDER_TO_DOM](range);
  }
  [RENDER_TO_DOM](/**@type Range */ range) {
    range.deleteContents();
    range.insertNode(this.root);
  }
}

class TextWrap {
  constructor(textContent) {
    this.root = document.createTextNode(textContent);
  }
  [RENDER_TO_DOM](/**@type Range */ range) {
    range.deleteContents();
    range.insertNode(this.root);
  }
}

export class Component {
  constructor() {
    this.children = [];
    this.props = Object.create(null);
    this._root = null;
    this._range = null;
  }
  get root() {
    if (!this._root) {
      return this.render().root;
    }
    return this._root;
  }
  setState(state) {
    if (this.state === null && !isObject(this.state)) {
      this.state = state;
      this.renderer();
      return;
    }
    merge(this.state, state);
    this.renderer();
  }
  setAttribute(k, v) {
    this.props[k] = v;
  }
  appendChild(component) {
    this.children.push(component);
  }

  [RENDER_TO_DOM](/**@type Range */ range) {
    this._range = range;
    this.render()[RENDER_TO_DOM](range);
  }

  renderer() {
    const oldRange = this._range;

    const range = document.createRange();
    range.setStart(oldRange.startContainer, oldRange.startOffset);
    range.setEnd(oldRange.startContainer, oldRange.startOffset);
    this[RENDER_TO_DOM](range);

    oldRange.setStart(range.endContainer, range.endOffset);
    oldRange.deleteContents();
  }
  // mountTo(/**@type Range */ range) {
  //   // this.render().mountTo(parent);
  //   this.range = range;
  //   this.update();
  //   // const range = document.createRange();
  //   // range.setStartAfter(parent.lastChild);
  // }
  // update() {
  //   // 删除dom前加入 pl 占位 避免 旧的dom删除时后续节点的 range 变化
  //   // TODO 是否可以通过替换的方式完成？
  //   const pl = document.createComment('node remove holder');
  //   const range = document.createRange();
  //   range.setStart(this.range.endContainer, this.range.endOffset);
  //   range.setEnd(this.range.endContainer, this.range.endOffset);
  //   range.insertNode(pl);

  //   this.range.deleteContents();
  //   const vdom = this.render();
  //   vdom.mountTo(this.range);

  //   // pl.remove();
  // }
}

export function createElement(type, attributes, ...children) {
  const el = isString(type) ? new ElementWrap(type) : new type();

  for (let key in attributes) {
    if (hasKey(attributes, key)) {
      el.setAttribute(key, attributes[key]);
    }
  }

  const isCom = (child) => [ElementWrap, TextWrap, Component].some((p) => child instanceof p);

  const insertChildren = (children) => {
    for (let child of children) {
      if (child === null) continue;

      if (Array.isArray(child)) {
        // 是数组则继续
        insertChildren(child);
      } else {
        // 不是认识的组件
        if (!isCom(child)) {
          child = String(child);
        }
        if (isString(child)) {
          child = new TextWrap(child);
        }
        el.appendChild(child);
      }
    }
  };
  insertChildren(children);

  return el;
}
export function render(component, /**@type HTMLElement */ parentElement) {
  const range = document.createRange();

  range.setStart(parentElement, 0);
  range.setEnd(parentElement, parentElement.childNodes.length);
  range.deleteContents();
  component[RENDER_TO_DOM](range);
}

export const ToyReact = {
  createElement,
  render
};
