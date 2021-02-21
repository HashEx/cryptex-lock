import { NextApiRequest, NextApiResponse } from 'next'
import HTTPMethod from '../interfaces/HttpMethod';
import { RouterMethods } from '../interfaces/Router';



class Router {
    private allowedMethods: HTTPMethod[] = [];
    private methods: RouterMethods;
    constructor(methods: RouterMethods){
        this.allowedMethods = Object.keys(methods) as HTTPMethod[];
        this.methods = methods;
    }
    handleRequest = async (req: NextApiRequest, res: NextApiResponse) => {
        const method: HTTPMethod = req.method as HTTPMethod;

        if(!this.allowedMethods.includes(method)){
            res.setHeader("Allow", this.allowedMethods);
            res.status(405).end(`Method ${method} not allowed.`);
            return;
        } else {
            const handler = this.methods[method];
            try {
                await handler(req, res);
            } catch (error) {
                console.error(error);
                res.status(500).json({error});
            }
        }
    }
}

export default Router;
