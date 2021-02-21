import { NextApiRequest, NextApiResponse } from "next";
import { RouteHandler } from "../interfaces/Router";
import Cache from './cache';

const cachedRouteHandler = (key: string, handler: RouteHandler, ttl?: number) => async (req: NextApiRequest, res: NextApiResponse) => {
    let data: any;
    if(Cache.has(key)){
        data = Cache.get(key);
    }else{
        data = await handler(req, res);
        Cache.set(key, data, ttl);
    }
    res.json(data);
}

export default cachedRouteHandler;