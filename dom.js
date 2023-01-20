// All (MOST) Event Listeners
const DOM = {
    algo_onChange: ()=>{
        const select = document.getElementById("algo-type");
        // console.log("A*");
        PathFindingList[select.selectedIndex].onSelect(select.parentElement, h);
    },
    algo_pathFind: (pathFindingIndex)=>{
        const networks = [];

        for(const startNode of h.objects.filter(node => {
            return (node instanceof Node) && node.isStart;
        })){
            Util.getNetwork(startNode);
            networks.push([startNode, null, [...Util.network]]);
        }

        const algo = PathFindingList[pathFindingIndex];

        algo.log(algo.pathFind(networks));
    }
}

// Change Modes
document.getElementById("mode_select").addEventListener("change", function(){
    const tabs = document.getElementById("path-tab-cont").children;

    tabs[this.selectedIndex].classList.add("selected");
    tabs[(this.selectedIndex - 1) * -1].classList.remove("selected");

    // h is a global variable representing the handler
    h.mode = (this.selectedIndex == 0) ? "canvas" : "table";
})

// Load Pathfinding
document.addEventListener("DOMContentLoaded", function(){
    const select_algo = document.getElementById("algo-type");

    PathFindingList.forEach((pf, i) => {
        const option = document.createElement("option");
        option.text = pf.name;
        option.value = i;

        select_algo.add(option);
    })

    select_algo.addEventListener("change", DOM.algo_onChange)

})

// Start Pathfinding
document.getElementById("start-pathfind").addEventListener("click", function(){
    const select = document.getElementById("algo-type");
    DOM.algo_pathFind(select.selectedIndex);
})