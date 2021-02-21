import { NextApiRequest, NextApiResponse } from 'next';

import HTTPMethod from './HttpMethod';

export type RouteHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<any>

export type RouterMethods = {
    [x in HTTPMethod]?: RouteHandler;
}