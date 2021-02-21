import { BaseService } from './baseService';

import pancakeswapService from './pancakeswapService'

export class PairsService extends BaseService {
    baseUrl = "/pairs";

    get = async () => {
        return await pancakeswapService.getPairs();
    }
}

export default new PairsService();