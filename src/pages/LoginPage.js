import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./LoginPage.css";

const LoginPage = () => {
    const { user, login, signup } = useAuth();
    const navigate = useNavigate();
    const [mode, setMode] = useState("login"); // login or signup
    const [form, setForm] = useState({ username: "", email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // If the auth state changes (e.g. login completes) navigate accordingly.
    React.useEffect(() => {
        if (!user) return;
        const isOwner = user?.is_shop_owner || (user?.role && user.role.toLowerCase() === 'owner');
        const target = isOwner ? "/dashboard" : "/";
        console.debug('[LoginPage] user changed, navigating to', target, 'user:', user);
        navigate(target, { replace: true });
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        let result;
        if (mode === "login") {
            result = await login(form.username.trim(), form.password);
        } else {
            result = await signup(form.username.trim(), form.email.trim(), form.password);
        }

        setLoading(false);
        console.debug("Login result:", result);
        if (result.success) {
            const ownerEnvUser = process.env.REACT_APP_OWNER_USERNAME;
            const ownerEnvPass = process.env.REACT_APP_OWNER_PASSWORD;
            const usedDefaultAdmin = ownerEnvUser && ownerEnvPass && form.username.trim() === ownerEnvUser && form.password === ownerEnvPass;

            const redirectTo = result.redirect || (result.user?.role === "owner" ? "/dashboard" : "/");
            if (usedDefaultAdmin) {
                navigate("/dashboard", { replace: true });
            } else {
                navigate(redirectTo, { replace: true });
            }
        } else {
            setError(result.message || "Login failed");
        }
    };

    const toggleMode = () => {
        setMode(mode === "login" ? "signup" : "login");
        setForm({ username: "", email: "", password: "" });
        setError("");
    };

    return (
        <div className="login-page">
            <div className="login-bg-shapes">
                <div className="shape shape-1" />
                <div className="shape shape-2" />
                <div className="shape shape-3" />
            </div>

            <div className="login-card animate-scale-in">
                <div className="login-header">
                    <span className="login-logo">👗</span>
                    <h1 className="login-title">StyleHub</h1>
                    <p className="login-subtitle">
                        {mode === "login"
                            ? "Welcome back! Sign in to continue."
                            : "Create your account to start shopping."}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label>Username {mode === "login" && "or Email"}</label>
                        <input
                            type="text"
                            placeholder={mode === "login" ? "Enter username or email" : "Choose a username"}
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            required
                        />
                    </div>

                    {mode === "signup" && (
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="Enter password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                        />
                    </div>

                    {error && (
                        <div className="login-error" style={{ whiteSpace: 'pre-line' }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <button className="login-submit" type="submit" disabled={loading}>
                        {loading ? (
                            <span className="spinner" />
                        ) : (
                            mode === "login" ? "Sign In" : "Create Account"
                        )}
                    </button>
                </form>

                <div className="role-toggle-link">
                    <button type="button" onClick={toggleMode}>
                        {mode === "login"
                            ? <>Don't have an account? <span>Sign Up here →</span></>
                            : <>Already have an account? <span>Sign In here →</span></>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
