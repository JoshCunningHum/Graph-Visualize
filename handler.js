class Handler{
    ctx;
    c; // canvas/table dom
    mode = "canvas";
    
    state = {
        mDown: false,
        mOver: false,
        dragging: false,
        mx: 0,
        my: 0,
        lx: 0, // mouse position at click
        ly: 0,
        draggingObj: null // to prevent multiple drag events
    }

    objects = []; 

    // dev purposes
    dev_toggleDir = true;

    constructor({ctx, c, width, height, helperCont}){
        this.c = c;
        this.ctx = ctx;

        // TODO: Validation
        this.width = width;
        this.height = height;

        c.width = width;
        c.height = height;
        c.setAttribute("tabindex", -1); // For keydown events

        this.helperCont = helperCont || null;
    }

    get dim(){
        return [this.width, this.height];
    }

    getBoundingObjects(x, y){
        const res = [[], []];
        this.objects.forEach(e => res[e.isInBound(x,y) ? 0 : 1].push(e));
        // console.log(res[0]);
        return res;
    }

    get mousePos(){
        return [this.state.mx, this.state.my];
    }

    init(){
        // Event listeners

        this.c.addEventListener("mouseover", (e) => {
            this.state.mOver = true;
            [this.state.mx, this.state.my] = Util.getCursorPos(this.c, e);

            // loop through each object at the mouse
        })

        this.c.addEventListener("mousemove", (e) => {
            this.state.dragging = this.state.mDown;
            [this.state.mx, this.state.my] = Util.getCursorPos(this.c, e);

            const [bounds, unbounds] = this.getBoundingObjects(...this.mousePos);
            
            unbounds.forEach(obj => {
                obj.getEvents("MOVE").forEach(ev => {
                    ev.fn.bind(obj)(e, this, "MOVE_UNBOUND");
                })
            })
            bounds.reverse().forEach((obj, i) => {
                obj.getEvents("MOVE").forEach(ev => {
                    ev.fn.bind(obj)(e, this, "MOVE_BOUND");
                })
            })
        })

        this.c.addEventListener("mousedown", (e) => {
            let offsetDrag = 0, offsetSelect = 0;
            this.state.mDown = true;
            [this.state.mx, this.state.my] = Util.getCursorPos(this.c, e);
            [this.state.lx, this.state.ly] = [this.state.mx, this.state.my];
            // console.log("DOWN");

            const [bounds, unbounds] = this.getBoundingObjects(...this.mousePos);

            if(bounds.length == 0){
                this.state.draggingObj = null;
                this.selected = null;
            }
            unbounds.forEach(obj => {
                obj.getEvents("CLICK").forEach(ev => {
                    ev.fn.bind(obj)(e, this, "CLICK_UNBOUND");
                })
            })
            // Prioritize Nodes over degrees
            bounds.sort((a,b) => Degree.NodeOverDeg(a, b)).reverse().forEach((obj, i) => {
                if(obj.isDraggable && i == offsetDrag) this.state.draggingObj = obj;
                if(obj.isSelectable && i == offsetSelect) this.selected = obj;
                if(!obj.isSelectable) offsetSelect++;
                if(!obj.isDraggable) offsetDrag++;
                obj.z = i;
                obj.getEvents("CLICK").forEach(ev => {
                    ev.fn.bind(obj)(e, this, "CLICK_BOUND");
                })
                
            })

            if(bounds.length == 0){
                this.onNullSelect();
                if(this.helperCont) this.helperCont.dataset.nullSelect = true;
            } else {
                if(this.helperCont) this.helperCont.dataset.nullSelect = false;
            }

        })

        this.c.addEventListener("mouseup", (e) => {
            this.state.mDown = false;
            this.state.dragging = false;
            this.state.draggingObj = null;
            // console.log("UP");

            const [bounds, unbounds] = this.getBoundingObjects(...this.mousePos);
            unbounds.forEach(obj => {
                obj.getEvents("RELEASE").forEach(ev => {
                    ev.fn.bind(obj)(e, this, "RELEASE_UNBOUND");
                })
            })
            bounds.forEach(obj => {
                obj.getEvents("RELEASE").forEach(ev => {
                    ev.fn.bind(obj)(e, this, "RELEASE_BOUND");
                })
            })
        })

        this.c.addEventListener("mouseout", (e) => {
            this.state.mOver = false;
            this.state.dragging = false;
            this.state.draggingObj = null;
            // console.log("OUT");

            const [bounds, unbounds] = this.getBoundingObjects(...this.mousePos);
            
            unbounds.forEach(obj => {
                obj.getEvents("RELEASE").forEach(ev => {
                    ev.fn.bind(obj)(e, this, "RELEASE_UNBOUND");
                })
            })
            bounds.forEach(obj => {
                obj.getEvents("RELEASE").forEach(ev => {
                    ev.fn.bind(obj)(e, this, "RELEASE_BOUND");
                })
            })
        })

        this.c.addEventListener("keydown", (e) => {
            // console.log(e.keyCode);

            // loop through all objects, run all key events
            this.objects.forEach(obj => {
                obj.getEvents("KEY").forEach(ev => {
                    ev.fn.bind(obj)(e, this, "KEY");
                });
            })
        })

        // DOUBLE CLICK TO CREATE NEW NODE
        this.c.addEventListener("dblclick", (e) => {
            // Check first if there's nothing in the position
            if(this.selected != null) return;

            const n = new Node({
                text: Util.gen_id(),
                handler: this
            })

            this.add(n);

            n.addEvents(...Node.DEF_EVENTS);
            n.pos = this.mousePos;
        })

        // TODO: Change Resolution on resize
        window.addEventListener("resize", (e) => {
            this.width = this.c.clientWidth;
            this.height = this.c.clientHeight;
        })

        this.render();
    }

    get selected(){
        return this.objects.find(e => e.isSelected);
    }

    set selected(obj){
        this.objects.forEach(e => e.isSelected = false);
        if(obj) obj.isSelected = true;
    }

    render(){
        
        requestAnimationFrame(()=>this.render());
        this.ctx.clearRect(0, 0, ...this.dim);
        // draw degrees first then nodes
        // TODO: Draw Order based on Z index || CANCEL
        this.objects.forEach(obj => (obj instanceof Degree) && obj.draw());
        this.objects.forEach(obj => (obj instanceof Node) && obj.draw());
    }

    add(...objs){
        // add objects here
        objs.forEach(e => {
            this.objects.push(e);
            e.h = this;
            e.ctx = this.ctx;
            
            // Initialization events    
            e.evs.filter(ev => ev.type.includes("INIT")).forEach(ev => {
                ev.fn.bind(e)(null, this, "INIT");
            })

            // Helpers
            if(this.dev_showText && e instanceof Node){
                e.addDrawCallbacks({
                    id: "DEV_SHOWTEXT",
                    fn: function(){
                        // console.log(this);
                        this.ctx.font = "12px Nirmala Ui";
                        this.ctx.textAlign = "center";
                        this.ctx.fillText(this.text, this.x, this.y + this.cv_radius*2);
                    }
                })
            }
        })
    }

    remove(...objs){
        objs.forEach(obj => {
            const index = this.objects.findIndex(e => e.id == obj.id);
            if(index == -1) {
                console.log(`Object :${obj.id} not found`);
                return;
            }
            this.objects.splice(index, 1);
        })
    }

    get(id){
        return this.objects.find(e => e.id == id);
    }

    clear(){
        // Delete all nodes in this handler
        const temp = h.objects.filter(e => e instanceof Node);
        temp.forEach(obj => obj.delete());
        // And Delete other things
        DataBind.clear();
    }

    load(data){
        // Add the nodes first
        data.forEach(obj => {
            const n = new Node({
                text: obj.text,
                handler: h,
                id: obj.id
            })

            this.add(n);

            n.addEvents(...Node.DEF_EVENTS);
            n.pos = obj.pos;
        })

        console.log(data);

        const matches = [];

        // Create connections/degrees and other details here
        data.forEach(obj => {
            const node = this.get(obj.id);
            if(node == null) return;

            obj.connections.forEach(cn => {

                if(matches.includes(`${cn[0]}:${obj.id}`)) return;
                matches.push(`${obj.id}:${cn[0]}`);

                const deg = node.real.connect(h.get(cn[0]), cn[1]);

                if(!deg) return;

                console.log(`${obj.text}:${cn[2]}`);

                deg.real.isMultiDirected = cn[4];
                if(cn[3]) deg.real.reverse();
            })

            
            // TODO: Add Other Details Here
            if(obj.misc.isStart) node.isStart = true;
            if(obj.misc.isEnd) node.isEnd = true;
        })
    }

    onNullSelect(){
        if(!this.helperCont) return;


        // Render Tools
        if(this.mode == "canvas"){
            this.helperCont.innerHTML = `
            <input id="tool-load" class="custom-file-input" type="file"></input>
            <label for="tool-load" class="btn btn-success mb-1">Load Data</label>
            <button id="tool-save" class="btn btn-success"> Store Data </button>
            <hr class="mt-1 mb-1">
            <div id="tool-showTextCont" class="toggle">
                <label for="tool-showText"> Show Text </label>
                <input id="tool-showText" type="checkbox"></input>
            </div>
            <div id="tool-toggleDirCont" class="toggle mt-1">
                <label for="tool-toggleDir"> All Multi Direction </label>
                <input id="tool-toggleDir" type="checkbox"></input>
            </div>
            <hr class="mt-1 mb-1">
            <button id="tool-reset" class="btn btn-danger mb-1"> Reset </button>
            <button id="tool-clear" class="btn btn-danger"> Clear </button>
            `;

            const tool_load = document.querySelector("#tool-load"),
                  tool_save = document.querySelector("#tool-save"),
                  tool_showText = document.querySelector("#tool-showText"),
                  tool_toggleDir = document.querySelector("#tool-toggleDir"),
                  tool_reset = document.querySelector("#tool-reset"),
                  tool_clear = document.querySelector("#tool-clear");

            // Load Node Configuration
            tool_load.addEventListener("change", async function(){
                let data = this.files.length == 0 ? null : 
                             await this.files[0].text();

                if(data == null) return;
                data = JSON.parse(data);
                
                // Delete all objects in this handler
                h.clear();
                h.lastLoadedData = data;

                // Load Data
                h.load(data);
            })

            // Store Node Configuration
            tool_save.addEventListener("click", function(){
                const data = JSON.stringify(h.objects.map(ob => {
                    if(ob.constructor.name.includes("Degree")) return null;

                    return {
                        type: ob.constructor.name,
                        id: ob.id,
                        text: ob.text,
                        pos: ob.pos,
                        misc: {
                            isStart: ob.isStart,
                            isEnd: ob.isEnd
                        },
                        connections: [...ob.real.degrees.map(deg => {
                            const other = deg.getOtherSide(ob);
                            // id, value, text(node), dir, multi
                            return [
                                other.id, 
                                deg.value, 
                                other.text, 
                                deg.dir, 
                                deg.isMultiDirected
                            ];
                        })]
                    }
                }).filter(e => e != null))

                Util.saveAsFile(data, "json");
            })

            // Show Text
            if(this.dev_showText){
                tool_showText.checked = true;
                tool_showText.parentElement.dataset.value = true;
            }
            tool_showText.addEventListener("change", function(){
                this.parentElement.dataset.value = this.checked;
                h.dev_showAllText(this.checked);
            })

            // Toggle Multi Direction
            if(this.dev_toggleDir){
                tool_toggleDir.checked = true;
                tool_toggleDir.parentElement.dataset.value = true;
            }
            tool_toggleDir.addEventListener("change", function(){
                this.parentElement.dataset.value = this.checked;
                h.dev_toggleMultiDirection();
            })

            // Reset
            tool_reset.addEventListener("click", function(){
                if(h.lastLoadedData == undefined) alert("Load a file first!");
                h.clear();
                h.load(h.lastLoadedData);
            })

            // Clear
            tool_clear.addEventListener("click", function(){
                h.clear();
            })
        }
    }

    // Dev Purposes
    dev_listEvent(type){
        this.objects.forEach(obj => {
            const evs = obj.evs.filter(ev => {
                return ev.type.includes(type);
            })

            // console.log(obj);

            if(evs.length != 0){
                console.group(obj);
                evs.forEach(e => console.log(e));
                console.groupEnd();
            }
        })
    }

    dev_genRandomNodes(num){
        for(let i = 0; i < num; i++){
            const n = new Node({
                text: ""
            })

            this.add(n);
            n.text = n.id;

            n.addEvents(...Node.DEF_EVENTS);
            n.pos = [Math.random() * this.width, Math.random() * this.height];
        }
    }

    dev_showAllText(state = true){
        this.dev_showText = state;

        if(!state) {
            this.objects.forEach(obj => {
                if (obj instanceof Degree) return;
                obj.removeDrawCallbacks("DEV_SHOWTEXT");
            });
            return;
        }

        this.objects.forEach(obj => {
            if(obj instanceof Degree) return;

            obj.addDrawCallbacks({
                id: "DEV_SHOWTEXT",
                fn: function(){
                    // console.log(this);
                    this.ctx.font = "12px Nirmala Ui";
                    this.ctx.textAlign = "center";
                    this.ctx.fillText(this.text, this.x, this.y + this.cv_radius*2);
                }
            })
        })
    }

    dev_toggleMultiDirection(){
        this.objects.forEach(obj => {
            if(obj instanceof Node) return;
            obj.isMultiDirected = !(this.dev_toggleDir);
        })
        this.dev_toggleDir = !(this.dev_toggleDir);
    }
}

