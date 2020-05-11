function flatten(children) {
    return [].concat.apply([], children);
}

function v(tag, props, ...children) {
    return {
        tag,
        props: props || {},
        children: flatten(children) || []
    }
}

function view() {
    return (
        <div>
            Hello World!
            <div id="div1" data-idx={1}>first</div>
            <div id="div2">second</div>
        </div>
    );
}

function setProps(element, props) {
    for (let k in props) {
        if (props.hasOwnProperty(k)) {
            element.setAttribute(k, props[k]);
        }
    }
}

function createElement(vdom) {
    const t = typeof vdom;
    if (t === 'string' || t === 'number') {
        return document.createTextNode(vdom);
    }

    const {tag, props, children} = vdom;

    // 1. 创建元素
    const element = document.createElement(tag);

    // 2. 属性赋值
    setProps(element, props);

    // 3. 创建子元素
    // appendChild在执行的时候，会检查当前的this是不是dom对象，因此要bind一下
    children.map(createElement).forEach(element.appendChild.bind(element));

    return element;
}

function render(vdom, container) {
    container.appendChild(createElement(vdom));
}

// 执行render
render(
    view(),
    document.getElementById("app")
);