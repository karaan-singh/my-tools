import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

export default function Dropzone({ accept, onFile, title, subtitle, formats, limit }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const pick = (list) => {
    const file = list?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      className={`dropzone ${dragging ? "dragging" : ""}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        pick(e.dataTransfer.files);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
    >
      <div className="upload-icon">
        <UploadCloud size={30} />
      </div>
      <h3>{title}</h3>
      <p>
        {subtitle} or <span>browse files</span>
      </p>
      <div className="format-tags">
        {formats.map((f) => (
          <span key={f}>{f}</span>
        ))}
      </div>
      <small>{limit}</small>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={accept}
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
