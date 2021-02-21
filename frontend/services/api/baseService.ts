import axios from 'axios';

const api = axios.create({
    baseURL: '/api'
});

export class BaseService {
    baseUrl: string = "/";
    api = api;

    async get(subUrl?: string) {
        let url = this.baseUrl;
        if(subUrl) url = `${url}/${subUrl}`;
        const response = await this.api.get(url);
        return response.data;
    }
}