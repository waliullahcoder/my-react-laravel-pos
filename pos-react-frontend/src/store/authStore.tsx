import { action, makeObservable, observable } from "mobx";
import { IRootStore } from "./rootStore";

export default class AuthStore {
    BASE_URL = process.env.REACT_APP_API_URL + '/auth';
    isAuthenticated: boolean = false;
    isSuperAdminAuthenticated: boolean = false;
    token: string | null = null;
    is_superadmin: string | null = null;
    rootStore: IRootStore;

    constructor(rootStore: IRootStore) {
        makeObservable(this, {
            isAuthenticated: observable,
            isSuperAdminAuthenticated: observable,
            token: observable,
            is_superadmin: observable,
            setIsAuthenticated: action,
            setIsSuperAdminAuthenticated: action,
            setToken: action,
            setIsSuperAdmin: action,
            login: action,
            logout: action,
        });

        this.rootStore = rootStore;

        // Initialize token and authentication state
        this.setToken(localStorage.getItem('_token'));
        this.isAuthenticated = !!this.token;

        // Initialize superadmin state
        const storedIsSuperAdmin = localStorage.getItem('is_superadmin');
        this.setIsSuperAdmin(storedIsSuperAdmin);
        this.isSuperAdminAuthenticated = storedIsSuperAdmin === '1';
    }

    setIsAuthenticated = (value: boolean) => {
        this.isAuthenticated = value;
        if (!value) this.setToken(null);
    };

    setToken = (value: string | null) => {
        if (value) {
            localStorage.setItem("_token", value);
        } else {
            localStorage.removeItem("_token");
        }
        this.token = value;
    };

    setIsSuperAdminAuthenticated = (value: boolean) => {
        this.isSuperAdminAuthenticated = value;
        if (!value) this.setIsSuperAdmin('0');
    };

    setIsSuperAdmin = (value: string | null) => {
        if (value) {
            localStorage.setItem("is_superadmin", value);
        } else {
            localStorage.removeItem("is_superadmin");
        }
        this.is_superadmin = value;
    };

    login = async (postData: any) => {
        try {
            const response = await fetch(this.BASE_URL + '/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postData),
            });

            const data = await response.json();
            if (data.error) {
                this.rootStore.handleError(response.status, data.message, data);
                return Promise.reject(data);
            } else {
                this.setIsAuthenticated(true);
                this.setToken(data.access_token);

                // Set superadmin state
                const isSuperAdmin = data.is_superadmin === 1 || data.is_superadmin === '1';
                this.setIsSuperAdminAuthenticated(isSuperAdmin);
                this.setIsSuperAdmin(isSuperAdmin ? '1' : '0');

                return Promise.resolve(data);
            }
        } catch (error: any) {
            this.rootStore.handleError(419, "Something went wrong", error);
            return Promise.reject(error);
        }
    };

    logout = async () => {
        try {
            const response = await fetch(this.BASE_URL + '/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            if (data.error) {
                this.rootStore.handleError(response.status, data.message, data);
                return Promise.reject(data);
            } else {
                this.setIsAuthenticated(false);
                this.setIsSuperAdminAuthenticated(false);
                this.setIsSuperAdmin(null);
                return Promise.resolve(data);
            }
        } catch (error: any) {
            this.rootStore.handleError(419, "Something went wrong", error);
            return Promise.reject(error);
        }
    };
}
