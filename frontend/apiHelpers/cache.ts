import NodeCache from 'node-cache';

class Cache {
    cache: NodeCache;
    constructor(){
        this.cache = new NodeCache();
    }

    set(key: string, data: any, ttl?: number){
        this.cache.set(key, data, ttl);
    }

    get(key: string){
        return this.cache.get(key);
    }

    has(key: string){
        return this.cache.has(key);
    }

    del(key: string){
        this.cache.del(key);
    }
}

export default new Cache();