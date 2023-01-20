class Util {
    static gen_id(){
        return Math.random().toString(36).substring(2,12);
    }

    static slope(ox, oy, tx, ty){
        return (ty - oy)/(tx - ox);
    }

    static slopeIntercept(ox, oy, tx, ty){
        const slope = Util.slope(ox, oy, tx, ty);
        const b = oy - slope * ox;
        return {
            b: b,
            m: slope
        }
    }

    static slopeInterceptEval({b, m}, x){
        return m * x + b;
    }

    static inBetween(val, a, b){
        const min = Math.min(a, b), max = Math.max(a, b);
        return val >= min && val <= max;
    }

    static withinMarginError(val, err, base){
        return Util.inBetween(val, base-err, base+err);
    }

    static distSquare(ox, oy, tx, ty){
        return (tx - ox)**2 + (ty - oy)**2;
    }

    static getCursorPos(c, e){
        const rect = c.getBoundingClientRect();
        return [e.clientX - rect.left, e.clientY - rect.top];
    }

    static getCenter(ox, oy, fx, fy){
        return [ox + (fx - ox) / 2, oy + (fy - oy) / 2];
    }

    static deg2Rad(deg){
        return deg * Math.PI / 180;
    }

    static rad2Deg(rad){
        return rad * 180 / Math.PI;
    }

    static posMod(pos, fn){
        return pos.map(e => {
            return fn(e);
        })
    }

    // return rotation in radians
    static getAngleFromCoord(ox, oy, tx, ty){
        return Math.atan2(ty - oy, tx - ox);
    }

    static initProxy(exceptions){
        const realClass = Object.getPrototypeOf(this.real),
              baseClass = Object.getPrototypeOf(realClass);

        // Add Reference of proxy to real
        this.real.proxy = this;

        // Set all Obj (change) -> (apply) Dom

        // Loop through the entries and create setters and getters
        for (const [key, ignore] of Object.entries(this.real)){
            if(exceptions.includes(key)) continue;
            Object.defineProperty(this, key, {
                get(){
                    return this.real[key];
                },
                set(val){
                    // Obj -> Dom
                    this.intercept(key, val);
                    this.real[key] = val;
                }
            })
        }

        // Loop through methods
        for(const fn of getMethods(this.real)){
            let isGetOrSet = false;

            const hasGetter = isGetter(realClass, fn) || isGetter(baseClass, fn);
            const hasSetter = isSetter(realClass, fn) || isSetter(baseClass, fn);

            // For Getter Only
            if(hasGetter){
                isGetOrSet = true;
                Object.defineProperty(this, fn, {
                    get(){
                        return this.real[fn];
                    },
                    configurable: true
                })
            }

            // For Setters
            if(hasSetter){
                isGetOrSet = true;
                Object.defineProperty(this, fn, {
                    set(val){
                        // Obj -> Dom
                        this.intercept(fn, val);
                        this.real[fn] = val;
                    },
                    configurable: true
                })
            }

            if(isGetOrSet) continue;


            this[fn] = function(...args){
                // TODO: Might add an intercepter here
                this.intercept(fn, args);
                return this.real[fn](...args);
            }
        }

        // Add Functions
        // Obj -> Dom
        Object.defineProperty(this, `intercept`, {
            value: (key, val) => {
                const i = this.interceptions?.some(e => e.key == key);
                if(!i) BaseProxy.INTERCEPT_ATTEMPT_LOG && console.error(`${this.constructor.name}.${key} intercept attempt`);
                else{
                    // Call all databind that has key as target
                    this.interceptions?.forEach(int => {
                        if(int.key != key) return;
                        int.fn.bind(this.helper.get(int.id) || this)(val);
                    })
                }
            }
        })

        Object.defineProperty(this, "addInterceptor", {
            value: ({key, fn, id}) => {
                this.removeInterceptor(key); // Remove if existing
                this.interceptions.push({ // Add to Overwrites
                    key: key,
                    fn: fn,
                    id: id || Util.gen_id()
                })
            }
        })

        Object.defineProperty(this, "removeInterceptor", {
            value: (id) => {
                const index = this.interceptions.findIndex(e => e.id == id);
                if(index == -1) return;
                this.interceptions.splice(index, 1);
            }
        })

        // Add default Interceptions
        BaseProxy.DEF_INTERCEPTORS.forEach(int => {
            this.addInterceptor(int);
        })
    }

    static visited = [];

    static visitAndApply(node, fn, isStart = true){
        if(isStart) Util.visited = [node.id];
        fn.bind(node)();
        node.degrees.forEach(deg => {
            const oN = deg.getOtherSide(node);
            if(Util.visited.includes(oN.id)) return;
            Util.visited.push(oN.id);
            Util.visitAndApply(oN, fn, false)
        })
    }

    static network = [];

    static getNetwork(node, isStart = true){
        if(isStart) Util.network = [node];

        node.degrees.forEach(deg => {
            const oN = deg.getOtherSide(node);
            if(Util.network.some(n => n.id == oN.id)) return;

            Util.network.push(oN);
            Util.getNetwork(oN, false);
        })
    }

    static saveAsFile(data, format){
        const pom = document.createElement("a");
        pom.setAttribute("href", `data:text/plain;charset=utf-8,${encodeURIComponent(data)}`);
        pom.setAttribute("download", `GTP-${Date.now()}.${format}`);

        if(document.createEvent){
            const ev = document.createEvent("MouseEvent");
            ev.initEvent('click', true, true);
            pom.dispatchEvent(ev);
        }else{
            pom.click();
        }
    }
}

