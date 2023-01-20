// Path Finding Algo

const PathFindingList = [];

class PathFinding{
    // Manages DOM and other stuff

    static pathFind(...args){
        // This should be overriden
        console.log("BASE");
    }

    static onSelect(){
        // Must be overriden
    }
}

class Djikstra extends PathFinding{

    static {
        PathFindingList.push(this);
    }

    static pathFind(...args){
        // Will add other features
        const [network] = args;

        for(const [start, ends, nodes] of network){
            console.log(start);
            const visited = [];
            const record = []; // result [Vertex, From Start, Prev]

            // break;

            // TODO: Feature to consider non-multi direction

            // Initialize Record First
            nodes.forEach(node => {
                record.push([
                    node,
                    node.id == start.id ? 0 : Infinity,
                    null
                ])
                node.isMultiDirected = false;
            })

            console.log(record);

            let count = 0;

            while(true){
                count++;

                // Find the record with smallest Distance from start
                const nearest = record
                    .filter(r => !(visited.some(v => v.id == r[0].id)))
                    .reduce((acc, curr) => {
                        if(curr[1] < acc[0]) return [curr[1], curr[0]];
                        else return acc;
                    }, [Infinity, null]);

                console.log(nearest[1].text);

                // Register Degrees to Record
                nearest[1].degrees.forEach(deg => {
                    const other = deg.getOtherSide(nearest[1]);

                    // If connected node is already visited, ignore
                    if(visited.some(n => n.id == other.id)) return;

                    const index = record.findIndex(r => r[0].id == other.id);

                    const distFrom = nearest[0] + deg.value;

                    if(distFrom < record[index][1]){
                        record[index][1] = nearest[0] + deg.value;
                        record[index][2] = nearest[1];

                        
                        // Set Direction
                        deg.isMultiDirected = false;
                        deg.setAsStart(other);
                    }
                })

                visited.push(nearest[1]);

                // Check if all record nodes are visited
                if(visited.length == nodes.length) break;

                // Or if iteration is equal to nodes length
                if(count == nodes.length) break;
            }

            return record;
        }
    }

    static onSelect(dom, handler){
        // Check Only If there are start nodes
        this.isAble = true;
        dom.querySelector("#start-pathfind").disabled = false;
        dom.querySelector("#algo-validation").innerHTML = "";

        // console.log("TEST");

        if(handler.objects.some(e => e.isStart)) return;

        dom.querySelector("#algo-validation").innerHTML = `<span> Need Start Node </span>`
        dom.querySelector("#start-pathfind").disabled = true;
        this.isAble = false;
    }

    static log(data){
        const cont = document.getElementById("path-logs");

        const table = document.createElement("table");

        table.innerHTML = `
        <thead>
            <tr>
                <th>Vertex</th>
                <th>Distance from start</th>
                <th>Previous Node</th>
            </tr>
        </thead>
        <tbody>

        </tbody>
        `;

        console.log(data);

        data.forEach(r => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
            <td>${r[0].text}</td>
            <td>${r[1]}</td>
            <td>${r[2] == null ? "" : r[2].text}</td>
            `;

            table.children[1].append(tr);
        })

        cont.innerHTML = "";
        cont.append(table);
        sorttable.makeSortable(table);
    }
}

class AStar extends PathFinding{

    static {
        PathFindingList.push(this);
    }

    static pathFind(...args){
        // console.log("A*");
    }

    static onSelect(dom, handler){
        // Check  If there are start and end nodes
        this.isAble = true;
        dom.querySelector("#start-pathfind").disabled = false;
        dom.querySelector("#algo-validation").innerHTML = "";

        const hasStart = handler.objects.some(e => e.isStart);
        this.hasEnd = false;

        // Find the connected end node
        if(hasStart){
            
            const start = handler.objects.find(obj => obj.isStart);

            Util.visitAndApply(start, function(){
                if(AStar.hasEnd) return;
                if(this.real.isEnd) AStar.hasEnd = true;
            })
        }

        if(hasStart && this.hasEnd) return;

        
        dom.querySelector("#algo-validation").innerHTML = `
        ${hasStart ? "" : "<span> Need Start Node </span>"}
        ${hasEnd ? "" : "<span> Need End Node </span>"}
        `
        dom.querySelector("#start-pathfind").disabled = true;
        this.isAble = false;
    }
}