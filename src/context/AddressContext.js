import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";
import { useAuth } from "./AuthContext";

const AddressContext = createContext();

export const AddressProvider = ({ children }) => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const fetchAddresses = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await api.get("/api/store/saved-addresses/");
            setAddresses(res.data);
        } catch (err) {
            console.error("[Address] fetch error:", err.response?.data || err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, [user]);

    const addAddress = async (addressData) => {
        try {
            const res = await api.post("/api/store/saved-addresses/", addressData);
            setAddresses(prev => [res.data, ...prev]);
            return res.data;
        } catch (err) {
            console.error("[Address] add error:", err.response?.data || err.message);
            throw err;
        }
    };

    const deleteAddress = async (id) => {
        try {
            await api.delete(`/api/store/saved-addresses/${id}/`);
            setAddresses(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            console.error("[Address] delete error:", err.response?.data || err.message);
            throw err;
        }
    };

    const updateAddress = async (id, addressData) => {
        try {
            const res = await api.patch(`/api/store/saved-addresses/${id}/`, addressData);
            setAddresses(prev => prev.map(a => a.id === id ? res.data : a));
            return res.data;
        } catch (err) {
            console.error("[Address] update error:", err.response?.data || err.message);
            throw err;
        }
    };

    return (
        <AddressContext.Provider value={{ addresses, loading, fetchAddresses, addAddress, deleteAddress, updateAddress }}>
            {children}
        </AddressContext.Provider>
    );
};

export const useAddress = () => useContext(AddressContext);
