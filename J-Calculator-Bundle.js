// Mathematical Functions 

function degToRad(deg){
    return (Math.PI/180)*deg;
}

function radToDeg(rad){
    return rad/(Math.PI/180);
}

// Programming Functions

    function parser(array, float=true){
        for(let i in array){
            if(float){
                array[i] = parseFloat(array[i]);
            }else{
                array[i] = parseInt(array[i]);
            }
        }
        return array;
    }

    function creator(param){
        param = param.split(',');
        /* 
        0 = Element Tag ( Mandatory )
        1 = Element Class
        2 = Element ID
        3 = Element Attribute (Seperated by " " and Assigned by '=' )
        4 = Datasets (Seperated by ":" and Assigned by '=' | Only the name needed)
        */
        let element = document.createElement(param[0]);
        if(param[1]) element.classList.add(...param[1].split(' '));
        if(param[2]) element.id = param[2];
        if(param[3]){
            let attr = param[3].split(' ');
            for(let i of attr){
                let [method, value] = i.split('=');
                if(value.split('%s%').length > 1){
                    value = value.split('%s%').join(' ');
                }
                element.setAttribute(method,value);
            }
        }
        if(param[4]){
            let dataset = param[4].split(':');
            for(let i of dataset){
                let [name, dValue] = i.split('=');
                element.dataset[name] = dValue;
            }
        }
        return element;
    }

    function creatorNS(param){
        // This creator is used for SVG Elements
        let svgNS = 'http://www.w3.org/2000/svg';
        param = param.split(',');
        // console.log(param);
        /* 
        0 = Element Tag ( Mandatory )
        1 = Element Class
        2 = Element ID
        3 = Element Attribute (Seperated by " " and Assigned by '=' )
        4 = Datasets ( Seperated by " " and Assigned by "=" | Only the name needed)
        */
        let element = document.createElementNS(svgNS, param[0]);
        param[1] && element.classList.add(...param[1].split(' '));
        param[2] && element.setAttributeNS(null,'id',param[2]);
        if(param[3]){
            let attr = param[3].split('|');
            for(let i of attr){
                let [method, value] = i.split('=');
                element.setAttributeNS(null,method, value);
            }
        }
        if(param[4]){
            let dataset = param[4].split('.');
            for(let i of dataset){
                let [name, dValue] = i.split('=');
                element.dataset[name] = dValue;
            }
        }

        return element;
    }
    
    // For finding the coordinates

    function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
        var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
      
        return {
          x: centerX + (radius * Math.cos(angleInRadians)),
          y: centerY + (radius * Math.sin(angleInRadians))
        };
      }
    
    function cartesianToPolar(center, coord){ // For Canvas
        let processed = [-(center[0]-coord[0]), center[1]-coord[1]]
        let angle = Math.atan2(processed[1],processed[0]);
        return radToDeg(angle);
    }
    // For creating curves
    
    function describeArc(x, y, radius, startAngle, endAngle){
      
          var start = polarToCartesian(x, y, radius, endAngle);
          var end = polarToCartesian(x, y, radius, startAngle);
      
          var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
      
          var d = [
              "M", start.x, start.y, 
              "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
          ].join(" ");
      
          return d;       
    }
    
    // For doing round off between integers

    function stepRound(n, step){
        let excess = n % step;
        if(excess == 0){
            return n;
        }
        let check = Math.round(excess/step);

        if(check == 0){
            return n-excess;
        }else{
            return n+(step-excess);
        }
    }

    // For Prettifying

    function comafy(num,addons = ",",decimals){
        num = parser([num])[0];
        if(decimals != false){
            num = num.toFixed(decimals);
        }
        var str = num.toString().split('.');
        if(str[0].length >= 4){
            str[0] = str[0].replace(/(\d)(?=(\d{3})+$)/g, '$1,');
        }
        if(str[1] && str[1].length >= 4){
            str[1] = str[1].replace(/(\d{3})/g,'$1');
        }
        str = str.join('.');
        let [prefix = "",suffix = ""] = addons.split(',');
        str = prefix + str + suffix;
        return str;
    }

    // For Validiation of Values - Avoids Null

    function checker(array, min, max){
        for(let i of array){
            if(i == false){
                return false;
            }else if(i == true){
                continue;
            }
            if(isNaN(i)){
                return false;
            }
            if(i == undefined){
                return false;
            }
            if(i == null){
                return false;
            }
            if(i == ""){
                return false;
            }
            if(min){
                if(i < min){
                    return false;
                }
            }
            if(max){
                if(i > max){
                    return false;
                }
            }
        }
        return true;
    }

    // For creating arrays of numbers from one number to another
    // 0 = exlude starting and include endpoint
    // 1 = include starting point and exlude endpoint
    // 2 = exlude both starting and endpoint
    // 3 = include starting and endpoint 

    function range(start,end,step=1,mode=0){
        let diff = end - start;

        switch(mode){
            case 0:
                start ++;
                break;
            case 1:
                break;
            case 2:
                start++;
                diff--;
                break;
            case 3:
                diff++;
        }

        let array = [];

        for(let i = start; i < (start + diff); i += step){
            // console.log(i);
            array.push(i);
        }

        return array;
    }

    // returns the sum from an array

    function totalize(array){
        let total = 0;
        for(let i of array){
            total += i;
        }
        return total;
    }

    // Divides a number or list of numbers by 100

    function percentify(args, modify=0){
        if(typeof(args) == 'number'){
            return (args/100) + modify;
        }
        for(let i in args){
            args[i] = (args[i]/100) + modify;
        }
        return args;
    }

    // Checks if an array (specifiedArray) is found in another array (baseArray) and returns a boolean value

    // Retrieve - instead of checking, it returns an array that includes the values from specifiedArray that is found on baseArray, if no match is found then returns an empty array

    // Some - Just like default but instead, returns true if any part of the specifiedArray is found on baseArray

    function includer(baseArray, specifiedArray, retrieve=false, some=false){
        let base = new Array(...baseArray);
        let array = new Array(...specifiedArray);
        // console.log(base);
        // console.log(array);
        if(retrieve){
            let newArray = []
            for(let i of base){
                for(let j in array){
                    if(i == array[j]){
                        // console.log(i);
                        newArray.push(i);
                        array.splice(j,1);
                    }
                }
            }
            return newArray;
        }
        if(some){
            for(let i of base){
                for(let j of array){
                    if(i == j){
                        return true;
                    }
                }
            }
            return false;
        }
        let count = array.length;
        for(let i of base){
            for(let j in array){
                if(i == array[j]){
                    count--;
                    array.splice(j,1);
                }
            }
        }
        if(count == 0){
            return true;
        }else{
            return false;
        }
    }

    // Toggles the display of an element returning it back to normal if toggled twice

    // action = [toggle(default), show, hide] - force the function to either toggle,show, or hide an element

    function revealer(id , action = "toggle" ,classSpecify,   display = 'block'){
        let target;
        if(typeof(id) == "string") {
            target = document.getElementById(id);
        }else if(typeof(id) == "object"){
            target = id;
        }
        if(classSpecify){
            let classes = document.getElementsByClassName(classSpecify);
            for(let i of classes){
                i.style.display = 'none';
            }
        }
        
        switch(action){
            case "toggle": 
                if(target.style.display == display){
                    target.style.display = 'none';
                }else{
                    target.style.display = display;
                }
                break;
            case "show":
                target.style.display = display;
                break;
            case "hide":
                target.style.display = 'none';
        }
    }

    // Checks if a value is a Node

    function isNode(o){
        return (
          typeof Node === "object" ? o instanceof Node : 
          o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string"
        );
      }
       
    // Checks if a value is an HTML Element

      function isElement(o){
        return (
          typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
          o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
      );
      }

    // Modifies an element in an array
    // arr = base array
    // old_index = index of the element you want to move
    // new_index = the index that you want the element that you want to move go

    function array_move(arr, old_index, new_index) {
        if (new_index >= arr.length) {
            var k = new_index - arr.length + 1;
            while (k--) {
                arr.push(undefined);
            }
        }
        arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
        return arr;
    };

