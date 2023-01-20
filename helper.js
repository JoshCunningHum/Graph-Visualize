// Acts as data bindings for objects


class DataBind {
    static DEF_CLASSES = ["databind"]

    static instances = [];

    static get(id) {
        return DataBind.instances.find(e => e.htmlID == id);
    }

    static add(db) {
        DataBind.instances.push(db);
    }

    static clear(){
        DataBind.instances.length = 0;
    }

    static getRefs(dom) {
        console.log(dom.parentElement.dataset.dataBind);
        return [dom.parentElement, DataBind.get(dom.parentElement.dataset.dataBind)];
    }

    // TODO: Find a way to create action buttons (Invoke methods)
    // TODO: Array Helpers (Remove, ReOrder)
    /*
        Types:
            Text
            Number
            Select
            Range
            Toggle

            Display

            Action // Only Invokes
            TODO: 
            DisplayC // Updates the DOM on whatever (Is not autoupdate, but constantly request)
    */
    type = "Text";
    html = null;
    h = null; // Helper Object
    id;
    name;
    text;

    isInvokeOnly = false;
    isDisplayOnly = false;

    isUpdateOnly = false;

    target; // What part of the object is the target

    constructor({ h, id, type, name, text, target, classes, intercept, callback, max, min, cbScopeSelf, itcScopeSelf, def}) {
        this.h = h;
        // Have plans to add more so...
        ["Action"].includes(type) && (this.isInvokeOnly = true);
        ["DisplayC"].includes(type) && (this.isDisplayOnly = true);
        // Important for storing in Databind
        this.id = id || (this.isInvokeOnly || this.isDisplayOnly) ? `${type}:${name}` : `${target}:${name}` ||Util.gen_id();
        this.htmlID = this.id + Util.gen_id();
        this.type = type;
        this.name = name;
        this.text = text;
        this.target = target;
        this.classes = classes || [];
        this.intercept = intercept;
        this.callback = callback;

        this.val = def;

        this.scopeCB = cbScopeSelf;
        this.scopeIT = itcScopeSelf;

        this.min = min;
        this.max = max;

        DataBind.add(this);
        this.init();
    }

    delete() {
        const index = DataBind.instances.findIndex(e => e.id == this.id);
        DataBind.instances.splice(index, 1);
    }

    request(runIntercept = false, runCallback = false) {
        this.isUpdateOnly = true;
        if(runIntercept) this.intercept?.bind(this)();
        this.value = this.h.obj.real[this.target];
        if(runCallback) this.callback?.bind(this)();
    }

    set value(val) {
        if(!this.isUpdateOnly) this.intercept?.bind(this)();

        switch (this.type) {
            case "Text":
                this.val = val;
                this.html.children[1].value = val;
                break;
            case "Number":
            case "Range":
                this.val = parseFloat(val);
                this.html.children[1].value = this.val;
                break;
            case "Toggle":
                this.val = val;
                this.html.children[1].checked = this.val;
                break;
            case "Select":

                break;

            // 
            case "Display":
                this.val = val;
                this.html.children[1].innerHTML = val;
                break;
            case "Action":
                this.target.bind(val.obj)(val);
                return;
            case "DisplayC":

                return;
        }

        // Everytime a value is set, helper object is called to update this databind
        this.html.dataset.value = val;
        if(!this.isUpdateOnly) this.h.update(this.id);

        if(!this.isUpdateOnly) this.callback?.bind(this)();
        this.isUpdateOnly = false;
    }

    get value() {
        switch (this.type) {
            case "Select":
                return this.html.inp.selectedIndex;
            default:
                return this.val;
        }
    }

    init() {
        this.html = document.createElement("div");
        this.html.id = `databind-${this.id}`;
        this.html.dataset.dataBind = this.htmlID;
        this.html.dataset.type = this.type.toLowerCase();
        this.html.classList.add(
            "databind",
            `databind-${this.name}`,
            ...this.classes,
            ...DataBind.DEF_CLASSES
        );

        let inp = document.createElement("input"),
            label = document.createElement("label");


        switch (this.type) {
            case "Range":
                inp.setAttribute("min", this.min);
                inp.setAttribute("max", this.max);
            case "Number":
            case "Text":
                inp.setAttribute("type", this.type.toLowerCase());

                inp.addEventListener("input", function () {
                    const [parent, controller] = DataBind.getRefs(this);

                    controller.value = this.value;
                })

                if(this.type != "Range"){
                    inp.addEventListener("click", function(){
                        this.select();
                    })
                }

                break;
            case "Display":
                inp = document.createElement("div");
                break;
            case "Toggle":
                inp.setAttribute("type", "checkbox");

                inp.addEventListener("change", function () {
                    const [parent, controller] = DataBind.getRefs(this);

                    controller.value = this.checked;
                })
                break;
            case "Select":
                break;
            case "Action":
                // Action Only Invokes
                inp = document.createElement("button");
                inp.innerText = this.text;
                inp.addEventListener("click", function (e) {
                    const [parent, controller] = DataBind.getRefs(this);

                    controller.value = {
                        e: e,
                        db: controller,
                        h: controller.h,
                        obj: controller.h.obj
                    }
                });
                break;
            default:
                console.error(`Type: ${this.type} is not allowed`);
        }

        inp.id = `databind-${this.id}-input`;
        label.innerText = this.text;
        label.setAttribute("for", inp.id);
        this.html.append(label, inp);
    }

