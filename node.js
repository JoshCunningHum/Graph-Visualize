class Degree extends CVObject{

    // For sorting
    static NodeOverDeg(a, b){
        const ac = a instanceof Node, bc = b instanceof Node;
        return ac == bc ? 0 : ac == true ? 1 : -1;
    }
    
    static PROXY_EXCEPTIONS = [
        "real",
        "helper"
    ]

    // Global Degree Setting
    static cv_width = 3; // pixel
    static cv_incolor = "#7E7E7E"; // inner
    static cv_outcolor = "#aaa"; // outer 
    static cv_dircolor = "white";

    static sh_direction = new Path2D();
    
    static {
        this.sh_direction.moveTo(0, -this.cv_width * 2);
        this.sh_direction.lineTo(this.cv_width*2, 0);
        this.sh_direction.lineTo(0, this.cv_width*2);
    }

    // Degree Interactions
    static hk = {
        DELETE: 46, // delete_key
        INC: 107, // + key
        DEC: 109, // - key
    }

    static DEF_EVENTS = [
        {fn: DegreeEvents.GLOW_SELECT, type: ["CLICK", "SELECT"]},
        {fn: DegreeEvents.SHOW_LENGTH, type: ["INIT"]},
        {fn: DegreeEvents.POINTER_CURSOR, type: ["MOVE", "HOVER"]},

        // Interactions
        {fn: DegreeEvents.SELECT_HOTKEYS, type: ["KEY"]},

        // Dev Purposes
        {fn: DevEvents.REF_SELECTED, type: ["CLICK", "SELECT"]},
    ]

    id = "";
    value = 0;
    isMultiDirected = true;
    dir = 0; // node[0] -> node[1] 
    nodes = [];

    constructor({id, handler, isProxy}){
        super({handler})
        this.isDraggable = false;
        this.id = id || Util.gen_id();

        // Stylings
        this.cv_width = Degree.cv_width; // pixel
        this.cv_incolor = Degree.cv_incolor; // inner
        this.cv_outcolor = Degree.cv_outcolor; // outer 
        this.cv_dircolor = Degree.cv_dircolor;

        if(!isProxy && handler.helperCont != null){
            return new DegreeProxy({
                handler: handler,
                real: this
            })
        }
    }

    set_nodes(nodeA, nodeB){
        this.nodes = [nodeA, nodeB];
    }

    reverse(){
        this.dir = this.dir ? 0 : 1;
    }

    get start(){
        return this.nodes[this.dir];
    }

    get end(){
        return this.nodes[(this.dir - 1) * -1];
    }

    setAsStart(node){
        if(this.start.id == node.id) return;
        else if(this.end.id != node.id) throw new Error("Node not found");
        this.reverse();
    }

    delete(){
        this.nodes.forEach(e => e.disconnect(this.id));
        this.h.remove(this);
    }

    // returns 1 if node is start, 0 if end, null if not found
    get_relative_dir(node){
        if(this.start.id == node.id) return 1;
        else if(this.end.id == node.id) return 0;
        
        console.error(`Passed node: ${node.id} does not have this degree: ${this.id}`);
        return null;
    }

    getOtherSide(node){
        const relDir = (node.id == this.nodes[0].id ? 1 : node.id == this.nodes[1].id ? 0 : null);
        if(relDir == null) return null;
        return this.nodes[relDir];
    }

    drawInnerLine(){
        this.ctx.beginPath();
        this.ctx.lineWidth = this.cv_width;
        this.ctx.strokeStyle = this.cv_incolor;
        this.ctx.moveTo(...this.start.pos);
        this.ctx.lineTo(...this.end.pos);
        this.ctx.stroke();
        this.ctx.closePath();
    }

    drawDirections(){
        if(this.isMultiDirected) return;
        const dir = new Path2D(Degree.sh_direction);
        const center = Util.getCenter(...this.start.pos, ...this.end.pos),
              firstHalf = Util.getCenter(...this.start.pos, ...center),
              secHalf = Util.getCenter(...center, ...this.end.pos),
              angle = Util.getAngleFromCoord(...this.start.pos, ...this.end.pos);

        this.ctx.strokeStyle = this.cv_dircolor;

        // First Arrow
        this.drawRotated( angle + (this.dir ? Math.PI*2 : 0), ...firstHalf, () => {
            this.ctx.stroke(dir);
        }, true)


        // Second Arrow
        this.drawRotated( angle + (this.dir ? Math.PI*2 : 0), ...secHalf, () => {
            this.ctx.stroke(dir);
        }, true)
    }

    // Implemented abstract methods
    draw(){
        // TODO: Multiple Degrees at the same nodes
        this.drawInnerLine();
        super.draw();
        this.drawDirections();
    }

    isInBound(x, y){
        const res = false, w = this.cv_width;

        // check first if x or y is out of bounds
        if(!Util.inBetween(x, this.start.pos[0] + w, this.end.pos[0] - w) ||
           !Util.inBetween(y, this.start.pos[1] + w, this.end.pos[1] - w)){
            // if(h.state.mDown) console.log("OUT_OF_BOUNDS");
            return res;
        }

        // get slope intercept
        const slopeInter = Util.slopeIntercept(...this.start.pos, ...this.end.pos);

        // Special cases (For Vertical Lines)
        if(slopeInter.m > 100 || slopeInter.m < -100) return true;

        const evalY = Util.slopeInterceptEval(slopeInter, x);
        // if(h.state.mDown) console.log(slopeInter);

        // check if evalY is within bounds
        return Util.withinMarginError(y, w * 4, evalY);
    }

}

