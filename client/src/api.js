import axios from 'axios';

const api = axios.create({
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
    }
});

api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('jwtToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

export default api;