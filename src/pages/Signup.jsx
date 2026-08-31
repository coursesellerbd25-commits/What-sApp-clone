import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
            setError("");

      await api.post("/api/auth/signup", {
        email,
        password
      });

      navigate("/chat");
    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Signup failed"
      );
    } finally {
      setLoading(false);
          }
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSignup}>
        <h1>Create Account</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          required
                  />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          required
        />

        {error && <p>{error}</p>}

        <button disabled={loading}>
          {loading
                      ? "Creating..."
            : "Sign Up"}
        </button>
      </form>
    </div>
  );
}