// frontend/src/pages/ProfilePage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import BandwidthGraph from "../components/BandwidthGraph";
import { toast } from "react-hot-toast";

import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Wifi,
  Lock,
  UserCircle,
  UserCog,
  Activity,
  CalendarClock,
  FileText,
  Clock,
  Gauge,
  HardDrive,
  WifiOff,
  RefreshCw,
  Pencil,
  Image,
  Trash2,
  ToggleLeft,
  ToggleRight,
  BadgeCheck,
  Package,
  Shield,
  Layers,
  Calendar,
  Cpu,
  Network,
  Server,
  Cable,
  DollarSign,
} from "lucide-react";

const ProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [selectedPhotoName, setSelectedPhotoName] = useState("");

  const [editForm, setEditForm] = useState({
    name: "",
    password: "",
    mobile: "",
    email: "",
    address: "",
    city: "",
    area: "",
    package: "",
    packagePrice: "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError("");

    api
      .get(`/profile/${id}`)
      .then((res) => {
        if (res.data?.success) {
          setProfile(res.data.profile);
          setMetrics(res.data.metrics || {});
        } else {
          setError(res.data?.error || "Failed to load profile");
        }
      })
      .catch((err) => {
        console.error("Profile fetch error:", err);
        setError(err.response?.data?.error || "Server error");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleBack = () => navigate(-1);

  if (loading) {
    return (
      <div className="p-6 text-gray-200">
        <button
          className="mb-4 px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 text-sm"
          onClick={handleBack}
        >
          ← Back
        </button>
        <div className="text-sm text-gray-400">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-gray-200">
        <button
          className="mb-4 px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 text-sm"
          onClick={handleBack}
        >
          ← Back
        </button>
        <div className="text-red-400 text-sm">Error: {error}</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 text-gray-200">
        <button
          className="mb-4 px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 text-sm"
          onClick={handleBack}
        >
          ← Back
        </button>
        <div className="text-sm text-gray-400">No profile data found.</div>
      </div>
    );
  }

  const createdAtFormatted = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString()
    : "-";

  // --- NEW STATUS LOGIC ---
  const isExpired = profile.expiryDate && new Date(profile.expiryDate) < new Date();
  
  let statusLabel = "Active";
  let statusColor = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"; // Green

  if (profile.disabled) {
    if (isExpired) {
      statusLabel = "Expired";
      statusColor = "bg-orange-500/10 text-orange-400 border border-orange-500/30"; // Orange
    } else {
      statusLabel = "Disabled";
      statusColor = "bg-red-500/10 text-red-400 border border-red-500/30"; // Red
    }
  }
  // ------------------------

  const avatarInitials =
    (profile.name || profile.username || "?")
      .split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  async function toggleNet() {
    if (!profile?.id) return toast.error("User ID missing.");

    try {
      const endpoint = profile.disabled
        ? `/users/${profile.id}/enable`
        : `/users/${profile.id}/disable`;

      const res = await api.post(endpoint);

      if (res.data?.success) {
        alert(
          `User ${profile.disabled ? "enabled" : "disabled"} successfully.`
        );

        // Refresh entire page (clean + safe)
        window.location.reload();
        return;
      }

      toast.error("Operation failed.");
    } catch (err) {
      console.error("Toggle error:", err);
      // Prevent double alert
      if (!err.response?.data?.success) {
        toast.error(err.response?.data?.error || "Server error");
      }
    }
  }

  async function deleteProfile() {
    if (!profile?.id) return toast.error("User ID missing.");

    if (
      !confirm(
        "Are you sure you want to delete this user? This cannot be undone."
      )
    )
      return;

    try {
      const res = await api.delete(`/users/${profile.id}`);

      if (res.data?.success) {
        toast.success("User deleted successfully.");
        window.location.href = "/users";
        return;
      }

      toast.error("Delete failed.");
    } catch (err) {
      console.error("Delete profile error:", err);
      toast.error(
        err.response?.data?.error || "Server error while deleting profile."
      );
    }
  }

  async function handleSaveEdit() {
    if (!profile?.id) return toast.error("Missing profile ID");

    // Convert price or make null
    const safePrice =
      editForm.packagePrice === "" || editForm.packagePrice == null
        ? null
        : Number(editForm.packagePrice);

    const payload = {
      name: editForm.name || null,
      password: editForm.password || undefined, // undefined means "do not update"
      mobile: editForm.mobile || null,
      email: editForm.email || null,
      address: editForm.address || null,
      city: editForm.city || null,
      area: editForm.area || null,
      package: editForm.package || null,
      packagePrice: safePrice,
      dataLimitGB: editForm.dataLimitGB,
    };

    let profileUpdated = false;
    try {
      const res = await api.put(`/users/${profile.id}`, payload);

      if (res.data?.success) {
        toast.success("Profile updated successfully");
        window.location.reload();
      } else {
        toast.error(res.data?.error || "Update failed");
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error(err.response?.data?.error || "Server error while updating profile");
    }
  }

  async function loadProfiles() {
    try {
      const res = await api.get("/packages", { params: { limit: 1000 } });
      if (res.data?.success) {
        setPackages(res.data.data || []);
      } else {
        setPackages([]);
      }
    } catch (err) {
      console.error("Failed to load packages:", err);
      toast.error("Unable to load package list.");
    }
  }

  const DetailRow = ({ icon, label, value, valueClass = "" }) => (
    <div className="flex justify-between items-center border-b border-gray-700 pb-2">
      <div className="flex items-center gap-2 text-gray-400">
        {icon}
        <span>{label}</span>
      </div>
      <span className={valueClass}>{value}</span>
    </div>
  );

  const sortedPackages = [...packages].sort((a, b) => {
    const aSpeed = parseInt(a.name);
    const bSpeed = parseInt(b.name);
    return aSpeed - bSpeed;
  });

  async function handleRenew() {
    if (!profile?.id) return;
    if (
      !confirm(
        "Are you sure you want to RENEW this user? This will reset data usage to 0."
      )
    )
      return;

    try {
      const res = await api.post(`/users/${profile.id}/renew`);
      if (res.data?.success) {
        toast.success("User renewed successfully!");
        window.location.reload();
      } else {
        toast.error("Renew failed: " + res.data?.error);
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error during renewal.");
    }
  }

  return (
    <div className="p-6 text-gray-100 space-y-6">
      {/* Back button */}
      <button
        className="mb-2 px-3 py-1 rounded bg-gray-900 hover:bg-gray-800 text-xs border border-gray-700"
        onClick={handleBack}
      >
        ← Back
      </button>

      {/* Top summary card */}
      <div className="bg-gradient-to-r from-sky-900/80 via-slate-900 to-slate-950 border border-sky-700/40 rounded-xl p-4 flex items-center gap-4">
        {/* Avatar */}
        <div className="relative">
          {profile.photoUrl ? (
            <img
              src={profile.photoUrl}
              alt={profile.name || profile.username}
              className="w-16 h-16 rounded-full object-cover border border-sky-500/40"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-sky-700/60 flex items-center justify-center text-xl font-semibold border border-sky-500/40">
              {avatarInitials}
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 bg-gray-900 rounded-full p-1 border border-sky-500/50">
            <UserCircle size={14} className="text-sky-300" />
          </span>
        </div>

        {/* Name & basic info */}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">
              {profile.name || profile.username}
            </h1>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}
            >
              {statusLabel}
            </span>
            {profile.online && (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <Activity size={14} /> Online
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-gray-300">
            <div className="flex items-center gap-1">
              <span>{profile.username}</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- Live Connection Stats Grid --- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {/* Status */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <Activity size={16} /> Status
          </div>
          <div
            className={
              metrics.online
                ? "text-green-400 font-semibold"
                : "text-red-400 font-semibold"
            }
          >
            {metrics.online ? "Online" : "Offline"}
          </div>
        </div>

        {/* Uptime */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <Clock size={16} /> Uptime
          </div>
          <div className="text-white">
            {metrics.online ? metrics.uptime || "-" : "-"}
          </div>
        </div>

        {/* Used Volume */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <Gauge size={16} /> Used Data
          </div>
          <div className="text-white">
            {metrics && metrics.usedVolumeGB != null
              ? `${metrics.usedVolumeGB.toFixed(2)} GB`
              : "-"}
          </div>
        </div>

        {/* Total Volume */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <HardDrive size={16} /> Total Data
          </div>
          <div className="text-white">
            {metrics.totalVolumeGB ? `${metrics.totalVolumeGB} GB` : "-"}
          </div>
        </div>

        {/* Remaining Volume */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <HardDrive size={16} /> Remaining
          </div>
          <div className="text-white">
            {metrics.remainingVolumeGB
              ? `${metrics.remainingVolumeGB} GB`
              : "-"}
          </div>
        </div>
      </div>

      {/* Main grid: personal info + Services sections */}
      <div className="grid grid-cols-1 lg:grid-cols-[30%_70%] gap-4">
        {/* Left column: Personal info (2 cols combined on large) */}
        <div className="lg:col-span-1 space-y-4">
          {/* Personal Info Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              Personal Information
            </h2>
            <div className="space-y-3 text-sm">
              {/* Address */}
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-sky-400" />
                <span>{profile.address || "-"}</span>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-sky-400" />
                <span>{profile.mobile || "-"}</span>
              </div>

              {/* Email */}
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-sky-400" />
                <span>{profile.email || "-"}</span>
              </div>

              {/* Package */}
              <div className="flex items-center gap-3">
                <Wifi size={16} className="text-sky-400" />
                <span>{profile.package || "-"}</span>
              </div>

              {/* Package Price */}
              <div className="flex items-center gap-3">
                <DollarSign size={16} className="text-sky-400" />
                <span>
                  {profile.packagePrice != null
                    ? `PKR ${profile.packagePrice}`
                    : "-"}
                </span>
              </div>

              {/* Join Date */}
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-sky-400" />
                <span>
                  {profile.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString()
                    : "-"}
                </span>
              </div>
              {/* Actions buttons */}
              <div className="space-y-3">
                {/* Renew */}
                <button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded flex items-center justify-center gap-2"
                  onClick={handleRenew}
                >
                  <RefreshCw className="w-4 h-4" /> Renew
                </button>

                {/* Edit Profile */}
                <button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded flex items-center justify-center gap-2"
                  onClick={async () => {
                    // Load profiles BEFORE showing modal
                    await loadProfiles();

                    // Set existing values
                    setEditForm({
                      name: profile.name || "",
                      password: profile.passwordMasked || "",
                      mobile: profile.mobile || "",
                      email: profile.email || "",
                      address: profile.address || "",
                      city: profile.city || "",
                      area: profile.area || "",
                      package: profile.package || "",
                      packagePrice: profile.packagePrice || "",
                      dataLimitGB: profile.dataLimit
                        ? (Number(profile.dataLimit) / 1073741824).toFixed(0)
                        : "",
                    });

                    setPhotoFile(null);
                    setShowEditModal(true);
                  }}
                >
                  Edit Profile
                </button>
                <button
                  className={`w-full py-2 rounded flex items-center justify-center gap-2 
                  ${
                    profile.disabled
                      ? "bg-yellow-600 hover:bg-yellow-700"
                      : "bg-red-600 hover:bg-red-700"
                  } text-white`}
                  onClick={toggleNet}
                >
                  {profile.disabled ? (
                    <>
                      <ToggleRight className="w-4 h-4" /> Enable Net
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" /> Disable Net
                    </>
                  )}
                </button>

                {/* Delete Profile */}
                <button
                  className="w-full bg-red-700 hover:bg-red-800 text-white py-2 rounded flex items-center justify-center gap-2"
                  onClick={deleteProfile}
                >
                  <Trash2 className="w-4 h-4" /> Delete Profile
                </button>
              </div>
            </div>
          </div>

          {/* Reports placeholder */}
          {/* <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <FileText size={16} className="text-sky-400" />
              Reports (Coming Soon)
            </h2>
            <div className="text-xs text-gray-400">
              This section will show invoices, payments and usage history for
              this user. For now it’s a placeholder while we design the billing
              / reporting system.
            </div>
          </div> */}
        </div>

        {/* Right column: Service detail */}
        <div className="space-y-4">
          <div>
            <BandwidthGraph userId={profile.id} />
          </div>
          {/* ==================== SERVICE DETAIL ==================== */}
          <div className="bg-gray-800 p-5 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold mb-4 text-gray-200">
              Service Detail
            </h2>

            <div className="space-y-3 text-sm text-gray-300">
              {/* 1 - Connection Status */}
              <DetailRow
                icon={<Activity size={16} />}
                label="Connection Status"
                value={metrics?.online ? "Online" : "Offline"}
                valueClass={metrics?.online ? "text-green-400" : "text-red-400"}
              />

              {/* 2 - Online Uptime */}
              <DetailRow
                icon={<Clock size={16} />}
                label="Online Uptime"
                value={metrics?.uptime || "-"}
              />

              {/* 3 - Profile Status (FIXED) */}
              <DetailRow
                icon={<BadgeCheck size={16} />}
                label="Profile Status"
                value={(() => {
                   const isExpired = profile.expiryDate && new Date(profile.expiryDate) < new Date();
                   
                   if (profile.disabled) {
                     return isExpired ? "Expired" : "Disabled";
                   }
                   return "Active";
                })()}
                // Optional: Add color for better visibility
                valueClass={(() => {
                   const isExpired = profile.expiryDate && new Date(profile.expiryDate) < new Date();
                   
                   if (profile.disabled) {
                     return isExpired ? "text-orange-400" : "text-red-400";
                   }
                   return "text-emerald-400"; // Green
                })()}
              />

              {/* 4 - Connection Type */}
              <DetailRow
                icon={<Wifi size={16} />}
                label="Connection Type"
                value={profile.connection || "-"}
              />

              {/* 5 - Package */}
              <DetailRow
                icon={<Package size={16} />}
                label="Package"
                value={profile.package || "-"}
              />

              {/* 6 - Policy */}
              <DetailRow
                icon={<Shield size={16} />}
                label="Policy"
                value={metrics?.policy || "-"}
              />

              {/* 8 - Package Duration */}
              <DetailRow
                icon={<Clock size={16} />}
                label="Package Duration"
                value={metrics?.serviceDetails?.packageDuration || "1 Month"}
              />

              {/* 9 - Last Expiration Date */}
              {/* <DetailRow
                icon={<Calendar size={16} />}
                label="Last Expiration Date"
                value={metrics?.lastExpirationDate || "-"}
              /> */}

              {/* 10 - Expiration Date */}
              <DetailRow
                icon={<Calendar size={16} />}
                label="Expiration Date"
                value={profile.expiryDate ? new Date(profile.expiryDate).toLocaleDateString() : "-"}
              />

              {/* 11 Total Volume */}
              <DetailRow
                icon={<Gauge size={16} />}
                label="Total Volume"
                value={`${metrics?.totalVolumeGB ?? 0} GB`}
              />

              {/* 12 Used Volume */}
              <DetailRow
                icon={<Gauge size={16} />}
                label="Used Volume"
                value={`${metrics?.usedVolumeGB ?? 0} GB`}
              />

              {/* 13 Remaining Volume */}
              <DetailRow
                icon={<Gauge size={16} />}
                label="Remaining Volume"
                value={
                  metrics?.remainingVolumeGB != null
                    ? `${metrics.remainingVolumeGB} GB`
                    : "-"
                }
              />

              {/* 17 Last Activation Date */}
              {/* <DetailRow
                icon={<Calendar size={16} />}
                label="Last Activation Date"
                value={metrics?.lastActivationDate || "-"}
              /> */}

              {/* 18 Last Activation By */}
              <DetailRow
                icon={<UserCircle size={16} />}
                label="Last Activation By"
                value={profile.salesperson || "-"}
              />

              {/* 19 Salesperson */}
              <DetailRow
                icon={<UserCircle size={16} />}
                label="Salesperson"
                value={profile.salesperson || "-"}
              />

              {/* 20 Mac Address */}
              <DetailRow
                icon={<Cpu size={16} />}
                label="Mac Address"
                value={metrics?.mac || "-"}
              />

              {/* 21 Last Login */}
              <DetailRow
                icon={<Calendar size={16} />}
                label="Last Login"
                value={metrics?.lastLogin || "-"}
              />

              {/* 22 Connected IP */}
              <DetailRow
                icon={<Network size={16} />}
                label="Connected IP"
                value={metrics?.ip || "-"}
              />

              {/* 23 Connected MAC */}
              <DetailRow
                icon={<Cpu size={16} />}
                label="Connected MAC"
                value={metrics?.mac || "-"}
              />

              {/* 24 Connected NAS/Router */}
              <DetailRow
                icon={<Server size={16} />}
                label="Connected NAS/Router"
                value={metrics?.connectedNAS || "-"}
              />

              {/* 25 Connected Port */}
              <DetailRow
                icon={<Cable size={16} />}
                label="Connected Port"
                value={metrics?.connectedPort || "-"}
              />
            </div>
          </div>

          {/* ================= EDIT PROFILE MODAL ================= */}
          {showEditModal && profile && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-gray-900 text-white p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg font-semibold mb-4">Edit Profile</h2>

                {/* 2 column grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Profile Photo */}
                  <div className="col-span-2">
                    <p className="text-sm text-gray-400 mb-1">
                      Select Profile Photo
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      id="userPhotoUpload"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        setSelectedPhotoName(file.name);

                        const fd = new FormData();
                        fd.append("photo", file);

                        try {
                          const res = await api.post(
                            `/profile/${profile.id}/photo`,
                            fd,
                            {
                              headers: {
                                "Content-Type": "multipart/form-data",
                              },
                            }
                          );

                          // Update UI immediately (NO reload)
                          if (res.data?.photoUrl) {
                            setProfile((prev) => ({
                              ...prev,
                              photoUrl: res.data.photoUrl,
                            }));
                          }
                        } catch (err) {
                          console.error("Photo upload failed", err);
                          toast.error("Photo upload failed");
                        }
                      }}
                    />

                    <div className="flex items-center gap-3">
                      <label
                        htmlFor="userPhotoUpload"
                        className="px-3 py-1.5 rounded bg-gray-700 text-white cursor-pointer"
                      >
                        Choose image
                      </label>
                      {/* Selected file name */}
                      {selectedPhotoName && (
                        <span className="text-sm text-gray-400 truncate max-w-[200px]">
                          {selectedPhotoName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* NAME */}
                  <label className="text-sm">
                    Name
                    <input
                      className="w-full p-2 bg-gray-800 rounded mt-1"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                    />
                  </label>

                  {/* USERNAME (LOCKED) */}
                  <label className="text-sm">
                    Username
                    <input
                      readOnly
                      className="w-full p-2 bg-gray-800 rounded mt-1"
                      value={profile.username}
                    />
                  </label>

                  {/* PASSWORD */}
                  <label className="text-sm col-span-1 sm:col-span-2">
                    Password
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        className="w-full p-2 bg-gray-800 rounded"
                        type={showPass ? "text" : "password"}
                        value={editForm.password}
                        readOnly
                      />
                      <button
                        className="px-2 py-1 bg-gray-700 rounded shrink-0"
                        onClick={() => setShowPass(!showPass)}
                      >
                        {showPass ? "Hide" : "Show"}
                      </button>
                    </div>
                  </label>

                  {/* MOBILE */}
                  <label className="text-sm">
                    Mobile
                    <input
                      className="w-full p-2 bg-gray-800 rounded mt-1"
                      value={editForm.mobile}
                      onChange={(e) =>
                        setEditForm({ ...editForm, mobile: e.target.value })
                      }
                    />
                  </label>

                  {/* EMAIL */}
                  <label className="text-sm">
                    Email
                    <input
                      className="w-full p-2 bg-gray-800 rounded mt-1"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                    />
                  </label>

                  {/* ADDRESS */}
                  <label className="text-sm col-span-1 sm:col-span-2">
                    Address
                    <input
                      className="w-full p-2 bg-gray-800 rounded mt-1"
                      value={editForm.address}
                      onChange={(e) =>
                        setEditForm({ ...editForm, address: e.target.value })
                      }
                    />
                  </label>

                  {/* CITY */}
                  {/* <label className="text-sm">
                    City
                    <input
                      className="w-full p-2 bg-gray-800 rounded mt-1"
                      value={editForm.city}
                      onChange={(e) =>
                        setEditForm({ ...editForm, city: e.target.value })
                      }
                    />
                  </label> */}

                  {/* AREA */}
                  {/* <label className="text-sm">
                    Area
                    <input
                      className="w-full p-2 bg-gray-800 rounded mt-1"
                      value={editForm.area}
                      onChange={(e) =>
                        setEditForm({ ...editForm, area: e.target.value })
                      }
                    />
                  </label> */}

                  {/* PACKAGE */}
                  <label className="block text-sm">
                    Package
                    <select
                      className="w-full p-2 bg-gray-800 rounded mt-1"
                      value={editForm.package}
                      onChange={(e) =>
                        setEditForm({ ...editForm, package: e.target.value })
                      }
                    >
                      <option value="">Select Package</option>

                      {sortedPackages.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* PACKAGE PRICE */}
                  <label className="text-sm">
                    Package Price
                    <input
                      readOnly
                      className="w-full p-2 bg-gray-800 rounded mt-1"
                      value={editForm.packagePrice}
                    />
                  </label>

                  {/* DATA LIMIT (GB) */}
                  <label className="col-span-1 sm:col-span-2">
                    Data Limit (GB)
                    <input
                      type="number"
                      placeholder="e.g. 1000"
                      className="w-full p-2 bg-gray-800 rounded mt-1 border border-gray-700"
                      value={editForm.dataLimitGB}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          dataLimitGB: e.target.value,
                        })
                      }
                    />
                    <span className="text-xs text-gray-500">
                      Leave empty for unlimited
                    </span>
                  </label>
                </div>

                {/* BUTTONS */}
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    className="px-3 py-1 bg-gray-700 rounded"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>

                  <button
                    className="px-4 py-1 bg-teal-600 rounded"
                    onClick={handleSaveEdit}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Small reusable row component
function InfoRow({ label, value, icon }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-400 flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className="text-sm text-gray-200">{value}</span>
    </div>
  );
}

export default ProfilePage;
