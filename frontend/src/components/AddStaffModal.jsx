import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { toast } from "react-hot-toast";

const AddStaffModal = ({ onClose, onStaffAdded, staffToEdit = null }) => {
  const isEditMode = Boolean(staffToEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [availablePackages, setAvailablePackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [selectedPackageIds, setSelectedPackageIds] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    email: "",
    phone: "",
    area: "",
    role: "SUB_DEALER",
  });

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserRole(payload.role);
      }
    } catch (e) {
      console.error("Failed to parse token:", e);
    }
  }, []);

  useEffect(() => {
    api
      .get("/packages/available")
      .then((res) => {
        if (res.data?.success) {
          setAvailablePackages(res.data.data || []);
        } else {
          setAvailablePackages([]);
        }
      })
      .catch((err) => {
        console.error("Failed to load package options:", err);
        setAvailablePackages([]);
      })
      .finally(() => setLoadingPackages(false));
  }, []);

  const getAvailableRoles = () => {
    if (userRole === "SUPER_ADMIN") return ["FRANCHISE", "DEALER", "SUB_DEALER"];
    if (userRole === "FRANCHISE") return ["DEALER", "SUB_DEALER"];
    if (userRole === "DEALER") return ["SUB_DEALER"];
    return [];
  };

  const availableRoles = useMemo(() => getAvailableRoles(), [userRole]);

  useEffect(() => {
    if (isEditMode && staffToEdit) {
      setFormData({
        name: staffToEdit.name || "",
        username: staffToEdit.username || "",
        password: "",
        email: staffToEdit.email || "",
        phone: staffToEdit.phone || "",
        area: staffToEdit.area || "",
        role: staffToEdit.role || "SUB_DEALER",
      });
    }
  }, [isEditMode, staffToEdit]);

  useEffect(() => {
    if (!isEditMode) {
      if (availableRoles.length > 0 && !availableRoles.includes(formData.role)) {
        setFormData((prev) => ({ ...prev, role: availableRoles[0] }));
      }
      return;
    }

    if (!staffToEdit) return;

    const availableIds = new Set(availablePackages.map((pkg) => pkg.id));
    const currentPackageIds = Array.isArray(staffToEdit.packageIds)
      ? staffToEdit.packageIds
      : [];

    setSelectedPackageIds(
      currentPackageIds.filter((packageId) => availableIds.has(packageId))
    );
  }, [availablePackages, availableRoles, formData.role, isEditMode, staffToEdit]);

  const availablePackageIds = useMemo(
    () => new Set(availablePackages.map((pkg) => pkg.id)),
    [availablePackages]
  );

  const unavailableAssignedPackages = useMemo(() => {
    if (!isEditMode || !staffToEdit?.packageAssignments) return [];

    return staffToEdit.packageAssignments.filter(
      (assignment) => !availablePackageIds.has(assignment.packageId)
    );
  }, [availablePackageIds, isEditMode, staffToEdit]);

  const sortedPackages = useMemo(() => {
    return [...availablePackages].sort((a, b) => {
      const aSpeed = parseInt(a.name, 10);
      const bSpeed = parseInt(b.name, 10);

      if (!Number.isNaN(aSpeed) && !Number.isNaN(bSpeed)) {
        return aSpeed - bSpeed;
      }

      return (a.displayName || a.name || "").localeCompare(
        b.displayName || b.name || ""
      );
    });
  }, [availablePackages]);

  const togglePackageSelection = (packageId) => {
    setSelectedPackageIds((prev) =>
      prev.includes(packageId)
        ? prev.filter((id) => id !== packageId)
        : [...prev, packageId]
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (isEditMode && staffToEdit) {
        const res = await api.put(`/staff/${staffToEdit.id}/packages`, {
          packageIds: selectedPackageIds.map(Number),
        });

        if (res.data?.success) {
          toast.success("Staff packages updated successfully");
          onStaffAdded && onStaffAdded(res.data.staff);
          onClose();
        } else {
          setError(res.data?.error || "Failed to update staff packages");
        }

        return;
      }

      const res = await api.post("/staff", {
        ...formData,
        packageIds: selectedPackageIds.map(Number),
      });

      if (res.data?.success) {
        toast.success("Staff member created successfully");
        onStaffAdded && onStaffAdded(res.data.staff);
        onClose();
      } else {
        setError(res.data?.error || "Failed to create staff");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || "Server error");
    } finally {
      setSaving(false);
    }
  };

  const canCreateStaff = availableRoles.length > 0;
  const showCreateWarning = !isEditMode && userRole && availableRoles.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 text-white rounded-lg w-full max-w-3xl p-6 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {isEditMode ? "Edit Staff Packages" : "Add New Staff"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            ×
          </button>
        </div>

        {error && <div className="mb-3 text-sm text-red-400">{error}</div>}

        {showCreateWarning && (
          <div className="mb-3 text-sm text-yellow-500">
            Your role ({userRole.replace("_", " ")}) is not permitted to create
            new staff members.
          </div>
        )}

        {isEditMode && staffToEdit && (
          <div className="mb-4 rounded border border-gray-700 bg-gray-800/70 p-3 text-sm text-gray-300">
            Updating package access for <span className="text-white">{staffToEdit.name}</span>{" "}
            ({staffToEdit.username}) as {staffToEdit.role.replace("_", " ")}.
          </div>
        )}

        {isEditMode && unavailableAssignedPackages.length > 0 && (
          <div className="mb-4 rounded border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
            Some existing assignments are hidden or no longer grantable and will
            be removed if you save:
            <div className="mt-2 flex flex-wrap gap-2">
              {unavailableAssignedPackages.map((assignment) => (
                <span
                  key={assignment.packageId}
                  className="rounded-full border border-amber-500/30 px-2 py-1 text-xs"
                >
                  {assignment.package?.displayName || assignment.package?.name || `#${assignment.packageId}`}
                </span>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <input
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            className="col-span-2 p-2 rounded bg-gray-800"
            required
            disabled={isEditMode || !canCreateStaff}
          />
          <input
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            className="col-span-2 p-2 rounded bg-gray-800"
            required
            disabled={isEditMode || !canCreateStaff}
          />

          {!isEditMode && (
            <input
              name="password"
              placeholder="Password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="col-span-2 p-2 rounded bg-gray-800"
              required
              disabled={!canCreateStaff}
            />
          )}

          <input
            name="email"
            placeholder="Email (Optional)"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="col-span-2 p-2 rounded bg-gray-800"
            disabled={isEditMode || !canCreateStaff}
          />
          <input
            name="phone"
            placeholder="Phone (Optional)"
            value={formData.phone}
            onChange={handleChange}
            className="col-span-2 p-2 rounded bg-gray-800"
            disabled={isEditMode || !canCreateStaff}
          />
          <input
            name="area"
            placeholder="Area (Optional)"
            value={formData.area}
            onChange={handleChange}
            className="col-span-2 p-2 rounded bg-gray-800"
            disabled={isEditMode || !canCreateStaff}
          />

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="col-span-2 p-2 rounded bg-gray-800"
            required
            disabled={isEditMode || !canCreateStaff}
          >
            <option value="" disabled>
              Select Role
            </option>
            {availableRoles.map((role) => (
              <option key={role} value={role}>
                {role.replace("_", " ")}
              </option>
            ))}
          </select>

          <div className="col-span-2 rounded border border-gray-700 bg-gray-800/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">
                  Package Access
                </div>
                <div className="text-xs text-gray-400">
                  {isEditMode
                    ? "Choose which sellable packages this staff member may grant."
                    : "Choose which sellable packages this new staff member may grant."}
                </div>
              </div>
              <div className="text-xs text-gray-400">
                {selectedPackageIds.length} selected
              </div>
            </div>

            {loadingPackages ? (
              <div className="text-sm text-gray-400">Loading packages...</div>
            ) : sortedPackages.length === 0 ? (
              <div className="text-sm text-gray-400">
                No packages are available to assign right now.
              </div>
            ) : (
              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {sortedPackages.map((pkg) => {
                  const checked = selectedPackageIds.includes(pkg.id);
                  return (
                    <label
                      key={pkg.id}
                      className={`flex items-start gap-3 rounded border px-3 py-2 transition ${
                        checked
                          ? "border-teal-500/50 bg-teal-500/10"
                          : "border-gray-700 bg-gray-900/40 hover:border-gray-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={checked}
                        onChange={() => togglePackageSelection(pkg.id)}
                      />
                      <div className="min-w-0">
                        <div className="text-sm text-white">
                          {pkg.displayName || pkg.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {pkg.name}
                          {pkg.regularPrice != null ? ` • PKR ${pkg.regularPrice}` : ""}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="col-span-2 flex justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-teal-600"
              disabled={saving || (!isEditMode && !canCreateStaff)}
            >
              {saving
                ? "Saving..."
                : isEditMode
                ? "Save Package Access"
                : "Create Staff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStaffModal;
