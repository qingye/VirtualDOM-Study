"use strict";

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function () { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/********************************************************************************************************************************************
 * Define a basic Component
 ********************************************************************************************************************************************/
var Component = /*#__PURE__*/function () {
  function Component(props) {
    _classCallCheck(this, Component);

    this.props = props;
    this.state = {};
  }

  _createClass(Component, [{
    key: "setState",
    value: function setState(newState) {
      this.state = _objectSpread(_objectSpread({}, this.state), newState);
      diff(this._dom, this.render());
    }
  }, {
    key: "render",
    value: function render() {
      throw new Error('Component should define its own render');
    }
  }]);

  return Component;
}();
/********************************************************************************************************************************************
 * 这里的diff，实际上就是一个递归的过程：
 *
 * 1. diff根元素;
 * 2. diff根元素的props;
 * 3. diff根元素的children;
 * 4. 每个child的diff又是调用diff方法
 *
 * 更新节点（如果是移动）则需要特殊处理，减少渲染时间
 ********************************************************************************************************************************************/


function diff(srcDOM, destDOM, parent, _component) {
  if (_typeof(destDOM) === 'object' && typeof destDOM.tag === 'function') {
    buildComponent(srcDOM, destDOM, parent);
    return false;
  } // 原dom没有，新vdom有，则表明是新增节点


  if (srcDOM === undefined) {
    srcDOM = createElement(destDOM);

    if (_component) {
      srcDOM._component = _component;
      srcDOM._componentConstructor = _component.constructor;
      _component._dom = srcDOM;
    }

    parent.appendChild(srcDOM);
    return false;
  } // 原dom有，新vdom没有，则表明是移除节点


  if (destDOM === undefined) {
    parent.removeChild(srcDOM);
    return false;
  } // 新老节点（类型不同 or tag不同 or 内容不同），则表明是替换节点


  if (!isEqual(destDOM, srcDOM)) {
    parent.replaceChild(createElement(destDOM), srcDOM);
    return false;
  } // 至此，只有可能是当前vdom的自身props变化 or 其children发生变化


  if (srcDOM.nodeType === Node.ELEMENT_NODE) {
    diffProps(destDOM.props, srcDOM);
    diffChildren(destDOM, srcDOM);
  }

  return true;
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
      setAttribute(element, key, nv);
    }

    newProps[key] = all[key];
  });
  element['props'] = newProps;
}

function diffChildren(vdom, element) {
  var nodes = element.childNodes || [];
  var children = vdom.children || [];
  var hasKeys = {};
  var noKeys = []; // 根据是否有key先进行分组

  nodes.forEach(function (node) {
    var props = node['props'];

    if (props && props.key !== undefined) {
      hasKeys[props.key] = node;
    } else {
      noKeys.push(node);
    }
  }); // 遍历vdom

  children.forEach(function (child, index) {
    var dom;
    var key = child.props && child.props.key !== undefined ? child.props.key : undefined;

    if (key != null && hasKeys[key]) {
      dom = hasKeys[key];
      delete hasKeys[key];
    } else {
      for (var i = 0; i < noKeys.length; i++) {
        var node = noKeys[i];

        if (isEqual(child, node)) {
          dom = node;
          noKeys.splice(i, 1);
          break;
        }
      }
    }

    var isUpdate = diff(dom, child, element);

    if (isUpdate) {
      // 更新（移动），则移到当前元素的位置，当前元素向后延一位
      var origin = nodes[index];

      if (origin !== child) {
        element.insertBefore(dom, origin);
      }
    }
  }); // 移除不在新的vdom中的节点

  var list = Object.keys(hasKeys);

  if (list.length > 0) {
    list.forEach(function (key) {
      element.removeChild(hasKeys[key]);
    });
  }

  if (noKeys.length > 0) {
    noKeys.forEach(function (node) {
      element.removeChild(node);
    });
  }
}
/********************************************************************************************************************************************
 *
 ********************************************************************************************************************************************/


function isEqual(vdom, element) {
  var elType = element.nodeType;

  var vdomType = _typeof(vdom); // 自定义组件 tag 判断


  if (typeof vdom.tag === 'function') {
    return element._componentConstructor === vdom.tag;
  } // 检查dom元素是文本节点的情况


  if (elType === Node.TEXT_NODE && (vdomType === 'string' || vdomType === 'number') && element.nodeValue.toString() === vdom.toString()) {
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


var DemoComp = /*#__PURE__*/function (_Component) {
  _inherits(DemoComp, _Component);

  var _super = _createSuper(DemoComp);

  function DemoComp(props) {
    var _this;

    _classCallCheck(this, DemoComp);

    _this = _super.call(this, props);

    _defineProperty(_assertThisInitialized(_this), "interval", function () {
      setInterval(function () {
        _this.setState({
          name: 'chris-',
          value: _this.state.value + 1
        });
      }, 2000);
    });

    _defineProperty(_assertThisInitialized(_this), "click", function () {
      console.log('DemoComp.click');
    });

    _this.state = {
      name: 'chris-',
      value: 0
    };

    _this.interval();

    return _this;
  }

  _createClass(DemoComp, [{
    key: "render",
    value: function render() {
      return v("div", {
        onClick: this.click
      }, v("div", null, "This is DemoComp....props = ", this.props.value), v("div", null, "DemoComp.state.name = ", this.state.name, this.state.value));
    }
  }]);

  return DemoComp;
}(Component);
/********************************************************************************************************************************************
 *
 ********************************************************************************************************************************************/


var root = null;

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
  return v("div", null, v("div", null, "Header"), v(DemoComp, {
    value: 'demo'
  }));
}

function setProps(element, props) {
  for (var k in props) {
    if (props.hasOwnProperty(k)) {
      setAttribute(element, k, props[k]);
    }
  } // 保存当前的属性，之后用于新VirtualDOM的属性比较


  element['props'] = props;
}

function setAttribute(element, key, value) {
  if (key.substring(0, 2) === 'on') {
    // event
    element.addEventListener(key.substring(2).toLowerCase(), value.bind(element));
  } else {
    element.setAttribute(key, value);
  }
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

  children.map(function (child) {
    return diff(undefined, child, element);
  });
  return element;
}

function buildComponent(dom, component, parent) {
  var tag = component.tag,
      props = component.props,
      children = component.children;
  props.children = children;

  var _component = dom && dom._component;

  if (_component === undefined) {
    _component = new tag(props);
  } else {
    _component.props = props;
  }

  diff(dom, _component.render(), parent, _component);
}
/********************************************************************************************************************************************
 * 在 render 中:
 * 1. 首次创建 dom;
 * 2. 非首次则比较前后两次 Virtual DOM 差异，并更新
 * 3. 记录本次的 Virtual DOM
 ********************************************************************************************************************************************/


function render(container) {
  root = container;
  diff(container.firstChild ? container.firstChild : undefined, view(), container);
} // 执行render


render(document.getElementById("app"));