// Global Variables 

var calculator_Style = {
    classes: {
        generic : {
            margins: 'm-0,m-1,m-2,m-3,m-4,m-5,m-auto,mx-0,mx-1,mx-2,mx-3,mx-4,mx-5,mx-auto,my-0,my-1,my-2,my-3,my-4,my-5,my-auto,mt-0,mt-1,mt-2,mt-3,mt-4,mt-5,mt-auto,mb-0,mb-1,mb-2,mb-3,mb-4,mb-5,mb-auto,ml-0,ml-1,ml-2,ml-3,ml-4,ml-5,ml-auto,mr-0,mr-1,mr-2,mr-3,mr-4,mr-5,mr-auto'.split(','),
            padding: 'p-0,p-1,p-2,p-3,p-4,p-5,p-auto,px-0,px-1,px-2,px-3,px-4,px-5,px-auto,py-0,py-1,py-2,py-3,py-4,py-5,py-auto,pt-0,pt-1,pt-2,pt-3,pt-4,pt-5,pt-auto,pb-0,pb-1,pb-2,pb-3,pb-4,pb-5,pb-auto,pl-0,pl-1,pl-2,pl-3,pl-4,pl-5,pl-auto,pr-0,pr-1,pr-2,pr-3,pr-4,pr-5,pr-auto'.split(','),
            borders: 'border,border-bottom,border-top,border-left,border-right,border-111,border-222,border-333,border-444,border-555,border-666,border-777,border-888,border-999,border-teal,border-crimson,border-thick,rounded,ellipse,no-radius'.split(',')
        },
        inBuilt : {
            mtoC : document.querySelectorAll('.m-Children , .m-oChildren'),
            ptoC : document.querySelectorAll('.p-Children , .p-oChildren'),
            btoC : document.querySelectorAll('.b-Children , .b-oChildren'),
            inpt_lblBlw : document.querySelectorAll('.input-labelBelow'),
            inf : document.querySelectorAll('.information'),
            tab_changers : document.querySelectorAll('.tab_changer-select , .tab_changer-button, tab_changer-radio'),
            dvdwithlabels : document.querySelectorAll('.dvdwithlabel')
        }
    },
    spcl : {
        overflowHide : document.getElementsByClassName('overflow-extend'),
        thisWidththisHeight : document.getElementsByClassName('thisWidththisHeight'),
        thisHeightthisWidth : document.getElementsByClassName('thisHeightthisWidth')
    }
}