class DegreeEvents {
    static SHOW_LENGTH(e, h, name){
        this.addDrawCallbacks({
            id: "SHOW_LENGTH_DESC",
            fn: () => {
                const target = Util.getCenter(...this.start.pos, ...this.end.pos);
                this.ctx.beginPath();
                this.ctx.fillStyle = "#333";
                this.ctx.arc(...target, 12, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.fillStyle = "white";
                this.ctx.font = "12px Nirmala Ui";
                this.ctx.textAlign = "center";
                this.ctx.textBaseline = "middle";
                this.ctx.fillText(this.value, ...target);
            }
        })
    }

    static POINTER_CURSOR(e, h, name){
        // console.log(name);
        h.c.style.cursor = name == "MOVE_BOUND" ? "pointer" : "default";
    }

    static GLOW_SELECT(e, h, name){
        this.addDrawCallbacks({
            id: "SHOW_GLOW_WHEN_SELECTED",
            fn: () => {
                if(!this.isSelected) return;
                this.ctx.beginPath();
                this.ctx.lineWidth = this.cv_width * 2;
                this.ctx.strokeStyle = this.cv_outcolor;
                this.ctx.moveTo(...this.start.pos);
                this.ctx.lineTo(...this.end.pos);
                this.ctx.stroke();
                this.ctx.closePath();
                
                this.drawInnerLine();
        
                // White outline on circle
                const target = Util.getCenter(...this.start.pos, ...this.end.pos);
                this.ctx.beginPath();
                this.ctx.fillStyle = this.cv_outcolor;
                this.ctx.arc(...target, 14, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                // Then call show length
                this.drawCbs.find(e => e.id == "SHOW_LENGTH_DESC")?.fn.bind(this)();
            }
        })
        
        // Helper
        if(!h.helperCont) return;
        if(name == "CLICK_BOUND" && h.selected.id == this.id){
            this.helper.show();
        }else if(name == "CLICK_UNBOUND"){
            this.helper.hide();
        }
    }

    // Degree Interactions
    static SELECT_HOTKEYS(e, h, name){
        if(h.selected?.id != this.id) return;

        switch(e.keyCode){
            case Degree.hk.INC:
                this.value++;
                break;
            case Degree.hk.DEC:
                this.value--;
                break;
            case Degree.hk.DELETE:
                this.delete();
                break;
            default:
                console.log(e.keyCode);
        }
    }

}

class NodeEvents {
    static POINTER_CURSOR_RELEASE(e, h, name){
        h.c.style.cursor = name == "RELEASE_BOUND" ? "pointer" : "default";
    }

    static POINTER_CURSOR(e, h, name){
        // console.log(name);
        h.c.style.cursor = name == "MOVE_BOUND" ? (h.state.dragging ? "grabbing" : "pointer") : "default";
    }

    static DRAG_POS_CLICK(e, h, name){
        if( name == "CLICK_UNBOUND" || h.state.draggingObj.id != this.id) return;
        [this.ox, this.oy] = this.pos;
    }

    static DRAG_POS(e, h, name){
        if(!h.state.dragging || !h.state.draggingObj || h.state.draggingObj.id != this.id) return; // if not dragging then forget it
        const [dx, dy] = [h.state.mx - h.state.lx, h.state.my - h.state.ly];
        this.pos = [this.ox + dx, this.oy + dy];
    }

    static SHOW_DESC(e, h, name){
        if(name == "MOVE_BOUND" && 
        ((h.state.dragging && h.state.draggingObj?.id == this.id) || 
        (!h.state.dragging)
        ) && (this.z == 0)) {
            this.addDrawCallbacks({
                id: "SHOW_DESC_EVENT",
                fn: () => {
                    this.ctx.font = "12px Nirmala Ui";
                    this.ctx.textAlign = "center";
                    this.ctx.fillText(this.text, this.x, this.y + this.cv_radius*2);
                }
            })
        }else{
            this.removeDrawCallbacks("SHOW_DESC_EVENT");
        }
    }

    static SELECT_STYLING(e, h, name){
        this.addDrawCallbacks({
            id: "SELECT_STYLINGS",
            fn: () => {
                // Repeated code :(
                if(!this.isSelected) return;
                this.ctx.font = "12px Nirmala Ui";
                this.ctx.textAlign = "center";
                this.ctx.fillText(this.text, this.x, this.y + this.cv_radius*2);
                // Glow
            }
        })

        // Helper
        if(!h.helperCont) return;
        if(name == "CLICK_BOUND" && h.selected.id == this.id){
            this.helper.show();
        }else if(name == "CLICK_UNBOUND"){
            this.helper.hide();
        }
    }

    // Node Interactions
    static SHOW_CONNECT(e, h, name){
        // Handle Hovering
        if(name == "MOVE_BOUND"){
            this.addDrawCallbacks({
                id: "SHOW_CONNECT",
                fn: () => {
                    this.ctx.strokeStyle = Node.sh_connect_icon_color;
                    this.ctx.translate(...this.getMenuPos("connect"));
                    this.ctx.stroke(Node.sh_connect_icon);
                    this.ctx.translate(...Util.posMod(
                        this.getMenuPos("connect"), (e) => {
                        return -e;
                    }))
                }
            })
        }else{
            this.removeDrawCallbacks("SHOW_CONNECT");
        }
    }

    static OPEN_CONNECT(e, h, name){
        // Handle Click Event
        if(Node.isFindingMode) return;

        const menu = this.getMenuPos("connect"), 
              err = Node.sh_connect_icon_size * 1.5;

        if(
            Util.withinMarginError(h.state.mx, err, menu[0]) &&
            Util.withinMarginError(h.state.my, err, menu[1])
        ){
            this.setToFindMode();
        }
    }

    static FIND_CONNECT(e, h, name){
        // Handle Interaction to other node when hovering
        if(name != "MOVE_BOUND") return;

        // TODO: Handle snaps
    }

    // IMPORTANT: Should be fired first
    static FINALIZE_CONNECT(e, h, name){
        // Handle evaluating click while finding
        
        if(!Node.isFindingMode || Node.lookingNode.id == h.selected?.id ||
           !(this instanceof Node) ||
           (h.selected != null && name == "CLICK_UNBOUND")) return;

        if(h.selected != null) {
            // console.log(h.selected);
            Node.lookingNode.connect(h.selected);
        }

        // If clicked on nothing (CANCEL FINDING MODE)
        Node.isFindingMode = false;
        Node.lookingNode.removeDrawCallbacks("FINDING_DECO");
        Node.lookingNode.isFinding = false;
        Node.lookingNode = null;
    }

    static SELECT_HOTKEYS(e, h, name){
        if(h.selected?.id != this.id) return;

        switch(e.keyCode){
            case Node.hk.CONNECT:
                this.setToFindMode();
                break;
            case Node.hk.DELETE:
                this.delete();
                break;
            default:
                console.log(e.keyCode);
        }
    }
}

class DevEvents{
    static devObj = null;

    static REF_SELECTED(e, h, name){
        if(this.isSelected) DevEvents.devObj = this;
    }
}

// Straight from stack overflow hehe
const isGetter = (x, name) => (Object.getOwnPropertyDescriptor(x, name) || {}).get != undefined
const isSetter = (x, name) => (Object.getOwnPropertyDescriptor(x, name) || {}).set != undefined
const isFunction = (x, name) => typeof x[name] === "function";
const deepFunctions = (x) =>
  x && x !== Object.prototype &&
  Object.getOwnPropertyNames(x)
    .filter(name => isGetter(x, name) || isFunction(x, name))
    .concat(deepFunctions(Object.getPrototypeOf(x), true) || []);
const distinctDeepFunctions = x => Array.from(new Set(deepFunctions(x)));
const getMethods = (obj) => distinctDeepFunctions(obj).filter(
    name => name !== "constructor" && !~name.indexOf("__"));