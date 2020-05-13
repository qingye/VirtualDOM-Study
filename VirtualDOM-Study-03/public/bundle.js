"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/********************************************************************************************************************************************
 * 这里的diff，实际上就是一个递归的过程：
 *
 * 1. diff根元素;
 * 2. diff根元素的props;
 * 3. diff根元素的children;
 * 4. 每个child的diff又是调用diff方法
 ********************************************************************************************************************************************/
function diff(vdom, parent) {
  var cid = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  var len = parent.childNodes.length; // child是当前真实dom！

  var child = cid >= len ? undefined : parent.childNodes[cid]; // 原dom没有，新vdom有，则表明是新增节点

  if (child === undefined) {
    parent.appendChild(createElement(vdom));
    return;
  } // 原dom有，新vdom没有，则表明是移除节点


  if (vdom === undefined) {
    parent.removeChild(child);
    return;
  } // 新老节点（类型不同 or tag不同 or 内容不同），则表明是替换节点


  if (!isEqual(vdom, child)) {
    parent.replaceChild(createElement(vdom), child);
    return;
  } // 至此，只有可能是当前vdom的自身props变化 or 其children发生变化


  if (child.nodeType === Node.ELEMENT_NODE) {
    diffProps(vdom.props, child);
    diffChildren(vdom, child);
  }
}

function diffProps(props, element) {
  // 合并所有props的键值（后者替换前者）
  var all = _objectSpread(_objectSpread({}, element['props']), props);

  var newProps = {}; // 遍历props的所有键值

  Object.keys(all).forEach(function (key) {
    var ov = element['props'][key];
    var nv = props[key]; // 新vdom没有该属性

    if (nv === undefined) {
      element.removeAttribute(key);
      return;
    } // 老vdom没有该属性，or 该属性值与新vdom的属性值不一致


    if (ov === undefined || ov !== nv) {
      element.setAttribute(key, nv);
    }

    newProps[key] = all[key];
  });
  element['props'] = newProps;
}

function diffChildren(vdom, element) {
  // 子元素最大长度
  var len = Math.max(element.childNodes.length, vdom.children.length); // 依次遍历并diff子元素

  for (var i = 0; i < len; i++) {
    diff(vdom.children[i], element, i);
  }
}
/********************************************************************************************************************************************
 *
 ********************************************************************************************************************************************/


function isEqual(vdom, element) {
  var elType = element.nodeType;

  var vdomType = _typeof(vdom); // 检查dom元素是文本节点的情况


  if (elType === Node.TEXT_NODE && (vdomType === 'string' || vdomType === 'number') && element.nodeValue === vdom) {
    return true;
  } // 检查dom元素是普通节点的情况


  if (elType === Node.ELEMENT_NODE && element.tagName.toLowerCase() === vdom.tag.toLowerCase()) {
    return true;
  }

  return false;
}
/********************************************************************************************************************************************
 *
 ********************************************************************************************************************************************/
// 新增状态对象


var state = {
  number: 0
};

function flatten(children) {
  return [].concat.apply([], children);
}

function v(tag, props) {
  for (var _len = arguments.length, children = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    children[_key - 2] = arguments[_key];
  }

  return {
    tag: tag,
    props: props || {},
    children: flatten(children) || []
  };
} // 根据 state.number 来计算有多少个 div


function view() {
  return v("div", {
    "data-number": state.number
  }, "Hello World!", _toConsumableArray(Array(state.number).keys()).map(function (idx) {
    return v("div", {
      id: 'div' + idx,
      "data-idx": idx
    }, "-> ", idx);
  }));
}

function setProps(element, props) {
  for (var k in props) {
    if (props.hasOwnProperty(k)) {
      element.setAttribute(k, props[k]);
    }
  } // 保存当前的属性，之后用于新VirtualDOM的属性比较


  element['props'] = props;
}

function createElement(vdom) {
  var t = _typeof(vdom);

  if (t === 'string' || t === 'number') {
    return document.createTextNode(vdom);
  }

  var tag = vdom.tag,
      props = vdom.props,
      children = vdom.children; // 1. 创建元素

  var element = document.createElement(tag); // 2. 属性赋值

  setProps(element, props); // 3. 创建子元素
  // appendChild在执行的时候，会检查当前的this是不是dom对象，因此要bind一下

  children.map(createElement).forEach(element.appendChild.bind(element));
  return element;
}
/********************************************************************************************************************************************
 * 在 render 中:
 * 1. 首次创建 dom;
 * 2. 非首次则比较前后两次 Virtual DOM 差异，并更新
 * 3. 记录本次的 Virtual DOM
 ********************************************************************************************************************************************/


function render(container) {
  diff(view(), container);
  setTimeout(function () {
    state.number += 1;
    render(container);
  }, 3000);
} // 执行render


render(document.getElementById("app"));