// Handles the Custom Classes

function J_calUpdate(){
    // spcl
    // overflowHide 
    for(let i of calculator_Style.spcl.overflowHide){
        let lim = 0;
        if(i.dataset.base){
            lim = document.getElementById(i.dataset.base).clientHeight;
        }else if(i.dataset.hvalue){
            lim = i.dataset.hvalue;
        }else{
            lim = 100;
        }
        let btn = i.querySelector('.OEBtn');
        if(lim > i.clientHeight){
            btn.style.display = 'none';
            btn.dataset.state = 'show';
        }
        if(!btn.dataset.state){
            btn.dataset.state = "hide";
        }
        if(btn.dataset.state == 'show'){
            if(i.clientHeight <= lim){
                i.style.maxHeight = 'max-content';
            }
            btn.dataset.state = 'hide';
            btn.style.position = 'relative';
            if(btn.dataset.hideText) {
                btn.innerHTML = btn.dataset.hideText;
            }else{
                btn.innerHTML = "HIDE";
            }
        }else{
            if(i.clientHeight > lim){
                i.style.maxHeight = lim + 'px';
            }
            btn.dataset.state = 'show';
            btn.style.position = 'absolute';
            if(btn.dataset.showText) {
                btn.innerHTML = btn.dataset.showText;
            }else{
                btn.innerHTML = "SHOW";
            }
        }
        btn.onclick = function(){
            J_calUpdate();
        }
    }

}

