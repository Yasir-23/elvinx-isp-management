import React, { useEffect, useState } from "react";
import api from "../services/api";   // ✅ use axios instance

const DbTest = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await api.get("/dbusers");  // baseURL + token auto attached

        if (res.data.success) {
          setUsers(res.data.users);
        }
      } catch (err) {
        console.error("Error fetching DB users:", err);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  if (loading) return <p>Loading DB users...</p>;

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2>DB Users (Test)</h2>
      <table border="1" cellPadding="6" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Photo</th>
            <th>Username</th>
            <th>Phone</th>
            <th>Package</th>
            <th>Seller</th>
            <th>Balance</th>
            <th>Service</th>
            <th>On/Off</th>
            <th>Expiry</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.photoUrl}</td>
                <td>{u.username}</td>
                <td>{u.mobile}</td>
                <td>{u.package}</td>
                <td>{u.salesperson}</td>
                <td>{u.balance}</td>
                <td>{u.connection}</td>
                <td>{u.online ? "Online" : "Offline"}</td>
                <td>{u.expiryDate}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="10">No users found in DB.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DbTest;
