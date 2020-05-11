function flatten(children) {
    return [].concat.apply([], children);
}

function v(tag, props, ...children) {
    console.log(tag, props, children);

    return {
        tag,
        props: props || {},
        children: flatten(children) || []
    };
}

function view() {
    return v(
        "div",
        null,
        "Hello World!",
        v(
            "div",
            { id: "div1", "data-idx": 1 },
            "first"
        ),
        v(
            "div",
            { id: "div2" },
            "second"
        )
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

    const { tag, props, children } = vdom;

    const element = document.createElement(tag);
    setProps(element, props);
    children.map(createElement).forEach(element.appendChild.bind(element));
    return element;
}

function render(vdom, container) {
    container.appendChild(createElement(vdom));
}

// 执行render
render(view(), document.getElementById("app"));
