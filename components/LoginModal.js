// components/LoginModal.js
"use client";

import { useState } from "react";
import { Modal } from "./ui";
import { inputStyle, labelStyle, btnPrimary } from "../lib/theme";

export const LoginModal = ({ onClose, onLogin }) => {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState(false);

  const submit = async () => {
    const ok = await onLogin(email, pass);
    if (ok) onClose();
    else setErr(true);
  };

  return (
    <Modal title="เข้าสู่ระบบ Admin" onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>อีเมล Admin</label>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setErr(false); }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="admin@example.com"
          style={{ ...inputStyle, border: `1px solid ${err ? "#ef4444" : "rgba(167,139,250,0.2)"}` }}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>รหัสผ่าน Admin</label>
        <input
          type="password"
          value={pass}
          onChange={(e) => { setPass(e.target.value); setErr(false); }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="กรอกรหัสผ่าน"
          style={{ ...inputStyle, border: `1px solid ${err ? "#ef4444" : "rgba(167,139,250,0.2)"}` }}
        />
        {err && <div style={{ color: "#f87171", fontSize: 12, marginTop: 6 }}>อีเมลหรือรหัสผ่านไม่ถูกต้อง</div>}
      </div>
      <button onClick={submit} style={{ ...btnPrimary, width: "100%", padding: "12px" }}>เข้าสู่ระบบ</button>
    </Modal>
  );
};
