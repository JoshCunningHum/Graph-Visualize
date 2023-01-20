
/* 
    Why? A design fail in my part
    I don't want to scan through the whole code and put custom setters and getters to facilitate data bindings on DOM Objects, so I just decided to make this
*/
class BaseProxy{
    static INTERCEPT_ATTEMPT_LOG = false;
    static BUILT_EXCEPTIONS = [
        "interceptions",
        "helper",
        "proxy",
        "real"
    ]

    static DEF_INTERCEPTORS = [
        {
            // Delete all databinds to free memory
            key: "delete",
            fn: function(val){
                this.helper.hide();
                console.log(this.helper.delete());
            }
        }
    ]

    static onSelect(){
        // Must be overriden
    }

}

class DegreeProxy extends Degree{
    real = null;
    interceptions = [];

    constructor({handler, real}){
        super({handler, isProxy: true});

        this.real = real || new Degree({handler: handler, isProxy: true});

        Util.initProxy.bind(this)([
            ...Degree.PROXY_EXCEPTIONS,
            ...BaseProxy.BUILT_EXCEPTIONS
        ]);

        this.helper = new DegreeHelper({
            dom: handler.helperCont,
            obj: this
        })
    }
}

class NodeProxy extends Node{
    real = null;
    interceptions = [];

    constructor({handler, real}){
        super({handler, isProxy: true});

        this.real = real || new Node({handler: handler, isProxy: true});

        Util.initProxy.bind(this)([
            ...Node.PROXY_EXCEPTIONS,
            ...BaseProxy.BUILT_EXCEPTIONS
        ]);

        this.helper = new NodeHelper({
            dom: handler.helperCont,
            obj: this
        })
    }
}