class Node extends CVObject{
    // Node Global Settings
    static cv_radius = 20;
    static cv_gap = 3;
    static cv_incolor = "white";
    static cv_outcolor = "darkgray";

    static sh_connect_icon = new Path2D();
    static sh_connect_icon_size = 6;
    static sh_connect_icon_color = "teal";

    // Menu Interactions
    static isFindingMode = false;
    static lookingNode = null;

    static hk = {
        CONNECT: 67, // c
        DELETE: 46, // delete_key
    }

    static PROXY_EXCEPTIONS = [
        "real",
        "helper"
    ]

    static {
        this.sh_connect_icon.moveTo(0, -this.sh_connect_icon_size);
        this.sh_connect_icon.lineTo(0, this.sh_connect_icon_size);
        this.sh_connect_icon.moveTo(-this.sh_connect_icon_size, 0);
        this.sh_connect_icon.lineTo(this.sh_connect_icon_size, 0);
    }

    getMenuPos(type){
        switch(type){
            case "connect":
                return [this.x + this.cv_radius/1.5, this.y - this.cv_radius/1.5];
        }
    }

    delete(){
        this.degrees.forEach(deg => {
            // delete the degree first on the other end of the degree
            deg.getOtherSide(this).disconnect(deg.id);
            // set the nodes of the degrees to null just in case
            deg.set_nodes(null, null);
            // remove the degree on the animation handler
            this.h.remove(deg);
        });
        this.degrees.length = 0;
        
        this.h.remove(this);
    }

