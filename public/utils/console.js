
export const log = new Proxy({
    hidden: [],
    list: {},
    all: false,
}, {
    get: (obj, props) => {
        if (props === "get") {
            setTimeout(() => {
                console.warn(Object.keys(obj.list)); 
                return Object.keys(obj.list);
            }, 100);
        }
        if (obj.hidden.includes(props) || obj.all) {
            return () => false;
        }
        obj.list[props] = "";
        return (...args) => {
            console.log(`[${props}] =>`, ...args); 
            return true;
        };
    },
    set: (obj, props, value) => {
        if (props === "hidden") { 
            obj.hidden.push(...value);
        }
        if (props === "all") { 
            obj.all = value; 
        }
        return true;
    }
});