class CVObject{
    // abstract class, should be extended

    h; // handler
    ctx;
    x = 0;
    y = 0;
    z = 0;
    isDraggable = true;
    isSelectable = true;
    isSelected = false;

    evs = [];
    
    drawCbs = [];

    constructor({handler}){
        this.h = handler;
    }

    get pos(){
        return [this.x, this.y];
    }

    set pos([x, y]){
        this.x = isNaN(x) ? this.x : x;
        this.y = isNaN(y) ? this.y : y;
    }

    drawRotated(angle, ox, oy, fn, isRadian = false){
        this.ctx.translate(ox, oy);
        this.ctx.rotate((isRadian ? angle : Util.deg2Rad(angle)));
        fn.bind(this)();
        this.ctx.rotate(-(isRadian ? angle : Util.deg2Rad(angle)));
        this.ctx.translate(-ox, -oy);
    }

    addDrawCallbacks({id, fn}){
        if(this.drawCbs.some(e => e.id == id)) return;
        this.drawCbs.push({
            id: id || Util.gen_id(),
            fn: fn
        })
    }

    removeDrawCallbacks(id){
        const index = this.drawCbs.findIndex(e => e.id == id);
        if(index == -1){
            // console.log(`Removing: ${id} failed`);
            return;
        }
        this.drawCbs.splice(index, 1);
    }

    // abstract draw method
    draw(){
        // This method should be overriden
        this.drawCbs.forEach(e => {
            e.fn.bind(this)();
        })
    }

    // abstract 
    isInBound(x, y){
        // This method should be overriden
    }

    addEvents(...evs){
        evs.forEach(e => {
            this.addEvent(e);
        })
    }

    getEvents(type){
        return this.evs.filter(ev => {
            return ev.type.includes(type);
        })
    }

    addEvent({id, fn, type}){
        if(this.evs.includes(e => e.id == id)) return;
        this.evs.push({
            id: id || Util.gen_id(),
            fn: fn,
            type: type
        })
    }

    removeEvent(id){
        const index = this.evs.findIndex(e => e.id == id);
        if(index == -1) return;
        this.evs.splice(index, 1);
    }
}