// One Time Element Changes

    // MPB Styles to Children Classes

    for(let i of calculator_Style.classes.inBuilt.mtoC){
        let children = i.children;
        let classList = i.classList;
        let styleClasses = includer(calculator_Style.classes.generic.margins,new Array(...classList), true);
        for(let i of children){
            i.classList.add(...styleClasses);
        }
        if(i.classList.contains('m-oChildren')){
            i.classList.remove(...styleClasses);
        }
    }
    for(let i of calculator_Style.classes.inBuilt.ptoC){
        let children = i.children;
        let classList = i.classList;
        let styleClasses = includer(calculator_Style.classes.generic.padding,new Array(...classList), true);
        for(let i of children){
            i.classList.add(...styleClasses);
        }
        if(i.classList.contains('p-oChildren')){
            i.classList.remove(...styleClasses);
        }
    }
    for(let i of calculator_Style.classes.inBuilt.btoC){
        let children = i.children;
        let classList = i.classList;
        
        let styleClasses = includer(calculator_Style.classes.generic.borders,new Array(...classList), true);
        
        // console.log(styleClasses);

        for(let j of children){
            j.classList.add(...styleClasses);
        }
        if(i.classList.contains('b-oChildren')){
            i.classList.remove(...styleClasses);
        }
    }
    for(let i of document.querySelectorAll('.m-Children , .m-oChildren , .p-Children , .p-oChildren , .b-Children , .b-oChildren')){
        // console.log(i);
        if(i.dataset.classPreserve){
            let classList = i.dataset.classPreserve.split(' ');
            i.classList.add(...classList);
        }
    }

    // Tab Changer

    for(let i of calculator_Style.classes.inBuilt.tab_changers){
        let target = document.getElementById(i.dataset.tabs);
        let mode = i.dataset.mode;
        let el_classList = i.classList;
        let type = '';
        for(let j of el_classList){
            if(j == 'tab_changer-select' || j == 'tab_changer-button' || j == 'tab_changer-radio'){
                type = j;
                break;
            }
        }
        
       Array.from(target.children).forEach(el => {
           el.style.display = `none`;
       })

        let count = 0;
        let targetChildren;
        type = type.split('-')[1];
        
        switch(type){
            case 'select' :
                targetChildren = target.children[i.selectedIndex];

                    if(mode == 'byValue'){
                        targetChildren = document.getElementById(i.children[i.selectedIndex].value);
                    }
                    if(targetChildren.dataset.display){
                        targetChildren.style.display = targetChildren.dataset.display;
                    }else{
                        targetChildren.style.display = 'block';
                    }
                i.onchange = function(){
                    let target = document.getElementById(i.dataset.tabs);
                    let mode = this.dataset.mode;

                    Array.from(target.children).forEach(el => {
                        el.style.display = `none`;
                    })

                    let targetChildren = target.children[this.selectedIndex];

                    if(mode == 'byValue'){
                        targetChildren = document.getElementById(this.children[this.selectedIndex].value);
                    }
                    if(targetChildren.dataset.display){
                        targetChildren.style.display = targetChildren.dataset.display;
                    }else{
                        targetChildren.style.display = 'block';
                    }

                    if(this.dataset.temp){
                        eval(this.dataset.temp);
                    }
                };
            case "button" :
                let baseChildren = i.querySelectorAll(':scope > button');
                for(let j of baseChildren){
                    j.dataset.tabChangeIndex = count;
                    count++;
                }
                targetChildren = target.children[0];

                if(targetChildren.dataset.display){
                    targetChildren.style.display = targetChildren.dataset.display;
                }else{
                    targetChildren.style.display = "block";
                }

                for(let j of baseChildren){
                    j.addEventListener('click',function(){
                        let targetCont = document.getElementById(this.parentElement.dataset.tabs);
                        let mode = this.parentElement.dataset.mode;

                        Array.from(targetCont.children).forEach(el => {
                            el.style.display = `none`;
                        });

                        let targettedChild = targetCont.children[parseInt(this.dataset.tabChangeIndex)];

                        if(mode == "byValue"){
                            let basedID = this.value;
                            if(!basedID){
                                basedID = this.innerHTML;
                            }
                            targettedChild = targetCont.querySelector(`#${basedID}`);
                        }

                        if(targettedChild.dataset.display){
                            targettedChild.style.display = targettedChild.dataset.display;
                        }else{
                            targettedChild.style.display = 'block';
                        }

                        // Loop through other childrens first
                        for(const btn of this.parentElement.children){
                            btn.classList.remove("selected");
                        }

                        this.classList.add("selected");
    
                        if(this.dataset.temp){
                            eval(this.dataset.temp);
                        }
                    })
                }
        }

        
    }
    // Special Input Styling

    for(let i of calculator_Style.classes.inBuilt.inpt_lblBlw){
        let inp_height = i.clientHeight;
        let parent = i.parentElement;
        let newHeight = inp_height * .6;
        let labelHeight = inp_height * .4;
        let color = i.style.color;
        if(color == undefined || color == ""){
            color = 'white';
        }
        let label = new creator('div');
        label.innerHTML = i.dataset.label;
        i.style.height = newHeight + 'px';
        label.style.height = labelHeight + 'px';
        label.style.textAlign = 'center';
        label.style.width = '100%';
        label.style.color = color;
        if(i.style.backgroundColor != "" || i.style.backgroundColor != undefined){
            label.style.backgroundColor = i.style.backgroundColor;
        }
        if(i.dataset.border == "true"){
            i.style.borderBottom = 'thin solid #999';
            label.style.alignItems = 'center';
        }
        label.style.fontFamily = 'monospace';
        label.style.display = 'flex';
        label.style.justifyContent = 'center';
        parent.append(label);
    }
    for(let i of calculator_Style.classes.inBuilt.inf){
        if(i.dataset.for){
            // console.log(i);
            let target = document.getElementById(i.dataset.for);
            target.dataset.inf = i.id;
            target.onmouseover = function(){
                // console.log("JOSH");
                let info = document.getElementById(this.dataset.inf);
                info.style.maxHeight = 1000 + 'px';
            };
            target.onmouseout = function(){
                // console.log("DIMPAS");
                let info = document.getElementById(this.dataset.inf);
                info.style.maxHeight = 0;
            }
        }
    }

    // Divider with Labels

    for(let i of calculator_Style.classes.inBuilt.dvdwithlabels){
        let inner = i.innerHTML;
        i.classList.add('relative');
        i.innerHTML = "";
        let hr = new creator('hr');
        hr.style.transform = `translateY(.6rem)`;
        let span = new creator('span,absolute dvdwithlabel_span');
        span.innerHTML = inner;
        span.style.padding = '1px 5px';
        span.style.backgroundColor = i.dataset.bg;
        hr.style.border = `thin solid ${i.style.color}`;
        i.append(hr,span);
        i.style.marginBottom = '.75rem';
    }

// Event Listener Functions

function thisDimensionthisDimension(){
    for(let i of calculator_Style.spcl.thisHeightthisWidth){
        let thisHeight = i.clientHeight;
        thisHeight += parseFloat($(i).css("border-left-width")) + parseFloat($(i).css("border-right-width"));
        i.style.width = `${thisHeight}px`;
        // console.log(thisHeight);
    }
    for(let i of calculator_Style.spcl.thisWidththisHeight){
        let thisWidth = i.clientWidth;
        thisWidth += parseFloat($(i).css("border-top-width")) + parseFloat($(i).css("border-bottom-width"));
        i.style.height = `${thisWidth}px`;
    }
}

// Acts as the DOMonLoad Event Listener

J_calUpdate();