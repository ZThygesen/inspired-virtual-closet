import axios from 'axios';

const api = axios.create({
    withCredentials: true
});

api.interceptors.request.use(
    config => {
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    response => {
        return response;
    },
    error => {
        if (error?.response?.data?.message === 'user is disabled') {
            sessionStorage.setItem('disabled', true);
            window.location.href = '/';
            return new Promise(() => {});
        }
        return Promise.reject(error);
    }
)

export default api;