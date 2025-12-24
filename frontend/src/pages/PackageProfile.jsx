import React from "react";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

export default function PackageProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    displayName: "",
    regularPrice: "",
    ispCost: "",
  });
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const res = await api.get(`/packages/${id}`);
        if (res.data.success) {
          setPkg(res.data.package);
          const p = res.data.package;
          setForm({
            displayName: p.displayName || "",
            regularPrice: p.regularPrice ?? "",
            ispCost: p.ispCost ?? "",
          });
          setIsDirty(false);
        }
      } catch (err) {
        console.error("Failed to fetch package", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPackage();
  }, [id]);

  if (loading) {
    return <div className="text-gray-400 px-4 py-6">Loading package...</div>;
  }

  if (!pkg) {
    return <div className="text-red-400 px-4 py-6">Package not found</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <button
            onClick={() => navigate("/allpackages")}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Packages
          </button>

          <h1 className="text-2xl font-semibold text-white">Package Profile</h1>

          <div className="inline-block mt-1 px-3 py-1 rounded bg-gray-700 text-sm text-white">
            {pkg.name}
          </div>
        </div>
      </div>

      {/* PACKAGE OVERVIEW */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Package Overview
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Info label="Display Name" value={pkg.displayName || "-"} />
          <Info label="Volume" value={pkg.name || "-"} />
          <Info label="Rate Limit" value={pkg.rateLimit || "-"} />
          <Info label="Regular Price" value={pkg.regularPrice || "-"} />
          <Info label="ISP Cost" value={pkg.ispCost || "-"} />
          <Info label="Users" value={pkg.usersCount || "-"} />
          <Info label="Active" value={pkg.activeCount || "-"} highlight />
          <Info
            label="Created At"
            value={new Date(pkg.createdAt).toLocaleDateString()}
          />
        </div>
      </div>

      {/* PRICING & DISPLAY */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Pricing & Display
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Display Name"
            value={form.displayName}
            onChange={(e) => {
              setForm({ ...form, displayName: e.target.value });
              setIsDirty(true);
            }}
          />

          <Input
            label="Regular Price"
            type="number"
            value={form.regularPrice}
            onChange={(e) => {
              setForm({ ...form, regularPrice: e.target.value });
              setIsDirty(true);
            }}
          />

          <Input
            label="ISP Cost"
            type="number"
            value={form.ispCost}
            onChange={(e) => {
              setForm({ ...form, ispCost: e.target.value });
              setIsDirty(true);
            }}
          />

          <Input
            label={pkg.name}
            placeholder={pkg.name}
            disabled
            helper="Volume cannot be changed once users are assigned."
          />
          <Input
            label={pkg.rateLimit}
            placeholder={pkg.rateLimit}
            disabled
            helper="Bandwidth profile is managed by MikroTik."
          />
        </div>

        <div className="mt-4 text-sm text-yellow-400">
          This package is currently in use by active users. Only pricing and
          display fields can be changed.
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => navigate("/allpackages")}
          className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
        >
          Cancel
        </button>

        <button
          disabled={!isDirty || saving}
          onClick={async () => {
            try {
              setSaving(true);
              await api.put(`/packages/${id}`, {
                displayName: form.displayName,
                regularPrice: Number(form.regularPrice),
                ispCost: Number(form.ispCost),
              });

              // Refresh data
              const res = await api.get(`/packages/${id}`);
              if (res.data.success) {
                setPkg(res.data.package);
                const p = res.data.package;
                setForm({
                  displayName: p.displayName || "",
                  regularPrice: p.regularPrice ?? "",
                  ispCost: p.ispCost ?? "",
                });
                setIsDirty(false);
              }

              alert("Package updated successfully");
            } catch (err) {
              console.error(err);
              alert("Failed to update package");
            } finally {
              setSaving(false);
            }
          }}
          className={`px-4 py-2 rounded text-white ${
            !isDirty || saving
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-500"
          }`}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

/* ---------- SMALL UI HELPERS ---------- */

function Info({ label, value, highlight }) {
  return (
    <div>
      <div className="text-sm text-gray-400">{label}</div>
      <div
        className={
          highlight ? "text-green-400 font-medium" : "text-white font-medium"
        }
      >
        {value}
      </div>
    </div>
  );
}

function Input({ label, helper, disabled, ...props }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <input
        {...props}
        disabled={disabled}
        className={`w-full px-3 py-2 rounded bg-gray-700 text-white outline-none ${
          disabled ? "opacity-60 cursor-not-allowed" : ""
        }`}
      />
      {helper && <div className="text-xs text-gray-400 mt-1">{helper}</div>}
    </div>
  );
}
