var test, anotherTest, h;

document.addEventListener("DOMContentLoaded", function(){
    const c = document.getElementById("c");
    const nodeHelper = document.getElementById("node_objectInterface");

    h = new Handler({
        c: c,
        ctx: c.getContext("2d"),
        width: c.clientWidth,
        height: c.clientHeight,
        helperCont: nodeHelper
    })

    test = new Node({
        text: "TEST",
        handler: h
    })

    anotherTest = new Node({
        text: "Another Test",
        handler: h
    })
    
    h.add(test, anotherTest);

    test.addEvents(...Node.DEF_EVENTS);
    anotherTest.addEvents(...Node.DEF_EVENTS);
    test.connect(anotherTest);
    anotherTest.pos = [100, 200];
    test.pos = [300, 500];

    h.init();
})