    disable(val){
        this.html.dataset.isDisabled = val;
        this.html.children[1].disabled = val;
    }
}


class Helper {
    dom = null; // container
    obj = null;
    schema = [];

    showed = false;

    constructor({ dom, obj, schema }) {
        this.dom = dom;
        this.obj = obj;
        this.schema = schema;


        // Add Default Interception to delete all databinds on delete of the real object
    }

    delete() {
        this.schema.forEach(sch => {
            sch.delete();
        })
        return "Helper deleted";
    }

    init() {
        // Obj -> Dom
        // Add Interceptors Here
        for (const sch of this.schema) {
            if (sch.isInvokeOnly || sch.isDisplayOnly) continue;

            this.obj.addInterceptor({
                key: sch.target,
                // This function is binded to the DataBind Object
                fn: function (val) {
                    this.value = val;
                },
                id: sch.id
            })

            sch.value = this.obj.real[sch.target];
        }


    }

    get(id) {
        return this.schema.find(e => e.id == id);
    }

    getAll(key){
        return this.schema.filter(e => e.target == key);
    }

    hide() {
        this.showed = false;
        this.dom.innerHTML = "";
    }

    show() {
        this.showed = true;
        this.dom.innerHTML = "";
        this.schema.forEach(sch => {
            this.dom.append(sch.html);
        })
    }

    update(id) {
        // Is not called on DisplayOnly or InvokeOnly Databinds
        // For changes from dom -> obj
        const schem = this.schema.find(e => e.id == id);
        this.obj.real[schem.target] = schem.value;
    }
}

class NodeHelper extends Helper {
    constructor({ dom, obj }) {
        super({
            dom: dom,
            obj: obj,
            schema: []
        })

        this.schema = [
            new DataBind({
                h: this,
                type: "Display",
                name: "NodeID",
                text: "NODE",
                target: "id",
                classes: ["disable"]
            }),
            new DataBind({
                h: this,
                type: "Text", // Type of Data to bind
                name: "NodeText", // Name of the databind (For Indexing Purposes)
                text: "Name", // Text for the label
                target: "text" // Target entry from the object ex: obj.text
            }),
            new DataBind({
                h: this,
                type: "Toggle",
                name: "ToggleSelect",
                text: "Start Node",
                target: "isStart",  
                // Scope is the DataBind Object
                intercept: function () {
                    if(this.h.obj.real.isEnd) return;
                
                    const lastVal = this.value;

                    // Set all other connecting nodes isStart to false
                    const node = this.h.obj;
                    Util.visitAndApply(node, function () {
                        this.real.isStart = false;
                        
                        this.helper?.get("isStart:ToggleSelect").request(false, true);
                        if(this.real.isEnd) this.helper?.get("isEnd:ToggleEnd").request(false, true);
                        // enable all is end toggle buttons
                        this.helper?.get("isEnd:ToggleEnd").disable(false);
                    })

                    this.h.get("isEnd:ToggleEnd").disable(lastVal == undefined ? false : !lastVal);
                    
                },
                callback: function() {
                    // Path Finding Validation
                    DOM.algo_onChange();

                    // Add some stylings
                    this.h.obj.real.cv_outcolor = this.value ? "green" : Node.cv_outcolor;
                    this.h.obj.real.cv_radius = this.value ? Node.cv_radius * 1.2 : Node.cv_radius;
                    this.h.obj.real.cv_gap = this.value ? Node.cv_gap * 2 : Node.cv_gap;
                },
            }),
            new DataBind({
                h: this,
                type: "Toggle",
                name: "ToggleEnd",
                text: "End Node",
                target: "isEnd", 

                // Scope is the DataBind Object
                intercept: function () {
                    // Check if node is start
                    if(this.h.obj.real.isStart) return;
                
                    const lastVal = this.value;

                    // Set all other connecting nodes isEnd to false
                    const node = this.h.obj;
                    Util.visitAndApply(node, function () {
                        this.real.isEnd = false;
                        
                        this.helper?.get("isEnd:ToggleEnd").request(false, true);
                        if(this.real.isStart) this.helper?.get("isStart:ToggleSelect").request(false, true);
                        // enable all is start toggle buttons
                        this.helper?.get("isStart:ToggleSelect").disable(false);
                    })

                    this.h.get("isStart:ToggleSelect").disable(lastVal == undefined ? false : !lastVal);
                    
                },
                callback: function() {
                    // Path Finding Validation
                    DOM.algo_onChange();

                    // Add some stylings
                    this.h.obj.real.cv_outcolor = this.value ? "crimson" : Node.cv_outcolor;
                    this.h.obj.real.cv_radius = this.value ? Node.cv_radius * 1.2 : Node.cv_radius;
                    this.h.obj.real.cv_gap = this.value ? Node.cv_gap * 2 : Node.cv_gap;
                },
                classes: ["mt-1", "mb-1"]
            }),
            new DataBind({
                h: this,
                type: "Display",
                name: "NodeCoord",
                text: "Coordinates",
                target: "pos",
                classes: ["disable"]
            }),
            // Action is not a databind, but an invoker
            new DataBind({
                h: this,
                type: "Action",
                name: "DeleteNode",
                text: "Delete",
                target: function (val) {
                    // Scope is the helper object
                    this.delete();
                },
                classes: ["delete"]
            }),
        ]

        this.init();
    }

}