    static DEF_EVENTS = [
        {fn: NodeEvents.DRAG_POS_CLICK, type: ["CLICK"]},
        {fn: NodeEvents.DRAG_POS, type: ["MOVE", "DRAG"]},
        {fn: NodeEvents.POINTER_CURSOR_RELEASE, type: ["RELEASE"]},
        {fn: NodeEvents.POINTER_CURSOR, type: ["MOVE", "HOVER"]},
        {fn: NodeEvents.SHOW_DESC, type: ["MOVE", "HOVER"]},
        {fn: NodeEvents.SELECT_STYLING, type: ["CLICK", "SELECT"]},

        // Node Interactions
        {fn: NodeEvents.SHOW_CONNECT, type: ["MOVE", "HOVER"]},
        {fn: NodeEvents.OPEN_CONNECT, type: ["CLICK", "HOVER"]},
        {fn: NodeEvents.FIND_CONNECT, type: ["MOVE", "HOVER"]},
        {fn: NodeEvents.FINALIZE_CONNECT, type: ["CLICK", "HOVER"]},
        {fn: NodeEvents.SELECT_HOTKEYS, type: ["KEY"]},

        // Dev Purposes
        {fn: DevEvents.REF_SELECTED, type: ["CLICK", "SELECT"]}
    ];

    id = "";
    text = "";
    degrees = [];
    isStart = false;
    isEnd = false;

    constructor({id, handler, text = "", isProxy}){
        super({handler, isProxy})
        this.id = id || Util.gen_id();
        this.text = text;

        // Stylings
        
        this.cv_radius = Node.cv_radius;
        this.cv_incolor = Node.cv_incolor;
        this.cv_outcolor = Node.cv_outcolor;
        this.cv_gap = Node.cv_gap;

        // Menu Interactions
        this.isFinding = false;

        if(!isProxy && handler.helperCont != null){
            return new NodeProxy({
                handler: handler,
                real: this
            })
        }
    }

    // return degree(s) to the node
    getTo(oN){
        // console.log(oN);
        return this.degrees.filter(d => {
            return (d.isMultiDirected || d.get_relative_dir(this)) 
            && d.end.id == oN.id;
        })
    }

    connect(node, value = 0){
        // TODO: Support multi degree on same nodes
        // For now, check if degree to the node already exist
        if(node.id == this.id || this.getTo(node).length > 0) return;

        const deg = new Degree({
            handler: this.h
        });
        deg.addEvents(...Degree.DEF_EVENTS);
        deg.set_nodes(this.proxy || this, node);

        this.degrees.push(deg);
        node.degrees.push(deg);
        this.h.add(deg);
        deg.value = value;

        return deg;
    }

    get_degree(id){ // ID to another node
        return this.degrees.find(e => e.getOtherSide(this).id == id);
    }

    getNearestNode(exceptions = [], directionStrict = false){
        // TODO: Feature to consider non-multi direction

        // Find smallest valued degree
        const smallest = this.degrees.reduce((acc, curr) => {
            if(exceptions.includes(curr.id)) acc = acc;
            else if(curr.value < acc.value) acc = curr;
        }, this.degrees[0]);

        return smallest.getOtherSide(this);
    }

    disconnect(id){
        // You don't really use this to disconnect, you use the delete method in the degree class
        this.degrees.splice(this.degrees.findIndex(e => e.id == id), 1);
    }

    drawCircle(){
        this.ctx.beginPath();
        this.ctx.fillStyle = this.cv_outcolor;
        this.ctx.arc(...this.pos, this.cv_radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.fillStyle = this.cv_incolor;
        this.ctx.arc(...this.pos, this.cv_radius - this.cv_gap, 0, Math.PI * 2);
        this.ctx.fill();
    }

    setToFindMode(){
        // Set to finding other nodes
        this.isFinding = true;
        Node.isFindingMode = true;
        Node.lookingNode = this;

        // Add Degree Animation
        this.addDrawCallbacks({
            id: "FINDING_DECO",
            fn: () => {
                this.ctx.beginPath();
                this.ctx.strokeStyle = this.cv_incolor;
                this.ctx.moveTo(...this.pos);
                this.ctx.lineTo(...h.mousePos);
                this.ctx.stroke();
            }
        })
    }

    // Implemented abstract methods
    draw(){
        this.drawCircle();
        super.draw();
    }

    isInBound(x, y){
        const dist = Util.distSquare(...this.pos, x, y);
        return Util.inBetween(dist, 0, this.cv_radius**2);
    }
}