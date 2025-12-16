import React from "react";
import { useNavigate } from "react-router-dom";
import AddUserModal from "../components/AddUserModal";

const AddUserPage = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    // when modal closes, go back to previous page or to All Users
    navigate(-1); // or: navigate("/users/all");
  };

  const handleUserAdded = () => {
    // after successful add, go to All Users (or wherever you prefer)
    navigate("/users/all");
  };

  return (
    <div className="relative">
      {/* We reuse EXACT SAME AddUserModal component */}
      <AddUserModal onClose={handleClose} onUserAdded={handleUserAdded} />
    </div>
  );
};

export default AddUserPage;