class DegreeHelper extends Helper{
    constructor({ dom, obj }) {
        super({
            dom: dom,
            obj: obj,
            schema: []
        })

        this.schema = [
            new DataBind({
                h: this,
                type: "Display",
                name: "DegreeID",
                text: "DEGREE",
                target: "id",
                classes: ["disable"]
            }),
            new DataBind({
                h: this,
                type: "Number",
                name: "DegreeValueInput",
                text: "Length",
                target: "value",
                classes: ["disable"],
                callback: function(){
                    this.h.getAll("value").forEach(e => e.request());
                }
            }),
            new DataBind({
                h: this,
                type: "Range",
                name: "DegreeValueSlider",
                text: "",
                min: 0,
                max: 20,
                target: "value",
                callback: function(){
                    this.h.getAll("value").forEach(e => e.request());
                }
            }),
            new DataBind({
                h: this,
                type: "Action",
                name: "DegreeDecPlus",
                text: "<<",
                target: function(val) {
                    // Scope is the ProxyObject object
                    this.value-= 5;
                },
                classes: ["deg-val-controller", "dev-val-ext"]
            }),
            new DataBind({
                h: this,
                type: "Action",
                name: "DegreeDec",
                text: "<",
                target: function(val) {
                    // Scope is the ProxyObject object
                    this.value--;
                },
                classes: ["deg-val-controller"]
            }),
            new DataBind({
                h: this,
                type: "Action",
                name: "DegreeInc",
                text: ">",
                target: function(val) {
                    // Scope is the ProxyObject object
                    this.value++;
                },
                classes: ["deg-val-controller"]
            }),
            new DataBind({
                h: this,
                type: "Action",
                name: "DegreeIncPlus",
                text: ">>",
                target: function(val) {
                    // Scope is the ProxyObject object
                    this.value+= 5;
                },
                classes: ["deg-val-controller", "dev-val-ext"]
            }),
            new DataBind({
                h: this,
                type: "Toggle",
                name: "ToggleMultiDirected",
                text: "Multi Directed",
                target: "isMultiDirected",
                classes: ["mt-1"],
                intercept: function(){
                    const reverseHTML = this.h.get("Action:ReverseDegree").html;
                    reverseHTML.dataset.isDisabled = !this.value;
                    reverseHTML.children[1].disabled = !this.value;
                }
            }),
            // Action is not a databind, but an invoker
            new DataBind({
                h: this,
                type: "Action",
                name: "ReverseDegree",
                text: "Reverse",
                target: function (val) {
                    // Scope is the ProxyObject object
                    this.reverse();
                },
                classes: ["neutral", "mb-1"]
            }),
            // Action is not a databind, but an invoker
            new DataBind({
                h: this,
                type: "Action",
                name: "DeleteNode",
                text: "Delete",
                target: function (val) {
                    // Scope is the helper object
                    this.delete();
                },
                classes: ["delete"]
            }),
        ]

        this.init();
    }
}