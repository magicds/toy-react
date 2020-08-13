const hasKey = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const isString = (s) => Object.prototype.toString.call(s) === '[object String]';
const isObject = (s) => Object.prototype.toString.call(s) === '[object Object]';

class ElementWrap {
  constructor(type) {
    /**@type HTMLElement */
    this.root = document.createElement(type);
  }
  setAttribute(k, v) {
    if (k[0] === 'o' && k[1] === 'n') {
      const eventName = k.replace(/^on(\w)/, (m, g) => g.toLowerCase());
      this.root.addEventListener(eventName, v);
    }
    if (k === 'className') {
      k = 'class';
    }
    this.root.setAttribute(k, v);
  }
  appendChild(vChild) {
    const range = document.createRange();
    if (this.root.children.length) {
      range.setStartAfter(this.root.lastChild);
      range.setEndAfter(this.root.lastChild);
    } else {
      range.setStart(this.root, 0);
      range.setEnd(this.root, 0);
    }
    vChild.mountTo(range);
  }
  mountTo(/**@type Range */ range) {
    range.deleteContents();
    range.insertNode(this.root);
  }
}

class TextWrap {
  constructor(textContent) {
    this.root = document.createTextNode(textContent);
  }
  mountTo(range) {
    range.deleteContents();
    range.insertNode(this.root);
  }
}
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
export class Component {
  constructor() {
    this.children = [];
    // this.state = Object.create(null);
    this.props = Object.create(null);
  }
  setState(state) {
    if (this.state && state) {
      // Object.assign(this.state, state);
      merge(this.state, state);
      this.update();
    }
  }
  setAttribute(k, v) {
    this.props[k] = v;
    this[k] = v;
  }
  appendChild(child) {
    this.children.push(child);
  }
  render() {
    return <div></div>;
  }
  mountTo(/**@type Range */ range) {
    // this.render().mountTo(parent);
    this.range = range;
    this.update();
    // const range = document.createRange();
    // range.setStartAfter(parent.lastChild);
  }
  update() {
    // 删除dom前加入 pl 占位 避免 旧的dom删除时后续节点的 range 变化
    // TODO 是否可以通过替换的方式完成？
    const pl = document.createComment('node remove holder');
    const range = document.createRange();
    range.setStart(this.range.endContainer, this.range.endOffset);
    range.setEnd(this.range.endContainer, this.range.endOffset);
    range.insertNode(pl);

    this.range.deleteContents();
    const vdom = this.render();
    vdom.mountTo(this.range);

    // pl.remove();
  }
}

export const ToyReact = {
  createElement(type, attributes, ...children) {
    const el = isString(type) ? new ElementWrap(type) : new type();

    for (let key in attributes) {
      if (hasKey(attributes, key)) {
        el.setAttribute(key, attributes[key]);
      }
    }

    const isCom = (child) => [ElementWrap, TextWrap, Component].some((p) => child instanceof p);

    const insertChildren = (children) => {
      for (let child of children) {
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
  },
  render(vdom, /**@type HTMLElement */ element) {
    const range = document.createRange();

    if (element.children.length) {
      range.setStartAfter(element.lastChild);
      range.setEndAfter(element.lastChild);
    } else {
      range.setStart(element, 0);
      range.setEnd(element, 0);
    }
    vdom.mountTo(range);
  }
};
